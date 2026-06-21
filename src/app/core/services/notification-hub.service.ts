import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import {
  HubConnectionBuilder,
  HubConnection,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Notification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationHubService implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly notifService = inject(NotificationService);
  private readonly toastService = inject(ToastService);
  private connection?: HubConnection;
  private retryTimer?: ReturnType<typeof setTimeout>;

  readonly isConnected = signal(false);

  async startConnection(): Promise<void> {
    const state = this.connection?.state;
    if (
      state === HubConnectionState.Connected ||
      state === HubConnectionState.Connecting ||
      state === HubConnectionState.Reconnecting
    ) return;

    this.connection = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/hubs/notifications`, {
        accessTokenFactory: () => this.auth.token() ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    this.connection.on('ReceiveNotification', (notification: Notification) => {
      this.notifService.prependNotification(notification);
      this.toastService.show(notification.title, notification.message, 'info');
    });

    this.connection.onreconnecting(() => {
      this.isConnected.set(false);
      console.log('[NotifHub] Reconnecting…');
    });

    this.connection.onreconnected(() => {
      this.isConnected.set(true);
      console.log('[NotifHub] Reconnected — refreshing unread count');
      this.notifService.loadUnreadCount().subscribe({ error: () => {} });
    });

    this.connection.onclose(err => {
      this.isConnected.set(false);
      if (err) {
        console.error('[NotifHub] Connection closed with error:', err);
        this.retryTimer = setTimeout(() => this.startConnection(), 60_000);
      }
    });

    try {
      await this.connection.start();
      this.isConnected.set(true);
      console.log('[NotifHub] Connected');
    } catch (err) {
      this.isConnected.set(false);
      console.error('[NotifHub] Failed to start connection:', err);
    }
  }

  async stopConnection(): Promise<void> {
    clearTimeout(this.retryTimer);
    this.isConnected.set(false);
    try {
      await this.connection?.stop();
    } catch {
      // ignore errors on disconnect
    }
  }

  ngOnDestroy(): void {
    this.stopConnection();
  }
}
