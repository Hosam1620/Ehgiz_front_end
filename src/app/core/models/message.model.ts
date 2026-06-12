import { UserProfile } from './user.model';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
  
  // Relations
  sender?: UserProfile;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
  
  // Relations
  otherParticipant?: UserProfile;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
}

export interface StartConversationRequest {
  recipientId: string;
  content: string;
}
