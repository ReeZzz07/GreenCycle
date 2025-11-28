import { apiClient } from '../config/api';
import { Sale, CreateSaleDto } from '../types/sales';

interface SalesResponse {
  data: Sale[];
}

interface SaleResponse {
  data: Sale;
}

export const salesService = {
  async getAll(): Promise<Sale[]> {
    const response = await apiClient.get<SalesResponse>('/sales');
    return response.data.data;
  },

  async getById(id: number): Promise<Sale> {
    const response = await apiClient.get<SaleResponse>(`/sales/${id}`);
    return response.data.data;
  },

  async create(dto: CreateSaleDto): Promise<Sale> {
    const { accountId, ...saleData } = dto;
    const params = accountId ? { accountId: accountId.toString() } : {};
    const response = await apiClient.post<SaleResponse>('/sales', saleData, {
      params,
    });
    return response.data.data;
  },

  async cancel(id: number): Promise<Sale> {
    const response = await apiClient.patch<SaleResponse>(`/sales/${id}/cancel`);
    return response.data.data;
  },

  async updateStatus(id: number, status: 'completed' | 'cancelled'): Promise<Sale> {
    const response = await apiClient.patch<SaleResponse>(`/sales/${id}/status`, { status });
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/sales/${id}`);
  },
};
