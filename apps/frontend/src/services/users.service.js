import { apiClient } from '../config/api';
export const usersService = {
    async getCurrentUser() {
        try {
            const response = await apiClient.get('/users/me');
            return response.data.data;
        }
        catch (error) {
            throw error;
        }
    },
    async getAll() {
        const response = await apiClient.get('/users');
        return response.data.data;
    },
    async getById(id) {
        const response = await apiClient.get(`/users/${id}`);
        return response.data.data;
    },
    async create(dto) {
        const response = await apiClient.post('/users', dto);
        return response.data.data;
    },
    async update(id, dto) {
        const response = await apiClient.patch(`/users/${id}`, dto);
        return response.data.data;
    },
    async delete(id) {
        await apiClient.delete(`/users/${id}`);
    },
    async updateCurrentUser(dto) {
        const response = await apiClient.patch('/users/me', dto);
        return response.data.data;
    },
    async changePassword(dto) {
        const response = await apiClient.patch('/users/me/password', dto);
        return;
    },
    async getNotificationSettings() {
        const response = await apiClient.get('/users/me/notification-settings');
        return response.data.data;
    },
    async updateNotificationSettings(dto) {
        const response = await apiClient.patch('/users/me/notification-settings', dto);
        return response.data.data;
    },
};
