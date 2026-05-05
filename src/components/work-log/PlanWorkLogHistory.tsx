import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Trash2, ChevronRight, Package, Loader2 } from 'lucide-react';
import { useWorkLogs, useFarmWorkLogs } from '@/hooks/workLog/useWorkLogs';
import { WorkLog } from '@/types/workLog/workLog';
import { formatDate } from '@/utils/format';
import { SeasonPlan } from '@/types/seasonPlan';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';

interface PlanWorkLogHistoryProps {
  farmId: string;
  plan: SeasonPlan;
}

export function PlanWorkLogHistory({ farmId, plan }: PlanWorkLogHistoryProps) {
  const { deleteWorkLog } = useWorkLogs();
  const { data: workLogs = [], isLoading: loading } = useFarmWorkLogs(farmId);
  const [filteredLogs, setFilteredLogs] = useState<WorkLog[]>([]);

  useEffect(() => {
    if (workLogs.length > 0 && plan.phases) {
      // Get all task IDs in the plan
      const planTaskIds = new Set<string>();
      plan.phases.forEach(phase => {
        phase.tasks.forEach(task => planTaskIds.add(task.id));
      });

      // Filter worklogs that belong to these tasks
      const filtered = workLogs.filter(log => {
        const tId = log.task?.id || log.taskId;
        return tId && planTaskIds.has(tId);
      });
      setFilteredLogs(filtered);
    } else {
      setFilteredLogs([]);
    }
  }, [workLogs, plan]);

  const handleDelete = async (taskId: string, logId: string) => {
    try {
      await deleteWorkLog(taskId, logId);
      toast.success('Xóa nhật ký thành công');
    } catch (err: any) {
      toast.error('Không thể xóa nhật ký');
    }
  };

  if (loading && filteredLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 size={32} className="animate-spin mb-4 text-indigo-500" />
        <p className="text-[13px] font-medium">Đang tải lịch sử nhật ký...</p>
      </div>
    );
  }

  if (filteredLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 px-10 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
          <BookOpen size={28} />
        </div>
        <h3 className="text-[14px] font-bold text-slate-700 mb-1">Chưa có nhật ký nào</h3>
        <p className="text-[12px] leading-relaxed max-w-xs">
          Các nhật ký công việc của kế hoạch này sẽ được hiển thị tại đây. Hãy bắt đầu ghi nhật ký trong phần chi tiết công việc.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Lịch sử nhật ký công việc</h2>
            <p className="text-[12px] text-slate-500">Tổng cộng {filteredLogs.length} bản ghi trong kế hoạch này</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Filters could go here */}
          </div>
        </div>

        <div className="grid gap-3">
          {filteredLogs.map((log) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={log.id}
              className="group bg-white border border-slate-200 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[13px] font-bold text-slate-900">{formatDate(log.workDate)}</span>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                      log.type === 'OVERTIME' ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                    )}>
                      {log.type === 'OVERTIME' ? 'Tăng ca' : 'Chính thức'}
                    </span>
                    <div className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {log.task?.name || log.taskName || 'Công việc'}
                    </span>
                  </div>

                  <p className="text-[13px] text-slate-600 leading-relaxed mb-3">
                    {log.notes || <span className="text-slate-400 italic">Không có ghi chú chi tiết</span>}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[9px]">
                        {(log.employee?.fullName || log.employeeName || 'N').charAt(0)}
                      </div>
                      <span className="font-medium">
                        {log.employee?.fullName || log.employeeName || 'Chưa xác định'}
                      </span>
                    </div>
                    {/* Placeholder for materials count if available in future */}
                    <div className="flex items-center gap-1.5">
                      <Package size={13} className="text-slate-400" />
                      <span>Vật tư: (Xem chi tiết)</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button 
                    onClick={() => {
                      const tId = log.task?.id || log.taskId;
                      if (tId) handleDelete(tId, log.id);
                      else toast.error('Không tìm thấy thông tin công việc');
                    }}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    title="Xóa nhật ký"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all group/btn border border-slate-100">
                    <span className="text-[11px] font-bold">Chi tiết</span>
                    <ChevronRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
