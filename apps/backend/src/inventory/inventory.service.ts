import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Batch } from '../shipments/entities/batch.entity';
import { WriteOff } from './entities/write-off.entity';
import { CreateWriteOffDto } from './dto/create-write-off.dto';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { SaleStatus } from '../sales/entities/sale.entity';

type InventorySummaryItem = {
  batchId: number;
  plantType: string;
  sizeCmMin: number;
  sizeCmMax: number;
  potType: string;
  quantityInitial: number;
  quantityCurrent: number;
  purchasePricePerUnit: number;
  shipmentId: number;
  arrivalDate: string;
  supplierName: string;
};

@Injectable()
export class InventoryService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
    @InjectRepository(WriteOff)
    private readonly writeOffRepository: Repository<WriteOff>
  ) {}

  async getSummary(): Promise<InventorySummaryItem[]> {
    const batches = await this.batchRepository
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.shipment', 'shipment')
      .leftJoinAndSelect('shipment.supplier', 'supplier')
      .orderBy('shipment.arrivalDate', 'DESC')
      .addOrderBy('batch.id', 'ASC')
      .getMany();

    return batches.map((batch) => ({
      batchId: batch.id,
      plantType: batch.plantType,
      sizeCmMin: batch.sizeCmMin,
      sizeCmMax: batch.sizeCmMax,
      potType: batch.potType,
      quantityInitial: batch.quantityInitial,
      quantityCurrent: batch.quantityCurrent,
      purchasePricePerUnit: Number(batch.purchasePricePerUnit),
      shipmentId: batch.shipment.id,
      arrivalDate: batch.shipment.arrivalDate,
      supplierName: batch.shipment.supplier.name
    }));
  }

  async createWriteOff(dto: CreateWriteOffDto): Promise<WriteOff> {
    return this.dataSource.transaction(async (manager) => {
      const batch = await manager.findOne(Batch, {
        where: { id: dto.batchId },
        lock: { mode: 'pessimistic_write' }
      });

      if (!batch) {
        throw new NotFoundException(`Партия #${dto.batchId} не найдена`);
      }

      if (dto.quantity > batch.quantityCurrent) {
        throw new BadRequestException('Недостаточно остатка для списания');
      }

      batch.quantityCurrent -= dto.quantity;

      const totalCost =
        Number(batch.purchasePricePerUnit) * dto.quantity;

      const writeOff = manager.create(WriteOff, {
        batch,
        batchId: batch.id,
        quantity: dto.quantity,
        reason: dto.reason.trim(),
        writeOffDate: dto.writeOffDate,
        totalCost: totalCost.toFixed(2),
        comment: dto.comment?.trim() ?? null
      });

      await manager.save(batch);
      await manager.save(writeOff);

      return writeOff;
    });
  }

  async listWriteOffs(): Promise<WriteOff[]> {
    return this.writeOffRepository.find({
      order: { writeOffDate: 'DESC', id: 'DESC' }
    });
  }

  async getBatchDetails(batchId: number) {
    const batch = await this.batchRepository.findOne({
      where: { id: batchId },
      relations: ['shipment', 'shipment.supplier'],
    });

    if (!batch) {
      throw new NotFoundException(`Партия #${batchId} не найдена`);
    }

    const saleStatsRaw = await this.dataSource
      .getRepository(SaleItem)
      .createQueryBuilder('item')
      .innerJoin('item.sale', 'sale')
      .select('sale.status', 'status')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantity')
      .where('item.batchId = :batchId', { batchId })
      .groupBy('sale.status')
      .getRawMany<{ status: SaleStatus; quantity: string }>();

    const saleStats = saleStatsRaw.reduce(
      (acc, row) => {
        acc[row.status] = Number(row.quantity) || 0;
        return acc;
      },
      {} as Record<SaleStatus, number>,
    );

    const totalWriteOffRaw = await this.writeOffRepository
      .createQueryBuilder('writeOff')
      .select('COALESCE(SUM(writeOff.quantity), 0)', 'total')
      .where('writeOff.batchId = :batchId', { batchId })
      .getRawOne<{ total: string }>();

    const recentSales = await this.dataSource
      .getRepository(SaleItem)
      .createQueryBuilder('item')
      .innerJoin('item.sale', 'sale')
      .innerJoin('sale.client', 'client')
      .select('sale.id', 'saleId')
      .addSelect('sale.saleDate', 'saleDate')
      .addSelect('sale.status', 'status')
      .addSelect('client.fullName', 'clientName')
      .addSelect('item.quantity', 'quantity')
      .addSelect('item.salePricePerUnit', 'pricePerUnit')
      .where('item.batchId = :batchId', { batchId })
      .orderBy('sale.saleDate', 'DESC')
      .addOrderBy('sale.id', 'DESC')
      .limit(10)
      .getRawMany<{
        saleId: number;
        saleDate: string;
        status: SaleStatus;
        clientName: string;
        quantity: number;
        pricePerUnit: string;
      }>();

    const recentWriteOffs = await this.writeOffRepository.find({
      where: { batchId },
      order: { writeOffDate: 'DESC', id: 'DESC' },
      take: 10,
    });

    return {
      batch: {
        id: batch.id,
        plantType: batch.plantType,
        sizeCmMin: batch.sizeCmMin,
        sizeCmMax: batch.sizeCmMax,
        potType: batch.potType,
        quantityInitial: batch.quantityInitial,
        quantityCurrent: batch.quantityCurrent,
        purchasePricePerUnit: Number(batch.purchasePricePerUnit),
        shipmentId: batch.shipmentId,
        arrivalDate: batch.shipment.arrivalDate,
        supplierName: batch.shipment.supplier.name,
      },
      shipment: {
        id: batch.shipment.id,
        arrivalDate: batch.shipment.arrivalDate,
      },
      supplier: {
        id: batch.shipment.supplier.id,
        name: batch.shipment.supplier.name,
        phone: batch.shipment.supplier.phone ?? null,
      },
      stats: {
        soldQuantity: saleStats[SaleStatus.COMPLETED] ?? 0,
        cancelledQuantity: saleStats[SaleStatus.CANCELLED] ?? 0,
        writeOffQuantity: Number(totalWriteOffRaw?.total ?? 0),
        availableQuantity: batch.quantityCurrent,
      },
      recentSales: recentSales.map((sale) => ({
        saleId: Number(sale.saleId),
        saleDate: sale.saleDate,
        status: sale.status,
        clientName: sale.clientName,
        quantity: Number(sale.quantity),
        pricePerUnit: sale.pricePerUnit,
        totalAmount: (
          Number(sale.quantity) * Number(sale.pricePerUnit)
        ).toFixed(2),
      })),
      recentWriteOffs: recentWriteOffs.map((writeOff) => ({
        id: writeOff.id,
        quantity: writeOff.quantity,
        reason: writeOff.reason,
        writeOffDate: writeOff.writeOffDate,
        comment: writeOff.comment ?? null,
      })),
    };
  }

  async recalculateStock(): Promise<{
    updatedCount: number;
    updatedBatches: {
      batchId: number;
      previousQuantity: number;
      newQuantity: number;
      quantityInitial: number;
    }[];
  }> {
    return this.dataSource.transaction(async (manager) => {
      const batches = await manager.find(Batch, {
        lock: { mode: 'pessimistic_write' },
      });

      if (batches.length === 0) {
        return { updatedCount: 0, updatedBatches: [] };
      }

      const saleStats = await manager
        .createQueryBuilder(SaleItem, 'item')
        .innerJoin('item.sale', 'sale')
        .select('item.batchId', 'batchId')
        .addSelect(
          `SUM(CASE WHEN sale.status = :completed THEN item.quantity ELSE 0 END)`,
          'soldQty',
        )
        .where('item.batchId IN (:...batchIds)', {
          batchIds: batches.map((batch) => batch.id),
        })
        .setParameters({ completed: SaleStatus.COMPLETED })
        .groupBy('item.batchId')
        .getRawMany<{ batchId: number; soldQty: string }>();

      const writeOffStats = await manager
        .createQueryBuilder(WriteOff, 'writeOff')
        .select('writeOff.batchId', 'batchId')
        .addSelect('COALESCE(SUM(writeOff.quantity), 0)', 'writeOffQty')
        .where('writeOff.batchId IN (:...batchIds)', {
          batchIds: batches.map((batch) => batch.id),
        })
        .groupBy('writeOff.batchId')
        .getRawMany<{ batchId: number; writeOffQty: string }>();

      const saleMap = new Map<number, number>();
      for (const row of saleStats) {
        saleMap.set(Number(row.batchId), Number(row.soldQty) || 0);
      }

      const writeOffMap = new Map<number, number>();
      for (const row of writeOffStats) {
        writeOffMap.set(Number(row.batchId), Number(row.writeOffQty) || 0);
      }

      const updatedBatches: Batch[] = [];
      const changes: {
        batchId: number;
        previousQuantity: number;
        newQuantity: number;
        quantityInitial: number;
      }[] = [];

      for (const batch of batches) {
        const soldQty = saleMap.get(batch.id) ?? 0;
        const writeOffQty = writeOffMap.get(batch.id) ?? 0;
        const newQuantity = Math.max(batch.quantityInitial - soldQty - writeOffQty, 0);

        if (newQuantity !== batch.quantityCurrent) {
          changes.push({
            batchId: batch.id,
            previousQuantity: batch.quantityCurrent,
            newQuantity,
            quantityInitial: batch.quantityInitial,
          });
          batch.quantityCurrent = newQuantity;
          updatedBatches.push(batch);
        }
      }

      if (updatedBatches.length > 0) {
        await manager.save(updatedBatches);
      }

      return {
        updatedCount: changes.length,
        updatedBatches: changes,
      };
    });
  }
}


