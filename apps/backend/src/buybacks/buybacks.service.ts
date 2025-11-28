import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Buyback, BuybackStatus } from './entities/buyback.entity';
import { BuybackItem } from './entities/buyback-item.entity';
import { CreateBuybackDto } from './dto/create-buyback.dto';
import { UpdateBuybackDto } from './dto/update-buyback.dto';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { Client } from '../clients/entities/client.entity';
import { Batch } from '../shipments/entities/batch.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BuybacksService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Buyback)
    private readonly buybackRepository: Repository<Buyback>,
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateBuybackDto): Promise<Buyback> {
    return this.dataSource.transaction(async (manager) => {
      const sale = await manager.findOne(Sale, {
        where: { id: dto.originalSaleId },
        relations: ['items'],
      });

      if (!sale) {
        throw new NotFoundException(
          `Продажа #${dto.originalSaleId} не найдена`,
        );
      }

      const client = await manager.findOne(Client, {
        where: { id: dto.clientId },
      });

      if (!client) {
        throw new NotFoundException(`Клиент #${dto.clientId} не найден`);
      }

      if (sale.clientId !== dto.clientId) {
        throw new BadRequestException(
          'Клиент в выкупе должен совпадать с клиентом в продаже',
        );
      }

      const newBuyback = manager.create(Buyback, {
        originalSaleId: sale.id,
        originalSale: sale,
        clientId: client.id,
        client,
        plannedDate: dto.plannedDate,
        actualDate: dto.actualDate ?? null,
        status: dto.status ?? BuybackStatus.PLANNED,
        notes: dto.notes?.trim() ?? null,
      });

      const savedBuyback = await manager.save(newBuyback);

      for (const itemDto of dto.items) {
        const saleItem = await manager.findOne(SaleItem, {
          where: { id: itemDto.originalSaleItemId },
          relations: ['sale', 'batch'],
        });

        if (!saleItem) {
          throw new NotFoundException(
            `Позиция продажи #${itemDto.originalSaleItemId} не найдена`,
          );
        }

        if (saleItem.saleId !== sale.id) {
          throw new BadRequestException(
            `Позиция продажи #${itemDto.originalSaleItemId} не принадлежит продаже #${sale.id}`,
          );
        }

        if (itemDto.quantity > saleItem.quantity) {
          throw new BadRequestException(
            `Количество выкупа (${itemDto.quantity}) не может превышать количество в продаже (${saleItem.quantity})`,
          );
        }

        const buybackItem = manager.create(BuybackItem, {
          buybackId: savedBuyback.id,
          buyback: savedBuyback,
          originalSaleItemId: saleItem.id,
          originalSaleItem: saleItem,
          quantity: itemDto.quantity,
          buybackPricePerUnit: itemDto.buybackPricePerUnit.toFixed(2),
          conditionNotes: itemDto.conditionNotes?.trim() ?? null,
        });

        await manager.save(buybackItem);
      }

      return await manager.findOne(Buyback, {
        where: { id: savedBuyback.id },
        relations: [
          'originalSale',
          'client',
          'items',
          'items.originalSaleItem',
          'items.originalSaleItem.batch',
        ],
      }) as Buyback;
    }).then(async (createdBuyback) => {
      // Создаём уведомления для выкупа (60, 30, 7 дней до planned_date)
      if (createdBuyback) {
        await this.notificationsService.createBuybackReminders(createdBuyback);
      }
      return createdBuyback;
    });
  }

  async findAll(status?: BuybackStatus): Promise<Buyback[]> {
    return await this.buybackRepository.find({
      where: status ? { status } : {},
      relations: [
        'originalSale',
        'client',
        'items',
        'items.originalSaleItem',
        'items.originalSaleItem.batch',
      ],
      order: { plannedDate: 'ASC', id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Buyback> {
    const buyback = await this.buybackRepository.findOne({
      where: { id },
      relations: [
        'originalSale',
        'client',
        'items',
        'items.originalSaleItem',
        'items.originalSaleItem.batch',
      ],
    });

    if (!buyback) {
      throw new NotFoundException(`Выкуп #${id} не найден`);
    }

    return buyback;
  }

  async update(id: number, dto: UpdateBuybackDto): Promise<Buyback> {
    const buyback = await this.findOne(id);

    if (dto.plannedDate !== undefined) {
      buyback.plannedDate = dto.plannedDate;
    }

    if (dto.actualDate !== undefined) {
      buyback.actualDate = dto.actualDate;
    }

    if (dto.status !== undefined) {
      buyback.status = dto.status;
    }

    if (dto.notes !== undefined) {
      buyback.notes = dto.notes?.trim() ?? null;
    }

    return await this.buybackRepository.save(buyback);
  }

  async complete(id: number, actualDate?: string): Promise<Buyback> {
    return this.dataSource.transaction(async (manager) => {
      const buyback = await manager.findOne(Buyback, {
        where: { id },
        relations: [
          'items',
          'items.originalSaleItem',
          'items.originalSaleItem.batch',
        ],
      });

      if (!buyback) {
        throw new NotFoundException(`Выкуп #${id} не найден`);
      }

      if (buyback.status === BuybackStatus.COMPLETED) {
        throw new BadRequestException('Выкуп уже завершён');
      }

      if (buyback.status === BuybackStatus.DECLINED) {
        throw new BadRequestException('Выкуп отменён, нельзя завершить');
      }

      for (const item of buyback.items) {
        const batch = await manager.findOne(Batch, {
          where: { id: item.originalSaleItem.batchId },
          lock: { mode: 'pessimistic_write' },
        });

        if (batch) {
          batch.quantityCurrent += item.quantity;
          await manager.save(batch);
        }
      }

      buyback.status = BuybackStatus.COMPLETED;
      if (actualDate) {
        buyback.actualDate = actualDate;
      } else if (!buyback.actualDate) {
        buyback.actualDate = new Date().toISOString().split('T')[0];
      }

      return await manager.save(buyback);
    });
  }

  async decline(id: number): Promise<Buyback> {
    const buyback = await this.findOne(id);

    if (buyback.status === BuybackStatus.COMPLETED) {
      throw new BadRequestException('Завершённый выкуп нельзя отменить');
    }

    if (buyback.status === BuybackStatus.DECLINED) {
      throw new BadRequestException('Выкуп уже отменён');
    }

    buyback.status = BuybackStatus.DECLINED;
    return await this.buybackRepository.save(buyback);
  }

  async remove(id: number, userRole?: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const buyback = await manager.findOne(Buyback, {
        where: { id },
      });

      if (!buyback) {
        throw new NotFoundException(`Выкуп #${id} не найден`);
      }

      // Проверяем, что выкуп отменен
      if (buyback.status !== BuybackStatus.DECLINED) {
        throw new BadRequestException(
          'Нельзя удалить выкуп, который не отменен. Сначала отмените выкуп.',
        );
      }

      // Проверяем роль пользователя
      const isAdmin = userRole === 'admin' || userRole === 'super_admin';
      if (!isAdmin) {
        throw new BadRequestException(
          'Нельзя удалить отмененный выкуп. Только администратор может удалить такие выкупы.',
        );
      }

      // Удаляем выкуп (BuybackItem удалятся каскадно благодаря onDelete: 'CASCADE')
      await manager.remove(buyback);
    });
  }
}
