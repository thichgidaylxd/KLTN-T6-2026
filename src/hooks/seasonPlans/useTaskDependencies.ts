import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { extractErrorMessage } from '../../utils/errorUtils';
import { seasonPlanTaskService } from '../../services/seasonplan/seasonPlanTaskService';


export const useTaskDependencies = (
  planId: string | undefined,
  stageId: string | undefined,
  taskId: string | undefined,
  enabled: boolean = false,
  updatePlansCache?: (updater: (prev: any[]) => any[]) => void
) => {
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchDependencies = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const result = await seasonPlanTaskService.getTaskDependencies(taskId);
      setDependencies(result.dependsOnTasks.map(t => t.id));
    } catch (error) {
      console.error('Lỗi lấy danh sách phụ thuộc:', error);
      throw error; // Re-throw to handle in caller
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (enabled && taskId) {
      fetchDependencies();
    } else {
      setDependencies([]);
    }
  }, [enabled, taskId, fetchDependencies]);

  const addDependency = useCallback(async (dependsOnTaskId: string) => {
    if (!planId || !stageId || !taskId) return;
    
    console.error("DEBUG Dependency Request:", { 
      planId,
      stageId,
      urlTaskId: taskId, 
      payloadDependsOnTaskId: dependsOnTaskId,
      isSelfDependency: taskId === dependsOnTaskId 
    });
    
    setAdding(true);
    try {
      const updatedData = await seasonPlanTaskService.addTaskDependency(planId, stageId, taskId, dependsOnTaskId);
      
      // Optimistic update local state
      setDependencies(prev => [...prev, dependsOnTaskId]);
      
      await fetchDependencies();

      // Sync with global plans cache if provider available
      if (updatePlansCache) {
        updatePlansCache((prev) => 
          prev.map((p: any) => p.id === planId ? {
            ...p,
            phases: (p.phases || []).map((ph: any) => ph.id === stageId ? {
              ...ph,
              tasks: (ph.tasks || []).map((t: any) => t.id === taskId ? { ...t, ...updatedData.task } : t)
            } : ph)
          } : p)
        );
      }
      toast.success('Thêm công việc tiền nhiệm thành công');
    } catch (error: any) {
      console.error('Lỗi thêm phụ thuộc:', error);
      toast.error(extractErrorMessage(error));
    } finally {
      setAdding(false);
    }
  }, [planId, stageId, taskId, fetchDependencies, updatePlansCache]);

  const deleteDependency = useCallback(async (dependsOnTaskId: string) => {
    if (!taskId) return;
    try {
      await seasonPlanTaskService.deleteTaskDependency(taskId, dependsOnTaskId);
      
      // Optimistic update local state
      setDependencies(prev => prev.filter(id => id !== dependsOnTaskId));

      await fetchDependencies();

      // Sync with global plans cache
      if (updatePlansCache && planId && stageId) {
        updatePlansCache((prev) => 
          prev.map((p: any) => p.id === planId ? {
            ...p,
            phases: (p.phases || []).map((ph: any) => ph.id === stageId ? {
              ...ph,
              tasks: (ph.tasks || []).map((t: any) => t.id === taskId ? { 
                ...t, 
                dependencies: (t.dependencies || []).filter((d: any) => (d.dependsOnTaskId || d.id) !== dependsOnTaskId)
              } : t)
            } : ph)
          } : p)
        );
      }
      toast.success('Đã xóa liên kết phụ thuộc');
    } catch (error: any) {
      console.error('Lỗi xóa phụ thuộc:', error);
      toast.error(extractErrorMessage(error));
    }
  }, [planId, stageId, taskId, fetchDependencies, updatePlansCache]);

  return {
    dependencies,
    loading,
    adding,
    addDependency,
    deleteDependency,
    refresh: fetchDependencies
  };
};
