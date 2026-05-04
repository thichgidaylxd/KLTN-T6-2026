import { useCallback, useRef, useState, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react'
import { GoogleMap, Polygon, Polyline, Marker } from '@react-google-maps/api'
import { Geometry, GeoPoint, Plot } from '@/types/plot'
import { useGoogleMaps } from '@/providers/GoogleMapsProvider'
import { 
  isSelfIntersecting, 
  getPlotPath, 
  pointInPolygon, 
  segmentsIntersect 
} from '@/utils/plotUtils'

export interface PlotDrawingMapHandle {
  clear: () => void
}

interface PlotDrawingMapProps {
  onGeometryChange: (geometry: Geometry | null, areaHa: number) => void
  initialGeometry?: Geometry | null
  tempPlotData?: Partial<Plot>
  existingPlots?: Plot[]
  /** Override chiều cao map container. Mặc định '400px' */
  mapHeight?: string
}

const MAP_OPTIONS: google.maps.MapOptions = {
  mapTypeId: 'satellite',
  tilt: 0,
  mapTypeControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
}

const SNAP_RADIUS = 20 // pixels

export const PlotDrawingMap = forwardRef<PlotDrawingMapHandle, PlotDrawingMapProps>(({ 
  onGeometryChange, 
  initialGeometry, 
  existingPlots = [],
  mapHeight = '400px',
}, ref) => {
  const { isLoaded } = useGoogleMaps()

  const [drawPts, setDrawPts] = useState<GeoPoint[]>([])
  const [hoverPt, setHoverPt] = useState<GeoPoint | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [overlappingPlotName, setOverlappingPlotName] = useState<string | null>(null)
  const [isSelfIntersect, setIsSelfIntersect] = useState(false)
  const [area, setArea] = useState(0)

  const mapRef = useRef<google.maps.Map | null>(null)

  const handleClear = useCallback(() => {
    setDrawPts([])
    setHoverPt(null)
    setIsDrawing(false)
    setOverlappingPlotName(null)
    setIsSelfIntersect(false)
    setArea(0)
    onGeometryChange(null, 0)
  }, [onGeometryChange])

  useImperativeHandle(ref, () => ({ clear: handleClear }))

  useEffect(() => {
    if (drawPts.length >= 3 && window.google?.maps?.geometry) {
      const path = drawPts.map(p => new google.maps.LatLng(p.lat, p.lng))
      const sqm = google.maps.geometry.spherical.computeArea(path)
      setArea(sqm / 10000)
    } else {
      setArea(0)
    }
  }, [drawPts])

  const checkOverlap = useCallback((from: GeoPoint, to: GeoPoint) => {
    const inside = existingPlots.find(p => {
      const path = getPlotPath(p)
      return path.length >= 3 && pointInPolygon(to, path)
    })
    if (inside) return inside.name

    const intersect = existingPlots.find(p => {
      const path = getPlotPath(p)
      if (path.length < 3) return false
      for (let i = 0; i < path.length; i++) {
        if (segmentsIntersect(from, to, path[i], path[(i + 1) % path.length])) return true
      }
      return false
    })
    return intersect ? intersect.name : null
  }, [existingPlots])

  const finishDrawing = useCallback(() => {
    if (drawPts.length < 3) return
    const coords = drawPts.map(p => [p.lng, p.lat])
    coords.push([...coords[0]])
    onGeometryChange({ type: 'Polygon', coordinates: [coords] }, area)
    setIsDrawing(false)
    setHoverPt(null)
    setOverlappingPlotName(null)
  }, [drawPts, area, onGeometryChange])

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!isDrawing || !e.latLng) return
    const pt = { lat: e.latLng.lat(), lng: e.latLng.lng() }
    const currentOverlap = drawPts.length > 0 ? checkOverlap(drawPts[drawPts.length - 1], pt) : null
    const currentSelf = drawPts.length > 0 ? isSelfIntersecting([...drawPts, pt]) : false
    const hasError = !!currentOverlap || currentSelf

    if (hasError) {
      setDrawPts(prev => prev.slice(0, -1))
      return
    }

    if (drawPts.length >= 3) {
      const proj = mapRef.current?.getProjection()
      if (proj && e.latLng) {
        const p1 = proj.fromLatLngToPoint(new google.maps.LatLng(drawPts[0].lat, drawPts[0].lng))
        const p2 = proj.fromLatLngToPoint(e.latLng)
        if (p1 && p2) {
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y) * Math.pow(2, mapRef.current?.getZoom() || 0)
          if (dist < SNAP_RADIUS) { finishDrawing(); return }
        }
      }
    }
    setDrawPts(prev => [...prev, pt])
  }, [isDrawing, drawPts, checkOverlap, finishDrawing])

  const handleMouseMove = useCallback((e: google.maps.MapMouseEvent) => {
    if (!isDrawing || !e.latLng) return
    const pt = { lat: e.latLng.lat(), lng: e.latLng.lng() }
    setHoverPt(pt)
    if (drawPts.length > 0) {
      setOverlappingPlotName(checkOverlap(drawPts[drawPts.length - 1], pt))
      setIsSelfIntersect(isSelfIntersecting([...drawPts, pt]))
    }
  }, [isDrawing, drawPts, checkOverlap])

  const center = useMemo(() => {
    if (initialGeometry?.coordinates?.[0]?.[0])
      return { lng: initialGeometry.coordinates[0][0][0], lat: initialGeometry.coordinates[0][0][1] }
    return { lat: 10.3606, lng: 106.3653 }
  }, [initialGeometry])

  const errorMessage = useMemo(() => {
    if (isSelfIntersect) return 'Ranh giới không hợp lệ: ranh giới lô đất không được tự cắt chính nó.'
    if (overlappingPlotName) return 'Ranh giới không hợp lệ: Các lô đất không được phép chồng lên nhau.'
    return null
  }, [isSelfIntersect, overlappingPlotName])

  if (!isLoaded) return <div>Loading...</div>

  return (
    <div className="flex flex-col gap-3 relative" style={{ height: '100%' }}>
      {errorMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
          <div className="bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg text-center min-w-[300px]">
            {errorMessage}
            <div className="text-[10px] mt-1 text-gray-300 font-normal">Nhấn click để xóa điểm lỗi và vẽ lại</div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            if (isDrawing) {
              if (drawPts.length >= 3) finishDrawing()
              else setIsDrawing(false)
            } else {
              handleClear()
              setIsDrawing(true)
            }
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all font-medium text-sm ${
            isDrawing 
              ? 'bg-amber-500 border-amber-500 text-white shadow-lg' 
              : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-500 hover:text-emerald-600'
          }`}
        >
          {isDrawing ? '⏹ Kết thúc vẽ' : '✏️ Vẽ polygon'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all font-medium text-sm"
        >
          Xóa
        </button>
      </div>

      {/* Map Container — dùng mapHeight prop */}
      <div
        className="rounded-xl overflow-hidden border border-gray-200 shadow-sm relative group"
        style={{ height: mapHeight, minHeight: 0, flex: mapHeight === '100%' ? 1 : undefined }}
      >
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={16}
          onLoad={m => { mapRef.current = m }}
          options={MAP_OPTIONS}
          onClick={handleMapClick}
          onMouseMove={handleMouseMove}
        >
          {existingPlots.map(plot => {
            const path = getPlotPath(plot)
            if (path.length < 3) return null
            return (
              <Polygon
                key={plot.id}
                path={path}
                options={{
                  fillColor: '#10b981', fillOpacity: 0.1,
                  strokeColor: '#34d399', strokeWeight: 1,
                  clickable: false, zIndex: 0
                }}
              />
            )
          })}

          {drawPts.length > 0 && (
            <>
              <Polyline
                path={drawPts}
                options={{ strokeColor: '#10b981', strokeWeight: 2, zIndex: 2, clickable: false }}
              />
              {isDrawing && hoverPt && (
                <Polyline
                  path={[drawPts[drawPts.length - 1], hoverPt]}
                  options={{
                    strokeColor: errorMessage ? '#ef4444' : '#10b981',
                    strokeWeight: 2, strokeOpacity: 0.5, zIndex: 2, clickable: false
                  }}
                />
              )}
              {drawPts.map((p, i) => (
                <Marker
                  key={i}
                  position={p}
                  clickable={false}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: i === 0 ? '#fbbf24' : '#10b981',
                    fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2, scale: 5
                  }}
                />
              ))}
            </>
          )}

          {!isDrawing && drawPts.length >= 3 && (
            <Polygon
              path={drawPts}
              options={{ fillColor: '#10b981', fillOpacity: 0.3, strokeColor: '#059669', strokeWeight: 2, zIndex: 1 }}
            />
          )}
        </GoogleMap>

        {(drawPts.length > 0 || area > 0) && (
          <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
            <div className={`bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl border flex flex-col gap-2 min-w-[140px] ${
              errorMessage ? 'border-red-200' : 'border-emerald-100'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Điểm đã vẽ</span>
                <span className={`text-sm font-black ${errorMessage ? 'text-red-500' : 'text-emerald-600'}`}>{drawPts.length}</span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Diện tích ước tính</span>
                <span className={`text-lg font-black ${errorMessage ? 'text-red-500' : 'text-emerald-600'}`}>
                  {area.toFixed(4)} <span className="text-xs font-bold uppercase">ha</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})