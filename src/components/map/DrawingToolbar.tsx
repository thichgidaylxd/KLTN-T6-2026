import { CheckIcon, XIcon, AlertTriangleIcon, PencilRulerIcon } from 'lucide-react'

export type DrawingMode = 'none' | 'drawing' | 'editing'

interface DrawingToolbarProps {
  mode: DrawingMode
  onModeChange: (mode: DrawingMode) => void
  onSave: () => void
  onCancel: () => void
  canSave: boolean
  /** Tên lô đang bị chồng chéo, null nếu không có */
  overlappingPlotName?: string | null
}

export function DrawingToolbar({
  mode,
  onSave,
  onCancel,
  canSave,
  overlappingPlotName = null,
}: DrawingToolbarProps) {
  if (mode === 'none') return null

  const isOverlapping = !!overlappingPlotName

  return (
    <>
      {/* ── Banner cảnh báo chồng chéo (giống canvas demo) ── */}
      {isOverlapping && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
            Lỗi ranh giới không được phép chồng lên nhau hãy vẽ lại đoạn này
          </div>
        </div>
      )}

      {/* ── Toolbar chính ── */}
      <div
        className={`absolute z-10 flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border transition-all duration-300 ${
          isOverlapping
            ? 'top-20 left-1/2 -translate-x-1/2 border-red-200'
            : 'top-4 left-1/2 -translate-x-1/2 border-white/50'
        }`}
      >
        {/* Trạng thái */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${
            isOverlapping
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse'
          }`}
        >
          {isOverlapping ? (
            <AlertTriangleIcon className="w-4 h-4 shrink-0" />
          ) : (
            <PencilRulerIcon className="w-4 h-4 shrink-0" />
          )}
          {isOverlapping
            ? 'Không thể lưu — hãy điều chỉnh ranh giới'
            : mode === 'drawing'
            ? 'Đang vẽ: Click trên bản đồ để tạo các mốc ranh giới'
            : 'Đang sửa: Kéo các điểm mốc để thay đổi hình dạng'}
        </div>

        <div className="h-6 w-px bg-gray-200" />

        <button
          onClick={onSave}
          disabled={!canSave || isOverlapping}
          title={isOverlapping ? 'Không thể lưu khi ranh giới chồng chéo' : undefined}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-md ${
            isOverlapping
              ? 'bg-red-100 text-red-400 cursor-not-allowed shadow-none'
              : canSave
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          <CheckIcon className="w-4 h-4" />
          Lưu ranh giới
        </button>

        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
        >
          <XIcon className="w-4 h-4" />
          Hủy
        </button>
      </div>
    </>
  )
}
