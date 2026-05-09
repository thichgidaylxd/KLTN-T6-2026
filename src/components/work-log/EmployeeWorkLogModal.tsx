import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Loader2, BookOpen, Briefcase, User, Clock, MapPin, StickyNote, ChevronRight } from 'lucide-react';
import { useEmployeeWorkLogs } from '@/hooks/workLog/useWorkLogs';
import { formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white overflow-hidden shrink-0">
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/5" />
              <div className="absolute -bottom-6 left-6 w-32 h-32 rounded-full bg-white/5" />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                      <BookOpen size={16} />
                    </div>
                    <h3 className="text-[16px] font-black tracking-tight">Lịch sử công việc</h3>
                  </div>
                  <div className="flex items-center gap-1.5 ml-[42px]">
                    <User size={11} className="text-white/60" />
                    <p className="text-[11px] text-white/70 font-medium">
                      {employeeName}
                    </p>
                  </div>
                  {(from || to) && (
                    <div className="flex items-center gap-1.5 ml-[42px] mt-0.5">
                      <Calendar size={11} className="text-white/60" />
                      <p className="text-[10.5px] text-white/60 font-medium">
                        {from && formatDate(from)} {from && to && '→'} {to && formatDate(to)}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-all text-white/70 hover:text-white mt-0.5 shrink-0"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Summary badge */}
              {!isLoading && logs.length > 0 && (
                <div className="relative mt-3 inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1">
                  <span className="text-[10.5px] font-bold text-white/90">
                    {logs.length} nhật ký
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="animate-spin text-indigo-600" size={32} />
                  <p className="text-[13px] font-semibold text-slate-500">Đang tải dữ liệu...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                  <Calendar size={44} className="mb-4 opacity-20" />
                  <p className="text-[14px] font-bold text-slate-600">Không có nhật ký</p>
                  <p className="text-[12px] text-slate-400 mt-1">Không tìm thấy bản ghi nào trong khoảng thời gian này</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all"
                  >
                    {/* Card header — ngày + loại công */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-indigo-500" />
                        <span className="text-[12px] font-bold text-indigo-600">
                          {formatDate(log.workDate)}
                        </span>
                      </div>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold',
                        (log.isOverTime || log.type === 'OVERTIME')
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700',
                      )}>
                        {(log.isOverTime || log.type === 'OVERTIME') ? 'Tăng ca' : 'Chính thức'}
                      </span>
                    </div>

                    {/* Card body — các fields */}
                    <div className="px-4 py-3 space-y-2">

                      {/* Công việc (task) */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Briefcase size={11} className="text-slate-400" />
                          <span className="text-[10.5px] font-semibold text-slate-400">Công việc</span>
                        </div>
                        <span className="text-[12.5px] font-semibold text-slate-800 text-right truncate max-w-[200px]">
                          {log.task?.name || log.taskName ||
                            <span className="text-slate-400 italic font-normal">Chưa gắn công việc</span>
                          }
                        </span>
                      </div>

                      {/* Người thực hiện */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <User size={11} className="text-slate-400" />
                          <span className="text-[10.5px] font-semibold text-slate-400">Nhân viên</span>
                        </div>
                        <span className="text-[12.5px] font-semibold text-slate-800 text-right">
                          {log.employee?.fullName || log.employeeName ||
                            <span className="text-slate-400 italic font-normal">Chưa xác định</span>
                          }
                        </span>
                      </div>

                      {/* Tăng ca */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Clock size={11} className="text-slate-400" />
                          <span className="text-[10.5px] font-semibold text-slate-400">Tăng ca</span>
                        </div>
                        <span className={cn(
                          'text-[12px] font-bold',
                          log.isOverTime ? 'text-amber-600' : 'text-slate-500',
                        )}>
                          {log.isOverTime ? 'Có' : 'Không'}
                        </span>
                      </div>

                      {/* Nông trại */}
                      {log.farm?.farmName && (
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-1.5 shrink-0">
                            <MapPin size={11} className="text-slate-400" />
                            <span className="text-[10.5px] font-semibold text-slate-400">Nông trại</span>
                          </div>
                          <span className="text-[12.5px] font-semibold text-slate-800 text-right truncate max-w-[180px]">
                            {log.farm.farmName}
                          </span>
                        </div>
                      )}

                      {/* Ghi chú */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <StickyNote size={11} className="text-slate-400" />
                          <span className="text-[10.5px] font-semibold text-slate-400">Ghi chú</span>
                        </div>
                        <span className={cn(
                          'text-[12.5px] text-right max-w-[200px]',
                          log.notes ? 'font-semibold text-slate-700' : 'italic text-slate-400 font-normal',
                        )}>
                          {log.notes || 'Không có'}
                        </span>
                      </div>
                    </div>

                    {/* Tiến độ task nếu có */}
                    {log.task?.progressPercent != null && (
                      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-slate-400">Tiến độ công việc</span>
                          <span className="text-[10px] font-bold text-indigo-600">{log.task.progressPercent}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${log.task.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2"
              >
                <ChevronRight size={16} />
                Đóng lịch sử
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
