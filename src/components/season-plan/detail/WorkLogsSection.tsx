import { BookOpen, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { WorkLog } from '@/types/workLog/workLog';
import { formatDate } from '@/utils/format';

interface WorkLogsSectionProps {
  workLogs: WorkLog[];
  loading: boolean;
  canEdit: boolean;
  onDelete: (workLogId: string) => void;
  onViewDetail: (workLogId: string) => void;
}

export function WorkLogsSection({
  workLogs,
  loading,
  canEdit,
  onDelete,
  onViewDetail
}: WorkLogsSectionProps) {
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
              className="group p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-100 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => onViewDetail(log.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-slate-800">
                      {formatDate(log.workDate)}
                    </span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase",
                      log.type === 'OVERTIME' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {log.type === 'OVERTIME' ? 'Tăng ca' : 'Chính thức'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                    {log.notes || 'Không có ghi chú'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600">
                      {(log.employee?.fullName || log.employeeName || 'C').charAt(0)}
                    </div>
                    <span className="text-[11px] text-slate-600">
                      {log.employee?.fullName || log.employeeName || 'Chưa xác định'}
                    </span>
                  </div>
                </div>
                {canEdit && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(log.id);
                    }}
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
