import { apiClient } from '../config/api';

export interface OwnerEquity {
  userId: number;
  fullName: string;
  email: string;
  share: number; // Доля в процентах
  equityValue: string; // Доля из чистой прибыли в рублях
  availableCash: string; // Доступные средства (equityValue - денежные изъятия)
  totalInvestments: string; // Общая сумма вложений
  totalWithdrawals: string; // Общая сумма денежных изъятий
}

export interface EquitySummary {
  totalAssets: string; // Общая стоимость активов
  cashAssets: string; // Денежные активы (балансы счетов)
  inventoryAssets: string; // Стоимость товаров на складе
  ownersCount: number; // Количество владельцев
  owners: OwnerEquity[]; // Доли каждого владельца
}

interface EquityResponse {
  data: EquitySummary;
}

export const equityService = {
  async getEquity(): Promise<EquitySummary> {
    const response = await apiClient.get<EquityResponse>('/equity');
    return response.data.data;
  },
};

