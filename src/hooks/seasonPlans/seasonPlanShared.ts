import { QueryClient } from '@tanstack/react-query';
import { SeasonPlan } from '../../types/seasonPlan';

export const PLAN_KEYS = {
  all: ['season-plans'] as const,
  list: ['season-plans', 'list'] as const,
  byFarm: (farmId: string) => ['season-plans', 'list', farmId] as const,
};

export const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

export const createUpdatePlansCache =
  (queryClient: QueryClient, farmId?: string | null) =>
  (updater: (prev: SeasonPlan[]) => SeasonPlan[]) => {
    const key = farmId ? PLAN_KEYS.byFarm(farmId) : PLAN_KEYS.list;
    queryClient.setQueryData(key, (prev: SeasonPlan[] | undefined) => updater(prev ?? []));
  };

