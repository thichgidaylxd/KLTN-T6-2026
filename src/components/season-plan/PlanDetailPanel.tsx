import { useState, useEffect } from 'react';
import {
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

// ─── Sub-components ───────────────────────────────────────────────────────────
import { DetailHeader } from './detail/DetailHeader';
import { GeneralInfo } from './detail/GeneralInfo';
import { MaterialsSection } from './detail/MaterialsSection';
import { AssigneesSection } from './detail/AssigneesSection';
import { SubTasksSection } from './detail/SubTasksSection';
import { DeleteConfirmModal } from './detail/DeleteConfirmModal';
import { PlotManager } from './detail/PlotManager';
import { PhasesSection } from './detail/PhasesSection';
import { DependenciesSection } from './detail/DependenciesSection';
import { statusCodeOf } from './detail/DetailCommon';
import { useTaskDependencies } from '@/hooks/seasonPlans/useTaskDependencies';
import { useWorkLogs } from '@/hooks/workLog/useWorkLogs';
import { WorkLogsSection } from './detail/WorkLogsSection';
import { WorkLogDetailModal } from '../work-log/WorkLogDetailModal';

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
  onAddTask: (planId: string, phaseId: string, data: { name: string; description: string; startDate: string; endDate: string; plotId: string }) => void;
  onUpdateTask: (planId: string, phaseId: string, task: Task, originalTask?: Task) => void;
  onSelectPhase: (planId: string, phaseId: string) => void;
  onSelectTask: (planId: string, phaseId: string, taskId: string) => void;
  onDeletePlan?: (planId: string) => void;
  onDeletePhase?: (planId: string, phaseId: string) => void;
  onDeleteTask?: (planId: string, phaseId: string, taskId: string) => void;
  initialIsAddingPhase?: boolean;
  onClearInitialIsAddingPhase?: () => void;
  onClone?: (plan: SeasonPlan) => void;
  onAddPhase?: (planId: string, data: { name: string; startDate: string; endDate: string }) => Promise<void>;
  onAddPlots?: (planId: string, plotIds: string[]) => Promise<void>;
  canEdit?: boolean;
  phaseStatusOptions?: { code: string; label: string }[];
  phaseStatusTransitions?: import('@/services/seasonplan/planStageStatusService').PlanStageStatusTransition[];
  taskStatusOptions?: { code: string; label: string }[];
  taskStatusTransitions?: any[];
  fetchTaskAvailableStatuses?: (planId: string, stageId: string, taskId: string) => Promise<any[]>;
  fetchPhaseAvailableStatuses?: (planId: string, stageId: string) => Promise<any[]>;
  onScrollToDate?: (dateStr: string) => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PlanDetailPanel({
  selection,
  isOpen,
  onClose,
  onUpdatePlan,
  onUpdatePhase,
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
  fetchTaskAvailableStatuses,
  fetchPhaseAvailableStatuses,
  onScrollToDate,
}: PlanDetailPanelProps) {
  const { currentFarmId } = useAuth();
  const { selectedFarmId } = useSelector((state: RootState) => state.farm);
  const targetFarmId = currentFarmId || selectedFarmId;
  const { plots, fetchPlots, plotsLoading } = usePlots(targetFarmId || undefined);
  const { warehouses, fetchWarehouses } = useWarehouses();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const { items: warehouseItems } = useWarehouseItems(targetFarmId, selectedWarehouseId || null);
  const { members, fetchMembers, loadingMembers } = useMembers();

  const [activeTab, setActiveTab] = useState<'INFO' | 'MEMBERS' | 'MATERIALS' | 'LOGS'>('INFO');
  const [activeSelection, setActiveSelection] = useState(selection);

  // Use dedicated hook for materials management
  const {
    taskMaterials,
    taskMaterialsLoading,
    addTaskMaterial,
    deleteTaskMaterial
  } = useTaskMaterials(
    activeSelection?.plan.id,
    activeSelection?.type === 'TASK' ? (activeSelection as any).phase.id : undefined,
    activeSelection?.type === 'TASK' ? (activeSelection as any).task.id : undefined,
    isOpen && activeSelection?.type === 'TASK'
  );

  const {
    assignees: taskAssignees,
    loading: isAssigneesQueryLoading,
    adding: isAddingAssignee,
    addAssignee,
    deleteAssignee,
  } = useTaskAssignees(
    activeSelection?.plan.id,
    activeSelection?.type === 'TASK' ? (activeSelection as any).phase.id : undefined,
    activeSelection?.type === 'TASK' ? (activeSelection as any).task.id : undefined,
    isOpen && activeSelection?.type === 'TASK'
  );

  const {
    dependencies,
    loading: isDependenciesLoading,
    adding: isAddingDependency,
    addDependency,
    deleteDependency
  } = useTaskDependencies(
    activeSelection?.plan.id,
    activeSelection?.type === 'TASK' ? (activeSelection as any).phase.id : undefined,
    activeSelection?.type === 'TASK' ? (activeSelection as any).task.id : undefined,
    isOpen && activeTab === 'INFO' && activeSelection?.type === 'TASK'
  );

  const {
    workLogs,
    loading: isWorkLogsLoading
  } = useWorkLogs(
    activeSelection?.plan.id,
    activeSelection?.type === 'TASK' ? (activeSelection as any).phase.id : undefined,
    activeSelection?.type === 'TASK' ? (activeSelection as any).task.id : undefined
  );

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (initialIsAddingPhase) {
      onClearInitialIsAddingPhase?.();
    }
  }, [initialIsAddingPhase]);

  const [availableStatuses, setAvailableStatuses] = useState<any[]>([]);
  const [isAvailableStatusesLoading, setIsAvailableStatusesLoading] = useState(false);

  // Fetch available statuses when selection changes
  useEffect(() => {
    if (!isOpen || !activeSelection) return;

    const fetchStatuses = async () => {
      setAvailableStatuses([]);
      setIsAvailableStatusesLoading(true);
      try {
        if (activeSelection.type === 'TASK' && fetchTaskAvailableStatuses) {
          const statuses = await fetchTaskAvailableStatuses(
            activeSelection.plan.id,
            (activeSelection as any).phase.id,
            (activeSelection as any).task.id
          );
          setAvailableStatuses(statuses);
        } else if (activeSelection.type === 'PHASE' && fetchPhaseAvailableStatuses) {
          const statuses = await fetchPhaseAvailableStatuses(
            activeSelection.plan.id,
            (activeSelection as any).phase.id
          );
          setAvailableStatuses(statuses);
        }
      } catch (error) {
        console.error('Failed to fetch available statuses:', error);
      } finally {
        setIsAvailableStatusesLoading(false);
      }
    };

    fetchStatuses();
  }, [isOpen, activeSelection, fetchTaskAvailableStatuses, fetchPhaseAvailableStatuses]);

  const [tempPlan, setTempPlan] = useState<SeasonPlan | null>(null);
  const [tempPhase, setTempPhase] = useState<Phase | null>(null);
  const [tempTask, setTempTask] = useState<Task | null>(null);
  const [selectedWorkLogId, setSelectedWorkLogId] = useState<string | null>(null);
  const [isWorkLogDetailModalOpen, setIsWorkLogDetailModalOpen] = useState(false);

  // New task form
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskStart, setNewTaskStart] = useState('');
  const [newTaskEnd, setNewTaskEnd] = useState('');
  const [newTaskPlotId, setNewTaskPlotId] = useState('');
  
  // Track if we have already performed a "smart" suggestion for the current adding session
  const [hasSuggested, setHasSuggested] = useState(false);

  useEffect(() => {
    if (!isAddingTask) {
      setHasSuggested(false);
      return;
    }

    if (activeSelection?.type === 'PHASE') {
      const phase = (activeSelection as any).phase;
      const plan = activeSelection.plan;
      
      const currentPhase = plan.phases?.find((p: any) => p.id === phase.id) || phase;
      const rawTasks = currentPhase.tasks; // undefined nếu đang tải, [] nếu rỗng
      
      // Chỉ thực hiện gợi ý nếu chưa có dữ liệu hoặc chưa từng gợi ý "thông minh" trong phiên này
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
        setNewTaskPlotId(phase.plotId || plan.plots?.[0]?.plotId || '');
      }
    }
  }, [isAddingTask, activeSelection, hasSuggested]);

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

  // Tự động load dữ liệu khi mở panel
  useEffect(() => {
    if (isOpen && targetFarmId) {
      void fetchMembers(targetFarmId);
      void fetchPlots();
    }
  }, [isOpen, targetFarmId, fetchMembers, fetchPlots]);

  useEffect(() => {
    const isWarehouseTaskOpen =
      isOpen && activeTab === 'MATERIALS' && activeSelection?.type === 'TASK';
    if (isWarehouseTaskOpen && targetFarmId) {
      void fetchWarehouses(targetFarmId);
    }
  }, [activeSelection?.type, activeTab, fetchWarehouses, isOpen, targetFarmId]);

  useEffect(() => {
    setSelectedWarehouseItemId('');
  }, [selectedWarehouseId]);


  useEffect(() => {
    setActiveSelection(selection);
    setIsEditing(false);
    setSelectedWarehouseId('');
    setSelectedWarehouseItemId('');
    setSelectedAssigneeUserId('');
    setPlannedQty('');
    if (selection) {

      setTempPlan(selection.plan);
      if (selection.type === 'PHASE') setTempPhase(selection.phase);
      if (selection.type === 'TASK') {
        setTempPhase(selection.phase);
        setTempTask(selection.task);
      }
    }
  }, [selection]);

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
        await onUpdatePhase(tempPlan.id, tempPhase, selection.phase);
      } else if (selection.type === 'TASK' && tempPhase && tempTask) {
        await onUpdateTask(tempPlan.id, tempPhase.id, {
          ...tempTask,
          statusCode: statusCodeOf(tempTask.status)
        } as any, selection.task);
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Lỗi khi lưu:', err);
    }
  };

  if (!activeSelection && !isOpen) return null;
  if (!activeSelection) return null;

  const { plan } = activeSelection;
  const sel = activeSelection;

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

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    if (sel.type === 'PLAN') {
      // Backend currently exposes DELETE /plans/{planId} for plan removal.
      onDeletePlan?.(plan.id);
      onClose();
    } else if (sel.type === 'PHASE') {
      onDeletePhase?.(plan.id, (sel as any).phase.id);
      onClose();
    } else if (sel.type === 'TASK') {
      onDeleteTask?.(plan.id, (sel as any).phase.id, (sel as any).task.id);
    }
  };

  const handleAddTaskSubmit = () => {
    if (sel.type !== 'PHASE') return;

    const payload = {
      name: newTaskName,
      description: newTaskDesc,
      startDate: newTaskStart || (sel as any).phase.startDate,
      endDate: newTaskEnd || (sel as any).phase.endDate,
      plotId: newTaskPlotId || (sel as any).phase.plotId || plan.plots?.[0]?.plotId || "",
    };

    const validation = createTaskSchema.safeParse(payload);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    onAddTask(plan.id, (sel as any).phase.id, validation.data as any);
    setNewTaskName(''); setNewTaskDesc('');
    setNewTaskStart(''); setNewTaskEnd('');
    setNewTaskPlotId('');
    setIsAddingTask(false);
  };

  const handleAddMaterialSubmit = async () => {
    if (!activeSelection || activeSelection.type !== 'TASK') return;

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

  const handleAddAssigneeSubmit = async () => {
    if (!activeSelection || activeSelection.type !== 'TASK') return;

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



  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 360, damping: 36 }}
          className="w-[340px] flex-shrink-0 bg-white border-l border-slate-200 flex flex-col z-40 shadow-xl overflow-hidden"
        >
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
                    isAvailableStatusesLoading={isAvailableStatusesLoading}
                    onScrollToDate={onScrollToDate}
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
                      onAdd={addDependency}
                      onDelete={deleteDependency}
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
            </AnimatePresence>

            <div className="h-6" />
          </div>

          <DeleteConfirmModal
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleDelete}
            title={sel.type === 'PHASE' ? 'Xóa giai đoạn?' : 'Xóa công việc?'}
            message={sel.type === 'PHASE'
              ? "Hành động này sẽ xóa vĩnh viễn giai đoạn này và tất cả các công việc liên quan. Bạn có chắc chắn muốn tiếp tục?"
              : "Hành động này sẽ xóa vĩnh viễn công việc này. Bạn có chắc chắn muốn tiếp tục?"}
          />

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