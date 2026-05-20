import { CheckIcon, XIcon, AlertTriangleIcon, PencilRulerIcon, Trash2Icon, Undo2Icon } from 'lucide-react'

export type DrawingMode = 'none' | 'drawing' | 'editing'

interface DrawingToolbarProps {
  mode: DrawingMode
  onModeChange: (mode: DrawingMode) => void
  onSave: () => void
  onCancel: () => void
  canSave: boolean
  /** Tên lô đang bị chồng chéo, null nếu không có */
  overlappingPlotName?: string | null
  onUndo?: () => void
  onClear?: () => void
  canUndo?: boolean
}

export function DrawingToolbar({
  mode,
  onSave,
  onCancel,
  canSave,
  overlappingPlotName = null,
  onUndo,
  onClear,
  canUndo = false,
}: DrawingToolbarProps) {
  if (mode === 'none') return null

  const isOverlapping = !!overlappingPlotName

  return (
    <>
      {/* ── Toolbar chính ── */}
      <div
        className={`absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-lg border transition-all duration-300 ${
          isOverlapping ? 'border-red-200' : 'border-white/50'
        }`}
      >
        {/* Trạng thái mini */}
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold border ${
            isOverlapping
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
          }`}
        >
          {isOverlapping ? (
            <AlertTriangleIcon className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <PencilRulerIcon className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>
            {isOverlapping
              ? 'Chồng lấn — vẽ lại'
              : mode === 'drawing'
              ? 'Đang vẽ'
              : 'Đang sửa'}
          </span>
        </div>

        <div className="h-5 w-px bg-gray-200" />

        {/* Hoàn tác */}
        {mode === 'drawing' && onUndo && (
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Hoàn tác điểm vừa vẽ (Chuột phải / Backspace)"
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-95 border ${
              canUndo
                ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Undo2Icon className="w-3.5 h-3.5 shrink-0" />
            Hoàn tác
          </button>
        )}

        {/* Xóa bản vẽ */}
        {mode === 'drawing' && onClear && (
          <button
            type="button"
            onClick={onClear}
            disabled={!canUndo}
            title="Xóa toàn bộ bản vẽ (Esc)"
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-95 border ${
              canUndo
                ? 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'
                : 'bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Trash2Icon className="w-3.5 h-3.5 shrink-0" />
            Xóa
          </button>
        )}

        <div className="h-5 w-px bg-gray-200" />

        {/* Lưu */}
        <button
          onClick={onSave}
          disabled={!canSave || isOverlapping}
          title={isOverlapping ? 'Không thể lưu khi ranh giới chồng chéo' : 'Lưu ranh giới'}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-95 shadow-sm ${
            isOverlapping
              ? 'bg-red-100 text-red-400 cursor-not-allowed shadow-none'
              : canSave
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          <CheckIcon className="w-3.5 h-3.5" />
          Lưu
        </button>

        {/* Hủy */}
        <button
          onClick={onCancel}
          title="Hủy thay đổi"
          className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg text-[11px] font-bold hover:bg-gray-50 transition-all active:scale-95"
        >
          <XIcon className="w-3.5 h-3.5" />
          Hủy
        </button>
      </div>
    </>
  )
}
