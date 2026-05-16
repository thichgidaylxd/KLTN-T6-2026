import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import { usePlots } from '../../hooks/plots/usePlots';
import { useCrops } from '../../hooks/crops/useCrops';
import { useSeasonPlans } from '../../hooks/seasonPlans/useSeasonPlans';
import { useWarehouses } from '../../hooks/warehouses/useWarehouses';
import { useAssignedTasks } from '../../hooks/tasks/useAssignedTasks';
import { useWarehouseItems } from '../../hooks/warehouseItems/useWarehouseItems';
import { useMembers } from '../../hooks/members/useMembers';
import { useFarmWorkLogs } from '../../hooks/workLog/useWorkLogs';
import { useTransactionsByFarm } from '../../hooks/warehouseTransactions/useWarehouseTransactions';
import { useFarmTaskStats } from '../../hooks/seasonPlans/useFarmTaskStats';
import ActivityFeed, { Activity } from '../../components/dashboard/ActivityFeed';
import {
  StatCard,
  WeatherCard,
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
  const { plans, loading: plansLoading, fetchPlans, fetchStages, fetchTasks } = useSeasonPlans(farmId);
  const { items: warehouseItems, loading: itemsLoading, fetchAllItems } = useWarehouseItems(farmId);
  const { members, loadingMembers, fetchMembers } = useMembers();
  
  // Hoạt động gần đây (WorkLogs & Warehouse Transactions)
  const { data: workLogs = [], isLoading: logsLoading } = useFarmWorkLogs(farmId || '');
  const { transactions = [], loading: txLoading } = useTransactionsByFarm(farmId);

  useEffect(() => {
    const syncFarmData = async (silent = false) => {
      if (!farmId) {
        clearPlots();
        return;
      }

      if (!silent) setIsSyncing(true);
      try {
        // Fetch all base data in parallel
        await Promise.allSettled([
          fetchFarmCrops(),
          fetchPlans().then(async (plansData) => {
             // Sau khi lấy danh sách plans, fetch chi tiết stages và tasks cho từng plan để có dữ liệu thực tế
             if (plansData && plansData.length > 0) {
               const detailPromises = plansData.map(async (p) => {
                 const { phases } = await fetchStages(p.id);
                 if (phases && phases.length > 0) {
                   await Promise.allSettled(
                     phases.map(ph => fetchTasks(p.id, ph.id))
                   );
                 }
               });
               await Promise.allSettled(detailPromises);
             }
          }),
          fetchPlots(),
          fetchWarehouses(farmId),
          farmId ? fetchAllItems(farmId) : Promise.resolve([]),
          farmId ? fetchMembers(farmId) : Promise.resolve([])
        ]);
      } catch (error) {
        console.log("Dashboard data unavaliable:", error);
       
      } finally {
        if (!silent) setIsSyncing(false);
      }
    };

    syncFarmData();
    
    // Thiết lập interval để tự động đồng bộ dữ liệu nông trại mỗi 30 giây (Real-time feel)
    const interval = setInterval(() => syncFarmData(true), 30000);
    return () => clearInterval(interval);
  }, [farmId, fetchFarmCrops, fetchPlans, fetchPlots, fetchWarehouses, clearPlots]);

  // Dashboard is "truly" loading only on initial mount or when crucial data is missing
  const isLoading = (farmId && (plotsLoading || cropsLoading || plansLoading || warehousesLoading || itemsLoading || loadingMembers || logsLoading || txLoading)) || cropTypesLoading;

  // Tính toán số lượng vật tư sắp hết (stock <= minStockQty)
  const lowStockCount = warehouseItems.filter(item => item.stock <= (item.minStockQty || 0)).length;

  // Tính toán số lượng quản lý và nhân công (Chỉ đếm thành viên ĐANG HOẠT ĐỘNG thực sự)
  const { managerCount, workerCount } = useMemo(() => {
    // Lọc ra những thành viên có isActive là true (loại bỏ "Đã từ chối")
    const activeMembers = members.filter(m => m.isActive === true || String(m.isActive) === 'true');
    
    return {
      managerCount: activeMembers.filter(m => {
        const role = m.role?.name?.toUpperCase() || '';
        // Chỉ đếm Quản lý và Admin, không đếm Chủ trang trại (Owner) trong mục này để khớp với danh sách nhân sự
        return role === 'MANAGER' || role === 'ADMIN';
      }).length,
      workerCount: activeMembers.filter(m => {
        const role = m.role?.name?.toUpperCase() || '';
        return role === 'WORKER' || role === 'EMPLOYEE';
      }).length
    };
  }, [members]);

  // Tổng hợp Dòng thời gian hoạt động (Activity Feed)
  const activities: Activity[] = [
    ...workLogs.map(log => ({
      id: log.id,
      user: log.employee?.fullName || 'Hệ thống',
      action: 'đã hoàn thành nhiệm vụ',
      target: log.task?.name || 'không xác định',
      time: log.createdAt ? new Date(log.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
      type: 'work' as const,
      rawDate: log.createdAt || ''
    })),
    ...transactions.map(tx => ({
      id: tx.id,
      user: tx.performedBy?.fullName || 'Thành viên',
      action: tx.type.includes('IMPORT') || tx.qtyChange > 0 ? 'đã nhập kho' : 'đã xuất kho',
      target: tx.warehouseItem 
        ? `${Math.abs(tx.qtyChange)} ${tx.warehouseItem?.unit?.name || ''} ${tx.warehouseItem?.name || ''}`.trim()
        : 'vật tư không xác định',
      time: tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
      type: 'warehouse' as const,
      rawDate: tx.createdAt || ''
    }))
  ].filter(a => a.target !== 'undefined') // Hàng rào cuối cùng chống undefined
   .sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime())
   .slice(0, 10);

  // Tính toán tiến trình trung bình dựa trên status của plans
  return {
    stats: {
      totalPlots: farmId ? plots.length : 0,
      totalCrops: cropTypes.length > 0 ? cropTypes.length : (farmId ? Array.from(new Set(crops.map(c => c.cropType.id))).length : 0),
      totalArea: farmId
        ? plots.reduce((acc, p) => acc + (Number(p.areaHa) || 0), 0)
        : 0,
      totalPlants: crops.length + systemCrops.length,
      totalPlans: farmId ? plans.length : 0,
      lowStockCount,
      managerCount,
      workerCount,
    },
    plots,
    warehouses,
    activities,
    isLoading,
    isSyncing,
    plans,
  };
}

