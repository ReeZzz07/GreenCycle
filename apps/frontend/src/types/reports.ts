export interface ReportParams {
  startDate?: string;
  endDate?: string;
  clientId?: number;
  shipmentId?: number;
  accountId?: number;
  groupBy?: 'day' | 'week' | 'month';
}

export interface ProfitReportItem {
  shipmentId: number;
  shipmentDate: string;
  supplierName: string;
  totalCost: number;
  totalRevenue: number;
  profit: number;
  profitMargin: number;
}

export interface ClientProfitReportItem {
  clientId: number;
  clientName: string;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  salesCount: number;
}

export interface BuybackForecastItem {
  buybackId: number;
  clientName: string;
  plannedDate: string;
  status: string;
  totalQuantity: number;
  estimatedRevenue: number;
  estimatedCost: number;
  estimatedProfit: number;
}

export interface CashFlowItem {
  date: string;
  accountName: string;
  accountType: string;
  income: number;
  expense: number;
  balance: number;
}

export interface ClientActivityItem {
  clientId: number;
  clientName: string;
  firstPurchaseDate: string | null;
  lastPurchaseDate: string | null;
  totalPurchases: number;
  totalRevenue: number;
  buybacksCount: number;
}

export interface InventoryItem {
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
}

export interface SalesByPeriodItem {
  period: string;
  periodStart: string;
  periodEnd: string;
  salesCount: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  averageSaleAmount: number;
}

export interface ProfitByPlantTypeItem {
  plantType: string;
  totalQuantitySold: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  averagePricePerUnit: number;
  averageCostPerUnit: number;
  salesCount: number;
}

export interface ReturnsAndWriteoffsItem {
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
}
