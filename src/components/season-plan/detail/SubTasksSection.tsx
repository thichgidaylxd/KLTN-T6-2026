import { CheckSquare, Plus, Calendar, Package, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phase, SeasonPlan } from '@/types/seasonPlan';
import { DateInput } from '@/components/ui/DateInput';
import { cn } from '@/utils/cn';
import { fmtDate, getStatusColor, statusLabel } from './DetailCommon';

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
  onSelectTask
}: SubTasksSectionProps) {
  const tasks = phase.tasks || [];

  return (
    <div className="px-4 py-3 border-t border-slate-100">
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

      <AnimatePresence>
        {isAddingTask && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-3 bg-slate-50 rounded-xl border border-indigo-100 space-y-3">
              <input
                autoFocus
                placeholder="Tên công việc..."
                className="w-full text-[12px] bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 transition-all font-medium"
                value={newTaskName}
                onChange={e => setNewTaskName(e.target.value)}
              />
              <textarea
                placeholder="Mô tả ngắn..."
                rows={2}
                className="w-full text-[12px] bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 transition-all resize-none"
                value={newTaskDesc}
                onChange={e => setNewTaskDesc(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Bắt đầu</span>
                  <DateInput value={newTaskStart} onChange={setNewTaskStart} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Kết thúc</span>
                  <DateInput value={newTaskEnd} onChange={setNewTaskEnd} />
                </div>
              </div>
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Lô đất</span>
                <select
                  value={newTaskPlotId}
                  onChange={e => setNewTaskPlotId(e.target.value)}
                  className="w-full text-[12px] bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 transition-all font-medium"
                >
                  <option value="">Chọn lô đất</option>
                  {plan.plots?.map(p => (
                    <option key={p.plotId} value={p.plotId}>{p.plotName}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={onAddTask}
                  disabled={!newTaskName}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-[12px] font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  Tạo công việc
                </button>
                <button
                  onClick={() => setIsAddingTask(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[12px] font-bold hover:bg-slate-50 transition-all"
                >
                  Hủy
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1.5">
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
                  className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                  )}
                  style={{ 
                    backgroundColor: getStatusColor(t.status) + '15', 
                    color: getStatusColor(t.status) 
                  }}
                >
                  {statusLabel(t.status)}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><Calendar size={10} /> {fmtDate(t.startDate)}</span>
                {t.plotId && plan.plots && (
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <Package size={10} /> {plan.plots.find(p => p.plotId === t.plotId)?.plotName || 'Lô đất'}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
}
