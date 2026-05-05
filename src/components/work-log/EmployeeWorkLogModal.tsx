import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Package, Trash2, Loader2, BookOpen } from 'lucide-react';
import { useWorkLogs, useEmployeeWorkLogs } from '@/hooks/workLog/useWorkLogs';
import { formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';

interface EmployeeWorkLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  from: string;
  to: string;
}

export function EmployeeWorkLogModal({ isOpen, onClose, employeeId, employeeName, from, to }: EmployeeWorkLogModalProps) {
  const { data: logs = [], isLoading } = useEmployeeWorkLogs(employeeId, from, to);
  const { deleteWorkLog } = useWorkLogs();

  const handleDelete = async (taskId: string, logId: string) => {
    try {
      await deleteWorkLog(taskId, logId);
      toast.success('Xóa nhật ký thành công');
    } catch (err) {
      toast.error('Không thể xóa nhật ký');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <BookOpen size={20} />
                  </div>
                  <h3 className="text-[18px] font-black text-slate-900 tracking-tight">Lịch sử cá nhân</h3>
                </div>
                <p className="text-[13px] text-slate-500 font-medium ml-[52px]">
                  Nhân viên: <span className="text-indigo-600 font-bold">{employeeName}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-hide">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center py-20">
                  <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
                  <p className="text-[14px] font-bold text-slate-500">Đang truy xuất dữ liệu...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400">
                  <Calendar size={48} className="mb-4 opacity-20" />
                  <p className="text-[15px] font-bold">Không tìm thấy nhật ký làm việc</p>
                  <p className="text-[13px] font-medium">Nhân viên này chưa có ghi nhận công trong khoảng thời gian này.</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="group bg-white border border-slate-200 rounded-[24px] p-5 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1 bg-slate-900 text-white rounded-xl text-[11px] font-black">
                            {formatDate(log.workDate)}
                          </span>
                          <span className={cn(
                            "px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border",
                            log.type === 'OVERTIME' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                          )}>
                            {log.type === 'OVERTIME' ? 'Tăng ca' : 'Chính thức'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[13px] font-bold text-slate-900 mb-2">
                          <Package size={14} className="text-indigo-500" />
                          {log.taskName || 'Công việc không xác định'}
                        </div>
                        <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
                          {log.notes || 'Không có ghi chú'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(log.taskId || log.task?.id || '', log.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={onClose}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[14px] font-black hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200 hover:shadow-indigo-200"
              >
                Đóng lịch sử
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
