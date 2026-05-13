import { Plot } from '@/types/plot';
import { MapPinIcon, PencilIcon, MousePointer2Icon, Trash2Icon } from 'lucide-react';

interface Props {
  plot: Plot;
  isActive: boolean;
  onSelect: (plot: Plot) => void;
  onEdit?: (plot: Plot) => void;
  onEditBoundaries?: (plot: Plot) => void;
  onStartDraw?: (plot: Plot) => void;
  onDelete?: (plot: Plot) => void;
}

export function PlotListItem({ 
  plot, 
  isActive, 
  onSelect, 
  onEdit, 
  onEditBoundaries, 
  onStartDraw, 
  onDelete 
}: Props) {
  const hasGeometry = !!plot.geometry?.coordinates?.[0]?.length;
  const isReadonly = !onEdit && !onEditBoundaries && !onStartDraw && !onDelete;

  return (
    <div className={`px-3 py-2.5 border-b border-gray-50 last:border-b-0 transition-all ${
      isActive ? 'bg-emerald-50/80 border-l-4 border-l-emerald-500' : 'bg-white hover:bg-gray-50/50'
    }`}>
      {/* Header: tên + badge — thu nhỏ */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <button onClick={() => onSelect(plot)} className="text-left flex-1 min-w-0">
          <p className={`text-xs font-bold truncate ${isActive ? 'text-emerald-900' : 'text-gray-900'}`}>
            {plot.name}
          </p>
          <p className="text-[10px] text-gray-400 font-medium">
            {hasGeometry ? `${(plot.areaHa ?? 0).toLocaleString('vi-VN')} ha` : 'Chưa có ranh giới'}
          </p>
        </button>
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase shrink-0 ${
          hasGeometry ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {hasGeometry ? 'Đã vẽ' : 'Chưa vẽ'}
        </span>
      </div>

      {/* Actions — 1 hàng duy nhất, compact hơn */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onSelect(plot)}
          className="text-[9px] font-bold px-2 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1 transition-colors"
        >
          <MapPinIcon className="w-2.5 h-2.5" /> Vị trí
        </button>

        {!isReadonly && (
          <>
            {hasGeometry ? (
              onEditBoundaries && (
                <button
                  onClick={() => onEditBoundaries(plot)}
                  className="text-[9px] font-bold px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 flex-1 justify-center transition-colors"
                >
                  <MousePointer2Icon className="w-2.5 h-2.5" /> Sửa ranh giới
                </button>
              )
            ) : (
              onStartDraw && (
                <button
                  onClick={() => onStartDraw(plot)}
                  className="text-[9px] font-bold px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 flex-1 justify-center transition-colors"
                >
                  <PencilIcon className="w-2.5 h-2.5" /> Vẽ mới
                </button>
              )
            )}

            {onEdit && (
              <button
                onClick={() => onEdit(plot)}
                className="text-[9px] font-bold px-2 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1 transition-colors"
              >
                <PencilIcon className="w-2.5 h-2.5" />
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => onDelete(plot)}
                className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2Icon className="w-3 h-3" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
