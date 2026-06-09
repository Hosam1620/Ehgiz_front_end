export type NotificationType = 'booking' | 'review' | 'message' | 'payment' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: string;
}
