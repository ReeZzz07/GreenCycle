import { apiClient } from '../config/api';
export const notificationsService = {
    async getAll(userId, isRead) {
        const params = {};
        if (userId)
            params.userId = userId;
        if (isRead !== undefined)
            params.isRead = isRead.toString();
        const response = await apiClient.get('/notifications', {
            params,
        });
        return response.data.data;
    },
    async getMy(isRead) {
        const params = isRead !== undefined ? { isRead: isRead.toString() } : {};
        const response = await apiClient.get('/notifications/my', {
            params,
        });
        return response.data.data;
    },
    async getUpcoming(days = 30) {
        const response = await apiClient.get('/notifications/upcoming', { params: { days } });
        return response.data.data;
    },
    async getUnreadCount() {
        const response = await apiClient.get('/notifications/unread-count');
        return response.data.data.count;
    },
    async getById(id) {
        const response = await apiClient.get(`/notifications/${id}`);
        return response.data.data;
    },
    async create(dto) {
        const response = await apiClient.post('/notifications', dto);
        return response.data.data;
    },
    async update(id, dto) {
        const response = await apiClient.patch(`/notifications/${id}`, dto);
        return response.data.data;
    },
    async markAsRead(id) {
        const response = await apiClient.patch(`/notifications/${id}/read`);
        return response.data.data;
    },
    async markAllAsRead() {
        await apiClient.patch('/notifications/read-all');
    },
    async delete(id) {
        await apiClient.delete(`/notifications/${id}`);
    },
};
