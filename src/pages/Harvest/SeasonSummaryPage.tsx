import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wheat, TrendingUp, Package, Calendar, DollarSign,
  Loader2, CheckSquare, Square, GitCompare, ChevronRight,
  BarChart3, ArrowUpRight, ArrowDownRight, Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlans } from '@/hooks/plan/usePlan';
import { useSeasonSummary, useCompareSeasons } from '@/hooks/harvest/useHarvest';
import type { Plan } from '@/types/plan/plan';
import type { SeasonSummaryResponse} from '@/types/harvest/harvest';

// ─── Helpers ────────────────────────────────────────────────────
const fmt = (v?: number | null) => v?.toLocaleString('vi-VN') ?? '0';

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: 'Nháp',       color: 'bg-slate-100 text-slate-600' },
  ACTIVE:    { label: 'Đang chạy',  color: 'bg-emerald-100 text-emerald-700' },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-blue-100 text-blue-700' },
  CANCELLED: { label: 'Đã huỷ',    color: 'bg-red-100 text-red-600' },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = STATUS_MAP[status] ?? { label: status, color: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.color}`}>
      {s.label}
    </span>
  );
};

// ─── Plan Card ──────────────────────────────────────────────────
const PlanCard: React.FC<{
  plan: Plan;
  selected: boolean;
  checked: boolean;
  compareMode: boolean;
  onSelect: () => void;
  onToggleCheck: () => void;
}> = ({ plan, selected, checked, compareMode, onSelect, onToggleCheck }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2 }}
    onClick={compareMode ? onToggleCheck : onSelect}
    className={`
      relative cursor-pointer rounded-2xl border p-4 transition-all duration-200 select-none
      ${selected && !compareMode
        ? 'border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-100'
        : checked
        ? 'border-blue-400 bg-blue-50 shadow-md shadow-blue-100'
        : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'}
    `}
  >
    {compareMode && (
      <div className="absolute top-3 right-3">
        {checked
          ? <CheckSquare size={18} className="text-blue-600" />
          : <Square size={18} className="text-slate-300" />}
      </div>
    )}
    {selected && !compareMode && (
      <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500" />
    )}
    <div className="flex items-start gap-3">
      <div className="p-2 bg-slate-100 rounded-xl shrink-0">
        <Wheat size={16} className="text-slate-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className="font-semibold text-slate-800 text-sm truncate">{plan.name}</p>
          <StatusBadge status={plan.status} />
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Calendar size={11} />
          <span>{fmtDate(plan.startDate)} – {fmtDate(plan.endDate)}</span>
        </div>
      </div>
    </div>
    {selected && !compareMode && (
      <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-600">
        <span>Xem tổng kết</span>
        <ChevronRight size={12} />
      </div>
    )}
  </motion.div>
);

// ─── Season Summary Detail ──────────────────────────────────────
const SeasonSummaryDetail: React.FC<{ farmId: string; planId: string }> = ({ farmId, planId }) => {
  const { data: s, isLoading, error } = useSeasonSummary(farmId, planId);

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
    </div>
  );

  if (error || !s) return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
      Không thể tải dữ liệu tổng kết.
    </div>
  );

  const d = s as SeasonSummaryResponse;

  return (
    <motion.div key={planId} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">{d.planName}</h2>
        <p className="text-sm text-slate-500">{d.cropName} · {d.farmName}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Sản lượng', icon: <Package size={18} />, color: 'text-emerald-600',
            value: d.totalHarvestQuantity > 0 ? `${d.totalHarvestQuantity} ${d.unitCode ?? ''}` : 'Chưa thu hoạch',
          },
          {
            label: 'Doanh thu', icon: <DollarSign size={18} />, color: 'text-blue-600',
            value: `${fmt(d.totalRevenue)} ₫`,
          },
          {
            label: 'Chi phí', icon: <TrendingUp size={18} />, color: 'text-orange-500',
            value: `${fmt(d.totalCost)} ₫`,
          },
          {
            label: 'Lợi nhuận',
            icon: d.profitable ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />,
            color: d.profitable ? 'text-green-600' : 'text-red-600',
            value: `${fmt(d.grossProfit)} ₫`,
            sub: `${d.profitMarginPercent?.toFixed(1)}% margin`,
          },
        ].map((card) => (
          <div key={card.label} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className={`mb-2 ${card.color}`}>{card.icon}</div>
            <p className="text-xs text-slate-500 font-medium mb-1">{card.label}</p>
            <p className="font-bold text-slate-800 text-sm leading-tight">{card.value}</p>
            {card.sub && <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Info row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Calendar size={12} /> Kế hoạch
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Thời gian</span>
              <span className="font-medium text-slate-700 text-xs">{fmtDate(d.startDate)} – {fmtDate(d.endDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Thời lượng</span>
              <span className="font-medium text-slate-700">{d.durationDays}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Trạng thái</span>
              <StatusBadge status={d.planStatus} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Package size={12} /> Thu hoạch
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Số lần</span>
              <span className="font-medium text-slate-700">{d.harvestBatches} lần</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Lần đầu</span>
              <span className="font-medium text-slate-700 text-xs">{fmtDate(d.harvestDetail?.firstHarvestDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Lần cuối</span>
              <span className="font-medium text-slate-700 text-xs">{fmtDate(d.harvestDetail?.lastHarvestDate)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Chi phí</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Ngày công</span>
              <span className="font-medium text-slate-700">{d.totalWorkDays} ngày</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Nhân công</span>
              <span className="font-medium text-slate-700 text-xs">{fmt(d.totalLaborCost)} ₫</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Vật tư</span>
              <span className="font-medium text-slate-700 text-xs">{fmt(d.totalMaterialCost)} ₫</span>
            </div>
          </div>
        </div>
      </div>

      {/* Material cost table */}
      {(d.materialCostDetail?.items?.length ?? 0) > 0 && (
        <div className="bg-white border border-slate-100 rounded-xl p-4">
          <h4 className="text-sm font-bold text-slate-800 mb-3">Chi tiết vật tư</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500">Vật tư</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500">KH</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500">Dùng</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500">Đơn giá</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Chi phí</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {d.materialCostDetail.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-medium text-slate-700">{item.warehouseItemName}</td>
                    <td className="py-2 px-3 text-center text-slate-500">{item.plannedQty} {item.unitCode}</td>
                    <td className="py-2 px-3 text-center text-slate-500">{item.usedQty} {item.unitCode}</td>
                    <td className="py-2 px-3 text-center text-slate-500">{fmt(item.unitPrice)} ₫</td>
                    <td className="py-2 px-3 text-right font-semibold text-slate-800">{fmt(item.totalCost)} ₫</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Labor cost table */}
      {(d.laborCostDetail?.items?.length ?? 0) > 0 && (
        <div className="bg-white border border-slate-100 rounded-xl p-4">
          <h4 className="text-sm font-bold text-slate-800 mb-3">Chi tiết nhân công</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500">Nhân viên</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500">Ngày công</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500">Tăng ca</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Lương</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {d.laborCostDetail.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-medium text-slate-700">{item.employeeName}</td>
                    <td className="py-2 px-3 text-center text-slate-500">{item.workDays}</td>
                    <td className="py-2 px-3 text-center text-slate-500">{item.overtimeDays}</td>
                    <td className="py-2 px-3 text-right font-semibold text-slate-800">{fmt(item.totalWage)} ₫</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ─── Compare View ───────────────────────────────────────────────
const CompareView: React.FC<{
  farmId: string;
  planIds: string[];
  plans: Plan[];
  onClose: () => void;
}> = ({ farmId, planIds, plans, onClose }) => {
  const { mutate, data, isPending, error } = useCompareSeasons();
  const [fetched, setFetched] = useState(false);

  React.useEffect(() => {
    if (planIds.length >= 2 && !fetched) {
      mutate({ farmId, planIds });
      setFetched(true);
    }
  }, []);

  const seasons = data?.data?.seasons ?? [];
  const selectedPlans = plans.filter(p => planIds.includes(p.id));

  const metrics: {
    key: keyof SeasonComparisonDetail;
    label: string;
    format: (v: number) => string;
    good: 'high' | 'low';
  }[] = [
    { key: 'totalHarvestQuantity', label: 'Sản lượng',  format: v => `${v}`,             good: 'high' },
    { key: 'totalRevenue',         label: 'Doanh thu',  format: v => `${fmt(v)} ₫`,      good: 'high' },
    { key: 'totalCost',            label: 'Chi phí',    format: v => `${fmt(v)} ₫`,      good: 'low'  },
    { key: 'grossProfit',          label: 'Lợi nhuận',  format: v => `${fmt(v)} ₫`,      good: 'high' },
{ 
  key: 'profitMarginPercent',
  label: 'Tỷ suất LN',
  format: v => `${v.toFixed(1)}%`,
  good: 'high'
},
    { key: 'totalWorkDays',        label: 'Ngày công',  format: v => `${v} ngày`,        good: 'low'  },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-600" />
            So sánh mùa vụ
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">{selectedPlans.map(p => p.name).join(' · ')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">← Quay lại</Button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          Không thể tải dữ liệu so sánh.
        </div>
      )}

      {seasons.length >= 2 && (
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Chỉ số</th>
                  {seasons.map(s => (
                    <th key={s.planId} className="text-center py-3 px-4 text-xs font-bold text-slate-700">
                      <div>{s.planName}</div>
                      <div className="font-normal text-slate-400 mt-0.5">{s.cropName}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {metrics.map(m => {
                  const values = seasons.map(s => s[m.key] as number);
                  const best = m.good === 'high' ? Math.max(...values) : Math.min(...values);
                  return (
                    <tr key={m.key} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-xs font-semibold text-slate-500">{m.label}</td>
                      {seasons.map(s => {
                        const val = s[m.key] as number;
                        const isBest = val === best;
                        return (
                          <td key={s.planId} className="py-3 px-4 text-center">
                            <span className={`font-semibold ${isBest ? 'text-emerald-600' : 'text-slate-700'}`}>
                              {m.format(val)}
                            </span>
                            {isBest && (
                              <span className="ml-1.5 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">tốt nhất</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-xs font-semibold text-slate-500">Có lãi</td>
                  {seasons.map(s => (
                    <td key={s.planId} className="py-3 px-4 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.profitable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                        {s.profitable ? 'Có lãi' : 'Lỗ'}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────
export const SeasonSummaryPage: React.FC = () => {
  const { farmId } = useParams<{ farmId: string }>();
  const { plans, plansLoading } = usePlans();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [compareMode, setCompareMode]       = useState(false);
  const [checkedIds, setCheckedIds]         = useState<string[]>([]);
  const [showCompare, setShowCompare]       = useState(false);

  const toggleCheck = (id: string) =>
    setCheckedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const exitCompare = () => {
    setShowCompare(false);
    setCompareMode(false);
    setCheckedIds([]);
  };

  if (!farmId) return null;

  return (
    <div className="p-6 md:p-8 space-y-6 bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600"><Wheat size={22} /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Tổng kết mùa vụ</h1>
            <p className="text-sm text-slate-500">Chọn kế hoạch để xem báo cáo</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {compareMode ? (
            <>
              <Button variant="outline" size="sm" onClick={exitCompare} className="rounded-xl text-xs">Huỷ</Button>
              <Button
                size="sm"
                onClick={() => checkedIds.length >= 2 && setShowCompare(true)}
                disabled={checkedIds.length < 2}
                className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                <BarChart3 size={14} />
                So sánh {checkedIds.length > 0 ? `(${checkedIds.length})` : ''}
              </Button>
            </>
          ) : (
            <Button
              variant="outline" size="sm"
              onClick={() => { setCompareMode(true); setShowCompare(false); setSelectedPlanId(null); }}
              className="rounded-xl text-xs gap-1.5"
            >
              <GitCompare size={14} /> So sánh mùa vụ
            </Button>
          )}
        </div>
      </div>

      {compareMode && !showCompare && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
          <Layers size={14} /> Chọn ít nhất 2 kế hoạch để so sánh
        </div>
      )}

      {/* Plan list */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Danh sách kế hoạch</h2>
        {plansLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
            <Loader2 size={16} className="animate-spin" /> Đang tải...
          </div>
        ) : plans.length === 0 ? (
          <div className="text-sm text-slate-400 py-4">Chưa có kế hoạch nào.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {plans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={selectedPlanId === plan.id}
                checked={checkedIds.includes(plan.id)}
                compareMode={compareMode}
                onSelect={() => { setSelectedPlanId(plan.id); setShowCompare(false); }}
                onToggleCheck={() => toggleCheck(plan.id)}
              />
            ))}
          </div>
        )}
      </div>

      {(selectedPlanId || showCompare) && <div className="border-t border-slate-200" />}

      <AnimatePresence mode="wait">
        {showCompare ? (
          <CompareView key="compare" farmId={farmId} planIds={checkedIds} plans={plans} onClose={exitCompare} />
        ) : selectedPlanId ? (
          <SeasonSummaryDetail key={selectedPlanId} farmId={farmId} planId={selectedPlanId} />
        ) : null}
      </AnimatePresence>
    </div>
  );
};