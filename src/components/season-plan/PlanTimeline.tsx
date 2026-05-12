import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import { SeasonPlan, Phase, Task } from '@/types/seasonPlan';
import { ChevronDown, Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  addDays,
} from '@/utils/seasonPlanUtils';
import { SelectionState } from '@/pages/SeasonPlan/SeasonPlanPage';
import { getStatusColor, statusLabel } from './detail/DetailCommon';
import { DateInput } from '../ui/DateInput';

// ─── Types ────────────────────────────────────────────────────────────────────

type DragTarget =
  | { kind: 'phase'; planId: string; phaseId: string }
  | { kind: 'task'; planId: string; phaseId: string; taskId: string };

type DragMode = 'MOVE' | 'RESIZE_LEFT' | 'RESIZE_RIGHT';

interface BarDragState {
  mode: DragMode;
  target: DragTarget;
  startX: number;
  origStart: string;
  origEnd: string;
}

type TimeScale = 'weeks' | 'months' | 'quarters';

interface PlanTimelineProps {
  plans: SeasonPlan[];
  selectedId?: string;
  onSelect: (selection: SelectionState) => void;
  onUpdatePhaseTime?: (planId: string, phaseId: string, data: { startDate: string; endDate: string }) => Promise<void> | void;
  onUpdateTaskTime?: (planId: string, phaseId: string, taskId: string, data: { startDate: string; endDate: string }) => Promise<void> | void;
  onDeletePlan?: (planId: string) => void;
  onAddPhase: (planId: string, data: { name: string; startDate: string; endDate: string }) => Promise<void> | void;
  onExpandPhase?: (planId: string, phaseId: string) => void;
  preExpandedPlanId?: string;
  canEdit?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string { // hàm dùng để chuyển object Date sang string định dạng YYYY-MM-DD
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDaysToStr(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return toDateStr(d); // hàm Cộng thêm một số ngày vào chuỗi ngày tháng và trả về chuỗi mới.
}

function diffDays(a: string | Date, b: string | Date): number { // Tính toán số ngày chênh lệch giữa hai mốc thời gian.
  const da = typeof a === 'string' ? new Date(a) : a;
  const db = typeof b === 'string' ? new Date(b) : b;
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

function getMonday(d: Date): Date { // Tính toán ngày thứ Hai gần nhất trước hoặc bằng ngày hiện tại.
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const result = new Date(d);
  result.setDate(d.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}


interface TimelineRowInteractionProps {
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string | null;
  actualEnd?: string | null;
  barLeft: number;
  barWidth: number;
  ppd: number;
  rowHeight: number;
  markerColor: string;
  onBarMouseDown?: (e: React.MouseEvent) => void;
  onBarClick?: (e: React.MouseEvent) => void;
  onResizeLeft?: (e: React.MouseEvent) => void;
  onResizeRight?: (e: React.MouseEvent) => void;
  canEdit?: boolean;
}

function TimelineRowInteraction({
  plannedStart, plannedEnd, actualStart, actualEnd,
  barLeft, barWidth, ppd,
  rowHeight, markerColor,
  onBarMouseDown, onBarClick,
  onResizeLeft, onResizeRight,
  canEdit
}: TimelineRowInteractionProps) {
  const [hoveredPin, setHoveredPin] = React.useState<string | null>(null);
  const [isOverBar, setIsOverBar] = React.useState(false);
  const [hoveredBarSection, setHoveredBarSection] = React.useState<'planned' | 'actual' | null>(null);
  const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 });


  // 2. Define Pins (Actual vs Planned)
  const pins = React.useMemo(() => {
    const p: { kind: string; pxInBar: number; label: string; dateLabel: string; isActual: boolean; color?: string }[] = [];
    const fmt = (d: string) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const toPxLocal = (d: string) => diffDays(plannedStart, d) * ppd;

    const colorStart = '#c7b8a8ff'; // Orange - thực tế bắt đầu
    const colorEnd = '#999085ff';   // Red - thực tế kết thúc

    p.push({ kind: 'p-start', pxInBar: 0, label: '○ Kế hoạch bắt đầu', dateLabel: fmt(plannedStart), isActual: false });
    p.push({ kind: 'p-end', pxInBar: barWidth, label: '□ Kế hoạch kết thúc', dateLabel: fmt(plannedEnd), isActual: false });

    if (actualStart) p.push({ kind: 'a-start', pxInBar: toPxLocal(actualStart), label: '▶ Thực tế bắt đầu', dateLabel: fmt(actualStart), isActual: true, color: colorStart });
    if (actualEnd) p.push({ kind: 'a-end', pxInBar: toPxLocal(actualEnd), label: '⏹ Thực tế kết thúc', dateLabel: fmt(actualEnd), isActual: true, color: colorEnd });

    return p;
  }, [plannedStart, plannedEnd, actualStart, actualEnd, barWidth, ppd, markerColor]);

  // 3. Actual Bar (Full range from actual start to actual end)
  const actualBar = React.useMemo(() => {
    if (!actualStart && !actualEnd) return null;
    const toPxLocal = (d: string) => diffDays(plannedStart, d) * ppd;

    // If only start is available, go from actualStart to plannedEnd
    // If only end is available, go from plannedStart to actualEnd
    const sX = actualStart ? toPxLocal(actualStart) : 0;
    const eX = actualEnd ? toPxLocal(actualEnd) : barWidth;

    return { left: barLeft + sX, width: eX - sX };
  }, [plannedStart, actualStart, actualEnd, barLeft, barWidth, ppd]);

  const markerTop = (rowHeight - rowHeight * 0.7) / 2;
  const markerH = rowHeight * 0.7;

  return (
    <>
      {/* ── ACTUAL BAR VISUAL ── */}
      {actualBar && (
        <div className="absolute pointer-events-none opacity-45"
          style={{
            left: actualBar.left, width: Math.max(2, actualBar.width),
            top: (rowHeight - rowHeight * 0.5) / 2, height: rowHeight * 0.5,
            background: `linear-gradient(to right, color-mix(in srgb, ${markerColor}, black 10%), color-mix(in srgb, ${markerColor}, black 30%))`,
            borderRadius: 4, zIndex: 10,
            border: `1.5px solid color-mix(in srgb, ${markerColor}, black 20%)`,
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }} />
      )}

      {/* ── BAR HIT AREAS (Contextual segments) ── */}
      {(() => {
        const toPxLocal = (d: string) => diffDays(plannedStart, d) * ppd;
        return (
          <>
            {/* 1. Actual Prefix (Before Planned) */}
            {actualStart && toPxLocal(actualStart) < 0 && (
              <div
                className="absolute cursor-help"
                style={{
                  left: barLeft + toPxLocal(actualStart),
                  width: -toPxLocal(actualStart),
                  top: 0,
                  height: rowHeight,
                  zIndex: 50,
                  pointerEvents: 'auto',
                  background: 'transparent'
                }}
                onMouseEnter={() => { setIsOverBar(true); setHoveredBarSection('actual'); }}
                onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                onMouseLeave={() => { setIsOverBar(false); setHoveredBarSection(null); }}
              />
            )}

            {/* 2. Main Planned Range */}
            <div
              className="absolute cursor-help"
              style={{
                left: barLeft,
                width: barWidth,
                top: 0,
                height: rowHeight,
                zIndex: 51,
                pointerEvents: 'auto',
                background: 'transparent'
              }}
              onMouseEnter={() => { setIsOverBar(true); setHoveredBarSection('planned'); }}
              onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => { setIsOverBar(false); setHoveredBarSection(null); }}
              onMouseDown={onBarMouseDown}
              onClick={onBarClick}
            />

            {/* 3. Actual Suffix (After Planned) */}
            {actualEnd && toPxLocal(actualEnd) > barWidth && (
              <div
                className="absolute cursor-help"
                style={{
                  left: barLeft + barWidth,
                  width: toPxLocal(actualEnd) - barWidth,
                  top: 0,
                  height: rowHeight,
                  zIndex: 50,
                  pointerEvents: 'auto',
                  background: 'transparent'
                }}
                onMouseEnter={() => { setIsOverBar(true); setHoveredBarSection('actual'); }}
                onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                onMouseLeave={() => { setIsOverBar(false); setHoveredBarSection(null); }}
              />
            )}
          </>
        );
      })()}

      {/* ── PIN HIT AREAS & VISUALS ── */}
      {pins.map(pin => {
        const pinLeft = barLeft + pin.pxInBar;
        const isHovered = hoveredPin === pin.kind;
        const color = pin.isActual ? pin.color! : '#94a3b8';

        return (
          <React.Fragment key={pin.kind}>
            {/* Invisible wide hit area for the pin */}
            <div
               className="absolute cursor-help"
               style={{
                left: pinLeft - 15,
                width: 30,
                 top: 0,
                 height: rowHeight,
                 zIndex: 100,
                 pointerEvents: 'auto',
                 background: 'rgba(16, 178, 78, 0)'
               }}
               onMouseEnter={() => setHoveredPin(pin.kind)}
               onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
               onMouseLeave={() => setHoveredPin(null)}
             />

            {/* Visual: Vertical Line */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: pinLeft - 1,
                top: markerTop,
                width: 2,
                height: markerH,
                backgroundColor: color,
                opacity: isHovered ? 1 : (pin.isActual ? 1 : 0.4),
                boxShadow: pin.isActual ? '0 0 4px rgba(0,0,0,0.2)' : 'none',
                borderRadius: 1,
                transition: 'opacity .15s',
                zIndex: 60
              }}
            />

            {/* Visual: Diamond Cap */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: pinLeft - 4,
                top: markerTop - 4,
                width: 8,
                height: 8,
                backgroundColor: color,
                opacity: isHovered ? 1 : (pin.isActual ? 1 : 0.6),
                boxShadow: pin.isActual ? '0 0 4px rgba(0,0,0,0.2)' : 'none',
                border: pin.isActual ? '1px solid white' : 'none',
                transform: 'rotate(45deg)',
                borderRadius: 1,
                transition: 'opacity .15s',
                zIndex: 70
              }}
            />
          </React.Fragment>
        );
      })}

