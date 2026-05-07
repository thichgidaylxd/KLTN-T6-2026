import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/user/userService';
import { toast } from 'sonner';

export const USER_KEYS = {
  all: ['users'] as const,
  needVerification: ['users', 'need-verification'] as const,
};

export const useUsers = () => {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: USER_KEYS.all,
    queryFn: async () => {
      const response = await userService.getAllUsers();
      return response.data;
    },
  });

  const needVerificationQuery = useQuery({
    queryKey: USER_KEYS.needVerification,
    queryFn: async () => {
      const response = await userService.getUsersNeedVerification();
      return response.data;
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => userService.deleteUser(userId),
    onSuccess: (response) => {
      toast.success(response.message || 'Xóa người dùng thành công');
      void queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: USER_KEYS.needVerification });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi xóa người dùng');
    },
  });

  return {
    users: usersQuery.data ?? [],
    loadingUsers: usersQuery.isLoading,
    usersError: usersQuery.error,

    usersNeedVerification: needVerificationQuery.data ?? [],
    loadingNeedVerification: needVerificationQuery.isLoading,
    needVerificationError: needVerificationQuery.error,

    deleteUser: deleteUserMutation.mutateAsync,
    isDeleting: deleteUserMutation.isPending,
    
    refresh: () => {
      void queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: USER_KEYS.needVerification });
    }
  };
};
