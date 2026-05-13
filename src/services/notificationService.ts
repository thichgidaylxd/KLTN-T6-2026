import { axiosInstance } from "../config/axios";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  referenceId: string;
  referenceType: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPage {
  content: NotificationItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface UnreadCountResponse {
  [key: string]: number;
}

export const notificationService = {
  getNotifications: async (page = 0, size = 20): Promise<NotificationPage> => {
    const response = await axiosInstance.get(`/api/v1/notifications`, {
      params: { page, size },
    });
    return response.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await axiosInstance.get(`/api/v1/notifications/unread-count`);
    // API returns a map of prop: count, we usually care about the total or the main one
    // Based on the example, it's a map. Let's sum the values or just return the first if it's total.
    const data = response.data.data;
    const total = Object.values(data).reduce((acc: number, val: any) => acc + (val || 0), 0);
    return total as number;
  },

  markAllAsRead: async (): Promise<void> => {
    await axiosInstance.patch(`/api/v1/notifications/read-all`);
  },
};
