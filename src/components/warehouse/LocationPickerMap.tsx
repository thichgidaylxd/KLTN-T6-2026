import { useCallback, useState, useEffect, useMemo } from "react";
import { GoogleMap, Marker, Polygon, OverlayView } from "@react-google-maps/api";
import { useGoogleMaps } from "@/providers/GoogleMapsProvider";
import { Maximize2, Minimize2, Map as MapIcon, X } from "lucide-react";
import { Fragment } from "react";
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
      const coords = {
        lat: parseFloat(e.latLng.lat().toFixed(6)),
        lng: parseFloat(e.latLng.lng().toFixed(6)),
      };
      setTempValue(coords);
      onChange(coords); // Tự động lưu vị trí khi click
    },
    [onChange]
  );

  const handleCancel = () => {
    // Xóa vị trí đã chọn
    setTempValue(null);
    onChange(null);
  };

  // Tự động căn chỉnh bản đồ khi dữ liệu plots/warehouses thay đổi
  useEffect(() => {
    if (!map || (!plots.length && !warehouses.length)) return;

    const bounds = new google.maps.LatLngBounds();
    let hasPoint = false;

    plots.forEach(plot => {
      const path = getPlotPath(plot);
      path.forEach(p => {
        bounds.extend(p);
        hasPoint = true;
      });
    });

    warehouses.forEach(wh => {
      if (wh.latitude && wh.longitude) {
        bounds.extend({ lat: Number(wh.latitude), lng: Number(wh.longitude) });
        hasPoint = true;
      }
    });

    if (hasPoint && !value) {
      map.fitBounds(bounds, 50);
      // Nếu zoom quá gần (chỉ có 1 điểm), thu nhỏ lại một chút
      google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        if (map.getZoom()! > 18) map.setZoom(17);
      });
    }
  }, [map, plots, warehouses, value]);

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

  // Tính toán vị trí trung tâm của farm để dùng làm fallback khi chưa chọn vị trí
  const farmCenter = useMemo(() => {
    if (plots.length > 0) {
      const path = getPlotPath(plots[0]);
      if (path.length > 0) return { lat: path[0].lat, lng: path[0].lng };
    }
    if (warehouses.length > 0 && warehouses[0].latitude && warehouses[0].longitude) {
      return { lat: Number(warehouses[0].latitude), lng: Number(warehouses[0].longitude) };
    }
    return DEFAULT_CENTER;
  }, [plots, warehouses]);

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
        center={tempValue || farmCenter}
        zoom={17}
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
            <Fragment key={plot.id}>
              <Polygon
                paths={path}
                options={{
                  fillColor: color,
                  fillOpacity: 0.25,
                  strokeColor: color,
                  strokeOpacity: 0.9,
                  strokeWeight: 2,
                }}
              />
              <Marker
                position={center}
                label={{
                  text: plot.name,
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "900",
                }}
                icon={{
                  path: 'M 0,0',
                  scale: 0
                }}
              />
            </Fragment>
          );
        })}

        {/* Render Existing Warehouses */}
        {warehouses.map((wh) => {
          if (wh.latitude === null || wh.longitude === null) return null;
          const pos = { lat: wh.latitude!, lng: wh.longitude! };
          return (
            <Fragment key={wh.id}>
              <Marker
                position={pos}
                icon={{
                  path: 'M 0,0 L -8,-16 L 8,-16 z',
                  fillColor: '#ef4444',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                  scale: 1,
                }}
              />
              <OverlayView
                position={pos}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div className="text-white font-black whitespace-nowrap -translate-x-1/2 -translate-y-[40px] text-[11px] plot-label-shadow px-1 bg-red-600/20 rounded">
                  {wh.name}
                </div>
              </OverlayView>
            </Fragment>
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
                    Xóa vị trí đã chọn
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
