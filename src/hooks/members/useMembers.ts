import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { InviteMemberRequest, ChangeRoleRequest } from '../../types/member';
import { memberService } from '../../services/members/memberService';

const MEMBER_KEYS = {
  all: ['members'] as const,
  members: (farmId: string) => ['members', farmId] as const,
  invitations: (farmId: string) => ['members', farmId, 'invitations'] as const,
  myInvitations: (status?: string) => ['members', 'me', 'invitations', status ?? 'all'] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

export const useMembers = () => {
  const queryClient = useQueryClient();
  const [farmId, setFarmId] = useState<string | null>(null);

  const membersQuery = useQuery({
    queryKey: farmId ? MEMBER_KEYS.members(farmId) : ['members', 'inactive'],
    queryFn: async () => (await memberService.getMembers(farmId as string)).data ?? [],
    enabled: !!farmId,
    refetchInterval: 30000, // Tự động cập nhật mỗi 30 giây
  });

  const invitationsQuery = useQuery({
    queryKey: farmId ? MEMBER_KEYS.invitations(farmId) : ['members', 'invitations', 'inactive'],
    queryFn: async () => (await memberService.getInvitations(farmId as string)).data ?? [],
    enabled: !!farmId,
    refetchInterval: 30000, // Tự động cập nhật mỗi 30 giây
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ farmId: targetFarmId, payload }: { farmId: string; payload: InviteMemberRequest }) => {
      await memberService.inviteMember(targetFarmId, payload);
      return targetFarmId;
    },
    onSuccess: async (targetFarmId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.members(targetFarmId) }),
        queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.invitations(targetFarmId) }),
        queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.all }),
      ]);
    },
  });

  const cancelInvitationMutation = useMutation({
    mutationFn: async ({ farmId: targetFarmId, invitationId }: { farmId: string; invitationId: string }) => {
      await memberService.cancelInvitation(targetFarmId, invitationId);
      return { farmId: targetFarmId, invitationId };
    },
    onSuccess: async ({ farmId: targetFarmId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.invitations(targetFarmId) }),
        queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.all }),
      ]);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ farmId: targetFarmId, memberId }: { farmId: string; memberId: string }) => {
      await memberService.removeMember(targetFarmId, memberId);
      return { farmId: targetFarmId, memberId };
    },
    onSuccess: async ({ farmId: targetFarmId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.members(targetFarmId) }),
        queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.all }),
      ]);
    },
  });

  const changeMemberRoleMutation = useMutation({
    mutationFn: async ({
      farmId: targetFarmId,
      memberId,
      payload,
    }: {
      farmId: string;
      memberId: string;
      payload: ChangeRoleRequest;
    }) => {
      await memberService.changeRole(targetFarmId, memberId, payload);
      return { farmId: targetFarmId, memberId };
    },
    onSuccess: async ({ farmId: targetFarmId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.members(targetFarmId) }),
        queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.all }),
      ]);
    },
  });

  const error = useMemo(
    () =>
      membersQuery.error ??
      invitationsQuery.error ??
      inviteMutation.error ??
      cancelInvitationMutation.error ??
      removeMemberMutation.error ??
      changeMemberRoleMutation.error ??
      null,
    [
      membersQuery.error,
      invitationsQuery.error,
      inviteMutation.error,
      cancelInvitationMutation.error,
      removeMemberMutation.error,
      changeMemberRoleMutation.error,
    ],
  );

  return {
    members: membersQuery.data ?? [],
    invitations: invitationsQuery.data ?? [],
    loadingMembers: membersQuery.isLoading,
    loadingInvitations: invitationsQuery.isLoading,
    isFetchingMembers: membersQuery.isFetching,
    isFetchingInvitations: invitationsQuery.isFetching,
    submitting:
      inviteMutation.isPending ||
      cancelInvitationMutation.isPending ||
      removeMemberMutation.isPending ||
      changeMemberRoleMutation.isPending,
    error,
    fetchMembers: useCallback(
      (farmIdValue: string) => {
        setFarmId(farmIdValue);
        return withUnwrap(
          queryClient.fetchQuery({
            queryKey: MEMBER_KEYS.members(farmIdValue),
            queryFn: async () => (await memberService.getMembers(farmIdValue)).data ?? [],
          }),
        );
      },
      [queryClient],
    ),
    fetchInvitations: useCallback(
      (farmIdValue: string) => {
        setFarmId(farmIdValue);
        return withUnwrap(
          queryClient.fetchQuery({
            queryKey: MEMBER_KEYS.invitations(farmIdValue),
            queryFn: async () => (await memberService.getInvitations(farmIdValue)).data ?? [],
          }),
        );
      },
      [queryClient],
    ),
    fetchMyInvitations: useCallback(
      (status?: string) =>
        withUnwrap(
          queryClient.fetchQuery({
            queryKey: MEMBER_KEYS.myInvitations(status),
            queryFn: async () => (await memberService.getMyInvitations(status)).data ?? [],
          }),
        ),
      [queryClient],
    ),
    inviteMember: useCallback(
      (farmIdValue: string, payload: InviteMemberRequest) =>
        withUnwrap(inviteMutation.mutateAsync({ farmId: farmIdValue, payload })),
      [inviteMutation],
    ),
    cancelInvitation: useCallback(
      (farmIdValue: string, invitationId: string) =>
        withUnwrap(cancelInvitationMutation.mutateAsync({ farmId: farmIdValue, invitationId })),
      [cancelInvitationMutation],
    ),
    removeMember: useCallback(
      (farmIdValue: string, memberId: string) =>
        withUnwrap(removeMemberMutation.mutateAsync({ farmId: farmIdValue, memberId })),
      [removeMemberMutation],
    ),
    changeMemberRole: useCallback(
      (farmIdValue: string, memberId: string, payload: ChangeRoleRequest) =>
        withUnwrap(changeMemberRoleMutation.mutateAsync({ farmId: farmIdValue, memberId, payload })),
      [changeMemberRoleMutation],
    ),
  };
};
