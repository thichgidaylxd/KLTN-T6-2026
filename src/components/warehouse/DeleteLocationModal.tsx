import { Loader2, Trash2, X, AlertTriangle, MapPin } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { WarehouseLocation } from "@/hooks/warehouses/useWarehouseLocation";

interface Props {
  location: WarehouseLocation;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeleteLocationModal({ location, isOpen, onClose, onConfirm, loading }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md flex flex-col overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 shrink-0">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100 text-rose-600">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Xóa vị trí kho</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Mã vị trí: {location.code}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-4">
          <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-rose-500 shrink-0" size={18} />
            <p className="text-[13px] text-rose-700 leading-relaxed font-medium">
              Bạn đang xóa vị trí <span className="font-bold underline">"{location.name}"</span>. 
              Mọi liên kết giữa vật tư và vị trí này sẽ bị gỡ bỏ. Hãy đảm bảo vị trí này đang trống.
            </p>
          </div>
          
          <p className="text-sm text-slate-500 text-center px-4">
            Xác nhận để xóa vị trí kho này vĩnh viễn.
          </p>
        </div>

        <div className="px-8 py-6 border-t border-slate-50 flex gap-3 shrink-0 bg-slate-50/50">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            className="flex-1 rounded-xl h-11 font-semibold text-slate-600"
          >
            Hủy bỏ
          </Button>
          <Button 
            type="button" 
            onClick={onConfirm} 
            disabled={loading} 
            className="flex-1 rounded-xl h-11 font-semibold bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Trash2 size={16} />
                <span>Xác nhận xóa</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
