import { useState } from 'react';
import {
  Plus, Leaf, Package, CalendarDays, BadgeCheck,
  TrendingUp, ChevronRight, Warehouse, AlertTriangle,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { HarvestResponse, HarvestSummaryResponse, CreateHarvestRequest } from '@/types/harvest/harvest';
import { HarvestForm } from './HarvestForm';

interface Warehouse { id: string; name: string; }
interface WarehouseItem { id: string; name: string; }
interface WarehouseLocation { id: string; name: string; warehouseId: string; }
interface Unit { id: string; code: string; name: string; }
interface QualityGrade { id: string; code: string; name: string; }
interface Member { userId: string; fullName: string; }
interface Plot { plotId: string; plotName: string; }

interface HarvestSectionProps {
  planId: string;
  planStageId?: string;
  plots?: Plot[];
  harvests: HarvestResponse[];
  summary: HarvestSummaryResponse[];
  loading: boolean;
  submitting?: boolean;
  // Lookup data
  units: Unit[];
  qualityGrades: QualityGrade[];
  members: Member[];
  warehouses: Warehouse[];
  warehouseItems: Record<string, WarehouseItem[]>;
  warehouseLocations: Record<string, WarehouseLocation[]>;
  onFetchWarehouseItems: (warehouseId: string) => void;
  onFetchWarehouseLocations: (warehouseId: string) => void;
  onCreateHarvest: (data: CreateHarvestRequest) => Promise<void>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNumber(n?: number) {
  if (n == null) return '—';
  return new Intl.NumberFormat('vi-VN').format(n);
}

function formatCurrency(n?: number) {
  if (n == null) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function formatDate(s?: string) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('vi-VN');
}

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({ summary }: { summary: HarvestSummaryResponse }) {
  return (
    <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
          <TrendingUp size={10} />
          {summary.plotName ?? 'Toàn kế hoạch'}
        </span>
        <span className="text-[10px] text-emerald-600 font-semibold">
          {summary.totalBatches} đợt
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        <div>
          <p className="text-[9px] text-slate-400 uppercase tracking-wider">Sản lượng</p>
          <p className="text-[12px] font-bold text-slate-800">
            {formatNumber(summary.totalQuantity)} {summary.unitCode}
          </p>
        </div>
        {summary.totalRevenue != null && (
          <div>
            <p className="text-[9px] text-slate-400 uppercase tracking-wider">Doanh thu</p>
            <p className="text-[12px] font-bold text-emerald-700">
              {formatCurrency(summary.totalRevenue)}
            </p>
          </div>
        )}
        {summary.firstHarvestDate && (
          <div>
            <p className="text-[9px] text-slate-400 uppercase tracking-wider">Ngày đầu</p>
            <p className="text-[11px] font-semibold text-slate-700">{formatDate(summary.firstHarvestDate)}</p>
          </div>
        )}
        {summary.lastHarvestDate && (
          <div>
            <p className="text-[9px] text-slate-400 uppercase tracking-wider">Ngày cuối</p>
            <p className="text-[11px] font-semibold text-slate-700">{formatDate(summary.lastHarvestDate)}</p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        {summary.hasEarlyHarvest && (
          <span className="flex items-center gap-1 text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100">
            <AlertTriangle size={8} /> Sớm
          </span>
        )}
        {summary.hasPartialHarvest && (
          <span className="flex items-center gap-1 text-[9px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">
            <Package size={8} /> Một phần
          </span>
        )}
      </div>
    </div>
  );
}

// ── Harvest record card ───────────────────────────────────────────────────────

function HarvestCard({
  harvest,
  onExpand,
  expanded,
}: {
  harvest: HarvestResponse;
  onExpand: () => void;
  expanded: boolean;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={onExpand}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50/80 transition-colors text-left"
      >
        <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-emerald-600">#{harvest.batchNumber}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-bold text-slate-800">
              {formatNumber(harvest.quantity)} {harvest.unitCode}
            </span>
            {harvest.qualityGradeCode && (
              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                {harvest.qualityGradeCode}
              </span>
            )}
            {harvest.earlyHarvest && (
              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                Sớm
              </span>
            )}
            {harvest.partial && (
              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                Một phần
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <CalendarDays size={9} />{formatDate(harvest.harvestDate)}
            </span>
            {harvest.estimatedRevenue != null && (
              <span className="text-[10px] text-emerald-600 font-semibold">
                {formatCurrency(harvest.estimatedRevenue)}
              </span>
            )}
          </div>
        </div>
        <ChevronRight
          size={13}
          className={cn(
            'text-slate-300 flex-shrink-0 transition-transform duration-200',
            expanded && 'rotate-90'
          )}
        />
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-slate-50">
              {/* Người thu hoạch */}
              {harvest.harvestedByName && (
                <div className="flex items-center gap-1.5 pt-2">
                  <BadgeCheck size={10} className="text-slate-400" />
                  <span className="text-[11px] text-slate-500">
                    Người thu hoạch: <strong>{harvest.harvestedByName}</strong>
                  </span>
                </div>
              )}

              {/* Lô đất */}
              {harvest.plotName && (
                <div className="flex items-center gap-1.5">
                  <Leaf size={10} className="text-slate-400" />
                  <span className="text-[11px] text-slate-500">
                    Lô: <strong>{harvest.plotName}</strong>
                  </span>
                </div>
              )}

              {/* Lý do thu hoạch sớm */}
              {harvest.earlyHarvestReason && (
                <div className="flex items-start gap-1.5">
                  <AlertTriangle size={10} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <span className="text-[11px] text-slate-500">
                    Lý do: <span className="text-amber-700">{harvest.earlyHarvestReason}</span>
                  </span>
                </div>
              )}

              {/* Ghi chú */}
              {harvest.notes && (
                <p className="text-[11px] text-slate-400 italic">{harvest.notes}</p>
              )}

              {/* Warehouse entries */}
              {harvest.warehouseEntries.length > 0 && (
                <div className="space-y-1 pt-1">
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Warehouse size={9} /> Đã nhập kho
                  </p>
                  {harvest.warehouseEntries.map(entry => (
                    <div
                      key={entry.transactionId}
                      className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-slate-700 truncate">
                          {entry.warehouseItemName}
                        </p>
                        <p className="text-[9px] text-slate-400">
                          {entry.warehouseName} › {entry.locationName}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 ml-2 flex-shrink-0">
                        {formatNumber(entry.qty)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[9px] text-slate-300 pt-1">
                Tạo bởi {harvest.createdByName} · {formatDate(harvest.createdAt)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function HarvestSection({
  planId,
  planStageId,
  plots,
  harvests,
  summary,
  loading,
  submitting,
  units,
  qualityGrades,
  members,
  warehouses,
  warehouseItems,
  warehouseLocations,
  onFetchWarehouseItems,
  onFetchWarehouseLocations,
  onCreateHarvest,
}: HarvestSectionProps) {
  const [isAdding, setIsAdding]       = useState(false);
  const [expandedId, setExpandedId]   = useState<string | null>(null);

  const handleSubmit = async (data: CreateHarvestRequest) => {
    await onCreateHarvest(data);
    setIsAdding(false);
  };

  return (
    <div className="px-4 py-3 space-y-4">

      {/* ── Summary cards ── */}
      {summary.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Tổng hợp
          </p>
          {summary.map((s, i) => (
            <SummaryCard key={i} summary={s} />
          ))}
        </div>
      )}

      {/* ── Header + Add button ── */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Leaf size={10} />
          Các đợt thu hoạch
          {harvests.length > 0 && (
            <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {harvests.length}
            </span>
          )}
        </p>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <Plus size={11} /> Thêm đợt
          </button>
        )}
      </div>

      {/* ── Form ── */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="border border-emerald-100 rounded-2xl overflow-hidden bg-emerald-50/30"
          >
            <HarvestForm
              planId={planId}
              planStageId={planStageId}
              plots={plots}
              units={units}
              qualityGrades={qualityGrades}
              members={members}
              warehouses={warehouses}
              warehouseItems={warehouseItems}
              warehouseLocations={warehouseLocations}
              onFetchWarehouseItems={onFetchWarehouseItems}
              onFetchWarehouseLocations={onFetchWarehouseLocations}
              onSubmit={handleSubmit}
              onCancel={() => setIsAdding(false)}
              submitting={submitting}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── List ── */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={18} className="text-slate-300 animate-spin" />
        </div>
      ) : harvests.length === 0 && !isAdding ? (
        <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <Leaf size={22} className="text-slate-200 mx-auto mb-2" />
          <p className="text-[12px] text-slate-500 font-medium">Chưa có đợt thu hoạch nào</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Bấm "+ Thêm đợt" để ghi nhận thu hoạch</p>
        </div>
      ) : (
        <div className="space-y-2">
          {harvests.map(h => (
            <HarvestCard
              key={h.id}
              harvest={h}
              expanded={expandedId === h.id}
              onExpand={() => setExpandedId(expandedId === h.id ? null : h.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}