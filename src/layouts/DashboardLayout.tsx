import { Outlet, useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Sidebar from "../components/layout/Sidebar";
import { useAuth } from '@/hooks/auth/useAuth';
import { useFarms } from '@/hooks/farms/useFarms';
import { farmService } from '../services/farm/farmService';
import { getRolesFromToken } from '../utils/jwt';
import { WebSocketProvider } from "@/components/providers/WebsocketProviders";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { farmId: urlFarmId } = useParams<{ farmId: string }>();
  const { currentFarmId, accessToken, selectFarm, clearFarmContext } = useAuth();
  const { farmSummary, fetchFarmsSummary } = useFarms();
  const isAdmin = accessToken ? getRolesFromToken(accessToken).includes('ROLE_ADMIN') : false;

  const [isSyncing, setIsSyncing] = useState(false);

  // Đảm bảo farmSummary được load khi ở trong một farm (cần cho phân quyền Sidebar theo myRole)
  useEffect(() => {
    if (currentFarmId && farmSummary.length === 0) {
      fetchFarmsSummary();
    }
  }, [fetchFarmsSummary, currentFarmId, farmSummary.length]);

  // Tự động đồng bộ Farm Context từ URL (chỉ khi có farmId trong URL)
  useEffect(() => {
    // Force Admin to their dashboard if they are lost in farm dashboard
    if (isAdmin && location.pathname === "/dashboard") {
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    // Tự động thoát farm context khi quay lại trang dashboard tổng
    if (!urlFarmId && currentFarmId && location.pathname === "/dashboard") {
      clearFarmContext();
      return;
    }

    const syncFarmContext = async () => {
      if (urlFarmId && urlFarmId !== 'undefined' && urlFarmId !== currentFarmId) {
        setIsSyncing(true);
        try {
          const res = await farmService.selectFarm(urlFarmId);
          if (res.success && res.data.farmToken) {
            selectFarm(res.data.farmToken, urlFarmId);
          }
        } catch (err: any) {
          console.error('[Sync] Farm selection failed', err);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    syncFarmContext();
  }, [urlFarmId, currentFarmId, selectFarm, clearFarmContext, isAdmin, location.pathname, navigate]);

  const getActive = () => {
    const p = location.pathname;
    if (p.includes("/notifications")) return "notifications";
    if (p.includes("/farms/") && p.includes("/dashboard/notifications")) return "notifications";
    if (p.includes("/actions")) return "home";
    if (p.includes("/farms/") && p.includes("/dashboard")) return "metrics";
    if (p.includes("/dashboard")) return "dashboard";
    // Check for farm list or any farm-scoped page to highlight the 'tree' icon if needed, 
    // but specific farm pages usually have their own keys.
    if (p === "/farms") return "tree";
    if (p.includes("/members")) return "members";
    if (p.includes("/land-plots")) return "land-plots";
    if (p.includes("/map")) return "map";
    if (p.includes("/activity")) return "activity";
    if (p.includes("/metrics")) return "metrics";
    if (p.includes("/wallet")) return "wallet";
    if (p.includes("/task")) return "task";
    if (p.includes("/gemini")) return "gemini";
    if (p.includes("/crop-catalog")) return "crop-catalog";
    if (p.includes("/season-plans")) return "season-plans";
    if (p.includes("/warehouses")) return "warehouses";
    if (p.includes("/suppliers")) return "suppliers";
    if (p.includes("/skus")) return "skus";
    if (p.includes("/sessions")) return "sessions";
    if (p.includes("/config")) return "config";
    if (p.includes("/dashboard/notifications")) return "notifications";
    if (p.includes("/change-password")) return "settings";

    // If URL is /farms/:id/actions, maybe highlight 'tree' or nothing?
    // User seems to view 'tree' as the entry to farms.
    if (p.includes("/farms/") && p.endsWith("/actions")) return "home";
    if (p.includes("/farms/")) return "tree";

    return p.split("/").pop() || "dashboard";
  };

  const [active, setActive] = useState(getActive());

  const wideSidebarPaths = ["/members", "/land-plots", "/map", "/subscription", "/crop-catalog", "/season-plans", "/warehouses", "/suppliers", "/skus", "/config"];
  const isWideSidebarPage =
    wideSidebarPaths.some(path => location.pathname.includes(path)) ||
    (location.pathname.startsWith("/farms") && location.pathname !== "/farms");

  useEffect(() => {
    setActive(getActive());
  }, [location.pathname]);

  // If admin on /dashboard, show nothing while redirecting to prevent flash
  if (isAdmin && location.pathname === "/dashboard") {
    return null;
  }

  const handleNav = (key: string) => {
    setActive(key);

    // Navigation logic for specialized keys
    if (key === "metrics") {
      navigate(currentFarmId ? `/farms/${currentFarmId}/dashboard` : '/farms');
      return;
    }
    if (key === "wallet") {
      navigate(currentFarmId ? `/farms/${currentFarmId}/wallet` : '/wallet');
      return;
    }
    if (key === "gemini") {
      navigate(currentFarmId ? `/farms/${currentFarmId}/gemini` : '/gemini');
      return;
    }
    if (key === "activity") {
      navigate(currentFarmId ? `/farms/${currentFarmId}/activity` : '/activity');
      return;
    }
    if (key === "task") {
      navigate(currentFarmId ? `/farms/${currentFarmId}/task` : '/task');
      return;
    }
    if (key === "notifications") {
      navigate(currentFarmId ? `/farms/${currentFarmId}/dashboard/notifications` : "/notifications");
      return;
    }

    if (key === "subscription") {
      navigate(currentFarmId ? `/farms/${currentFarmId}/subscription/history` : '/subscription/pricing');
      return;
    }

    // Farm management routes (require farm selection)
    const farmSpecificKeys = [
      "map", "land-plots", "crop-catalog", "season-plans",
      "warehouses", "suppliers", "skus", "members", "config", "soil-profile"
    ];

    if (farmSpecificKeys.includes(key)) {
      if (currentFarmId) {
        navigate(`/farms/${currentFarmId}/${key}`);
      } else {
        toast.info("Vui lòng chọn trang trại", {
          description: "Bạn cần chọn một trang trại để sử dụng chức năng này.",
          icon: "🚜"
        });
        navigate('/farms');
      }
      return;
    }

    // Default dashboard/home logic
    if (key === "tree") {
      navigate('/farms');
      return;
    }

    if (key === "home" || key === "dashboard") {
      clearFarmContext();
      navigate("/dashboard");
      return;
    }


    if (key === "change-password") {
      navigate("/change-password");
      return;
    }

    if (key === "settings") {
      // Handled by Sidebar internally for sub-menu
      return;
    }

    // Context-dependent routes (Wallet, Activity, Task, Gemini, etc.)
    const farmContextKeys = ["wallet", "activity", "metrics", "task", "gemini", "season-plans", "map", "land-plots", "members", "subscription", "warehouses", "suppliers", "skus", "soil-profile"];

    if (farmContextKeys.includes(key)) {
      if (currentFarmId) {
        // Navigate to farm-specific route
        // Map 'task' key to 'tasks' route
        let routePart = key;
        if (key === "subscription") routePart = "subscription/history";

        navigate(`/farms/${currentFarmId}/${routePart}`);
      } else {
        // Navigate to global route if no farm selected
        let routePart = key;
        if (key === "task") routePart = "task";
        if (key === "subscription") routePart = "subscription/history";

        navigate(`/${routePart}`);
      }
      return;
    }

    if (key === "crop-catalog") {
      if (isAdmin) {
        navigate("/admin/crop-catalog");
      } else if (currentFarmId) {
        navigate(`/farms/${currentFarmId}/crop-catalog`);
      } else {
        clearFarmContext();
        navigate("/farms");
      }
      return;
    }

    navigate("/farms");
  };


  return (
    <div className="w-full h-screen bg-[#F8FAFC] flex overflow-hidden p-3 gap-3">
      <WebSocketProvider />
      <Sidebar
        variant={isWideSidebarPage ? "wide" : "compact"}
        active={active}
        setActive={handleNav}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-0 bg-white rounded-[32px] shadow-sm border border-slate-200 ${location.pathname.includes('/map') || location.pathname.includes('/season-plans') ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {isSyncing ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 gap-4">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest text-[10px]">Đang đồng bộ dữ liệu trang trại...</p>
          </div>
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
}
