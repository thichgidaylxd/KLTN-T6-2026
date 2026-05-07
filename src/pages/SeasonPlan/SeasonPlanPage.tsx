import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSeasonPlans } from '../../hooks/seasonPlans/useSeasonPlans';
import { SeasonPlan, Task } from '../../types/seasonPlan';
import {
  Search,
  ArrowLeft,
  Loader2,
  Info,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Settings2,
  LayoutGrid,
  List,
  CalendarDays,
  GitBranch,
  Target,
  Code2,
  Archive,
  BookOpen,
  Link2,
  MoreHorizontal,
  Share2,
  Zap,
  Bell,
} from 'lucide-react';

import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../hooks/auth/useAuth';
import { canEditPlan } from '../../utils/seasonPlanUtils';

import { PlanTimeline } from '@/components/season-plan/PlanTimeline';
import { CreatePlanModal } from '@/components/season-plan/CreatePlanModal';
import { ClonePlanModal } from '@/components/season-plan/ClonePlanModal';
import { PlanDetailPanel } from '@/components/season-plan/PlanDetailPanel';
import { CreatePhaseModal } from '@/components/season-plan/CreatePhaseModal';
import { AttendanceManagement } from '@/components/work-log/AttendanceManagement';
import { extractErrorMessage, extractDeleteTaskErrorMessage, extractDeletePhaseErrorMessage } from '@/utils/errorUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SelectionType = 'PLAN' | 'PHASE' | 'TASK';

export interface SelectionState {
  type: SelectionType;
  id: string;
  planId: string;
  phaseId?: string;
}

// ─── Nav tabs (Jira-style project nav) ────────────────────────────────────────

const NAV_TABS = [
  { key: 'summary', label: 'Tổng quan', icon: LayoutGrid },
  { key: 'timeline', label: 'Timeline', icon: CalendarDays },
  { key: 'backlog', label: 'Backlog', icon: List },
  { key: 'board', label: 'Bảng', icon: GitBranch },
  { key: 'calendar', label: 'Lịch', icon: CalendarDays },
  { key: 'goals', label: 'Mục tiêu', icon: Target },
  { key: 'code', label: 'Phát triển', icon: Code2 },
  { key: 'archive', label: 'Lưu trữ', icon: Archive },
  { key: 'pages', label: 'Trang', icon: BookOpen },
  { key: 'shortcuts', label: 'Phím tắt', icon: Link2 },
] as const;

type NavTab = typeof NAV_TABS[number]['key'];

const toLabel = (code: string, name?: string) => name || code;


function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: 'numeric', month: 'numeric', year: 'numeric',
  });
}

