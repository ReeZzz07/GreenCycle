import { apiClient } from '../config/api';
import { User, CreateUserDto, UpdateUserDto } from '../types/users';
import { User as AuthUser } from '../types/auth';

interface UserResponse {
  data: User;
}

interface AuthUserResponse {
  data: AuthUser;
}

interface UsersResponse {
  data: User[];
}

interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

interface MessageResponse {
  message: string;
}

export interface NotificationSettings {
  id: number;
  userId: number;
  emailEnabled: boolean;
  buybackRemindersEnabled: boolean;
  buybackReminder60Days: boolean;
  buybackReminder30Days: boolean;
  buybackReminder7Days: boolean;
  salesNotificationsEnabled: boolean;
  shipmentNotificationsEnabled: boolean;
  financeNotificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationSettingsResponse {
  data: NotificationSettings;
}

export interface UpdateNotificationSettingsDto {
  emailEnabled?: boolean;
  buybackRemindersEnabled?: boolean;
  buybackReminder60Days?: boolean;
  buybackReminder30Days?: boolean;
  buybackReminder7Days?: boolean;
  salesNotificationsEnabled?: boolean;
  shipmentNotificationsEnabled?: boolean;
  financeNotificationsEnabled?: boolean;
}

export const usersService = {
  async getCurrentUser(): Promise<AuthUser> {
    try {
      const response = await apiClient.get<AuthUserResponse>('/users/me');
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async getAll(): Promise<User[]> {
    const response = await apiClient.get<UsersResponse>('/users');
    return response.data.data;
  },

  async getById(id: number): Promise<User> {
    const response = await apiClient.get<UserResponse>(`/users/${id}`);
    return response.data.data;
  },

  async create(dto: CreateUserDto): Promise<User> {
    const response = await apiClient.post<UserResponse>('/users', dto);
    return response.data.data;
  },

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const response = await apiClient.patch<UserResponse>(`/users/${id}`, dto);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },

  async updateCurrentUser(dto: UpdateUserDto): Promise<AuthUser> {
    const response = await apiClient.patch<AuthUserResponse>('/users/me', dto);
    return response.data.data;
  },

  async changePassword(dto: ChangePasswordDto): Promise<void> {
    const response = await apiClient.patch<MessageResponse>('/users/me/password', dto);
    return;
  },

  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await apiClient.get<NotificationSettingsResponse>(
      '/users/me/notification-settings',
    );
    return response.data.data;
  },

  async updateNotificationSettings(
    dto: UpdateNotificationSettingsDto,
  ): Promise<NotificationSettings> {
    const response = await apiClient.patch<NotificationSettingsResponse>(
      '/users/me/notification-settings',
      dto,
    );
    return response.data.data;
  },
};
