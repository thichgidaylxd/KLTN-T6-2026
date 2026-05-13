import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import { usePlots } from '../../hooks/plots/usePlots';
import { useCrops } from '../../hooks/crops/useCrops';
import { useSeasonPlans } from '../../hooks/seasonPlans/useSeasonPlans';
import { useWarehouses } from '../../hooks/warehouses/useWarehouses';
import { useAssignedTasks } from '../../hooks/tasks/useAssignedTasks';
import {
  StatCard,
  WeatherCard,
  NpkPanel,
  DonutChart,
  CropStatusCards,
  MapPanel,
  TaskBar,
} from "../../components/dashboard";

/**
 * Hook lấy số liệu tổng hợp từ Redux Store
 */
function useDashboardData(farmId?: string) {
  const [isSyncing, setIsSyncing] = useState(false);

  const { plots, plotsLoading, clearPlots, fetchPlots } = usePlots(farmId);
  const { warehouses, loading: warehousesLoading, fetchWarehouses } = useWarehouses();
  const { crops, systemCrops, cropTypes, loading: cropsLoading, cropTypesLoading, fetchFarmCrops } = useCrops();
  const { plans, loading: plansLoading, fetchPlans } = useSeasonPlans(farmId);

  useEffect(() => {
    const syncFarmData = async () => {
      if (!farmId) {
        clearPlots();
        return;
      }

      setIsSyncing(true);
      try {
        // Fetch all data in parallel
        await Promise.allSettled([
          fetchFarmCrops(),
          fetchPlans(),
          fetchPlots(),
          fetchWarehouses(farmId)
        ]);
      } catch (error) {
        console.error("Dashboard farm sync error:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    syncFarmData();
  }, [farmId, fetchFarmCrops, fetchPlans, fetchPlots, fetchWarehouses, clearPlots]);

  // Dashboard is "truly" loading only on initial mount or when crucial data is missing
  const isLoading = (farmId && (plotsLoading || cropsLoading || plansLoading || warehousesLoading)) || cropTypesLoading;

  // Tính toán tiến trình trung bình dựa trên status của plans
  const calculatePerformance = () => {
    if (!farmId || plans.length === 0) return 0;
    const totalProgress = plans.reduce((acc, plan) => {
      const status = typeof plan.status === 'string' ? plan.status : plan.status.code;
      if (status === 'COMPLETED') return acc + 100;
      if (status === 'ACTIVE' || status === 'HARVESTING') return acc + 50;
      if (status === 'DRAFT' || status === 'READY_TO_HARVEST') return acc + 10;
      return acc;
    }, 0);
    return Math.round(totalProgress / plans.length);
  };

  return {
    stats: {
      totalPlots: farmId ? plots.length : 0,
      totalCrops: cropTypes.length > 0 ? cropTypes.length : (farmId ? Array.from(new Set(crops.map(c => c.cropType.id))).length : 0),
      totalArea: farmId
        ? plots.reduce((acc, p) => acc + (Number(p.areaHa) || 0), 0)
        : 0,
      totalPlants: crops.length + systemCrops.length,
      performancePct: calculatePerformance(),
    },
    plots,
    warehouses,
    npkData: [],
    isLoading,
    isSyncing
  };
}

export default function MainPage() {
  const { farmId: routeFarmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const { user, currentFarmId } = useAuth();
  const { tasks: assignedTasks, loading: assignedLoading } = useAssignedTasks(user?.id);

  // Ưu tiên farmId từ URL, nếu không có thì lấy farmId hiện tại từ context
  const farmId = routeFarmId || currentFarmId || undefined;

  // Force Admin to system dashboard if they land here
  useEffect(() => {
    const role = (user?.role || '').toUpperCase();
    if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const { stats, npkData, plots, warehouses, isLoading: dashboardLoading } = useDashboardData(farmId);
  const isLoading = dashboardLoading || assignedLoading;

  // Tính toán số lượng task hoàn thành và chưa hoàn thành cho riêng user hiện tại
  const completedCount = assignedTasks.filter(t => t.status?.isTerminal).length;
  const pendingCount = assignedTasks.length - completedCount;

  return (
    <div className="flex h-full w-full overflow-hidden p-3 gap-3">
      {/* Main Content */}
      <div className="flex flex-col flex-1 gap-3 overflow-hidden">

        <TaskBar
          completed={completedCount}
          pending={pendingCount}
          isLoading={isLoading}
        />

        {/* Row 1 */}
        <div className="flex flex-1 gap-3 min-h-0 overflow-hidden flex-col xl:flex-row">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 flex-1 min-h-0 overflow-hidden">
            <StatCard label="Lô đất" value={isLoading ? "..." : stats.totalPlots} unit="Lô" />
            <StatCard label="Loại cây trồng" value={isLoading ? "..." : stats.totalCrops} unit="Loại" />
            <StatCard label="Diện tích" value={isLoading ? "..." : stats.totalArea.toFixed(1)} unit="ha" />
            <StatCard label="Số lượng cây" value={isLoading ? "..." : stats.totalPlants} unit="Cây" />
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <WeatherCard />
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex flex-1 gap-4 min-h-0 overflow-hidden flex-col lg:flex-row">
          <div className="flex-1 min-h-0 overflow-hidden">
            <NpkPanel data={npkData} isLoading={isLoading} />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <DonutChart pct={stats.performancePct} isLoading={isLoading} />
          </div>
        </div>

        {/* Row 3 */}
        <div className="flex-none h-[85px] overflow-hidden">
          <CropStatusCards />
        </div>
      </div>

      {/* Map Panel */}
      <div className="hidden lg:block w-[380px] xl:w-[440px] shrink-0 h-full overflow-hidden rounded-2xl bg-gray-50 border border-gray-100 shadow-sm">
        <MapPanel plots={plots} warehouses={warehouses} />
      </div>
    </div>
  );
}