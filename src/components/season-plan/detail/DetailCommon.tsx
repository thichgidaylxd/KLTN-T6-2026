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

export function statusChipClass(code: string): string {
  switch (code) {
    case 'ACTIVE': case 'IN_PROGRESS': return 'bg-blue-600 text-white';
    case 'READY_TO_HARVEST': return 'bg-lime-600 text-white';
    case 'HARVESTING': return 'bg-emerald-600 text-white';
    case 'COMPLETED': return 'bg-slate-500 text-white';
    case 'CANCELLED': return 'bg-rose-600 text-white';
    case 'OVERDUE': return 'bg-red-600 text-white';
    case 'ASSIGNED': return 'bg-violet-600 text-white';
    case 'DRAFT': default: return 'bg-slate-200 text-slate-700';
  }
}

export function statusViLabel(code: string): string {
  switch (code) {
    case 'DRAFT': return 'Bản nháp';
    case 'ACTIVE': return 'Đang thực hiện';
    case 'IN_PROGRESS': return 'Đang thực hiện';
    case 'READY_TO_HARVEST': return 'Sẵn sàng thu hoạch';
    case 'HARVESTING': return 'Đang thu hoạch';
    case 'COMPLETED': return 'Hoàn thành';
    case 'CANCELLED': return 'Đã hủy';
    case 'OVERDUE': return 'Trễ hạn';
    case 'ASSIGNED': return 'Đã giao việc';
    case 'UNASSIGNED': return 'Chưa giao';
    default: return code;
  }
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
  value: string;
  options: { code: string; label: string }[];
  onChange?: (code: string) => void;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const chip = (
    <button
      disabled={!canEdit}
      onClick={() => canEdit && setOpen(o => !o)}
      className={cn(
        'flex items-center justify-center gap-1.5 h-6 px-2.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap',
        statusChipClass(value),
        canEdit && 'cursor-pointer hover:opacity-90',
        !canEdit && 'cursor-default',
      )}
    >
      {statusViLabel(value)}
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
            className="absolute top-8 left-0 z-50 bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[160px]"
          >
            {options.map(opt => (
              <button
                key={opt.code}
                onClick={() => { onChange?.(opt.code); setOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                  opt.code === value ? 'bg-slate-50' : 'hover:bg-slate-50',
                )}
              >
                <span className={cn(
                  'w-2 h-2 rounded-sm flex-shrink-0',
                  statusChipClass(opt.code).split(' ')[0],
                )} />
                <span className="text-[12px] text-slate-700 font-medium">{opt.label}</span>
                {opt.code === value && <CheckCircle2 size={12} className="text-indigo-500 ml-auto" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}
