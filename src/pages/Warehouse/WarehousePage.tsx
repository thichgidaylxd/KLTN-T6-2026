import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Warehouse as WarehouseIcon, MapPin, Plus, Trash2, Loader2, ArrowLeft, Map as MapIcon, History, Boxes, Search, Package, TrendingDown, Building } from 'lucide-react'
import { toast } from 'sonner'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../../hooks/auth/useAuth'
import { useWarehouses } from '../../hooks/warehouses/useWarehouses'
import { useWarehouseItems } from '../../hooks/warehouseItems/useWarehouseItems'
import { useFarms } from '../../hooks/farms/useFarms'
import { CreateWarehouseModal, DeleteWarehouseModal } from '../../components/warehouse'
import { Warehouse } from '../../types/warehouse/warehouse'
import { WarehouseItem } from '../../types/warehouseItem/warehouseItem'
import { cn } from '../../utils/cn'
import { ConfirmModal } from '../../components/ui/ConfirmModal'

export function WarehousePage() {
  const navigate = useNavigate()
  const { user, currentFarmId } = useAuth()
  const { warehouses, loading, submitting, fetchWarehouses, deleteWarehouse } = useWarehouses()
  const { farmSummary } = useFarms()

  // Local UI State
  const [activeTab, setActiveTab] = useState<'warehouses' | 'all-items'>('warehouses')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Global Item States
  const { items: allItems, loading: itemsLoading, deleteItemFromFarm } = useWarehouseItems(
    currentFarmId, 
    null, 
    { enabled: activeTab === 'all-items' } // Chỉ fetch khi tab này active
  );
  const [searchTerm, setSearchTerm] = useState('')
  const [isItemDeleteModalOpen, setIsItemDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<WarehouseItem | null>(null)
  const [isDeletingItem, setIsDeletingItem] = useState(false)

  // Redirect to farm selection if no farmId selected
  if (!currentFarmId) {
    return <Navigate to="/farms" replace />
  }

  // RBAC Logic - consistent with other pages
  const canManage = useMemo(() => {
    const currentFarm = farmSummary.find((f: any) => f.farmId === currentFarmId)
    const myFarmRole = currentFarm
      ? (currentFarm.myRole?.toLowerCase() === 'worker' ? 'employee' : currentFarm.myRole?.toLowerCase())
      : user?.role

    return myFarmRole === 'owner' || myFarmRole === 'manager' || myFarmRole === 'admin'
  }, [farmSummary, currentFarmId, user?.role])

  useEffect(() => {
    if (currentFarmId) {
      fetchWarehouses(currentFarmId)
    }
  }, [fetchWarehouses, currentFarmId])

  const handleDeleteClick = (warehouse: Warehouse) => {
    setWarehouseToDelete(warehouse)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!currentFarmId || !warehouseToDelete) return

    setDeletingId(warehouseToDelete.id)
    try {
      await deleteWarehouse(currentFarmId, warehouseToDelete.id).unwrap()
      toast.success('Đã xóa kho hàng thành công')
      // Loại bỏ fetchWarehouses(currentFarmId) để tránh request GET dư thừa và ghi đè cache
      setIsDeleteModalOpen(false)
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : 'Không thể xóa kho hàng')
    } finally {
      setDeletingId(null)
      setWarehouseToDelete(null)
    }
  }

  const handleViewMap = (wh: Warehouse) => {
    if (!currentFarmId) return;
    navigate(`/farms/${currentFarmId}/map?warehouseId=${wh.id}&source=warehouses`, {
      state: {
        selectedWarehouseId: wh.id,
        preloadWarehouse: wh,
        source: 'warehouses',
      },
    });
  };

  const handleItemDeleteClick = (item: WarehouseItem) => {
    setItemToDelete(item)
    setIsItemDeleteModalOpen(true)
  }

  const handleConfirmItemDelete = async () => {
    if (!currentFarmId || !itemToDelete) return
    setIsDeletingItem(true)
    try {
      await deleteItemFromFarm(currentFarmId, itemToDelete.id).unwrap()
      toast.success('Đã xóa vật tư khỏi toàn bộ trang trại')
      setIsItemDeleteModalOpen(false)
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : 'Không thể xóa vật tư')
    } finally {
      setIsDeletingItem(false)
      setItemToDelete(null)
    }
  }

  const filteredItems = useMemo(() => {
    return allItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [allItems, searchTerm])

  return (
    <div className="w-full flex-1 space-y-6 font-sans py-4 animate-in fade-in duration-500 text-left">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 transition-all duration-300">
        <div className="flex items-center gap-6 w-full text-left">
          <button
            onClick={() => navigate(`/farms/${currentFarmId}/actions`)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all font-bold text-xs shrink-0"
          >
            <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm hover:shadow-md transition-all">
              <ArrowLeft size={14} />
            </div>
            Quay lại
          </button>

          <div className="h-10 w-px bg-slate-200 mx-1 hidden sm:block" />

          <div className="flex items-center gap-4 flex-1">
            <div className="p-3 bg-emerald-100/50 rounded-2xl text-emerald-600">
              <WarehouseIcon className="w-8 h-8" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {activeTab === 'warehouses' ? 'Quản lý kho hàng' : 'Vật tư nông trại'}
              </h1>
              <p className="text-gray-500 mt-0.5 font-medium text-sm">
                {activeTab === 'warehouses' 
                  ? 'Theo dõi vị trí và thông tin các kho chứa của trang trại'
                  : 'Quản lý danh mục vật tư trên toàn trang trại'}
              </p>
            </div>
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-2 shrink-0">
            {activeTab === 'warehouses' && (
              <>
                <button
                  onClick={() => navigate(`/farms/${currentFarmId}/transactions`)}
                  className="flex items-center gap-2 h-10 px-4 text-[13px] font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 whitespace-nowrap shadow-sm"
                >
                  <History size={16} className="text-emerald-500" />
                  Lịch sử giao dịch
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 h-10 px-4 text-[13px] font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all active:scale-95 whitespace-nowrap shadow-lg shadow-emerald-200/50"
                >
                  <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                  Thêm kho hàng mới
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="px-6 border-b border-slate-100 bg-white/50">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('warehouses')}
            className={cn(
              "flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2",
              activeTab === 'warehouses' 
                ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
                : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <WarehouseIcon size={16} />
            Danh sách kho
          </button>
          <button
            onClick={() => setActiveTab('all-items')}
            className={cn(
              "flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2",
              activeTab === 'all-items' 
                ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
                : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <Boxes size={16} />
            Vật tư nông trại
            {allItems.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px]">
                {allItems.length}
              </span>
            )}
          </button>
        </div>
      </div>


      {/* Content Section */}
      <div className="px-6 transition-all duration-300">
        {activeTab === 'warehouses' ? (
          loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
              <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Đang tải dữ liệu kho hàng...</p>
            </div>
          ) : warehouses.length === 0 ? (
            <div className="bg-white rounded-[32px] border border-dashed border-slate-200 py-24 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                <WarehouseIcon className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Chưa có dữ liệu kho hàng</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto font-medium">
                {canManage
                  ? 'Hãy thêm kho hàng đầu tiên để bắt đầu quản lý vị trí lưu trữ nông sản của bạn.'
                  : 'Hiện tại chưa có kho hàng nào được đăng ký trong hệ thống.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {warehouses.map((wh) => (
                <div
                  key={wh.id}
                  onClick={() => navigate(`/farms/${currentFarmId}/warehouses/${wh.id}`)}
                  className="group bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 flex flex-col gap-5 transition-all duration-300 relative overflow-hidden cursor-pointer active:bg-slate-50"
                >
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm">
                        <WarehouseIcon className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-[15px] font-bold text-slate-800 leading-tight">{wh.name}</h3>
                        <p className="text-[11px] text-slate-400 font-medium mt-1 line-clamp-1">{wh.description || 'Không có mô tả'}</p>
                      </div>
                    </div>
                    {canManage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(wh);
                        }}
                        disabled={deletingId === wh.id || submitting}
                        className="p-2 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all disabled:opacity-50"
                      >
                        {deletingId === wh.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="h-px bg-slate-50 w-full" />

                  <div className="space-y-4 relative z-10">
                    <div className="flex items-start gap-3 text-[13px] text-slate-600 font-medium text-left">
                      <div className="mt-0.5 p-1 bg-slate-50 rounded-md">
                        <MapPin className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="line-clamp-2 leading-relaxed">{wh.address || 'Chưa cập nhật địa chỉ'}</span>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sẵn sàng</span>
                      </div>
                      <div
                        onClick={(e) => { e.stopPropagation(); handleViewMap(wh); }}
                        className="flex items-center gap-2 text-blue-600 font-bold text-[11px] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all cursor-pointer"
                      >
                        <MapIcon size={12} />
                        Xem trên bản đồ
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* --- FARM INVENTORY TAB --- */
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm vật tư theo tên hoặc SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 text-[13px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
              {itemsLoading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Đang tải danh mục vật tư...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="py-24 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center">
                    <Package size={30} className="text-slate-200" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Không tìm thấy vật tư nào</h3>
                  <p className="text-sm text-slate-400 max-w-xs font-medium">
                    Hãy kiểm tra lại từ khóa tìm kiếm hoặc nhập thêm vật tư vào các kho.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Vật tư</th>
                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Đơn vị</th>
                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Tổng tồn kho</th>
                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Nhà cung cấp</th>
                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Đơn giá TB</th>
                        <th className="px-6 py-4 w-20"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredItems.map((item) => {
                        const isLow = item.stock <= (item.minStockQty || 0);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100/50 group-hover:scale-110 transition-transform">
                                  <Package size={16} />
                                </div>
                                <div>
                                  <p className="text-[14px] font-bold text-slate-800 leading-tight">{item.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100/50">
                                      {item.sku?.sku || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-wider">
                                {item.unit.name}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isLow && <TrendingDown size={14} className="text-rose-500" />}
                                <span className={cn("text-[15px] font-black", isLow ? "text-rose-600" : "text-slate-900")}>
                                  {item.stock.toLocaleString('vi-VN')}
                                </span>
                              </div>
                              {isLow && <p className="text-[10px] text-rose-400 font-bold mt-0.5">Dưới mức tối thiểu</p>}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-[13px] text-slate-600 font-medium">
                                <Building size={14} className="text-slate-300" />
                                {item.supplier?.name || '—'}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-[14px] font-bold text-slate-700">
                                {item.unitPrice ? `${item.unitPrice.toLocaleString('vi-VN')} ₫` : '—'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {canManage && (
                                <button
                                  onClick={() => handleItemDeleteClick(item)}
                                  className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                  title="Xóa vật tư khỏi trang trại"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Section */}
      {currentFarmId && (
        <CreateWarehouseModal
          farmId={currentFarmId}
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            fetchWarehouses(currentFarmId)
          }}
        />
      )}

      <DeleteWarehouseModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setWarehouseToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        warehouse={warehouseToDelete}
        loading={!!deletingId}
      />

      {/* Delete Item Confirmation Modal */}
      <ConfirmModal
        isOpen={isItemDeleteModalOpen}
        onClose={() => setIsItemDeleteModalOpen(false)}
        onConfirm={handleConfirmItemDelete}
        title="Xác nhận xóa vật tư khỏi trang trại"
        message={itemToDelete ? `Bạn có chắc chắn muốn xóa vĩnh viễn "${itemToDelete.name}" khỏi TẤT CẢ các kho trong trang trại? Mọi dữ liệu tồn kho liên quan sẽ bị hủy bỏ.` : ''}
        confirmLabel="Xác nhận xóa toàn bộ"
        loading={isDeletingItem}
        type="danger"
      />
    </div>
  )
}

export default WarehousePage
