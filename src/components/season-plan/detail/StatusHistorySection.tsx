import { motion } from 'framer-motion';
import { History, User, Clock, ArrowRight } from 'lucide-react';
import { TaskStatusHistory, StatusObject } from '@/types/seasonPlan/seasonPlan';
import { cn } from '@/utils/cn';

interface StatusHistorySectionProps {
  histories: TaskStatusHistory[];
  loading: boolean;
}

export function StatusHistorySection({ histories, loading }: StatusHistorySectionProps) {
  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-medium">Đang tải lịch sử...</p>
      </div>
    );
  }

  if (histories.length === 0) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <History size={24} className="text-slate-300" />
        </div>
        <p className="text-sm font-medium">Chưa có lịch sử thay đổi</p>
        <p className="text-[11px] mt-1 text-center max-w-[200px]">Mọi thay đổi về trạng thái công việc sẽ được ghi lại tại đây.</p>
      </div>
    );
  }

  const sortedHistories = [...histories].sort((a, b) => 
    new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );

  return (
    <div className="px-4 py-6">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-1.5">
        <History size={12} /> Nhật ký thay đổi trạng thái
      </p>

      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-100 before:via-slate-100 before:to-transparent">
        {sortedHistories.map((item, idx) => (
          <motion.div
            key={`${item.changedAt}-${idx}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="relative flex items-start gap-4"
          >
            {/* Timeline Dot */}
            <div className="absolute left-4 -translate-x-1/2 mt-1.5">
              <div className={cn(
                "w-2.5 h-2.5 rounded-full border-2 border-white ring-2",
                idx === 0 ? "bg-indigo-500 ring-indigo-100" : "bg-slate-300 ring-slate-100"
              )} />
            </div>

            <div className="flex-1 ml-6 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <User size={12} className="text-indigo-600" />
                  </div>
                  <span className="text-[12px] font-bold text-slate-700 truncate">
                    {item.changedBy.fullName}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 shrink-0 whitespace-nowrap">
                  <Clock size={10} />
                  {new Date(item.changedAt).toLocaleString('vi-VN', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  })}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={item.fromStatus} />
                  <ArrowRight size={14} className="text-slate-300" />
                  <StatusBadge status={item.toStatus} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: StatusObject }) {
  return (
    <div 
      className="inline-flex items-center px-2 py-0.5 rounded-lg border text-[11px] font-bold"
      style={{
        backgroundColor: `${status.color}15`,
        borderColor: `${status.color}30`,
        color: status.color
      }}
    >
      {status.name}
    </div>
  );
}
