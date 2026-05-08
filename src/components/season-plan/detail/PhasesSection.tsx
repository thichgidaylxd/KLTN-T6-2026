import { Calendar, Zap, Trash2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SeasonPlan } from '@/types/seasonPlan';

interface PhasesSectionProps {
  plan: SeasonPlan;
  canEdit: boolean;
  onSelectPhase: (planId: string, phaseId: string) => void;
  onDeletePhase: (planId: string, phaseId: string) => void;
}

export function PhasesSection({
  plan,
  canEdit,
  onSelectPhase,
  onDeletePhase
}: PhasesSectionProps) {
  const phases = plan.phases || [];

  const fmtDate = (d: string) => {
    if (!d) return '—';
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}`;
  };

  return (
    <div className="mt-6 border-t border-slate-100 pt-6">
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
            <Zap size={12} fill="currentColor" />
          </div>
          <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-tight">Danh sách giai đoạn</h3>
        </div>
      </div>

      <div className="space-y-1 px-2">
        <AnimatePresence mode="popLayout">
          {phases.map((phase) => (
            <motion.div
              key={phase.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer"
              onClick={() => onSelectPhase(plan.id, phase.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-purple-500 transition-colors">
                  <Zap size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-slate-700 truncate">{phase.name}</div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {fmtDate(phase.startDate)} — {fmtDate(phase.endDate)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 transition-opacity">
                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePhase(plan.id, phase.id);
                    }}
                    className="p-1.5 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <ChevronRight size={14} className="text-slate-300" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {phases.length === 0 && (
          <div className="py-8 text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300">
              <Zap size={24} />
            </div>
            <p className="text-[11px] font-medium text-slate-400">Chưa có giai đoạn nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
