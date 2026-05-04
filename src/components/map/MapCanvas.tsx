import { ReactNode, useRef } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useFullscreen } from '@/hooks/map/useFullscreen';
import { CanvasOverlay } from './CanvasOverlay';
import { GeoPoint } from '@/types/plot';
import { FarmMapHandle } from './FarmMap';

interface Props {
  children: ReactNode;
  /** Trạng thái đang vẽ ranh giới — dùng cho Canvas Overlay */
  isDrawing?: boolean;
  /** Các điểm đã đặt */
  currentPath?: GeoPoint[];
  /** Google Maps instance để convert lat/lng → pixel */
  mapInstance?: google.maps.Map | null;
  /** Có chồng chéo không */
  isOverlapping?: boolean;
  /** Ref tới FarmMap để CanvasOverlay tự lấy hoverPoint không qua React state */
  farmMapRef?: React.RefObject<FarmMapHandle>;
}

export function MapCanvas({
  children,
  isDrawing = false,
  currentPath = [],
  mapInstance = null,
  isOverlapping = false,
  farmMapRef,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggle } = useFullscreen(containerRef);

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full rounded-2xl border border-gray-100 overflow-hidden relative shadow-inner m-4 mt-2 bg-gray-900"
      style={isFullscreen ? { margin: 0, borderRadius: 0, border: 'none' } : undefined}
    >
      {children}

      {/* ── Canvas API Overlay — vẽ animation khi đang vẽ ranh giới ── */}
      <CanvasOverlay
        isActive={isDrawing}
        currentPath={currentPath}
        mapInstance={mapInstance}
        isOverlapping={isOverlapping}
        farmMapRef={farmMapRef}
      />

      {/* ── Fullscreen API Button — góc dưới phải (trên Google attribution) ── */}
      <button
        onClick={toggle}
        title={isFullscreen ? 'Thoát toàn màn hình (ESC)' : 'Xem toàn màn hình'}
        aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Xem toàn màn hình'}
        className={`
          absolute z-30 flex items-center gap-1.5 px-3 py-2 rounded-xl
          text-xs font-semibold
          backdrop-blur-md shadow-lg border
          transition-all duration-200 active:scale-95
          ${isFullscreen
            ? 'bottom-14 right-4 bg-white/20 text-white border-white/30 hover:bg-white/30'
            : 'bottom-9 right-3 bg-white/95 text-gray-700 border-gray-200/80 hover:bg-white hover:shadow-xl'
          }
        `}
        style={{ pointerEvents: 'all' }}
      >
        {isFullscreen ? (
          <>
            <Minimize2 size={14} />
            <span className="hidden sm:inline">Thu nhỏ</span>
          </>
        ) : (
          <>
            <Maximize2 size={14} />
            <span className="hidden sm:inline">Toàn màn hình</span>
          </>
        )}
      </button>

      {/* ── Fullscreen indicator badge ── */}
      {isFullscreen && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Toàn màn hình · ESC để thoát
        </div>
      )}
    </div>
  );
}
