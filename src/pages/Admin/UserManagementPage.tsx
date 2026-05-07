import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  RefreshCw,
  Mail,
  Calendar,
  Lock,
  MoreVertical
} from 'lucide-react';
import { useUsers } from '../../hooks/users/useUsers';
import { cn } from '../../utils/cn';

const UserManagementPage: React.FC = () => {
  const { 
    users, 
    loadingUsers, 
    deleteUser, 
    isDeleting, 
    
    usersNeedVerification,
    loadingNeedVerification
  } = useUsers();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unverified'>('all');

  const filteredUsers = (activeTab === 'all' ? users : usersNeedVerification).filter(user => 
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (userId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này? Thao tác này không thể hoàn tác.')) {
      await deleteUser(userId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit"><CheckCircle2 size={10} /> ĐANG HOẠT ĐỘNG</span>;
      case 'PENDING':
        return <span className="bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit"><RefreshCw size={10} className="animate-spin-slow" /> CHỜ XÁC THỰC</span>;
      case 'LOCKED':
        return <span className="bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit"><Lock size={10} /> ĐÃ KHÓA</span>;
      default:
        return <span className="bg-slate-50 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">{status}</span>;
    }
  };

  return (
    <div className="w-full space-y-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Users className="text-indigo-600" />
            Quản lý <span className="text-indigo-600 font-medium">Người Dùng</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Quản trị viên hệ thống có thể theo dõi và quản lý tài khoản người dùng toàn cục.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button removed per user request */}
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-0.5">Tổng người dùng</p>
            <p className="text-2xl font-black text-slate-800 leading-none">{users.length}</p>
          </div>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-0.5">Cần xác thực lại</p>
            <p className="text-2xl font-black text-slate-800 leading-none">{usersNeedVerification.length}</p>
          </div>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-0.5">Hoạt động</p>
            <p className="text-2xl font-black text-slate-800 leading-none">
              {users.filter(u => u.status === 'ACTIVE').length}
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-slate-50 p-1 rounded-xl w-fit">
            <button 
              onClick={() => setActiveTab('all')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                activeTab === 'all' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Tất cả
            </button>
            <button 
              onClick={() => setActiveTab('unverified')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                activeTab === 'unverified' ? "bg-white text-amber-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Chờ xác thực
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên hoặc email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Người dùng</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Trạng thái</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ngày tạo</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loadingUsers || loadingNeedVerification ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-indigo-600" size={32} />
                      <p className="text-sm text-slate-400 font-medium italic">Đang tải danh sách người dùng...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-300">
                      <Users size={48} />
                      <p className="text-sm font-bold">Không tìm thấy người dùng nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-700 tracking-tight">{user.fullName}</span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium"><Mail size={10} /> {user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 uppercase">
                          <Calendar size={12} className="text-slate-300" />
                          {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-5 font-medium">
                          {new Date(user.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDelete(user.id)}
                          disabled={isDeleting}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50"
                          title="Xóa người dùng"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
            Hiển thị {filteredUsers.length} người dùng
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
