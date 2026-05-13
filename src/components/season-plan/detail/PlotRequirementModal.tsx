import { MapPin, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface PlotRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (plotId: string) => void;
  plots: { plotId: string; plotName: string; area?: string }[];
}

export function PlotRequirementModal({
  isOpen,
  onClose,
  onSelect,
  plots,
}: PlotRequirementModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId);
      setSelectedId(null);
    }
  };

  const handleClose = () => {
    setSelectedId(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-full max-w-[360px] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-5 py-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-3 pr-8">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 shadow-sm">
                  <MapPin size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
                    Chọn lô đất
                  </h3>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-normal">
                    Kế hoạch có nhiều lô đất — chọn lô áp dụng cho công việc này.
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                aria-label="Đóng"
              >
                <X size={16} />
              </button>
            </div>

            {/* Plot list */}
            <div className="px-3 py-3 max-h-[260px] overflow-y-auto flex flex-col gap-1.5">
              {plots.map((plot) => {
                const isSelected = selectedId === plot.plotId;
                return (
                  <button
                    key={plot.plotId}
                    onClick={() => setSelectedId(plot.plotId)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all
                      ${isSelected
                        ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/50'
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }
                    `}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                      <MapPin
                        size={15}
                        className={isSelected
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 dark:text-slate-500'
                        }
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-medium truncate transition-colors ${
                        isSelected
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}>
                        {plot.plotName}
                      </p>
                      {plot.area && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {plot.area}
                        </p>
                      )}
                    </div>

                    {/* Check */}
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-slate-100 dark:border-slate-800">
              <p className={`text-[12px] transition-colors ${
                selectedId
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}>
                {selectedId
                  ? `✓ ${plots.find(p => p.plotId === selectedId)?.plotName}`
                  : 'Chưa chọn lô đất nào'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  className="px-3.5 py-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedId}
                  className={`px-3.5 py-1.5 text-[12px] font-medium rounded-lg transition-all ${
                    selectedId
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}