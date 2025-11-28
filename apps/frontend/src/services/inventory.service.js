import { apiClient } from '../config/api';
export const inventoryService = {
    async getSummary() {
        const response = await apiClient.get('/inventory');
        return response.data.data;
    },
    async getWriteOffs() {
        const response = await apiClient.get('/inventory/write-offs');
        return response.data.data;
    },
    async createWriteOff(dto) {
        const response = await apiClient.post('/inventory/write-offs', dto);
        return response.data.data;
    },
    async recalculateStock() {
        const response = await apiClient.post('/inventory/recalculate');
        return response.data.data;
    },
    async getBatchDetails(batchId) {
        const response = await apiClient.get(`/inventory/${batchId}/details`);
        return response.data.data;
    },
};
