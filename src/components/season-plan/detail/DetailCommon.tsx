import React, { useState } from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { StatusObject } from '@/types/seasonPlan';

export function statusCodeOf(s: string | StatusObject | null | undefined): string {
  return typeof s === 'string' ? s : (s?.code ?? '');
}

export function fmtDate(d: string) {
  if (!d || d === '—') return '—';
  const parts = d.split('-');
  if (parts.length !== 3) return d;
  const [y, m, day] = parts;
  return `${day}/${m}/${y}`;
}

/**
 * Bảng màu semantic cho các trạng thái đã biết.
 * Chỉ dùng khi API không trả về color (fallback).
 */
const SEMANTIC_STATUS_COLORS: Record<string, string> = {
  // Task statuses
  TODO:        '#64748b', // xám đậm — Chờ thực hiện
  UPCOMING:    '#94a3b8', // xám — Chưa bắt đầu
  NOT_STARTED: '#94a3b8', // xám — Chưa bắt đầu
  UNASSIGNED:  '#94a3b8', // xám — Chưa giao việc
  ASSIGNED:    '#3b82f6', // xanh dương — Đã giao việc
  IN_PROGRESS: '#0ea5e9', // xanh sky — Đang thực hiện
  DONE:        '#22c55e', // xanh lá — Hoàn thành
  COMPLETED:   '#16a34a', // xanh lá đậm — Hoàn thành
  CANCELLED:   '#ef4444', // đỏ — Đã hủy
  OVERDUE:     '#f43f5e', // hồng đỏ — Trễ hạn
  PENDING:     '#f59e0b', // vàng cam — Đang chờ xử lý
  
  // Plan / Phase statuses
  DRAFT:             '#94a3b8', // xám
  ACTIVE:            '#3b82f6', // xanh dương
  READY_TO_HARVEST:  '#a855f7', // tím
  HARVESTING:        '#f59e0b', // vàng
};

export function statusCodeToColor(code: string): string {
  const normalized = (code || 'UNKNOWN').toUpperCase();
  if (SEMANTIC_STATUS_COLORS[normalized]) return SEMANTIC_STATUS_COLORS[normalized];
  // Fallback: deterministic color from palette for unknown codes
  const palette = [
    '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
    '#06b6d4', '#84cc16', '#ec4899', '#f97316', '#14b8a6',
  ];
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
}

export function getStatusColor(s: any): string {
  if (!s) return '#cbd5e1';
  const code = (typeof s === 'string' ? s : (s.code ?? '')).toUpperCase();

  // LUÔN ƯU TIÊN MÀU TỪ FE: Để đảm bảo giao diện đồng bộ và chuyên nghiệp
  if (SEMANTIC_STATUS_COLORS[code]) return SEMANTIC_STATUS_COLORS[code];

  // Nếu không có trong bảng màu chuẩn, dùng hàm tạo màu ngẫu nhiên theo mã
  return statusCodeToColor(code);
}

export function statusLabel(s: string | any | null): string {
  if (!s) return 'Nháp';
  // BẮT BUỘC lấy tên hiển thị từ API
  if (typeof s !== 'string' && s.name) return s.name;
  // Nếu là chuỗi cũ hoặc không có name, hiện mã code
  return typeof s === 'string' ? s : (s.code || '');
}

export function statusChipClass(code: string): string {
  void code;
  return 'text-white';
}


export function DetailRow({ icon: Icon, label, children }: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0 group">
      <div className="flex items-center gap-2 w-[110px] shrink-0">
        <Icon size={14} className="text-slate-400 shrink-0" />
        <span className="text-[11px] text-slate-500 font-medium truncate">{label}</span>
      </div>
      <div className="flex-1 min-w-0 flex items-center">{children}</div>
    </div>
  );
}

export function InlineText({
  value, onChange, placeholder, canEdit, multiline = false,
}: { value: string; onChange: (v: string) => void; placeholder?: string; canEdit: boolean; multiline?: boolean }) {
  if (!canEdit) {
    return (
      <p className={cn('text-[12px] text-slate-700 font-medium break-words', !value && 'text-slate-400 italic')}>
        {value || placeholder}
      </p>
    );
  }
  const cls = 'w-full text-[12px] text-slate-800 font-medium bg-transparent outline-none border border-transparent hover:border-slate-200 focus:border-indigo-400 focus:bg-white rounded px-1.5 py-0.5 transition-all resize-none';
  return multiline
    ? <textarea className={cls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} />
    : <input className={cls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
}

export function StatusSelect({ value, options, onChange, canEdit }: {
  value: string | StatusObject;
  options: { code: string; label: string; color?: string }[];
  onChange?: (code: string) => void;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const code = statusCodeOf(value);
  const currentOpt = options.find(o => o.code === code);
  
  const currentLabel = currentOpt?.label || statusLabel(value);
  const currentColor = getStatusColor(currentOpt || value);

  const chip = (
    <button
      disabled={!canEdit}
      type="button"
      onClick={() => canEdit && setOpen(o => !o)}
      className={cn(
        'flex items-center justify-center gap-1.5 h-6 px-2.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all',
        !currentColor && statusChipClass(code),
        canEdit && 'cursor-pointer hover:brightness-95 active:scale-95',
        !canEdit && 'cursor-default',
      )}
      style={{ 
        backgroundColor: currentColor, 
        color: 'white',
        boxShadow: `0 2px 8px ${currentColor}30`
      }}
    >
      {currentLabel}
      {canEdit && <ChevronDown size={10} />}
    </button>
  );

  if (!canEdit) return chip;

  return (
    <div className="relative inline-block">
      {chip}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: .97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: .97 }}
            transition={{ duration: .12 }}
            className="absolute top-8 left-0 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl py-1.5 min-w-[180px] overflow-hidden"
          >
            {options.map(opt => (
              <button
                key={opt.code}
                type="button"
                onClick={() => { onChange?.(opt.code); setOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                  opt.code === code ? 'bg-slate-50' : 'hover:bg-slate-50',
                )}
              >
                <span 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getStatusColor(opt) }} 
                />
                <span className={cn(
                  'text-[12px] font-semibold transition-colors',
                  opt.code === code ? 'text-indigo-600' : 'text-slate-700'
                )}>
                  {opt.label}
                </span>
                {opt.code === code && <CheckCircle2 size={14} className="text-indigo-500 ml-auto" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}
