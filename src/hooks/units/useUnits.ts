import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { unitService } from '../../services/unit/unitService';
import { AppDispatch, RootState } from '../../store';
import { setUnitsSnapshot } from '../../store/unitSlice';

const UNIT_KEYS = {
  list: ['units', 'list'] as const,
};

const withUnwrap = <T,>(promise: Promise<T>) =>
  Object.assign(promise, { unwrap: () => promise });

export const useUnits = () => {
  const dispatch = useDispatch<AppDispatch>();
  const unitBridge = useSelector((state: RootState) => state.unit);
  const queryClient = useQueryClient();
  const unitsQuery = useQuery({
    queryKey: UNIT_KEYS.list,
    queryFn: async () => (await unitService.getUnits()).data ?? [],
    enabled: true,
  });

  useEffect(() => {
    if (unitsQuery.data) {
      dispatch(setUnitsSnapshot(unitsQuery.data));
    }
  }, [dispatch, unitsQuery.data]);

  return {
    units: unitsQuery.data ?? unitBridge.unitsSnapshot,
    loading: unitsQuery.isLoading || unitsQuery.isFetching,
    error: unitsQuery.error ?? null,
    fetchUnits: useCallback(
      () =>
        withUnwrap(
          queryClient.fetchQuery({
            queryKey: UNIT_KEYS.list,
            queryFn: async () => (await unitService.getUnits()).data ?? [],
          }),
        ),
      [queryClient],
    ),
  };
};
