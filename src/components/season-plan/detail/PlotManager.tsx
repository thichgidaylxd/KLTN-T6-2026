import { Package, Plus, Check, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { SeasonPlan } from '@/types/seasonPlan';

interface PlotManagerProps {
  plan: SeasonPlan;
  plots: any[];
  loading: boolean;
  showAddPlot: boolean;
  setShowAddPlot: (v: boolean) => void;
  selectedPlotIds: string[];
  setSelectedPlotIds: (ids: string[]) => void;
  loadingAddPlot: boolean;
  onAddPlots: () => void;
}

export function PlotManager({
  plan,
  plots,
  loading,
  showAddPlot,
  setShowAddPlot,
  selectedPlotIds,
  setSelectedPlotIds,
  loadingAddPlot,
  onAddPlots
}: PlotManagerProps) {
  const currentPlotIds = plan.plots?.map(p => p.plotId) || [];

  return (
    <div className="px-4 py-3 border-t border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Package size={11} /> Lô đất áp dụng
        </p>
        {!showAddPlot && (
          <button
            onClick={() => setShowAddPlot(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <Plus size={12} /> Gán thêm
          </button>
        )}
      </div>

      <AnimatePresence>
        {showAddPlot && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-3 bg-slate-50 rounded-xl border border-indigo-100">
              <div className="max-h-[160px] overflow-y-auto mb-3 space-y-1 pr-1" style={{ scrollbarWidth: 'none' }}>
                {loading ? (
                  <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-slate-400" /></div>
                ) : plots.filter(p => !currentPlotIds.includes(p.id)).length > 0 ? (
                  plots.filter(p => !currentPlotIds.includes(p.id)).map(plot => (
                    <button
                      key={plot.id}
                      onClick={() => {
                        if (selectedPlotIds.includes(plot.id)) {
                          setSelectedPlotIds(selectedPlotIds.filter(id => id !== plot.id));
                        } else {
                          setSelectedPlotIds([...selectedPlotIds, plot.id]);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[12px] transition-all",
                        selectedPlotIds.includes(plot.id) ? "bg-indigo-50 text-indigo-700 font-bold" : "bg-white text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {plot.name}
                      {selectedPlotIds.includes(plot.id) && <Check size={14} />}
                    </button>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-400 text-center py-2 italic">Không còn lô đất nào trống</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  disabled={loadingAddPlot || selectedPlotIds.length === 0}
                  onClick={onAddPlots}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-[12px] font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loadingAddPlot && <Loader2 size={12} className="animate-spin" />}
                  Lưu thay đổi
                </button>
                <button
                  onClick={() => { setShowAddPlot(false); setSelectedPlotIds([]); }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[12px] font-bold hover:bg-slate-50 transition-all"
                >
                  Hủy
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-2">
        {plan.plots && plan.plots.length > 0 ? (
          plan.plots.map(pp => (
            <div key={pp.plotId} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full">
              <Package size={10} />
              <span className="text-[11px] font-bold">{pp.plotName}</span>
            </div>
          ))
        ) : (
          <div className="flex items-center gap-2 text-slate-400 py-1">
            <AlertCircle size={14} />
            <span className="text-[12px] italic">Kế hoạch chưa có lô đất nào</span>
          </div>
        )}
      </div>
    </div>
  );
}
