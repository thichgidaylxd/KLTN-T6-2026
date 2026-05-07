import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  PlusCircle,
  ListTree,
  Users,
  ShieldAlert,
  Activity
} from 'lucide-react';
import { useUsers } from '../../hooks/users/useUsers';

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { users, usersNeedVerification, loadingUsers } = useUsers();

  const adminActions = [
    {
      title: 'Quản lý danh mục cây trồng',
      description: 'Cấu hình và điều chỉnh các loại cây trồng có sẵn trong hệ thống (System Crop Types).',
      icon: ListTree,
      path: '/admin/crop-catalog',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Thêm cây trồng mới',
      description: 'Mở rộng thư viện thực vật bằng cách thêm các giống cây mới với đầy đủ thông tin chi tiết.',
      icon: PlusCircle,
      path: '/admin/crop-catalog',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Quản lý người dùng',
      description: 'Theo dõi danh sách người dùng toàn hệ thống, quản lý xác thực và quyền truy cập.',
      icon: Users,
      path: '/admin/users',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    }
  ];

  return (
    <div className="w-full space-y-6 p-6">
      {/* Hero Banner Section - Compact Sage Style */}
      <div className="relative bg-green-50/50 rounded-xl py-3 px-4 border border-green-100/50 flex items-center">
        <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-0 text-center md:text-left">
            <h1 className="text-lg font-black text-slate-800 tracking-tight">
              Hệ thống <span className="text-green-600 font-medium">Quản trị</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-light tracking-wide -mt-0.5">
              Chào mừng trở lại. Không gian điều hành danh mục nông nghiệp.
            </p>
          </div>

          <div className="flex-shrink-0">
            {/* Status info removed */}
          </div>
        </div>
      </div>

      {/* System Statistics Section */}
      <div className="flex items-center gap-3 px-2">
        <div className="w-1 h-5 bg-indigo-600 rounded-full"></div>
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Tổng quan hệ thống</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center gap-4 group hover:border-indigo-100 transition-all">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Người dùng</p>
            <p className="text-xl font-black text-slate-800 leading-none">
              {loadingUsers ? '...' : users.length}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center gap-4 group hover:border-amber-100 transition-all">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Chờ xác thực</p>
            <p className="text-xl font-black text-slate-800 leading-none">
              {loadingUsers ? '...' : usersNeedVerification.length}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center gap-4 group hover:border-green-100 transition-all">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Hoạt động (24h)</p>
            <p className="text-xl font-black text-slate-800 leading-none">--</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center gap-4 group hover:border-blue-100 transition-all">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
            <PlusCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Đăng ký mới</p>
            <p className="text-xl font-black text-slate-800 leading-none">--</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Header */}
      <div className="flex items-center gap-3 px-2">
        <div className="w-1 h-5 bg-green-600 rounded-full"></div>
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Thao tác nhanh</h2>
      </div>

      {/* Action Cards Grid - Ultra Compact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {adminActions.map((action, index) => (
          <div
            key={index}
            onClick={() => navigate(action.path)}
            className="flex flex-col cursor-pointer bg-white border border-slate-100 rounded-xl p-4 shadow-sm"
          >
            <div className={`w-8 h-8 ${action.bgColor} rounded-lg flex items-center justify-center mb-3`}>
              <action.icon className={`w-4 h-4 ${action.color}`} />
            </div>

            <h3 className="text-base font-extrabold text-slate-900 mb-1 tracking-tight">
              {action.title}
            </h3>
            <p className="text-slate-400 text-[11px] leading-tight mb-4 flex-1 font-light">
              {action.description}
            </p>

            <div className="flex items-center justify-between border-t border-slate-50 pt-3">
              <div className={`flex items-center text-[9px] font-black ${action.color} gap-1.5 uppercase tracking-widest`}>
                Truy cập <ArrowRight className="w-2.5 h-2.5" />
              </div>
              <div className="w-6 h-6 border border-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <ArrowRight className="w-2.5 h-2.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System Status Footer Card - Compact */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 px-2">
        <div className="flex items-center gap-5">
          {/* Status info removed */}
        </div>

        {/* Footer button removed per user request */}
      </div>
    </div>
  );
};

export default AdminDashboardPage;



