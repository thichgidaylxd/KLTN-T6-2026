// src/components/providers/WebSocketProvider.tsx

import { useWebSocket } from "@/hooks/websocket/useWebSocket";

/**
 * Mount component này 1 lần ở root layout (sau khi đã có Redux store).
 * Không render gì — chỉ chạy hook để duy trì WebSocket connection.
 *
 * Usage trong App.tsx hoặc RootLayout:
 *   <WebSocketProvider />
 *   <RouterProvider ... />
 */
export function WebSocketProvider() {
  useWebSocket();
  return null;
}