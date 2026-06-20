import { Injectable, inject, OnDestroy } from '@angular/core';
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

  get isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }

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

    this.connection.onreconnecting(() => console.log('[Hub] Reconnecting…'));
    this.connection.onreconnected(() => console.log('[Hub] Reconnected'));
    this.connection.onclose(err => {
      if (err) {
        console.error('[Hub] Connection closed with error:', err);
        // Retry after the automatic budget is exhausted
        this.retryTimer = setTimeout(() => this.startConnection(), 60_000);
      }
    });

    try {
      await this.connection.start();
    } catch (err) {
      console.error('[Hub] Failed to start connection:', err);
    }
  }

  async stopConnection(): Promise<void> {
    clearTimeout(this.retryTimer);
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
