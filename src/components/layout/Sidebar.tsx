import { useState } from "react";
import {
  Home,
  BarChart3,
  History,
  Map as MapIcon,
  Grid3X3,
  Users,
  CreditCard,
  Trees,
  Zap,
  Wallet,
  GitFork,
  Sparkles,
  Warehouse,
  Truck,
  Tag,
  Sprout,
  Settings,
  LogOut,
  Key,
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
    title: "Tổng quan",
    items: [
      { key: "dashboard", label: "Bảng điều khiển", icon: Home },
      { key: "tree", label: "Trang trại của tôi", icon: Trees, roles: ["owner", "admin", "manager", "employee"] },
      { key: "metrics", label: "Theo dõi chỉ số", icon: BarChart3, roles: ["owner", "admin"] },
    ],
  },
  {
    title: "Tiện ích",
    items: [
      { key: "wallet", label: "Ví & Thanh toán", icon: Wallet, roles: ["owner", "admin"] },
      { key: "activity", label: "Hoạt động", icon: History, roles: ["owner", "admin"] },
      { key: "task", label: "Nhiệm vụ", icon: GitFork, roles: ["owner", "admin", "employee"] },
      { key: "gemini", label: "Trợ lý AI", icon: Sparkles, roles: ["owner", "admin"] },
    ],
  },
  {
    title: "Quản lý",
    items: [
      { key: "map", label: "Bản đồ nông trại", icon: MapIcon, roles: ["owner", "admin"] },
      { key: "land-plots", label: "Lô đất & Cây trồng", icon: Grid3X3, roles: ["owner", "admin"] },
      { key: "crop-catalog", label: "Danh mục cây trồng", icon: Sprout, roles: ["owner", "admin"] },
      { key: "season-plans", label: "Kế hoạch mùa vụ", icon: Zap, roles: ["owner", "manager", "admin"] },
      { key: "warehouses", label: "Kho hàng", icon: Warehouse, roles: ["owner", "manager", "admin"] },
      { key: "suppliers", label: "Nhà cung cấp", icon: Truck, roles: ["owner", "manager", "admin"] },
      { key: "skus", label: "Mã SKU", icon: Tag, roles: ["owner", "manager", "admin"] },
      { key: "members", label: "Thành viên", icon: Users, roles: ["owner", "admin"] },
    ],
  },
];

const FOOTER_ITEMS = [
  {
    title: "Hệ thống",
    items: [
      { key: "subscription", label: "Gói cước & Dịch vụ", icon: CreditCard, roles: ["owner"] },
  { key: "config", label: "Cấu hình", icon: Settings, roles: ["owner", "admin", "manager", "employee"] },
    ],
  },
];

