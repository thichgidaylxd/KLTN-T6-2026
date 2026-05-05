import { useState, useCallback, useEffect } from 'react';
import { seasonPlanTaskService } from '../../services/seasonplan/seasonPlanTaskService';
import { extractErrorMessage } from '../../utils/errorUtils';
import { toast } from 'sonner';

export const useTaskDependencies = (
  planId: string | undefined,
  stageId: string | undefined,
  taskId: string | undefined,
  enabled: boolean = false
) => {
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchDependencies = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const ids = await seasonPlanTaskService.getTaskDependencies(taskId);
      setDependencies(ids);
    } catch (error) {
      console.error('Lỗi lấy danh sách phụ thuộc:', error);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (enabled && taskId) {
      fetchDependencies();
    }
  }, [enabled, taskId, fetchDependencies]);

  const addDependency = async (dependsOnTaskId: string) => {
    if (!planId || !stageId || !taskId) return;
    setAdding(true);
    try {
      await seasonPlanTaskService.addTaskDependency(planId, stageId, taskId, dependsOnTaskId);
      await fetchDependencies();
      toast.success('Đã thêm liên kết phụ thuộc');
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setAdding(false);
    }
  };

  const deleteDependency = async (dependsOnTaskId: string) => {
    if (!taskId) return;
    try {
      await seasonPlanTaskService.deleteTaskDependency(taskId, dependsOnTaskId);
      await fetchDependencies();
      toast.success('Đã xóa liên kết phụ thuộc');
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return {
    dependencies,
    loading,
    adding,
    addDependency,
    deleteDependency,
    refresh: fetchDependencies
  };
};
