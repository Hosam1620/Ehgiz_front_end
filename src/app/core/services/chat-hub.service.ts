import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import {
  HubConnectionBuilder,
  HubConnection,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { MessageDto } from '../models/message.model';

export interface MessagesReadEvent {
  conversationId: number;
}

export interface UserTypingEvent {
  conversationId: number;
  userId: number;
  isTyping: boolean;
}

@Injectable({ providedIn: 'root' })
export class ChatHubService implements OnDestroy {
  private readonly auth = inject(AuthService);
  private connection?: HubConnection;
  private retryTimer?: ReturnType<typeof setTimeout>;

  /** Emits every time the server pushes a new message to us */
  readonly messageReceived$ = new Subject<MessageDto>();

  /** Emits when the other user reads our messages */
  readonly messagesRead$ = new Subject<MessagesReadEvent>();

  /** Emits typing start/stop events from the other user */
  readonly userTyping$ = new Subject<UserTypingEvent>();

  readonly isConnected = signal(false);

  get state(): HubConnectionState | undefined {
    return this.connection?.state;
  }

  async startConnection(): Promise<void> {
    const state = this.connection?.state;
    if (
      state === HubConnectionState.Connected ||
      state === HubConnectionState.Connecting ||
      state === HubConnectionState.Reconnecting
    ) return;

    this.connection = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/hubs/chat`, {
        accessTokenFactory: () => this.auth.token() ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    this.connection.on('ReceiveMessage', (message: MessageDto) => {
      this.messageReceived$.next(message);
    });

    this.connection.on('MessagesRead', (data: MessagesReadEvent) => {
      this.messagesRead$.next(data);
    });

    this.connection.on('UserTyping', (data: UserTypingEvent) => {
      this.userTyping$.next(data);
    });

    this.connection.onreconnecting(() => {
      this.isConnected.set(false);
      console.log('[ChatHub] Reconnecting…');
    });

    this.connection.onreconnected(() => {
      this.isConnected.set(true);
      console.log('[ChatHub] Reconnected');
    });

    this.connection.onclose(err => {
      this.isConnected.set(false);
      if (err) {
        console.error('[ChatHub] Closed with error:', err);
        this.retryTimer = setTimeout(() => this.startConnection(), 60_000);
      }
    });

    try {
      await this.connection.start();
      this.isConnected.set(true);
    } catch (err) {
      console.error('[ChatHub] Failed to start:', err);
    }
  }

  async stopConnection(): Promise<void> {
    clearTimeout(this.retryTimer);
    this.isConnected.set(false);
    try {
      await this.connection?.stop();
    } catch {
      // ignore
    }
  }

  async startTyping(conversationId: number): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) {
      await this.connection.invoke('StartTyping', conversationId).catch(() => {});
    }
  }

  async stopTyping(conversationId: number): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) {
      await this.connection.invoke('StopTyping', conversationId).catch(() => {});
    }
  }

  ngOnDestroy(): void {
    this.stopConnection();
  }
}
