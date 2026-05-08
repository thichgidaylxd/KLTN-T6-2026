import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { farmInvitationService } from '@/services/farm/farmInvitationService';
import { extractErrorMessage } from '@/utils/errorUtils';

const FARM_MEMBER_KEYS = {
  list: (farmId: string) => ['farmMembers', farmId] as const,
};

export function useFarmMembers(farmId: string | undefined) {
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: farmId ? FARM_MEMBER_KEYS.list(farmId) : ['farmMembers', 'none'],
    queryFn: () => farmInvitationService.getFarmMembers(farmId!),
    enabled: !!farmId,
  });

  const sendInvitationMutation = useMutation({
    mutationFn: ({ farmId, data }: { farmId: string; data: { email: string; roleId: string } }) =>
      farmInvitationService.sendInvitation(farmId, data),
    onSuccess: (_, { farmId }) => {
      void queryClient.invalidateQueries({ queryKey: FARM_MEMBER_KEYS.list(farmId) });
      void queryClient.invalidateQueries({ queryKey: ['invitations', 'my'] });
      toast.success('Đã gửi lời mời thành công');
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err));
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: ({ farmId, memberId }: { farmId: string; memberId: string }) =>
      farmInvitationService.deleteFarmMember(farmId, memberId),
    onSuccess: (_, { farmId }) => {
      void queryClient.invalidateQueries({ queryKey: FARM_MEMBER_KEYS.list(farmId) });
      toast.success('Đã xóa thành viên');
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err));
    },
  });

  return {
    members: membersQuery.data ?? [],
    loading: membersQuery.isLoading,
    error: membersQuery.error,
    sendInvitation: useCallback(
      (farmId: string, data: { email: string; roleId: string }) =>
        sendInvitationMutation.mutateAsync({ farmId, data }),
      [sendInvitationMutation]
    ),
    deleteMember: useCallback(
      (farmId: string, memberId: string) =>
        deleteMemberMutation.mutateAsync({ farmId, memberId }),
      [deleteMemberMutation]
    ),
    refetch: useCallback(() => {
      if (farmId) {
        void queryClient.invalidateQueries({ queryKey: FARM_MEMBER_KEYS.list(farmId) });
      }
    }, [queryClient, farmId]),
  };
}
