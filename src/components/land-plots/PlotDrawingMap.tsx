import { useCallback, useRef, useState, useMemo, useEffect, forwardRef, useImperativeHandle, Fragment } from 'react'
import { Maximize2, Minimize2, Trash2, Search, X } from 'lucide-react'
import { GoogleMap, Polygon, Polyline, Marker } from '@react-google-maps/api'
import { Geometry, GeoPoint, Plot } from '@/types/plot'
import { useGoogleMaps } from '@/providers/GoogleMapsProvider'
import { cn } from '@/utils/cn'
import { 
  isSelfIntersecting, 
  getPlotPath, 
  pointInPolygon, 
  segmentsIntersect,
  getColorFromId,
  calculateCentroid
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
  disableDefaultUI: true,
  zoomControl: false,
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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const [drawPts, setDrawPts] = useState<GeoPoint[]>([])
  const hoverPolylineRef = useRef<google.maps.Polyline | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [overlappingPlotName, setOverlappingPlotName] = useState<string | null>(null)
  const [isSelfIntersect, setIsSelfIntersect] = useState(false)
  const [area, setArea] = useState(0)

  const mapRef = useRef<google.maps.Map | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const isSelectingRef = useRef(false)

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&limit=5&accept-language=vi&email=kltn.vietnam.student@gmail.com`
        )
        const data = await response.json()
        setSuggestions(data)
        setShowDropdown(true)
      } catch (error) {
        console.error('OSM Nominatim error:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300);

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleClear = useCallback(() => {
    setDrawPts([])
    if (hoverPolylineRef.current) {
      hoverPolylineRef.current.setPath([])
    }
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
    if (hoverPolylineRef.current) {
      hoverPolylineRef.current.setPath([])
    }
    setOverlappingPlotName(null)
  }, [drawPts, area, onGeometryChange])

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!isDrawing || !e.latLng) return
    const pt = { lat: e.latLng.lat(), lng: e.latLng.lng() }
    const currentOverlap = drawPts.length > 0 ? checkOverlap(drawPts[drawPts.length - 1], pt) : null
    const currentSelf = drawPts.length > 0 ? isSelfIntersecting([...drawPts, pt]) : false
    const hasError = !!currentOverlap || currentSelf

    if (hasError) {
      // Just ignore the click, do not delete the last point!
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
    if (!isDrawing || !e.latLng || drawPts.length === 0) return
    const pt = e.latLng
    const simplePt = { lat: pt.lat(), lng: pt.lng() }

    if (hoverPolylineRef.current) {
      hoverPolylineRef.current.setPath([
        new google.maps.LatLng(drawPts[drawPts.length - 1].lat, drawPts[drawPts.length - 1].lng),
        pt
      ])

      const currentOverlap = checkOverlap(drawPts[drawPts.length - 1], simplePt)
      const currentSelf = isSelfIntersecting([...drawPts, simplePt])
      const hasError = !!currentOverlap || currentSelf

      hoverPolylineRef.current.setOptions({
        strokeColor: hasError ? '#ef4444' : '#10b981'
      })

      if (hasError) {
        if (!overlappingPlotName && currentOverlap) setOverlappingPlotName(currentOverlap)
        if (!isSelfIntersect && currentSelf) setIsSelfIntersect(true)
      } else {
        if (overlappingPlotName) setOverlappingPlotName(null)
        if (isSelfIntersect) setIsSelfIntersect(false)
      }
    }
  }, [isDrawing, drawPts, checkOverlap, overlappingPlotName, isSelfIntersect])

  const handleMapRightClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!isDrawing) return
    setDrawPts(prev => {
      if (prev.length === 0) return prev
      const newPts = prev.slice(0, -1)
      if (hoverPolylineRef.current) {
        if (newPts.length > 0 && e.latLng) {
          hoverPolylineRef.current.setPath([
            new google.maps.LatLng(newPts[newPts.length - 1].lat, newPts[newPts.length - 1].lng),
            e.latLng
          ])
        } else {
          hoverPolylineRef.current.setPath([])
        }
      }
      return newPts
    })
  }, [isDrawing])

  useEffect(() => {
    if (!isDrawing && hoverPolylineRef.current) {
      hoverPolylineRef.current.setPath([])
    }
  }, [isDrawing])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDrawing) return
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        setDrawPts(prev => {
          if (prev.length === 0) return prev
          const newPts = prev.slice(0, -1)
          if (hoverPolylineRef.current) {
            if (newPts.length > 0) {
              const path = hoverPolylineRef.current.getPath()
              const currentHoverLatLng = path.getLength() > 1 ? path.getAt(1) : null
              if (currentHoverLatLng) {
                hoverPolylineRef.current.setPath([
                  new google.maps.LatLng(newPts[newPts.length - 1].lat, newPts[newPts.length - 1].lng),
                  currentHoverLatLng
                ])
              } else {
                hoverPolylineRef.current.setPath([])
              }
            } else {
              hoverPolylineRef.current.setPath([])
            }
          }
          return newPts
        })
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleClear()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDrawing, handleClear])

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

      <div
        ref={containerRef}
        className={cn(
          "rounded-xl overflow-hidden border border-gray-200 shadow-sm relative group transition-all duration-300",
          isFullscreen ? "fixed inset-0 z-[200] rounded-none m-0 border-none" : ""
        )}
        style={{ 
          height: isFullscreen ? '100vh' : mapHeight, 
          minHeight: 0,
          flex: (!isFullscreen && mapHeight === '100%') ? 1 : undefined
        }}
      >
        {/* Toolbar nổi bên trái — Vẽ ranh giới */}
        <div className="absolute top-2 left-2 z-30 flex items-center gap-1.5">
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
            className={cn(
              "px-3 py-1.5 rounded-lg border transition-all font-bold text-[10px] uppercase tracking-wider shadow-md backdrop-blur-md active:scale-95",
              isDrawing 
                ? "bg-amber-500 border-amber-400 text-white" 
                : "bg-white border-gray-100 text-gray-700"
            )}
          >
            {isDrawing ? "Kết thúc vẽ" : "Vẽ ranh giới"}
          </button>

          {drawPts.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-white border border-gray-100 text-gray-400 shadow-md backdrop-blur-md transition-all active:scale-95"
              title="Xóa bản vẽ"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* Nút Toàn màn hình bên phải */}
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="absolute top-2 right-2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-gray-700 shadow-md border border-gray-100 backdrop-blur-sm transition-all active:scale-95"
        >
          {isFullscreen ? (
            <>
              <Minimize2 size={13} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Thu nhỏ</span>
            </>
          ) : (
            <>
              <Maximize2 size={13} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Toàn màn hình</span>
            </>
          )}
        </button>

        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={16}
          onLoad={m => { mapRef.current = m }}
          options={MAP_OPTIONS}
          onClick={handleMapClick}
          onMouseMove={handleMouseMove}
          onRightClick={handleMapRightClick}
        >
          {/* Search Input Box (Only visible when isFullscreen is true) */}
          {isFullscreen && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 w-[160px] sm:w-[240px] md:w-[280px]">
              <div className="relative shadow-md rounded-lg border border-gray-200 bg-white/95 backdrop-blur-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm địa chỉ..."
                  className="w-full h-8 pl-8 pr-8 text-[10px] sm:text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all rounded-lg"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      if (suggestions.length > 0) {
                        const firstItem = suggestions[0]
                        const lat = parseFloat(firstItem.lat)
                        const lng = parseFloat(firstItem.lon)
                        const coords = { lat, lng }
                        if (mapRef.current) {
                          mapRef.current.setCenter(coords)
                          mapRef.current.setZoom(17)
                        }
                        setSearchQuery(firstItem.display_name)
                        setShowDropdown(false)
                      }
                    }
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowDropdown(true)
                    else if (searchQuery.trim()) setSearchQuery(s => s)
                  }}
                  onBlur={() => {
                    if (!isSelectingRef.current) setShowDropdown(false)
                  }}
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {/* Clear Button / Loading Spinner */}
                {isSearching ? (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-emerald-500 border-t-transparent"></div>
                  </div>
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("")
                      setSuggestions([])
                      setShowDropdown(false)
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={12} />
                  </button>
                ) : null}

                {/* Suggestions Dropdown */}
                {showDropdown && suggestions.length > 0 && (
                  <div 
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-40 overflow-y-auto z-50 py-1 divide-y divide-gray-50"
                    onMouseDown={() => { isSelectingRef.current = true }}
                    onMouseUp={() => { isSelectingRef.current = false }}
                  >
                    {suggestions.map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          const lat = parseFloat(item.lat)
                          const lng = parseFloat(item.lon)
                          const coords = { lat, lng }
                          if (mapRef.current) {
                            mapRef.current.setCenter(coords)
                            mapRef.current.setZoom(17)
                          }
                          setSearchQuery(item.display_name)
                          setShowDropdown(false)
                          isSelectingRef.current = false
                        }}
                        className="w-full text-left px-3 py-1.5 text-[9px] sm:text-[10px] text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors truncate font-medium"
                        title={item.display_name}
                      >
                        {item.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Nhãn thông tin dạng Card trắng tại tâm vùng đang vẽ */}
          {drawPts.length >= 3 && (
            <Marker
              position={calculateCentroid(drawPts)}
              clickable={false}
              icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 0 }}
              label={{
                text: `${area.toFixed(4)} ha / ${drawPts.length} điểm`,
                color: '#10b981',
                fontSize: '11px',
                fontWeight: '900',
                className: 'bg-white px-3 py-2 rounded-xl shadow-2xl border border-emerald-50 text-center min-w-[120px]'
              }}
            />
          )}

          {existingPlots.map(plot => {
            const path = getPlotPath(plot)
            if (path.length < 3) return null
            const color = getColorFromId(plot.id)
            const centroid = calculateCentroid(path)
            
            return (
              <Fragment key={plot.id}>
                <Polygon
                  path={path}
                  options={{
                    fillColor: color, 
                    fillOpacity: 0.2,
                    strokeColor: color, 
                    strokeWeight: 2,
                    clickable: false, 
                    zIndex: 0
                  }}
                />
                <Marker
                  position={centroid}
                  clickable={false}
                  icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 0 }}
                  label={{
                    text: plot.name || 'Lô đất',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '900',
                    className: 'plot-label-shadow'
                  }}
                />
              </Fragment>
            )
          })}

          {drawPts.length > 0 && (
            <>
              <Polyline
                path={drawPts}
                options={{ strokeColor: '#10b981', strokeWeight: 2, zIndex: 2, clickable: false }}
              />
              {isDrawing && (
                <Polyline
                  onLoad={polyline => {
                    hoverPolylineRef.current = polyline
                  }}
                  onUnmount={() => {
                    hoverPolylineRef.current = null
                  }}
                  path={[]}
                  options={{
                    strokeColor: '#10b981',
                    strokeWeight: 2,
                    strokeOpacity: 0.5,
                    zIndex: 2,
                    clickable: false
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

        {isDrawing && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {drawPts.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDrawPts(prev => {
                      if (prev.length === 0) return prev
                      const newPts = prev.slice(0, -1)
                      if (hoverPolylineRef.current) {
                        hoverPolylineRef.current.setPath([])
                      }
                      return newPts
                    })
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 border border-gray-200/50"
                  title="Hoàn tác điểm vừa vẽ (Chuột phải hoặc Backspace)"
                >
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Hoàn tác điểm
                </button>
                <div className="w-px h-4 bg-gray-200" />
              </>
            )}
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 border border-red-100"
              title="Xóa toàn bộ bản vẽ hiện tại (Esc)"
            >
              <Trash2 size={13} />
              Xóa bản vẽ
            </button>
          </div>
        )}
      </div>
    </div>
  )
})