import { 
  CreditCard, 
  History, 
  Calendar, 
  ArrowRight,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { useCurrentSubscription, useSubscriptionHistory } from '@/hooks/subscription/useSubscription';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/auth/useAuth';

const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, { label: string, color: string }> = {
    ACTIVE: { label: 'Đang hoạt động', color: 'bg-white text-slate-900 border-slate-900' },
    TRIAL: { label: 'Dùng thử', color: 'bg-white text-slate-600 border-slate-300' },
    EXPIRED: { label: 'Hết hạn', color: 'bg-white text-red-600 border-red-200' },
    CANCELLED: { label: 'Đã hủy', color: 'bg-white text-slate-400 border-slate-200' },
    GRACE_PERIOD: { label: 'Gia hạn thêm', color: 'bg-white text-amber-600 border-amber-200' },
  };

  const config = configs[status] || { label: status, color: 'bg-white text-slate-500 border-slate-200' };

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-wider", config.color)}>
      {config.label}
    </span>
  );
};

export default function SubscriptionHistoryPage() {
  const navigate = useNavigate();
  const { currentFarmId } = useAuth();
  
  // Redirect if no farm context (Optional: could show placeholder instead)
  if (!currentFarmId) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white min-h-[400px]">
          <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-4">
            <CreditCard size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Vui lòng chọn trang trại</h2>
          <p className="text-slate-500 text-sm mb-6 text-center max-w-xs">
            Bạn cần chọn một trang trại để xem lịch sử gói dịch vụ và các giao dịch liên quan.
          </p>
          <button 
            onClick={() => navigate('/farms')}
            className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
          >
            Đến danh sách trang trại
          </button>
        </div>
    );
  }

  const { data: current, isLoading: loadingCurrent } = useCurrentSubscription();
  const { data: history, isLoading: loadingHistory } = useSubscriptionHistory();


  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="w-full px-6 py-4 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(`/farms/${currentFarmId}/actions`)}
          className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
          title="Quay lại"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Quản lý Gói dịch vụ</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thông tin đăng ký & Giao dịch</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Current Plan & Info */}
        <div className="xl:col-span-1 flex flex-col gap-4 overflow-hidden">
          <section>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-2">GÓI ĐANG SỬ DỤNG</h3>
            {loadingCurrent ? (
              <div className="h-48 bg-white rounded-3xl animate-pulse border border-slate-200" />
            ) : current ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 border border-slate-900 relative overflow-hidden group"
              >
                <div className="relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-slate-900">
                      <CreditCard size={28} strokeWidth={1.5} />
                    </div>
                    <StatusBadge status={current.status} />
                  </div>

                  <h2 className="text-xl font-black text-slate-900 mb-0.5">{current.subscriptionPlanName}</h2>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-4">
                    {current.billingCycle === 'ANNUAL' ? 'Thanh toán hàng năm' : 'Thanh toán hàng tháng'}
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                      <div className="flex items-center justify-center text-slate-900">
                        <Calendar size={16} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">Ngày hết hạn</p>
                        <p className="text-xs font-bold">{formatDate(current.expiresAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                      <div className="flex items-center justify-center text-slate-900">
                        <ShieldCheck size={16} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">Tự động gia hạn</p>
                        <p className="text-xs font-bold">{current.autoRenew ? 'Đang bật' : 'Đã tắt'}</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(currentFarmId ? `/farms/${currentFarmId}/subscription/pricing` : '/farms')}
                    className="w-full py-3 bg-transparent border-2 border-slate-900 text-slate-900 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    Nâng cấp gói cước
                    <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-[32px] p-8 border border-dashed border-slate-200 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
                  <CreditCard size={32} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Chưa có gói dịch vụ</p>
                  <p className="text-xs text-slate-400 px-4">Hãy đăng ký gói dịch vụ để tận hưởng đầy đủ tính năng của FarmerAI</p>
                </div>
                <button 
                  onClick={() => navigate(currentFarmId ? `/farms/${currentFarmId}/subscription/pricing` : '/farms')}
                  className="bg-transparent text-slate-900 border-2 border-slate-900 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  Đăng ký ngay
                </button>
              </div>
            )}
          </section>

          <section className="bg-slate-50 rounded-2xl p-4 border border-slate-200 overflow-hidden relative shrink-0">
            <h4 className="font-black text-[10px] text-slate-900 uppercase tracking-wider mb-1">Bảo mật thanh toán</h4>
            <p className="text-[10px] text-slate-500 leading-normal mb-3 font-medium">
              Mọi giao dịch của bạn đều được mã hóa thực hiện qua cổng thanh toán bảo mật.
            </p>
            <div className="flex gap-2">
                <div className="h-5 px-1.5 bg-white rounded border border-slate-200 flex items-center justify-center text-[8px] font-black text-slate-400 uppercase tracking-tighter">SEPAY</div>
        
            </div>
          </section>
        </div>

        {/* Right Column: History Table */}
        <div className="xl:col-span-2 flex flex-col min-h-0">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-2 flex items-center gap-2">
            <History size={12} />
            LỊCH SỬ GIAO DỊCH
          </h3>
          
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden h-full flex flex-col min-h-0">
            {loadingHistory ? (
              <div className="p-4 flex flex-col gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : history && history.length > 0 ? (
              <div className="flex-1 overflow-hidden no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white z-10 shadow-sm shadow-slate-50">
                    <tr className="border-b border-slate-50">
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Gói</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Bắt đầu</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Hết hạn</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider text-right">Chu kỳ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item, idx) => (
                      <motion.tr 
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-bold text-slate-800 text-xs">
                          {item.subscriptionPlanName}
                          {item.isCurrent && <span className="ml-1 text-[7px] bg-slate-900 text-white px-1 py-0.5 rounded-sm uppercase font-black">Present</span>}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-500">{formatDate(item.startedAt)}</td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-500">{formatDate(item.expiresAt)}</td>
                        <td className="px-4 py-3 text-[10px] font-black text-slate-800 text-right uppercase tracking-tighter">
                          {item.billingCycle === 'ANNUAL' ? 'Năm' : 'Tháng'}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center text-slate-400 gap-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                  <History size={40} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Chưa có lịch sử giao dịch</p>
                  <p className="text-xs max-w-[240px]">Các gói đăng ký và gia hạn của bạn sẽ hiển thị tại đây.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