export default function MainPage() {
  const { farmId: routeFarmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const { user, currentFarmId } = useAuth();
  // Ưu tiên farmId từ URL, nếu không có thì lấy farmId hiện tại từ context
  const farmId = routeFarmId || currentFarmId || undefined;

  const { loading: assignedLoading } = useAssignedTasks(user?.id);

  // Force Admin to system dashboard if they land here
  useEffect(() => {
    const role = (user?.role || '').toUpperCase();
    if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const { stats, activities, plots, warehouses, isLoading: dashboardLoading, plans } = useDashboardData(farmId);
  const { stats: taskStats, loading: taskStatsLoading } = useFarmTaskStats(farmId);
  const isLoading = dashboardLoading || assignedLoading;

  // Tính toán số lượng task hoàn thành và chưa hoàn thành cho riêng user hiện tại
  // const completedCount = assignedTasks.filter(t => t.status?.isTerminal).length;
  // const pendingCount = assignedTasks.length - completedCount;

  // Tính toán hiệu suất nông trại (Tính trên TOÀN BỘ giai đoạn của farm)
  const calculatePerformance = () => {
    // 1. Thu thập tất cả giai đoạn từ tất cả các kế hoạch
    const allPhases = plans?.flatMap(p => p.phases || []) || [];

    // 2. Nếu có dữ liệu giai đoạn, tính theo % số giai đoạn đã hoàn thành
    if (allPhases.length > 0) {
      const completedPhases = allPhases.filter(ph => ph.status?.code === 'COMPLETED').length;
      return Math.round((completedPhases / allPhases.length) * 100);
    }

    // 3. Nếu chưa tải kịp dữ liệu giai đoạn chi tiết, tính theo % Kế hoạch đã hoàn thành dựa trên danh sách Plans
    if (plans && plans.length > 0) {
      const completedPlans = plans.filter(p => {
        const status = p.status;
        if (!status) return false;
        const statusCode = typeof status === 'string' ? status : status.code;
        return statusCode === 'COMPLETED';
      }).length;
      return Math.round((completedPlans / plans.length) * 100);
    }

    return 0;
  };

  const performancePct = calculatePerformance();

  const handleAddTask = () => {
    if (farmId) {
      navigate(`/farms/${farmId}/season-plans`);
    } else {
      navigate('/farms');
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden p-3 gap-3">
      {/* Main Content */}
      <div className="flex flex-col flex-1 gap-3 overflow-hidden">

        <TaskBar
          completed={taskStats.completed}
          pending={taskStats.pending}
          isLoading={taskStatsLoading}
          onAddTask={handleAddTask}
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
          <div 
            className="flex-1 min-h-0 overflow-hidden rounded-2xl p-4 flex flex-col gap-3 w-full h-full"
            style={{ background: "#3D6B31" }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/90 text-[11px] font-bold uppercase tracking-wider">Hoạt động nông trại</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <ActivityFeed activities={activities} isLoading={isLoading} />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <DonutChart pct={performancePct} isLoading={isLoading} />
          </div>
        </div>

        {/* Row 3 */}
        <div className="flex-none h-[85px] overflow-hidden">
          <CropStatusCards 
            planCount={stats.totalPlans} 
            managerCount={stats.managerCount} 
            workerCount={stats.workerCount} 
          />
        </div>
      </div>

      {/* Map Panel */}
      <div className="hidden lg:block w-[380px] xl:w-[440px] shrink-0 h-full overflow-hidden rounded-2xl bg-gray-50 border border-gray-100 shadow-sm">
        <MapPanel plots={plots} warehouses={warehouses} />
      </div>
    </div>
  );
}