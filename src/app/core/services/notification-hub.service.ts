import { Injectable, inject, OnDestroy } from '@angular/core';
import {
  HubConnectionBuilder,
  HubConnection,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Notification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationHubService implements OnDestroy {
  private readonly notifService = inject(NotificationService);
  private readonly toastService = inject(ToastService);
  private connection?: HubConnection;

  get isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }

  async startConnection(token: string): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) return;

    this.connection = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/hubs/notifications`, {
        accessTokenFactory: () => token,
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
      if (err) console.error('[Hub] Connection closed with error:', err);
    });

    try {
      await this.connection.start();
    } catch (err) {
      console.error('[Hub] Failed to start connection:', err);
    }
  }

  async stopConnection(): Promise<void> {
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
