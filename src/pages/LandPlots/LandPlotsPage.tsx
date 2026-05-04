import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/useAuth';
import { usePlots } from '@/hooks/plots/usePlots';
import { Plot, CreatePlotInput } from '@/types/plot/plot';
import { extractErrorMessage } from '../../utils/errorUtils';
import { toast } from 'sonner';
import { LayoutGridIcon, PlusIcon, ArrowLeft } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { PlotTable } from '@/components/land-plots/PlotTable';
import { PlotCard } from '@/components/land-plots/PlotCard';
import { PlotFilters } from '@/components/land-plots/PlotFilters';
import { CreatePlotModal } from '@/components/land-plots/CreatePlotModal';
import { EditPlotModal } from '@/components/land-plots/EditPlotModal';
import { DeletePlotDialog } from '@/components/land-plots/DeletePlotDialog';

export function LandPlotsPage() {
  const navigate = useNavigate();
  const { currentFarmId } = useAuth();
  const { plots, fetchPlots, createPlot, updatePlot, deletePlot } = usePlots();

  // Redirect to farm selection if no farmId
  if (!currentFarmId) {
    return <Navigate to="/farms" replace />;
  }

  // Local UI State
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | 'all'>('all');

  // State quản lý các Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const [deletingPlot, setDeletingPlot] = useState<Plot | null>(null);

  useEffect(() => {
    fetchPlots(currentFarmId);
  }, [fetchPlots, currentFarmId]);

  // Xử lý lọc dữ liệu
  const filteredPlots = useMemo(() => {
    return plots.filter((plot) => {
      const matchesSearch = plot.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || plot.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
  }, [plots, searchTerm, statusFilter]);

  // Handlers cho CRUD
  const handleCreatePlot = async (plotData: CreatePlotInput) => {
    if (!currentFarmId) return;
    try {
      await createPlot(currentFarmId, plotData).unwrap();
      setIsCreateModalOpen(false);
      toast.success('Tạo lô đất mới thành công');
      fetchPlots(currentFarmId);
    } catch (err: any) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleUpdatePlot = async (updatedPlot: Plot) => {
    if (!currentFarmId) return;
    try {
      const isClearDescription =
        updatedPlot.description != null && updatedPlot.description.trim() === '';
      const version = updatedPlot.version ?? plots.find((p) => p.id === updatedPlot.id)?.version;

      await updatePlot(currentFarmId, updatedPlot.id, {
        version,
        name: updatedPlot.name,
        status: updatedPlot.status,
        ...(isClearDescription
          ? { isClearDescription: true }
          : { description: updatedPlot.description }),
      }).unwrap();
      setEditingPlot(null);
      toast.success('Cập nhật thông tin lô đất thành công');
      fetchPlots(currentFarmId);
    } catch (err: any) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleDeletePlot = async () => {
    if (deletingPlot && currentFarmId) {
      try {
        await deletePlot(currentFarmId, deletingPlot.id).unwrap();
        toast.success('Đã xóa lô đất thành công');
        setDeletingPlot(null);
        fetchPlots(currentFarmId);
      } catch (err: any) {
        toast.error(err.message || 'Không thể xóa lô đất');
      }
    }
  };

  const handleViewMap = (plot: Plot) => {
    navigate(`/farms/${currentFarmId}/map?plotId=${plot.id}&source=land-plots`, {
      state: {
        selectedPlotId: plot.id,
        preloadPlot: plot,
        source: 'land-plots',
      },
    });
  };

  const handleEditPlotInfo = (plot: Plot) => {
    setEditingPlot(plot);
  };

  return (
    <div className="w-full flex-1 space-y-6 font-sans py-4 animate-in fade-in duration-500 text-left">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 bg-white p-6 transition-all duration-300">
        <div className="flex items-center gap-6 w-full">
          <button
            onClick={() => navigate(`/farms/${currentFarmId}/actions`)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all font-bold text-xs shrink-0"
          >
            <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm hover:shadow-md transition-all">
              <ArrowLeft size={14} />
            </div>
            Quay lại
          </button>

          <div className="h-10 w-px bg-slate-200 mx-1 hidden sm:block" />

          <div className="flex items-center gap-4 flex-1">
            <div className="p-3 bg-emerald-100/50 rounded-2xl text-emerald-600">
              <LayoutGridIcon className="w-8 h-8" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý lô đất</h1>
              <p className="text-gray-500 mt-0.5 font-medium text-sm">
                Quản lý danh sách và thông tin các khu vực canh tác
              </p>
            </div>
          </div>
        </div>
        <div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-95 group whitespace-nowrap"
          >
            <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Tạo lô đất mới
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <PlotFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Content Section */}
      <div className="transition-all duration-300">
        {viewMode === 'table' ? (
          <PlotTable
            plots={filteredPlots}
            onEdit={handleEditPlotInfo}
            onDelete={setDeletingPlot}
            onViewMap={handleViewMap}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlots.map((plot) => (
              <PlotCard
                key={plot.id}
                plot={plot}
                onEdit={handleEditPlotInfo}
                onDelete={setDeletingPlot}
                onViewMap={handleViewMap}
              />
            ))}
            {filteredPlots.length === 0 && (
              <div className="col-span-full bg-white p-16 text-left">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300 border border-gray-100">
                  <LayoutGridIcon className="w-8 h-8 font-thin" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Không tìm thấy lô đất nào phù hợp</h3>
                <p className="text-gray-500 mt-1 font-medium">Thử thay đổi bộ lọc hoặc thêm một lô đất mới.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals & Dialogs */}
      <CreatePlotModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreatePlot}
        existingPlots={plots}
      />

      <EditPlotModal
        isOpen={!!editingPlot}
        onClose={() => setEditingPlot(null)}
        onSave={handleUpdatePlot}
        plot={editingPlot}
      />

      <DeletePlotDialog
        isOpen={!!deletingPlot}
        onClose={() => setDeletingPlot(null)}
        onConfirm={handleDeletePlot}
        plot={deletingPlot}
        hasActiveTasks={false}
      />
    </div>
  );
}

export default LandPlotsPage;
