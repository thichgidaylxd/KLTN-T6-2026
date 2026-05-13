import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { farmConfigService, workShiftService, wageConfigService } from '@/services/farm/farmConfigService';
import type {
  UpdateFarmConfigRequest,
  CreateWorkShiftRequest,
  UpdateWorkShiftRequest,
  CreateWageConfigRequest,
} from '@/types/farmConfig';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const farmConfigKeys = {
  config:  (farmId: string) => ['farm-config', farmId] as const,
  shifts:  (farmId: string) => ['work-shifts', farmId] as const,
  wages:   (farmId: string) => ['wage-configs', farmId] as const,
};

// ─── Farm Config ─────────────────────────────────────────────────────────────

export function useFarmConfig(farmId: string) {
  return useQuery({
    queryKey: farmConfigKeys.config(farmId),
    queryFn: () => farmConfigService.getConfig(farmId),
    select: (res) => res.data,
    enabled: !!farmId,
  });
}

export function useUpdateFarmConfig(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateFarmConfigRequest) => farmConfigService.updateConfig(farmId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: farmConfigKeys.config(farmId) }),
  });
}

// ─── Work Shifts ──────────────────────────────────────────────────────────────

export function useWorkShifts(farmId: string) {
  return useQuery({
    queryKey: farmConfigKeys.shifts(farmId),
    queryFn: () => workShiftService.getAll(farmId),
    select: (res) => res.data,
    enabled: !!farmId,
  });
}

export function useCreateWorkShift(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorkShiftRequest) => workShiftService.create(farmId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: farmConfigKeys.shifts(farmId) }),
  });
}

export function useDeleteWorkShift(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shiftId: string) => workShiftService.delete(farmId, shiftId),
    onSuccess: () => qc.invalidateQueries({ queryKey: farmConfigKeys.shifts(farmId) }),
  });
}

export function useUpdateWorkShift(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shiftId, data }: { shiftId: string; data: UpdateWorkShiftRequest }) =>
      workShiftService.update(farmId, shiftId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: farmConfigKeys.shifts(farmId) }),
  });
}

// ─── Wage Configs ─────────────────────────────────────────────────────────────

export function useWageConfigs(farmId: string) {
  return useQuery({
    queryKey: farmConfigKeys.wages(farmId),
    queryFn: () => wageConfigService.getAll(farmId),
    select: (res) => res.data,
    enabled: !!farmId,
  });
}

export function useCreateWageConfig(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWageConfigRequest) => wageConfigService.create(farmId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: farmConfigKeys.wages(farmId) }),
  });
}

export function useDeleteWageConfig(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (wageId: string) => wageConfigService.delete(farmId, wageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: farmConfigKeys.wages(farmId) }),
  });
}