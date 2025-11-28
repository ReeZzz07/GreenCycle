import { apiClient } from '../config/api';
import {
  Notification,
  CreateNotificationDto,
  UpdateNotificationDto,
} from '../types/notifications';

interface NotificationsResponse {
  data: Notification[];
}

interface NotificationResponse {
  data: Notification;
}

interface UnreadCountResponse {
  data: { count: number };
}

export const notificationsService = {
  async getAll(userId?: number, isRead?: boolean): Promise<Notification[]> {
    const params: Record<string, string | number> = {};
    if (userId) params.userId = userId;
    if (isRead !== undefined) params.isRead = isRead.toString();
    const response = await apiClient.get<NotificationsResponse>('/notifications', {
      params,
    });
    return response.data.data;
  },

  async getMy(isRead?: boolean): Promise<Notification[]> {
    const params = isRead !== undefined ? { isRead: isRead.toString() } : {};
    const response = await apiClient.get<NotificationsResponse>('/notifications/my', {
      params,
    });
    return response.data.data;
  },

  async getUpcoming(days: number = 30): Promise<Notification[]> {
    const response = await apiClient.get<NotificationsResponse>(
      '/notifications/upcoming',
      { params: { days } },
    );
    return response.data.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<UnreadCountResponse>(
      '/notifications/unread-count',
    );
    return response.data.data.count;
  },

  async getById(id: number): Promise<Notification> {
    const response = await apiClient.get<NotificationResponse>(`/notifications/${id}`);
    return response.data.data;
  },

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const response = await apiClient.post<NotificationResponse>('/notifications', dto);
    return response.data.data;
  },

  async update(id: number, dto: UpdateNotificationDto): Promise<Notification> {
    const response = await apiClient.patch<NotificationResponse>(
      `/notifications/${id}`,
      dto,
    );
    return response.data.data;
  },

  async markAsRead(id: number): Promise<Notification> {
    const response = await apiClient.patch<NotificationResponse>(
      `/notifications/${id}/read`,
    );
    return response.data.data;
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },
};
