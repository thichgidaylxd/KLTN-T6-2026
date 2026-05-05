import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Tag, Plus, Trash2, Loader2, ArrowLeft, Search, Barcode } from 'lucide-react'
import { toast } from 'sonner'
import { extractErrorMessage } from '../../utils/errorUtils'
import { useAuth } from '../../hooks/auth/useAuth'
import { useSkus } from '../../hooks/skus/useSkus'
import { useFarms } from '../../hooks/farms/useFarms'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { createSkuSchema } from '../../schemas/skuSchemas'
import { Sku } from '../../types/sku/sku'
import { FarmSummary } from '../../types/farm/farm'

export function SKUListPage() {
  const { farmId } = useParams<{ farmId: string }>()
  const navigate = useNavigate()
  const { skus, loading, fetchSkus, createSku, deleteSku } = useSkus()
  const { farmSummary } = useFarms()
  const { user } = useAuth()

  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSku, setNewSku] = useState({ sku: '', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [skuToDelete, setSkuToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const canManage = useMemo(() => {
    const currentFarm = farmSummary.find((f: FarmSummary) => f.farmId === farmId)
    const myFarmRole = currentFarm?.myRole?.toLowerCase() || user?.role
    return ['owner', 'manager', 'admin'].includes(myFarmRole || '')
  }, [farmSummary, farmId, user])

  useEffect(() => {
    if (farmId) fetchSkus(farmId)
  }, [fetchSkus, farmId])

  const filteredSkus = skus.filter((s: Sku) => 
    s.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validation = createSkuSchema.safeParse({
      sku: newSku.sku,
      description: newSku.description
    })

    if (!validation.success) {
      toast.error(validation.error.errors[0].message)
      return
    }

    if (!farmId) return
    
    setSubmitting(true)
    try {
      await createSku(farmId, { sku: newSku.sku, description: newSku.description }).unwrap()
      toast.success('Đã thêm mã SKU mới')
      setIsModalOpen(false)
      setNewSku({ sku: '', description: '' })
    } catch (err: any) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClick = (skuCode: string) => {
    setSkuToDelete(skuCode)
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!farmId || !skuToDelete) return
    setIsDeleting(true)
    try {
      await deleteSku(farmId, skuToDelete).unwrap()
      toast.success('Đã xóa mã SKU')
    } catch (err: any) {
      toast.error(extractErrorMessage(err))
    } finally {
      setIsDeleting(false)
      setIsDeleteConfirmOpen(false)
      setSkuToDelete(null)
    }
  }

  return (
    <div className="w-full flex-1 space-y-6 font-sans py-4 animate-in fade-in duration-500 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 bg-white p-6 transition-all duration-300">
        <div className="flex items-center gap-6 w-full text-left">
          <button 
            onClick={() => navigate(`/farms/${farmId}/actions`)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all font-bold text-xs shrink-0"
          >
            <ArrowLeft size={14} /> Quay lại
          </button>
          <div className="h-10 w-px bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-4 flex-1">
            <div className="p-3 bg-purple-100/50 rounded-2xl text-purple-600">
              <Tag className="w-8 h-8" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý mã SKU</h1>
              <p className="text-gray-500 mt-0.5 font-medium text-sm">Quản lý mã định danh sản phẩm</p>
            </div>
          </div>
        </div>
        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200/50 active:scale-95 whitespace-nowrap"
          >
            <Plus size={20} /> Thêm mã SKU mới
          </button>
        )}
      </div>

      <div className="px-6 space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm theo mã SKU hoặc mô tả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
          />
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Đang tải dữ liệu...</p>
          </div>
        ) : filteredSkus.length === 0 ? (
          <div className="bg-white rounded-[32px] border border-dashed border-slate-200 py-24 flex flex-col items-center text-center">
            <Barcode className="w-12 h-12 text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-slate-800">Không tìm thấy mã SKU nào</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSkus.map((s: Sku) => (
              <div key={s.sku} className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                      <Barcode className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-slate-800 font-mono text-sm">{s.sku}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{s.description || 'Không có mô tả'}</p>
                    </div>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => handleDeleteClick(s.sku)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Thêm mã SKU mới</h2>
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Mã SKU</label>
                  <input
                    required
                    value={newSku.sku}
                    onChange={e => setNewSku(prev => ({ ...prev, sku: e.target.value.toUpperCase().replace(/\s+/g, '-') }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                    placeholder="VD: PHAN-BON-001"
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium italic">* Mã SKU không được chứa khoảng trắng</p>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Mô tả sản phẩm</label>
                  <textarea
                    value={newSku.description}
                    onChange={e => setNewSku(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] resize-none"
                    placeholder="Nhập mô tả sản phẩm..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu lại'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa SKU"
        message={`Bạn có chắc chắn muốn xóa mã SKU ${skuToDelete}? Thao tác này sẽ gỡ mã này khỏi các báo cáo liên quan.`}
        confirmLabel="Xác nhận xóa"
        loading={isDeleting}
      />
    </div>
  )
}

export default SKUListPage
