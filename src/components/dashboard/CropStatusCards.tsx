import { Zap, UserCog, Users } from 'lucide-react';

interface CropCardProps {
  title: string;
  value: string | number;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  onClick?: () => void;
}

export function CropCard({ title, value, label, icon: Icon, color, bgColor, onClick }: CropCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`flex-1 rounded-2xl h-[85px] p-4 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${bgColor} border border-white/50 shadow-sm`}
    >
      <div className="flex flex-col">
        <span className="text-[11px] font-medium opacity-70 uppercase tracking-wider">{title}</span>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-2xl font-bold">{value}</span>
          <span className="text-[10px] font-medium opacity-60">{label}</span>
        </div>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} bg-white/40 shadow-inner`}>
        <Icon size={20} />
      </div>
    </div>
  );
}

interface CropStatusCardsProps {
  planCount?: number;
  managerCount?: number;
  workerCount?: number;
}

export default function CropStatusCards({ 
  planCount = 0, 
  managerCount = 0, 
  workerCount = 0 
}: CropStatusCardsProps) {
  return (
    <div className="flex gap-3 w-full h-full">
      <CropCard 
        title="Kế hoạch"
        value={planCount}
        label="mùa vụ"
        icon={Zap}
        color="text-amber-600"
        bgColor="bg-amber-100/80"
      />
      <CropCard 
        title="Quản lý"
        value={managerCount}
        label="thành viên"
        icon={UserCog}
        color="text-rose-600"
        bgColor="bg-rose-100/80"
      />
      <CropCard 
        title="Nhân công"
        value={workerCount}
        label="lao động"
        icon={Users}
        color="text-emerald-600"
        bgColor="bg-emerald-100/80"
      />
    </div>
  );
}
