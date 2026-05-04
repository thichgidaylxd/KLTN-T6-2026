import { PlanStatus, StatusObject } from '@/types/seasonPlan';
import { cn } from '@/utils/cn';

interface StatusBadgeProps {
  status: PlanStatus | StatusObject;
  className?: string;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Bản nháp',
  ACTIVE: 'Đang thực hiện',
  READY_TO_HARVEST: 'Sẵn sàng thu hoạch',
  HARVESTING: 'Đang thu hoạch',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  OVERDUE: 'Trễ hạn',
  ASSIGNED: 'Đã giao việc',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  ACTIVE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  READY_TO_HARVEST: 'bg-lime-50 text-lime-700 border-lime-200',
  HARVESTING: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED: 'bg-slate-50 text-slate-400 border-slate-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  OVERDUE: 'bg-red-50 text-red-700 border-red-200',
  ASSIGNED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isObj = typeof status !== 'string';
  const code = isObj ? status.code : status;
  const label = isObj ? status.name : (STATUS_LABELS[code] || code);
  const colorClass = STATUS_COLORS[code] || 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap",
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}
