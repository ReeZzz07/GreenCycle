import { apiClient } from '../config/api';
import {
  ReportParams,
  ProfitReportItem,
  ClientProfitReportItem,
  BuybackForecastItem,
  CashFlowItem,
  ClientActivityItem,
  InventoryItem,
  ProfitByPlantTypeItem,
  ReturnsAndWriteoffsItem,
} from '../types/reports';

interface ProfitReportResponse {
  data: ProfitReportItem[];
}

interface ClientProfitReportResponse {
  data: ClientProfitReportItem[];
}

interface BuybackForecastResponse {
  data: BuybackForecastItem[];
}

interface CashFlowResponse {
  data: CashFlowItem[];
}

interface ClientActivityResponse {
  data: ClientActivityItem[];
}

interface InventorySummaryResponse {
  data: InventoryItem[];
}

interface SalesByPeriodResponse {
  data: SalesByPeriodItem[];
}

interface ProfitByPlantTypeResponse {
  data: ProfitByPlantTypeItem[];
}

interface ReturnsAndWriteoffsResponse {
  data: ReturnsAndWriteoffsItem[];
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

export const reportsService = {
  async getProfitByShipment(params: ReportParams): Promise<ProfitReportItem[]> {
    const response = await apiClient.get<ProfitReportResponse>(
      '/reports/profit-by-shipment',
      { params },
    );
    return response.data.data;
  },

  async getProfitByClient(params: ReportParams): Promise<ClientProfitReportItem[]> {
    const response = await apiClient.get<ClientProfitReportResponse>(
      '/reports/profit-by-client',
      { params },
    );
    return response.data.data;
  },

  async getBuybackForecast(params: ReportParams): Promise<BuybackForecastItem[]> {
    const response = await apiClient.get<BuybackForecastResponse>(
      '/reports/buyback-forecast',
      { params },
    );
    return response.data.data;
  },

  async getCashFlow(params: ReportParams): Promise<CashFlowItem[]> {
    const response = await apiClient.get<CashFlowResponse>('/reports/cash-flow', {
      params,
    });
    return response.data.data;
  },

  async getClientActivity(params: ReportParams): Promise<ClientActivityItem[]> {
    const response = await apiClient.get<ClientActivityResponse>(
      '/reports/client-activity',
      { params },
    );
    return response.data.data;
  },

  async getInventorySummary(): Promise<InventoryItem[]> {
    const response = await apiClient.get<InventorySummaryResponse>(
      '/reports/inventory-summary',
    );
    return response.data.data;
  },

  async getSalesByPeriod(
    params: ReportParams & { groupBy?: 'day' | 'week' | 'month' },
  ): Promise<SalesByPeriodItem[]> {
    const response = await apiClient.get<SalesByPeriodResponse>(
      '/reports/sales-by-period',
      { params },
    );
    return response.data.data;
  },

  async getProfitByPlantType(
    params: ReportParams,
  ): Promise<ProfitByPlantTypeItem[]> {
    const response = await apiClient.get<ProfitByPlantTypeResponse>(
      '/reports/profit-by-plant-type',
      { params },
    );
    return response.data.data;
  },

  async getReturnsAndWriteoffs(
    params: ReportParams,
  ): Promise<ReturnsAndWriteoffsItem[]> {
    const response = await apiClient.get<ReturnsAndWriteoffsResponse>(
      '/reports/returns-and-writeoffs',
      { params },
    );
    return response.data.data;
  },
};
