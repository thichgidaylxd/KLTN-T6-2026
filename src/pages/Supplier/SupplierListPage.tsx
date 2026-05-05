import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Truck, Plus, Trash2, Loader2, Search,
  Building2, ChevronRight, X, Package, ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../hooks/auth/useAuth'
import { useSuppliers } from '../../hooks/suppliers/useSuppliers'
import { useFarms } from '../../hooks/farms/useFarms'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { createSupplierSchema } from '../../schemas/supplierSchemas'
import { Supplier } from '../../types/supplier/supplier'
import { FarmSummary } from '../../types/farm/farm'
import { extractErrorMessage } from '../../utils/errorUtils'
import { cn } from '../../utils/cn'

// ── Accent palette cycling per card ──────────────────────────────────────────
const CARD_ACCENTS = [
  { icon: 'bg-blue-50 text-blue-600', code: 'bg-blue-50 text-blue-600', dot: 'bg-blue-400' },
  { icon: 'bg-violet-50 text-violet-600', code: 'bg-violet-50 text-violet-600', dot: 'bg-violet-400' },
  { icon: 'bg-emerald-50 text-emerald-600', code: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-400' },
  { icon: 'bg-amber-50 text-amber-600', code: 'bg-amber-50 text-amber-600', dot: 'bg-amber-400' },
  { icon: 'bg-rose-50 text-rose-600', code: 'bg-rose-50 text-rose-600', dot: 'bg-rose-400' },
  { icon: 'bg-sky-50 text-sky-600', code: 'bg-sky-50 text-sky-600', dot: 'bg-sky-400' },
]

export function SupplierListPage() {
  const { farmId } = useParams<{ farmId: string }>()
  const navigate = useNavigate()
  const { suppliers, loading, fetchSuppliers, createSupplier, deleteSupplier } = useSuppliers()
  const { farmSummary } = useFarms()
  const { user } = useAuth()

  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSupplier, setNewSupplier] = useState({ code: '', name: '' })
  const [submitting, setSubmitting] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null)
  const [supplierNameToDelete, setSupplierNameToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const canManage = useMemo(() => {
    const currentFarm = farmSummary.find((f: FarmSummary) => f.farmId === farmId)
    const myFarmRole = currentFarm?.myRole?.toLowerCase() || user?.role
    return ['owner', 'manager', 'admin'].includes(myFarmRole || '')
  }, [farmSummary, farmId, user])

  useEffect(() => {
    if (farmId) fetchSuppliers(farmId)
  }, [fetchSuppliers, farmId])

  const filteredSuppliers = suppliers.filter((s: Supplier) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const validation = createSupplierSchema.safeParse({
      supplierCode: newSupplier.code,
      name: newSupplier.name,
    })
    if (!validation.success) { toast.error(validation.error.errors[0].message); return }
    if (!farmId) return
    setSubmitting(true)
    try {
      await createSupplier(farmId, { supplierCode: newSupplier.code, name: newSupplier.name }).unwrap()
      toast.success('Đã thêm nhà cung cấp mới')
      setIsModalOpen(false)
      setNewSupplier({ code: '', name: '' })
    } catch (err: any) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    setSupplierNameToDelete(suppliers.find((s: Supplier) => s.id === id)?.name || null)
    setSupplierToDelete(id)
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!farmId || !supplierToDelete) return
    setIsDeleting(true)
    try {
      await deleteSupplier(farmId, supplierToDelete).unwrap()
      toast.success('Đã xóa nhà cung cấp')
    } catch (err: any) {
      toast.error(extractErrorMessage(err))
    } finally {
      setIsDeleting(false)
      setIsDeleteConfirmOpen(false)
      setSupplierToDelete(null)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-50">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-[12px] text-slate-500">
          <button
            onClick={() => navigate(`/farms/${farmId}/actions`)}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all mr-1"
            title="Quay lại"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            onClick={() => navigate(`/farms/${farmId}/actions`)}
            className="hover:text-slate-800 transition-colors font-medium"
          >
            Tổng quan
          </button>
          <ChevronRight size={13} className="text-slate-300" />
          <span className="text-slate-800 font-semibold">Nhà cung cấp</span>
        </div>

        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 h-8 px-3.5 text-[12px] font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm"
          >
            <Plus size={13} />
            Thêm nhà cung cấp
          </button>
        )}
      </div>

      {/* ── Page header ── */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
            <Truck size={18} />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 leading-tight">Nhà cung cấp</h1>
            <p className="text-[12px] text-slate-500 mt-0.5">Quản lý đối tác cung ứng vật tư</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
              <Building2 size={14} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Tổng NCC</p>
              <p className="text-[15px] font-bold text-blue-600">{suppliers.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
            <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Package size={14} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Kết quả lọc</p>
              <p className="text-[15px] font-bold text-emerald-600">{filteredSuppliers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto px-6 py-5 space-y-4">

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã NCC..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-[12px] text-slate-500 hover:text-slate-800 transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={28} className="animate-spin text-blue-500" />
            <p className="text-[12px] text-slate-400">Đang tải dữ liệu...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Building2 size={22} className="text-slate-300" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-700">
                {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có nhà cung cấp nào'}
              </p>
              <p className="text-[12px] text-slate-400 mt-1">
                {searchTerm ? 'Thử tìm với từ khóa khác' : 'Nhấn "Thêm nhà cung cấp" để bắt đầu'}
              </p>
            </div>
            {!searchTerm && canManage && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-1 flex items-center gap-1.5 h-8 px-4 text-[12px] font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all"
              >
                <Plus size={13} /> Thêm ngay
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredSuppliers.map((s: Supplier, idx: number) => {
              const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length]
              return (
                <div
                  key={s.code}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', accent.icon)}>
                        <Building2 size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-slate-800 truncate leading-tight">{s.name}</p>
                        <span className={cn('text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md inline-block mt-1', accent.code)}>
                          {s.code}
                        </span>
                      </div>
                    </div>
                    {canManage && (
                      <button
                        onClick={() => handleDeleteClick(s.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-50 flex items-center gap-1.5">
                    <div className={cn('w-1.5 h-1.5 rounded-full', accent.dot)} />
                    <span className="text-[11px] text-slate-400">Đối tác cung ứng</span>
                  </div>
                </div>
              )
            })}

            {/* Add card */}
            {canManage && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="rounded-xl border-2 border-dashed border-slate-200 p-4 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50 transition-all min-h-[100px] group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-all">
                  <Plus size={15} className="group-hover:rotate-90 transition-transform duration-300" />
                </div>
                <span className="text-[11px] font-semibold">Thêm nhà cung cấp</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ══ MODAL: Tạo nhà cung cấp ══ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100">

            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Thêm nhà cung cấp mới</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">Điền thông tin đối tác cung ứng</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Mã nhà cung cấp <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  value={newSupplier.code}
                  onChange={e => setNewSupplier(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all uppercase"
                  placeholder="VD: NCC-001"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tên nhà cung cấp <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  value={newSupplier.name}
                  onChange={e => setNewSupplier(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  placeholder="VD: Công ty TNHH ABC"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-9 text-[13px] font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-9 text-[13px] font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
                >
                  {submitting
                    ? <Loader2 size={14} className="animate-spin" />
                    : <><Plus size={14} />Lưu lại</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa nhà cung cấp "${supplierNameToDelete}"? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa ngay"
        loading={isDeleting}
      />
    </div>
  )
}

export default SupplierListPage