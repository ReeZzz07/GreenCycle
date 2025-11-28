import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Sale, SaleStatus } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Client } from '../clients/entities/client.entity';
import { Batch } from '../shipments/entities/batch.entity';
import { FinanceService } from '../finance/finance.service';
import { Account } from '../finance/entities/account.entity';
import { Transaction, TransactionType, LinkedEntityType } from '../finance/entities/transaction.entity';
import { Buyback, BuybackStatus } from '../buybacks/entities/buyback.entity';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly financeService: FinanceService,
  ) {}

  async create(dto: CreateSaleDto, userId?: number, accountId?: number): Promise<Sale> {
    return this.dataSource.transaction(async (manager) => {
      const client = await manager.findOne(Client, {
        where: { id: dto.clientId },
      });

      if (!client) {
        throw new NotFoundException(`Клиент #${dto.clientId} не найден`);
      }

      let totalAmount = 0;

      for (const itemDto of dto.items) {
        const batch = await manager.findOne(Batch, {
          where: { id: itemDto.batchId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!batch) {
          throw new NotFoundException(
            `Партия #${itemDto.batchId} не найдена`,
          );
        }

        if (itemDto.quantity > batch.quantityCurrent) {
          throw new BadRequestException(
            `Недостаточно остатка для партии #${itemDto.batchId}. Доступно: ${batch.quantityCurrent}, запрошено: ${itemDto.quantity}`,
          );
        }

        batch.quantityCurrent -= itemDto.quantity;
        await manager.save(batch);

        const itemAmount = itemDto.quantity * itemDto.salePricePerUnit;
        totalAmount += itemAmount;
      }

      if (!client.firstPurchaseDate) {
        client.firstPurchaseDate = new Date(dto.saleDate);
        await manager.save(client);
      }

      const sale = manager.create(Sale, {
        clientId: client.id,
        client,
        saleDate: dto.saleDate,
        totalAmount: totalAmount.toFixed(2),
        status: SaleStatus.COMPLETED,
      });

      const savedSale = await manager.save(sale);

      for (const itemDto of dto.items) {
        const batch = await manager.findOne(Batch, {
          where: { id: itemDto.batchId },
        });

        if (!batch) {
          continue;
        }

        const saleItem = manager.create(SaleItem, {
          saleId: savedSale.id,
          sale: savedSale,
          batchId: batch.id,
          batch,
          quantity: itemDto.quantity,
          salePricePerUnit: itemDto.salePricePerUnit.toFixed(2),
        });

        await manager.save(saleItem);
      }

      // Создаём финансовую транзакцию для продажи
      if (userId) {
        let account: Account | null = null;

        if (accountId) {
          account = await manager.findOne(Account, {
            where: { id: accountId },
            lock: { mode: 'pessimistic_write' },
          });
        } else {
          // Используем первый доступный счёт по умолчанию
          account = await manager.findOne(Account, {
            order: { id: 'ASC' },
            lock: { mode: 'pessimistic_write' },
          });
        }

        if (account) {
          const transaction = manager.create(Transaction, {
            accountId: account.id,
            account,
            amount: totalAmount.toFixed(2),
            type: TransactionType.SALE,
            description: `Продажа #${savedSale.id} клиенту ${client.fullName}`,
            linkedEntityId: savedSale.id,
            linkedEntityType: LinkedEntityType.SALE,
            createdById: userId,
            updatedById: userId,
          });

          await manager.save(transaction);

          // Обновляем баланс счёта
          const currentBalance = Number(account.balance);
          const newBalance = currentBalance + totalAmount;
          account.balance = newBalance.toFixed(2);
          await manager.save(account);
        }
      }

      return await manager.findOne(Sale, {
        where: { id: savedSale.id },
        relations: ['client', 'items', 'items.batch'],
      }) as Sale;
    });
  }

  async findAll(): Promise<Sale[]> {
    return await this.saleRepository.find({
      relations: ['client', 'items', 'items.batch'],
      order: { saleDate: 'DESC', id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Sale & { transaction?: Transaction | null }> {
    const sale = await this.saleRepository.findOne({
      where: { id },
      relations: ['client', 'items', 'items.batch'],
    });

    if (!sale) {
      throw new NotFoundException(`Продажа #${id} не найдена`);
    }

    // Находим связанную транзакцию (активную или отмененную)
    const transaction = await this.transactionRepository.findOne({
      where: {
        linkedEntityId: sale.id,
        linkedEntityType: LinkedEntityType.SALE,
      },
      relations: ['account'],
      order: { id: 'ASC' }, // Берем первую (оригинальную) транзакцию
    });

    return { ...sale, transaction: transaction || null } as Sale & {
      transaction?: Transaction | null;
    };
  }

  async cancel(id: number, userId?: number): Promise<Sale> {
    return this.dataSource.transaction(async (manager) => {
      const sale = await manager.findOne(Sale, {
        where: { id },
        relations: ['items', 'items.batch', 'client'],
      });

      if (!sale) {
        throw new NotFoundException(`Продажа #${id} не найдена`);
      }

      if (sale.status === SaleStatus.CANCELLED) {
        throw new BadRequestException('Продажа уже отменена');
      }

      // Возвращаем остатки товаров на склад
      // Важно: возвращаем только если продажа была завершена (COMPLETED)
      // Если продажа была создана как CANCELLED, количество никогда не вычиталось
      if (sale.status === SaleStatus.COMPLETED) {
        for (const item of sale.items) {
          const batch = await manager.findOne(Batch, {
            where: { id: item.batchId },
            lock: { mode: 'pessimistic_write' },
          });

          if (batch) {
            // Возвращаем количество, но не превышаем начальное количество
            const maxReturnable = batch.quantityInitial - batch.quantityCurrent;
            const returnQuantity = Math.min(item.quantity, maxReturnable);
            batch.quantityCurrent += returnQuantity;
            
            // Проверяем, что не превысили начальное количество
            if (batch.quantityCurrent > batch.quantityInitial) {
              batch.quantityCurrent = batch.quantityInitial;
            }
            
            await manager.save(batch);
          }
        }
      }

      // Обрабатываем финансовые транзакции
      if (userId) {
        // Находим транзакцию, связанную с этой продажей (игнорируем уже отмененные)
        const originalTransaction = await manager.findOne(Transaction, {
          where: {
            linkedEntityId: sale.id,
            linkedEntityType: LinkedEntityType.SALE,
            isCancelled: false,
          },
          relations: ['account'],
          order: { id: 'ASC' }, // Берем первую (оригинальную) транзакцию
        });

        if (originalTransaction && originalTransaction.account) {
          const account = await manager.findOne(Account, {
            where: { id: originalTransaction.accountId },
            lock: { mode: 'pessimistic_write' },
          });

          if (account) {
            const saleAmount = Number(sale.totalAmount);

            // Помечаем оригинальную транзакцию как отмененную
            originalTransaction.isCancelled = true;
            originalTransaction.updatedById = userId;
            await manager.save(originalTransaction);

            // Создаём обратную транзакцию для отмены продажи
            const reversalTransaction = manager.create(Transaction, {
              accountId: account.id,
              account,
              amount: (-saleAmount).toFixed(2), // Отрицательная сумма для списания
              type: TransactionType.SALE,
              description: `Отмена продажи #${sale.id} клиенту ${sale.client.fullName}`,
              linkedEntityId: sale.id,
              linkedEntityType: LinkedEntityType.SALE,
              isCancelled: false,
              createdById: userId,
              updatedById: userId,
            });

            await manager.save(reversalTransaction);

            // Обновляем баланс счёта (вычитаем сумму продажи)
            const currentBalance = Number(account.balance);
            const newBalance = currentBalance - saleAmount;
            account.balance = Math.max(0, newBalance).toFixed(2); // Не допускаем отрицательный баланс
            await manager.save(account);
          }
        }
      }

      sale.status = SaleStatus.CANCELLED;
      const savedSale = await manager.save(sale);

      return await manager.findOne(Sale, {
        where: { id: savedSale.id },
        relations: ['client', 'items', 'items.batch'],
      }) as Sale;
    });
  }

  async updateStatus(
    id: number,
    status: SaleStatus,
    userId?: number,
  ): Promise<Sale & { transaction?: Transaction | null }> {
    return this.dataSource.transaction(async (manager) => {
      const sale = await manager.findOne(Sale, {
        where: { id },
        relations: ['items', 'items.batch', 'client'],
      });

      if (!sale) {
        throw new NotFoundException(`Продажа #${id} не найдена`);
      }

      if (sale.status === status) {
        throw new BadRequestException(`Продажа уже имеет статус "${status}"`);
      }

      const previousStatus = sale.status;

      if (status === SaleStatus.COMPLETED && previousStatus === SaleStatus.CANCELLED) {
        // Изменение статуса с "отменена" на "завершена"
        // Уменьшаем остатки товаров на склад (количество было возвращено при отмене)
        for (const item of sale.items) {
          const batch = await manager.findOne(Batch, {
            where: { id: item.batchId },
            lock: { mode: 'pessimistic_write' },
          });

          if (!batch) {
            throw new NotFoundException(
              `Партия #${item.batchId} не найдена для товара в продаже #${sale.id}`,
            );
          }

          // Проверяем, что есть достаточно остатка
          if (item.quantity > batch.quantityCurrent) {
            throw new BadRequestException(
              `Недостаточно остатка для партии #${item.batchId}. Доступно: ${batch.quantityCurrent}, требуется: ${item.quantity}`,
            );
          }
          
          // Вычитаем количество из текущего остатка
          batch.quantityCurrent -= item.quantity;
          
          // Проверяем, что текущее количество не стало отрицательным
          if (batch.quantityCurrent < 0) {
            batch.quantityCurrent = 0;
          }
          
          await manager.save(batch);
        }

        // Создаём финансовую транзакцию для продажи
        if (userId) {
          let account: Account | null = null;
          const saleAmount = Number(sale.totalAmount);

          // Находим все транзакции, связанные с этой продажей
          const allTransactions = await manager.find(Transaction, {
            where: {
              linkedEntityId: sale.id,
              linkedEntityType: LinkedEntityType.SALE,
            },
            relations: ['account'],
            order: { id: 'ASC' },
          });

          // Находим оригинальную отмененную транзакцию (положительная сумма)
          const cancelledTransaction = allTransactions.find(
            (t) => t.isCancelled && Number(t.amount) > 0,
          );

          // Находим обратную транзакцию (отрицательная сумма)
          const reversalTransaction = allTransactions.find((t) => Number(t.amount) < 0);

          if (cancelledTransaction && cancelledTransaction.accountId) {
            // Используем тот же счет, что и в отмененной транзакции
            account = await manager.findOne(Account, {
              where: { id: cancelledTransaction.accountId },
              lock: { mode: 'pessimistic_write' },
            });

            if (!account) {
              throw new NotFoundException(
                `Счёт #${cancelledTransaction.accountId} для транзакции не найден`,
              );
            }

            // Восстанавливаем отмененную транзакцию
            cancelledTransaction.isCancelled = false;
            cancelledTransaction.updatedById = userId;
            await manager.save(cancelledTransaction);

            // Удаляем обратную транзакцию (отрицательную), если она существует
            if (reversalTransaction && Number(reversalTransaction.amount) < 0) {
              await manager.remove(reversalTransaction);
            }

            // Пересчитываем баланс с учетом только неотмененных транзакций
            const result = await manager
              .createQueryBuilder(Transaction, 't')
              .select('COALESCE(SUM(t.amount::numeric), 0)', 'balance')
              .where('t.accountId = :accountId', { accountId: account.id })
              .andWhere('t.isCancelled = :isCancelled', { isCancelled: false })
              .getRawOne<{ balance: string }>();

            account.balance = (result?.balance ?? '0.00');
            await manager.save(account);
          } else {
            // Если транзакции не найдены, создаем новую
            // Ищем первый доступный счёт
            account = await manager.findOne(Account, {
              order: { id: 'ASC' },
              lock: { mode: 'pessimistic_write' },
            });

            if (!account) {
              throw new NotFoundException(
                'Не найден счёт для создания транзакции. Сначала создайте хотя бы один счёт.',
              );
            }

            // Создаём новую транзакцию
            const transaction = manager.create(Transaction, {
              accountId: account.id,
              account,
              amount: saleAmount.toFixed(2),
              type: TransactionType.SALE,
              description: `Продажа #${sale.id} клиенту ${sale.client.fullName}`,
              linkedEntityId: sale.id,
              linkedEntityType: LinkedEntityType.SALE,
              isCancelled: false,
              createdById: userId,
              updatedById: userId,
            });

            await manager.save(transaction);

            // Пересчитываем баланс с учетом только неотмененных транзакций
            const result = await manager
              .createQueryBuilder(Transaction, 't')
              .select('COALESCE(SUM(t.amount::numeric), 0)', 'balance')
              .where('t.accountId = :accountId', { accountId: account.id })
              .andWhere('t.isCancelled = :isCancelled', { isCancelled: false })
              .getRawOne<{ balance: string }>();

            account.balance = (result?.balance ?? '0.00');
            await manager.save(account);
          }
        }
      } else if (status === SaleStatus.CANCELLED && previousStatus === SaleStatus.COMPLETED) {
        // Изменение статуса с "завершена" на "отменена" - используем существующий метод cancel
        return this.cancel(id, userId);
      }

      sale.status = status;
      const savedSale = await manager.save(sale);

      // Загружаем связанную транзакцию (первую активную)
      const transaction = await manager.findOne(Transaction, {
        where: {
          linkedEntityId: savedSale.id,
          linkedEntityType: LinkedEntityType.SALE,
          isCancelled: false,
        },
        relations: ['account'],
        order: { id: 'ASC' },
      });

      const saleWithRelations = await manager.findOne(Sale, {
        where: { id: savedSale.id },
        relations: ['client', 'items', 'items.batch'],
      });

      if (!saleWithRelations) {
        throw new NotFoundException(`Не удалось загрузить продажу #${savedSale.id} после обновления`);
      }

      return {
        ...saleWithRelations,
        transaction: transaction || null,
      };
    });
  }

  async remove(id: number, userRole?: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const sale = await manager.findOne(Sale, {
        where: { id },
        relations: ['items'],
      });

      if (!sale) {
        throw new NotFoundException(`Продажа #${id} не найдена`);
      }

      // Проверяем, что продажа отменена
      if (sale.status !== SaleStatus.CANCELLED) {
        throw new BadRequestException(
          'Нельзя удалить продажу, которая не отменена. Сначала отмените продажу.',
        );
      }

      // Проверяем роль пользователя для удаления отмененных продаж
      const isAdmin = userRole === 'admin' || userRole === 'super_admin';
      if (!isAdmin) {
        throw new BadRequestException(
          'Нельзя удалить отмененную продажу. Только администратор может удалить такие продажи.',
        );
      }

      // Находим все связанные транзакции
      const relatedTransactions = await manager.find(Transaction, {
        where: {
          linkedEntityId: sale.id,
          linkedEntityType: LinkedEntityType.SALE,
        },
      });

      // Удаляем связанные транзакции и пересчитываем баланс счетов
      if (relatedTransactions.length > 0) {
        const accountIds = new Set<number>();

        // Собираем уникальные ID счетов
        for (const transaction of relatedTransactions) {
          if (transaction.accountId) {
            accountIds.add(transaction.accountId);
          }
        }

        // Удаляем транзакции
        await manager.remove(relatedTransactions);

        // Пересчитываем баланс для каждого счета
        for (const accountId of accountIds) {
          const account = await manager.findOne(Account, {
            where: { id: accountId },
            lock: { mode: 'pessimistic_write' },
          });

          if (account) {
            const result = await manager
              .createQueryBuilder(Transaction, 't')
              .select('COALESCE(SUM(t.amount::numeric), 0)', 'balance')
              .where('t.accountId = :accountId', { accountId: account.id })
              .andWhere('t.isCancelled = :isCancelled', { isCancelled: false })
              .getRawOne<{ balance: string }>();

            account.balance = (result?.balance ?? '0.00');
            await manager.save(account);
          }
        }
      }

      // НЕ возвращаем остатки товаров на склад при удалении,
      // потому что если продажа отменена, количество уже было возвращено при отмене (метод cancel)
      // Если продажа не была отменена, она не может быть удалена (проверка выше)

      // Находим и удаляем связанные отмененные выкупы перед удалением продажи
      const relatedBuybacks = await manager.find(Buyback, {
        where: { originalSaleId: sale.id },
      });

      if (relatedBuybacks.length > 0) {
        const declinedBuybacks = relatedBuybacks.filter(
          (buyback) => buyback.status === BuybackStatus.DECLINED,
        );
        if (declinedBuybacks.length > 0) {
          await manager.remove(declinedBuybacks);
        }
      }

      // Удаляем продажу (SaleItem удалятся каскадно благодаря onDelete: 'CASCADE')
      await manager.remove(sale);
    });
  }
}
