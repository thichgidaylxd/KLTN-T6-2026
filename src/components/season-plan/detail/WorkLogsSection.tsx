import { BookOpen, Loader2, AlertCircle, Lock, Unlock } from 'lucide-react';
import { motion } from 'framer-motion';
import { WorkLog } from '@/types/workLog/workLog';
import { formatDate } from '@/utils/format';
import { useWorkLogs } from '@/hooks/workLog/useWorkLogs';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/utils/errorUtils';
import { useState } from 'react';

interface WorkLogsSectionProps {
  workLogs: WorkLog[];
  loading: boolean;
  onViewDetail: (workLogId: string) => void;
}

export function WorkLogsSection({
  workLogs,
  loading,
  onViewDetail
}: WorkLogsSectionProps) {
  const { lockWorkLog, unlockWorkLog } = useWorkLogs();
  const [isPatching, setIsPatching] = useState(false);

  const handleToggleLock = async (logId: string, isLocked: boolean) => {
    setIsPatching(true);
    try {
      if (isLocked) {
        await unlockWorkLog(logId);
        toast.success('Mở khóa nhật ký thành công');
      } else {
        await lockWorkLog(logId);
        toast.success('Chốt công thành công');
      }
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsPatching(false);
    }
  };
  return (
    <div className="px-4 py-3 border-t border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen size={11} /> Nhật ký công việc
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <Loader2 size={24} className="animate-spin mb-2" />
          <p className="text-[12px]">Đang tải nhật ký...</p>
        </div>
      ) : workLogs.length > 0 ? (
        <div className="space-y-2">
          {workLogs.map((log) => (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              key={log.id}
              className="group relative p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer overflow-hidden"
              onClick={() => onViewDetail(log.id)}
            >
              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-slate-800">
                        {formatDate(log.workDate)}
                      </span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase",
                        (log.isOverTime || log.type === 'OVERTIME') ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {(log.isOverTime || log.type === 'OVERTIME') ? 'Tăng ca' : 'Chính thức'}
                      </span>
                    </div>

                    {/* Status Badge */}
                    {log.lockedAt ? (
                      <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                        <Lock size={10} />
                        <span className="text-[9px] font-black uppercase">Đã chốt</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/50">
                        <Unlock size={10} />
                        <span className="text-[9px] font-black uppercase tracking-tight">Chờ duyệt</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                    {log.notes || 'Không có ghi chú cho phiên này'}
                  </p>

                  <p className="text-[9px] text-indigo-500 font-bold mt-2 flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    • Chọn để xem chi tiết nhật ký này
                  </p>
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center text-[9px] font-bold text-indigo-600 shrink-0 border border-indigo-100/50">
                        {(log.employee?.fullName || log.employeeName || 'C').charAt(0)}
                      </div>
                      <span className="text-[11px] text-slate-600 font-bold truncate">
                        {log.employee?.fullName || log.employeeName || 'Chưa xác định'}
                      </span>
                    </div>
                    
                    {!log.lockedAt ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLock(log.id, false);
                        }}
                        disabled={isPatching}
                        className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase hover:bg-emerald-600 transition-all shadow-sm disabled:opacity-50"
                      >
                        {isPatching ? <Loader2 size={10} className="animate-spin" /> : <Lock size={10} />}
                        Chốt công
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLock(log.id, true);
                        }}
                        disabled={isPatching}
                        className="flex items-center gap-1.5 px-2 py-1 bg-white text-slate-600 border border-slate-200 rounded-lg text-[10px] font-black uppercase hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
                      >
                        {isPatching ? <Loader2 size={10} className="animate-spin text-indigo-500" /> : <Unlock size={10} />}
                        Mở khóa
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <AlertCircle size={20} />
          </div>
          <p className="text-[12px] text-slate-500 font-medium">Chưa có nhật ký nào</p>
          <p className="text-[10px] text-slate-400 mt-1 px-6">Hãy ghi lại quá trình thực hiện công việc</p>
        </div>
      )}
    </div>
  );
}

// Helper function since I don't know if cn is imported here
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
