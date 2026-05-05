import { Modal } from '../ui/Modal';
import { useWorkLogDetail } from '@/hooks/workLog/useWorkLogs';
import { formatDate } from '@/utils/format';
import { Loader2, Calendar, User, Clock, FileText, Package, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { WorkLogMaterial } from '@/types/workLog/workLog';

interface WorkLogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  workLogId: string;
}

export function WorkLogDetailModal({ isOpen, onClose, taskId, workLogId }: WorkLogDetailModalProps) {
  const { data: detail, isLoading: loading, error } = useWorkLogDetail(taskId, workLogId);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-[24px] overflow-hidden w-full max-w-md shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white relative">
          <h3 className="text-lg font-bold">Chi tiết nhật ký công việc</h3>
          <p className="text-[11px] opacity-80 mt-0.5">Thông tin chi tiết về quá trình thực hiện công việc</p>
          <button 
            onClick={onClose}
            className="absolute top-5 right-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
          >
            ×
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 size={32} className="animate-spin mb-3 text-indigo-500" />
              <p className="text-[13px]">Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle size={32} className="text-rose-500 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Không thể tải thông tin nhật ký</p>
              <button onClick={onClose} className="mt-4 text-indigo-600 font-bold text-sm">Quay lại</button>
            </div>
          ) : detail ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={12} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Ngày làm</span>
                  </div>
                  <p className="text-[13px] font-bold text-slate-800">{formatDate(detail.workDate)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={12} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Loại công</span>
                  </div>
                  <span className={cn(
                    "text-[12px] font-bold",
                    detail.type === 'OVERTIME' ? "text-amber-600" : "text-blue-600"
                  )}>
                    {detail.type === 'OVERTIME' ? 'Tăng ca' : 'Chính thức'}
                  </span>
                </div>
              </div>

              {/* Employee */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User size={14} className="text-indigo-500" />
                  <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Người thực hiện</h4>
                </div>
                <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {(detail.employee?.fullName || detail.employeeName || 'N').charAt(0)}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-800">
                      {detail.employee?.fullName || detail.employeeName || 'Chưa xác định'}
                    </p>
                    {detail.employee?.email && (
                      <p className="text-[11px] text-slate-500">{detail.employee.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={14} className="text-indigo-500" />
                  <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Ghi chú</h4>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-2xl italic text-[13px] text-slate-600 leading-relaxed shadow-sm">
                  {detail.notes || 'Không có ghi chú nào cho ngày làm việc này.'}
                </div>
              </div>

              {/* Materials */}
              {detail.materials && detail.materials.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Package size={14} className="text-indigo-500" />
                    <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Vật tư đã dùng</h4>
                  </div>
                  <div className="space-y-2">
                    {detail.materials.map((m: WorkLogMaterial, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[13px] font-medium text-slate-700">{m.warehouseItemName || 'Vật tư'}</span>
                        <span className="text-[13px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                          {m.usedQty} {m.unitCode}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white text-[12px] font-bold rounded-xl hover:bg-slate-800 transition-all uppercase tracking-wider"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
