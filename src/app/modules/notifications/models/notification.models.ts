export type NotificationType = 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface NotificationDto {
  id: number;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  routeUrl: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationPageResponse {
  content: NotificationDto[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  unreadCount: number;
}

export interface NotificationCountResponse {
  unreadCount: number;
}
