import { Clock, CheckCircle2, Package, Calendar, User } from 'lucide-react';

export interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: 'work' | 'warehouse' | 'plan';
}

interface ActivityFeedProps {
  activities: Activity[];
  isLoading?: boolean;
}

export default function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 h-full p-2 overflow-hidden">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex gap-3 items-center animate-pulse">
            <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-white/10 rounded w-3/4" />
              <div className="h-2 bg-white/5 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/40 gap-2 p-4">
        <Clock size={28} strokeWidth={1.5} />
        <span className="text-[12px] font-medium tracking-wide">Chưa có hoạt động nào hôm nay</span>
      </div>
    );
  }

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'work': return <CheckCircle2 size={14} className="text-emerald-400" />;
      case 'warehouse': return <Package size={14} className="text-rose-400" />;
      case 'plan': return <Calendar size={14} className="text-amber-400" />;
      default: return <User size={14} className="text-blue-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-5 overflow-y-auto pr-1 h-full custom-scrollbar py-1">
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-3 items-start group">
          <div className="mt-0.5 w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-all group-hover:scale-110 shadow-sm">
            {getIcon(activity.type)}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="text-[13px] text-white/90 leading-[1.4] line-clamp-2">
              <span className="font-bold text-white hover:text-emerald-300 transition-colors cursor-default">{activity.user}</span>
              <span className="text-white/80"> {activity.action} </span>
              <span className="font-semibold text-emerald-300 italic">{activity.target}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-medium text-white/40 tracking-wider">
                {activity.time}
              </span>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[9px] uppercase font-bold text-white/30 tracking-widest">
                {activity.type === 'work' ? 'Nhiệm vụ' : activity.type === 'warehouse' ? 'Kho hàng' : 'Kế hoạch'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
