import { useState, useEffect } from 'react';
import {
  Users,
  BarChart2,
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
import { statusCodeOf } from './detail/DetailCommon';

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
  onClone?: (plan: SeasonPlan) => void;
  onAddPlots?: (planId: string, plotIds: string[]) => void;
  canEdit?: boolean;
  phaseStatusOptions?: { code: string; label: string }[];
  phaseStatusTransitions?: import('@/services/seasonplan/planStageStatusService').PlanStageStatusTransition[];
  taskStatusOptions?: { code: string; label: string }[];
  taskStatusTransitions?: any[];
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
  onAddPlots,
  canEdit = false,
  phaseStatusOptions = [],
  phaseStatusTransitions = [],
  taskStatusOptions = [],
  taskStatusTransitions = [],
}: PlanDetailPanelProps) {
  const { currentFarmId } = useAuth();
  const { selectedFarmId } = useSelector((state: RootState) => state.farm);
  const targetFarmId = currentFarmId || selectedFarmId;
  const { plots, fetchPlots, loading: plotsLoading } = usePlots();
  const { warehouses, fetchWarehouses } = useWarehouses();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const { items: warehouseItems } = useWarehouseItems(targetFarmId, selectedWarehouseId || null);
  const { members, fetchMembers, loadingMembers } = useMembers();

  const [activeTab, setActiveTab] = useState<'INFO' | 'MEMBERS' | 'MATERIALS'>('INFO');
  const [activeSelection, setActiveSelection] = useState(selection);

  // Use dedicated hook for materials management
  const {
    materials: taskMaterials,
    loading: isMaterialsQueryLoading,
    adding: isAddingMaterial,
    addMaterial,
    deleteMaterial
  } = useTaskMaterials(
    activeSelection?.plan.id,
    activeSelection?.type === 'TASK' ? (activeSelection as any).phase.id : undefined,
    activeSelection?.type === 'TASK' ? (activeSelection as any).task.id : undefined,
    isOpen && activeTab === 'MATERIALS' && activeSelection?.type === 'TASK'
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
    isOpen && activeTab === 'MEMBERS' && activeSelection?.type === 'TASK'
  );

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempPlan, setTempPlan] = useState<SeasonPlan | null>(null);
  const [tempPhase, setTempPhase] = useState<Phase | null>(null);
  const [tempTask, setTempTask] = useState<Task | null>(null);

  // New task form
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskStart, setNewTaskStart] = useState('');
  const [newTaskEnd, setNewTaskEnd] = useState('');

  const [showAddPlot, setShowAddPlot] = useState(false);
  const [selectedPlotIds, setSelectedPlotIds] = useState<string[]>([]);
  const [loadingAddPlot, setLoadingAddPlot] = useState(false);
  const [selectedWarehouseItemId, setSelectedWarehouseItemId] = useState('');
  const [plannedQty, setPlannedQty] = useState<string>('');
  const [selectedAssigneeUserId, setSelectedAssigneeUserId] = useState('');


  useEffect(() => {
    if (showAddPlot && targetFarmId) {
      fetchPlots(targetFarmId);
    }
  }, [showAddPlot, targetFarmId, fetchPlots]);

  useEffect(() => {
    const isMaterialsTaskOpen =
      isOpen && activeTab === 'MATERIALS' && activeSelection?.type === 'TASK';
    if (isMaterialsTaskOpen && targetFarmId) {
      void fetchWarehouses(targetFarmId);
    }
  }, [activeSelection?.type, activeTab, fetchWarehouses, isOpen, targetFarmId]);

  useEffect(() => {
    const isMembersTaskOpen =
      isOpen && activeTab === 'MEMBERS' && activeSelection?.type === 'TASK';
    if (isMembersTaskOpen && targetFarmId) {
      void fetchMembers(targetFarmId);
    }
  }, [activeSelection?.type, activeTab, fetchMembers, isOpen, targetFarmId]);

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
      onDeletePhase?.(plan.id, sel.phase.id);
      onClose();
    } else if (sel.type === 'TASK') {
      onDeleteTask?.(plan.id, sel.phase.id, sel.task.id);
    }
  };

  const handleAddTaskSubmit = () => {
    if (sel.type !== 'PHASE') return;

    const payload = {
      name: newTaskName,
      description: newTaskDesc,
      startDate: newTaskStart || sel.phase.startDate,
      endDate: newTaskEnd || sel.phase.endDate,
      plotId: sel.phase.plotId || plan.plots?.[0]?.plotId || "",
    };

    const validation = createTaskSchema.safeParse(payload);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    onAddTask(plan.id, sel.phase.id, validation.data as any);
    setNewTaskName(''); setNewTaskDesc('');
    setNewTaskStart(''); setNewTaskEnd('');
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
      await addMaterial(validation.data);
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
            onDelete={() => setShowDeleteConfirm(true)}
            onSelectPhase={onSelectPhase}
          />

          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {/* Tabs bar */}
            <div className="flex items-center px-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <button
                onClick={() => setActiveTab('INFO')}
                className={cn(
                  "px-3 py-3 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2",
                  activeTab === 'INFO' ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-600"
                )}
              >
                Thông tin
              </button>
              {sel.type === 'TASK' && (
                <button
                  onClick={() => setActiveTab('MATERIALS')}
                  className={cn(
                    "px-3 py-3 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2",
                    activeTab === 'MATERIALS' ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-600"
                  )}
                >
                  Vật tư
                </button>
              )}
              <button
                onClick={() => setActiveTab('MEMBERS')}
                className={cn(
                  "px-3 py-3 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2",
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
                  />

                  {sel.type === 'PLAN' && (
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
                  )}

                  {sel.type === 'TASK' && (
                    <div className="px-4 py-3 border-t border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <BarChart2 size={11} /> Tiến độ
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-indigo-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${sel.task.progressPercent ?? 0}%` }}
                            transition={{ duration: .4, ease: 'easeOut' }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 w-8 text-right tabular-nums">
                          {sel.task.progressPercent ?? 0}%
                        </span>
                      </div>
                      {canEdit && (
                        <input
                          type="range" min="0" max="100"
                          value={sel.task.progressPercent ?? 0}
                          onChange={e => onUpdateTask(plan.id, sel.phase.id, { 
                            ...sel.task, 
                            progressPercent: +e.target.value,
                            statusCode: statusCodeOf(sel.task.status)
                          } as any)}
                          disabled={['COMPLETED', 'CANCELLED'].includes(statusCodeOf(sel.task.status))}
                          className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      )}
                    </div>
                  )}

                  {sel.type === 'PHASE' && (
                    <SubTasksSection
                      phase={sel.phase}
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
                      onAddTask={handleAddTaskSubmit}
                      onSelectTask={(taskId) => onSelectTask(plan.id, sel.phase.id, taskId)}
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
                    loading={isMaterialsQueryLoading}
                    adding={isAddingMaterial}
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
                      deleteMaterial(id)
                        .then(() => toast.success('Xóa vật tư thành công'))
                        .catch((err) => toast.error(extractErrorMessage(err)));
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
                      .catch((err) => toast.error(extractErrorMessage(err)));
                  }}
                />
              )}
              {activeTab === 'MEMBERS' && sel.type === 'PHASE' && (
                <div className="px-4 py-3 border-t border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Users size={11} /> Giao việc theo công việc trong giai đoạn
                  </p>
                  {sel.phase.tasks.length > 0 ? (
                    <div className="space-y-2">
                      {sel.phase.tasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => {
                            onSelectTask(plan.id, sel.phase.id, task.id);
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}