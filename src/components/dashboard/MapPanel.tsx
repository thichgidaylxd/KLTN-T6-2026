import { useRef, useCallback, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { useGoogleMaps } from "../../providers/GoogleMapsProvider";
import { FarmMap } from "../map/FarmMap";
import { Plot } from "../../types/plot";
import { Warehouse } from "../../types/warehouse/warehouse";

interface MapPanelProps {
  plots: Plot[];
  warehouses: Warehouse[];
}

export default function MapPanel({ plots, warehouses }: MapPanelProps) {
  const mainMapRef = useRef<google.maps.Map | null>(null);
  const { isLoaded } = useGoogleMaps();
  
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const onMainMapLoad = useCallback((map: google.maps.Map) => {
    mainMapRef.current = map;
  }, []);

  const handleSelectPlot = useCallback((plot: Plot | null) => {
    setSelectedPlot(plot);
    setSelectedWarehouse(null);
    if (plot && plot.geometry?.type === 'Polygon' && mainMapRef.current && window.google) {
      const coords = plot.geometry.coordinates[0];
      const bounds = new window.google.maps.LatLngBounds();
      coords.forEach(coord => bounds.extend({ lat: coord[1], lng: coord[0] }));
      mainMapRef.current.fitBounds(bounds);
    }
  }, []);

  const handleSelectWarehouse = useCallback((wh: Warehouse | null) => {
    setSelectedWarehouse(wh);
    setSelectedPlot(null);
    if (wh && wh.latitude && wh.longitude && mainMapRef.current) {
      mainMapRef.current.panTo({ lat: Number(wh.latitude), lng: Number(wh.longitude) });
      mainMapRef.current.setZoom(16);
    }
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
    // Kích hoạt resize event sau khi transition kết thúc để map hiển thị đúng
    setTimeout(() => {
      if (mainMapRef.current) {
        window.google.maps.event.trigger(mainMapRef.current, 'resize');
      }
    }, 300);
  }, []);

  return (
    <div className={`transition-all duration-500 shadow-md bg-white overflow-hidden ${
      isFullscreen 
        ? "!fixed !inset-0 !z-[9999] m-0 !rounded-none" 
        : "relative w-full h-full rounded-[32px] shrink-0 border border-gray-100"
    }`}>
      {isLoaded ? (
        <FarmMap
          plots={plots}
          warehouses={warehouses}
          selectedPlot={selectedPlot}
          selectedPlotId={selectedPlot?.id}
          selectedWarehouseId={selectedWarehouse?.id}
          onPlotSelect={handleSelectPlot}
          onWarehouseSelect={handleSelectWarehouse}
          onMapLoad={onMainMapLoad}
          isDrawing={false}
          isEditing={false}
          currentPath={[]}
          onPathChange={() => {}}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-sm font-medium text-slate-400">Đang khởi tạo bản đồ...</span>
          </div>
        </div>
      )}

      {/* Small Summary Panel - Top Right */}
      <div className={`absolute top-6 right-8 z-20 flex items-center gap-2 transition-all duration-500`}>
        <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-md border border-white/50 flex items-center gap-4">
          <div className="flex flex-col items-center border-r border-gray-100 pr-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Lô đất</span>
            <span className="text-sm font-black text-emerald-600 leading-none">{plots.length}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Kho hàng</span>
            <span className="text-sm font-black text-blue-600 leading-none">{warehouses.length}</span>
          </div>
        </div>
      </div>

      {/* Fullscreen/Minimize Toggle Button */}
      <div className="absolute top-6 left-8 z-[100]">
        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="shadow-xl rounded-xl bg-white/95 backdrop-blur-md hover:bg-white h-11 w-11 flex items-center justify-center text-slate-700 transition-all active:scale-90 border border-white/50 group"
          title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
        >
          {isFullscreen ? (
            <Minimize2 size={22} strokeWidth={2.5} className="group-hover:text-emerald-600 transition-colors" />
          ) : (
            <Maximize2 size={22} strokeWidth={2.5} className="group-hover:text-emerald-600 transition-colors" />
          )}
        </button>
      </div>
    </div>
  );
}



