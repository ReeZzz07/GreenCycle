export interface Notification {
  id: number;
  userId: number;
  clientId: number | null;
  client: {
    id: number;
    fullName: string;
  } | null;
  buybackId: number | null;
  buyback: {
    id: number;
    plannedDate: string;
  } | null;
  message: string;
  isRead: boolean;
  dueDate: string;
  createdAt: string;
}

export interface CreateNotificationDto {
  userId: number;
  clientId?: number;
  buybackId?: number;
  message: string;
  isRead?: boolean;
  dueDate: string;
}

export interface UpdateNotificationDto {
  message?: string;
  isRead?: boolean;
  dueDate?: string;
}
