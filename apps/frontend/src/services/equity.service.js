import { apiClient } from '../config/api';
export const equityService = {
    async getEquity() {
        const response = await apiClient.get('/equity');
        return response.data.data;
    },
};
