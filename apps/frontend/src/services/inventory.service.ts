import { apiClient } from '../config/api';
import {
  InventoryItem,
  WriteOff,
  CreateWriteOffDto,
  InventoryRecalculateResult,
  BatchDetails,
} from '../types/inventory';

interface InventoryResponse {
  data: InventoryItem[];
}

interface WriteOffsResponse {
  data: WriteOff[];
}

interface WriteOffResponse {
  data: WriteOff;
}

interface InventoryRecalculateResponse {
  data: InventoryRecalculateResult;
}

interface BatchDetailsResponse {
  data: BatchDetails;
}

export const inventoryService = {
  async getSummary(): Promise<InventoryItem[]> {
    const response = await apiClient.get<InventoryResponse>('/inventory');
    return response.data.data;
  },

  async getWriteOffs(): Promise<WriteOff[]> {
    const response = await apiClient.get<WriteOffsResponse>('/inventory/write-offs');
    return response.data.data;
  },

  async createWriteOff(dto: CreateWriteOffDto): Promise<WriteOff> {
    const response = await apiClient.post<WriteOffResponse>(
      '/inventory/write-offs',
      dto,
    );
    return response.data.data;
  },

  async recalculateStock(): Promise<InventoryRecalculateResult> {
    const response = await apiClient.post<InventoryRecalculateResponse>(
      '/inventory/recalculate',
    );
    return response.data.data;
  },

  async getBatchDetails(batchId: number): Promise<BatchDetails> {
    const response = await apiClient.get<BatchDetailsResponse>(
      `/inventory/${batchId}/details`,
    );
    return response.data.data;
  },
};
