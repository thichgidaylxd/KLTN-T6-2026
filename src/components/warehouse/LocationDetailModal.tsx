import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useWarehouseLocations, type WarehouseLocation } from "@/hooks/warehouses/useWarehouseLocation";
import { X, Loader2, MapPin, Info, Calendar, CheckCircle2, Clock, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface Props {
  farmId: string;
  warehouseId: string;
  locationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function LocationDetailModal({ farmId, warehouseId, locationId, isOpen, onClose }: Props) {
  const { getLocationDetail } = useWarehouseLocations();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && locationId) {
      const fetchDetail = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getLocationDetail(farmId, warehouseId, locationId);
          setDetail(data);
        } catch (err: any) {
          setError(err?.message || "Không thể tải thông tin vị trí");
        } finally {
          setLoading(false);
        }
      };
      void fetchDetail();
    }
  }, [isOpen, locationId, farmId, warehouseId, getLocationDetail]);

  // Helper to render detail content
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-400 font-medium text-sm">Đang tải thông tin chi tiết...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <Info className="text-rose-500 w-8 h-8" />
          </div>
          <p className="text-slate-600 font-bold mb-2 text-sm">{error}</p>
          <Button onClick={onClose} variant="outline" className="rounded-xl">Đóng</Button>
        </div>
      );
    }

    if (!detail) return null;

    // Nếu detail là string (theo snippet), hiển thị như một thông báo hoặc mô tả
    if (typeof detail === 'string') {
      return (
        <div className="p-8">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
            <h3 className="text-emerald-800 font-bold mb-2 flex items-center gap-2 text-sm">
              <Info size={18} /> Thông tin từ hệ thống
            </h3>
            <p className="text-emerald-700 text-xs leading-relaxed whitespace-pre-wrap font-medium">
              {detail}
            </p>
          </div>
        </div>
      );
    }

    // Nếu detail là object (WarehouseLocation hoặc tương tự)
    const loc = detail as WarehouseLocation;
    return (
      <div className="p-8 space-y-6 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Thông tin cơ bản */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tên vị trí</label>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-800 text-sm">
                {loc.name}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Mã vị trí</label>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-mono font-bold text-emerald-600 text-sm">
                {loc.code}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Trạng thái</label>
              <div className={cn(
                "rounded-xl px-4 py-3 font-bold flex items-center gap-2 text-sm",
                loc.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-50 text-slate-500 border border-slate-100"
              )}>
                {loc.isActive ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                {loc.isActive ? "Đang hoạt động" : "Vô hiệu hóa"}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Ngày tạo</label>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-medium text-slate-600 flex items-center gap-2 text-sm">
                <Calendar size={16} className="text-slate-400" />
                {loc.createdAt ? new Date(loc.createdAt).toLocaleString('vi-VN') : "—"}
              </div>
            </div>
          </div>
        </div>

        {loc.description && (
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Mô tả chi tiết</label>
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-600 italic text-sm">
              {loc.description}
            </div>
          </div>
        )}

        {/* Thông tin kho hàng */}
        {loc.warehouse && (
          <div className="mt-8 pt-6 border-t border-slate-100">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Thuộc kho hàng</label>
             <div className="flex items-center gap-4 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                   <Warehouse size={24} />
                </div>
                <div>
                   <p className="text-sm font-bold text-slate-800">{loc.warehouse.name}</p>
                   <p className="text-[11px] text-slate-400">{loc.warehouse.address || "Chưa có địa chỉ"}</p>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 shrink-0">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center border border-violet-100 text-violet-600">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Chi tiết vị trí kho</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Thông tin định danh và trạng thái vận hành</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[300px]">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-50 bg-slate-50/50 flex justify-end">
          <Button onClick={onClose} variant="dark-olive" className="px-10 rounded-xl h-12 font-bold shadow-lg">Đóng</Button>
        </div>
      </div>
    </Modal>
  );
}
