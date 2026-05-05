import { Map, Trees } from 'lucide-react';

interface StatsOverviewProps {
  plotsCount: number;
  cropsCount: number;
  loading?: boolean;
}

export default function StatsOverview({
  plotsCount,
  cropsCount,
  loading = false,
}: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft flex items-center gap-6">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
          <Map size={32} />
        </div>
        <div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Lô đất</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900">{loading ? '...' : plotsCount}</h3>
            <span className="text-slate-400 text-xs font-bold uppercase">Khu vực</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft flex items-center gap-6">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
          <Trees size={32} />
        </div>
        <div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Cây trồng</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900">{loading ? '...' : cropsCount}</h3>
            <span className="text-slate-400 text-xs font-bold uppercase">Sản phẩm</span>
          </div>
        </div>
      </div>
    </div>
  );
}
