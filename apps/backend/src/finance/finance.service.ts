import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { Transaction, TransactionType, LinkedEntityType } from './entities/transaction.entity';
import { PartnerWithdrawal, PartnerWithdrawalType } from './entities/partner-withdrawal.entity';
import { OtherExpense } from './entities/other-expense.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreatePartnerWithdrawalDto } from './dto/create-partner-withdrawal.dto';
import { CreateOtherExpenseDto } from './dto/create-other-expense.dto';
import { UpdateOtherExpenseDto } from './dto/update-other-expense.dto';
import { User } from '../users/entities/user.entity';
import { Sale, SaleStatus } from '../sales/entities/sale.entity';
import { Shipment } from '../shipments/entities/shipment.entity';
import { Batch } from '../shipments/entities/batch.entity';
import { ShipmentInvestment } from '../shipments/entities/shipment-investment.entity';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(PartnerWithdrawal)
    private readonly partnerWithdrawalRepository: Repository<PartnerWithdrawal>,
    @InjectRepository(OtherExpense)
    private readonly otherExpenseRepository: Repository<OtherExpense>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
    @InjectRepository(ShipmentInvestment)
    private readonly shipmentInvestmentRepository: Repository<ShipmentInvestment>,
  ) {}

  // Accounts
  async createAccount(dto: CreateAccountDto): Promise<Account> {
    const existingAccount = await this.accountRepository.findOne({
      where: { name: dto.name },
    });

    if (existingAccount) {
      throw new BadRequestException(`Счёт с именем "${dto.name}" уже существует`);
    }

    const account = this.accountRepository.create({
      name: dto.name.trim(),
      type: dto.type,
      balance: '0.00',
    });

    return await this.accountRepository.save(account);
  }

  async findAllAccounts(): Promise<Account[]> {
    return await this.accountRepository.find({
      relations: ['transactions'],
      order: { name: 'ASC' },
    });
  }

  async findOneAccount(id: number): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id },
      relations: ['transactions'],
    });

    if (!account) {
      throw new NotFoundException(`Счёт #${id} не найден`);
    }

    return account;
  }

  async updateAccount(id: number, dto: UpdateAccountDto): Promise<Account> {
    const account = await this.findOneAccount(id);

    if (dto.name !== undefined) {
      const existingAccount = await this.accountRepository.findOne({
        where: { name: dto.name },
      });

      if (existingAccount && existingAccount.id !== id) {
        throw new BadRequestException(
          `Счёт с именем "${dto.name}" уже существует`,
        );
      }

      account.name = dto.name.trim();
    }

    if (dto.type !== undefined) {
      account.type = dto.type;
    }

    return await this.accountRepository.save(account);
  }

  async removeAccount(id: number): Promise<void> {
    const account = await this.findOneAccount(id);
    const transactions = await this.transactionRepository.count({
      where: { accountId: id },
    });

    if (transactions > 0) {
      throw new BadRequestException(
        'Нельзя удалить счёт с транзакциями. Сначала удалите все транзакции.',
      );
    }

    await this.accountRepository.remove(account);
  }

  async recalculateAccountBalance(accountId: number): Promise<string> {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('COALESCE(SUM(transaction.amount::numeric), 0)', 'balance')
      .where('transaction.accountId = :accountId', { accountId })
      .andWhere('transaction.isCancelled = :isCancelled', { isCancelled: false })
      .getRawOne<{ balance: string }>();

    const balance = result?.balance ?? '0.00';
    const account = await this.findOneAccount(accountId);
    account.balance = balance;
    await this.accountRepository.save(account);

    return balance;
  }

  // Transactions
  async createTransaction(dto: CreateTransactionDto, userId: number): Promise<Transaction> {
    return this.dataSource.transaction(async (manager) => {
      const account = await manager.findOne(Account, {
        where: { id: dto.accountId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!account) {
        throw new NotFoundException(`Счёт #${dto.accountId} не найден`);
      }

      const transaction = manager.create(Transaction, {
        accountId: account.id,
        account,
        amount: dto.amount.toFixed(2),
        type: dto.type,
        description: dto.description?.trim() ?? null,
        linkedEntityId: dto.linkedEntityId ?? null,
        linkedEntityType: dto.linkedEntityType ?? null,
        isCancelled: false,
        createdById: userId,
        updatedById: userId,
      });

      const savedTransaction = await manager.save(transaction);

      // Пересчитываем баланс с учетом только неотмененных транзакций
      const result = await manager
        .createQueryBuilder(Transaction, 'transaction')
        .select('COALESCE(SUM(transaction.amount::numeric), 0)', 'balance')
        .where('transaction.accountId = :accountId', { accountId: account.id })
        .andWhere('transaction.isCancelled = :isCancelled', { isCancelled: false })
        .getRawOne<{ balance: string }>();

      const newBalance = result?.balance ?? '0.00';
      account.balance = newBalance;
      await manager.save(account);

      return savedTransaction;
    });
  }

  async findAllTransactions(accountId?: number): Promise<Transaction[]> {
    const where = accountId ? { accountId } : {};
    return await this.transactionRepository.find({
      where,
      relations: ['account'],
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }

  async findOneTransaction(id: number): Promise<Transaction & { sale?: Sale | null }> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['account'],
    });

    if (!transaction) {
      throw new NotFoundException(`Транзакция #${id} не найдена`);
    }

    // Если транзакция связана с продажей, загружаем информацию о продаже
    if (
      transaction.linkedEntityId &&
      transaction.linkedEntityType === LinkedEntityType.SALE
    ) {
      const saleRepo = this.dataSource.getRepository(Sale);
      const sale = await saleRepo.findOne({
        where: { id: transaction.linkedEntityId },
        relations: ['client', 'items', 'items.batch'],
      });

      return Object.assign(transaction, { sale: sale || null }) as Transaction & {
        sale?: Sale | null;
      };
    }

    return Object.assign(transaction, { sale: null }) as Transaction & {
      sale?: Sale | null;
    };
  }

  async updateTransactionStatus(
    id: number,
    isCancelled: boolean,
    userId: number,
  ): Promise<Transaction> {
    return this.dataSource.transaction(async (manager) => {
      const transaction = await manager.findOne(Transaction, {
        where: { id },
        relations: ['account'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!transaction) {
        throw new NotFoundException(`Транзакция #${id} не найдена`);
      }

      if (!transaction.accountId) {
        throw new BadRequestException('Транзакция не привязана к счёту');
      }

      const account = await manager.findOne(Account, {
        where: { id: transaction.accountId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!account) {
        throw new NotFoundException(
          `Счёт #${transaction.accountId} для транзакции не найден`,
        );
      }

      // Сохраняем старое состояние для пересчета баланса
      const oldIsCancelled = transaction.isCancelled;

      // Обновляем статус транзакции
      transaction.isCancelled = isCancelled;
      transaction.updatedById = userId;
      await manager.save(transaction);

      // Пересчитываем баланс с учетом только неотмененных транзакций
      // Это нужно только если статус изменился
      if (oldIsCancelled !== isCancelled) {
        const result = await manager
          .createQueryBuilder(Transaction, 't')
          .select('COALESCE(SUM(t.amount::numeric), 0)', 'balance')
          .where('t.accountId = :accountId', { accountId: account.id })
          .andWhere('t.isCancelled = :isCancelled', { isCancelled: false })
          .getRawOne<{ balance: string }>();

        account.balance = (result?.balance ?? '0.00');
        await manager.save(account);
      }

      return transaction;
    });
  }

  async removeTransaction(id: number): Promise<{ cancelled?: boolean }> {
    return this.dataSource.transaction(async (manager) => {
      // Используем query builder, чтобы избежать проблем с FOR UPDATE и LEFT JOIN из-за eager loading
      const transaction = await manager
        .createQueryBuilder(Transaction, 'transaction')
        .where('transaction.id = :id', { id })
        .setLock('pessimistic_write')
        .getOne();

      if (!transaction) {
        throw new NotFoundException(`Транзакция #${id} не найдена`);
      }

      if (!transaction.accountId) {
        throw new BadRequestException('Транзакция не привязана к счёту');
      }

      // Загружаем account отдельно с блокировкой
      const account = await manager.findOne(Account, {
        where: { id: transaction.accountId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!account) {
        throw new NotFoundException(
          `Счёт #${transaction.accountId} для транзакции не найден`,
        );
      }

      // Загружаем account в transaction для дальнейшего использования (если нужно)
      transaction.account = account;

      // Проверяем, не связана ли транзакция с активной продажей
      // Транзакции, не связанные с продажами, удаляются без проверок
      // Условие: транзакция должна быть связана с продажей (linkedEntityType === SALE и linkedEntityId !== null)
      // и должна быть активной (не отменена)
      const isLinkedToSale =
        transaction.linkedEntityId !== null &&
        transaction.linkedEntityType === LinkedEntityType.SALE;

      if (isLinkedToSale && !transaction.isCancelled && transaction.linkedEntityId !== null) {
        try {
          // Проверяем, не отменена ли продажа
          const saleRepo = manager.getRepository(Sale);
          const sale = await saleRepo.findOne({
            where: { id: transaction.linkedEntityId },
          });

          if (sale) {
            if (sale.status === SaleStatus.CANCELLED) {
              // Продажа отменена, но транзакция не помечена - синхронизируем состояние
              // Помечаем транзакцию как отмененную вместо удаления
              transaction.isCancelled = true;
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

              // Не удаляем транзакцию, а возвращаемся с флагом
              return { cancelled: true };
            } else {
              // Продажа активна - запрещаем удаление
              throw new BadRequestException(
                'Нельзя удалить транзакцию, связанную с активной продажей. Сначала отмените продажу.',
              );
            }
          }
          // Если продажа не найдена, возможно она была удалена - разрешаем удаление транзакции
        } catch (error) {
          // Если ошибка уже BadRequestException, пробрасываем её дальше
          if (error instanceof BadRequestException) {
            throw error;
          }
          // В остальных случаях логируем и разрешаем удаление (продажа может быть удалена)
          this.logger.warn(
            `Ошибка при проверке продажи #${transaction.linkedEntityId} для транзакции #${transaction.id}:`,
            error,
          );
        }
      }

      // Все транзакции, которые не связаны с активными продажами, можно удалять:
      // - Транзакции без linkedEntityId (linkedEntityId === null)
      // - Транзакции с другим linkedEntityType (не SALE)
      // - Транзакции, связанные с продажами, но уже помеченные как отмененные
      // - Транзакции, связанные с отмененными продажами (синхронизация уже выполнена выше)

      // Сохраняем ID транзакции и суммы для пересчета баланса
      const transactionAmount = Number(transaction.amount || 0);
      const transactionId = transaction.id;

      // Удаляем транзакцию
      await manager.remove(transaction);

      // Пересчитываем баланс с учетом только неотмененных транзакций
      try {
        const result = await manager
          .createQueryBuilder(Transaction, 't')
          .select('COALESCE(SUM(t.amount::numeric), 0)', 'balance')
          .where('t.accountId = :accountId', { accountId: account.id })
          .andWhere('t.isCancelled = :isCancelled', { isCancelled: false })
          .getRawOne<{ balance: string }>();

        account.balance = (result?.balance ?? '0.00');
        await manager.save(account);
      } catch (error) {
        this.logger.error(
          `Ошибка при пересчете баланса для счета #${account.id} после удаления транзакции #${transactionId}:`,
          error,
        );
        // Пересчитываем баланс вручную, вычитая сумму удаленной транзакции
        const currentBalance = Number(account.balance || 0);
        const newBalance = currentBalance - transactionAmount;
        account.balance = Math.max(0, newBalance).toFixed(2);
        await manager.save(account);
      }

      return { cancelled: false };
    });
  }

  // Partner Withdrawals
  async createPartnerWithdrawal(
    dto: CreatePartnerWithdrawalDto,
    userId: number,
  ): Promise<PartnerWithdrawal> {
    return this.dataSource.transaction(async (manager) => {
      // Если userId не указан в DTO, используем текущего пользователя
      const withdrawalUserId = dto.userId ?? userId;
      
      const user = await manager.findOne(User, {
        where: { id: withdrawalUserId },
        relations: ['role'],
      });

      if (!user) {
        throw new NotFoundException(`Пользователь #${withdrawalUserId} не найден`);
      }

      const roleName = user.role?.name;
      if (roleName !== 'admin' && roleName !== 'super_admin') {
        throw new BadRequestException(
          'Изъятие могут делать только администраторы',
        );
      }

      // Для изъятий типа "товар" проверяем наличие поставки и рассчитываем стоимость
      let calculatedCostValue: number | null = dto.costValue ?? null;
      let shipment: Shipment | null = null;

      if (dto.type === PartnerWithdrawalType.GOODS) {
        try {
          if (!dto.shipmentId) {
            throw new BadRequestException(
              'Для изъятия типа "товар" необходимо указать поставку',
            );
          }

          this.logger.debug(`Создание изъятия товара для поставки #${dto.shipmentId}, количество: ${dto.amountOrQuantity}`);

          shipment = await manager.findOne(Shipment, {
            where: { id: dto.shipmentId },
            relations: ['batches', 'investments', 'investments.user'],
          });

          if (!shipment) {
            throw new NotFoundException(`Поставка #${dto.shipmentId} не найдена`);
          }

          // Рассчитываем среднюю себестоимость на единицу товара
          const totalQuantity = shipment.batches.reduce(
            (sum, batch) => sum + batch.quantityInitial,
            0,
          );

          if (totalQuantity === 0) {
            throw new BadRequestException(
              'В выбранной поставке нет товаров (количество = 0)',
            );
          }

          // Проверяем, что изымаемое количество не превышает доступное
          if (dto.amountOrQuantity > totalQuantity) {
            throw new BadRequestException(
              `Нельзя изъять ${dto.amountOrQuantity} единиц товара. В поставке доступно только ${totalQuantity} единиц`,
            );
          }

          const shipmentTotalCost = Number(shipment.totalCost);
          if (isNaN(shipmentTotalCost) || shipmentTotalCost <= 0) {
            throw new BadRequestException(
              `Некорректная стоимость поставки: ${shipment.totalCost}`,
            );
          }

          const costPerUnit = shipmentTotalCost / totalQuantity;
          calculatedCostValue = dto.amountOrQuantity * costPerUnit;

          if (isNaN(calculatedCostValue) || calculatedCostValue < 0) {
            throw new BadRequestException(
              `Некорректная рассчитанная стоимость изъятия: ${calculatedCostValue}`,
            );
          }

          this.logger.debug(`Рассчитанная стоимость изъятия: ${calculatedCostValue}, себестоимость за единицу: ${costPerUnit}`);

          // Уменьшаем количество товара в партиях пропорционально
          const withdrawalQuantity = dto.amountOrQuantity;
          let totalWithdrawn = 0;
          
          // Проверяем, что есть партии для обработки
          if (!shipment.batches || shipment.batches.length === 0) {
            throw new BadRequestException('В выбранной поставке нет партий товара');
          }
          
          // Сортируем партии по убыванию количества для более точного распределения
          const sortedBatches = [...shipment.batches].sort((a, b) => b.quantityInitial - a.quantityInitial);
          
          for (let i = 0; i < sortedBatches.length; i++) {
            const batchFromArray = sortedBatches[i];
            const batchProportion = batchFromArray.quantityInitial / totalQuantity;
            let quantityToWithdraw: number;
            
            // Для последней партии используем остаток, чтобы не потерять единицы
            if (i === sortedBatches.length - 1) {
              quantityToWithdraw = withdrawalQuantity - totalWithdrawn;
            } else {
              quantityToWithdraw = Math.floor(withdrawalQuantity * batchProportion);
            }
            
            if (quantityToWithdraw > 0 && batchFromArray.quantityInitial > 0) {
              const actualWithdraw = Math.min(quantityToWithdraw, batchFromArray.quantityInitial);
              
              // Перезагружаем batch через manager для корректной работы с транзакцией
              const batch = await manager.findOne(Batch, {
                where: { id: batchFromArray.id },
              });
              
              if (!batch) {
                throw new NotFoundException(`Партия #${batchFromArray.id} не найдена`);
              }
              
              batch.quantityInitial = Math.max(0, batch.quantityInitial - actualWithdraw);
              batch.quantityCurrent = Math.max(0, batch.quantityCurrent - actualWithdraw);
              totalWithdrawn += actualWithdraw;
              await manager.save(batch);
            }
          }

          // Уменьшаем общую стоимость поставки
          // Перезагружаем shipment через manager для корректной работы с транзакцией
          const shipmentToUpdate = await manager.findOne(Shipment, {
            where: { id: shipment.id },
          });

          if (!shipmentToUpdate) {
            throw new NotFoundException(`Поставка #${shipment.id} не найдена`);
          }

          const shipmentTotalCostNum = Number(shipmentToUpdate.totalCost);
          if (isNaN(shipmentTotalCostNum)) {
            throw new BadRequestException(
              `Некорректная стоимость поставки для обновления: ${shipmentToUpdate.totalCost}`,
            );
          }

          if (calculatedCostValue === null || isNaN(calculatedCostValue)) {
            throw new BadRequestException(
              `Некорректная стоимость изъятия: ${calculatedCostValue}`,
            );
          }

          const newTotalCost = Math.max(0, shipmentTotalCostNum - calculatedCostValue);
          shipmentToUpdate.totalCost = newTotalCost.toFixed(2);
          await manager.save(shipmentToUpdate);
          
          // Обновляем ссылку на shipment для дальнейшего использования
          shipment.totalCost = shipmentToUpdate.totalCost;

          // Уменьшаем долю вкладчика и пересчитываем проценты для всех вкладчиков
          if (shipment.investments && shipment.investments.length > 0) {
            // Находим вложение для данного вкладчика
            const userInvestment = shipment.investments.find(
              (inv) => inv.userId === withdrawalUserId,
            );

            if (userInvestment) {
              // Перезагружаем investment через manager для корректной работы с транзакцией
              const investmentToUpdate = await manager.findOne(ShipmentInvestment, {
                where: { id: userInvestment.id },
              });

              if (investmentToUpdate) {
                // Уменьшаем сумму вложения вкладчика
                if (calculatedCostValue === null || isNaN(calculatedCostValue)) {
                  throw new BadRequestException(
                    `Некорректная стоимость изъятия для обновления вложения: ${calculatedCostValue}`,
                  );
                }
                const investmentAmountNum = Number(investmentToUpdate.amount);
                if (isNaN(investmentAmountNum)) {
                  this.logger.warn(`Некорректная сумма вложения: ${investmentToUpdate.amount}, пропускаем обновление`);
                } else {
                  const newInvestmentAmount = Math.max(
                    0,
                    investmentAmountNum - calculatedCostValue,
                  );
                  investmentToUpdate.amount = newInvestmentAmount.toFixed(2);
                  await manager.save(investmentToUpdate);
                }
              }
            }

            // Пересчитываем проценты для всех вкладчиков
            // Используем обновленную стоимость поставки
            const newTotalCostNum = Number(shipmentToUpdate.totalCost);
            
            if (isNaN(newTotalCostNum)) {
              this.logger.warn(`Некорректная общая стоимость поставки: ${shipmentToUpdate.totalCost}, пропускаем пересчет процентов`);
            } else {
              // Перезагружаем все investments через manager
              const allInvestments = await manager.find(ShipmentInvestment, {
                where: { shipmentId: shipment.id },
              });

              if (newTotalCostNum > 0) {
                for (const investment of allInvestments) {
                  const investmentAmountNum = Number(investment.amount);
                  if (isNaN(investmentAmountNum)) {
                    this.logger.warn(`Некорректная сумма вложения: ${investment.amount}, пропускаем пересчет процента`);
                    continue;
                  }
                  const newPercentage = (investmentAmountNum / newTotalCostNum) * 100;
                  if (isNaN(newPercentage)) {
                    this.logger.warn(`Некорректный процент: ${newPercentage}, пропускаем сохранение`);
                    continue;
                  }
                  investment.percentage = newPercentage.toFixed(2);
                  await manager.save(investment);
                }
              } else {
                // Если общая стоимость стала 0, обнуляем проценты всех вкладчиков
                const allInvestments = await manager.find(ShipmentInvestment, {
                  where: { shipmentId: shipment.id },
                });
                for (const investment of allInvestments) {
                  investment.percentage = '0.00';
                  await manager.save(investment);
                }
              }
            }
          }
        } catch (error) {
          this.logger.error(`Ошибка при обработке изъятия товара: ${error.message}`, error.stack);
          throw error;
        }
      }

      let account: Account | null = null;
      if (dto.type === PartnerWithdrawalType.CASH && dto.accountId) {
        account = await manager.findOne(Account, {
          where: { id: dto.accountId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!account) {
          throw new NotFoundException(`Счёт #${dto.accountId} не найден`);
        }
      }

      const withdrawal = manager.create(PartnerWithdrawal, {
        userId: user.id,
        user,
        type: dto.type,
        amountOrQuantity: dto.amountOrQuantity.toFixed(2),
        costValue: calculatedCostValue?.toFixed(2) ?? null,
        reason: dto.reason?.trim() ?? null,
        withdrawalDate: dto.withdrawalDate ? new Date(dto.withdrawalDate) : null,
        shipmentId: dto.shipmentId ?? null,
        shipment: shipment,
        accountId: account?.id ?? null,
        account: account,
        createdById: userId,
        updatedById: userId,
      });

      const savedWithdrawal = await manager.save(withdrawal);

      // Для изъятий типа "Деньги" всегда создаем транзакцию, если указан счет
      if (dto.type === PartnerWithdrawalType.CASH && account) {
        // Создаем транзакцию для изъятия
        const transaction = manager.create(Transaction, {
          accountId: account.id,
          account,
          amount: (-dto.amountOrQuantity).toFixed(2),
          type: TransactionType.PARTNER_WITHDRAWAL,
          description: `Изъятие партнёра: ${user.fullName}${dto.reason ? ` - ${dto.reason}` : ''}`,
          linkedEntityId: savedWithdrawal.id,
          linkedEntityType: LinkedEntityType.PARTNER_WITHDRAWAL,
          isCancelled: false,
          createdById: userId,
          updatedById: userId,
        });

        await manager.save(transaction);

        // Пересчитываем баланс с учетом всех неотмененных транзакций
        const result = await manager
          .createQueryBuilder(Transaction, 't')
          .select('COALESCE(SUM(t.amount::numeric), 0)', 'balance')
          .where('t.accountId = :accountId', { accountId: account.id })
          .andWhere('t.isCancelled = :isCancelled', { isCancelled: false })
          .getRawOne<{ balance: string }>();

        account.balance = (result?.balance ?? '0.00');
        await manager.save(account);
      }

      return savedWithdrawal;
    });
  }

  async findAllPartnerWithdrawals(): Promise<PartnerWithdrawal[]> {
    return await this.partnerWithdrawalRepository.find({
      relations: ['user', 'shipment', 'account'],
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }

  async findOnePartnerWithdrawal(id: number): Promise<PartnerWithdrawal> {
    const withdrawal = await this.partnerWithdrawalRepository.findOne({
      where: { id },
      relations: ['user', 'shipment', 'account'],
    });

    if (!withdrawal) {
      throw new NotFoundException(`Изъятие #${id} не найдено`);
    }

    return withdrawal;
  }

  async removePartnerWithdrawal(id: number): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const withdrawal = await manager.findOne(PartnerWithdrawal, {
        where: { id },
        relations: ['shipment'],
      });

      if (!withdrawal) {
        throw new NotFoundException(`Изъятие #${id} не найдено`);
      }

      // Для изъятий типа "товар" восстанавливаем данные в поставке
      if (withdrawal.type === PartnerWithdrawalType.GOODS && withdrawal.shipmentId) {
        const shipment = await manager.findOne(Shipment, {
          where: { id: withdrawal.shipmentId },
          relations: ['batches', 'investments', 'investments.user'],
        });

        if (shipment) {
          const withdrawalQuantity = Number(withdrawal.amountOrQuantity);
          const withdrawalCost = withdrawal.costValue ? Number(withdrawal.costValue) : 0;

          // Восстанавливаем количество товара в партиях пропорционально
          const totalQuantity = shipment.batches.reduce(
            (sum, batch) => sum + batch.quantityInitial,
            0,
          );

          if (totalQuantity > 0) {
            let totalRestored = 0;
            const sortedBatches = [...shipment.batches].sort((a, b) => b.quantityInitial - a.quantityInitial);
            
            for (let i = 0; i < sortedBatches.length; i++) {
              const batch = sortedBatches[i];
              let quantityToRestore: number;
              
              // Для последней партии используем остаток
              if (i === sortedBatches.length - 1) {
                quantityToRestore = withdrawalQuantity - totalRestored;
              } else {
                const batchProportion = batch.quantityInitial / totalQuantity;
                quantityToRestore = Math.floor(withdrawalQuantity * batchProportion);
              }
              
              if (quantityToRestore > 0) {
                batch.quantityInitial += quantityToRestore;
                batch.quantityCurrent += quantityToRestore;
                totalRestored += quantityToRestore;
                await manager.save(batch);
              }
            }
          } else {
            // Если totalQuantity = 0, распределяем равномерно по всем партиям
            const batchesCount = shipment.batches.length;
            if (batchesCount > 0) {
              const quantityPerBatch = Math.floor(withdrawalQuantity / batchesCount);
              const remainder = withdrawalQuantity % batchesCount;
              
              for (let i = 0; i < shipment.batches.length; i++) {
                const batch = shipment.batches[i];
                const quantityToRestore = quantityPerBatch + (i < remainder ? 1 : 0);
                batch.quantityInitial += quantityToRestore;
                batch.quantityCurrent += quantityToRestore;
                await manager.save(batch);
              }
            }
          }

          // Восстанавливаем общую стоимость поставки
          const newTotalCost = Number(shipment.totalCost) + withdrawalCost;
          shipment.totalCost = newTotalCost.toFixed(2);
          await manager.save(shipment);

          // Восстанавливаем долю вкладчика и пересчитываем проценты для всех вкладчиков
          if (shipment.investments && shipment.investments.length > 0) {
            const userInvestment = shipment.investments.find(
              (inv) => inv.userId === withdrawal.userId,
            );

            if (userInvestment) {
              // Восстанавливаем сумму вложения вкладчика
              const newInvestmentAmount = Number(userInvestment.amount) + withdrawalCost;
              userInvestment.amount = newInvestmentAmount.toFixed(2);
              await manager.save(userInvestment);
            }

            // Пересчитываем проценты для всех вкладчиков
            const newTotalCostNum = Number(shipment.totalCost);
            if (newTotalCostNum > 0) {
              for (const investment of shipment.investments) {
                const newPercentage = (Number(investment.amount) / newTotalCostNum) * 100;
                investment.percentage = newPercentage.toFixed(2);
                await manager.save(investment);
              }
            }
          }
        }
      }

      // Удаляем связанную транзакцию, если она есть
      const transaction = await manager
        .createQueryBuilder(Transaction, 'transaction')
        .where('transaction.linkedEntityId = :id', { id })
        .andWhere('transaction.linkedEntityType = :type', {
          type: LinkedEntityType.PARTNER_WITHDRAWAL,
        })
        .getOne();

      if (transaction) {
        const accountId = transaction.accountId;
        await manager.remove(transaction);

        // Пересчитываем баланс счета
        if (accountId) {
          const account = await manager.findOne(Account, {
            where: { id: accountId },
            lock: { mode: 'pessimistic_write' },
          });

          if (account) {
            const result = await manager
              .createQueryBuilder(Transaction, 't')
              .select('COALESCE(SUM(t.amount::numeric), 0)', 'balance')
              .where('t.accountId = :accountId', { accountId })
              .andWhere('t.isCancelled = :isCancelled', { isCancelled: false })
              .getRawOne<{ balance: string }>();

            account.balance = (result?.balance ?? '0.00');
            await manager.save(account);
          }
        }
      }

      // Удаляем изъятие
      await manager.remove(withdrawal);
    });
  }

  // Other Expenses
  async createOtherExpense(
    dto: CreateOtherExpenseDto,
    userId: number,
  ): Promise<OtherExpense> {
    return this.dataSource.transaction(async (manager) => {
      const account = await manager.findOne(Account, {
        where: { id: dto.accountId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!account) {
        throw new NotFoundException(`Счёт #${dto.accountId} не найден`);
      }

      const expense = manager.create(OtherExpense, {
        accountId: account.id,
        account,
        amount: dto.amount.toFixed(2),
        category: dto.category.trim(),
        description: dto.description?.trim() ?? null,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : null,
        createdById: userId,
        updatedById: userId,
      });

      const savedExpense = await manager.save(expense);

      // Создаём транзакцию для расхода (отрицательная сумма)
      const transaction = manager.create(Transaction, {
        accountId: account.id,
        account,
        amount: (-dto.amount).toFixed(2),
        type: TransactionType.WRITE_OFF,
        description: `Прочий расход: ${dto.category}${dto.description ? ` - ${dto.description}` : ''}`,
        linkedEntityId: savedExpense.id,
        linkedEntityType: LinkedEntityType.WRITE_OFF,
        isCancelled: false,
        createdById: userId,
        updatedById: userId,
      });

      await manager.save(transaction);

      // Пересчитываем баланс
      const result = await manager
        .createQueryBuilder(Transaction, 't')
        .select('COALESCE(SUM(t.amount::numeric), 0)', 'balance')
        .where('t.accountId = :accountId', { accountId: account.id })
        .andWhere('t.isCancelled = :isCancelled', { isCancelled: false })
        .getRawOne<{ balance: string }>();

      account.balance = (result?.balance ?? '0.00');
      await manager.save(account);

      return savedExpense;
    });
  }

  async findAllOtherExpenses(accountId?: number): Promise<OtherExpense[]> {
    const where = accountId ? { accountId } : {};
    return await this.otherExpenseRepository.find({
      where,
      relations: ['account'],
      order: { expenseDate: 'DESC', createdAt: 'DESC', id: 'DESC' },
    });
  }

  async findOneOtherExpense(id: number): Promise<OtherExpense> {
    const expense = await this.otherExpenseRepository.findOne({
      where: { id },
      relations: ['account'],
    });

    if (!expense) {
      throw new NotFoundException(`Прочий расход #${id} не найден`);
    }

    return expense;
  }

  async updateOtherExpense(
    id: number,
    dto: UpdateOtherExpenseDto,
    userId: number,
  ): Promise<OtherExpense> {
    return this.dataSource.transaction(async (manager) => {
      // Загружаем expense без relations и lock, чтобы избежать ошибки FOR UPDATE с LEFT JOIN
      const expense = await manager.findOne(OtherExpense, {
        where: { id },
      });

      if (!expense) {
        throw new NotFoundException(`Прочий расход #${id} не найден`);
      }

      const oldAmount = Number(expense.amount);
      const oldAccountId = expense.accountId;

      // Обновляем поля
      if (dto.accountId !== undefined) {
        const newAccount = await manager.findOne(Account, {
          where: { id: dto.accountId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!newAccount) {
          throw new NotFoundException(`Счёт #${dto.accountId} не найден`);
        }

        expense.accountId = dto.accountId;
        expense.account = newAccount;
      }

      if (dto.amount !== undefined) {
        expense.amount = dto.amount.toFixed(2);
      }

      if (dto.category !== undefined) {
        expense.category = dto.category.trim();
      }

      if (dto.description !== undefined) {
        expense.description = dto.description.trim() || null;
      }

      if (dto.expenseDate !== undefined) {
        expense.expenseDate = dto.expenseDate ? new Date(dto.expenseDate) : null;
      }

      expense.updatedById = userId;
      const savedExpense = await manager.save(expense);

      // Обновляем связанную транзакцию
      // Используем query builder без lock, так как eager loading в Transaction entity вызывает LEFT JOIN,
      // который несовместим с FOR UPDATE. Блокировка не критична, так как account уже заблокирован.
      const transaction = await manager
        .createQueryBuilder(Transaction, 'transaction')
        .where('transaction.linkedEntityId = :id', { id })
        .andWhere('transaction.linkedEntityType = :type', { type: LinkedEntityType.WRITE_OFF })
        .getOne();

      if (transaction) {
        const newAmount = dto.amount !== undefined ? dto.amount : oldAmount;
        const newAccountId = dto.accountId !== undefined ? dto.accountId : oldAccountId;

        // Если изменился счёт, нужно обновить балансы обоих счетов
        if (dto.accountId !== undefined && dto.accountId !== oldAccountId) {
          // Старый счёт - возвращаем сумму
          const oldAccount = await manager.findOne(Account, {
            where: { id: oldAccountId },
            lock: { mode: 'pessimistic_write' },
          });

          if (oldAccount) {
            const oldResult = await manager
              .createQueryBuilder(Transaction, 't')
              .select('COALESCE(SUM(t.amount::numeric), 0)', 'balance')
              .where('t.accountId = :accountId', { accountId: oldAccountId })
              .andWhere('t.isCancelled = :isCancelled', { isCancelled: false })
              .andWhere('t.id != :transactionId', { transactionId: transaction.id })
              .getRawOne<{ balance: string }>();

            oldAccount.balance = (oldResult?.balance ?? '0.00');
            await manager.save(oldAccount);
          }

          // Новый счёт - вычитаем сумму
          const newAccount = await manager.findOne(Account, {
            where: { id: newAccountId },
            lock: { mode: 'pessimistic_write' },
          });

          if (newAccount) {
            transaction.accountId = newAccountId;
            transaction.account = newAccount;
          }
        }

        transaction.amount = (-newAmount).toFixed(2);
        transaction.description = `Прочий расход: ${savedExpense.category}${savedExpense.description ? ` - ${savedExpense.description}` : ''}`;
        transaction.updatedById = userId;
        await manager.save(transaction);

        // Пересчитываем баланс нового счёта
        const account = await manager.findOne(Account, {
          where: { id: newAccountId },
          lock: { mode: 'pessimistic_write' },
        });

        if (account) {
          const result = await manager
            .createQueryBuilder(Transaction, 't')
            .select('COALESCE(SUM(t.amount::numeric), 0)', 'balance')
            .where('t.accountId = :accountId', { accountId: newAccountId })
            .andWhere('t.isCancelled = :isCancelled', { isCancelled: false })
            .getRawOne<{ balance: string }>();

          account.balance = (result?.balance ?? '0.00');
          await manager.save(account);
        }
      }

      return savedExpense;
    });
  }

  async removeOtherExpense(id: number): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      // Загружаем expense без relations и lock, чтобы избежать ошибки FOR UPDATE с LEFT JOIN
      const expense = await manager.findOne(OtherExpense, {
        where: { id },
      });

      if (!expense) {
        throw new NotFoundException(`Прочий расход #${id} не найден`);
      }

      const accountId = expense.accountId;
      const account = await manager.findOne(Account, {
        where: { id: accountId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!account) {
        throw new NotFoundException(`Счёт #${accountId} не найден`);
      }

      // Удаляем связанную транзакцию
      // Используем query builder без lock, так как eager loading в Transaction entity вызывает LEFT JOIN,
      // который несовместим с FOR UPDATE. Блокировка не нужна, так как account уже заблокирован.
      const transaction = await manager
        .createQueryBuilder(Transaction, 'transaction')
        .where('transaction.linkedEntityId = :id', { id })
        .andWhere('transaction.linkedEntityType = :type', { type: LinkedEntityType.WRITE_OFF })
        .getOne();

      if (transaction) {
        await manager.remove(transaction);
      }

      // Удаляем расход
      await manager.remove(expense);

      // Пересчитываем баланс
      const result = await manager
        .createQueryBuilder(Transaction, 't')
        .select('COALESCE(SUM(t.amount::numeric), 0)', 'balance')
        .where('t.accountId = :accountId', { accountId })
        .andWhere('t.isCancelled = :isCancelled', { isCancelled: false })
        .getRawOne<{ balance: string }>();

      account.balance = (result?.balance ?? '0.00');
      await manager.save(account);
    });
  }
}
