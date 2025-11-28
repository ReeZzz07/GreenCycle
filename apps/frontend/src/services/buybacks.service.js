import { apiClient } from '../config/api';
export const buybacksService = {
    async getAll(status) {
        const params = status ? { status } : {};
        const response = await apiClient.get('/buybacks', { params });
        return response.data.data;
    },
    async getById(id) {
        const response = await apiClient.get(`/buybacks/${id}`);
        return response.data.data;
    },
    async create(dto) {
        const response = await apiClient.post('/buybacks', dto);
        return response.data.data;
    },
    async update(id, dto) {
        const response = await apiClient.patch(`/buybacks/${id}`, dto);
        return response.data.data;
    },
    async complete(id, actualDate) {
        const response = await apiClient.patch(`/buybacks/${id}/complete`, { actualDate });
        return response.data.data;
    },
    async decline(id) {
        const response = await apiClient.patch(`/buybacks/${id}/decline`);
        return response.data.data;
    },
    async delete(id) {
        await apiClient.delete(`/buybacks/${id}`);
    },
};
