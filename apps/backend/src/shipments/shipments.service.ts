import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { Shipment } from './entities/shipment.entity';
import { Batch } from './entities/batch.entity';
import { ShipmentInvestment } from './entities/shipment-investment.entity';
import { CreateShipmentDto, ShipmentDocumentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { SuppliersService } from '../suppliers/suppliers.service';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { Sale, SaleStatus } from '../sales/entities/sale.entity';
import { Buyback, BuybackStatus } from '../buybacks/entities/buyback.entity';
import { User } from '../users/entities/user.entity';
import { unlink } from 'fs';
import { resolve } from 'path';

@Injectable()
export class ShipmentsService {
  private readonly logger = new Logger(ShipmentsService.name);

  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
    @InjectRepository(ShipmentInvestment)
    private readonly shipmentInvestmentRepository: Repository<ShipmentInvestment>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepository: Repository<SaleItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly suppliersService: SuppliersService,
    private readonly dataSource: DataSource,
  ) {
    this.ensureDocumentUrlColumnType().catch((error) => {
      this.logger.warn(
        `Не удалось автоматически обновить тип столбца document_url: ${error?.message}`,
      );
    });
  }

  async create(dto: CreateShipmentDto): Promise<Shipment> {
    const supplier = await this.suppliersService.findOne(dto.supplierId);

    return this.dataSource.transaction(async (manager) => {
      const totalCost = dto.batches.reduce((acc, batchDto) => {
        return acc + batchDto.pricePerUnit * batchDto.quantity;
      }, 0);

      const shipment = manager.create(Shipment, {
        supplier,
        supplierId: supplier.id,
        arrivalDate: dto.arrivalDate,
        documentUrl: this.serializeDocuments(dto.documents),
        totalCost: totalCost.toFixed(2),
      });

      const savedShipment = await manager.save(shipment);

      const batches = dto.batches.map((batchDto) =>
        manager.create(Batch, {
          shipment: savedShipment,
          shipmentId: savedShipment.id,
          plantType: batchDto.plantType.trim(),
          sizeCmMin: batchDto.sizeCmMin,
          sizeCmMax: batchDto.sizeCmMax,
          potType: batchDto.potType.trim(),
          quantityInitial: batchDto.quantity,
          quantityCurrent: batchDto.quantity,
          purchasePricePerUnit: batchDto.pricePerUnit.toFixed(2),
        })
      );

      await manager.save(batches);

      // Обрабатываем вложения партнеров, если они указаны
      if (dto.investments && dto.investments.length > 0) {
        const totalInvestments = dto.investments.reduce(
          (sum, inv) => sum + inv.amount,
          0,
        );

        // Проверяем, что сумма вложений не превышает общую стоимость поставки
        if (totalInvestments > parseFloat(totalCost.toFixed(2))) {
          throw new BadRequestException(
            `Сумма вложений (${totalInvestments.toFixed(2)}) не может превышать общую стоимость поставки (${totalCost.toFixed(2)})`,
          );
        }

        // Получаем пользователей для проверки
        const userIds = dto.investments.map((inv) => inv.userId);
        const users = await manager.find(User, {
          where: { id: In(userIds) },
          relations: ['role'],
        });

        // Проверяем, что все пользователи являются владельцами (super_admin)
        for (const user of users) {
          if (user.role?.name !== 'super_admin') {
            throw new BadRequestException(
              `Пользователь ${user.fullName} не является владельцем бизнеса`,
            );
          }
        }

        // Рассчитываем проценты и создаем записи о вложениях
        const investments = await Promise.all(
          dto.investments.map(async (invDto) => {
            const user = users.find((u) => u.id === invDto.userId);
            if (!user) {
              throw new NotFoundException(`Пользователь #${invDto.userId} не найден`);
            }

            // Рассчитываем процент доли от общей стоимости поставки
            const percentage = (invDto.amount / parseFloat(totalCost.toFixed(2))) * 100;

            return manager.create(ShipmentInvestment, {
              shipment: savedShipment,
              shipmentId: savedShipment.id,
              user,
              userId: user.id,
              amount: invDto.amount.toFixed(2),
              percentage: percentage.toFixed(2),
              createdById: savedShipment.createdById,
              updatedById: savedShipment.updatedById,
            });
          }),
        );

        await manager.save(investments);
      }

      // Загружаем созданную поставку с отношениями внутри транзакции
      const shipmentRepo = manager.getRepository(Shipment);
      const result = await shipmentRepo.findOne({
        where: { id: savedShipment.id },
        relations: { batches: true, supplier: true },
      });

      if (!result) {
        throw new NotFoundException(`Не удалось загрузить созданную поставку #${savedShipment.id}`);
      } else if (
        dto.supplierId === undefined &&
        dto.arrivalDate === undefined &&
        dto.documents === undefined
      ) {
        throw new BadRequestException(
          'Укажите хотя бы одно поле для обновления: поставщика, дату, документ или партии.',
        );
      }

      return result;
    });
  }

  async findAll(): Promise<Shipment[]> {
    const shipments = await this.shipmentRepository.find({
      relations: { batches: true, supplier: true },
      order: { arrivalDate: 'DESC', id: 'DESC' }
    });

    // Загружаем вложения для всех поставок
    const shipmentIds = shipments.map(s => s.id);
    if (shipmentIds.length > 0) {
      const allInvestments = await this.shipmentInvestmentRepository.find({
        where: { shipmentId: In(shipmentIds) },
        relations: ['user'],
      });

      // Группируем вложения по shipmentId
      const investmentsByShipment = allInvestments.reduce((acc, inv) => {
        if (!acc[inv.shipmentId]) {
          acc[inv.shipmentId] = [];
        }
        acc[inv.shipmentId].push(inv);
        return acc;
      }, {} as Record<number, typeof allInvestments>);

      // Добавляем вложения к каждой поставке
      shipments.forEach(shipment => {
        (shipment as any).investments = investmentsByShipment[shipment.id] || [];
      });
    }

    return shipments;
  }

  async findOne(id: number): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id },
      relations: { batches: true, supplier: true },
    });

    if (!shipment) {
      throw new NotFoundException(`Поставка #${id} не найдена`);
    }

    // Загружаем вложения партнеров
    const investments = await this.shipmentInvestmentRepository.find({
      where: { shipmentId: id },
      relations: ['user'],
    });

    // Добавляем investments к shipment (через расширение типа)
    (shipment as any).investments = investments;

    return shipment;
  }

  async update(id: number, dto: UpdateShipmentDto): Promise<Shipment> {
    // Логируем, что приходит в DTO для отладки
    this.logger.debug(`Обновление поставки #${id}, batches: ${dto.batches ? `[${dto.batches.length} партий]` : 'undefined'}, investments: ${dto.investments ? `[${dto.investments.length} вложений]` : 'undefined'}`);

    return this.dataSource.transaction(async (manager) => {
      const shipment = await manager.findOne(Shipment, {
        where: { id },
        relations: { batches: true, supplier: true },
      });

      if (!shipment) {
        throw new NotFoundException(`Поставка #${id} не найдена`);
      }

      // Обновляем поставщика, если указан
      if (dto.supplierId !== undefined && dto.supplierId !== shipment.supplierId) {
        const supplier = await this.suppliersService.findOne(dto.supplierId);
        shipment.supplier = supplier;
        shipment.supplierId = supplier.id;
      }

      // Обновляем дату прибытия, если указана
      if (dto.arrivalDate !== undefined) {
        shipment.arrivalDate = dto.arrivalDate;
      }

      // Обновляем URL документа, если указан
      const previousDocuments = shipment.documents ?? [];

      if (dto.documents !== undefined) {
        shipment.documentUrl = this.serializeDocuments(dto.documents);
        const newUrls = new Set(
          (dto.documents ?? []).map((doc) => doc.url.trim()).filter((url) => url.length > 0),
        );
        for (const doc of previousDocuments) {
          if (!doc.url) {
            continue;
          }
          if (!newUrls.has(doc.url)) {
            this.deleteDocumentFile(doc.url);
          }
        }
      }

      // Пересчитываем общую стоимость поставки
      let newTotalCost = parseFloat(shipment.totalCost);
      const hasBatchesToUpdate = dto.batches !== undefined && dto.batches !== null && Array.isArray(dto.batches) && dto.batches.length > 0;
      
      if (hasBatchesToUpdate && dto.batches) {
        newTotalCost = dto.batches.reduce((acc, batchDto) => {
          return acc + batchDto.pricePerUnit * batchDto.quantity;
        }, 0);
        shipment.totalCost = newTotalCost.toFixed(2);
      }

      // Обрабатываем вложения партнеров, если они указаны
      // Это можно делать независимо от обновления партий
      if (dto.investments !== undefined) {
        // Удаляем все существующие вложения
        await manager.delete(ShipmentInvestment, { shipmentId: id });

        // Создаем новые вложения, если они указаны
        if (dto.investments.length > 0) {
          const totalInvestments = dto.investments.reduce(
            (sum, inv) => sum + inv.amount,
            0,
          );

          // Проверяем, что сумма вложений не превышает общую стоимость поставки
          if (totalInvestments > newTotalCost) {
            throw new BadRequestException(
              `Сумма вложений (${totalInvestments.toFixed(2)}) не может превышать общую стоимость поставки (${newTotalCost.toFixed(2)})`,
            );
          }

          // Получаем пользователей для проверки
          const userIds = dto.investments.map((inv) => inv.userId);
          const users = await manager.find(User, {
            where: { id: In(userIds) },
            relations: ['role'],
          });

          // Проверяем, что все пользователи являются владельцами (super_admin)
          for (const user of users) {
            if (user.role?.name !== 'super_admin') {
              throw new BadRequestException(
                `Пользователь ${user.fullName} не является владельцем бизнеса`,
              );
            }
          }

          // Рассчитываем проценты и создаем записи о вложениях
          const investments = await Promise.all(
            dto.investments.map(async (invDto) => {
              const user = users.find((u) => u.id === invDto.userId);
              if (!user) {
                throw new NotFoundException(`Пользователь #${invDto.userId} не найден`);
              }

              // Рассчитываем процент доли от общей стоимости поставки
              const percentage = (invDto.amount / newTotalCost) * 100;

              return manager.create(ShipmentInvestment, {
                shipment,
                shipmentId: shipment.id,
                user,
                userId: user.id,
                amount: invDto.amount.toFixed(2),
                percentage: percentage.toFixed(2),
                createdById: shipment.updatedById || shipment.createdById,
                updatedById: shipment.updatedById || shipment.createdById,
              });
            }),
          );

          await manager.save(investments);
        }
      }

      // Обновляем партии, если указаны
      // Важно: это делается только если batches явно указаны в DTO и не пустой массив
      // Используем уже объявленную переменную hasBatchesToUpdate
      if (hasBatchesToUpdate) {
        this.logger.debug(`Обновление партий для поставки #${id}`);
        // Проверяем, нет ли связанных продаж
        const batchIds = shipment.batches.map((batch) => batch.id);
        if (batchIds.length > 0) {
          const relatedSaleItems = await manager.find(SaleItem, {
            where: { batchId: In(batchIds) },
          });

          if (relatedSaleItems.length > 0) {
            throw new BadRequestException(
              'Нельзя изменить партии поставки, если они используются в продажах. Удалите связанные продажи или создайте новую поставку.',
            );
          }

          // Удаляем старые партии
          await manager.delete(Batch, batchIds);
          shipment.batches = [];
        }

        // Создаем новые партии
        // totalCost уже пересчитан выше

        const batches = (dto.batches || []).map((batchDto) => {
          const newBatch = manager.create(Batch, {
            shipment,
            plantType: batchDto.plantType.trim(),
            sizeCmMin: batchDto.sizeCmMin,
            sizeCmMax: batchDto.sizeCmMax,
            potType: batchDto.potType.trim(),
            quantityInitial: batchDto.quantity,
            quantityCurrent: batchDto.quantity,
            purchasePricePerUnit: batchDto.pricePerUnit.toFixed(2),
          });

          newBatch.shipmentId = shipment.id;

          return newBatch;
        });

        await manager.save(Batch, batches);
        shipment.batches = batches;
      }
      // Если партии не обновляются, но есть другие изменения (например, investments),
      // просто сохраняем поставку без изменений партий

      const savedShipment = await manager.save(shipment);

      // Загружаем обновленную поставку с отношениями
      const result = await manager.findOne(Shipment, {
        where: { id: savedShipment.id },
        relations: { batches: true, supplier: true },
      });

      if (!result) {
        throw new NotFoundException(
          `Не удалось загрузить обновленную поставку #${savedShipment.id}`,
        );
      }

      return result;
    });
  }

  async remove(id: number, userRole?: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const shipment = await manager.findOne(Shipment, {
        where: { id },
        relations: { batches: true },
      });

      if (!shipment) {
        throw new NotFoundException(`Поставка #${id} не найдена`);
      }

      // Проверяем, нет ли связанных продаж через партии
      const batchIds = shipment.batches.map((batch) => batch.id);
      if (batchIds.length > 0) {
        const relatedSaleItems = await manager.find(SaleItem, {
          where: { batchId: In(batchIds) },
          relations: ['sale'],
        });

        if (relatedSaleItems.length > 0) {
          // Проверяем, все ли связанные продажи отменены
          const allCancelled = relatedSaleItems.every(
            (item) => item.sale.status === SaleStatus.CANCELLED,
          );

          if (!allCancelled) {
            throw new BadRequestException(
              'Нельзя удалить поставку, связанную с активными продажами. Удалите связанные продажи или отмените их.',
            );
          }

          // Если все продажи отменены, проверяем роль пользователя
          const isAdmin = userRole === 'admin' || userRole === 'super_admin';
          if (!isAdmin) {
            throw new BadRequestException(
              'Нельзя удалить поставку, связанную с отмененными продажами. Только администратор может удалить такие поставки.',
            );
          }

          // Удаляем связанные отмененные продажи и их элементы перед удалением партий
          const saleIds = new Set(relatedSaleItems.map((item) => item.saleId));
          const cancelledSales = await manager.find(Sale, {
            where: { id: In(Array.from(saleIds)), status: SaleStatus.CANCELLED },
            relations: ['items'],
          });

          if (cancelledSales.length > 0) {
            // Находим и удаляем связанные отмененные выкупы
            const relatedBuybacks = await manager.find(Buyback, {
              where: { originalSaleId: In(cancelledSales.map((s) => s.id)) },
            });

            if (relatedBuybacks.length > 0) {
              const declinedBuybacks = relatedBuybacks.filter(
                (buyback) => buyback.status === BuybackStatus.DECLINED,
              );
              if (declinedBuybacks.length > 0) {
                await manager.remove(declinedBuybacks);
              }
            }

            // Удаляем отмененные продажи (SaleItem удалятся каскадно)
            await manager.remove(cancelledSales);
          }
        }
      }

      // Удаляем партии (они удалятся каскадно или явно)
      if (shipment.batches.length > 0) {
        await manager.delete(Batch, batchIds);
        shipment.batches = [];
      }

      // Удаляем прикрепленные документы
      for (const doc of shipment.documents ?? []) {
        if (doc.url) {
          this.deleteDocumentFile(doc.url);
        }
      }

      // Удаляем поставку
      await manager.remove(shipment);
    });
  }

  async bulkRemove(ids: number[], userRole?: string): Promise<{
    success: number[];
    failed: Array<{ id: number; error: string }>;
  }> {
    const success: number[] = [];
    const failed: Array<{ id: number; error: string }> = [];

    for (const id of ids) {
      try {
        await this.remove(id, userRole);
        success.push(id);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Неизвестная ошибка при удалении';
        failed.push({ id, error: errorMessage });
      }
    }

    return { success, failed };
  }

  async deleteUploadedDocument(url: string): Promise<void> {
    this.deleteDocumentFile(url);
  }

  private serializeDocuments(documents?: ShipmentDocumentDto[]): string | null {
    if (!documents || documents.length === 0) {
      return null;
    }

    const normalized = documents
      .map((doc) => {
        if (!doc?.url) {
          return null;
        }
        const trimmedUrl = doc.url.trim();
        if (!trimmedUrl) {
          return null;
        }
        const trimmedName = doc.name?.trim();
        return {
          url: trimmedUrl,
          name: trimmedName && trimmedName.length > 0 ? trimmedName : this.extractName(trimmedUrl),
        };
      })
      .filter((doc): doc is { url: string; name: string } => !!doc);

    return normalized.length > 0 ? JSON.stringify(normalized) : null;
  }

  private extractName(url: string): string {
    try {
      const cleaned = url.split('?')[0];
      return decodeURIComponent(cleaned.substring(cleaned.lastIndexOf('/') + 1));
    } catch {
      return url;
    }
  }

  private deleteDocumentFile(url: string) {
    try {
      let relativePath = url;
      if (/^https?:\/\//i.test(url)) {
        const parsed = new URL(url);
        relativePath = parsed.pathname;
      }
      relativePath = decodeURI(relativePath);
      if (!relativePath.startsWith('/uploads/')) {
        return;
      }
      const absolutePath = resolve(process.cwd(), `.${relativePath}`);
      unlink(absolutePath, () => undefined);
    } catch {
      // ignore
    }
  }

  private async ensureDocumentUrlColumnType(): Promise<void> {
    const query = `
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'shipments'
            AND column_name = 'document_url'
            AND data_type <> 'text'
        ) THEN
          ALTER TABLE shipments
            ALTER COLUMN document_url TYPE text USING document_url::text;
        END IF;
      END
      $$;
    `;

    await this.dataSource.query(query);
  }
}

