import { useState, useEffect, useCallback, RefObject } from 'react';

/**
 * useFullscreen — Quản lý Fullscreen API cho một element bất kỳ.
 *
 * Sử dụng:
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const { isFullscreen, toggle } = useFullscreen(containerRef);
 */
export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Lắng nghe thay đổi fullscreen (kể cả khi user nhấn ESC)
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange); // Safari
    document.addEventListener('mozfullscreenchange', handleChange);    // Firefox cũ
    document.addEventListener('msfullscreenchange', handleChange);     // IE/Edge cũ

    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
      document.removeEventListener('mozfullscreenchange', handleChange);
      document.removeEventListener('msfullscreenchange', handleChange);
    };
  }, []);

  const enter = useCallback(async () => {
    const el = ref.current;
    if (!el) return;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        // Safari
        await (el as any).webkitRequestFullscreen();
      } else if ((el as any).mozRequestFullScreen) {
        // Firefox cũ
        await (el as any).mozRequestFullScreen();
      } else if ((el as any).msRequestFullscreen) {
        // IE/Edge cũ
        await (el as any).msRequestFullscreen();
      }
    } catch (err) {
      console.warn('[useFullscreen] requestFullscreen thất bại:', err);
    }
  }, [ref]);

  const exit = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (err) {
      console.warn('[useFullscreen] exitFullscreen thất bại:', err);
    }
  }, []);

  const toggle = useCallback(() => {
    if (isFullscreen) {
      exit();
    } else {
      enter();
    }
  }, [isFullscreen, enter, exit]);

  return { isFullscreen, enter, exit, toggle };
}
