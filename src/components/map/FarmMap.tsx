import {
  useCallback, useMemo, Fragment, useRef, useEffect,
  forwardRef, useImperativeHandle,
} from 'react'
import { GoogleMap, Polygon, Marker, InfoWindow, OverlayView } from '@react-google-maps/api'
import { useGoogleMaps } from '@/providers/GoogleMapsProvider'
import { Plot, GeoPoint } from '@/types/plot'
import { PlotInfoPopup } from './PlotInfoPopup'
import {
  getColorFromId, calculateCentroid, polygonsOverlap,
  getPlotPath, segmentsIntersect, pointInPolygon,
} from '@/utils/plotUtils'
import { Warehouse } from '@/types/warehouse/warehouse'

const MAP_OPTIONS: google.maps.MapOptions = {
  mapTypeId: 'satellite',
  disableDefaultUI: true, // Tắt toàn bộ UI mặc định (Zoom +/-, StreetView, Scale...)
  zoomControl: false,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
}

export interface FarmMapHandle {
  getEditedPath: () => GeoPoint[]
  getMapInstance: () => google.maps.Map | null
  getHoverPoint: () => GeoPoint | null
}

interface FarmMapProps {
  plots: Plot[]
  selectedPlotId?: string
  isDrawing: boolean
  isEditing: boolean
  currentPath: GeoPoint[]
  onPathChange: (path: GeoPoint[]) => void
  onPlotSelect: (plot: Plot | null) => void
  selectedPlot: Plot | null
  onOverlapChange?: (overlappingPlotName: string | null) => void
  warehouses: Warehouse[]
  selectedWarehouseId?: string
  onWarehouseSelect: (warehouse: Warehouse | null) => void
  /** Callback khi Google Maps load xong, truyền map instance lên parent */
  onMapLoad?: (map: google.maps.Map) => void
  /** Callback khi người dùng double click để hoàn thành vẽ */
  onDrawFinish?: () => void
}

const toLatLng = (geometry?: any): google.maps.LatLngLiteral[] => {
  if (!geometry?.coordinates || !Array.isArray(geometry.coordinates[0])) return []
  try {
    return geometry.coordinates[0]
      .map((c: any) => ({ lng: Number(c[0]), lat: Number(c[1]) }))
      .filter((p: any) => !isNaN(p.lat) && !isNaN(p.lng))
  } catch { return [] }
}

// ── Kiểm tra segment (from→to) có cắt/chứa bởi bất kỳ lô nào không ──
function segVsPlots(from: GeoPoint, to: GeoPoint, plots: Plot[]): boolean {
  for (const plot of plots) {
    const path = getPlotPath(plot)
    if (path.length < 3) continue
    // Điểm đích nằm trong lô
    if (pointInPolygon(to, path)) return true
    // Segment cắt cạnh lô
    for (let i = 0; i < path.length; i++) {
      if (segmentsIntersect(from, to, path[i], path[(i + 1) % path.length])) return true
    }
  }
  return false
}



