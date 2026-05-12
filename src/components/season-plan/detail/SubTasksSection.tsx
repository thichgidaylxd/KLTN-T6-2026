// src/components/season-plan/detail/SubTasksSection.tsx
import { CheckSquare, Plus, Calendar, Package, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phase, SeasonPlan } from '@/types/seasonPlan';
import { TaskSuggestion } from '@/types/ai';
import { DateInput } from '@/components/ui/DateInput';
import { cn } from '@/utils/cn';
import { fmtDate, getStatusColor, statusLabel } from './DetailCommon';
import { TaskSuggestionsSection } from './TaskSuggestionsSection';

interface SubTasksSectionProps {
  phase: Phase;
  plan: SeasonPlan;
  canEdit: boolean;
  isAddingTask: boolean;
  setIsAddingTask: (v: boolean) => void;
  newTaskName: string;
  setNewTaskName: (v: string) => void;
  newTaskDesc: string;
  setNewTaskDesc: (v: string) => void;
  newTaskStart: string;
  setNewTaskStart: (v: string) => void;
  newTaskEnd: string;
  setNewTaskEnd: (v: string) => void;
  newTaskPlotId: string;
  setNewTaskPlotId: (v: string) => void;
  onAddTask: () => void;
  onSelectTask: (taskId: string) => void;
}

