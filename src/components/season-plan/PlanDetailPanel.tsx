import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  GripVertical,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SeasonPlan, Phase, Task } from '@/types/seasonPlan';
import { cn } from '@/utils/cn';
import { usePlots } from '@/hooks/plots/usePlots';
import { useWarehouseItems } from '@/hooks/warehouseItems/useWarehouseItems';
import { useWarehouses } from '@/hooks/warehouses/useWarehouses';
import { useAuth } from '@/hooks/auth/useAuth';
import { useTaskMaterials } from '@/hooks/taskMaterials/useTaskMaterials';
import { useTaskAssignees } from '@/hooks/taskAssignees/useTaskAssignees';
import { useMembers } from '@/hooks/members/useMembers';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { toast } from 'sonner';
import { createTaskSchema } from '@/schemas/seasonPlanSchemas';
import { createTaskMaterialSchema } from '@/schemas/taskMaterialSchemas';
import { createTaskAssigneeSchema } from '@/schemas/taskAssigneeSchemas';
import { extractErrorMessage } from '@/utils/errorUtils';
import { PlanStageStatusTransition } from '@/services/plan/planStageStatusService';

// ─── Sub-components ───────────────────────────────────────────────────────────
import { DetailHeader } from './detail/DetailHeader';
import { GeneralInfo } from './detail/GeneralInfo';
import { MaterialsSection } from './detail/MaterialsSection';
import { AssigneesSection } from './detail/AssigneesSection';
import { SubTasksSection } from './detail/SubTasksSection';
import { PhasesSection } from './detail/PhasesSection';
import { PlotManager } from './detail/PlotManager';
import { DependenciesSection } from './detail/DependenciesSection';
import { statusCodeOf } from './detail/DetailCommon';
import { useTaskDependencies } from '@/hooks/seasonPlans/useTaskDependencies';
import { useWorkLogs } from '@/hooks/workLog/useWorkLogs';
import { WorkLogsSection } from './detail/WorkLogsSection';
import { WorkLogDetailModal } from '../work-log/WorkLogDetailModal';
import { StatusHistorySection } from './detail/StatusHistorySection';
import { useTaskStatusDetails } from '@/hooks/taskStatus/useTaskStatus';
import { usePlanStageStatusDetails } from '@/hooks/seasonPlans/usePlanStageStatus';


// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanDetailPanelProps {
  selection:
  | null
  | { type: 'PLAN'; plan: SeasonPlan }
  | { type: 'PHASE'; plan: SeasonPlan; phase: Phase }
  | { type: 'TASK'; plan: SeasonPlan; phase: Phase; task: Task };
  isOpen: boolean;
  onClose: () => void;
  onUpdatePlan: (plan: SeasonPlan) => void;
  onUpdatePhase: (planId: string, phase: Phase, originalPhase?: Phase) => void;
  onClone?: (plan: SeasonPlan) => void;
  onAddTask: (planId: string, phaseId: string, data: { name: string; description: string; startDate: string; endDate: string; plotId: string }) => void;
  onUpdateTask: (planId: string, phaseId: string, task: Task, originalTask?: Task) => void;
  onSelectPhase: (planId: string, phaseId: string) => void;
  onSelectTask: (planId: string, phaseId: string, taskId: string) => void;
  onDeletePlan?: (planId: string) => void;
  onDeletePhase?: (planId: string, phaseId: string) => void;
  onDeleteTask?: (planId: string, phaseId: string, taskId: string) => void;
  initialIsAddingPhase?: boolean;
  onClearInitialIsAddingPhase?: () => void;
  onAddPhase?: (planId: string, data: { name: string; startDate: string; endDate: string }) => Promise<void>;
  onAddPlots?: (planId: string, plotIds: string[]) => Promise<void>;
  onDeletePlot?: (planId: string, plotId: string) => Promise<void>;
  canEdit?: boolean;
  phaseStatusOptions?: { id: string; code: string; label: string; color?: string }[];
  phaseStatusTransitions?: PlanStageStatusTransition[];
  taskStatusOptions?: { id: string; code: string; label: string; color?: string }[];
  taskStatusTransitions?: any[];
  onScrollToDate?: (dateStr: string) => void;
  onFetchPhaseDetail?: (planId: string, stageId: string) => Promise<Phase>;
  onFetchTaskDetail?: (planId: string, stageId: string, taskId: string) => Promise<Task>;
  onUpdatePhaseStatus?: (planId: string, stageId: string, statusId: string) => Promise<any>;
  onUpdateTaskStatus?: (planId: string, stageId: string, taskId: string, statusId: string) => Promise<any>;
  fetchTaskAvailableStatuses?: (planId: string, stageId: string, taskId: string) => Promise<any>;
  fetchPhaseAvailableStatuses?: (planId: string, stageId: string) => Promise<any>;
  updatePlansCache?: (updater: (prev: any[]) => any[]) => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PlanDetailPanel({
  selection,
  isOpen,
  onClose,
  onUpdatePlan,
  onUpdatePhase,
  onClone,
  onAddTask,
  onUpdateTask,
  onSelectPhase,
  onSelectTask,
  onDeletePlan,
  onDeletePhase,
  onDeleteTask,
  initialIsAddingPhase,
  onClearInitialIsAddingPhase,
  onAddPlots,
  canEdit = false,
  phaseStatusOptions = [],
  phaseStatusTransitions = [],
  taskStatusOptions = [],
  taskStatusTransitions = [],
  onScrollToDate,
  onFetchPhaseDetail,
  onFetchTaskDetail,
  onUpdatePhaseStatus,
  onUpdateTaskStatus,
  onDeletePlot,
  updatePlansCache,
}: PlanDetailPanelProps) {
  const queryClient = useQueryClient();
  const { currentFarmId } = useAuth();
  const { selectedFarmId } = useSelector((state: RootState) => state.farm);
  const targetFarmId = currentFarmId || selectedFarmId;
  const { plots, fetchPlots, plotsLoading } = usePlots(targetFarmId || undefined);
  const { warehouses, fetchWarehouses } = useWarehouses();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const { items: warehouseItems } = useWarehouseItems(targetFarmId, selectedWarehouseId || null);
  const { members, fetchMembers, loadingMembers } = useMembers();

  const [activeTab, setActiveTab] = useState<'INFO' | 'MEMBERS' | 'MATERIALS' | 'LOGS' | 'HISTORY'>('INFO');

  const PANEL_MIN = 280;
const PANEL_MAX = 640;
const [panelWidth, setPanelWidth] = useState(340);
const panelResizing = useRef(false);
const panelStartX = useRef(0);
const panelStartW = useRef(340);
const startPanelResize = useCallback((e: React.MouseEvent) => {
  e.preventDefault();
  panelResizing.current = true;
  panelStartX.current = e.clientX;
  panelStartW.current = panelWidth;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
}, [panelWidth]);

useEffect(() => {
  const onMove = (e: MouseEvent) => {
    if (!panelResizing.current) return;
    // Panel nằm bên phải, kéo sang trái = tăng width
    const delta = panelStartX.current - e.clientX;
    setPanelWidth(Math.min(PANEL_MAX, Math.max(PANEL_MIN, panelStartW.current + delta)));
  };
  const onUp = () => {
    if (!panelResizing.current) return;
    panelResizing.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  return () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
}, []);
  // Use dedicated hooks for management, using selection prop directly to avoid sync lag
  const {
    taskMaterials,
    taskMaterialsLoading,
    addTaskMaterial,
    deleteTaskMaterial
  } = useTaskMaterials(
    selection?.plan.id,
    selection?.type === 'TASK' ? (selection as any).phase.id : undefined,
    selection?.type === 'TASK' ? (selection as any).task.id : undefined,
    isOpen && selection?.type === 'TASK'
  );

  const {
    assignees: taskAssignees,
    loading: isAssigneesQueryLoading,
    adding: isAddingAssignee,
    addAssignee,
    deleteAssignee,
  } = useTaskAssignees(
    selection?.plan.id,
    selection?.type === 'TASK' ? (selection as any).phase.id : undefined,
    selection?.type === 'TASK' ? (selection as any).task.id : undefined,
    isOpen && selection?.type === 'TASK'
  );

  const {
    dependencies,
    loading: isDependenciesLoading,
    adding: isAddingDependency,
    addDependency,
    deleteDependency
  } = useTaskDependencies(
    selection?.plan.id,
    selection?.type === 'TASK' ? (selection as any).phase.id : undefined,
    selection?.type === 'TASK' ? (selection as any).task.id : undefined,
    isOpen && activeTab === 'INFO' && selection?.type === 'TASK',
    updatePlansCache
  );

  const {
    workLogs,
    loading: isWorkLogsLoading
  } = useWorkLogs(
    selection?.plan.id,
    selection?.type === 'TASK' ? (selection as any).phase.id : undefined,
    selection?.type === 'TASK' ? (selection as any).task.id : undefined,
    activeTab === 'LOGS'
  );

  const {
    histories: taskStatusHistories,
    historiesLoading: taskStatusHistoriesLoading,
    availableStatuses: taskAvailableStatuses,
  } = useTaskStatusDetails(
    selection?.plan.id,
    selection?.type === 'TASK' ? (selection as any).phase.id : undefined,
    selection?.type === 'TASK' ? (selection as any).task.id : undefined,
    isOpen && selection?.type === 'TASK'
  );
  
  const {
    histories: phaseStatusHistories,
    historiesLoading: phaseStatusHistoriesLoading,
    availableStatuses: phaseAvailableStatuses,
  } = usePlanStageStatusDetails(
    selection?.plan.id,
    selection?.type === 'PHASE' ? (selection as any).phase.id : undefined,
    isOpen && selection?.type === 'PHASE'
  );

  const availableStatuses = selection?.type === 'TASK' ? taskAvailableStatuses : phaseAvailableStatuses;


  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (initialIsAddingPhase) {
      onClearInitialIsAddingPhase?.();
    }
  }, [initialIsAddingPhase]);



  const [tempPlan, setTempPlan] = useState<SeasonPlan | null>(null);
  const [tempPhase, setTempPhase] = useState<Phase | null>(null);
  const [tempTask, setTempTask] = useState<Task | null>(null);
  const [selectedWorkLogId, setSelectedWorkLogId] = useState<string | null>(null);
  const [isWorkLogDetailModalOpen, setIsWorkLogDetailModalOpen] = useState(false);

  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskStart, setNewTaskStart] = useState('');
  const [newTaskEnd, setNewTaskEnd] = useState('');
  const [newTaskPlotId, setNewTaskPlotId] = useState('');
  
  const [hasSuggested, setHasSuggested] = useState(false);

  useEffect(() => {
    if (isAddingTask && selection?.type === 'PHASE') {
      const plan = selection.plan;
      const phase = selection.phase;
      const rawTasks = selection.phase.tasks;
      
      if (!hasSuggested && rawTasks !== undefined) {
        const tasks = Array.isArray(rawTasks) ? rawTasks : [];
        
        if (tasks.length > 0) {
          const latestEndDate = tasks.reduce((max: string, t: any) => {
            const ed = t.endDate?.substring(0, 10);
            if (!ed) return max;
            return ed > max ? ed : max;
          }, tasks[0].endDate?.substring(0, 10) || phase.startDate);
          
          try {
            const [y, m, d] = latestEndDate.split('-').map(Number);
            const nextDate = new Date(y, m - 1, d + 1);
            
            const nextY = nextDate.getFullYear();
            const nextM = String(nextDate.getMonth() + 1).padStart(2, '0');
            const nextD = String(nextDate.getDate()).padStart(2, '0');
            const nextDateStr = `${nextY}-${nextM}-${nextD}`;
            
            if (nextDateStr <= phase.endDate && nextDateStr >= phase.startDate) {
              setNewTaskStart(nextDateStr);
              setNewTaskEnd(nextDateStr);
            } else {
              setNewTaskStart(phase.startDate);
              setNewTaskEnd(phase.endDate);
            }
          } catch (e) {
            setNewTaskStart(phase.startDate);
            setNewTaskEnd(phase.endDate);
          }
        } else {
          setNewTaskStart(phase.startDate);
          setNewTaskEnd(phase.endDate);
        }
        setHasSuggested(true);
      }
      
      if (!newTaskPlotId) {
        // Chỉ tự động chọn nếu kế hoạch chỉ có đúng 1 lô đất. 
        // Nếu có nhiều lô (>1), để trống để kích hoạt logic bắt buộc chọn/hiện modal.
        const autoPlotId = (plan.plots && plan.plots.length === 1) ? plan.plots[0].plotId : '';
        setNewTaskPlotId(phase.plotId || autoPlotId);
      }
    }
  }, [isAddingTask, selection, hasSuggested]);

  const [showAddPlot, setShowAddPlot] = useState(false);
  const [selectedPlotIds, setSelectedPlotIds] = useState<string[]>([]);
  const [loadingAddPlot, setLoadingAddPlot] = useState(false);
  const [selectedWarehouseItemId, setSelectedWarehouseItemId] = useState('');
  const [plannedQty, setPlannedQty] = useState<string>('');
  const [selectedAssigneeUserId, setSelectedAssigneeUserId] = useState('');


  useEffect(() => {
    if (showAddPlot && targetFarmId) {
      fetchPlots();
    }
  }, [showAddPlot, targetFarmId, fetchPlots]);

  useEffect(() => {
    if (isOpen && targetFarmId) {
      void fetchMembers(targetFarmId);
      void fetchPlots();
    }
  }, [isOpen, targetFarmId, fetchMembers, fetchPlots]);

  useEffect(() => {
    const isWarehouseTaskOpen =
      isOpen && activeTab === 'MATERIALS' && selection?.type === 'TASK';
    if (isWarehouseTaskOpen && targetFarmId) {
      void fetchWarehouses(targetFarmId);
    }
  }, [selection?.type, activeTab, fetchWarehouses, isOpen, targetFarmId]);

  useEffect(() => {
    setSelectedWarehouseItemId('');
  }, [selectedWarehouseId]);


  useEffect(() => {
    setHasSuggested(false); // Reset suggestion state when selection changes
    if (isOpen && selection?.plan.id) {
      if (selection.type === 'PHASE' && selection.phase.id) {
        onFetchPhaseDetail?.(selection.plan.id, selection.phase.id);
      } else if (selection.type === 'TASK' && (selection as any).phase.id && (selection as any).task.id) {
        onFetchTaskDetail?.(selection.plan.id, (selection as any).phase.id, (selection as any).task.id);
      }
    }
    setSelectedWarehouseId('');
    setSelectedWarehouseItemId('');
    setSelectedAssigneeUserId('');
    setPlannedQty('');
    // Reset về tab thông tin mỗi khi thay đổi lựa chọn để tránh lỗi UI
    setActiveTab('INFO');

    if (selection) {
      setTempPlan(selection.plan);
      if (selection.type === 'PHASE') setTempPhase(selection.phase);
      if (selection.type === 'TASK') {
        setTempPhase(selection.phase);
        setTempTask(selection.task);
      }
    }
  }, [selection, isOpen, onFetchPhaseDetail, onFetchTaskDetail]);

  const handleStartEdit = () => {
    if (!selection) return;
    setTempPlan({ ...selection.plan });
    if (selection.type === 'PHASE') setTempPhase({ ...selection.phase });
    if (selection.type === 'TASK') {
      setTempPhase({ ...selection.phase });
      setTempTask({ ...selection.task });
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (selection) {
      setTempPlan(selection.plan);
      if (selection.type === 'PHASE') setTempPhase(selection.phase);
      if (selection.type === 'TASK') {
        setTempPhase(selection.phase);
        setTempTask(selection.task);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!selection || !tempPlan) return;

    try {
      if (selection.type === 'PLAN') {
        await onUpdatePlan(tempPlan);
      } else if (selection.type === 'PHASE' && tempPhase) {
        // Kiểm tra nếu trạng thái thay đổi
        const currentStatusCode = statusCodeOf(selection.phase.status);
        const newStatusCode = statusCodeOf(tempPhase.status);
        const newStatusId = (tempPhase.status as any)?.id;
        
        await onUpdatePhase(tempPlan.id, tempPhase, selection.phase);
        
        if (newStatusCode !== currentStatusCode && newStatusId) {
          await handleUpdateStatus(newStatusId);
        }
      } else if (selection.type === 'TASK' && tempPhase && tempTask) {
        // Kiểm tra nếu trạng thái thay đổi
        const currentStatusCode = statusCodeOf(selection.task.status);
        const newStatusCode = statusCodeOf(tempTask.status);
        const newStatusId = (tempTask.status as any)?.id;

        await onUpdateTask(tempPlan.id, tempPhase.id, {
          ...tempTask,
          statusCode: statusCodeOf(tempTask.status)
        } as any, selection.task);

        if (newStatusCode !== currentStatusCode && newStatusId) {
          await handleUpdateStatus(newStatusId);
        }
      }
      
      setIsEditing(false);
    } catch (err) {
      console.error('Lỗi khi lưu:', err);
    }
  };

  if (!selection && !isOpen) return null;
  if (!selection) return null;

  const { plan } = selection;
  const sel = selection;

  const handleAddPlotsSubmit = async () => {
    if (!plan.id || selectedPlotIds.length === 0) return;
    try {
      setLoadingAddPlot(true);
      if (onAddPlots) {
        await onAddPlots(plan.id, selectedPlotIds);
      }
      setShowAddPlot(false);
      setSelectedPlotIds([]);
    } catch (err) {
      console.error('Lỗi khi thêm lô đất:', err);
    } finally {
      setLoadingAddPlot(false);
    }
  };


  const handleAddTaskSubmit = (plotIdOverride?: string | React.MouseEvent) => {
    if (selection.type !== 'PHASE') return;


    const finalPlotId = (typeof plotIdOverride === 'string') ? plotIdOverride : newTaskPlotId;
    console.log("finalPlotId:", finalPlotId);
console.log("newTaskPlotId:", newTaskPlotId);
console.log("phase.plotId:", (selection as any).phase.plotId);
    const payload = {
      name: newTaskName,
      description: newTaskDesc,
      startDate: newTaskStart || (selection as any).phase.startDate,
      endDate: newTaskEnd || (selection as any).phase.endDate,
       plotId: finalPlotId || "",  // ← chỉ dùng những gì user chọn
    };

    const validation = createTaskSchema.safeParse(payload);
    console.log("DEBUG: Payload for creating task:", payload, "Validation result:", validation);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    onAddTask(plan.id, (sel as any).phase.id, validation.data as any);
    setNewTaskName(''); setNewTaskDesc('');
    setNewTaskStart(''); setNewTaskEnd('');
    setNewTaskPlotId('');
    setHasSuggested(false);
    setIsAddingTask(false);
  };

  const handleAddMaterialSubmit = async () => {
    if (!selection || selection.type !== 'TASK') return;

    const payload = {
      warehouseItemId: selectedWarehouseItemId,
      plannedQty,
    };
    const validation = createTaskMaterialSchema.safeParse(payload);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    try {
      await addTaskMaterial(validation.data);
      setSelectedWarehouseItemId('');
      setPlannedQty('');
      toast.success('Thêm vật tư thành công');
    } catch (error: any) {
      console.error('Lỗi thêm vật tư:', error);
      toast.error(extractErrorMessage(error));
    }
  };

  const handleUpdateStatus = async (statusId: string) => {
    if (!selection || selection.type === 'PLAN') return;

    try {
      if (selection.type === 'PHASE') {
        if (onUpdatePhaseStatus) {
          await onUpdatePhaseStatus(selection.plan.id, selection.phase.id, statusId);
          // Invalidate Phase Status Cache
          queryClient.invalidateQueries({ queryKey: ['planStageStatus'] });
        }
      } else {
        if (onUpdateTaskStatus) {
          await onUpdateTaskStatus(
            selection.plan.id,
            (selection as any).phase.id,
            selection.task.id,
            statusId
          );
          // Invalidate Task Status Cache
          queryClient.invalidateQueries({ queryKey: ['taskStatusHistories'] });
          queryClient.invalidateQueries({ queryKey: ['availableTaskStatuses'] });
        }
      }
      toast.success('Cập nhật trạng thái thành công');
    } catch (error: any) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleAddAssigneeSubmit = async () => {
    if (!selection || selection.type !== 'TASK') return;

    const payload = { userId: selectedAssigneeUserId };
    const validation = createTaskAssigneeSchema.safeParse(payload);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    try {
      await addAssignee(validation.data);
      setSelectedAssigneeUserId('');
      toast.success('Giao việc thành công');
    } catch (error: any) {
      toast.error(extractErrorMessage(error));
    }
  };
  const handleAddDependency = async (dependsOnTaskId: string) => {
    console.error("EVENT: Bắt đầu thêm tiền nhiệm cho Task:", (selection as any)?.task?.id, "với ID phụ thuộc:", dependsOnTaskId);
    try {
      await addDependency(dependsOnTaskId);
    } catch (error: any) {
      // Error is already handled with toast in useTaskDependencies
    }
  };

  const handleDeleteDependency = async (dependsOnTaskId: string) => {
    try {
      await deleteDependency(dependsOnTaskId);
    } catch (error: any) {
      // Error already handled
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          style={{ width: panelWidth }}
          transition={{ type: 'spring', stiffness: 360, damping: 36 }}
          className="relative flex-shrink-0 bg-white border-l border-slate-200 flex flex-col z-[150] shadow-xl overflow-hidden"
        >
            {/* Resize handle - đặt ở cạnh trái */}
  <div
    className="absolute left-0 top-0 bottom-0 w-1 group z-50 flex-shrink-0"
    style={{ cursor: 'col-resize' }}
    onMouseDown={startPanelResize}
  >
    <div className="absolute inset-y-0 left-0 w-px bg-slate-200 group-hover:bg-indigo-400 group-active:bg-indigo-500 transition-colors" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      <GripVertical size={14} className="text-indigo-400" />
    </div>
  </div>
          <DetailHeader
            selection={sel as any}
            isEditing={isEditing}
            canEdit={canEdit}
            onClose={onClose}
            onStartEdit={handleStartEdit}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onDelete={() => {
              if (sel.type === 'PLAN') onDeletePlan?.(sel.plan.id);
              else if (sel.type === 'PHASE') onDeletePhase?.(sel.plan.id, (sel as any).phase.id);
              else if (sel.type === 'TASK') onDeleteTask?.(sel.plan.id, (sel as any).phase.id, (sel as any).task.id);
            }}
            onSelectPhase={onSelectPhase}
            onClone={() => {
              if (sel.type === 'PLAN') onClone?.(sel.plan);
            }}
          />

          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {/* Tabs bar */}
            <div className="flex items-center px-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <button
                onClick={() => setActiveTab('INFO')}
                className={cn(
                  "flex-1 px-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap",
                  activeTab === 'INFO' ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-600"
                )}
              >
                Thông tin
              </button>
              {sel.type === 'TASK' && (
                <button
                  onClick={() => setActiveTab('MATERIALS')}
                  className={cn(
                    "flex-1 px-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap",
                    activeTab === 'MATERIALS' ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-600"
                  )}
                >
                  Vật tư
                </button>
              )}
              {sel.type === 'TASK' && (
                <button
                  onClick={() => setActiveTab('LOGS')}
                  className={cn(
                    "flex-1 px-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap",
                    activeTab === 'LOGS' ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-600"
                  )}
                >
                  Nhật ký
                </button>
              )}
              <button
                onClick={() => setActiveTab('MEMBERS')}
                className={cn(
                  "flex-1 px-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap",
                  activeTab === 'MEMBERS' ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-600"
                )}
              >
                Giao việc
              </button>
              {(sel.type === 'TASK' || sel.type === 'PHASE') && (
                <button
                  onClick={() => setActiveTab('HISTORY')}
                  className={cn(
                    "flex-1 px-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap",
                    activeTab === 'HISTORY' ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-600"
                  )}
                >
                  Lịch sử
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'INFO' && (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <GeneralInfo
                    selection={sel as any}
                    isEditing={isEditing}
                    tempPlan={tempPlan}
                    tempPhase={tempPhase}
                    tempTask={tempTask}
                    setTempPlan={setTempPlan}
                    setTempPhase={setTempPhase}
                    setTempTask={setTempTask}
                    onSelectPhase={onSelectPhase}
                    phaseStatusOptions={phaseStatusOptions}
                    phaseStatusTransitions={phaseStatusTransitions}
                    taskStatusOptions={taskStatusOptions}
                    taskStatusTransitions={taskStatusTransitions}
                    availableStatuses={availableStatuses}
                    onScrollToDate={onScrollToDate}
                    onUpdateStatus={handleUpdateStatus}
                    canEdit={canEdit}
                  />

                  {sel.type === 'PLAN' && (
                    <>
                      <PlotManager
                        plan={plan}
                        plots={plots}
                        loading={plotsLoading}
                        showAddPlot={showAddPlot}
                        setShowAddPlot={setShowAddPlot}
                        selectedPlotIds={selectedPlotIds}
                        setSelectedPlotIds={setSelectedPlotIds}
                        loadingAddPlot={loadingAddPlot}
                        onAddPlots={handleAddPlotsSubmit}
                        onDeletePlot={(pid) => onDeletePlot?.(plan.id, pid)}
                        canEdit={canEdit}
                      />
                      <PhasesSection
                        plan={plan}
                        canEdit={canEdit}
                        onSelectPhase={onSelectPhase}
                        onDeletePhase={(pid, phid) => onDeletePhase?.(pid, phid)}
                      />
                    </>
                  )}

                  {sel.type === 'TASK' && (
                    <DependenciesSection
                      taskId={(sel as any).task.id}
                      phase={(sel as any).phase}
                      dependencies={dependencies}
                      loading={isDependenciesLoading}
                      adding={isAddingDependency}
                      canEdit={canEdit}
                      onAdd={handleAddDependency}
                      onDelete={handleDeleteDependency}
                      onSelectTask={(tid) => onSelectTask(plan.id, (sel as any).phase.id, tid)}
                    />
                  )}

                  {sel.type === 'PHASE' && (
                    <SubTasksSection
                      phase={(sel as any).phase}
                      plan={plan}
                      canEdit={canEdit}
                      isAddingTask={isAddingTask}
                      setIsAddingTask={setIsAddingTask}
                      newTaskName={newTaskName}
                      setNewTaskName={setNewTaskName}
                      newTaskDesc={newTaskDesc}
                      setNewTaskDesc={setNewTaskDesc}
                      newTaskStart={newTaskStart}
                      setNewTaskStart={setNewTaskStart}
                      newTaskEnd={newTaskEnd}
                      setNewTaskEnd={setNewTaskEnd}
                      newTaskPlotId={newTaskPlotId}
                      setNewTaskPlotId={setNewTaskPlotId}
                      onAddTask={handleAddTaskSubmit}
                      onSelectTask={(taskId) => onSelectTask(plan.id, (sel as any).phase.id, taskId)}
                    />
                  )}
                </motion.div>
              )}

              {activeTab === 'MATERIALS' && sel.type === 'TASK' && (
                <motion.div
                  key="materials"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <MaterialsSection
                    materials={taskMaterials}
                    loading={taskMaterialsLoading}
                    adding={false} // Hook doesn't export adding state yet
                    canEdit={canEdit}
                    warehouses={warehouses}
                    warehouseItems={warehouseItems}
                    selectedWarehouseId={selectedWarehouseId}
                    selectedWarehouseItemId={selectedWarehouseItemId}
                    plannedQty={plannedQty}
                    onWarehouseChange={setSelectedWarehouseId}
                    onItemChange={setSelectedWarehouseItemId}
                    onQtyChange={setPlannedQty}
                    onAdd={handleAddMaterialSubmit}
                    onDelete={(id) => {
                      deleteTaskMaterial(id)
                        .then(() => toast.success('Xóa vật tư thành công'))
                        .catch((err: any) => toast.error(extractErrorMessage(err)));
                    }}
                  />
                </motion.div>
              )}

              {activeTab === 'LOGS' && sel.type === 'TASK' && (
                <motion.div
                  key="worklogs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <WorkLogsSection
                    workLogs={workLogs}
                    loading={isWorkLogsLoading}
                    onViewDetail={(logId) => {
                      setSelectedWorkLogId(logId);
                      setIsWorkLogDetailModalOpen(true);
                    }}
                  />
                </motion.div>
              )}

              {activeTab === 'MEMBERS' && sel.type === 'TASK' && (
                <AssigneesSection
                  assignees={taskAssignees}
                  loading={isAssigneesQueryLoading || loadingMembers}
                  adding={isAddingAssignee}
                  canEdit={canEdit}
                  members={members}
                  selectedUserId={selectedAssigneeUserId}
                  onUserChange={setSelectedAssigneeUserId}
                  onAdd={handleAddAssigneeSubmit}
                  onDelete={(assigneeId) => {
                    deleteAssignee(assigneeId)
                      .then(() => toast.success('Gỡ giao việc thành công'))
                      .catch((err: any) => toast.error(extractErrorMessage(err)));
                  }}
                />
              )}
              {activeTab === 'MEMBERS' && sel.type === 'PHASE' && (
                <div className="px-4 py-3 border-t border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Users size={11} /> Giao việc theo công việc trong giai đoạn
                  </p>
                  {sel.phase.tasks && sel.phase.tasks.length > 0 ? (
                    <div className="space-y-2">
                      {sel.phase.tasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => {
                            onSelectTask(plan.id, (sel as any).phase.id, task.id);
                            setActiveTab('MEMBERS');
                          }}
                          className="w-full text-left p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all"
                        >
                          <div className="text-[13px] font-bold text-slate-800 truncate">{task.name}</div>
                          <div className="text-[11px] text-slate-500 mt-1">Bấm để mở giao việc cho công việc này</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-[12px] text-slate-500 font-medium">Giai đoạn này chưa có công việc</p>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'MEMBERS' && sel.type === 'PLAN' && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 px-10 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                    <Users size={24} />
                  </div>
                  <h3 className="text-[13px] font-bold text-slate-700 mb-1">Chọn một giai đoạn hoặc công việc</h3>
                  <p className="text-[11px] leading-relaxed">Bạn có thể vào giai đoạn để chọn công việc cần giao việc cho thành viên.</p>
                </div>
              )}
              {activeTab === 'HISTORY' && (sel.type === 'TASK' || sel.type === 'PHASE') && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <StatusHistorySection
                    histories={sel.type === 'TASK' ? taskStatusHistories : phaseStatusHistories}
                    loading={sel.type === 'TASK' ? taskStatusHistoriesLoading : phaseStatusHistoriesLoading}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-6" />
          </div>


          {selectedWorkLogId && (
            <WorkLogDetailModal
              isOpen={isWorkLogDetailModalOpen}
              onClose={() => setIsWorkLogDetailModalOpen(false)}
              workLogId={selectedWorkLogId}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}