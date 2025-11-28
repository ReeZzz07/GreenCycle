import { apiClient } from '../config/api';
export const suppliersService = {
    async getAll(search) {
        const params = search ? { search } : {};
        const response = await apiClient.get('/suppliers', { params });
        return response.data.data;
    },
    async getById(id) {
        const response = await apiClient.get(`/suppliers/${id}`);
        return response.data.data;
    },
    async create(dto) {
        const response = await apiClient.post('/suppliers', dto);
        return response.data.data;
    },
    async update(id, dto) {
        const response = await apiClient.patch(`/suppliers/${id}`, dto);
        return response.data.data;
    },
    async delete(id) {
        await apiClient.delete(`/suppliers/${id}`);
    },
};
