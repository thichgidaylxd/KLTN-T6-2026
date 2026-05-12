
import { useEffect, useRef } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { toast } from 'sonner';
import { ENV } from '@/config/env';

interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  body: string;
  referenceId?: string;
  referenceType?: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * Tự động kết nối WebSocket khi user đã đăng nhập.
 * Subscribe /user/{userId}/queue/notifications để nhận realtime toast.
 * Disconnect khi logout hoặc unmount.
 */
export function useWebSocket() {
  const { accessToken, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    // Không kết nối nếu chưa login
    if (!isAuthenticated || !accessToken) {
      // Nếu đang kết nối mà logout → disconnect
      if (clientRef.current?.active) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
      return;
    }

    // Tránh tạo nhiều connection
    if (clientRef.current?.active) return;

    const client = new Client({
      // SockJS làm transport layer, fallback cho môi trường không support WebSocket thuần
      webSocketFactory: () =>
        new SockJS(`${ENV.API_BASE_URL}/ws`) as WebSocket,

      // Gắn JWT vào STOMP header — server dùng để authenticate
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },

      reconnectDelay: 5000,   // Tự reconnect sau 5s nếu mất kết nối
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.debug('[WS] Connected');

        // Subscribe channel user-specific
        client.subscribe(
          `/user/queue/notifications`,
          (message: IMessage) => {
            try {
              const notification: NotificationPayload = JSON.parse(message.body);
              showNotificationToast(notification);
            } catch (e) {
              console.error('[WS] Parse error:', e);
            }
          },
        );
      },

      onDisconnect: () => {
        console.debug('[WS] Disconnected');
      },

      onStompError: (frame) => {
        console.error('[WS] STOMP error:', frame.headers['message']);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  // Reconnect nếu token thay đổi (vd: chọn farm khác)
  }, [isAuthenticated, accessToken]);
}

// ── Toast renderer ────────────────────────────────────────────────────────────

function showNotificationToast(n: NotificationPayload) {
  const icon = resolveIcon(n.type);

  toast(n.title, {
    description: n.body,
    icon,
    duration: 5000,
    position: 'top-right',
    // Cho phép click để navigate sau này nếu cần
    // action: n.referenceId ? { label: 'Xem', onClick: () => ... } : undefined,
  });
}

function resolveIcon(type: string): string {
  switch (type) {
    case 'TASK_ASSIGNED': return '📋';
    case 'TASK_CREATED':  return '✅';
    case 'TASK_UPDATED':  return '✏️';
    case 'TASK_OVERDUE':  return '⚠️';
    default:              return '🔔';
  }
}