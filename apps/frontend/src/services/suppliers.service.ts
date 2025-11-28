import { apiClient } from '../config/api';
import { Supplier, CreateSupplierDto, UpdateSupplierDto } from '../types/suppliers';

interface SuppliersResponse {
  data: Supplier[];
}

interface SupplierResponse {
  data: Supplier;
}

export const suppliersService = {
  async getAll(search?: string): Promise<Supplier[]> {
    const params = search ? { search } : {};
    const response = await apiClient.get<SuppliersResponse>('/suppliers', { params });
    return response.data.data;
  },

  async getById(id: number): Promise<Supplier> {
    const response = await apiClient.get<SupplierResponse>(`/suppliers/${id}`);
    return response.data.data;
  },

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    const response = await apiClient.post<SupplierResponse>('/suppliers', dto);
    return response.data.data;
  },

  async update(id: number, dto: UpdateSupplierDto): Promise<Supplier> {
    const response = await apiClient.patch<SupplierResponse>(`/suppliers/${id}`, dto);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/suppliers/${id}`);
  },
};
