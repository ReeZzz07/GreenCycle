import { apiClient } from '../config/api';
import {
  Buyback,
  CreateBuybackDto,
  UpdateBuybackDto,
  BuybackStatus,
} from '../types/buybacks';

interface BuybacksResponse {
  data: Buyback[];
}

interface BuybackResponse {
  data: Buyback;
}

export const buybacksService = {
  async getAll(status?: BuybackStatus): Promise<Buyback[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get<BuybacksResponse>('/buybacks', { params });
    return response.data.data;
  },

  async getById(id: number): Promise<Buyback> {
    const response = await apiClient.get<BuybackResponse>(`/buybacks/${id}`);
    return response.data.data;
  },

  async create(dto: CreateBuybackDto): Promise<Buyback> {
    const response = await apiClient.post<BuybackResponse>('/buybacks', dto);
    return response.data.data;
  },

  async update(id: number, dto: UpdateBuybackDto): Promise<Buyback> {
    const response = await apiClient.patch<BuybackResponse>(`/buybacks/${id}`, dto);
    return response.data.data;
  },

  async complete(id: number, actualDate?: string): Promise<Buyback> {
    const response = await apiClient.patch<BuybackResponse>(
      `/buybacks/${id}/complete`,
      { actualDate },
    );
    return response.data.data;
  },

  async decline(id: number): Promise<Buyback> {
    const response = await apiClient.patch<BuybackResponse>(`/buybacks/${id}/decline`);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/buybacks/${id}`);
  },
};
