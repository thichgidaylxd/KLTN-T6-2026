import { useState, useEffect } from 'react';
import { Map as MapIcon } from 'lucide-react';
import { Plot } from '@/types/plot';
import { Warehouse } from '@/types/warehouse/warehouse';
import { PlotListItem } from './PlotListItem';
import { WarehouseListItem } from './WarehouseListItem';

interface Props {
  plots: Plot[];
  warehouses: Warehouse[];
  selectedPlot: Plot | null;
  selectedWarehouse: Warehouse | null;
  onSelectPlot: (plot: Plot) => void;
  onSelectWarehouse: (wh: Warehouse) => void;
  onEditPlot?: (plot: Plot) => void;
  onEditBoundaries?: (plot: Plot) => void;
  onStartDraw?: (plot: Plot) => void;
  onDeletePlot?: (plot: Plot) => void;
}

export function MapSidebar({ plots, warehouses, selectedPlot, selectedWarehouse, ...handlers }: Props) {
  const [tab, setTab] = useState<'plots' | 'warehouses'>('plots');

  // Auto switch tab when selection changes from outside
  useEffect(() => {
    if (selectedWarehouse) {
      setTab('warehouses');
    } else if (selectedPlot) {
      setTab('plots');
    }
  }, [selectedWarehouse, selectedPlot]);

  return (
    <div
      className="relative w-full h-full flex flex-col bg-white/95 backdrop-blur-md"
    >
      {/* Tab switcher */}
      <div className="px-3 py-2.5 border-b border-gray-100 shrink-0">
        <div className="flex bg-gray-100 p-0.5 rounded-xl mb-2">
          <button
            onClick={() => setTab('plots')}
            className={`flex-1 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
              tab === 'plots' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'
            }`}
          >
            Lô đất ({plots.length})
          </button>
          <button
            onClick={() => setTab('warehouses')}
            className={`flex-1 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
              tab === 'warehouses' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'
            }`}
          >
            Kho hàng ({warehouses.length})
          </button>
        </div>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-0.5">
          {tab === 'plots' ? 'Danh sách khu vực canh tác' : 'Danh sách hạ tầng lưu trữ'}
        </p>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 min-h-0">
        {tab === 'plots'
          ? plots.length === 0
            ? <EmptyState label="Chưa có lô đất nào" />
            : plots.map(plot => (
                <PlotListItem
                  key={plot.id}
                  plot={plot}
                  isActive={selectedPlot?.id === plot.id}
                  onSelect={handlers.onSelectPlot}
                  onEdit={handlers.onEditPlot}
                  onEditBoundaries={handlers.onEditBoundaries}
                  onStartDraw={handlers.onStartDraw}
                  onDelete={handlers.onDeletePlot}
                />
              ))
          : warehouses.length === 0
            ? <EmptyState label="Chưa có kho hàng nào" />
            : warehouses.map(wh => (
                <WarehouseListItem
                  key={wh.id}
                  warehouse={wh}
                  isActive={selectedWarehouse?.id === wh.id}
                  onSelect={handlers.onSelectWarehouse}
                />
              ))
        }
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="px-4 py-8 text-center flex flex-col items-center gap-2">
      <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
        <MapIcon className="w-5 h-5 text-gray-300" />
      </div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}
