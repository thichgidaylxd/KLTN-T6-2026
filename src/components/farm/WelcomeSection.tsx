import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface WelcomeSectionProps {
  farmName: string;
}

export default function WelcomeSection({ farmName }: WelcomeSectionProps) {
  const navigate = useNavigate();
  const { farmId } = useParams();

  return (
    <div className="bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/50 rounded-[32px] border border-emerald-100 overflow-hidden shadow-soft relative">
      <div className="px-8 py-10 relative z-10">
        <div className="flex flex-col mb-6">
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
            Chào mừng đến với {farmName.toLowerCase().startsWith('trang trại') ? '' : 'trang trại '}<span className="text-emerald-600">{farmName}</span>
          </h1>
          <p className="text-slate-500 max-w-2xl font-medium text-sm">
            Hệ thống quản lý trang trại hiện đại giúp bạn tối ưu hóa sản xuất và quản lý tài nguyên hiệu quả.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => farmId && navigate(`/farms/${farmId}/land-plots`)}
            className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm group"
          >
            Bắt đầu ngay
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
          <button 
            onClick={() => farmId && navigate(`/farms/${farmId}/gemini`)}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all"
          >
            Tìm hiểu thêm
          </button>
        </div>
      </div>
    </div>
  );
}
