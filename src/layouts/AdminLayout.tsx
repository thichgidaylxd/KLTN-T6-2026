import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Sprout, LayoutDashboard, LogOut, ChevronLeft, Settings, Key, UserCog } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChangePassword = () => {
    setIsSettingsMenuOpen(false);
    navigate("/profile/change-password");
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Danh mục cây trồng",
      path: "/admin/crop-catalog",
      icon: Sprout,
    },

    {
      name: "Quản lý người dùng",
      path: "/admin/users",
      icon: UserCog,
    }
  ];

  return (
    <div className="w-full h-screen bg-[#F8FAFC] flex overflow-hidden">
      {/* Admin Sidebar - Light Emerald Gradient Theme */}
      <aside className="w-72 bg-white flex flex-col shadow-sm border-r border-slate-200/60 transition-all duration-300">
        <div className="p-6 pb-2 border-b border-slate-100/50">
          <div className="flex items-center p-2 rounded-2xl bg-slate-50/50 border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-inner shrink-0">
              <span>AD</span>
            </div>
            <div className="flex flex-col ml-3 overflow-hidden">
              <span className="text-sm font-black text-slate-900 leading-none mb-1 truncate">Administrator</span>
              <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wide truncate">Quản trị toàn cục</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-6">
          <h3 className="px-5 text-[10px] font-bold text-slate-500 uppercase tracking-[2px] mb-3">
            Quản lý
          </h3>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-200 group ${isActive
                    ? "bg-emerald-100/70 text-emerald-800 shadow-sm font-bold border border-emerald-200/50"
                    : "text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700 font-medium"
                  }`}
              >
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500"}`} />
                <span className="text-sm">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Settings & Account at Bottom */}
        <div className="p-6 border-t border-slate-100/50 relative">
          <button
            onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
            className={`w-full flex items-center justify-between px-5 py-3 rounded-xl transition-all duration-200 font-bold text-sm shadow-sm border ${isSettingsMenuOpen
              ? "bg-emerald-600 text-white border-emerald-600"
              : "bg-white text-slate-700 border-slate-200"
              }`}
          >
            <div className="flex items-center gap-3">
              <Settings className={`w-5 h-5 ${isSettingsMenuOpen ? "animate-spin-slow" : ""}`} />
              <span>Cài đặt</span>
            </div>
            <div className={`w-1.5 h-1.5 rounded-full ${isSettingsMenuOpen ? "bg-white" : "bg-emerald-500"}`}></div>
          </button>

          {/* Popover Menu */}
          {isSettingsMenuOpen && (
            <div className="absolute bottom-full left-6 right-6 mb-2 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                onClick={handleChangePassword}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 transition-all font-semibold text-sm group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <Key size={16} />
                </div>
                <span>Đổi mật khẩu</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-all font-semibold text-sm group"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                  <LogOut size={16} />
                </div>
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Only visible on Dashboard */}
        {location.pathname === "/admin/dashboard" && (
          <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 shadow-sm z-10 shrink-0">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate(-1)}
                className="group p-2.5 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600 active:scale-90"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Hệ thống quản trị</h1>
            </div>

            {/* User Profile Pill */}
            {/* System Status removed per user request */}
          </header>
        )}

        {/* Page Content - Full Width Minimalist */}
        <div className="flex-1 overflow-y-auto bg-white no-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
