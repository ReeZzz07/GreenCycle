import { apiClient } from '../config/api';
import {
  Shipment,
  CreateShipmentDto,
  UpdateShipmentDto,
  ShipmentDocumentAttachment,
} from '../types/shipments';

interface ShipmentsResponse {
  data: Shipment[];
}

interface ShipmentResponse {
  data: Shipment;
}

interface UploadResponse {
  data: {
    url: string;
    name?: string;
  };
}

export const shipmentsService = {
  async getAll(): Promise<Shipment[]> {
    const response = await apiClient.get<ShipmentsResponse>('/shipments');
    return response.data.data;
  },

  async getById(id: number): Promise<Shipment> {
    const response = await apiClient.get<ShipmentResponse>(`/shipments/${id}`);
    return response.data.data;
  },

  async create(dto: CreateShipmentDto): Promise<Shipment> {
    const response = await apiClient.post<ShipmentResponse>('/shipments', dto);
    return response.data.data;
  },

  async update(id: number, dto: UpdateShipmentDto): Promise<Shipment> {
    const response = await apiClient.patch<ShipmentResponse>(`/shipments/${id}`, dto);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/shipments/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<{
    success: number[];
    failed: Array<{ id: number; error: string }>;
    total: number;
    successCount: number;
    failedCount: number;
  }> {
    const response = await apiClient.post<{
      data: {
        success: number[];
        failed: Array<{ id: number; error: string }>;
        total: number;
        successCount: number;
        failedCount: number;
      };
    }>('/shipments/bulk/delete', { ids });
    return response.data.data;
  },

  async uploadDocument(file: File): Promise<ShipmentDocumentAttachment> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<UploadResponse>(
      '/shipments/documents/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return {
      url: response.data.data.url,
      name: response.data.data.name ?? file.name,
      persisted: false,
    };
  },

  async deleteDocument(url: string): Promise<void> {
    await apiClient.delete('/shipments/documents', {
      data: { url },
    });
  },
};
