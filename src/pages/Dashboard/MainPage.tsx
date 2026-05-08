import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import { usePlots } from '../../hooks/plots/usePlots';
import { useCrops } from '../../hooks/crops/useCrops';
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
  const { hubToken } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { plots, plotsLoading, fetchPlots, clearPlots } = usePlots();
  const { crops, cropTypes, loading: cropsLoading, cropTypesLoading, fetchCrops, fetchCropTypes } = useCrops();

  useEffect(() => {
    // 1. Luôn load danh mục cây trồng và loại cây (Global)
    fetchCrops();
    fetchCropTypes();

    if (farmId) {
      // 2a. CHẾ ĐỘ TRANG TRẠI: Load lô đất của farm này
      fetchPlots(farmId);
      setIsSyncing(false);
    } else {
      // 2b. CHẾ ĐỘ HUB: Xóa plots hiện tại
      clearPlots();
      setIsSyncing(false);
    }
  }, [farmId, fetchCrops, fetchCropTypes, fetchPlots, clearPlots]);

  const isLoading = (farmId && plotsLoading) || cropsLoading || cropTypesLoading || isSyncing;

  return {
    stats: {
      totalPlots: farmId ? plots.length : 0,
      totalCrops: cropTypes.length, 
      totalArea: farmId 
        ? plots.reduce((acc, p) => acc + (Number(p.areaHa) || 0), 0)
        : 0,
      totalPlants: crops.length,
      performancePct: 0, 
    },
    npkData: [], 
    isLoading
  };
}

export default function MainPage() {
  const { farmId: routeFarmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Force Admin to system dashboard if they land here
  useEffect(() => {
    const role = (user?.role || '').toUpperCase();
    if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Chỉ sử dụng farmId nếu nó tồn tại trên URL (Route Param)
  const farmId = routeFarmId || undefined;

  const { stats, npkData, isLoading } = useDashboardData(farmId);

  return (
    <div className="flex h-full w-full overflow-hidden p-3 gap-3">
      {/* Main Content */}
      <div className="flex flex-col flex-1 gap-3 overflow-hidden">

        <TaskBar
          completed={0}
          pending={0}
          isLoading={isLoading}
        />

        {/* Row 1 */}
        <div className="flex flex-1 gap-3 min-h-0 overflow-hidden flex-col xl:flex-row">
          <div className="grid grid-cols-2 gap-3 flex-1 min-h-0 overflow-hidden">
            <StatCard label="Tổng lô đất" value={isLoading ? "..." : stats.totalPlots} unit="Lô" />
            <StatCard label="Loại cây trồng" value={isLoading ? "..." : stats.totalCrops} unit="Loại" />
            <StatCard label="Tổng diện tích" value={isLoading ? "..." : stats.totalArea.toFixed(1)} unit="ha" />
            <StatCard label="Tổng số cây" value={isLoading ? "..." : stats.totalPlants} unit="Cây" />
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
        <MapPanel />
      </div>
    </div>
  );
}