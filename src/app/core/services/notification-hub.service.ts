import { Injectable, inject, signal, OnDestroy, NgZone } from '@angular/core';
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
import { Notification, NotificationHubEvent } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationHubService implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly ngZone = inject(NgZone);
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

    // Event name must match exactly what the server's notification broadcaster emits
    // ("ReceiveNotification"). A mismatch silently drops every push, which is why
    // notifications only appeared after a manual refresh.
    this.connection.on('ReceiveNotification', (payload: Notification | NotificationHubEvent) => {
      this.ngZone.run(() => {
        const notification = this.unwrapNotification(payload);
        this.notifService.prependNotification(notification);
        this.toastService.show(notification.title, notification.message, 'info');
      });
    });

    this.connection.on('ReadStateChanged', () => {
      this.ngZone.run(() => {
        this.notifService.loadUnreadCount().subscribe({ error: () => {} });
      });
    });

    this.connection.onreconnecting(() => {
      this.ngZone.run(() => this.isConnected.set(false));
      if (!environment.production) console.log('[NotifHub] Reconnecting…');
    });

    this.connection.onreconnected(() => {
      this.ngZone.run(() => {
        this.isConnected.set(true);
        this.notifService.loadUnreadCount().subscribe({ error: () => {} });
      });
      if (!environment.production) console.log('[NotifHub] Reconnected, refreshing unread count');
    });

    this.connection.onclose(err => {
      this.ngZone.run(() => this.isConnected.set(false));
      if (err) {
        console.error('[NotifHub] Connection closed with error:', err);
        this.retryTimer = setTimeout(() => this.startConnection(), 60_000);
      }
    });

    try {
      await this.connection.start();
      this.ngZone.run(() => this.isConnected.set(true));
      if (!environment.production) console.log('[NotifHub] Connected');
    } catch (err) {
      this.ngZone.run(() => this.isConnected.set(false));
      console.error('[NotifHub] Failed to start connection:', err);
      this.retryTimer = setTimeout(() => this.startConnection(), 5_000);
    }
  }

  private unwrapNotification(payload: Notification | NotificationHubEvent): Notification {
    if (payload && typeof payload === 'object' && 'notification' in payload && payload.notification) {
      return payload.notification;
    }
    return payload as Notification;
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