export default function Sidebar({
  active,
  setActive,
  variant = "compact",
}: SidebarProps) {
  const { user, currentFarmId, logout } = useAuth();
  const { farmSummary, farms } = useFarms();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const currentFarm = currentFarmId
    ? farms.find((f: any) => f.id === currentFarmId) ||
      farmSummary.find((f: any) => f.farmId === currentFarmId)
    : null;

  const myFarmRole = currentFarm
    ? currentFarm.myRole?.toLowerCase() === "worker"
      ? "employee"
      : currentFarm.myRole?.toLowerCase()
    : null;

  const effectiveRole = currentFarmId && myFarmRole ? myFarmRole : user?.role;

  const filterItem = (item: { key: string; roles?: string[] }) => {
    if (!currentFarmId) {
      return ["dashboard", "tree", "wallet", "gemini"].includes(item.key);
    }
    if (!item.roles) return true;
    if (!effectiveRole) return false;
    return item.roles.includes(effectiveRole);
  };

  const handleLogout = () => {
    setIsSettingsOpen(false);
    setIsLogoutConfirmOpen(true);
  };

  const handleChangePassword = () => {
    setActive("change-password");
    setIsSettingsOpen(false);
  };

  /* ── COMPACT variant ── */
  if (variant === "compact") {
    return (
      <>
        <aside className="flex flex-col items-center justify-between h-full w-16 bg-white shrink-0 rounded-3xl shadow-sm border border-slate-100 py-6 px-2">
          <div className="flex flex-col items-center gap-2 w-full flex-1 overflow-y-auto custom-scrollbar no-scrollbar">
            {NAV_GROUPS.flatMap((g) => g.items)
              .concat(FOOTER_ITEMS.flatMap((g) => g.items))
              .filter(filterItem)
              .map((item) => (
                <Button
                  key={item.key}
                  onClick={() => setActive(item.key)}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-10 h-10 rounded-xl transition-all duration-200 shrink-0",
                    active === item.key
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                  )}
                >
                  <item.icon
                    size={20}
                    className={active === item.key ? "text-emerald-600" : ""}
                  />
                </Button>
              ))}
          </div>

          <div className="mt-auto pt-4 relative w-full flex justify-center shrink-0">
            {!currentFarmId && (
              <div className="relative">
                <Button
                  onClick={() => setIsSettingsOpen((p) => !p)}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-10 h-10 rounded-xl transition-all duration-200",
                    isSettingsOpen ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:bg-slate-50"
                  )}
                >
                  <Settings size={20} />
                </Button>
                {isSettingsOpen && (
                  <div className="absolute bottom-0 left-full ml-2 w-52 rounded-2xl border border-slate-200 bg-white shadow-xl p-2 z-50">
                    <button
                      onClick={handleChangePassword}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Key size={15} />
                      Đổi mật khẩu
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={15} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        <ConfirmModal
          isOpen={isLogoutConfirmOpen}
          onClose={() => setIsLogoutConfirmOpen(false)}
          onConfirm={() => {
            logout();
            setIsLogoutConfirmOpen(false);
          }}
          title="Xác nhận đăng xuất"
          message="Bạn có chắc chắn muốn thoát khỏi phiên làm việc hiện tại?"
          confirmLabel="Đăng xuất ngay"
          cancelLabel="Quay lại"
          type="danger"
        />
      </>
    );
  }

  /* ── WIDE variant ── */
  return (
    <>
      <aside className="flex flex-col h-full w-[260px] bg-white shrink-0 rounded-[32px] border border-slate-100 shadow-sm relative">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-3 shrink-0">
          <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0">
            <Trees size={16} className="text-emerald-600" />
          </div>
          <p className="text-sm font-semibold text-slate-900 truncate">
            {currentFarm ? currentFarm.farmName || currentFarm.name : "Trang Trại"}
          </p>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <nav className="flex flex-col gap-1 px-3 py-1">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter(filterItem);
            if (!visibleItems.length) return null;
            return (
              <div key={group.title} className="flex flex-col gap-0">
                <p className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-70">
                  {group.title}
                </p>
                <div className="flex flex-col gap-0.5">
                  {visibleItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setActive(item.key)}
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 group",
                        active === item.key
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600"
                      )}
                    >
                      <item.icon
                        size={15}
                        className={cn(
                          "shrink-0 transition-colors",
                          active === item.key ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500"
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        </div>

        {/* Footer */}
        <div className="px-3 pt-1 pb-3 border-t border-slate-100 flex flex-col gap-1 shrink-0 relative">
          {FOOTER_ITEMS.map((group) => {
            const visibleItems = group.items.filter(filterItem);
            if (!visibleItems.length) return null;
            return (
              <div key={group.title} className="flex flex-col gap-0">
                <p className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-70">
                  {group.title}
                </p>
                <div className="flex flex-col gap-0.5">
                  {visibleItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setActive(item.key)}
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 group",
                        active === item.key
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600"
                      )}
                    >
                      <item.icon
                        size={15}
                        className={cn(
                          "shrink-0 transition-colors",
                          active === item.key ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500"
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Settings Popup */}
          {!currentFarmId && (
            <div className="relative mt-0">
              <button
                onClick={() => setIsSettingsOpen((p) => !p)}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150",
                  isSettingsOpen ? "bg-slate-100 text-slate-700 shadow-sm" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <Settings size={15} className="shrink-0 text-slate-400" />
                <span>Cài đặt</span>
              </button>

              {isSettingsOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-full rounded-2xl border border-slate-200 bg-white shadow-xl p-1.5 z-50">
                  <button
                    onClick={handleChangePassword}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Key size={15} className="text-slate-400" />
                    Đổi mật khẩu
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={15} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={() => {
          logout();
          setIsLogoutConfirmOpen(false);
        }}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn thoát khỏi phiên làm việc hiện tại?"
        confirmLabel="Đăng xuất ngay"
        cancelLabel="Quay lại"
        type="danger"
      />
    </>
  );
}