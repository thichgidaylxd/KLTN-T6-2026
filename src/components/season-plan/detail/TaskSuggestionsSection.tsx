import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  Loader2,
  AlertCircle,
  Clock,
  Tag,
  RefreshCw,
  CheckCheck,
  Droplet,
  Leaf,
  Bug,
  Scissors,
  Sprout,
  Eye,
  Wheat,
  Mountain,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Phase, SeasonPlan } from '@/types/seasonPlan';
import { TaskSuggestion } from '@/types/ai';
import { useTaskSuggestionsByStage } from '@/hooks/ai/useTaskSuggestionsByStage';

// ── Priority config ───────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  HIGH:   { label: 'Cao',  color: 'text-rose-600',  bg: 'bg-rose-50',   dot: 'bg-rose-500' },
  MEDIUM: { label: 'TB',   color: 'text-amber-600', bg: 'bg-amber-50',  dot: 'bg-amber-400' },
  LOW:    { label: 'Thấp', color: 'text-slate-500', bg: 'bg-slate-100', dot: 'bg-slate-400' },
};

// ── Category icons (lucide) ───────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, JSX.Element> = {
  WATERING:     <Droplet className="w-4 h-4 text-blue-500" />,
  FERTILIZING:  <Leaf className="w-4 h-4 text-green-600" />,
  PEST_CONTROL: <Bug className="w-4 h-4 text-red-500" />,
  HARVESTING:   <Wheat className="w-4 h-4 text-yellow-600" />,
  PRUNING:      <Scissors className="w-4 h-4 text-slate-600" />,
  PLANTING:     <Sprout className="w-4 h-4 text-green-500" />,
  INSPECTION:   <Eye className="w-4 h-4 text-indigo-500" />,
  SOIL:         <Mountain className="w-4 h-4 text-brown-500" />,
};
function priorityCfg(p: string) {
  return PRIORITY_CONFIG[p?.toUpperCase()] ?? PRIORITY_CONFIG.MEDIUM;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  phase: Phase;
  plan: SeasonPlan;
  /** Gọi khi user bấm "Tạo" trên 1 gợi ý */
  onCreateFromSuggestion: (suggestion: TaskSuggestion) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TaskSuggestionsSection({ phase, plan, onCreateFromSuggestion }: Props) {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<Set<number>>(new Set());

  const { data: suggestions, loading, error, fetch, reset } =
    useTaskSuggestionsByStage(plan.id, phase.id);

  const handleToggle = () => {
    if (!open && !suggestions && !loading) fetch();
    setOpen(v => !v);
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    reset();
    setCreated(new Set());
    fetch();
  };

  const handleCreate = (suggestion: TaskSuggestion, idx: number) => {
    onCreateFromSuggestion(suggestion);
    setCreated(prev => new Set(prev).add(idx));
  };

  return (
    <div className="pb-3">
      {/* ── Toggle button ─────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleToggle}
className={cn(
  'w-full flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-left',
  open
    ? 'bg-violet-50 border-violet-200'
    : 'bg-indigo-50/50 border-indigo-100 hover:border-violet-200 hover:bg-violet-50/40',
    // ← từ bg-slate-50/70 border-slate-100 → bg-indigo-50/50 border-indigo-100
)}
      >
        <span className="relative shrink-0">
          {loading ? (
            <Loader2 size={14} className="text-violet-500 animate-spin" />
          ) : (
            <Sparkles
              size={14}
              className={cn('transition-colors', open ? 'text-violet-500' : 'text-slate-400')}
            />
          )}
          {/* Ping dot khi chưa từng mở */}
          {!open && !loading && !suggestions && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-400 rounded-full animate-ping opacity-75" />
          )}
        </span>

<span
  className={cn(
    'text-[11px] font-bold flex-1 transition-colors',
    open
      ? 'text-violet-700'
      : loading
      ? 'text-violet-500'
      : 'text-indigo-600',        // ← từ text-slate-500 → text-indigo-600
  )}
>
          {loading
            ? 'AI đang phân tích giai đoạn...'
            : suggestions
            ? `Gợi ý từ AI (${suggestions.length})`
            : 'Xem gợi ý từ AI'}
        </span>

        {suggestions && open && (
          <button
            type="button"
            onClick={handleRefresh}
            title="Tải lại gợi ý"
            className="p-1 rounded-lg hover:bg-violet-100 transition-colors"
          >
            <RefreshCw size={11} className="text-violet-400" />
          </button>
        )}

        <span className="text-slate-400 shrink-0">
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </button>

      {/* ── Expanded content ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-1.5">

              {/* Loading skeleton */}
              {loading && (
                <div className="space-y-2 py-1">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="h-16 rounded-xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 animate-pulse"
                      style={{ animationDelay: `${i * 120}ms` }}
                    />
                  ))}
                  <p className="text-center text-[10px] text-slate-400 pt-1 italic">
                    Đang phân tích ngữ cảnh giai đoạn canh tác...
                  </p>
                </div>
              )}

              {/* Error */}
              {error && !loading && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100">
                  <AlertCircle size={13} className="text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-rose-600 font-semibold">Không thể lấy gợi ý</p>
                    <p className="text-[10px] text-rose-400 mt-0.5 leading-relaxed">{error}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="shrink-0 px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-600 text-[10px] font-bold rounded-lg transition-colors"
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {/* Empty */}
              {!loading && !error && suggestions?.length === 0 && (
                <div className="py-5 text-center">
                  <p className="text-[11px] text-slate-400">Không có gợi ý nào cho giai đoạn này</p>
                </div>
              )}

              {/* Cards */}
              {!loading && !error && suggestions && suggestions.length > 0 && (
                <>
                  <p className="text-[10px] text-slate-400 px-0.5 pb-0.5">
                    Bấm{' '}
                    <span className="font-bold text-violet-500">+ Tạo</span>{' '}
                    để thêm ngay vào danh sách công việc
                  </p>
{suggestions.map((s, idx) => {
  const isCreated = created.has(idx);
  const pCfg = PRIORITY_CONFIG[s.priority?.toUpperCase()] ?? {
    label: s.priority,
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    dot: 'bg-slate-400',
  };
  const catIcon = CATEGORY_ICONS[s.category?.toUpperCase()] ?? <Tag className="w-4 h-4 text-slate-500" />;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={cn(
                          'group relative flex items-start gap-2.5 p-2.5 rounded-xl border transition-all',
                          isCreated
                            ? 'bg-emerald-50/60 border-emerald-100'
                            : 'bg-white border-slate-100 hover:border-violet-200 hover:shadow-sm hover:shadow-violet-50',
                        )}
                      >
                        {/* Category emoji */}
                        <span className="text-base leading-none shrink-0 mt-0.5">
                          {catIcon}
                        </span>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                'text-[12px] font-bold leading-snug',
                                isCreated
                                  ? 'text-emerald-700 line-through opacity-60'
                                  : 'text-slate-700',
                              )}
                            >
                              {s.title}
                            </p>

                            {/* Priority badge */}
                            <span
                              className={cn(
                                'shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide',
                                pCfg.bg,
                                pCfg.color,
                              )}
                            >
                              <span className={cn('w-1.5 h-1.5 rounded-full', pCfg.dot)} />
                              {pCfg.label}
                            </span>
                          </div>

                          {s.description && (
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                              {s.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2.5 mt-1.5">
                            {s.estimatedDays != null && (
                              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                <Clock size={9} />
                                ~{s.estimatedDays} ngày
                              </span>
                            )}
                            {s.category && (
                              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                <Tag size={9} />
                                {s.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action */}
                        {isCreated ? (
                          <div className="shrink-0 flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold">
                            <CheckCheck size={11} />
                            Đã tạo
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCreate(s, idx)}
                            className="shrink-0 flex items-center gap-1 px-2 py-1 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm shadow-violet-200 opacity-0 group-hover:opacity-100"
                          >
                            <Plus size={11} />
                            Tạo
                          </button>
                        )}
                      </motion.div>
                    );
                  })}

                  <p className="text-center text-[10px] text-slate-300 pt-1 pb-0.5">
                    Gợi ý được tạo bởi AI · Có thể chỉnh sửa sau khi tạo
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}