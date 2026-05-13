import { Package, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { TaskMaterial } from '@/types/taskMaterial';

interface MaterialsSectionProps {
  materials: TaskMaterial[];
  loading: boolean;
  adding: boolean;
  canEdit: boolean;
  warehouses: any[];
  warehouseItems: any[];
  selectedWarehouseId: string;
  selectedWarehouseItemId: string;
  plannedQty: string;
  onWarehouseChange: (id: string) => void;
  onItemChange: (id: string) => void;
  onQtyChange: (val: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export function MaterialsSection({
  materials,
  loading,
  adding,
  canEdit,
  warehouses,
  warehouseItems,
  selectedWarehouseId,
  selectedWarehouseItemId,
  plannedQty,
  onWarehouseChange,
  onItemChange,
  onQtyChange,
  onAdd,
  onDelete
}: MaterialsSectionProps) {
  return (
    <div className="px-4 py-3 border-t border-slate-100">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
        <Package size={11} /> Vật tư công việc
      </p>

      {canEdit && (
        <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
          <div className="grid grid-cols-1 gap-2">
            <select
              value={selectedWarehouseId}
              onChange={e => onWarehouseChange(e.target.value)}
              className="text-[12px] bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 transition-all"
            >
              <option value="">Chọn kho vật tư...</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>

            <select
              disabled={!selectedWarehouseId}
              value={selectedWarehouseItemId}
              onChange={e => onItemChange(e.target.value)}
              className="text-[12px] bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 disabled:opacity-50 transition-all"
            >
              <option value="">Chọn loại vật tư...</option>
              {warehouseItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} (Tồn: {item.stock - item.reservedQty} {item.unit?.name})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Số lượng..."
              value={plannedQty}
              onChange={e => onQtyChange(e.target.value)}
              className="flex-1 text-[12px] bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 transition-all"
            />
            <button
              disabled={adding || !selectedWarehouseItemId || !plannedQty}
              onClick={onAdd}
              className="px-4 bg-indigo-600 text-white rounded-lg text-[12px] font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Thêm
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <Loader2 size={24} className="animate-spin mb-2" />
          <p className="text-[12px]">Đang tải vật tư...</p>
        </div>
      ) : materials.length > 0 ? (
        <div className="space-y-2">
          {materials.map((m, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              key={m.id || idx}
              className="group p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-100 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-slate-800 truncate">{m.warehouseItem.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {m.plannedQty} {m.warehouseItem.unit?.name}
                    </span>
                  </div>
                </div>
                {canEdit && (
                  <button 
                    onClick={() => onDelete(m.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-600 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <AlertCircle size={20} />
          </div>
          <p className="text-[12px] text-slate-500 font-medium">Chưa có vật tư nào được gán</p>
          <p className="text-[10px] text-slate-400 mt-1 px-6">Vật tư sẽ được xuất kho khi công việc bắt đầu</p>
        </div>
      )}
    </div>
  );
}
