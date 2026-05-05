import React, { useEffect, useState } from 'react'
import { XIcon, AlertCircleIcon, InfoIcon } from 'lucide-react'
import { Plot } from '@/types/plot'
import { updatePlotSchema } from '@/schemas/plotSchemas'

interface EditPlotModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (plot: Plot) => void
  plot: Plot | null
}

export function EditPlotModal({
  isOpen,
  onClose,
  onSave,
  plot,
}: EditPlotModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<string>('ACTIVE')
  const [error, setError] = useState('')

  useEffect(() => {
    if (plot) {
      setName(plot.name)
      setDescription(plot.description || '')
      setStatus(plot.status)
      setError('')
    }
  }, [plot])

  if (!isOpen || !plot) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validation = updatePlotSchema.safeParse({
      name,
      status,
      description,
      version: plot.version
    })

    if (!validation.success) {
      setError(validation.error.errors[0].message)
      return
    }

    onSave({
      ...plot,
      name: validation.data.name || '',
      description: validation.data.description || '',
      status: (validation.data.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa lô đất</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2 border border-red-100">
              <AlertCircleIcon className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="edit-name"
              className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-tight"
            >
              Tên lô đất <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              maxLength={100}
            />
          </div>

          <div>
            <label
              htmlFor="edit-status"
              className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-tight"
            >
              Trạng thái
            </label>
            <select
              id="edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-700"
            >
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Ngưng hoạt động</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="edit-description"
              className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-tight"
            >
              Mô tả
            </label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
            />
          </div>

   
<div className="p-4 bg-emerald-50 text-emerald-800 text-sm rounded-xl flex items-start gap-3 border border-emerald-100">
  <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600 shrink-0">
    <InfoIcon className="w-5 h-5" />
  </div>
  <div className="flex flex-col gap-1">
    <span className="font-bold text-emerald-900 leading-tight">Đang chỉnh sửa trên bản đồ</span>
    <p className="text-sm text-emerald-700 leading-relaxed font-medium">
      Ranh giới lô đất có thể được điều chỉnh trực tiếp trên bản đồ sau khi lưu thông tin này.
    </p>
  </div>
</div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all active:scale-95"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all shadow-md active:scale-95"
            >
              Cập nhật
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
