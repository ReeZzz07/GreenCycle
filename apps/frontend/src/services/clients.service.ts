import { apiClient } from '../config/api';
import { Client, CreateClientDto, UpdateClientDto } from '../types/clients';

interface ClientsResponse {
  data: Client[];
}

interface ClientResponse {
  data: Client;
}

export const clientsService = {
  async getAll(search?: string): Promise<Client[]> {
    const params = search ? { search } : {};
    const response = await apiClient.get<ClientsResponse>('/clients', { params });
    return response.data.data;
  },

  async getById(id: number): Promise<Client> {
    const response = await apiClient.get<ClientResponse>(`/clients/${id}`);
    return response.data.data;
  },

  async create(dto: CreateClientDto): Promise<Client> {
    const response = await apiClient.post<ClientResponse>('/clients', dto);
    return response.data.data;
  },

  async update(id: number, dto: UpdateClientDto): Promise<Client> {
    const response = await apiClient.patch<ClientResponse>(`/clients/${id}`, dto);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/clients/${id}`);
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
    }>('/clients/bulk/delete', { ids });
    return response.data.data;
  },

  async importFromExcel(file: File): Promise<{
    success: number;
    failed: Array<{ row: number; error: string; data: Record<string, unknown> }>;
    total: number;
    successCount: number;
    failedCount: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{
      data: {
        success: number;
        failed: Array<{ row: number; error: string; data: Record<string, unknown> }>;
        total: number;
        successCount: number;
        failedCount: number;
      };
    }>('/clients/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
};
