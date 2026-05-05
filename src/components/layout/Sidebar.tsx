import { useState } from "react";
import {
  Home,
  BarChart3,
  History,
  Map as MapIcon,
  Grid3X3,
  Users,
  CreditCard,
  Settings,
  Trees,
  Zap,
  Wallet,
  GitFork,
  Sparkles,
  LogOut,
  Key,
  Warehouse,
  Truck,
  Tag,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../utils/cn";
import { useAuth } from "../../hooks/auth/useAuth";
import { useFarms } from "../../hooks/farms/useFarms";
import { ConfirmModal } from "../ui/ConfirmModal";

interface SidebarProps {
  active: string;
  setActive: (key: string) => void;
  variant?: "compact" | "wide";
}

const NAV_GROUPS = [
  {
    title: "TỔNG QUAN",
    items: [
      { key: "dashboard", label: "Bảng điều khiển", icon: Home },
      { key: "tree", label: "Trang trại của tôi", icon: Trees },
      { key: "metrics", label: "Theo dõi chỉ số", icon: BarChart3, roles: ["owner", "admin"] },
    ]
  },
  {
    title: "TIỆN ÍCH",
    items: [
      { key: "wallet", label: "Ví & Thanh toán", icon: Wallet, roles: ["owner", "admin"] },
      { key: "activity", label: "Hoạt động", icon: History, roles: ["owner", "admin"] },
      { key: "task", label: "Nhiệm vụ", icon: GitFork, roles: ["owner", "admin", "employee"] },
      { key: "gemini", label: "Trợ lý AI", icon: Sparkles, roles: ["owner", "admin"] },
    ]
  },
  {
    title: "QUẢN LÝ",
    items: [
      { key: "map", label: "Bản đồ nông trại", icon: MapIcon, roles: ["owner", "admin"] },
      { key: "land-plots", label: "Lô đất & Cây trồng", icon: Grid3X3, roles: ["owner", "admin"] },
      { key: "crop-catalog", label: "Danh mục cây trồng", icon: Trees, roles: ["owner", "admin"] },
      { key: "season-plans", label: "Kế hoạch mùa vụ", icon: Zap, roles: ["owner", "manager", "admin"] },
      { key: "warehouses", label: "Kho hàng", icon: Warehouse, roles: ["owner", "manager", "admin"] },
      { key: "suppliers", label: "Nhà cung cấp", icon: Truck, roles: ["owner", "manager", "admin"] },
      { key: "skus", label: "Mã SKU", icon: Tag, roles: ["owner", "manager", "admin"] },
      { key: "members", label: "Thành viên", icon: Users, roles: ["owner", "admin"] },
    ]
  },
  {
    title: "HỆ THỐNG",
    items: [
      { key: "subscription", label: "Gói cước & Dịch vụ", icon: CreditCard, roles: ["owner"] },
    ]
  }
];

export default function Sidebar({
  active,
  setActive,
  variant = "compact",
}: SidebarProps) {
  const { user, currentFarmId, logout } = useAuth();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const { farmSummary, farms } = useFarms();

  const handleLogout = () => {
    setIsSettingsModalOpen(false);
    setIsLogoutConfirmOpen(true);
  };

  const onConfirmLogout = () => {
    logout();
    setIsLogoutConfirmOpen(false);
  };

  const handleChangePassword = () => {
    setActive("change-password");
    setIsSettingsModalOpen(false);
  };

  const currentFarm = currentFarmId
    ? (farms.find((f: any) => f.id === currentFarmId) || farmSummary.find((f: any) => f.farmId === currentFarmId))
    : null;

  const myFarmRole = currentFarm
    ? (currentFarm.myRole?.toLowerCase() === 'worker' ? 'employee' : currentFarm.myRole?.toLowerCase())
    : null;

  const effectiveRole = (currentFarmId && myFarmRole) ? myFarmRole : user?.role;

  return (
    <>
      {variant === "compact" ? (
        <aside className="flex flex-col items-center justify-between h-full w-[64px] bg-white shrink-0 rounded-[24px] shadow-sm border border-slate-100 py-6 px-2 transition-all duration-300">
          <div className="flex flex-col items-center gap-6 w-full">
            {NAV_GROUPS.flatMap(g => g.items)
              .filter(item => {
                if (!currentFarmId) {
                  // Hiển thị các chức năng global khi chưa chọn farm
                  return ["home", "dashboard", "tree", "wallet", "gemini"].includes(item.key);
                }

                if (item.roles) {
                  return effectiveRole ? item.roles.includes(effectiveRole) : false;
                }
                return true;
              })
              .map((item) => (
                <Button
                  key={item.key}
                  onClick={() => setActive(item.key)}
                  variant={active === item.key ? "dark-nav" : "ghost"}
                  size="icon"
                  className={cn(
                    "w-10 h-10 rounded-xl p-0 transition-all duration-200",
                    active === item.key ? "bg-slate-900 text-white shadow-md" : "hover:bg-gray-100 text-slate-500"
                  )}
                >
                  <item.icon size={22} color={active === item.key ? "#fff" : "#374151"} strokeWidth={2} />
                </Button>
              ))}
          </div>

          <div className="relative">
            <Button
              onClick={() => setIsSettingsModalOpen((prev) => !prev)}
              variant="ghost"
              size="icon"
              className={cn(
                "w-10 h-10 rounded-xl transition-all duration-200",
                isSettingsModalOpen ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-gray-100"
              )}
            >
              <Settings size={22} />
            </Button>
            {isSettingsModalOpen && (
              <div className="absolute bottom-0 left-full ml-2 w-52 rounded-2xl border border-slate-200 bg-white shadow-xl p-2 z-50">
                <button
                  onClick={handleChangePassword}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Key size={16} />
                  <span>Đổi mật khẩu</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </aside>
      ) : (
        <aside className="flex flex-col h-full w-[260px] bg-white shrink-0 rounded-[32px] shadow-soft border border-slate-100 p-4 transition-all duration-300">
          <div className="flex items-center gap-3 py-3 mb-2 shrink-0">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 shrink-0">
              <Trees size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                {currentFarm ? (currentFarm.farmName || currentFarm.name) : "Trang Trại"}
              </h2>
            </div>
          </div>

          <nav className="flex-1 flex flex-col gap-4 shrink-0 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent py-2">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="flex flex-col gap-1.5">
                <h3 className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-1">
                  {group.title}
                </h3>
                <div className="flex flex-col gap-0.5">
                  {group.items
                    .filter(item => {
                      if (!currentFarmId) {
                        return ["home", "dashboard", "tree", "wallet", "gemini"].includes(item.key);
                      }
                      if (item.roles) {
                        return effectiveRole ? item.roles.includes(effectiveRole) : false;
                      }
                      return true;
                    })
                    .map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setActive(item.key)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group font-medium text-sm whitespace-nowrap",
                          active === item.key
                            ? "bg-emerald-50 text-emerald-700 shadow-sm"
                            : "text-gray-600 hover:bg-gray-50 hover:text-emerald-600"
                        )}
                      >
                        <item.icon
                          size={18}
                          className={cn(
                            "transition-colors shrink-0",
                            active === item.key ? "text-emerald-600" : "text-gray-400 group-hover:text-emerald-600"
                          )}
                        />
                        <span>{item.label}</span>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </nav>

        </aside>
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={onConfirmLogout}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn thoát khỏi phiên làm việc hiện tại?"
        confirmLabel="Đăng xuất ngay"
        cancelLabel="Quay lại"
        type="danger"
      />
    </>
  );
}