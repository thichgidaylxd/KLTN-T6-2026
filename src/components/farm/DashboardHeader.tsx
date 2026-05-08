import { Edit, Trash2, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardHeaderProps {
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export default function DashboardHeader({
  onEdit,
  onDelete,
  showActions = true,
}: DashboardHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/80">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Left Section */}
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/farms')}
            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 rounded-xl transition-all group"
          >
            <ChevronLeft size={20} className="text-slate-500 group-hover:text-emerald-600 transition-colors" />
            <span className="text-sm font-bold text-slate-600 group-hover:text-emerald-600 transition-colors">Quay lại</span>
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {showActions && (
            <div className="flex items-center gap-2">
              <button 
                onClick={onEdit}
                className="px-4 py-2 text-emerald-600 font-bold text-sm rounded-xl hover:bg-emerald-50 transition-all flex items-center gap-2 border border-transparent hover:border-emerald-100"
              >
                <Edit size={16} />
                Chỉnh sửa
              </button>
              <button 
                onClick={onDelete}
                className="px-4 py-2 text-rose-600 font-bold text-sm rounded-xl hover:bg-rose-50 transition-all flex items-center gap-2 border border-transparent hover:border-rose-100"
              >
                <Trash2 size={16} />
                Xóa
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
