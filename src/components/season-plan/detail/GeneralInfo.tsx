import { Calendar, Package, Zap, CheckSquare, Flag, FileText, ArrowLeftToLine, ArrowRightToLine } from 'lucide-react';
import { SeasonPlan, Phase, Task } from '@/types/seasonPlan';
import { PlanStageStatusTransition } from '@/services/seasonplan/planStageStatusService';
import { DateInput } from '@/components/ui/DateInput';
import { 
  DetailRow, InlineText, StatusSelect, statusCodeOf, fmtDate 
} from './DetailCommon';

interface GeneralInfoProps {
  selection: {
    type: 'PLAN' | 'PHASE' | 'TASK';
    plan: SeasonPlan;
    phase?: Phase;
    task?: Task;
  };
  isEditing: boolean;
  tempPlan: SeasonPlan | null;
  tempPhase: Phase | null;
  tempTask: Task | null;
  setTempPlan: (p: SeasonPlan) => void;
  setTempPhase: (p: Phase) => void;
  setTempTask: (t: Task) => void;
  onSelectPhase: (planId: string, phaseId: string) => void;
  phaseStatusOptions?: { code: string; label: string }[];
  phaseStatusTransitions?: PlanStageStatusTransition[];
  taskStatusOptions?: { code: string; label: string }[];
  taskStatusTransitions?: any[]; // use any or import TaskStatusTransition
  availableStatuses?: any[];
  isAvailableStatusesLoading?: boolean;
  onScrollToDate?: (dateStr: string) => void;
}

