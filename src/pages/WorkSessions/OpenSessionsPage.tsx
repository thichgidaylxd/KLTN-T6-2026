import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { OpenSessionTable } from '../../components/work-log/OpenSessionTable';

export default function OpenSessionsPage() {
  const navigate = useNavigate();
  const { farmId } = useParams<{ farmId: string }>();

  return (
    <div className="w-full flex flex-col h-full bg-slate-50/30">
      {/* Header Section */}
      <div className="px-8 pt-8 pb-6 bg-white border-b border-slate-100">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(farmId ? `/farms/${farmId}/actions` : '/dashboard')}
                className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all font-bold text-xs shrink-0"
              >
                <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm group-hover:shadow-md group-hover:border-slate-300 transition-all">
                  <ArrowLeft size={14} />
                </div>
                Quay lại
              </button>
              <div className="h-6 w-px bg-slate-200 mx-1" />
              <div className="flex flex-col">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  Phiên làm việc đang mở
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </h1>
                <p className="text-sm text-slate-500 font-medium">Theo dõi các hoạt động Check-in thời gian thực trong trang trại</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Cập nhật lúc</span>
                <span className="text-sm font-black text-emerald-700 tabular-nums">
                  {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Summary Tạm thời */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                   <Clock size={24} />
                </div>
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng phiên mở</p>
                   <p className="text-xl font-black text-slate-900">Tính năng đang cập nhật</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 p-8">
        <OpenSessionTable />
      </div>
    </div>
  );
}
