import { apiClient } from '../config/api';
export const salesService = {
    async getAll() {
        const response = await apiClient.get('/sales');
        return response.data.data;
    },
    async getById(id) {
        const response = await apiClient.get(`/sales/${id}`);
        return response.data.data;
    },
    async create(dto) {
        const { accountId, ...saleData } = dto;
        const params = accountId ? { accountId: accountId.toString() } : {};
        const response = await apiClient.post('/sales', saleData, {
            params,
        });
        return response.data.data;
    },
    async cancel(id) {
        const response = await apiClient.patch(`/sales/${id}/cancel`);
        return response.data.data;
    },
    async updateStatus(id, status) {
        const response = await apiClient.patch(`/sales/${id}/status`, { status });
        return response.data.data;
    },
    async delete(id) {
        await apiClient.delete(`/sales/${id}`);
    },
};