export const FarmMap = forwardRef<FarmMapHandle, FarmMapProps>(function FarmMap(
  { plots, selectedPlotId, isDrawing, isEditing, currentPath, onPathChange,
    onPlotSelect, selectedPlot, onOverlapChange,
    warehouses, selectedWarehouseId, onWarehouseSelect,
    onMapLoad, onDrawFinish }, ref
) {
  const { isLoaded } = useGoogleMaps()
  const mapRef = useRef<google.maps.Map | null>(null)
  const editPolyRef = useRef<google.maps.Polygon | null>(null)
  const editListenersRef = useRef<google.maps.MapsEventListener[]>([])
  const rafRef = useRef<number | null>(null)

  // Drawing mode state
  const hoverPointRef = useRef<GeoPoint | null>(null)

  // Plots khác (loại trừ lô đang edit)
  const otherPlots = useMemo(
    () => plots.filter((p) => p.id !== selectedPlot?.id),
    [plots, selectedPlot]
  )

  const selectedWarehouse = useMemo(
    () => warehouses.find(w => w.id === selectedWarehouseId) || null,
    [warehouses, selectedWarehouseId]
  )

  useImperativeHandle(ref, () => ({
    getEditedPath(): GeoPoint[] {
      if (!editPolyRef.current) return currentPath
      const mvc = editPolyRef.current.getPath()
      const r: GeoPoint[] = []
      for (let i = 0; i < mvc.getLength(); i++)
        r.push({ lat: mvc.getAt(i).lat(), lng: mvc.getAt(i).lng() })
      return r
    },
    getMapInstance(): google.maps.Map | null {
      return mapRef.current
    },
    getHoverPoint(): GeoPoint | null {
      return hoverPointRef.current
    },
  }))

  // ── DRAWING: click handler — chặn nếu overlap ──────────────────
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!isDrawing || isEditing || !e.latLng) return
    const newPt: GeoPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() }

    // Ngăn chặn thêm điểm trùng lặp (ví dụ khi người dùng double click)
    if (currentPath.length > 0) {
      const last = currentPath[currentPath.length - 1]
      if (Math.abs(last.lat - newPt.lat) < 0.00001 && Math.abs(last.lng - newPt.lng) < 0.00001) {
        return
      }
    }

    // Kiểm tra điểm mới có nằm trong lô khác không
    if (otherPlots.some(p => {
      const path = getPlotPath(p)
      return path.length >= 3 && pointInPolygon(newPt, path)
    })) return // CHẶN

    // Kiểm tra segment cuối → điểm mới có cắt lô khác không
    if (currentPath.length > 0) {
      const last = currentPath[currentPath.length - 1]
      if (segVsPlots(last, newPt, otherPlots)) return // CHẶN
    }

    onPathChange([...currentPath, newPt])
  }, [isDrawing, isEditing, currentPath, onPathChange, otherPlots])

  // ── DRAWING: Double click để chốt ranh giới ──
  const handleMapDblClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!isDrawing && !isEditing) return
    e.domEvent?.preventDefault()
    onDrawFinish?.()
  }, [isDrawing, isEditing, onDrawFinish])

  // ── DRAWING: mouse move — cập nhật preview + overlap realtime ──
  const handleMapMouseMove = useCallback((e: google.maps.MapMouseEvent) => {
    if (!isDrawing || isEditing || !e.latLng) return
    const pt: GeoPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() }
    hoverPointRef.current = pt

    // Check hover point nằm trong lô nào
    const hoverInPlot = otherPlots.find(p => {
      const path = getPlotPath(p)
      return path.length >= 3 && pointInPolygon(pt, path)
    })
    if (hoverInPlot) {
      onOverlapChange?.(hoverInPlot.name)
      return
    }

    // Check segment cuối → hover + các segment đã vẽ
    const segConflict = currentPath.length > 0
      ? otherPlots.find(p => {
          const path = getPlotPath(p)
          if (path.length < 3) return false
          const last = currentPath[currentPath.length - 1]
          for (let i = 0; i < path.length; i++) {
            if (segmentsIntersect(last, pt, path[i], path[(i + 1) % path.length])) return true
          }
          return false
        })
      : null

    // Check các segment đã vẽ
    const existingConflict = !segConflict
      ? otherPlots.find(p => {
          const path = getPlotPath(p)
          if (path.length < 3) return false
          for (let i = 0; i < currentPath.length - 1; i++) {
            for (let j = 0; j < path.length; j++) {
              if (segmentsIntersect(currentPath[i], currentPath[i+1], path[j], path[(j+1) % path.length])) return true
            }
          }
          return false
        })
      : null

    const conflict = segConflict || existingConflict
    onOverlapChange?.(conflict ? conflict.name : null)
  }, [isDrawing, isEditing, currentPath, otherPlots, onOverlapChange])

  // ── Editing: checkOverlap với plots khác ──
  const checkEditOverlap = useCallback(
    (path: GeoPoint[]): Plot | null => {
      if (path.length < 3) return null
      return otherPlots.find(p => {
        const otherPath = getPlotPath(p)
        return otherPath.length >= 3 && polygonsOverlap(path, otherPath)
      }) ?? null
    },
    [otherPlots]
  )

  // ── EDITING: onLoad polygon ──────────────────────────────────────
  const handleEditPolyLoad = useCallback((poly: google.maps.Polygon) => {
    editPolyRef.current = poly
    const mvc = poly.getPath()

    const check = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        const path: GeoPoint[] = []
        for (let i = 0; i < mvc.getLength(); i++)
          path.push({ lat: mvc.getAt(i).lat(), lng: mvc.getAt(i).lng() })
        const conflict = checkEditOverlap(path)
        poly.setOptions({
          fillColor: conflict ? '#ef4444' : '#10b981',
          strokeColor: conflict ? '#dc2626' : '#059669',
        })
        onOverlapChange?.(conflict ? conflict.name : null)
      })
    }

    editListenersRef.current.forEach(l => l.remove())
    editListenersRef.current = [
      mvc.addListener('set_at', check),
      mvc.addListener('insert_at', check),
      mvc.addListener('remove_at', check),
    ]
    // Check ngay khi bắt đầu
    const initOverlap = otherPlots.find(p => {
      const op = getPlotPath(p)
      return op.length >= 3 && polygonsOverlap(currentPath, op)
    })
    onOverlapChange?.(initOverlap ? initOverlap.name : null)
  }, [otherPlots, onOverlapChange, currentPath])

  const handleEditPolyUnmount = useCallback(() => {
    editListenersRef.current.forEach(l => l.remove())
    editListenersRef.current = []
    editPolyRef.current = null
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }, [])

  // ── Reset khi thoát ─────────────────────────────────────────────
  useEffect(() => {
    if (!isDrawing) {
      hoverPointRef.current = null
      onOverlapChange?.(null)
    }
  }, [isDrawing, onOverlapChange])

  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    editListenersRef.current.forEach(l => l.remove())
  }, [])

  // ── Center / fitBounds ─────────────────────────────────────────
  const center = useMemo(() => {
    if (selectedPlot?.geometry) {
      const p = toLatLng(selectedPlot.geometry)
      if (p.length) {
        const c = calculateCentroid(p.map(x => ({ lat: Number(x.lat), lng: Number(x.lng) })))
        if (isFinite(c.lat) && isFinite(c.lng)) return c
      }
    }
    if (selectedPlot?.boundaries?.length) {
      const c = calculateCentroid(selectedPlot.boundaries.map(p => ({ lat: Number(p.lat), lng: Number(p.lng) })))
      if (isFinite(c.lat) && isFinite(c.lng)) return c
    }
    if (selectedWarehouseId) {
      const wh = warehouses.find(w => w.id === selectedWarehouseId)
      if (wh && isFinite(Number(wh.latitude)) && isFinite(Number(wh.longitude))) {
        return { lat: Number(wh.latitude), lng: Number(wh.longitude) }
      }
    }
    return { lat: 10.3606, lng: 106.3653 }
  }, [selectedPlot, selectedWarehouseId, warehouses])

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    onMapLoad?.(map)
  }, [onMapLoad])

  const onUnmount = useCallback(() => { 
    mapRef.current = null 
  }, [])

  useEffect(() => {
    if (!mapRef.current || !window.google || (plots.length === 0 && warehouses.length === 0)) return
    
    const bounds = new window.google.maps.LatLngBounds()
    let hasPoint = false

    if (selectedPlot) {
      const pts = selectedPlot.geometry ? toLatLng(selectedPlot.geometry) : (selectedPlot.boundaries ?? [])
      pts.forEach(p => {
        if (isFinite(p.lat) && isFinite(p.lng)) {
          bounds.extend({ lat: Number(p.lat), lng: Number(p.lng) })
          hasPoint = true
        }
      })
    } else if (selectedWarehouseId) {
      const wh = warehouses.find(w => w.id === selectedWarehouseId)
      if (wh && isFinite(Number(wh.latitude)) && isFinite(Number(wh.longitude)) && (Number(wh.latitude) !== 0)) {
        bounds.extend({ lat: Number(wh.latitude), lng: Number(wh.longitude) })
        hasPoint = true
      }
    } else {
      plots.forEach(plot => {
        const pts = plot.geometry ? toLatLng(plot.geometry) : (plot.boundaries ?? [])
        pts.forEach(p => {
          if (isFinite(p.lat) && isFinite(p.lng)) {
            bounds.extend({ lat: Number(p.lat), lng: Number(p.lng) })
            hasPoint = true
          }
        })
      })
      warehouses.forEach(wh => {
        if (isFinite(Number(wh.latitude)) && isFinite(Number(wh.longitude)) && (Number(wh.latitude) !== 0)) {
          bounds.extend({ lat: Number(wh.latitude), lng: Number(wh.longitude) })
          hasPoint = true
        }
      })
    }

    if (hasPoint) {
      const center = bounds.getCenter()
      const ne = bounds.getNorthEast()
      const sw = bounds.getSouthWest()
      const isPoint = Math.abs(ne.lat() - sw.lat()) < 0.0001 && Math.abs(ne.lng() - sw.lng()) < 0.0001
      
      if (isPoint || selectedWarehouseId) {
        mapRef.current.panTo(center)
        mapRef.current.setZoom(18)
      } else {
        mapRef.current.fitBounds(bounds, 50)
      }
    }
  }, [selectedPlot, selectedWarehouseId, plots, warehouses])

  if (!isLoaded)
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-emerald-700 font-black text-xl animate-bounce">Đang tải bản đồ...</div>
      </div>
    )

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={center}
      zoom={16}
      options={{ ...MAP_OPTIONS, disableDoubleClickZoom: isDrawing || isEditing, draggableCursor: isDrawing ? 'crosshair' : 'grab' }}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={handleMapClick}
      onMouseMove={handleMapMouseMove}
      onDblClick={handleMapDblClick}
    >
      {/* ── 1. Tất cả lô đất ── */}
      {plots.map((plot) => {
        const path = plot.geometry ? toLatLng(plot.geometry) : (plot.boundaries ?? [])
        const centroid = path.length >= 3 
          ? calculateCentroid(path.map(p => ({ lat: p.lat, lng: p.lng })))
          : (path.length > 0 ? path[0] : null);

        if (centroid && isNaN(centroid.lat)) return null;

        const isBeingEdited = isEditing && selectedPlotId === plot.id
        return (
          <Fragment key={plot.id}>
            {path.length >= 3 && (
              <Polygon
                path={path}
                onClick={() => !isDrawing && onPlotSelect(plot)}
                options={{
                  fillColor: getColorFromId(plot.id),
                  fillOpacity: isBeingEdited ? 0 : selectedPlotId === plot.id ? 0.55 : 0.25,
                  strokeColor: getColorFromId(plot.id),
                  strokeOpacity: isBeingEdited ? 0 : 0.9,
                  strokeWeight: selectedPlotId === plot.id ? 4 : 2,
                  zIndex: selectedPlotId === plot.id ? 2 : 1,
                  clickable: !isDrawing,
                }}
              />
            )}
            
            {/* Luôn hiển thị tên lô đất nếu có vị trí */}
            {!isBeingEdited && centroid && (
              <Marker
                key={`label-${plot.id}`}
                position={centroid}
                label={{ 
                  text: plot.name, 
                  color: '#ffffff', 
                  fontSize: '14px', 
                  fontWeight: '900',
                }}
                icon={{
                  path: 'M 0,0', // Empty path
                  scale: 0,
                }}
                zIndex={10}
                onClick={() => !isDrawing && onPlotSelect(plot)}
              />
            )}
          </Fragment>
        )
      })}

      {/* ── 1b. Tất cả kho hàng ── */}
        {warehouses.map((wh) => {
          const lat = Number(wh.latitude), lng = Number(wh.longitude)
          if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
          const pos = { lat, lng };

          return (
            <Fragment key={`wh-${wh.id}`}>
              <Marker
                position={pos}
                onClick={() => !isDrawing && onWarehouseSelect(wh)}
                icon={{
                  path: 'M 0,0 L -8,-16 L 8,-16 z',
                  fillColor: '#ef4444',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                  scale: 1,
                }}
                zIndex={5}
              />
              <OverlayView
                position={pos}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div 
                  className="text-white font-black whitespace-nowrap -translate-x-1/2 -translate-y-[40px] text-[11px] plot-label-shadow px-1 bg-red-600/20 rounded cursor-pointer"
                  onClick={() => !isDrawing && onWarehouseSelect(wh)}
                >
                  {wh.name}
                </div>
              </OverlayView>
            </Fragment>
          );
        })}

      {/* ── 2. DRAWING: handled entirely by CanvasOverlay ── */}      {/* ── 3. EDITING: polygon kéo được ── */}
      {isEditing && selectedPlot && currentPath.length >= 3 && (
        <Polygon
          key={`edit-${selectedPlot.id}`}
          path={currentPath}
          onLoad={handleEditPolyLoad}
          onUnmount={handleEditPolyUnmount}
          options={{
            fillColor: '#10b981', fillOpacity: 0.3,
            strokeColor: '#059669', strokeOpacity: 1,
            strokeWeight: 3, editable: true, draggable: false, zIndex: 10,
          }}
        />
      )}

      {/* ── 4a. Popup Lô đất ── */}
      {selectedPlot && !isDrawing && !isEditing && getPlotPath(selectedPlot).length > 0 && (
        <InfoWindow
          key={`info-plot-${selectedPlot.id}`}
          position={
            getPlotPath(selectedPlot)[0] || center
          }
          onCloseClick={() => onPlotSelect(null)}
        >
          <PlotInfoPopup
            plot={selectedPlot}
            onClose={() => onPlotSelect(null)}
          />
        </InfoWindow>
      )}

      {/* ── 4b. Popup Kho hàng ── */}
      {selectedWarehouse && !isDrawing && !isEditing && !isNaN(Number(selectedWarehouse.latitude)) && !isNaN(Number(selectedWarehouse.longitude)) && (
        <InfoWindow
          key={`info-wh-${selectedWarehouse.id}`}
          position={{ lat: Number(selectedWarehouse.latitude), lng: Number(selectedWarehouse.longitude) }}
          onCloseClick={() => onWarehouseSelect(null)}
        >
          <div className="p-3 min-w-[200px] text-left">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-warehouse"><path d="M22 22H2"/><path d="M6 22V10l6-6 6 6v12"/><path d="M10 22v-4a2 2 0 0 1 4 0v4"/><path d="M2 10l10-8 10 8"/></svg>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{selectedWarehouse.name}</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs text-slate-500">
                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                <span>{selectedWarehouse.address}</span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                 <span className="text-[10px] font-mono font-bold text-slate-400">
                   {Number(selectedWarehouse.latitude).toFixed(6)}, {Number(selectedWarehouse.longitude).toFixed(6)}
                 </span>
              </div>
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  )
})
