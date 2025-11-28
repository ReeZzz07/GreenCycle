import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Sale, SaleStatus } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { Buyback, BuybackStatus } from '../buybacks/entities/buyback.entity';
import { Shipment } from '../shipments/entities/shipment.entity';
import { Batch } from '../shipments/entities/batch.entity';
import { Client } from '../clients/entities/client.entity';
import { Transaction } from '../finance/entities/transaction.entity';
import { ReportParamsDto } from './dto/report-params.dto';

type ProfitReportItem = {
  shipmentId: number;
  shipmentDate: string;
  supplierName: string;
  totalCost: number;
  totalRevenue: number;
  profit: number;
  profitMargin: number;
};

type ClientProfitReportItem = {
  clientId: number;
  clientName: string;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  salesCount: number;
};

type BuybackForecastItem = {
  buybackId: number;
  clientName: string;
  plannedDate: string;
  status: string;
  totalQuantity: number;
  estimatedRevenue: number;
  estimatedCost: number;
  estimatedProfit: number;
};

type CashFlowItem = {
  date: string;
  accountName: string;
  accountType: string;
  income: number;
  expense: number;
  balance: number;
};

type ClientActivityItem = {
  clientId: number;
  clientName: string;
  firstPurchaseDate: string | null;
  lastPurchaseDate: string | null;
  totalPurchases: number;
  totalRevenue: number;
  buybacksCount: number;
};

type SalesByPeriodItem = {
  period: string;
  periodStart: string;
  periodEnd: string;
  salesCount: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  averageSaleAmount: number;
};

type ProfitByPlantTypeItem = {
  plantType: string;
  totalQuantitySold: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  averagePricePerUnit: number;
  averageCostPerUnit: number;
  salesCount: number;
};

