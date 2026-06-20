export type NotificationType = 'booking' | 'review' | 'message' | 'payment' | 'system';

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType | string;
  title: string;
  message: string;
  isRead: boolean;
  url: string | null;
  createdAt: string;
}

export interface NotificationHubEvent {
  notification: Notification;
  timestamp: string;
}
