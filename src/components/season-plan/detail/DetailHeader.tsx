import { 
  X, ChevronRight, Edit2, Save, Link2, ExternalLink, Trash2, Layout, Zap, CheckSquare 
} from 'lucide-react';
import { SeasonPlan, Phase, Task } from '@/types/seasonPlan';

interface DetailHeaderProps {
  selection: {
    type: 'PLAN' | 'PHASE' | 'TASK';
    plan: SeasonPlan;
    phase?: Phase;
    task?: Task;
  };
  isEditing: boolean;
  canEdit: boolean;
  onClose: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onSelectPhase: (planId: string, phaseId: string) => void;
}

export function DetailHeader({
  selection,
  isEditing,
  canEdit,
  onClose,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onSelectPhase
}: DetailHeaderProps) {
  const { plan, phase, task, type } = selection;

  const typeIcon =
    type === 'PLAN' ? <Layout size={14} className="text-indigo-500" /> :
      type === 'PHASE' ? <Zap size={14} className="text-violet-500 fill-violet-500" /> :
        <CheckSquare size={14} className="text-blue-500" />;

  const typeLabel =
    type === 'PLAN' ? 'Kế hoạch' : type === 'PHASE' ? 'Giai đoạn' : 'Công việc';

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50 flex-shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 flex-1 min-w-0 text-[11px] text-slate-500 font-medium">
        {typeIcon}
        {type === 'PLAN' && <span className="text-slate-400">{typeLabel}</span>}
        {type !== 'PLAN' && phase && (
          <>
            <ChevronRight size={11} className="text-slate-300 shrink-0" />
            <button
              className="hover:text-indigo-600 truncate max-w-[100px] transition-colors"
              onClick={() => onSelectPhase(plan.id, phase.id)}
            >
              {phase.name}
            </button>
          </>
        )}
        {type === 'TASK' && task && (
          <>
            <ChevronRight size={11} className="text-slate-300 shrink-0" />
            <span className="text-slate-700 truncate flex-1 min-w-0">{task.name}</span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {canEdit && !isEditing && (
          <button
            className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors"
            onClick={onStartEdit}
            title="Chỉnh sửa"
          >
            <Edit2 size={13} />
          </button>
        )}
        {isEditing && (
          <>
            <button
              className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
              onClick={onSaveEdit}
              title="Lưu"
            >
              <Save size={13} />
            </button>
            <button
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
              onClick={onCancelEdit}
              title="Hủy"
            >
              <X size={13} />
            </button>
          </>
        )}
        {!isEditing && (
          <>
            <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors" title="Sao chép link">
              <Link2 size={13} />
            </button>
            <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors" title="Mở rộng">
              <ExternalLink size={13} />
            </button>
            {canEdit && (
              <button
                className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                onClick={onDelete}
                title="Xóa"
              >
                <Trash2 size={13} />
              </button>
            )}
            <button
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
              onClick={onClose}
            >
              <X size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
