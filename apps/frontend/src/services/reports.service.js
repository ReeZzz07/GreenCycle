import { apiClient } from '../config/api';
export const reportsService = {
    async getProfitByShipment(params) {
        const response = await apiClient.get('/reports/profit-by-shipment', { params });
        return response.data.data;
    },
    async getProfitByClient(params) {
        const response = await apiClient.get('/reports/profit-by-client', { params });
        return response.data.data;
    },
    async getBuybackForecast(params) {
        const response = await apiClient.get('/reports/buyback-forecast', { params });
        return response.data.data;
    },
    async getCashFlow(params) {
        const response = await apiClient.get('/reports/cash-flow', {
            params,
        });
        return response.data.data;
    },
    async getClientActivity(params) {
        const response = await apiClient.get('/reports/client-activity', { params });
        return response.data.data;
    },
    async getInventorySummary() {
        const response = await apiClient.get('/reports/inventory-summary');
        return response.data.data;
    },
    async getSalesByPeriod(params) {
        const response = await apiClient.get('/reports/sales-by-period', { params });
        return response.data.data;
    },
    async getProfitByPlantType(params) {
        const response = await apiClient.get('/reports/profit-by-plant-type', { params });
        return response.data.data;
    },
    async getReturnsAndWriteoffs(params) {
        const response = await apiClient.get('/reports/returns-and-writeoffs', { params });
        return response.data.data;
    },
};
