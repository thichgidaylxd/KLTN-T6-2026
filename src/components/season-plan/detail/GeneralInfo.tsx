import { Calendar, Package, Zap, CheckSquare, Flag, FileText } from 'lucide-react';
import { SeasonPlan, Phase, Task } from '@/types/seasonPlan';
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
  onSelectPhase
}: GeneralInfoProps) {
  const { plan, type } = selection;

  const phaseStatusOptions = [
    { code: 'DRAFT', label: 'Bản nháp' },
    { code: 'ACTIVE', label: 'Đang thực hiện' },
    { code: 'READY_TO_HARVEST', label: 'Sẵn sàng thu hoạch' },
    { code: 'HARVESTING', label: 'Đang thu hoạch' },
    { code: 'COMPLETED', label: 'Hoàn thành' },
    { code: 'CANCELLED', label: 'Đã hủy' },
  ];
  
  const taskStatusOptions = [
    { code: 'UNASSIGNED', label: 'Chưa giao' },
    { code: 'ASSIGNED', label: 'Đã giao việc' },
    { code: 'IN_PROGRESS', label: 'Đang thực hiện' },
    { code: 'COMPLETED', label: 'Hoàn thành' },
    { code: 'OVERDUE', label: 'Trễ hạn' },
    { code: 'CANCELLED', label: 'Đã hủy' },
  ];

  return (
    <>
      {/* Title section */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-start gap-2">
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
        </div>

        {/* Status lozenge */}
        <div className="flex items-center gap-2 mt-2.5">
          {type === 'PLAN' && (
            <StatusSelect
              value={statusCodeOf(plan.status)}
              options={phaseStatusOptions}
              canEdit={false}
            />
          )}
          {type === 'PHASE' && (
            <StatusSelect
              value={statusCodeOf(tempPhase?.status ?? selection.phase?.status)}
              options={phaseStatusOptions}
              onChange={s => tempPhase && setTempPhase({ ...tempPhase, status: { ...tempPhase.status, code: s } })}
              canEdit={isEditing}
            />
          )}
          {type === 'TASK' && (
            <StatusSelect
              value={statusCodeOf(tempTask?.status ?? selection.task?.status)}
              options={taskStatusOptions}
              onChange={s => tempTask && setTempTask({ ...tempTask, status: { ...tempTask.status, code: s } })}
              canEdit={isEditing}
            />
          )}
        </div>
      </div>

      {/* Detail fields */}
      <div className="px-4 py-1">
        {type === 'PLAN' && (
          <>
            <DetailRow icon={Calendar} label="Ngày bắt đầu">
              <div className="flex-1">
                {isEditing ? (
                  <DateInput value={tempPlan?.startDate ?? ''}
                    onChange={(v: string) => tempPlan && setTempPlan({ ...tempPlan, startDate: v })} />
                ) : <span className="text-[12px] text-slate-700 font-bold tabular-nums">{fmtDate(tempPlan?.startDate ?? plan.startDate)}</span>}
              </div>
            </DetailRow>
            <DetailRow icon={Calendar} label="Ngày kết thúc">
              <div className="flex-1">
                {isEditing ? (
                  <DateInput value={tempPlan?.endDate ?? ''}
                    onChange={(v: string) => tempPlan && setTempPlan({ ...tempPlan, endDate: v })} />
                ) : <span className="text-[12px] text-slate-700 font-bold tabular-nums">{fmtDate(tempPlan?.endDate ?? plan.endDate)}</span>}
              </div>
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
              <div className="flex-1">
                {isEditing ? (
                  <DateInput value={tempPhase?.startDate ?? ''}
                    onChange={(v: string) => tempPhase && setTempPhase({ ...tempPhase, startDate: v })} />
                ) : <span className="text-[12px] text-slate-700 font-bold tabular-nums">{fmtDate(tempPhase?.startDate ?? selection.phase.startDate)}</span>}
              </div>
            </DetailRow>
            <DetailRow icon={Calendar} label="Ngày kết thúc">
              <div className="flex-1">
                {isEditing ? (
                  <DateInput value={tempPhase?.endDate ?? ''}
                    onChange={(v: string) => tempPhase && setTempPhase({ ...tempPhase, endDate: v })} />
                ) : <span className="text-[12px] text-slate-700 font-bold tabular-nums">{fmtDate(tempPhase?.endDate ?? selection.phase.endDate)}</span>}
              </div>
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
              <div className="flex-1">
                {isEditing ? (
                  <DateInput value={tempTask?.startDate ?? ''}
                    onChange={(v: string) => tempTask && setTempTask({ ...tempTask, startDate: v })} />
                ) : <span className="text-[12px] text-slate-700 font-bold tabular-nums">{fmtDate(tempTask?.startDate ?? selection.task.startDate)}</span>}
              </div>
            </DetailRow>
            <DetailRow icon={Calendar} label="Ngày kết thúc">
              <div className="flex-1">
                {isEditing ? (
                  <DateInput value={tempTask?.endDate ?? ''}
                    onChange={(v: string) => tempTask && setTempTask({ ...tempTask, endDate: v })} />
                ) : <span className="text-[12px] text-slate-700 font-bold tabular-nums">{fmtDate(tempTask?.endDate ?? selection.task.endDate)}</span>}
              </div>
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