export function SubTasksSection({
  phase,
  plan,
  canEdit,
  isAddingTask,
  setIsAddingTask,
  newTaskName,
  setNewTaskName,
  newTaskDesc,
  setNewTaskDesc,
  newTaskStart,
  setNewTaskStart,
  newTaskEnd,
  setNewTaskEnd,
  newTaskPlotId,
  setNewTaskPlotId,
  onAddTask,
  onSelectTask,
}: SubTasksSectionProps) {
  const tasks = phase.tasks || [];

  /**
   * Khi user bấm "Tạo" từ gợi ý AI:
   * — điền sẵn form thêm việc với title + description từ gợi ý
   * — mở form nếu chưa mở
   * — estimatedDays dùng để gợi ý endDate (tính từ hôm nay hoặc startDate của phase)
   */
  const handleCreateFromSuggestion = (suggestion: TaskSuggestion) => {
    setNewTaskName(suggestion.title);
    setNewTaskDesc(suggestion.description ?? '');

    // Tính ngày gợi ý dựa trên estimatedDays
    const base = new Date(phase.startDate);
    const today = new Date();
    const startBase = today > base ? today : base;

    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };

    setNewTaskStart(fmt(startBase));

    if (suggestion.estimatedDays) {
      const endDate = new Date(startBase);
      endDate.setDate(endDate.getDate() + suggestion.estimatedDays - 1);
      // Không vượt quá endDate của phase
      const phaseEnd = new Date(phase.endDate);
      setNewTaskEnd(fmt(endDate > phaseEnd ? phaseEnd : endDate));
    } else {
      setNewTaskEnd(fmt(startBase));
    }

    // Auto-select plot nếu chỉ có 1
    if (!newTaskPlotId && plan.plots?.length === 1) {
      setNewTaskPlotId(plan.plots[0].plotId);
    }

    setIsAddingTask(true);
    // Scroll to form sau khi mở — browser sẽ tự cuộn vì focus autoFocus
  };

  return (
    <div className="px-4 py-3 border-t border-slate-100">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <CheckSquare size={11} /> Công việc ({tasks.length})
        </p>
        {canEdit && !isAddingTask && (
          <button
            onClick={() => setIsAddingTask(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <Plus size={12} /> Thêm việc
          </button>
        )}
      </div>

      {/* ── Add task form ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isAddingTask && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-2.5 bg-slate-50/50 rounded-xl border border-indigo-100 space-y-2">
              <input
                autoFocus
                placeholder="Tên công việc..."
                className="w-full text-[12px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-400 transition-all font-bold text-slate-700"
                value={newTaskName}
                onChange={e => setNewTaskName(e.target.value)}
              />

              {/* Textarea tự giãn theo nội dung */}
              <textarea
                placeholder="Mô tả công việc (không bắt buộc)..."
                rows={2}
                className="w-full text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-400 transition-all resize-none text-slate-600 leading-relaxed"
                style={{ minHeight: '48px', maxHeight: '120px', overflowY: 'auto' }}
                value={newTaskDesc}
                onChange={e => {
                  setNewTaskDesc(e.target.value);
                  // Auto-resize
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />

              <div className="grid grid-cols-2 gap-2">
                <DateInput value={newTaskStart} onChange={setNewTaskStart} className="h-8" />
                <DateInput value={newTaskEnd} onChange={setNewTaskEnd} className="h-8" />
              </div>

              {/* Plot selector + actions */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Không có plot nào */}
                    {(!plan.plots || plan.plots.length === 0) && (
                      <p className="text-[10px] text-slate-400 italic px-1">
                        Kế hoạch chưa có lô đất
                      </p>
                    )}

                    {/* Đúng 1 plot — hiển thị tag, không cần chọn */}
                    {plan.plots && plan.plots.length === 1 && (
                      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                        <span className="text-[10px] text-emerald-600 font-semibold truncate">
                          📍 {plan.plots[0].plotName}
                        </span>
                        <span className="text-[9px] text-emerald-400 shrink-0">(mặc định)</span>
                      </div>
                    )}

                    {/* Nhiều plot — bắt chọn */}
                    {plan.plots && plan.plots.length > 1 && (
                      <select
                        value={newTaskPlotId}
                        onChange={e => setNewTaskPlotId(e.target.value)}
                        className={`w-full text-[11px] bg-white border rounded-lg px-2 py-1.5 outline-none transition-all font-medium ${
                          !newTaskPlotId
                            ? 'border-amber-300 ring-1 ring-amber-100 text-slate-400'
                            : 'border-emerald-200 text-emerald-700 focus:border-indigo-400'
                        }`}
                      >
                        <option value="">— Chọn lô đất (tuỳ chọn) —</option>
                        {plan.plots.map(p => (
                          <option key={p.plotId} value={p.plotId}>
                            {p.plotName}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setIsAddingTask(false)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-lg text-[11px] font-bold hover:bg-slate-100 transition-all"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => onAddTask()}
                      disabled={!newTaskName}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[11px] font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 transition-all shadow-sm shadow-indigo-200"
                    >
                      Tạo
                    </button>
                  </div>
                </div>

                {/* Hint khi chưa chọn lô đất (nhiều plot) */}
                {plan.plots && plan.plots.length > 1 && !newTaskPlotId && (
                  <p className="text-[10px] text-amber-500 italic px-0.5">
                    * Không chọn lô đất thì công việc sẽ không gắn với lô nào
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── AI Suggestions (chỉ hiện khi canEdit) ─────────────────────────── */}
      {canEdit && (
        <TaskSuggestionsSection
          phase={phase}
          plan={plan}
          onCreateFromSuggestion={handleCreateFromSuggestion}
        />
      )}
      {/* ── Task list ─────────────────────────────────────────────────────────── */}
      <div className="space-y-1.5 mb-4">
        {tasks.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelectTask(t.id)}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left"
          >
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: getStatusColor(t.status) }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                  {t.name}
                </span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                  style={{
                    backgroundColor: getStatusColor(t.status) + '15',
                    color: getStatusColor(t.status),
                  }}
                >
                  {statusLabel(t.status)}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar size={10} />
                  {fmtDate(t.startDate)}
                </span>
                {t.plotId && plan.plots && (
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <Package size={10} />
                    {plan.plots.find(p => p.plotId === t.plotId)?.plotName || 'Lô đất'}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight
              size={14}
              className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all"
            />
          </button>
        ))}
      </div>


    </div>
  );
}