export function GeneralInfo({
  selection,
  isEditing,
  tempPlan,
  tempPhase,
  tempTask,
  setTempPlan,
  setTempPhase,
  setTempTask,
  onSelectPhase,
  phaseStatusOptions,
  phaseStatusTransitions,
  taskStatusOptions,
  taskStatusTransitions,
  availableStatuses = [],
  isAvailableStatusesLoading = false,
  onScrollToDate,
}: GeneralInfoProps) {
  const { plan, type } = selection;

  const resolvedPhaseStatusOptions = phaseStatusOptions ?? [];

  // Filter phase options to only show valid transitions from current status
  const currentPhaseStatusCode = statusCodeOf(tempPhase?.status ?? selection.phase?.status);
  const validPhaseOptions = (() => {
    // If we have availableStatuses from backend, use them (they already represent valid "To" states)
    if (type === 'PHASE' && availableStatuses.length > 0) {
      const validCodes = new Set(availableStatuses.map(s => s.code));
      validCodes.add(currentPhaseStatusCode);
      return resolvedPhaseStatusOptions.filter(o => validCodes.has(o.code));
    }

    if (!phaseStatusTransitions || phaseStatusTransitions.length === 0) {
      return resolvedPhaseStatusOptions;
    }
    const validToCodes = new Set(
      phaseStatusTransitions
        .filter(t => t.fromStatus.code === currentPhaseStatusCode)
        .map(t => t.toStatus.code)
    );
    // Always include current status so chip shows correctly
    validToCodes.add(currentPhaseStatusCode);
    return resolvedPhaseStatusOptions.filter(o => validToCodes.has(o.code));
  })();

  const resolvedTaskStatusOptions = taskStatusOptions ?? [];
  const currentTaskStatusCode = statusCodeOf(tempTask?.status ?? selection.task?.status);
  
  const validTaskOptions = (() => {
    // If we have availableStatuses from backend, use them
    if (type === 'TASK' && availableStatuses.length > 0) {
      const validCodes = new Set(availableStatuses.map(s => s.code));
      validCodes.add(currentTaskStatusCode);
      return resolvedTaskStatusOptions.filter(o => validCodes.has(o.code));
    }

    if (!taskStatusTransitions || taskStatusTransitions.length === 0) {
      return resolvedTaskStatusOptions;
    }
    const validToCodes = new Set(
      taskStatusTransitions
        .filter(t => t.fromStatus.code === currentTaskStatusCode)
        .map(t => t.toStatus.code)
    );
    // Always include current status so chip shows correctly
    validToCodes.add(currentTaskStatusCode);
    return resolvedTaskStatusOptions.filter(o => validToCodes.has(o.code));
  })();

  const updateTemp = (field: string, val: any) => {
    if (type === 'PLAN' && tempPlan) setTempPlan({ ...tempPlan, [field]: val });
    if (type === 'PHASE' && tempPhase) setTempPhase({ ...tempPhase, [field]: val });
    if (type === 'TASK' && tempTask) setTempTask({ ...tempTask, [field]: val });
  };

  return (
    <>
      {/* Title section */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <InlineText
                  canEdit={isEditing}
                  value={
                    type === 'PLAN' ? tempPlan?.name ?? '' :
                      type === 'PHASE' ? tempPhase?.name ?? '' :
                        tempTask?.name ?? ''
                  }
                  onChange={v => {
                    if (type === 'PLAN' && tempPlan) setTempPlan({ ...tempPlan, name: v });
                    if (type === 'PHASE' && tempPhase) setTempPhase({ ...tempPhase, name: v });
                    if (type === 'TASK' && tempTask) setTempTask({ ...tempTask, name: v });
                  }}
                />
              </div>

              {/* Persistent Navigation Buttons */}
              {onScrollToDate && (() => {
                const startD = type === 'PLAN' ? plan.startDate : type === 'PHASE' ? selection.phase?.startDate : selection.task?.startDate;
                const endD = type === 'PLAN' ? plan.endDate : type === 'PHASE' ? selection.phase?.endDate : selection.task?.endDate;

                if (!startD && !endD) return null;

                return (
                  <div className="flex bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200 ml-auto shrink-0 self-center">
                    <button
                      onClick={() => startD && onScrollToDate(startD)}
                      className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-indigo-50 text-indigo-500 transition-all group"
                      title="Đi đến ngày bắt đầu"
                    >
                      <ArrowLeftToLine size={14} className="opacity-70 group-hover:opacity-100" />
                      <span className="text-[11px] font-bold text-slate-700 tabular-nums">
                        {startD ? fmtDate(startD) : '--/--/----'}
                      </span>
                    </button>
                    {/* Thick separator line */}
                    <div className="w-[2px] bg-slate-200 self-stretch" />
                    <button
                      onClick={() => endD && onScrollToDate(endD)}
                      className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-emerald-50 text-emerald-500 transition-all group"
                      title="Đi đến ngày kết thúc"
                    >
                      <span className="text-[11px] font-bold text-slate-700 tabular-nums">
                        {endD ? fmtDate(endD) : '--/--/----'}
                      </span>
                      <ArrowRightToLine size={14} className="opacity-70 group-hover:opacity-100" />
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Status lozenge */}
        <div className="flex items-center gap-2 mt-2.5">
          {/* Plan status removed as requested (no API) */}

          {type === 'PHASE' && (
            <StatusSelect
              value={statusCodeOf(tempPhase?.status ?? selection.phase?.status)}
              options={validPhaseOptions}
              onChange={s => tempPhase && setTempPhase({ ...tempPhase, status: { ...tempPhase.status, code: s } })}
              canEdit={isEditing && validPhaseOptions.length > 0 && !isAvailableStatusesLoading}
            />
          )}
          {type === 'TASK' && (
            <StatusSelect
              value={statusCodeOf(tempTask?.status ?? selection.task?.status)}
              options={validTaskOptions}
              onChange={s => tempTask && setTempTask({ ...tempTask, status: { ...tempTask.status, code: s } })}
              canEdit={isEditing && !isAvailableStatusesLoading}
            />
          )}
        </div>
      </div>

      {/* Detail fields */}
      <div className="px-4 py-1">
        {type === 'PLAN' && (
          <>
            <DetailRow icon={Calendar} label="Ngày bắt đầu">
              {isEditing ? (
                <DateInput value={tempPlan?.startDate ?? plan.startDate ?? ''} onChange={val => updateTemp('startDate', val)} />
              ) : (
                <span className="text-[12px] text-slate-700 font-bold tabular-nums">{fmtDate(tempPlan?.startDate ?? plan.startDate)}</span>
              )}
            </DetailRow>
            <DetailRow icon={Calendar} label="Ngày kết thúc">
              {isEditing ? (
                <DateInput value={tempPlan?.endDate ?? plan.endDate ?? ''} onChange={val => updateTemp('endDate', val)} />
              ) : (
                <span className="text-[12px] text-slate-700 font-bold tabular-nums">{fmtDate(tempPlan?.endDate ?? plan.endDate)}</span>
              )}
            </DetailRow>
            <DetailRow icon={Package} label="Lô đất">
              {(tempPlan?.plots ?? plan.plots ?? []).length > 0
                ? <div className="flex flex-wrap gap-1">
                  {(tempPlan?.plots ?? plan.plots ?? []).map(pp => (
                    <span key={pp.plotId} className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {pp.plotName}
                    </span>
                  ))}
                </div>
                : <span className="text-[12px] text-slate-400 italic">Chưa gán lô đất</span>
              }
            </DetailRow>
            <DetailRow icon={Zap} label="Số giai đoạn">
              <span className="text-[12px] text-slate-700 font-medium">{(tempPlan?.phases ?? plan.phases)?.length ?? 0} giai đoạn</span>
            </DetailRow>
          </>
        )}

        {type === 'PHASE' && selection.phase && (
          <>
            <DetailRow icon={Calendar} label="Ngày bắt đầu">
              {isEditing ? (
                <DateInput value={tempPhase?.startDate ?? selection.phase!.startDate} onChange={val => updateTemp('startDate', val)} />
              ) : (
                <span className="text-[12px] text-slate-700 font-bold tabular-nums">{fmtDate(tempPhase?.startDate ?? selection.phase!.startDate)}</span>
              )}
            </DetailRow>
            <DetailRow icon={Calendar} label="Ngày kết thúc">
              {isEditing ? (
                <DateInput value={tempPhase?.endDate ?? selection.phase!.endDate} onChange={val => updateTemp('endDate', val)} />
              ) : (
                <span className="text-[12px] text-slate-700 font-bold tabular-nums">{fmtDate(tempPhase?.endDate ?? selection.phase!.endDate)}</span>
              )}
            </DetailRow>
            <DetailRow icon={CheckSquare} label="Công việc">
              <span className="text-[12px] text-slate-700 font-medium">{(tempPhase?.tasks ?? selection.phase.tasks)?.length ?? 0} công việc</span>
            </DetailRow>
            <DetailRow icon={Flag} label="Kế hoạch">
              <span className="text-[12px] font-medium text-indigo-600">{plan.name}</span>
            </DetailRow>
          </>
        )}

        {type === 'TASK' && selection.task && selection.phase && (
          <>
            <DetailRow icon={Calendar} label="Ngày bắt đầu">
              {isEditing ? (
                <DateInput value={tempTask?.startDate ?? selection.task!.startDate} onChange={val => updateTemp('startDate', val)} />
              ) : (
                <span className="text-[12px] text-slate-700 font-bold tabular-nums">{fmtDate(tempTask?.startDate ?? selection.task!.startDate)}</span>
              )}
            </DetailRow>
            <DetailRow icon={Calendar} label="Ngày kết thúc">
              {isEditing ? (
                <DateInput value={tempTask?.endDate ?? selection.task!.endDate} onChange={val => updateTemp('endDate', val)} />
              ) : (
                <span className="text-[12px] text-slate-700 font-bold tabular-nums">{fmtDate(tempTask?.endDate ?? selection.task!.endDate)}</span>
              )}
            </DetailRow>
            <DetailRow icon={Zap} label="Giai đoạn">
              <button
                className="text-[12px] font-medium text-violet-600 hover:underline"
                onClick={() => onSelectPhase(plan.id, selection.phase!.id)}
              >
                {selection.phase.name}
              </button>
            </DetailRow>
            <DetailRow icon={Flag} label="Kế hoạch">
              <span className="text-[12px] font-medium text-indigo-600">{plan.name}</span>
            </DetailRow>
            <DetailRow icon={Package} label="Lô đất">
              {isEditing ? (
                <select
                  value={tempTask?.plotId ?? ''}
                  onChange={e => tempTask && setTempTask({ ...tempTask, plotId: e.target.value })}
                  className="text-[12px] font-medium text-slate-700 bg-transparent outline-none border-b border-slate-300 focus:border-indigo-400 transition-colors w-full px-1"
                >
                  <option value="">Chọn lô đất...</option>
                  {plan.plots?.map(p => (
                    <option key={p.plotId} value={p.plotId}>{p.plotName}</option>
                  ))}
                </select>
              ) : (
                plan.plots && plan.plots.length > 0
                  ? <span className="text-[12px] font-medium text-emerald-700">{plan.plots.find(p => p.plotId === (tempTask?.plotId ?? selection.task?.plotId))?.plotName || plan.plots[0].plotName}</span>
                  : <span className="text-[12px] text-slate-400 italic">—</span>
              )}
            </DetailRow>
          </>
        )}
      </div>

      {/* Description */}
      <div className="px-4 py-3 border-t border-slate-100">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <FileText size={11} /> Mô tả
        </p>
        <InlineText
          multiline
          canEdit={isEditing && type !== 'PLAN'}
          placeholder="Thêm mô tả..."
          value={
            type === 'PLAN' ? (plan.description ?? '') :
              type === 'PHASE' ? (tempPhase?.description ?? selection.phase?.description ?? '') :
                (tempTask?.description ?? selection.task?.description ?? '')
          }
          onChange={v => {
            if (type === 'PHASE' && tempPhase) setTempPhase({ ...tempPhase, description: v });
            if (type === 'TASK' && tempTask) setTempTask({ ...tempTask, description: v });
          }}
        />
      </div>
    </>
  );
}
