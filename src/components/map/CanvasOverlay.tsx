import { useEffect, useRef, useCallback } from 'react';
import { GeoPoint } from '@/types/plot';
import { FarmMapHandle } from './FarmMap';

interface CanvasOverlayProps {
  /** Chỉ render animation khi đang trong chế độ vẽ */
  isActive: boolean;
  /** Các điểm đã đặt trên bản đồ */
  currentPath: GeoPoint[];
  /** Ref tới google.maps.Map để convert lat/lng → pixel */
  mapInstance: google.maps.Map | null;
  /** Có đang overlap không (để đổi màu) */
  isOverlapping?: boolean;
  /** Ref tới FarmMap để lấy hoverPoint trực tiếp (tránh React state trigger re-render) */
  farmMapRef?: React.RefObject<FarmMapHandle>;
}

/**
 * CanvasOverlay — Canvas API overlay đặt đè lên Google Maps.
 *
 * Chức năng:
 * - Vẽ crosshair cursor tại vị trí chuột
 * - Hiển thị tọa độ lat/lng dạng text
 * - Dashed-line animation từ điểm cuối → cursor (requestAnimationFrame)
 * - Circles tại mỗi điểm đã đặt
 * - pointer-events: none để không chặn click Google Maps
 */
export function CanvasOverlay({
  isActive,
  currentPath,
  mapInstance,
  isOverlapping = false,
  farmMapRef,
}: CanvasOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const dashOffsetRef = useRef(0);

  // Convert lat/lng → pixel coords trên canvas
  const latLngToPixel = useCallback(
    (point: GeoPoint): { x: number; y: number } | null => {
      if (!mapInstance || !window.google) return null;
      try {
        const projection = mapInstance.getProjection();
        if (!projection) return null;

        const latLng = new window.google.maps.LatLng(point.lat, point.lng);
        const worldPoint = projection.fromLatLngToPoint(latLng);
        if (!worldPoint) return null;

        const zoom = mapInstance.getZoom() ?? 16;
        const scale = Math.pow(2, zoom);

        const mapDiv = mapInstance.getDiv();
        const mapBounds = mapDiv.getBoundingClientRect();

        const centerLatLng = mapInstance.getCenter();
        if (!centerLatLng) return null;
        const centerWorld = projection.fromLatLngToPoint(centerLatLng);
        if (!centerWorld) return null;

        const x = (worldPoint.x - centerWorld.x) * scale + mapBounds.width / 2;
        const y = (worldPoint.y - centerWorld.y) * scale + mapBounds.height / 2;

        return { x, y };
      } catch {
        return null;
      }
    },
    [mapInstance]
  );

  // Màu sắc theo trạng thái overlap
  const primaryColor = isOverlapping ? '#ef4444' : '#10b981';
  const strokeColor = isOverlapping ? '#dc2626' : '#059669';
  const previewColor = isOverlapping ? '#ef4444' : '#3b82f6';

  // Animation loop chính
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas theo container
    const parent = canvas.parentElement;
    if (parent) {
      const { width, height } = parent.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    }

    // Xóa frame trước
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isActive) return;

    const hoverPoint = farmMapRef?.current?.getHoverPoint() || null;

    // Animate dash offset
    dashOffsetRef.current = (dashOffsetRef.current + 0.8) % 20;

    // ── 1. Vẽ các điểm đã đặt ──
    currentPath.forEach((pt, i) => {
      const pixel = latLngToPixel(pt);
      if (!pixel) return;

      ctx.beginPath();
      ctx.arc(pixel.x, pixel.y, i === 0 ? 8 : 5, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? primaryColor : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label điểm đầu
      if (i === 0) {
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('A', pixel.x, pixel.y);
      }
    });

    // ── 2. Đường đã vẽ giữa các điểm ──
    if (currentPath.length >= 2) {
      ctx.beginPath();
      const pixels = currentPath.map(latLngToPixel).filter(Boolean) as { x: number; y: number }[];
      if (pixels.length >= 2) {
        ctx.moveTo(pixels[0].x, pixels[0].y);
        pixels.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        ctx.stroke();

        // ── Thêm: Fill polygon preview ──
        if (hoverPoint) {
          const toPixel = latLngToPixel(hoverPoint);
          if (toPixel) {
            ctx.lineTo(toPixel.x, toPixel.y);
            ctx.fillStyle = isOverlapping ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';
            ctx.fill();
          }
        }
      }
    }

    // ── 3. Dashed line animation từ điểm cuối → hover ──
    if (hoverPoint && currentPath.length >= 1) {
      const lastPt = currentPath[currentPath.length - 1];
      const fromPixel = latLngToPixel(lastPt);
      const toPixel = latLngToPixel(hoverPoint);

      if (fromPixel && toPixel) {
        ctx.beginPath();
        ctx.moveTo(fromPixel.x, fromPixel.y);
        ctx.lineTo(toPixel.x, toPixel.y);
        ctx.strokeStyle = previewColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -dashOffsetRef.current;
        ctx.globalAlpha = 0.85;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // Đường đóng (hover → điểm đầu) nếu đủ >= 3 điểm
      if (currentPath.length >= 3) {
        const firstPt = currentPath[0];
        const firstPixel = latLngToPixel(firstPt);
        if (firstPixel && toPixel) {
          ctx.beginPath();
          ctx.moveTo(toPixel.x, toPixel.y);
          ctx.lineTo(firstPixel.x, firstPixel.y);
          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 8]);
          ctx.lineDashOffset = -dashOffsetRef.current * 0.5;
          ctx.globalAlpha = 0.4;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }
      }
    }

    // ── 4. Crosshair + tọa độ tại hover point ──
    if (hoverPoint) {
      const pixel = latLngToPixel(hoverPoint);
      if (pixel) {
        const { x, y } = pixel;

        // Crosshair
        ctx.strokeStyle = isOverlapping ? '#ef4444cc' : '#10b981cc';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        // Đường ngang
        ctx.beginPath();
        ctx.moveTo(x - 18, y);
        ctx.lineTo(x - 6, y);
        ctx.moveTo(x + 6, y);
        ctx.lineTo(x + 18, y);
        ctx.stroke();

        // Đường dọc
        ctx.beginPath();
        ctx.moveTo(x, y - 18);
        ctx.lineTo(x, y - 6);
        ctx.moveTo(x, y + 6);
        ctx.lineTo(x, y + 18);
        ctx.stroke();
        ctx.setLineDash([]);

        // Vòng tròn trung tâm nhỏ
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = isOverlapping ? '#ef4444' : '#10b981';
        ctx.fill();

        // ── 5. Box tọa độ lat/lng ──
        const lat = hoverPoint.lat.toFixed(6);
        const lng = hoverPoint.lng.toFixed(6);
        const coordText = `${lat}, ${lng}`;

        ctx.font = '11px "JetBrains Mono", "Fira Code", monospace';
        const textWidth = ctx.measureText(coordText).width;
        const boxW = textWidth + 16;
        const boxH = 22;

        // Vị trí box — tránh ra ngoài canvas
        let bx = x + 14;
        let by = y - 28;
        if (bx + boxW > canvas.width - 8) bx = x - boxW - 14;
        if (by < 8) by = y + 14;

        // Background box
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(bx, by, boxW, boxH, 5);
        ctx.fill();

        // Border
        ctx.strokeStyle = isOverlapping ? '#ef4444' : '#10b981';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Text
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(coordText, bx + 8, by + boxH / 2);

        // Điểm đếm nếu đã có path
        if (currentPath.length > 0) {
          const countText = `${currentPath.length} điểm`;
          ctx.font = 'bold 10px Inter, sans-serif';
          ctx.fillStyle = primaryColor;
          ctx.textAlign = 'left';
          ctx.fillText(countText, bx, by - 12);
        }
      }
    }
  }, [isActive, currentPath, latLngToPixel, isOverlapping, primaryColor, strokeColor, previewColor, farmMapRef]);

  // RAF loop
  useEffect(() => {
    const loop = () => {
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };

    if (isActive) {
      rafRef.current = requestAnimationFrame(loop);
    } else {
      // Xóa canvas khi không active
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isActive, draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',  // Không chặn click/drag của Google Maps
        zIndex: isActive ? 5 : -1,
        display: isActive ? 'block' : 'none', // Ẩn hoàn toàn khi không vẽ
      }}
      aria-hidden="true"
    />
  );
}
