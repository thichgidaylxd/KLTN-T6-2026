import { useCallback, useState, useEffect } from "react";
import { GoogleMap, Marker, Polygon, OverlayView } from "@react-google-maps/api";
import { useGoogleMaps } from "@/providers/GoogleMapsProvider";
import { Maximize2, Minimize2, Map as MapIcon, X, Check } from "lucide-react";
import { Plot } from "@/types/plot/plot";
import { Warehouse } from "@/types/warehouse/warehouse";
import { cn } from "@/utils/cn";
import { getColorFromId, calculateCentroid, getPlotPath } from "@/utils/plotUtils";

interface LatLng {
  lat: number;
  lng: number;
}

interface LocationPickerMapProps {
  value: LatLng | null;
  onChange: (coords: LatLng | null) => void;
  plots?: Plot[];
  warehouses?: Warehouse[];
}

const DEFAULT_CENTER = { lat: 10.762622, lng: 106.660172 };

const MAP_STYLES = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
];

export default function LocationPickerMap({ value, onChange, plots = [], warehouses = [] }: LocationPickerMapProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [tempValue, setTempValue] = useState<LatLng | null>(value);

  // Đồng bộ tempValue khi value thay đổi (ví dụ khi reset form)
  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      setTempValue({
        lat: parseFloat(e.latLng.lat().toFixed(6)),
        lng: parseFloat(e.latLng.lng().toFixed(6)),
      });
    },
    []
  );

  const handleConfirm = () => {
    onChange(tempValue);
    setIsFullscreen(false); // Tự động thu nhỏ bản đồ sau khi xác nhận
  };

  const handleCancel = () => {
    // Chỉ hủy thao tác chọn tạm thời, quay về giá trị đã xác nhận trước đó (nếu có)
    setTempValue(value);
  };

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Kích hoạt resize event sau khi transition kết thúc để map re-center đúng
    setTimeout(() => {
      if (map) google.maps.event.trigger(map, 'resize');
    }, 300);
  };

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-[300px] rounded-2xl border border-red-200 bg-red-50 text-red-500 text-[10px] font-bold p-4 text-center">
        Không thể tải bản đồ. Vui lòng kiểm tra cấu hình.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[300px] rounded-2xl border border-slate-100 bg-slate-50 text-slate-400 text-[10px] font-bold animate-pulse">
        Đang tải Google Maps...
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "relative group rounded-2xl overflow-hidden border border-slate-200 shadow-inner transition-all duration-500 z-20",
        isFullscreen ? "fixed inset-0 z-[100] bg-black shadow-none rounded-none border-none" : "h-[300px]"
      )}
    >
      {/* Overlay info */}
   <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-md text-[9px] font-bold tracking-wide text-slate-500 px-3 py-1 rounded-xl shadow-md border border-slate-100 pointer-events-none flex items-center gap-1.5 whitespace-nowrap">
  <MapIcon size={10} className="text-emerald-500" />
  Click để chọn vị trí kho hàng
</div>

      {/* Custom Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="w-10 h-10 bg-white hover:bg-slate-50 text-slate-600 rounded-xl shadow-xl border border-slate-100 flex items-center justify-center transition-all active:scale-90"
          title={isFullscreen ? "Thu gọn" : "Toàn màn hình"}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={tempValue || (plots.length > 0 && getPlotPath(plots[0])[0] ? { lat: getPlotPath(plots[0])[0].lat, lng: getPlotPath(plots[0])[0].lng } : DEFAULT_CENTER)}
        zoom={tempValue ? 17 : 15}
        onClick={handleMapClick}
        onLoad={onLoad}
        options={{
          styles: MAP_STYLES,
          disableDefaultUI: true,
          mapTypeId: 'satellite',
          tilt: 0,
        }}
      >
        {/* Render Land Plots boundaries */}
        {plots.map((plot) => {
          const path = getPlotPath(plot);
          if (path.length === 0) return null;
          
          const center = calculateCentroid(path);
          const color = getColorFromId(plot.id);

          return (
            <div key={plot.id}>
              <Polygon
                paths={path}
                options={{
                  fillColor: color,
                  fillOpacity: 0.15,
                  strokeColor: color,
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                }}
              />
              <OverlayView
                position={center}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div 
                  className="text-white font-black whitespace-nowrap -translate-x-1/2 -translate-y-1/2 text-sm plot-label-shadow"
                >
                  {plot.name}
                </div>
              </OverlayView>
            </div>
          );
        })}

        {/* Render Existing Warehouses */}
        {warehouses.map((wh) => {
          if (wh.latitude === null || wh.longitude === null) return null;
          return (
            <Marker
              key={wh.id}
              position={{ lat: wh.latitude!, lng: wh.longitude! }}
              icon={{
                url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                scaledSize: new google.maps.Size(32, 32)
              }}
              label={{
                text: wh.name,
                color: "white",
                fontSize: "10px",
                fontWeight: "bold",
                className: "bg-slate-800/80 px-1.5 py-0.5 rounded text-[8px] border border-slate-700 -translate-y-8"
              }}
            />
          );
        })}

        {tempValue && (
          <>
            <Marker
              position={tempValue}
              animation={google.maps.Animation.DROP}
            />
            <OverlayView
              position={tempValue}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div className="bg-white p-2 flex flex-col gap-2 min-w-[160px] rounded-xl shadow-2xl border border-slate-100 -translate-x-1/2 -translate-y-[calc(100%+45px)] relative">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black font-mono text-slate-700">
                    {tempValue.lat.toFixed(6)}, {tempValue.lng.toFixed(6)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 h-8 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[9px] font-bold rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-1"
                  >
                    <X size={10} />
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="flex-[2] h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold rounded-lg border border-emerald-500 shadow-sm transition-all flex items-center justify-center gap-1"
                  >
                    <Check size={10} />
                    Xác nhận vị trí
                  </button>
                </div>
                {/* Triangle Arrow */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white" />
              </div>
            </OverlayView>
          </>
        )}
      </GoogleMap>
    </div>
  );
}
