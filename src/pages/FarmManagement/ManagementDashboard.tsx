import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trees,
  Plus,
  ArrowLeft,
  Search,
  Loader2,
  AlertCircle,
  ArrowRight,
  User,
} from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useFarms } from '@/hooks/farms/useFarms';
import { farmService } from '../../services/farm/farmService';
import { CreateFarmModal } from '../../components/farm';
import { FarmSummary } from '../../types/farm/farm';
import { toast } from 'sonner';

const ROLE_CONFIG: Record<string, { label: string; container: string; badge: string; icon: string }> = {
  owner: { 
    label: "Chủ trang trại", 
    container: "bg-emerald-50/30 border-emerald-100",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200", 
    icon: "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600" 
  },
  manager: { 
    label: "Quản lý", 
    container: "bg-blue-50/30 border-blue-100",
    badge: "bg-blue-100 text-blue-700 border-blue-200", 
    icon: "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600" 
  },
  employee: { 
    label: "Nhân viên", 
    container: "bg-amber-50/30 border-amber-100",
    badge: "bg-amber-100 text-amber-700 border-amber-200", 
    icon: "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600" 
  },
  admin: { 
    label: "Quản trị", 
    container: "bg-purple-50/30 border-purple-100",
    badge: "bg-purple-100 text-purple-700 border-purple-200", 
    icon: "bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600" 
  },
  worker: { 
    label: "Nhân công", 
    container: "bg-red-50/30 border-red-100",
    badge: "bg-red-100 text-red-700 border-red-200", 
    icon: "bg-gradient-to-br from-red-100 to-red-200 text-red-600" 
  },
  user: { 
    label: "Người dùng", 
    container: "bg-slate-50/30 border-slate-100",
    badge: "bg-slate-100 text-slate-700 border-slate-200", 
    icon: "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600" 
  },
};

function FarmCard({ farm, onSelect }: { farm: FarmSummary; onSelect: (f: FarmSummary) => void }) {
  const role = farm.myRole?.toLowerCase() || 'user';
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.user;

  return (
    <div
      onClick={() => onSelect(farm)}
      className="bg-white rounded-2xl border border-slate-100 p-4 cursor-pointer transition-all hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.icon}`}>
          <Trees size={18} />
        </div>
        <span className={`text-[11px] px-3 py-1 rounded-full font-semibold border ${config.badge}`}>
          {config.label}
        </span>
      </div>
      
      <h3 className="text-[15px] font-bold text-slate-800 mb-1 group-hover:text-emerald-600 transition-colors">
        {farm.farmName}
      </h3>
      
      <div className="flex items-center gap-2 text-slate-500 text-xs mb-4">
        <User size={13} className="text-slate-400" />
        <span className="font-medium">{farm.ownerFullName}</span>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Đang hoạt động
        </div>
        <div className="flex items-center gap-1 text-[12px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
          Xem chi tiết
          <ArrowRight size={13} strokeWidth={3} />
        </div>
      </div>
    </div>
  );
}

export function ManagementDashboardPage() {
  const navigate = useNavigate();
  const { selectFarm, clearFarmContext } = useAuth();
  const { farmSummary, loading, error, fetchFarmsSummary } = useFarms();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    clearFarmContext();
    fetchFarmsSummary();
  }, []);

  const handleSelectFarm = async (farm: FarmSummary) => {
    try {
      const res = await farmService.selectFarm(farm.farmId);
      if (res.success && res.data.farmToken) {
        selectFarm(res.data.farmToken, farm.farmId);
        navigate(`/farms/${farm.farmId}/actions`);
      }
    } catch (err: any) {
      console.error('Lỗi khi chọn farm:', err);
      toast.error(err?.response?.data?.message || 'Không thể truy cập trang trại này.');
    }
  };

  const filteredFarms = farmSummary.filter(f => {
    const matchSearch = f.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       f.ownerFullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTab = activeTab === 'all' || (f.myRole?.toLowerCase() === activeTab);
    return matchSearch && matchTab;
  });

  const stats = [
    { label: "Tổng trang trại", num: farmSummary.length, color: "text-emerald-700" },
    { label: "Chủ sở hữu", num: farmSummary.filter(f => f.myRole?.toLowerCase() === 'owner').length, color: "text-emerald-600" },
    { label: "Quản lý", num: farmSummary.filter(f => f.myRole?.toLowerCase() === 'manager').length, color: "text-blue-600" },
    { label: "Nhân viên", num: farmSummary.filter(f => ['worker', 'employee'].includes(f.myRole?.toLowerCase() || '')).length, color: "text-amber-600" },
  ];

  const TABS = [
    { key: "all", label: "Tất cả", count: farmSummary.length },
    { key: "owner", label: "Chủ sở hữu", count: farmSummary.filter(f => f.myRole?.toLowerCase() === 'owner').length },
    { key: "manager", label: "Quản lý", count: farmSummary.filter(f => f.myRole?.toLowerCase() === 'manager').length },
    { key: "employee", label: "Nhân viên", count: farmSummary.filter(f => ['worker', 'employee'].includes(f.myRole?.toLowerCase() || '')).length },
  ];

  if (loading && farmSummary.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50/50">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-sm font-semibold text-slate-400">Đang tải dữ liệu trang trại...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Topbar */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 text-[13px] font-bold text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition-all"
          >
            <ArrowLeft size={14} strokeWidth={3} />
            Quay lại
          </button>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 leading-none">Quản lý trang trại</h1>
            <p className="text-[12px] text-slate-400 mt-1">Xem và điều chỉnh cấu hình các không gian canh tác</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input
              placeholder="Tìm kiếm trang trại..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-slate-100 border border-transparent rounded-full pl-9 pr-4 py-2 text-[13px] outline-none w-64 focus:bg-white focus:border-emerald-200 focus:ring-4 focus:ring-emerald-500/5 transition-all"
            />
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-5 py-2 text-[13px] font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/10 active:scale-95 transition-all"
          >
            <Plus size={16} strokeWidth={3} />
            Thêm mới
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 max-w-[1600px] mx-auto">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl mb-8 bg-red-50 border border-red-100 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} />
            <span>Lỗi tải dữ liệu: {typeof error === 'string' ? error : 'Vui lòng thử lại sau'}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</div>
              <div className={`text-2xl font-black ${s.color}`}>
                {s.num} <span className="text-[12px] font-bold text-slate-300 uppercase ml-1">trại</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-5 py-2 rounded-full text-[12px] font-bold transition-all ${
                activeTab === t.key 
                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" 
                : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"
              }`}
            >
              {t.label} <span className={`ml-1 opacity-50 ${activeTab === t.key ? "text-white" : ""}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFarms.map(farm => (
            <FarmCard key={farm.farmId} farm={farm} onSelect={handleSelectFarm} />
          ))}
          
          {(activeTab === 'all' || activeTab === 'owner') && (
            <div
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-emerald-50/20 border-2 border-dashed border-emerald-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-emerald-50/50 hover:border-emerald-400 transition-all group min-h-[160px]"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <Plus size={24} strokeWidth={2.5} />
              </div>
              <span className="text-[13px] font-bold text-emerald-700">Thêm trang trại mới</span>
            </div>
          )}
        </div>

        {filteredFarms.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-slate-100 mt-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4">
              <Trees size={32} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold text-[15px]">Không tìm thấy trang trại nào</p>
            <p className="text-slate-300 text-xs mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
          </div>
        )}
      </div>

      <CreateFarmModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => fetchFarmsSummary()}
      />
    </div>
  );
}

export default ManagementDashboardPage;