      {/* ── RESIZE HANDLES (Draggable) ── */}
      {canEdit && (
        <>
          <div className="absolute pointer-events-auto cursor-w-resize z-[110]"
            style={{ left: barLeft - 15, width: 30, top: 0, height: rowHeight }}
            onMouseEnter={() => setHoveredPin('p-start')}
            onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => setHoveredPin(null)}
            onMouseDown={onResizeLeft} />
          <div className="absolute pointer-events-auto cursor-e-resize z-[110]"
            style={{ left: barLeft + barWidth - 15, width: 30, top: 0, height: rowHeight }}
            onMouseEnter={() => setHoveredPin('p-end')}
            onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => setHoveredPin(null)}
            onMouseDown={onResizeRight} />
        </>
      )}

      {/* ── PORTALED TOOLTIPS ── */}
      {(hoveredPin || (isOverBar && !hoveredPin)) && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 12 }}
        >
          <div className="bg-slate-900/95 text-white px-3 py-2 rounded-lg shadow-2xl border border-white/10 backdrop-blur-sm min-w-[180px]">
            {hoveredPin ? (
              // PIN TOOLTIP
              <div className="flex flex-col">
                {(() => {
                  const p = pins.find(x => x.kind === hoveredPin);
                  if (!p) return null;
                  return (
                    <>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">
                        {p.label}
                      </span>
                      <span className="text-sm font-mono mt-0.5 text-white">{p.dateLabel}</span>
                    </>
                  );
                })()}
              </div>
            ) : hoveredBarSection === 'actual' ? (
              // FULL TOOLTIP (In the actual-only segments outside plan)
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5 mb-1">
                  <span className="text-indigo-400 text-[10px] uppercase tracking-widest font-bold w-20 whitespace-nowrap">Kế hoạch</span>
                  <span className="text-xs font-mono text-white/90">{new Date(plannedStart).toLocaleDateString('vi-VN')} → {new Date(plannedEnd).toLocaleDateString('vi-VN')}</span>
                </div>
                {(actualStart || actualEnd) && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-400 text-[10px] uppercase tracking-widest font-bold w-20 whitespace-nowrap">Thực tế</span>
                    <span className="text-xs font-mono text-amber-100/90">
                      {actualStart ? new Date(actualStart).toLocaleDateString('vi-VN') : '...'} → {actualEnd ? new Date(actualEnd).toLocaleDateString('vi-VN') : '...'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              // PLANNED-ONLY TOOLTIP (Inside the planned start/end range)
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-indigo-400 text-[10px] uppercase tracking-widest font-bold w-20 whitespace-nowrap">Kế hoạch</span>
                  <span className="text-xs font-mono text-white/90">{new Date(plannedStart).toLocaleDateString('vi-VN')} → {new Date(plannedEnd).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}




// ─── AnimatedRow ──────────────────────────────────────────────────────────────

interface AnimatedRowProps {
  visible: boolean;
  rowHeight: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

function AnimatedRow({ visible, rowHeight, children, className, style }: AnimatedRowProps) {
  return (
    <div
      className={className}
      style={{
        height: visible ? rowHeight : 0,
        opacity: visible ? 1 : 0,
        overflow: 'hidden',
        transition: visible
          ? 'height 220ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease-out 40ms'
          : 'height 200ms cubic-bezier(0.4,0,1,1), opacity 140ms ease-in',
        flexShrink: 0,
        // willChange bị xóa để tránh tạo stacking context mới,
        // nếu không z-index của các marker sẽ bị giới hạn trong context này.
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const PlanTimeline = React.forwardRef<{ scrollToDate: (dateStr: string) => void }, PlanTimelineProps>(function PlanTimeline({
  plans,
  selectedId,
  onSelect,
  onUpdatePhaseTime,
  onUpdateTaskTime,
  onDeletePlan,
  onAddPhase,
  onExpandPhase,
  preExpandedPlanId,
  canEdit = false,
}, ref) {

  // ── Sidebar resize ────────────────────────────────────────────────────────
  const SIDEBAR_MIN = 200;
  const SIDEBAR_MAX = 520;
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const sidebarResizing = useRef(false);
  const sidebarStartX = useRef(0);
  const sidebarStartW = useRef(300);

  const startSidebarResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    sidebarResizing.current = true;
    sidebarStartX.current = e.clientX;
    sidebarStartW.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!sidebarResizing.current) return;
      const delta = e.clientX - sidebarStartX.current;
      setSidebarWidth(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, sidebarStartW.current + delta)));
    };
    const onUp = () => {
      if (!sidebarResizing.current) return;
      sidebarResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // ── Timeline state ────────────────────────────────────────────────────────
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [timeScale, setTimeScale] = useState<TimeScale>('weeks');
  const [addingPhaseToPlanId, setAddingPhaseToPlanId] = useState<string | null>(null);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseStart, setNewPhaseStart] = useState('');
  const [newPhaseEnd, setNewPhaseEnd] = useState('');
  const [isSavingNewPhase, setIsSavingNewPhase] = useState(false);

  const [barDrag, setBarDrag] = useState<BarDragState | null>(null);
  const [dragDeltaDays, setDragDeltaDays] = useState(0);
  const [dragTooltip, setDragTooltip] = useState<{ x: number; y: number; label: string } | null>(null);
  const dragDeltaRef = useRef(0);
  const finalizeBarDragRef = useRef<any>(null);

  const ganttBodyRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const scrollBarRef = useRef<HTMLDivElement>(null);
  const sidebarBodyRef = useRef<HTMLDivElement>(null);

  // ── Auto-expand: chỉ chạy 1 lần khi preExpandedPlanId xuất hiện lần đầu
  //    và plans đã load xong. Dùng ref để tránh chạy lại khi plans cập nhật.
  // ──────────────────────────────────────────────────────────────────────────
  const autoExpandDoneRef = useRef<string | null>(null);

  useEffect(() => {
    // Chỉ expand nếu chưa từng expand cho planId này
    if (!preExpandedPlanId || plans.length === 0) return;
    if (autoExpandDoneRef.current === preExpandedPlanId) return;

    const plan = plans.find(p => p.id === preExpandedPlanId);
    if (!plan) return;

    autoExpandDoneRef.current = preExpandedPlanId;
    setExpandedPlans(prev => new Set([...prev, preExpandedPlanId]));
    // Không tự expand phases — để user kiểm soát
  }, [preExpandedPlanId, plans]);

  // ── Pixels per day ───────────────────────────────────────────────────────
  const PPD = useMemo<number>(() => {
    switch (timeScale) {
      case 'weeks': return 44;
      case 'months': return 18;
      case 'quarters': return 6;
    }
  }, [timeScale]);

  // ── Timeline bounds ───────────────────────────────────────────────────────
  const { minDate, maxDate } = useMemo(() => {
    if (plans.length === 0) {
      const today = new Date();
      return {
        minDate: new Date(today.getTime() - 15 * 86_400_000),
        maxDate: new Date(today.getTime() + 75 * 86_400_000),
      };
    }
    let min = new Date(plans[0].startDate);
    let max = new Date(plans[0].endDate);
    plans.forEach(p => {
      const s = new Date(p.startDate), e = new Date(p.endDate);
      if (s < min) min = s;
      if (e > max) max = e;
    });
    return {
      minDate: new Date(min.getTime() - 60 * 86_400_000),
      maxDate: new Date(max.getTime() + 60 * 86_400_000),
    };
  }, [plans]);

  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / 86_400_000);
  const totalWidth = totalDays * PPD;

  // ── Today ─────────────────────────────────────────────────────────────────
  const todayDate = useMemo(() => {
    const t = new Date(); t.setHours(0, 0, 0, 0); return t;
  }, []);

  const todayLeft = useMemo(() => {
    if (todayDate < minDate || todayDate > maxDate) return null;
    return diffDays(minDate, todayDate) * PPD;
  }, [minDate, maxDate, PPD, todayDate]);

  // ─────────────────────────────────────────────────────────────────────────
  // HEADER DATA
  // ─────────────────────────────────────────────────────────────────────────

  interface DayCell {
    date: Date;
    dayLabel: string;
    monthShort: string;
    isFirstOfMonth: boolean;
    isWeekend: boolean;
    isToday: boolean;
    leftPx: number;
  }

  const dayCells = useMemo((): DayCell[] => {
    if (timeScale !== 'weeks') return [];
    const cells: DayCell[] = [];
    let cur = new Date(minDate); cur.setHours(0, 0, 0, 0);
    while (cur <= maxDate) {
      const dow = cur.getDay();
      cells.push({
        date: new Date(cur),
        dayLabel: String(cur.getDate()),
        monthShort: cur.toLocaleString('vi-VN', { month: 'short' }),
        isFirstOfMonth: cur.getDate() === 1,
        isWeekend: dow === 0 || dow === 6,
        isToday: cur.getTime() === todayDate.getTime(),
        leftPx: diffDays(minDate, cur) * PPD,
      });
      cur = new Date(cur.getTime() + 86_400_000);
    }
    return cells;
  }, [timeScale, minDate, maxDate, PPD, todayDate]);

  const monthSpans = useMemo(() => {
    if (timeScale !== 'weeks') return [];
    const spans: { label: string; leftPx: number; widthPx: number }[] = [];
    let curLabel = '';
    let curLeft = 0;
    let curWidth = 0;
    dayCells.forEach(cell => {
      if (cell.monthShort !== curLabel) {
        if (curLabel) spans.push({ label: curLabel, leftPx: curLeft, widthPx: curWidth });
        curLabel = cell.monthShort;
        curLeft = cell.leftPx;
        curWidth = PPD;
      } else {
        curWidth += PPD;
      }
    });
    if (curLabel) spans.push({ label: curLabel, leftPx: curLeft, widthPx: curWidth });
    return spans;
  }, [dayCells, timeScale, PPD]);

  interface ColCell { label: string; widthPx: number; isHighlight?: boolean; }

  const { topCells, subCells } = useMemo((): { topCells: ColCell[]; subCells: ColCell[] } => {
    if (timeScale === 'weeks') return { topCells: [], subCells: [] };
    const top: ColCell[] = [];
    const sub: ColCell[] = [];

    if (timeScale === 'months') {
      let cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      while (cur <= maxDate) {
        const nxt = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
        const s = cur < minDate ? minDate : cur;
        const e = nxt > maxDate ? maxDate : nxt;
        const days = Math.ceil((e.getTime() - s.getTime()) / 86_400_000);
        if (days > 0) top.push({ label: cur.toLocaleString('vi-VN', { month: 'long' }), widthPx: days * PPD });
        cur = nxt;
      }
      const currentMonday = getMonday(todayDate);
      let wcur = getMonday(minDate);
      while (wcur <= maxDate) {
        const wend = new Date(wcur.getTime() + 7 * 86_400_000);
        const s = wcur < minDate ? new Date(minDate) : new Date(wcur);
        const e = wend > maxDate ? maxDate : wend;
        const days = Math.ceil((e.getTime() - s.getTime()) / 86_400_000);
        if (days > 0) {
          sub.push({
            label: String(s.getDate()),
            widthPx: days * PPD,
            isHighlight: wcur.getTime() === currentMonday.getTime(),
          });
        }
        wcur = wend;
      }
    } else {
      const Q = [['Tháng 1', 'Tháng 3'], ['Tháng 4', 'Tháng 6'], ['Tháng 7', 'Tháng 9'], ['Tháng 10', 'Tháng 12']];
      const qStart = Math.floor(minDate.getMonth() / 3) * 3;
      let cur = new Date(minDate.getFullYear(), qStart, 1);
      while (cur <= maxDate) {
        const nxt = new Date(cur.getFullYear(), cur.getMonth() + 3, 1);
        const s = cur < minDate ? minDate : cur;
        const e = nxt > maxDate ? maxDate : nxt;
        const days = Math.ceil((e.getTime() - s.getTime()) / 86_400_000);
        if (days > 0) {
          const qi = Math.floor(cur.getMonth() / 3);
          top.push({ label: `${Q[qi][0]} - ${Q[qi][1]}`, widthPx: days * PPD });
        }
        cur = nxt;
      }
      let mcur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      while (mcur <= maxDate) {
        const nxt = new Date(mcur.getFullYear(), mcur.getMonth() + 1, 1);
        const s = mcur < minDate ? minDate : mcur;
        const e = nxt > maxDate ? maxDate : nxt;
        const days = Math.ceil((e.getTime() - s.getTime()) / 86_400_000);
        if (days > 0) sub.push({ label: mcur.toLocaleString('vi-VN', { month: 'short' }), widthPx: days * PPD });
        mcur = nxt;
      }
    }
    return { topCells: top, subCells: sub };
  }, [timeScale, minDate, maxDate, PPD, todayDate]);

  // ── Scroll sync ───────────────────────────────────────────────────────────
  const syncRefs = useCallback((sl: number) => {
    [headerRef, scrollBarRef].forEach(r => {
      if (r.current) r.current.scrollLeft = sl;
    });
  }, []);

  const onBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    syncRefs(el.scrollLeft);
    if (sidebarBodyRef.current) sidebarBodyRef.current.scrollTop = el.scrollTop;
  };

  const onBarScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const sl = (e.currentTarget as HTMLDivElement).scrollLeft;
    if (ganttBodyRef.current) ganttBodyRef.current.scrollLeft = sl;
    syncRefs(sl);
  };

  // ── Scroll to today / specific date ───────────────────────────────────────
  const scrollToToday = useCallback(() => {
    if (todayLeft === null || !ganttBodyRef.current) return;
    const cw = ganttBodyRef.current.clientWidth;
    const target = Math.max(0, todayLeft - cw * 0.35);
    ganttBodyRef.current.scrollTo({ left: target, behavior: 'smooth' });
    syncRefs(target);
  }, [todayLeft, syncRefs]);

  const scrollToDate = useCallback((dateStr: string) => {
    if (!ganttBodyRef.current || !dateStr) return;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return;
    const left = diffDays(minDate, d) * PPD;
    const cw = ganttBodyRef.current.clientWidth;
    const target = Math.max(0, left - cw * 0.2);
    ganttBodyRef.current.scrollTo({ left: target, behavior: 'smooth' });
    syncRefs(target);
  }, [minDate, PPD, syncRefs]);

  React.useImperativeHandle(ref, () => ({
    scrollToDate
  }));

  useEffect(() => { scrollToToday(); }, [timeScale]);

  // ── Toggle ────────────────────────────────────────────────────────────────
  const togglePlan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPlans(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  // FIX BUG 1 & 2: togglePhase chỉ toggle, không làm gì khác
  const togglePhase = (id: string, planId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPhases(p => {
      const n = new Set(p);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
        // Gọi callback nếu cần fetch tasks, nhưng KHÔNG reset state expand
        if (onExpandPhase) onExpandPhase(planId, id);
      }
      return n;
    });
  };

  const finalizeBarDrag = useCallback(async (drag: BarDragState, delta: number) => {
    if (delta === 0) {
      setBarDrag(null); setDragDeltaDays(0); setDragTooltip(null);
      dragDeltaRef.current = 0;
      document.body.style.cursor = '';
      return;
    }

    const { target, mode, origStart, origEnd } = drag;

    const nextDates = (() => {
      if (mode === 'MOVE') {
        return {
          startDate: addDays(origStart, delta),
          endDate: addDays(origEnd, delta),
        };
      }
      if (mode === 'RESIZE_LEFT') {
        const dur = Math.max(1, diffDays(origStart, origEnd) - delta);
        return { startDate: addDays(origEnd, -dur), endDate: origEnd };
      }
      const dur = Math.max(1, diffDays(origStart, origEnd) + delta);
      return { startDate: origStart, endDate: addDays(origStart, dur) };
    })();

    try {
      if (target.kind === 'phase') {
        await onUpdatePhaseTime?.(target.planId, target.phaseId, nextDates);
      } else {
        await onUpdateTaskTime?.(target.planId, target.phaseId, (target as any).taskId, nextDates);
      }
    } catch (err) {
      console.error('Timeline update error:', err);
    } finally {
      setBarDrag(null);
      setDragDeltaDays(0);
      setDragTooltip(null);
      dragDeltaRef.current = 0;
      document.body.style.cursor = '';
    }
  }, [onUpdatePhaseTime, onUpdateTaskTime]);

  useEffect(() => {
    finalizeBarDragRef.current = finalizeBarDrag;
  }, [finalizeBarDrag]);

  const startBarDrag = (
    e: React.MouseEvent,
    target: DragTarget,
    mode: DragMode,
    origStart: string,
    origEnd: string
  ) => {
    if (!canEdit) return;
    e.preventDefault(); e.stopPropagation();

    const dragContext: BarDragState = { mode, target, startX: e.clientX, origStart, origEnd };
    setBarDrag(dragContext);
    setDragDeltaDays(0);
    dragDeltaRef.current = 0;

    document.body.style.cursor =
      mode === 'MOVE' ? 'grabbing' :
        mode === 'RESIZE_LEFT' ? 'w-resize' : 'e-resize';

    const onMove = (ev: MouseEvent) => {
      if (ev.buttons === 0) { onUp(); return; }

      const delta = Math.round((ev.clientX - dragContext.startX) / PPD);
      setDragDeltaDays(delta);
      dragDeltaRef.current = delta;

      let s = dragContext.origStart, en = dragContext.origEnd;
      if (mode === 'MOVE') { s = addDays(s, delta); en = addDays(en, delta); }
      else if (mode === 'RESIZE_LEFT') { s = addDays(s, delta); }
      else { en = addDays(en, delta); }

      const toDMY = (d: string) => {
        const [y, m, day] = d.split('-');
        return `${day}/${m}/${y}`;
      };

      setDragTooltip({
        x: ev.clientX,
        y: ev.clientY - 44,
        label: `${toDMY(s)} → ${toDMY(en)}`
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('blur', onUp);
      window.removeEventListener('mouseleave', onUp as EventListener);

      if (finalizeBarDragRef.current) {
        finalizeBarDragRef.current(dragContext, dragDeltaRef.current);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('blur', onUp);
    window.addEventListener('mouseleave', onUp as EventListener);
  };

  // ── Bar preview style ─────────────────────────────────────────────────────
  const minDateTime = useMemo(() => minDate.getTime(), [minDate]);

  const getLeft = useCallback((d: string) => {
    const days = Math.round((new Date(d).getTime() - minDateTime) / 86400000);
    return days * PPD;
  }, [minDateTime, PPD]);

  const getWidth = useCallback((s: string, e: string) => {
    const days = Math.round((new Date(e).getTime() - new Date(s).getTime()) / 86400000);
    return Math.max(PPD * 0.5, days * PPD);
  }, [PPD]);

  const previewStyle = useCallback((planId: string, itemId: string, kind: 'phase' | 'task', start: string, end: string) => {
    if (!barDrag || barDrag.target.planId !== planId) {
      return { left: `${getLeft(start)}px`, width: `${getWidth(start, end)}px` };
    }

    const isHit = (kind === 'phase' && barDrag.target.kind === 'phase' && (barDrag.target as any).phaseId === itemId) ||
      (kind === 'task' && barDrag.target.kind === 'task' && (barDrag.target as any).taskId === itemId);

    if (!isHit) return { left: `${getLeft(start)}px`, width: `${getWidth(start, end)}px` };

    const d = dragDeltaDays;
    let ns = start, ne = end;
    if (barDrag.mode === 'MOVE') {
      ns = addDaysToStr(barDrag.origStart, d);
      ne = addDaysToStr(barDrag.origEnd, d);
    } else if (barDrag.mode === 'RESIZE_LEFT') {
      const dur = Math.max(1, diffDays(barDrag.origStart, barDrag.origEnd) - d);
      ns = addDaysToStr(barDrag.origEnd, -dur);
    } else {
      ne = addDaysToStr(barDrag.origStart, Math.max(1, diffDays(barDrag.origStart, barDrag.origEnd) + d));
    }

    return { left: `${getLeft(ns)}px`, width: `${getWidth(ns, ne)}px` };
  }, [barDrag, dragDeltaDays, getLeft, getWidth]);

  // ── Status helpers ────────────────────────────────────────────────────────
  const statusCode = (s: any) => typeof s === 'string' ? s : (s?.code ?? '');

  // Logic màu sắc và label hiện được xử lý trực tiếp bằng getPhaseStatusFromApi và getTaskStatusFromApi
  // để đảm bảo luôn lấy dữ liệu mới nhất từ API mà không hardcode.


  // ── Row list ─────────────────────────────────────────────────────────────
  interface Row {
    type: 'plan' | 'phase' | 'task';
    id: string;
    planId: string;
    phaseId?: string;
    depth: number;
    item: any;
    visibleInPlan: boolean;
    visibleInPhase: boolean;
  }

  const rows = useMemo((): Row[] => {
    const list: Row[] = [];
    const multi = plans.length > 1;
    plans.forEach(plan => {
      const planExpanded = !multi || expandedPlans.has(plan.id);
      if (multi) {
        list.push({
          type: 'plan', id: plan.id, planId: plan.id, depth: 0, item: plan,
          visibleInPlan: true, visibleInPhase: true,
        });
      }
      plan.phases.forEach(phase => {
        list.push({
          type: 'phase', id: phase.id, planId: plan.id, depth: multi ? 1 : 0, item: phase,
          visibleInPlan: planExpanded, visibleInPhase: true,
        });
        (phase.tasks ?? []).forEach(task => {
          list.push({
            type: 'task', id: task.id, planId: plan.id, phaseId: phase.id, depth: multi ? 2 : 1, item: task,
            visibleInPlan: planExpanded,
            visibleInPhase: expandedPhases.has(phase.id),
          });
        });
      });
    });
    return list;
  }, [plans, expandedPlans, expandedPhases]);

  // FIX BUG 1 & 2: visible = visibleInPlan AND visibleInPhase (for tasks)
  // Phase rows are always visible when plan is expanded (visibleInPhase is always true for them)
  const isRowVisible = (r: Row) =>
    r.type === 'task' ? r.visibleInPlan && r.visibleInPhase : r.visibleInPlan;

  // ── Dimensions ───────────────────────────────────────────────────────────
  const ROW_H = 40;
  const HEADER_TOP_H = 28;
  const HEADER_SUB_H = 28;
  const HEADER_H = HEADER_TOP_H + HEADER_SUB_H;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        'flex-1 flex flex-col h-full min-h-0 relative border border-slate-200 rounded-none shadow-sm overflow-hidden bg-white',
        barDrag ? 'select-none' : '',
      )}
    >
      {/* ════════ HEADER ════════ */}
      <div className="flex flex-shrink-0 border-b-2 border-slate-300 bg-white" style={{ height: HEADER_H }}>
        <div
          className="flex-shrink-0 border-r border-slate-200 flex flex-col justify-end pb-1 px-3"
          style={{ width: sidebarWidth }}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Công việc</span>
        </div>
        <div style={{ width: 4, flexShrink: 0 }} />

        <div ref={headerRef} className="flex-1 overflow-hidden relative" style={{ scrollbarWidth: 'none' }}>
          <div style={{ width: totalWidth, height: HEADER_H, position: 'relative' }}>
            {timeScale === 'weeks' ? (
              <>
                {monthSpans.map((ms, i) => (
                  <div
                    key={i}
                    className="absolute border-r border-slate-200"
                    style={{ left: ms.leftPx, width: ms.widthPx, top: 0, height: HEADER_TOP_H }}
                  >
                    <div className="sticky left-0 h-full flex items-center overflow-hidden">
                      <span className="text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                        {ms.label}
                      </span>
                    </div>
                  </div>
                ))}
                {dayCells.map((cell, i) => (
                  <div
                    key={i}
                    className={cn(
                      'absolute flex items-center justify-center border-r',
                      cell.isWeekend ? 'bg-slate-50/80 border-slate-100' : 'border-slate-100',
                    )}
                    style={{ left: cell.leftPx, width: PPD, top: HEADER_TOP_H, height: HEADER_SUB_H }}
                  >
                    {cell.isToday ? (
                      <div className="w-[22px] h-[22px] rounded-full bg-indigo-600 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white leading-none">{cell.dayLabel}</span>
                      </div>
                    ) : (
                      <span className={cn(
                        'text-[11px] font-medium leading-none',
                        cell.isWeekend ? 'text-slate-400' : 'text-slate-600',
                      )}>
                        {cell.dayLabel}
                      </span>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <>
                {(() => {
                  let x = 0;
                  return topCells.map((col, i) => {
                    const left = x; x += col.widthPx;
                    return (
                      <div
                        key={i}
                        className="absolute border-r border-b border-slate-200"
                        style={{ left, width: col.widthPx, top: 0, height: HEADER_TOP_H }}
                      >
                        <div className="sticky left-0 h-full flex items-center overflow-hidden">
                          <span className="text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                            {col.label}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
                {(() => {
                  let x = 0;
                  return subCells.map((col, i) => {
                    const left = x; x += col.widthPx;
                    return (
                      <div
                        key={i}
                        className={cn(
                          'absolute flex items-center justify-center border-r border-slate-100 text-[11px]',
                          col.isHighlight ? 'text-indigo-600 font-bold' : 'text-slate-500 font-medium',
                        )}
                        style={{ left, width: col.widthPx, top: HEADER_TOP_H, height: HEADER_SUB_H }}
                      >
                        {col.label}
                      </div>
                    );
                  });
                })()}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ════════ Body ════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Sidebar ── */}
        <div
          ref={sidebarBodyRef}
          className="flex-shrink-0 overflow-y-auto z-20 bg-white flex flex-col"
          style={{ width: sidebarWidth, scrollbarWidth: 'none' }}
        >
          {rows.map(r => {
            const visible = isRowVisible(r);
            const isSelected = selectedId === r.id;
            const pl = 10 + r.depth * 20;

            if (r.type === 'plan') {
              const expanded = expandedPlans.has(r.id);
              return (
                <AnimatedRow key={r.id} visible={visible} rowHeight={ROW_H}>
                  <div
                    style={{ height: ROW_H, paddingLeft: pl }}
                    className={cn(
                      'flex items-center pr-2 border-b border-slate-100 hover:bg-slate-50 cursor-pointer group transition-colors',
                      isSelected && 'bg-indigo-50 border-l-[3px] border-l-indigo-500',
                    )}
                    onClick={() => onSelect({ type: 'PLAN', id: r.id, planId: r.id })}
                  >
                    <button
                      className="p-0.5 mr-1.5 text-slate-500 hover:text-indigo-600 flex-shrink-0 transition-transform duration-200"
                      style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                      onClick={e => togglePlan(r.id, e)}
                    >
                      <ChevronDown size={14} strokeWidth={3} />
                    </button>
                    <div className="w-4 h-4 rounded flex items-center justify-center mr-2 flex-shrink-0 bg-indigo-500">
                      <svg width="9" height="9" viewBox="0 0 10 10"><path d="M5 1l1.5 3h3l-2.5 2 1 3L5 7.5 2 9l1-3L.5 4h3z" fill="white" /></svg>
                    </div>
                    <span className="truncate text-[12px] font-semibold text-slate-700 flex-1 min-w-0">{r.item.name}</span>
                    <div className="flex items-center gap-0.5 ml-1 shrink-0">

                      {canEdit && onDeletePlan && (
                        <button
                          className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                          title="Xóa kế hoạch"
                          onClick={e => { e.stopPropagation(); onDeletePlan(r.id); }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </AnimatedRow>
              );
            }

            if (r.type === 'phase') {
              const expanded = expandedPhases.has(r.id);
              return (
                <AnimatedRow key={r.id} visible={visible} rowHeight={ROW_H}>
                  <div
                    style={{ height: ROW_H, paddingLeft: pl }}
                    className={cn(
                      'flex items-center pr-2 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors',
                      isSelected && 'bg-indigo-50 border-l-[3px] border-l-indigo-500',
                    )}
                    onClick={() => onSelect({ type: 'PHASE', id: r.id, planId: r.planId })}
                  >
                    <button
                      className="p-0.5 mr-1.5 text-slate-500 hover:text-indigo-500 flex-shrink-0 transition-transform duration-200"
                      style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                      onClick={e => togglePhase(r.id, r.planId, e)}
                    >
                      <ChevronDown size={14} strokeWidth={3} />
                    </button>
                    <div className="w-3.5 h-3.5 rounded-sm flex items-center justify-center mr-2 flex-shrink-0"
                      style={{ backgroundColor: getStatusColor(r.item.status) }}>
                      <svg width="8" height="8" viewBox="0 0 8 8">
                        <path d="M4 1L7 4L4 7M1 4h6" stroke="white" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                      </svg>
                    </div>
                    <span className="truncate text-[12px] font-medium text-slate-700 flex-1 min-w-0">{r.item.name}</span>
                    <span className="ml-1 flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wide"
                      style={{
                        backgroundColor: getStatusColor(r.item.status) + '15',
                        color: getStatusColor(r.item.status)
                      }}>
                      {statusLabel(r.item.status)}
                    </span>
{r.item.actualStartDate && (
  <span className="ml-1 flex-shrink-0 text-[9px] text-indigo-500 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
    ▶ {new Date(r.item.actualStartDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
  </span>
)}

                  </div>
                </AnimatedRow>
              );
            }

            // task
            const sc = statusCode(r.item.status);
            return (
              <AnimatedRow key={r.id} visible={visible} rowHeight={ROW_H}>
                <div
                  style={{ height: ROW_H, paddingLeft: pl }}
                  className={cn(
                    'flex items-center pr-2 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors',
                    isSelected && 'bg-indigo-50/60 border-l-[3px] border-l-indigo-300',
                  )}
                  onClick={() => onSelect({ type: 'TASK', id: r.id, planId: r.planId, phaseId: r.phaseId })}
                >
                  <div className="w-3 h-3 rounded-sm border mr-2 flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: sc === 'COMPLETED' ? getStatusColor(r.item.status) : 'transparent',
                      borderColor: getStatusColor(r.item.status)
                    }}>
                    {sc === 'COMPLETED' && (
                      <svg width="7" height="7" viewBox="0 0 8 8">
                        <path d="M1 4l2 2 4-3" stroke="white" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mr-1.5 flex-shrink-0 font-mono">{(r.item as any).code ?? ''}</span>
                  <span className="truncate text-[12px] text-slate-700 font-medium flex-1 min-w-0">{r.item.name}</span>
                  <span className="ml-1 flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide"
                    style={{
                      backgroundColor: getStatusColor(r.item.status) + '15',
                      color: getStatusColor(r.item.status)
                    }}>
                    {statusLabel(r.item.status)}
                  </span>

                </div>
              </AnimatedRow>
            );
          })}

          {plans.map(plan => {
            if (!(plans.length === 1 || expandedPlans.has(plan.id)) || !canEdit) return null;

            const isAdding = addingPhaseToPlanId === plan.id;
            const pl = plans.length > 1 ? 50 : 14;

            if (isAdding) {
              return (
                <div key={`form-${plan.id}`} className="flex flex-col border-b border-slate-100 bg-slate-50/50 p-2 gap-2">
                  <input
                    autoFocus
                    placeholder="Tên giai đoạn..."
                    className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newPhaseName}
                    onChange={e => setNewPhaseName(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <DateInput
                      className="flex-1"
                      value={newPhaseStart}
                      onChange={setNewPhaseStart}
                    />
                    <DateInput
                      className="flex-1"
                      value={newPhaseEnd}
                      onChange={setNewPhaseEnd}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700"
                      onClick={() => setAddingPhaseToPlanId(null)}
                      disabled={isSavingNewPhase}
                    >
                      Hủy
                    </button>
                    <button
                      className="px-3 py-1 text-[10px] font-bold bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                      disabled={isSavingNewPhase || !newPhaseName || !newPhaseStart || !newPhaseEnd}
                      onClick={async () => {
                        setIsSavingNewPhase(true);
                        try {
                          await onAddPhase(plan.id, { name: newPhaseName, startDate: newPhaseStart, endDate: newPhaseEnd });
                          setAddingPhaseToPlanId(null);
                          setNewPhaseName('');
                        } finally {
                          setIsSavingNewPhase(false);
                        }
                      }}
                    >
                      {isSavingNewPhase ? 'Đang lưu...' : 'Thêm'}
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={`add-${plan.id}`}
                style={{ height: ROW_H, paddingLeft: pl }}
                className="flex items-center pr-4 text-[11px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors border-b border-slate-50 flex-shrink-0"
                onClick={() => {
                  setAddingPhaseToPlanId(plan.id);
                  setNewPhaseStart(plan.startDate);
                  setNewPhaseEnd(plan.endDate);
                }}
              >
                <Plus size={12} className="mr-1.5" />
                Thêm giai đoạn
              </button>
            );
          })}
        </div>

        {/* ── Resize handle ── */}
        <div
          className="flex-shrink-0 relative z-30 group"
          style={{ width: 4, cursor: 'col-resize' }}
          onMouseDown={startSidebarResize}
        >
          <div className="absolute inset-y-0 left-0 w-px bg-slate-200 group-hover:bg-indigo-400 group-active:bg-indigo-500 transition-colors" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <GripVertical size={14} className="text-indigo-400" />
          </div>
        </div>

        {/* ── Gantt canvas ── */}
        <div
          ref={ganttBodyRef}
          className="flex-1 overflow-auto relative"
          style={{ scrollbarWidth: 'none' }}
          onScroll={onBodyScroll}
        >
          <div style={{ width: totalWidth, minHeight: '100%', position: 'relative' }}>

            {/* Weekend shading */}
            {timeScale === 'weeks' && dayCells
              .filter(c => c.isWeekend && c.date.getDay() === 6)
              .map((c, i) => (
                <div key={i} className="absolute top-0 bottom-0 pointer-events-none"
                  style={{ left: c.leftPx, width: PPD * 2, background: 'rgba(241,245,249,0.7)' }} />
              ))}

            {/* Today column tint */}
            {timeScale === 'weeks' && todayLeft !== null && (
              <div className="absolute top-0 bottom-0 pointer-events-none"
                style={{ left: todayLeft, width: PPD, background: 'rgba(99,102,241,0.04)' }} />
            )}

            {/* Vertical grid lines — days */}
            {timeScale === 'weeks' && dayCells.map((cell, i) => (
              <div key={i} className="absolute top-0 bottom-0 pointer-events-none"
                style={{ left: cell.leftPx, width: 1, background: cell.isFirstOfMonth ? 'rgba(203,213,225,0.9)' : 'rgba(226,232,240,0.5)' }} />
            ))}

            {/* Vertical grid lines — weeks/months */}
            {timeScale !== 'weeks' && (() => {
              const topLines: number[] = [];
              let x = 0;
              topCells.forEach(c => { topLines.push(x); x += c.widthPx; });
              const subLines: number[] = [];
              let sx = 0;
              subCells.forEach(c => { subLines.push(sx); sx += c.widthPx; });
              return (
                <>
                  {subLines.map((lx, i) => (
                    <div key={`s${i}`} className="absolute top-0 bottom-0 pointer-events-none"
                      style={{ left: lx, width: 1, background: 'rgba(240, 234, 226, 0.5)' }} />
                  ))}
                  {topLines.map((lx, i) => (
                    <div key={`t${i}`} className="absolute top-0 bottom-0 pointer-events-none"
                      style={{ left: lx, width: 1, background: 'rgba(203,213,225,0.9)' }} />
                  ))}
                </>
              );
            })()}

            {/* Today line */}
            {todayLeft !== null && (
              <div className="absolute top-0 bottom-0 z-20 pointer-events-none"
                style={{ left: todayLeft + (timeScale === 'weeks' ? PPD / 2 : 0), width: 1.5, background: '#6366f1' }}
              >
                <div style={{ position: 'absolute', top: -1, left: -4, width: 9, height: 9, borderRadius: '50%', background: '#6366f1', border: '2px solid white' }} />
              </div>
            )}

            {/* ── Gantt rows ── */}
            {rows.map((r) => {
              const visible = isRowVisible(r);
              const isSelected = selectedId === r.id;

              if (r.type === 'plan') {
                return (
                  <AnimatedRow key={r.id} visible={visible} rowHeight={ROW_H}>
                    <div style={{ height: ROW_H, position: 'relative' }} className="border-b border-slate-100" />
                  </AnimatedRow>
                );
              }

              if (r.type === 'phase') {
                const ph = r.item as Phase;
                const ps = previewStyle(r.planId, ph.id, 'phase', ph.startDate, ph.endDate);
                const isDragging = barDrag?.target.kind === 'phase' && (barDrag.target as any).phaseId === ph.id;
                const phBarLeft = parseFloat(ps.left as string);
                const phBarWidth = parseFloat(ps.width as string);
                return (
                  <AnimatedRow key={r.id} visible={visible} rowHeight={ROW_H}>
                    <div
                      style={{ height: ROW_H, position: 'relative' }}
                      className={cn('border-b border-slate-100 cursor-pointer', isSelected ? 'bg-indigo-50/20' : 'hover:bg-slate-50/40')}
                      onClick={() => onSelect({ type: 'PHASE', id: ph.id, planId: r.planId })}
                    >
                      {/* Main Bar Visual */}
                      <div
                        className={cn(
                          'absolute flex items-center overflow-hidden rounded-md',
                          isDragging ? 'opacity-90 ring-2 ring-white/40' : '',
                        )}
                        style={{
                          ...ps,
                          backgroundColor: getStatusColor(ph.status),
                          top: '50%',
                          transform: 'translateY(-50%)',
                          height: 24,
                          zIndex: 1,
                          willChange: 'left, width',
                          transition: isDragging ? 'none' : 'left .15s ease-out, width .15s ease-out, background-color .2s ease',
                          pointerEvents: 'none',
                        }}
                        onMouseDown={undefined}
                        onClick={undefined}
                      >
                        {/* Tất cả children PHẢI có pointer-events: none vì parent có pointer-events: none nhưng CSS KHÔNG tự động kế thừa cho children */}
                        <span className="text-[10px] font-medium text-white px-3 truncate pointer-events-none flex-1 min-w-0">
                          {statusLabel(ph.status)}
                        </span>
                      </div>

                      {/* Unified Timeline Interaction: Markers + Bar Tooltip */}
                      {!isDragging && (
                        <TimelineRowInteraction
                          plannedStart={ph.startDate}
                          plannedEnd={ph.endDate}
                          actualStart={ph.actualStartDate}
                          actualEnd={ph.actualEndDate}
                          ppd={PPD}
                          barLeft={phBarLeft}
                          barWidth={phBarWidth}
                          rowHeight={ROW_H}
                          markerColor={getStatusColor(ph.status)}
                          canEdit={canEdit}
                          onBarMouseDown={canEdit ? e => startBarDrag(e, { kind: 'phase', planId: r.planId, phaseId: ph.id }, 'MOVE', ph.startDate, ph.endDate) : undefined}
                          onBarClick={e => { e.stopPropagation(); onSelect({ type: 'PHASE', id: ph.id, planId: r.planId }); }}
                          onResizeLeft={canEdit ? e => startBarDrag(e, { kind: 'phase', planId: r.planId, phaseId: ph.id }, 'RESIZE_LEFT', ph.startDate, ph.endDate) : undefined}
                          onResizeRight={canEdit ? e => startBarDrag(e, { kind: 'phase', planId: r.planId, phaseId: ph.id }, 'RESIZE_RIGHT', ph.startDate, ph.endDate) : undefined}
                        />
                      )}
                    </div>
                  </AnimatedRow>
                );
              }

              // task
              const tk = r.item as Task;
              const ps = previewStyle(r.planId, tk.id, 'task', tk.startDate, tk.endDate);
              const isDragging = barDrag?.target.kind === 'task' && (barDrag.target as any).taskId === tk.id;
              const tkBarLeft = parseFloat(ps.left as string);
              const tkBarWidth = parseFloat(ps.width as string);
              return (
                <AnimatedRow key={r.id} visible={visible} rowHeight={ROW_H}>
                  <div
                    style={{ height: ROW_H, position: 'relative' }}
                    className={cn('border-b border-slate-50 cursor-pointer', isSelected ? 'bg-indigo-50/15' : 'hover:bg-slate-50/30')}
                    onClick={() => onSelect({ type: 'TASK', id: tk.id, planId: r.planId, phaseId: r.phaseId })}
                  >

                    {/* Main Bar Visual */}
                    <div
                      className={cn(
                        'absolute flex items-center overflow-hidden rounded',
                        isDragging ? 'opacity-90 ring-2 ring-indigo-300' : '',
                      )}
                      style={{
                        ...ps,
                        backgroundColor: getStatusColor(tk.status),
                        top: '50%',
                        transform: 'translateY(-50%)',
                        height: 18, // Tăng nhẹ chiều cao để chứa chữ rõ hơn (từ 14 lên 18)
                        minWidth: 20,
                        willChange: 'left, width',
                        transition: isDragging ? 'none' : 'left .15s ease-out, width .15s ease-out, background-color .2s ease',
                        zIndex: 1,
                        pointerEvents: 'none',
                      }}
                      onMouseDown={undefined}
                      onClick={undefined}
                    >
                      <span className="text-[9px] font-medium text-white px-2 truncate pointer-events-none flex-1 min-w-0">
                        {statusLabel(tk.status)}
                      </span>
                    </div>

                    {/* Unified Timeline Interaction: Markers + Bar Tooltip */}
                    {!isDragging && (
                      <TimelineRowInteraction
                        plannedStart={tk.startDate}
                        plannedEnd={tk.endDate}
                        actualStart={tk.actualStartDate}
                        actualEnd={tk.actualEndDate}
                        ppd={PPD}
                        barLeft={tkBarLeft}
                        barWidth={tkBarWidth}
                        rowHeight={ROW_H}
                        markerColor={getStatusColor(tk.status)}
                        onBarMouseDown={canEdit ? e => startBarDrag(e, { kind: 'task', planId: r.planId, phaseId: r.phaseId!, taskId: tk.id }, 'MOVE', tk.startDate, tk.endDate) : undefined}
                        onBarClick={e => { e.stopPropagation(); onSelect({ type: 'TASK', id: tk.id, planId: r.planId, phaseId: r.phaseId }); }}
                        onResizeLeft={canEdit ? e => startBarDrag(e, { kind: 'task', planId: r.planId, phaseId: r.phaseId!, taskId: tk.id }, 'RESIZE_LEFT', tk.startDate, tk.endDate) : undefined}
                        onResizeRight={canEdit ? e => startBarDrag(e, { kind: 'task', planId: r.planId, phaseId: r.phaseId!, taskId: tk.id }, 'RESIZE_RIGHT', tk.startDate, tk.endDate) : undefined}
                        canEdit={canEdit}
                      />
                    )}
                  </div>
                </AnimatedRow>
              );
            })}

            {/* Add Phase placeholders for Gantt side */}
            {plans.map(plan => {
              if (!(plans.length === 1 || expandedPlans.has(plan.id)) || !canEdit) return null;
              const isAdding = addingPhaseToPlanId === plan.id;
              return (
                <div key={`add-bg-${plan.id}`} style={{ height: isAdding ? 100 : ROW_H }} className="border-b border-slate-50/50" />
              );
            })}
          </div>
        </div>
      </div>

      {/* ════════ Bottom scrollbar ════════ */}
      <div className="flex bg-white border-t border-slate-200 flex-shrink-0 items-center" style={{ height: 16 }}>
        <div className="flex-shrink-0 border-r border-slate-200" style={{ width: sidebarWidth + 4 }} />
        <div ref={scrollBarRef} className="flex-1 overflow-x-auto overflow-y-hidden" style={{ height: '100%', scrollbarWidth: 'thin' }} onScroll={onBarScroll}>
          <div style={{ width: totalWidth, height: 1 }} />
        </div>
        <button className="px-2 h-full border-l border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 text-base flex-shrink-0 transition-colors"
          onClick={() => { if (ganttBodyRef.current) { ganttBodyRef.current.scrollLeft -= 150; syncRefs(ganttBodyRef.current.scrollLeft); } }}>‹</button>
        <button className="px-2 h-full border-l border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 text-base flex-shrink-0 transition-colors"
          onClick={() => { if (ganttBodyRef.current) { ganttBodyRef.current.scrollLeft += 150; syncRefs(ganttBodyRef.current.scrollLeft); } }}>›</button>
      </div>

      {/* ════════ Toolbar ════════ */}
      <div className="absolute bottom-5 right-5 z-30 flex items-center gap-2">
        <button onClick={scrollToToday} className="h-8 px-3 text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:border-slate-500 transition-all">
          Hôm nay
        </button>
        <div className="flex bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          {(['weeks', 'months', 'quarters'] as const).map((s, idx) => (
            <button key={s} onClick={() => setTimeScale(s)}
              className={cn('h-8 px-3 text-[10px] font-bold uppercase tracking-wider transition-all', idx > 0 && 'border-l border-slate-200', timeScale === s ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
              {s === 'weeks' ? 'Tuần' : s === 'months' ? 'Tháng' : 'Quý'}
            </button>
          ))}
        </div>
      </div>

      {/* Drag tooltip */}
      {dragTooltip && (
        <div className="fixed z-50 pointer-events-none" style={{ left: dragTooltip.x + 14, top: dragTooltip.y }}>
          <div className="bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
            {dragTooltip.label}
          </div>
        </div>
      )}
    </div>
  );
});

export default PlanTimeline;