import { Link2, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Phase } from '@/types/seasonPlan';

interface DependenciesSectionProps {
  taskId: string;
  phase: Phase;
  dependencies: string[];
  loading: boolean;
  adding: boolean;
  canEdit: boolean;
  onAdd: (dependsOnTaskId: string) => void;
  onDelete: (dependsOnTaskId: string) => void;
  onSelectTask: (taskId: string) => void;
}

export function DependenciesSection({
  taskId,
  phase,
  dependencies,
  loading,
  adding,
  canEdit,
  onAdd,
  onDelete,
  onSelectTask
}: DependenciesSectionProps) {
  const tasks = phase.tasks || [];
  const deps = Array.isArray(dependencies) ? dependencies : [];
  
  // Ẩn toàn bộ section nếu:
  // 1. Chỉ có 1 task duy nhất trong giai đoạn (không thể phụ thuộc vào chính mình)
  // 2. VÀ hiện tại cũng chưa có bất kỳ liên kết phụ thuộc nào được thiết lập
  if (tasks.length <= 1 && deps.length === 0) {
    return null;
  }

  // Lấy danh sách các task khác trong cùng giai đoạn để có thể chọn làm dependency
  const availableTasks = tasks.filter(t => {
    const isCurrentTask = t.id.toLowerCase() === (taskId || "").toLowerCase();
    const isAlreadyDep = deps.some(dId => dId.toLowerCase() === t.id.toLowerCase());
    return !isCurrentTask && !isAlreadyDep;
  });
  const dependencyTasks = tasks.filter(t => deps.includes(t.id));

  return (
    <div className="px-4 py-3 border-t border-slate-100">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Link2 size={11} /> Công việc tiền nhiệm ({dependencyTasks.length})
      </p>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 size={16} className="animate-spin text-slate-300" />
        </div>
      ) : (
        <div className="space-y-1.5 mb-3">
          {dependencyTasks.map(t => (
            <div 
              key={t.id}
              className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg group"
            >
              <button 
                onClick={() => onSelectTask(t.id)}
                className="text-[12px] font-medium text-slate-600 hover:text-indigo-600 truncate flex-1 text-left"
              >
                {t.name}
              </button>
              {canEdit && (
                <button 
                  onClick={() => onDelete(t.id)}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}

          {!loading && dependencyTasks.length === 0 && (
            <p className="text-[11px] text-slate-400 italic py-1">Chưa có công việc phụ thuộc.</p>
          )}
        </div>
      )}

      {canEdit && availableTasks.length > 0 && (
        <div className="space-y-2">
          <div className="relative">
            <select
              className="w-full text-[11px] bg-white border border-slate-200 rounded-lg px-2 py-1.5 pr-8 outline-none focus:border-indigo-400 transition-all appearance-none cursor-pointer"
              onChange={(e) => {
                if (e.target.value) {
                  onAdd(e.target.value);
                  e.target.value = "";
                }
              }}
              disabled={adding}
            >
              <option value="">+ Thêm công việc tiền nhiệm...</option>
              {availableTasks.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              {adding ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
            </div>
          </div>
          <p className="text-[9px] text-slate-400 flex items-start gap-1 leading-relaxed">
            <AlertCircle size={9} className="mt-0.5 shrink-0" />
            Công việc này chỉ nên bắt đầu sau khi các công việc tiền nhiệm đã hoàn thành.
          </p>
        </div>
      )}
    </div>
  );
}
