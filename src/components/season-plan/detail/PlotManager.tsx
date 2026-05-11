import { Package, Plus, Check, Loader2, AlertCircle, X } from 'lucide-react';
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
  onDeletePlot?: (plotId: string) => void;
  canEdit?: boolean;
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
  onAddPlots,
  onDeletePlot,
  canEdit
}: PlotManagerProps) {
  const currentPlotIds = plan.plots?.map(p => p.plotId) || [];
  const availablePlots = plots.filter(p => !currentPlotIds.includes(p.id));

  const togglePlot = (id: string) => {
    setSelectedPlotIds(
      selectedPlotIds.includes(id)
        ? selectedPlotIds.filter(pid => pid !== id)
        : [...selectedPlotIds, id]
    );
  };

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
              <div className="mb-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-wider">
                  Chọn lô đất cần gán
                </label>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-[180px] overflow-y-auto scrollbar-hide">
                  {loading ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-slate-400">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-[12px] italic">Đang tải dữ liệu...</span>
                    </div>
                  ) : availablePlots.length > 0 ? (
                    availablePlots.map((plot, index) => {
                      const isSelected = selectedPlotIds.includes(plot.id);
                      return (
                        <button
                          key={plot.id}
                          type="button"
                          onClick={() => togglePlot(plot.id)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all',
                            index !== availablePlots.length - 1 && 'border-b border-slate-100',
                            isSelected
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'text-slate-600 hover:bg-slate-50'
                          )}
                        >
                          {/* Checkbox */}
                          <div className={cn(
                            'w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 transition-all',
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600'
                              : 'border-slate-300 bg-white'
                          )}>
                            {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                          </div>

                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <Package size={11} className={isSelected ? 'text-indigo-500' : 'text-slate-400'} />
                            <span className="text-[12px] font-medium truncate">{plot.name}</span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-6 text-slate-400">
                      <AlertCircle size={14} />
                      <span className="text-[12px] italic">Không còn lô đất nào trống</span>
                    </div>
                  )}
                </div>

                {selectedPlotIds.length > 0 && (
                  <p className="text-[10px] text-indigo-500 mt-1.5 ml-1 font-bold flex items-center gap-1">
                    <Check size={10} />
                    Đã chọn {selectedPlotIds.length} lô đất
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  disabled={loadingAddPlot || selectedPlotIds.length === 0}
                  onClick={onAddPlots}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-[12px] font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loadingAddPlot && <Loader2 size={12} className="animate-spin" />}
                  Lưu lô đất
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
            <div key={pp.plotId} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full group">
              <Package size={10} />
              <span className="text-[11px] font-bold">{pp.plotName}</span>
              {canEdit && onDeletePlot && (
                <button
                  onClick={() => onDeletePlot(pp.plotId)}
                  className="hover:text-rose-500 transition-colors ml-0.5"
                >
                  <X size={10} />
                </button>
              )}
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