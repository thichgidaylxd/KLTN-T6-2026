import { Plot } from '@/types/plot'
import { PlotStatusBadge } from '@/components/land-plots/PlotStatusBadge'
import { InfoIcon, ChevronRightIcon } from 'lucide-react'

interface PlotInfoPopupProps {
  plot: Plot
  onClose: () => void
}

export function PlotInfoPopup({
  plot,
  onClose,
}: PlotInfoPopupProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-3 min-w-[200px] max-w-[220px] border border-gray-100 font-sans animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1.5">
          <InfoIcon className="w-3 h-3 text-emerald-600" />
          <h3 className="text-xs font-black text-gray-900 tracking-tight leading-tight truncate">
            {plot.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all active:scale-90 shrink-0"
        >
          <ChevronRightIcon className="w-3 h-3 rotate-90" />
        </button>
      </div>

      <div className="mb-2">
        <PlotStatusBadge status={plot.status} />
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-2">
        <div className="bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Diện tích</p>
          <div className="flex items-baseline gap-0.5">
            <span className="text-xs font-black text-emerald-700">{plot.areaHa == null ? 0 : plot.areaHa.toLocaleString('vi-VN')}</span>
            <span className="text-[8px] font-bold text-emerald-500">ha</span>
          </div>
        </div>
        <div className="bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Ranh giới</p>
          <div className="flex items-baseline gap-0.5">
            <span className="text-xs font-black text-emerald-700">
              {plot.geometry?.coordinates?.[0]
                ? Math.max(0, plot.geometry.coordinates[0].length - 1)
                : (plot.boundaries?.length || 0)}
            </span>
            <span className="text-[8px] font-bold text-emerald-500">điểm</span>
          </div>
        </div>
      </div>

      {plot.description && (
        <p className="text-[10px] text-gray-400 italic line-clamp-1 mb-2">"{plot.description}"</p>
      )}

    </div>
  )
}