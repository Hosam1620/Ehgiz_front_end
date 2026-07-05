export type NotificationType =
  | 'booking'
  | 'payment'
  | 'message'
  | 'review'
  | 'issuereport'
  | 'system'
  | 'handoverpending'
  | 'handoveraccepted'
  | 'handoverdisputed'
  | 'disputeresolved'
  | 'savedsearchmatch';

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType | string;
  title: string;
  message: string;
  isRead: boolean;
  url: string | null;
  createdAt: string;
  // Optional fields the backend may include for message notifications
  conversationId?: number | null;
  senderId?: number | null;
}

export interface NotificationHubEvent {
  notification: Notification;
  timestamp: string;
}
