import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, ILike, In, Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Shipment } from '../shipments/entities/shipment.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { SaleStatus } from '../sales/entities/sale.entity';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    const supplier = this.supplierRepository.create({
      name: dto.name.trim(),
      contactInfo: dto.contactInfo?.trim() ?? null,
      contactPerson: dto.contactPerson?.trim() ?? null,
      phone: dto.phone?.trim() ?? null,
      address: dto.address?.trim() ?? null,
      legalEntityName: dto.legalEntityName?.trim() ?? null,
      inn: dto.inn?.trim() ?? null,
      kpp: dto.kpp?.trim() ?? null,
      ogrn: dto.ogrn?.trim() ?? null,
      bankName: dto.bankName?.trim() ?? null,
      bankAccount: dto.bankAccount?.trim() ?? null,
      correspondentAccount: dto.correspondentAccount?.trim() ?? null,
      bik: dto.bik?.trim() ?? null,
    });
    return this.supplierRepository.save(supplier);
  }

  async findAll(search?: string): Promise<Supplier[]> {
    const where: FindOptionsWhere<Supplier>[] | undefined = search
      ? [
          { name: ILike(`%${search}%`) },
          { contactInfo: ILike(`%${search}%`) },
          { contactPerson: ILike(`%${search}%`) },
          { phone: ILike(`%${search}%`) },
          { address: ILike(`%${search}%`) },
          { legalEntityName: ILike(`%${search}%`) },
        ]
      : undefined;

    return this.supplierRepository.find({
      where,
      order: { name: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({ where: { id } });
    if (!supplier) {
      throw new NotFoundException(`Поставщик #${id} не найден`);
    }
    return supplier;
  }

  async update(id: number, dto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findOne(id);
    if (dto.name !== undefined) {
      supplier.name = dto.name.trim();
    }
    if (dto.contactInfo !== undefined) {
      supplier.contactInfo = dto.contactInfo?.trim() ?? null;
    }
    if (dto.contactPerson !== undefined) {
      supplier.contactPerson = dto.contactPerson?.trim() ?? null;
    }
    if (dto.phone !== undefined) {
      supplier.phone = dto.phone?.trim() ?? null;
    }
    if (dto.address !== undefined) {
      supplier.address = dto.address?.trim() ?? null;
    }
    if (dto.legalEntityName !== undefined) {
      supplier.legalEntityName = dto.legalEntityName?.trim() ?? null;
    }
    if (dto.inn !== undefined) {
      supplier.inn = dto.inn?.trim() ?? null;
    }
    if (dto.kpp !== undefined) {
      supplier.kpp = dto.kpp?.trim() ?? null;
    }
    if (dto.ogrn !== undefined) {
      supplier.ogrn = dto.ogrn?.trim() ?? null;
    }
    if (dto.bankName !== undefined) {
      supplier.bankName = dto.bankName?.trim() ?? null;
    }
    if (dto.bankAccount !== undefined) {
      supplier.bankAccount = dto.bankAccount?.trim() ?? null;
    }
    if (dto.correspondentAccount !== undefined) {
      supplier.correspondentAccount = dto.correspondentAccount?.trim() ?? null;
    }
    if (dto.bik !== undefined) {
      supplier.bik = dto.bik?.trim() ?? null;
    }
    return this.supplierRepository.save(supplier);
  }

  async remove(id: number, userRole?: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const supplier = await manager.findOne(Supplier, { where: { id } });

      if (!supplier) {
        throw new NotFoundException(`Поставщик #${id} не найден`);
      }

      // Проверяем, есть ли связанные поставки
      const relatedShipments = await manager.find(Shipment, {
        where: { supplierId: id },
        relations: ['batches'],
      });

      if (relatedShipments.length > 0) {
        // Получаем все ID партий из связанных поставок
        const batchIds: number[] = [];
        for (const shipment of relatedShipments) {
          if (shipment.batches) {
            batchIds.push(...shipment.batches.map((batch) => batch.id));
          }
        }

        if (batchIds.length > 0) {
          // Проверяем, есть ли связанные продажи через партии
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
                'Нельзя удалить поставщика, связанного с активными продажами. Удалите связанные продажи или отмените их.',
              );
            }

            // Если все продажи отменены, проверяем роль пользователя
            const isAdmin = userRole === 'admin' || userRole === 'super_admin';
            if (!isAdmin) {
              throw new BadRequestException(
                'Нельзя удалить поставщика, связанного с отмененными продажами. Только администратор может удалить таких поставщиков.',
              );
            }
          }
        }
      }

      // Удаляем поставщика
      await manager.remove(supplier);
    });
  }
}