type ReturnsAndWriteoffsItem = {
  buybackId: number;
  clientName: string;
  date: string;
  status: string;
  type: 'return' | 'writeoff';
  totalQuantity: number;
  buybackAmount: number;
  originalCost: number;
  loss: number;
  notes: string | null;
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(Buyback)
    private readonly buybackRepository: Repository<Buyback>,
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
  ) {}

  async getProfitByShipment(params: ReportParamsDto): Promise<ProfitReportItem[]> {
    const queryBuilder = this.shipmentRepository
      .createQueryBuilder('shipment')
      .leftJoinAndSelect('shipment.supplier', 'supplier')
      .leftJoinAndSelect('shipment.batches', 'batches');

    if (params.startDate) {
      queryBuilder.andWhere('shipment.arrivalDate >= :startDate', {
        startDate: params.startDate,
      });
    }

    if (params.endDate) {
      queryBuilder.andWhere('shipment.arrivalDate <= :endDate', {
        endDate: params.endDate,
      });
    }

    if (params.shipmentId) {
      queryBuilder.andWhere('shipment.id = :shipmentId', {
        shipmentId: params.shipmentId,
      });
    }

    const shipments = await queryBuilder.getMany();

    const results: ProfitReportItem[] = [];

    for (const shipment of shipments) {
      const saleItems = await this.dataSource
        .createQueryBuilder()
        .select('saleItem.quantity', 'quantity')
        .addSelect('saleItem.sale_price_per_unit', 'salePricePerUnit')
        .addSelect('batch.purchase_price_per_unit', 'purchasePricePerUnit')
        .from(SaleItem, 'saleItem')
        .innerJoin('saleItem.batch', 'batch')
        .where('batch.shipmentId = :shipmentId', { shipmentId: shipment.id })
        .getRawMany<{
          quantity: string;
          salePricePerUnit: string;
          purchasePricePerUnit: string;
        }>();

      const totalCost = Number(shipment.totalCost) || 0;
      let totalRevenue = 0;

      for (const item of saleItems) {
        const quantity = Number(item.quantity) || 0;
        const salePricePerUnit = Number(item.salePricePerUnit) || 0;
        totalRevenue += quantity * salePricePerUnit;
      }

      const profit = totalRevenue - totalCost;
      const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0;

      results.push({
        shipmentId: shipment.id,
        shipmentDate: shipment.arrivalDate,
        supplierName: shipment.supplier.name,
        totalCost,
        totalRevenue,
        profit,
        profitMargin: Number(profitMargin.toFixed(2)),
      });
    }

    return results;
  }

  async getProfitByClient(params: ReportParamsDto): Promise<ClientProfitReportItem[]> {
    const queryBuilder = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.client', 'client')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('items.batch', 'batch')
      .where('sale.status = :status', { status: 'completed' });

    if (params.startDate) {
      queryBuilder.andWhere('sale.saleDate >= :startDate', {
        startDate: params.startDate,
      });
    }

    if (params.endDate) {
      queryBuilder.andWhere('sale.saleDate <= :endDate', {
        endDate: params.endDate,
      });
    }

    if (params.clientId) {
      queryBuilder.andWhere('sale.clientId = :clientId', {
        clientId: params.clientId,
      });
    }

    const sales = await queryBuilder.getMany();

    const clientMap = new Map<
      number,
      {
        clientId: number;
        clientName: string;
        totalRevenue: number;
        totalCost: number;
        salesCount: number;
      }
    >();

    for (const sale of sales) {
      if (!clientMap.has(sale.clientId)) {
        clientMap.set(sale.clientId, {
          clientId: sale.client.id,
          clientName: sale.client.fullName,
          totalRevenue: 0,
          totalCost: 0,
          salesCount: 0,
        });
      }

      const clientData = clientMap.get(sale.clientId)!;
      clientData.totalRevenue += Number(sale.totalAmount) || 0;
      clientData.salesCount += 1;

      for (const item of sale.items) {
        const batchCost =
          Number(item.quantity) * Number(item.batch.purchasePricePerUnit);
        clientData.totalCost += batchCost;
      }
    }

    return Array.from(clientMap.values()).map((data) => {
      const profit = data.totalRevenue - data.totalCost;
      const profitMargin = data.totalCost > 0 ? (profit / data.totalCost) * 100 : 0;

      return {
        clientId: data.clientId,
        clientName: data.clientName,
        totalRevenue: data.totalRevenue,
        totalCost: data.totalCost,
        profit,
        profitMargin: Number(profitMargin.toFixed(2)),
        salesCount: data.salesCount,
      };
    });
  }

  async getBuybackForecast(params: ReportParamsDto): Promise<BuybackForecastItem[]> {
    const queryBuilder = this.buybackRepository
      .createQueryBuilder('buyback')
      .leftJoinAndSelect('buyback.client', 'client')
      .leftJoinAndSelect('buyback.items', 'items')
      .leftJoinAndSelect('items.originalSaleItem', 'originalSaleItem')
      .leftJoinAndSelect('originalSaleItem.batch', 'batch')
      .orderBy('buyback.plannedDate', 'ASC');

    if (params.startDate) {
      queryBuilder.andWhere('buyback.plannedDate >= :startDate', {
        startDate: params.startDate,
      });
    }

    if (params.endDate) {
      queryBuilder.andWhere('buyback.plannedDate <= :endDate', {
        endDate: params.endDate,
      });
    }

    const buybacks = await queryBuilder.getMany();

    return buybacks.map((buyback) => {
      let totalQuantity = 0;
      let estimatedRevenue = 0;
      let estimatedCost = 0;

      for (const item of buyback.items) {
        totalQuantity += item.quantity;
        estimatedRevenue +=
          item.quantity * Number(item.buybackPricePerUnit);
        estimatedCost +=
          item.quantity *
          Number(item.originalSaleItem.batch.purchasePricePerUnit);
      }

      const estimatedProfit = estimatedRevenue - estimatedCost;

      return {
        buybackId: buyback.id,
        clientName: buyback.client.fullName,
        plannedDate: buyback.plannedDate,
        status: buyback.status,
        totalQuantity,
        estimatedRevenue,
        estimatedCost,
        estimatedProfit,
      };
    });
  }

  async getCashFlow(params: ReportParamsDto): Promise<CashFlowItem[]> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.account', 'account')
      .select('DATE(transaction.created_at)', 'date')
      .addSelect('account.name', 'accountName')
      .addSelect('account.type', 'accountType')
      .addSelect(
        'SUM(CASE WHEN transaction.amount > 0 THEN transaction.amount ELSE 0 END)',
        'income',
      )
      .addSelect(
        'SUM(CASE WHEN transaction.amount < 0 THEN ABS(transaction.amount) ELSE 0 END)',
        'expense',
      )
      .addSelect('SUM(transaction.amount)', 'balance')
      .groupBy('DATE(transaction.created_at)')
      .addGroupBy('account.name')
      .addGroupBy('account.type')
      .orderBy('DATE(transaction.created_at)', 'DESC');

    if (params.startDate) {
      queryBuilder.andWhere('DATE(transaction.created_at) >= :startDate', {
        startDate: params.startDate,
      });
    }

    if (params.endDate) {
      queryBuilder.andWhere('DATE(transaction.created_at) <= :endDate', {
        endDate: params.endDate,
      });
    }

    if (params.accountId) {
      queryBuilder.andWhere('account.id = :accountId', {
        accountId: params.accountId,
      });
    }

    const results = await queryBuilder.getRawMany<{
      date: string;
      accountName: string;
      accountType: string;
      income: string;
      expense: string;
      balance: string;
    }>();

    return results.map((row) => ({
      date: row.date,
      accountName: row.accountName,
      accountType: row.accountType,
      income: Number(row.income) || 0,
      expense: Number(row.expense) || 0,
      balance: Number(row.balance) || 0,
    }));
  }

  async getClientActivity(params: ReportParamsDto): Promise<ClientActivityItem[]> {
    const where: Record<string, unknown> = {};

    if (params.clientId) {
      where.id = params.clientId;
    }

    const clients = await this.clientRepository.find({
      where,
      order: { fullName: 'ASC' },
    });

    const results: ClientActivityItem[] = [];

    for (const client of clients) {
      const saleQueryBuilder = this.saleRepository
        .createQueryBuilder('sale')
        .where('sale.clientId = :clientId', { clientId: client.id })
        .orderBy('sale.saleDate', 'DESC');

      if (params.startDate) {
        saleQueryBuilder.andWhere('sale.saleDate >= :startDate', {
          startDate: params.startDate,
        });
      }

      if (params.endDate) {
        saleQueryBuilder.andWhere('sale.saleDate <= :endDate', {
          endDate: params.endDate,
        });
      }

      const sales = await saleQueryBuilder.getMany();

      const buybacks = await this.buybackRepository.find({
        where: { clientId: client.id },
      });

      const totalRevenue = sales.reduce(
        (sum, sale) => sum + Number(sale.totalAmount),
        0,
      );

      const lastSale = sales[0];

      results.push({
        clientId: client.id,
        clientName: client.fullName,
        firstPurchaseDate: client.firstPurchaseDate
          ? new Date(client.firstPurchaseDate).toISOString().split('T')[0]
          : null,
        lastPurchaseDate: lastSale ? lastSale.saleDate : null,
        totalPurchases: sales.length,
        totalRevenue,
        buybacksCount: buybacks.length,
      });
    }

    return results;
  }

  async getInventorySummary(): Promise<
    Array<{
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
    }>
  > {
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
      supplierName: batch.shipment.supplier.name,
    }));
  }

  async getSalesByPeriod(
    params: ReportParamsDto & { groupBy?: 'day' | 'week' | 'month' },
  ): Promise<SalesByPeriodItem[]> {
    const groupBy = params.groupBy || 'month';
    const queryBuilder = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('items.batch', 'batch')
      .where('sale.status = :completedStatus', {
        completedStatus: SaleStatus.COMPLETED,
      });

    if (params.startDate) {
      queryBuilder.andWhere('sale.saleDate >= :startDate', {
        startDate: params.startDate,
      });
    }

    if (params.endDate) {
      queryBuilder.andWhere('sale.saleDate <= :endDate', {
        endDate: params.endDate,
      });
    }

    if (params.clientId) {
      queryBuilder.andWhere('sale.clientId = :clientId', {
        clientId: params.clientId,
      });
    }

    const sales = await queryBuilder
      .orderBy('sale.saleDate', 'ASC')
      .getMany();

    // Группируем продажи по периодам
    const periodMap = new Map<string, SalesByPeriodItem>();

    for (const sale of sales) {
      const saleDate = new Date(sale.saleDate);
      let periodKey: string;
      let periodStart: Date;
      let periodEnd: Date;

      switch (groupBy) {
        case 'day':
          periodKey = saleDate.toISOString().split('T')[0];
          periodStart = new Date(saleDate);
          periodStart.setHours(0, 0, 0, 0);
          periodEnd = new Date(saleDate);
          periodEnd.setHours(23, 59, 59, 999);
          break;
        case 'week': {
          const weekStart = new Date(saleDate);
          weekStart.setDate(saleDate.getDate() - saleDate.getDay());
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          periodKey = `${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}`;
          periodStart = weekStart;
          periodEnd = weekEnd;
          break;
        }
        case 'month':
        default: {
          const monthStart = new Date(saleDate.getFullYear(), saleDate.getMonth(), 1);
          const monthEnd = new Date(
            saleDate.getFullYear(),
            saleDate.getMonth() + 1,
            0,
          );
          monthEnd.setHours(23, 59, 59, 999);
          periodKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
          periodStart = monthStart;
          periodEnd = monthEnd;
          break;
        }
      }

      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, {
          period: periodKey,
          periodStart: periodStart.toISOString().split('T')[0],
          periodEnd: periodEnd.toISOString().split('T')[0],
          salesCount: 0,
          totalRevenue: 0,
          totalCost: 0,
          profit: 0,
          profitMargin: 0,
          averageSaleAmount: 0,
        });
      }

      const periodData = periodMap.get(periodKey)!;
      periodData.salesCount += 1;

      const saleRevenue = Number(sale.totalAmount);
      periodData.totalRevenue += saleRevenue;

      // Рассчитываем себестоимость через партии
      let saleCost = 0;
      for (const item of sale.items) {
        if (item.batch) {
          saleCost +=
            Number(item.batch.purchasePricePerUnit) * item.quantity;
        }
      }
      periodData.totalCost += saleCost;
    }

    // Рассчитываем прибыль и маржу для каждого периода
    const results = Array.from(periodMap.values()).map((item) => {
      item.profit = item.totalRevenue - item.totalCost;
      item.profitMargin =
        item.totalRevenue > 0
          ? (item.profit / item.totalRevenue) * 100
          : 0;
      item.averageSaleAmount =
        item.salesCount > 0 ? item.totalRevenue / item.salesCount : 0;
      return item;
    });

    // Сортируем по дате начала периода
    return results.sort((a, b) =>
      a.periodStart.localeCompare(b.periodStart),
    );
  }

  async getProfitByPlantType(
    params: ReportParamsDto,
  ): Promise<ProfitByPlantTypeItem[]> {
    const queryBuilder = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('items.batch', 'batch')
      .where('sale.status = :completedStatus', {
        completedStatus: SaleStatus.COMPLETED,
      });

    if (params.startDate) {
      queryBuilder.andWhere('sale.saleDate >= :startDate', {
        startDate: params.startDate,
      });
    }

    if (params.endDate) {
      queryBuilder.andWhere('sale.saleDate <= :endDate', {
        endDate: params.endDate,
      });
    }

    if (params.clientId) {
      queryBuilder.andWhere('sale.clientId = :clientId', {
        clientId: params.clientId,
      });
    }

    const sales = await queryBuilder.getMany();

    // Группируем по типам растений
    const plantTypeMap = new Map<string, ProfitByPlantTypeItem>();

    for (const sale of sales) {
      for (const item of sale.items) {
        if (!item.batch || !item.batch.plantType) {
          continue;
        }

        const plantType = item.batch.plantType;
        const quantity = item.quantity;
        const pricePerUnit = Number(item.salePricePerUnit);
        const costPerUnit = Number(item.batch.purchasePricePerUnit);

        if (!plantTypeMap.has(plantType)) {
          plantTypeMap.set(plantType, {
            plantType,
            totalQuantitySold: 0,
            totalRevenue: 0,
            totalCost: 0,
            profit: 0,
            profitMargin: 0,
            averagePricePerUnit: 0,
            averageCostPerUnit: 0,
            salesCount: 0,
          });
        }

        const plantData = plantTypeMap.get(plantType)!;
        plantData.totalQuantitySold += quantity;
        plantData.totalRevenue += pricePerUnit * quantity;
        plantData.totalCost += costPerUnit * quantity;
        plantData.salesCount += 1;
      }
    }

    // Рассчитываем итоговые метрики
    const results = Array.from(plantTypeMap.values()).map((item) => {
      item.profit = item.totalRevenue - item.totalCost;
      item.profitMargin =
        item.totalRevenue > 0 ? (item.profit / item.totalRevenue) * 100 : 0;
      item.averagePricePerUnit =
        item.totalQuantitySold > 0
          ? item.totalRevenue / item.totalQuantitySold
          : 0;
      item.averageCostPerUnit =
        item.totalQuantitySold > 0
          ? item.totalCost / item.totalQuantitySold
          : 0;
      return item;
    });

    // Сортируем по прибыли (по убыванию)
    return results.sort((a, b) => b.profit - a.profit);
  }

  async getReturnsAndWriteoffs(
    params: ReportParamsDto,
  ): Promise<ReturnsAndWriteoffsItem[]> {
    const queryBuilder = this.buybackRepository
      .createQueryBuilder('buyback')
      .leftJoinAndSelect('buyback.client', 'client')
      .leftJoinAndSelect('buyback.items', 'items')
      .leftJoinAndSelect('items.originalSaleItem', 'originalSaleItem')
      .leftJoinAndSelect('originalSaleItem.batch', 'batch')
      .where('buyback.status IN (:...statuses)', {
        statuses: [BuybackStatus.COMPLETED, BuybackStatus.DECLINED],
      });

    if (params.startDate) {
      queryBuilder.andWhere(
        '(buyback.plannedDate >= :startDate OR buyback.actualDate >= :startDate)',
        {
          startDate: params.startDate,
        },
      );
    }

    if (params.endDate) {
      queryBuilder.andWhere(
        '(buyback.plannedDate <= :endDate OR buyback.actualDate <= :endDate)',
        {
          endDate: params.endDate,
        },
      );
    }

    if (params.clientId) {
      queryBuilder.andWhere('buyback.clientId = :clientId', {
        clientId: params.clientId,
      });
    }

    const buybacks = await queryBuilder
      .orderBy('buyback.actualDate', 'DESC')
      .addOrderBy('buyback.plannedDate', 'DESC')
      .getMany();

    return buybacks.map((buyback) => {
      let totalQuantity = 0;
      let buybackAmount = 0;
      let originalCost = 0;

      for (const item of buyback.items) {
        totalQuantity += item.quantity;
        buybackAmount += item.quantity * Number(item.buybackPricePerUnit);
        originalCost +=
          item.quantity *
          Number(item.originalSaleItem.batch.purchasePricePerUnit);
      }

      // Для COMPLETED - это возврат, для DECLINED - это списание
      const type = buyback.status === BuybackStatus.COMPLETED ? 'return' : 'writeoff';
      // Для возврата убыток = себестоимость - сумма выкупа
      // Для списания убыток = себестоимость (товар списан без возврата)
      const loss =
        type === 'return'
          ? originalCost - buybackAmount
          : originalCost;

      return {
        buybackId: buyback.id,
        clientName: buyback.client.fullName,
        date: buyback.actualDate || buyback.plannedDate,
        status: buyback.status,
        type,
        totalQuantity,
        buybackAmount: type === 'return' ? buybackAmount : 0,
        originalCost,
        loss,
        notes: buyback.notes,
      };
    });
  }
}