function getPlanPlotNames(p: SeasonPlan): string {
  if (p.plots && p.plots.length > 0) return p.plots.map(i => i.plotName).join(', ');
  return '';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SeasonPlanPage() {
  const { farmId, planId } = useParams<{ farmId: string; planId?: string }>();
  const navigate = useNavigate();

  const {
    plans, loading, error,
    fetchPlans, createPlan, deletePlan: removePlan, updatePlanTime,
    fetchStages, fetchPlanPlots, createPhase, deletePhase: removePhase, updatePhase,
    updatePhaseTime, updatePhaseStatus, fetchPlanStageStatuses, fetchPlanStageStatusTransitions, planStageStatuses, planStageStatusTransitions, fetchTasks, createTask: createSeasonTask,
    updateTask: updateSeasonTask, updateTaskTime, updateTaskStatus, deleteTask: removeSeasonTask,
    fetchTaskStatuses, fetchTaskStatusTransitions, taskStatuses, taskStatusTransitions,
    addPlotsToPlan, optimisticallyUpdatePhaseTime, optimisticallyUpdateTaskTime,
    addPlanToState, fetchTaskAvailableStatuses, fetchPhaseAvailableStatuses
  } = useSeasonPlans();

  const { user, accessToken } = useAuth();
  const canEdit = canEditPlan(user?.role, accessToken);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<NavTab>('timeline');
  const [hasVisitedBacklog, setHasVisitedBacklog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Modal state ───────────────────────────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [cloneSourcePlan, setCloneSourcePlan] = useState<SeasonPlan | null>(null);
  const [isCreatePhaseModalOpen, setIsCreatePhaseModalOpen] = useState(false);
  const [phaseModalTargetPlanId, setPhaseModalTargetPlanId] = useState<string | null>(null);
  const [phaseModalInitialData, setPhaseModalInitialData] = useState<
    { name: string; startDate: string; endDate: string } | undefined
  >(undefined);
  const [isPhaseSaving, setIsPhaseSaving] = useState(false);

  // ── Selection ─────────────────────────────────────────────────────────────
  const [selectedItem, setSelectedItem] = useState<SelectionState | null>(null);

  // ── Notification ──────────────────────────────────────────────────────────
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
    details?: string[];
  }>({ isOpen: false, type: 'success', title: '', message: '' });

  // ── Delete confirm ────────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean; planId: string | null; isDeleting: boolean;
  }>({ isOpen: false, planId: null, isDeleting: false });

  // ── Derived data ──────────────────────────────────────────────────────────
  const farmPlans = plans.filter((p: SeasonPlan) => p.farmId === farmId || p.farmId === '');
  const currentPlan = planId ? farmPlans.find(p => p.id === planId) : null;
  const displayPlans = currentPlan ? [currentPlan] : farmPlans;

  const filteredPlans = displayPlans.filter((p: SeasonPlan) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });
  const phaseStatusOptions = planStageStatuses.map((s) => ({
    code: s.code,
    label: toLabel(s.code, s.name),
    color: s.color,
  }));

  const taskStatusOptions = taskStatuses.map((s) => ({
    code: s.code,
    label: toLabel(s.code, s.name),
    color: s.color,
  }));

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (accessToken) {
      fetchPlans();
      // If we are on a specific plan page, fetch its stages and plots immediately
      // instead of waiting for plans to be fetched and currentPlan to be derived.
      if (planId) {
        fetchStages(planId);
        fetchPlanPlots(planId);
      }
    }
  }, [fetchPlans, fetchStages, fetchPlanPlots, accessToken, planId]);

  useEffect(() => {
    fetchPlanStageStatuses();
  }, [fetchPlanStageStatuses]);

  useEffect(() => {
    fetchPlanStageStatusTransitions();
  }, [fetchPlanStageStatusTransitions]);

  useEffect(() => {
    fetchTaskStatuses();
  }, [fetchTaskStatuses]);

  useEffect(() => {
    fetchTaskStatusTransitions();
  }, [fetchTaskStatusTransitions]);

  useEffect(() => {
    if (currentPlan) {
      setActiveTab('timeline');
      setSelectedItem({ type: 'PLAN', id: currentPlan.id, planId: currentPlan.id });
    }
  }, [currentPlan?.id]); // chỉ chạy khi ID plan thay đổi, không phụ thuộc selectedItem

  useEffect(() => {
    if (selectedItem?.planId) {
      fetchStages(selectedItem.planId);
      fetchPlanPlots(selectedItem.planId);
    }
  }, [selectedItem?.planId, fetchStages, fetchPlanPlots]);

  useEffect(() => {
    if (selectedItem?.type === 'PHASE' || selectedItem?.type === 'TASK') {
      const stageId = selectedItem.type === 'PHASE' ? selectedItem.id : selectedItem.phaseId;
      if (stageId && selectedItem.planId) {
        fetchTasks(selectedItem.planId, stageId);
      }
    }
  }, [selectedItem?.id, selectedItem?.phaseId, selectedItem?.type, selectedItem?.planId, fetchTasks]);

  // ── Error helper ──────────────────────────────────────────────────────────


  const showError = (title: string, err: any) =>
    setNotification({ isOpen: true, type: 'error', title, message: extractErrorMessage(err) });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreatePlan = async (newPlanData: any) => {
    try {
      const { plotId, ...planPayload } = newPlanData;
      const plan = await createPlan(planPayload).unwrap();
      if (plotId && plan.id) {
        await addPlotsToPlan(plan.id, [plotId]).unwrap();
        fetchPlanPlots(plan.id);
      }
      setIsCreateModalOpen(false);
      setNotification({
        isOpen: true, type: 'success',
        title: 'Thành công',
        message: 'Kế hoạch mùa vụ đã được khởi tạo và liên kết lô đất',
      });
    } catch (err: any) {
      showError('Lỗi khởi tạo', err);
    }
  };

  const handleUpdatePlan = async (updatedPlan: SeasonPlan) => {
    try {
      const original = plans.find(p => p.id === updatedPlan.id);
      if (!original) return;

      const isDateChanged =
        original.startDate !== updatedPlan.startDate ||
        original.endDate !== updatedPlan.endDate;

      // Cập nhật ngày bắt đầu và kết thúc → PUT /api/v1/plans/{planId}/time
      if (isDateChanged) {
        await updatePlanTime(updatedPlan.id, updatedPlan.startDate, updatedPlan.endDate, original.version).unwrap();
      }
    } catch (err: any) {
      showError('Lỗi cập nhật kế hoạch', err);
    }
  };

  const handleExpandPhase = (planId: string, phaseId: string) => {
    fetchTasks(planId, phaseId);
  };

  const handleUpdatePhaseTimeFromTimeline = async (
    planId: string,
    stageId: string,
    data: { startDate: string; endDate: string }
  ) => {
    try {
      // Optimistic UI update so bar does not snap back while waiting for PUT response
      optimisticallyUpdatePhaseTime({ planId, stageId, startDate: data.startDate, endDate: data.endDate });
      const stageVersion = plans
        .find((p) => p.id === planId)
        ?.phases?.find((ph) => ph.id === stageId)
        ?.version;
      await updatePhaseTime(planId, stageId, { ...data, version: stageVersion }).unwrap();
      await fetchStages(planId).unwrap();
    } catch (err: any) {
      // Re-sync from server when PUT fails to rollback optimistic state
      await fetchStages(planId);
      showError('Lỗi cập nhật timeline giai đoạn', err);
    }
  };

  const handleUpdateTaskTimeFromTimeline = async (
    planId: string,
    stageId: string,
    taskId: string,
    data: { startDate: string; endDate: string }
  ) => {
    try {
      optimisticallyUpdateTaskTime({ planId, stageId, taskId, startDate: data.startDate, endDate: data.endDate });
      const taskVersion = plans
        .find((p) => p.id === planId)
        ?.phases?.find((ph) => ph.id === stageId)
        ?.tasks?.find((t) => t.id === taskId)
        ?.version;
      await updateTaskTime(planId, stageId, taskId, { ...data, version: taskVersion }).unwrap();
    } catch (err: any) {
      // Re-sync from server when PUT fails to rollback optimistic state
      await fetchTasks(planId, stageId);
      showError('Lỗi cập nhật timeline công việc', err);
    }
  };

  const handleUpdatePhase = async (
    planId: string,
    stageId: string,
    data: { name: string; startDate: string; endDate: string; statusCode?: string },
    originalPhase?: any
  ) => {
    try {
      if (!originalPhase) {
        await updatePhase(planId, stageId, data).unwrap();
        return;
      }

      const isDateChanged = originalPhase.startDate !== data.startDate || originalPhase.endDate !== data.endDate;
      const isNameChanged = originalPhase.name !== data.name;
      const originalStatusCode = typeof originalPhase.status === 'string' ? originalPhase.status : originalPhase.status?.code;
      const isStatusChanged = !!data.statusCode && originalStatusCode !== data.statusCode;

      if (isDateChanged) {
        await updatePhaseTime(planId, stageId, {
          startDate: data.startDate,
          endDate: data.endDate,
          version: originalPhase.version,
        }).unwrap();
      }

      if (isNameChanged) {
        await updatePhase(planId, stageId, { ...data, version: originalPhase.version }).unwrap();
      }

      if (isStatusChanged) {
        let targetStatus = planStageStatuses.find((s) => s.code === data.statusCode);
        if (!targetStatus) {
          const refreshedStatuses = await fetchPlanStageStatuses().unwrap();
          targetStatus = refreshedStatuses.find((s: any) => s.code === data.statusCode);
        }
        if (!targetStatus) {
          const availableCodes = planStageStatuses.map((s) => s.code).join(', ');
          throw new Error(`Không tìm thấy status "${data.statusCode}" trong danh mục Plan Stage Status. Có sẵn: [${availableCodes}]`);
        }

        // Xóa phần hardcode check transition ở client, để API backend tự validate
        // và trả về lỗi nếu transition không hợp lệ.

        await updatePhaseStatus(planId, stageId, targetStatus.id).unwrap();
      }
    } catch (err: any) {
      showError('Lỗi cập nhật giai đoạn', err);
    }
  };

  // handleUpdatePhaseTime removed to clear warning

  const handleDeletePlan = (planId: string) =>
    setDeleteConfirm({ isOpen: true, planId, isDeleting: false });

  const confirmDelete = async () => {
    if (!deleteConfirm.planId) return;
    
    setDeleteConfirm(prev => ({ ...prev, isDeleting: true }));
    try {
      await removePlan(deleteConfirm.planId).unwrap();
      setSelectedItem(null);
      if (deleteConfirm.planId === currentPlan?.id)
        navigate(`/farms/${farmId}/season-plans`);
      setDeleteConfirm({ isOpen: false, planId: null, isDeleting: false });
    } catch (err: any) {
      setDeleteConfirm(prev => ({ ...prev, isDeleting: false, isOpen: false }));
      showError('Lỗi xóa kế hoạch', err);
    }
  };

  const handleAddPhase = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    setPhaseModalTargetPlanId(planId);
    // Để trống để người dùng tự nhập ngày theo đúng yêu cầu
    setPhaseModalInitialData({
      name: '',
      startDate: '',
      endDate: ''
    });
    setIsCreatePhaseModalOpen(true);
  };

  const handleSaveNewPhase = async (data: { name: string; startDate: string; endDate: string }) => {
    if (!phaseModalTargetPlanId) return;
    setIsPhaseSaving(true);
    try {
      await createPhase(phaseModalTargetPlanId, data).unwrap();
      setIsCreatePhaseModalOpen(false);
      setPhaseModalTargetPlanId(null);
    } catch (err: any) {
      let errorMsg = 'Thời gian bị trùng hoặc không hợp lệ';
      let details: string[] = [];
      if (err?.message) errorMsg = err.message;
      if (err?.data && typeof err.data === 'object') {
        details = Object.entries(err.data).map(([k, v]: [string, any]) =>
          `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
      }
      setNotification({ isOpen: true, type: 'error', title: 'Lỗi tạo giai đoạn', message: errorMsg, details: details.length ? details : undefined });
    } finally {
      setIsPhaseSaving(false);
    }
  };

  const handleAddTask = async (
    planId: string,
    phaseId: string,
    data: { name: string; description: string; startDate: string; endDate: string; plotId?: string },
  ) => {
    const plan = plans.find(p => p.id === planId);
    const phase = plan?.phases?.find(ph => ph.id === phaseId);
    if (!plan || !phase) return;

    let plotId = data.plotId;
    if (!plotId && plan.plots?.length) plotId = plan.plots[0].plotId;

    if (!plotId) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Thiếu thông tin lô đất',
        message: 'Kế hoạch này chưa được gán lô đất nào. Vui lòng gán lô đất cho kế hoạch trước khi tạo công việc.'
      });
      return;
    }
    try {
      await createSeasonTask(planId, phaseId, { ...data, plotId }).unwrap();
    } catch (err: any) {
      let errorMsg = 'Dữ liệu đầu vào không hợp lệ';
      let details: string[] = [];
      if (Array.isArray(err)) {
        details = err.map((e: any) => `${e.path?.join('.') || 'error'}: ${e.message}`);
      } else if (err?.message) {
        errorMsg = err.message;
        if (err?.data && typeof err.data === 'object')
          details = Object.entries(err.data).map(([k, v]: [string, any]) =>
            `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
      }
      setNotification({ isOpen: true, type: 'error', title: 'Lỗi tạo công việc', message: errorMsg, details: details.length ? details : undefined });
    }
  };

  const handleDeletePhase = async (planId: string, stageId: string) => {
    const cachedPhase = plans
      .find(p => p.id === planId)
      ?.phases?.find(ph => ph.id === stageId);

    const phaseStatus = cachedPhase?.status && typeof cachedPhase.status === 'object' ? cachedPhase.status : null;
    const statusName = (phaseStatus as any)?.name ?? (typeof cachedPhase?.status === 'string' ? cachedPhase.status : undefined);

    try {
      await removePhase(planId, stageId).unwrap();
      setSelectedItem(null);
    } catch (err: any) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Lỗi xóa giai đoạn',
        message: extractDeletePhaseErrorMessage(err, statusName),
      });
    }
  };

  const handleDeleteTask = async (planId: string, stageId: string, taskId: string) => {
    // Lấy thông tin task từ cache để kiểm tra trạng thái trước khi xóa
    const cachedTask = plans
      .find(p => p.id === planId)
      ?.phases?.find(ph => ph.id === stageId)
      ?.tasks?.find(t => t.id === taskId);

    const taskStatus = typeof cachedTask?.status === 'object' ? cachedTask?.status : null;
    const statusName = taskStatus?.name ?? (typeof cachedTask?.status === 'string' ? cachedTask.status : undefined);

    try {
      await removeSeasonTask(planId, stageId, taskId).unwrap();
      setSelectedItem(null);
    } catch (err: any) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Lỗi xóa công việc',
        message: extractDeleteTaskErrorMessage(err, statusName),
      });
    }
  };

  const handleAddPlotsToPlan = async (planId: string, plotIds: string[]) => {
    try {
      await addPlotsToPlan(planId, plotIds).unwrap();
    } catch (err: any) {
      showError('Lỗi thêm lô đất', err);
    }
  };


  const handleUpdateTask = async (planId: string, stageId: string, task: Task, originalTask?: Task) => {
    const plan = plans.find(p => p.id === planId);
    const plotId = task.plotId || (plan?.plots?.length ? plan.plots[0].plotId : undefined);
    if (!plotId) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Thiếu thông tin lô đất',
        message: 'Công việc này thiếu thông tin lô đất và kế hoạch không có lô đất mặc định.'
      });
      return;
    }
    try {
      if (!originalTask) {
        await updateSeasonTask(planId, stageId, task.id, {
          version: task.version ?? 0,
          name: task.name,
          description: task.description || '',
          startDate: task.startDate,
          endDate: task.endDate,
          plotId,
        }).unwrap();
        return;
      }

      const isDateChanged = originalTask.startDate !== task.startDate || originalTask.endDate !== task.endDate;
      const isContentChanged =
        originalTask.name !== task.name ||
        originalTask.description !== task.description ||
        originalTask.plotId !== plotId;

      const originalStatusCode = typeof originalTask.status === 'string' ? originalTask.status : originalTask.status?.code;
      const newStatusCode = (task as any).statusCode || (typeof task.status === 'string' ? task.status : task.status?.code);
      const isStatusChanged = !!newStatusCode && originalStatusCode !== newStatusCode;

      if (isDateChanged) {
        await updateTaskTime(planId, stageId, task.id, {
          startDate: task.startDate,
          endDate: task.endDate,
          version: originalTask.version,
        }).unwrap();
      }

      if (isContentChanged) {
        await updateSeasonTask(planId, stageId, task.id, {
          version: originalTask.version ?? 0,
          name: task.name,
          description: task.description || '',
          startDate: task.startDate,
          endDate: task.endDate,
          plotId,
        }).unwrap();
      }

      if (isStatusChanged) {
        const targetStatus = taskStatuses.find(s => s.code === newStatusCode);
        if (targetStatus) {
          await updateTaskStatus(planId, stageId, task.id, targetStatus.id);
        } else {
          throw new Error(`Không tìm thấy status "${newStatusCode}" trong danh mục Task Status.`);
        }
      }
    } catch (err: any) {
      showError('Lỗi cập nhật', err);
    }
  };

  // ── Selected data resolver ────────────────────────────────────────────────
  const getSelectedData = () => {
    if (!selectedItem) return null;
    const plan = plans.find(p => p.id === selectedItem.planId);
    if (!plan) return null;
    if (selectedItem.type === 'PLAN') return { type: 'PLAN' as const, plan };
    if (selectedItem.type === 'PHASE') {
      const phase = plan.phases?.find(ph => ph.id === selectedItem.id);
      return phase ? { type: 'PHASE' as const, plan, phase } : null;
    }
    if (selectedItem.type === 'TASK') {
      const phase = plan.phases?.find(ph => ph.id === selectedItem.phaseId);
      const task = phase?.tasks?.find(t => t.id === selectedItem.id);
      return task ? { type: 'TASK' as const, plan, phase: phase!, task } : null;
    }
    return null;
  };

  const selectedData = getSelectedData();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">

      {/* ════════════════════════════════════════════════════════
          TOP BAR  (Jira-style: project name + action icons)
      ════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-200 bg-white shrink-0">
        {/* Back button when inside a single plan */}
        {currentPlan && (
          <button
            onClick={() => navigate(`/farms/${farmId}/season-plans`)}
            className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
        )}

        {/* Project icon + name */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Zap size={14} className="text-white" fill="currentColor" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[14px] font-bold text-slate-900 leading-tight truncate">
              {currentPlan ? currentPlan.name : 'Kế hoạch mùa vụ'}
            </h1>
            {currentPlan && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-slate-400">
                  {formatDate(currentPlan.startDate)} — {formatDate(currentPlan.endDate)}
                </span>
                {getPlanPlotNames(currentPlan) && (
                  <span className="text-[11px] font-medium text-slate-500">
                    · {getPlanPlotNames(currentPlan)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action icons (right side — like Jira) */}
        <div className="flex items-center gap-1">
          {canEdit && !currentPlan && (
            <Button
              className="h-7 px-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-none"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + Tạo vụ mùa
            </Button>
          )}
          {canEdit && currentPlan && (
            <button
              className="h-7 px-2.5 text-[11px] font-bold text-rose-500 border border-rose-200 rounded-md hover:bg-rose-50 flex items-center gap-1.5 transition-colors"
              onClick={() => handleDeletePlan(currentPlan.id)}
            >
              <Trash2 size={13} />
              Xóa
            </button>
          )}
          {!canEdit && (
            <div className="flex items-center gap-1.5 px-3 h-7 bg-slate-100 rounded-md text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Info size={12} /> Chỉ xem
            </div>
          )}
          <button className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 transition-colors"><Share2 size={15} /></button>
          <button className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 transition-colors"><Bell size={15} /></button>
          <button className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 transition-colors"

            onClick={() => setSelectedItem(currentPlan ? { type: 'PLAN', id: currentPlan.id, planId: currentPlan.id } : null)}
          ><Settings2 size={15} />

          </button>
          <button className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 transition-colors"><MoreHorizontal size={15} /></button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          NAV TABS  (Summary | Timeline | Backlog | Board …)
      ════════════════════════════════════════════════════════ */}
      <div className="flex items-end gap-0 px-4 border-b border-slate-200 bg-white shrink-0 overflow-x-auto no-scrollbar">
        {NAV_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key === 'backlog') setHasVisitedBacklog(true);
                setActiveTab(tab.key);
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 whitespace-nowrap transition-all',
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300',
              )}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
        {/* Add tab */}
        <button className="flex items-center gap-1 px-3 py-2.5 text-[12px] text-slate-400 hover:text-slate-700 border-b-2 border-transparent whitespace-nowrap ml-1">
          <span className="text-lg leading-none">+</span>
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════
          TIMELINE TAB TOOLBAR  (search + status filters)
          — only shown on timeline tab and when not in single plan
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'timeline' && !currentPlan && (
        <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-slate-100 shrink-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Tìm kiếm kế hoạch..."
              className="pl-8 pr-3 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:bg-white outline-none transition-all w-52"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Epic / Type / Status filters — Jira filter pills */}
          <div className="flex items-center gap-1.5">
            {/* Avatar chips placeholder */}
            <div className="flex items-center -space-x-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-indigo-600">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>

            {/* Status filter pills */}
          </div>

          <div className="flex-1" />

          {/* Group by placeholder */}
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 border border-slate-200 rounded hover:border-slate-400 transition-colors bg-white">
            <Settings2 size={12} />
            Nhóm theo
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          MAIN CONTENT AREA
      ════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">

        {/* ── Tab: Timeline ── */}
        {activeTab === 'timeline' && (
          <>
            <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-slate-50">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
                  <Loader2 className="animate-spin text-indigo-500 mb-3" size={36} />
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Đang tải...</p>
                </div>
              ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                  <div className="w-14 h-14 bg-red-50 text-red-400 rounded-2xl flex items-center justify-center mb-4">
                    <Info size={28} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">Không thể tải kế hoạch</h3>
                  <p className="text-slate-500 text-sm max-w-md mb-5">
                    {typeof error === 'string' ? error : 'Đã có lỗi xảy ra khi kết nối máy chủ.'}
                  </p>
                  <Button onClick={() => fetchPlans()} className="bg-slate-900 text-white hover:bg-slate-800 h-8 text-sm">
                    Thử lại
                  </Button>
                </div>
              ) : (
                <div className="flex-1 h-full min-h-0">
                  <PlanTimeline
                    plans={filteredPlans}
                    onSelect={selection => setSelectedItem(selection)}
                    selectedId={selectedItem?.id}
                    onUpdatePhaseTime={handleUpdatePhaseTimeFromTimeline}
                    onUpdateTaskTime={handleUpdateTaskTimeFromTimeline}
                    onDeletePlan={handleDeletePlan}
                    onAddPhase={handleAddPhase}
                    onExpandPhase={handleExpandPhase}
                    preExpandedPlanId={currentPlan ? undefined : String(planId)}
                    canEdit={canEdit}
                  />
                </div>
              )}
            </div>

            {/* Detail side panel */}
            <PlanDetailPanel
              isOpen={!!selectedItem}
              selection={selectedData}
              onClose={() => {
                setSelectedItem(null);
              }}
              onUpdatePlan={handleUpdatePlan}
              onUpdatePhase={(id, phase) => {
                const originalPhase = selectedData?.type === 'PHASE' ? selectedData.phase : null;
                handleUpdatePhase(id, phase.id, {
                  name: phase.name,
                  startDate: phase.startDate,
                  endDate: phase.endDate,
                  statusCode: typeof phase.status === 'string' ? phase.status : phase.status?.code,
                }, originalPhase);
              }}
              onDeletePhase={handleDeletePhase}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              fetchTaskAvailableStatuses={fetchTaskAvailableStatuses}
              fetchPhaseAvailableStatuses={fetchPhaseAvailableStatuses}
              onSelectPhase={(_id, phaseId) =>
                setSelectedItem({ type: 'PHASE', id: phaseId, planId: _id })}
              onSelectTask={(_pid, stageId, taskId) =>
                setSelectedItem({ type: 'TASK', id: taskId, phaseId: stageId, planId: _pid })}
              onDeletePlan={handleDeletePlan}
              onClone={p => setCloneSourcePlan(p)}
              onAddPlots={handleAddPlotsToPlan}
              canEdit={canEdit}
              phaseStatusOptions={phaseStatusOptions}
              phaseStatusTransitions={planStageStatusTransitions}
              taskStatusOptions={taskStatusOptions}
              taskStatusTransitions={taskStatusTransitions}
            />
          </>
        )}

        {/* ── Tab: Backlog (WorkLog History) ── */}
        {/* Lazy mount: chỉ render khi đã click tab ít nhất 1 lần, sau đó giữ hidden thay vì unmount */}
        {hasVisitedBacklog && currentPlan && (
          <div className={activeTab === 'backlog' ? 'flex-1 flex flex-col min-h-0 overflow-hidden' : 'hidden'}>
            <AttendanceManagement 
              farmId={farmId || ''} 
              plan={currentPlan} 
            />
          </div>
        )}

        {/* ── Other tabs: placeholder ── */}
        {activeTab !== 'timeline' && activeTab !== 'backlog' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/50">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              {(() => {
                const tab = NAV_TABS.find(t => t.key === activeTab);
                const Icon = tab?.icon ?? LayoutGrid;
                return <Icon size={28} className="text-slate-400" />;
              })()}
            </div>
            <p className="text-[13px] font-bold text-slate-600 mb-1">
              {NAV_TABS.find(t => t.key === activeTab)?.label}
            </p>
            <p className="text-[12px] text-slate-400 max-w-xs">
              Tính năng này đang được phát triển. Chuyển sang tab <strong>Timeline</strong> để quản lý kế hoạch mùa vụ.
            </p>
            <button
              className="mt-4 px-4 py-1.5 text-[12px] font-bold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
              onClick={() => setActiveTab('timeline')}
            >
              Xem Timeline
            </button>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════════════════ */}
      <CreatePlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreatePlan}
      />

      <CreatePhaseModal
        isOpen={isCreatePhaseModalOpen}
        onClose={() => setIsCreatePhaseModalOpen(false)}
        onSave={handleSaveNewPhase}
        initialData={phaseModalInitialData}
        isLoading={isPhaseSaving}
      />

      {cloneSourcePlan && (
        <ClonePlanModal
          isOpen
          onClose={() => setCloneSourcePlan(null)}
          onClone={newPlan => addPlanToState(newPlan)}
          plan={cloneSourcePlan}
        />
      )}

      {/* Notification modal */}
      <Modal
        isOpen={notification.isOpen}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
      >
        <div className="bg-white rounded-[28px] p-8 w-full max-w-sm border border-slate-100 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center mb-5',
              notification.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500',
            )}>
              {notification.type === 'success'
                ? <CheckCircle2 size={32} />
                : <AlertCircle size={32} />}
            </div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">{notification.title}</h3>
            <p className="text-sm font-medium text-slate-500 mb-5 leading-relaxed">{notification.message}</p>
            {notification.details?.length && (
              <div className="w-full bg-slate-50 rounded-xl p-3.5 mb-5 text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chi tiết lỗi:</p>
                <ul className="space-y-1">
                  {notification.details.map((d, i) => (
                    <li key={i} className="text-xs text-rose-600 font-bold flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              onClick={() => setNotification(prev => ({ ...prev, isOpen: false }))}
              className={cn(
                'w-full py-5 rounded-xl font-black uppercase tracking-wider text-white border-none',
                notification.type === 'success'
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-slate-900 hover:bg-slate-800',
              )}
            >
              Đóng
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDelete}
        loading={deleteConfirm.isDeleting}
        title="Xóa kế hoạch?"
        message="Bạn có chắc chắn muốn xóa kế hoạch mùa vụ này? Tất cả giai đoạn và công việc liên quan sẽ bị loại bỏ vĩnh viễn."
        confirmLabel="Xóa ngay"
        type="danger"
      />
    </div>
  );
}

export default SeasonPlanPage;