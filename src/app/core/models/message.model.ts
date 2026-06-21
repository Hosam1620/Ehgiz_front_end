export interface ConversationDto {
  id: number;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatarUrl: string | null;
  updatedAt: string;
  lastMessage: MessageDto | null;
  unreadCount: number;
}

export interface MessageDto {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatarUrl: string | null;
  content: string;
  status: 'Sent' | 'Delivered' | 'Read';
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
}

export interface SendMessageDto {
  content: string;
}

export interface StartConversationDto {
  recipientId: number;
}
