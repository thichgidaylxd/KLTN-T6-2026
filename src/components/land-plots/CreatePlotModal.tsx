import React, { useState } from 'react'
import { XIcon, AlertCircleIcon } from 'lucide-react'
import { Plot, Geometry } from '@/types/plot'
import { PlotDrawingMap, PlotDrawingMapHandle } from './PlotDrawingMap'
import { createPlotSchema } from '@/schemas/plotSchemas'

interface CreatePlotModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (plot: any) => void
  existingPlots: Plot[]
  initialGeometry?: Geometry | null
  initialAreaHa?: number
}

export function CreatePlotModal({
  isOpen,
  onClose,
  onSave,
  existingPlots,
  initialGeometry = null,
  initialAreaHa = 0,
}: CreatePlotModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [geometry, setGeometry] = useState<Geometry | null>(null)
  const [areaHa, setAreaHa] = useState(0)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')

  const mapRef = React.useRef<PlotDrawingMapHandle>(null)

  React.useEffect(() => {
    if (isOpen && initialGeometry) {
      setGeometry(initialGeometry)
      setAreaHa(initialAreaHa)
    }
  }, [isOpen, initialGeometry, initialAreaHa])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setWarning('')

    const validation = createPlotSchema.safeParse({ name, geometry, description })
    if (!validation.success) {
      setError(validation.error.errors[0].message)
      return
    }

    const isDuplicate = existingPlots.some(
      (p) => p.name.toLowerCase() === name.trim().toLowerCase(),
    )
    if (isDuplicate && !warning) {
      setWarning('Tên lô đất này đã tồn tại. Nhấn Lưu lần nữa để xác nhận.')
      return
    }

    onSave({
      plotName: validation.data.name,
      ...(validation.data.geometry ? { geometry: validation.data.geometry } : {}),
      ...(validation.data.description ? { description: validation.data.description } : {}),
    })
    handleClose()
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setGeometry(null)
    setAreaHa(0)
    setWarning('')
    setError('')
    onClose()
  }

  const handleGeometryChange = (newGeometry: Geometry | null, newAreaHa: number) => {
    setGeometry(newGeometry)
    setAreaHa(newAreaHa)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 leading-tight">Tạo lô đất mới</h2>
            <p className="text-[10px] text-gray-400 font-medium">Xác định ranh giới và thông tin lô đất</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-white p-1.5 rounded-lg transition-colors shadow-sm"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {error && (
            <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg flex items-start gap-2 border border-red-100">
              <AlertCircleIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {warning && (
            <div className="p-2.5 bg-amber-50 text-amber-800 text-xs rounded-lg flex items-start gap-2 border border-amber-200">
              <AlertCircleIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <p>{warning}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cột 1: Bản đồ */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                <span className="flex items-center justify-center w-4 h-4 bg-emerald-600 text-white rounded-full text-[9px]">1</span>
                Vẽ lô đất trên bản đồ
              </label>
              {/* Map với chiều cao cố định 280px — đủ dùng, modal không bị cao quá */}
              <PlotDrawingMap
                ref={mapRef}
                onGeometryChange={handleGeometryChange}
                existingPlots={existingPlots}
                mapHeight="280px"
                tempPlotData={{
                  name: name || 'Lô đất mới',
                  description: description,
                  status: 'ACTIVE',
                }}
              />
              <p className="text-[10px] text-emerald-700 bg-emerald-50/50 rounded-lg border border-emerald-100 px-2.5 py-1.5 font-semibold leading-relaxed">
                Mẹo: Nhấn "Vẽ polygon" → nhấp từng điểm → <strong>double-click</strong> để chốt ranh giới.
              </p>
            </div>

            {/* Cột 2: Thông tin */}
            <div className="space-y-3">
              <label className="flex items-center gap-1.5 text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                <span className="flex items-center justify-center w-4 h-4 bg-emerald-600 text-white rounded-full text-[9px]">2</span>
                Thông tin lô đất
              </label>

              <div>
                <label htmlFor="plot-name" className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                  Tên lô đất <span className="text-red-500">*</span>
                </label>
                <input
                  id="plot-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Lô A1 - Khu Bắc"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  maxLength={100}
                />
              </div>

              <div>
                <label htmlFor="plot-desc" className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                  Mô tả
                </label>
                <textarea
                  id="plot-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả thêm về vị trí, đặc điểm..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none font-medium"
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight pt-1.5 border-t border-gray-100">
                <span className={geometry ? 'text-emerald-600' : 'text-gray-400'}>
                  {geometry
                    ? `● Ranh giới đã sẵn sàng (${areaHa.toLocaleString(undefined, { maximumFractionDigits: 4 })} ha)`
                    : '○ Chờ vẽ ranh giới'}
                </span>
                {geometry && (
                  <button
                    type="button"
                    onClick={() => mapRef.current?.clear()}
                    className="text-red-500 hover:underline"
                  >
                    Xóa để vẽ lại
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex justify-end gap-2.5 border-t border-gray-100 bg-gray-50/30 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit as any}
            className="px-7 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-md active:scale-95 hover:shadow-emerald-200"
          >
            Tạo lô đất
          </button>
        </div>
      </div>
    </div>
  )
}