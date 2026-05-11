import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { farmInvitationService } from '@/services/farm/farmInvitationService';

const INVITATION_KEYS = {
  my: ['invitations', 'my'] as const,
  farm: (farmId: string) => ['invitations', 'farm', farmId] as const,
  detail: (farmId: string, invitationId: string) => [
    'invitations',
    'farm',
    farmId,
    invitationId,
  ] as const,
};

export function useMyInvitations(status?: string) {
  const queryClient = useQueryClient();

  const invitationsQuery = useQuery({
    queryKey: INVITATION_KEYS.my,
    queryFn: () => farmInvitationService.getMyInvitations(status),
    enabled: false, // manual fetch
  });

  const refetch = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: INVITATION_KEYS.my });
  }, [queryClient]);

  return {
    invitations: invitationsQuery.data ?? [],
    loading: invitationsQuery.isLoading,
    error: invitationsQuery.error,
    refetch,
  };
}

export function useFarmInvitations(farmId: string | undefined, status?: string) {
  const queryClient = useQueryClient();

  const invitationsQuery = useQuery({
    queryKey: farmId ? INVITATION_KEYS.farm(farmId) : ['invitations', 'farm', 'none'],
    queryFn: () => farmInvitationService.getFarmInvitations(farmId!, status),
    enabled: !!farmId,
  });

  const cancelInvitationMutation = useMutation({
    mutationFn: ({ farmId, invitationId }: { farmId: string; invitationId: string }) =>
      farmInvitationService.cancelInvitation(farmId, invitationId),
    onSuccess: (_, { farmId }) => {
      void queryClient.invalidateQueries({ queryKey: INVITATION_KEYS.farm(farmId) });
      void queryClient.invalidateQueries({ queryKey: INVITATION_KEYS.my });
    },
    onError: () => {
      // Handled by component
    },
  });

  return {
    invitations: invitationsQuery.data ?? [],
    loading: invitationsQuery.isLoading,
    error: invitationsQuery.error,
    cancelInvitation: useCallback(
      (farmId: string, invitationId: string) =>
        cancelInvitationMutation.mutateAsync({ farmId, invitationId }),
      [cancelInvitationMutation]
    ),
    refetch: useCallback(() => {
      if (farmId) {
        void queryClient.invalidateQueries({ queryKey: INVITATION_KEYS.farm(farmId) });
      }
    }, [queryClient, farmId]),
  };
}

export function useInvitationPreview(invitationId: string | undefined) {
  const query = useQuery({
    queryKey: ['invitation', 'preview', invitationId],
    queryFn: () => farmInvitationService.getInvitationPreview(invitationId!),
    enabled: !!invitationId,
  });

  return {
    preview: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
  };
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  const acceptMutation = useMutation({
    mutationFn: (invitationId: string) => farmInvitationService.acceptInvitation(invitationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invitations', 'my'] });
    },
    onError: () => {
      // Handled by component
    },
  });

  return {
    acceptInvitation: useCallback(
      (invitationId: string) => acceptMutation.mutateAsync(invitationId),
      [acceptMutation]
    ),
    accepting: acceptMutation.isPending,
  };
}
