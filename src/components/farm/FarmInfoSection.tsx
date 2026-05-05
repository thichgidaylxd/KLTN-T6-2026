import { Users, Leaf } from 'lucide-react';
import { MemberCondensedList } from '../members/MemberCondensedList';

interface FarmInfoSectionProps {
  farmName: string;
  description: string;
}

export default function FarmInfoSection({ farmName, description }: FarmInfoSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Farm Info */}
      <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 flex flex-col group">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
            <Leaf size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Giới thiệu {farmName}</h3>
            <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider">Thông tin chính thức</p>
          </div>
        </div>
        <div className="flex-1 bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
          <p className="text-slate-700 leading-relaxed font-medium text-sm">
            {description || 'Chưa có mô tả cho trang trại này.'}
          </p>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 group">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110 shadow-sm border border-emerald-100">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Thành viên quản lý</h3>
            <p className="text-xs text-slate-500 font-medium">Nhân sự vận hành trang trại</p>
          </div>
        </div>
        <MemberCondensedList />
      </div>
    </div>
  );
}
