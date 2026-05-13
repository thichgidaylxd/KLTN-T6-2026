import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../../services/notificationService";

export const useNotifications = (page = 0, size = 20) => {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ["notifications", page, size],
    queryFn: () => notificationService.getNotifications(page, size),
  });

  const unreadCountQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 60000, // Tự động làm mới sau mỗi 1 phút
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  return {
    notifications: notificationsQuery.data,
    isLoading: notificationsQuery.isLoading,
    unreadCount: unreadCountQuery.data ?? 0,
    isUnreadLoading: unreadCountQuery.isLoading,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingRead: markAllAsReadMutation.isPending,
  };
};
