// src/components/dashboard/TaskBar.tsx
import { Plus } from "lucide-react";
import { Button } from "../ui/button";

interface TaskBarProps {
  completed?: number;
  pending?: number;
  isLoading?: boolean;
  onAddTask?: () => void;
}

export default function TaskBar({
  completed = 0,
  pending = 0,
  isLoading = false,
  onAddTask,
}: TaskBarProps) {
  const total = completed + pending;

  // Tính % chiều rộng theo tỷ lệ thực tế
  // Nếu chưa có data thì chia đôi 50/50 làm placeholder
  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 50;

  // Đảm bảo mỗi phần tối thiểu 15% để số và nhãn luôn hiển thị được
  const MIN_PCT = 15;
  const clampedCompleted = total > 0 ? Math.max(MIN_PCT, Math.min(100 - MIN_PCT, completedPct)) : 50;
  const clampedPending   = 100 - clampedCompleted;

  return (
    <div className="flex items-center gap-2 w-full select-none">
      {/* Overlapping Sections Container */}
      <div className="flex items-center flex-1 h-[42px] relative">
        {/* Completed Section (Green) - On Top */}
        <div
          className="relative z-20 h-full flex items-center justify-between px-5 rounded-full border border-white/20 shadow-md"
          style={{
            width: `${clampedCompleted}%`,
            background: "#79C257",
            transition: "width 0.7s ease-in-out",
          }}
        >
          <span className="text-white text-xs font-bold uppercase tracking-wider whitespace-nowrap">Completed</span>
          <span className="text-white text-lg font-black ml-2">{isLoading ? "..." : completed}</span>
        </div>

        {/* Pending Section (Striped Blue) - Underneath */}
        <div
          className="relative z-10 h-[36px] -ml-6 pl-8 pr-4 flex items-center justify-between rounded-r-full border border-gray-200 overflow-hidden"
          style={{
            width: `calc(${clampedPending}% + 24px)`,
            backgroundColor: "#e3f2fd",
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 8px,
              rgba(255, 255, 255, 0.6) 8px,
              rgba(255, 255, 255, 0.6) 16px
            )`,
            transition: "width 0.7s ease-in-out",
          }}
        >
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-tight whitespace-nowrap">Pending</span>
          <span className="text-blue-600 text-sm font-bold ml-2">{isLoading ? "..." : pending}</span>
        </div>
      </div>

      {/* Add new task button (Dark Blue) */}
      <Button
        variant="dark-nav"
        onClick={onAddTask}
        className="h-[42px] px-5 rounded-full bg-[#1a1a2e] hover:bg-[#252545] border-none flex items-center gap-2 shadow-sm transition-all active:scale-95 shrink-0"
      >
        <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
          <Plus size={12} strokeWidth={3} className="text-white" />
        </div>
        <span className="text-white text-xs font-bold">Add a new task</span>
      </Button>
    </div>
  );
}
