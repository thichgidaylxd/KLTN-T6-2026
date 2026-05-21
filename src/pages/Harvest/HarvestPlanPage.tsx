import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Package, Plus, X, Calendar, MapPin,
  AlertTriangle, Clock, ChevronLeft, ChevronRight, Wheat,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHarvestsByPlan, useHarvestSummaryByPlan } from '@/hooks/harvest/useHarvest';
import type { HarvestResponse, CreateHarvestRequest, UpdateHarvestRequest } from '@/types/harvest/harvest';

// ─── Helpers ────────────────────────────────────────────────────
const fmt = (v?: number | null) => v?.toLocaleString('vi-VN') ?? '0';
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const GRADE_COLOR: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-700',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
};

// ─── Harvest Form Modal ─────────────────────────────────────────
interface HarvestFormProps {
  farmId: string;
  planId: string;
  initial?: HarvestResponse;
  onClose: () => void;
  onSubmit: (data: CreateHarvestRequest | UpdateHarvestRequest) => Promise<void>;
}

const HarvestFormModal: React.FC<HarvestFormProps> = ({ farmId, planId, initial, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    planStageId:        initial?.planStageId ?? '',
    plotId:             initial?.plotId ?? '',
    harvestDate:        initial?.harvestDate ?? new Date().toISOString().split('T')[0],
    quantity:           initial?.quantity ?? 0,
    unitId:             initial?.unitId ?? '',
    qualityGradeId:     initial?.qualityGradeId ?? '',
    unitPrice:          initial?.unitPrice ?? 0,
    harvestedBy:        initial?.harvestedBy ?? '',
    earlyHarvest:       initial?.earlyHarvest ?? false,
    earlyHarvestReason: initial?.earlyHarvestReason ?? '',
    partial:            initial?.partial ?? false,
    warehouseItemId:    initial?.warehouseItemId ?? '',
    warehouseLocationId: initial?.warehouseLocationId ?? '',
    notes:              initial?.notes ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.plotId || !form.harvestDate || form.quantity <= 0) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (initial) {
        await onSubmit({
          harvestDate:        form.harvestDate,
          quantity:           form.quantity,
          qualityGradeId:     form.qualityGradeId,
          unitPrice:          form.unitPrice,
          harvestedBy:        form.harvestedBy,
          earlyHarvest:       form.earlyHarvest,
          earlyHarvestReason: form.earlyHarvestReason || undefined,
          partial:            form.partial,
          notes:              form.notes || undefined,
        } as UpdateHarvestRequest);
      } else {
        await onSubmit({
          planId,
          planStageId:        form.planStageId,
          plotId:             form.plotId,
          harvestDate:        form.harvestDate,
          quantity:           form.quantity,
          unitId:             form.unitId,
          qualityGradeId:     form.qualityGradeId,
          unitPrice:          form.unitPrice,
          harvestedBy:        form.harvestedBy,
          earlyHarvest:       form.earlyHarvest,
          earlyHarvestReason: form.earlyHarvestReason || undefined,
          partial:            form.partial,
          warehouseItemId:    form.warehouseItemId || undefined,
          warehouseLocationId: form.warehouseLocationId || undefined,
          notes:              form.notes || undefined,
        } as CreateHarvestRequest);
      }
      onClose();
    } catch {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 w-full focus:outline-none focus:ring-2 focus:ring-emerald-400';
  const labelCls = 'text-xs font-semibold text-slate-500 block mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">{initial ? 'Cập nhật thu hoạch' : 'Thêm thu hoạch'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Ngày thu hoạch *</label>
              <input type="date" value={form.harvestDate} onChange={e => set('harvestDate', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Sản lượng *</label>
              <input type="number" min={0} value={form.quantity} onChange={e => set('quantity', +e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Đơn giá (₫)</label>
              <input type="number" min={0} value={form.unitPrice} onChange={e => set('unitPrice', +e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Người thu hoạch</label>
              <input type="text" value={form.harvestedBy} onChange={e => set('harvestedBy', e.target.value)} className={inputCls} placeholder="ID nhân viên" />
            </div>
          </div>

          {!initial && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Mảnh đất (Plot ID) *</label>
                <input type="text" value={form.plotId} onChange={e => set('plotId', e.target.value)} className={inputCls} placeholder="UUID" />
              </div>
              <div>
                <label className={labelCls}>Giai đoạn (Stage ID)</label>
                <input type="text" value={form.planStageId} onChange={e => set('planStageId', e.target.value)} className={inputCls} placeholder="UUID" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Đơn vị (Unit ID) *</label>
              <input type="text" value={form.unitId} onChange={e => set('unitId', e.target.value)} className={inputCls} placeholder="UUID" />
            </div>
            <div>
              <label className={labelCls}>Chất lượng (Grade ID) *</label>
              <input type="text" value={form.qualityGradeId} onChange={e => set('qualityGradeId', e.target.value)} className={inputCls} placeholder="UUID" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox" checked={form.earlyHarvest}
                onChange={e => set('earlyHarvest', e.target.checked)}
                className="w-4 h-4 accent-emerald-600"
              />
              <span className="text-sm text-slate-700">Thu hoạch sớm</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox" checked={form.partial}
                onChange={e => set('partial', e.target.checked)}
                className="w-4 h-4 accent-emerald-600"
              />
              <span className="text-sm text-slate-700">Một phần</span>
            </label>
          </div>

          {form.earlyHarvest && (
            <div>
              <label className={labelCls}>Lý do thu hoạch sớm</label>
              <input type="text" value={form.earlyHarvestReason} onChange={e => set('earlyHarvestReason', e.target.value)} className={inputCls} />
            </div>
          )}

          <div>
            <label className={labelCls}>Ghi chú</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} className="rounded-xl text-sm" disabled={loading}>Huỷ</Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {initial ? 'Cập nhật' : 'Thêm'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Harvest Card ───────────────────────────────────────────────
const HarvestCard: React.FC<{
  harvest: HarvestResponse;
  index: number;
  onEdit: () => void;
}> = ({ harvest, index, onEdit }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.04 }}
    className="bg-white border border-slate-100 rounded-xl p-4 hover:shadow-sm transition-shadow"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="p-2 bg-emerald-50 rounded-xl shrink-0">
          <Wheat size={16} className="text-emerald-600" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-slate-800 text-sm">{harvest.planStageName || 'Giai đoạn chung'}</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${GRADE_COLOR[harvest.qualityGradeCode] ?? 'bg-slate-100 text-slate-600'}`}>
              {harvest.qualityGradeName}
            </span>
            {harvest.earlyHarvest && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                <AlertTriangle size={10} /> Sớm
              </span>
            )}
            {harvest.partial && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Một phần</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
            <span className="flex items-center gap-1"><MapPin size={10} /> {harvest.plotName}</span>
            <span className="flex items-center gap-1"><Calendar size={10} /> {fmtDate(harvest.harvestDate)}</span>
            <span className="flex items-center gap-1"><Clock size={10} /> Lô #{harvest.batchNumber}</span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 shrink-0">
        <div className="text-right">
          <p className="font-bold text-slate-800 text-sm">
            {harvest.quantity} <span className="text-slate-400 font-normal text-xs">{harvest.unitCode}</span>
          </p>
          <p className="text-xs text-slate-500">{fmt(harvest.estimatedRevenue)} ₫</p>
        </div>
        <Button variant="outline" size="sm" onClick={onEdit} className="rounded-lg text-xs h-8 px-2.5">
          Sửa
        </Button>
      </div>
    </div>
  </motion.div>
);

// ─── Main ───────────────────────────────────────────────────────
interface HarvestPlanPageProps {
  farmId?: string;
  planId?: string;
}

export const HarvestPlanPage: React.FC<HarvestPlanPageProps> = ({
  farmId: propFarmId,
  planId: propPlanId,
}) => {
  const params = useParams<{ farmId: string; planId: string }>();
  const farmId = propFarmId || params.farmId || '';
  const planId = propPlanId || params.planId || '';

  const [page, setPage]           = useState(0);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<HarvestResponse | null>(null);
  const PAGE_SIZE = 10;

  const { harvests, pageData, isLoading, error, createHarvest, updateHarvest } =
    useHarvestsByPlan(farmId, planId, page, PAGE_SIZE);

  const { data: summaries } = useHarvestSummaryByPlan(farmId, planId);

  const totalPages = pageData?.totalPages ?? 0;

  const handleCreate = async (data: CreateHarvestRequest | UpdateHarvestRequest) => {
    await createHarvest(data as CreateHarvestRequest);
  };

  const handleUpdate = async (data: CreateHarvestRequest | UpdateHarvestRequest) => {
    if (!editing) return;
    await updateHarvest(editing.id, data as UpdateHarvestRequest);
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      {/* Summary pills */}
      {summaries && summaries.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {summaries.map(s => (
            <div key={s.plotId} className="bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm">
              <p className="text-xs text-slate-500 mb-0.5">{s.plotName}</p>
              <p className="font-bold text-slate-800">{s.totalQuantity} {s.unitCode}</p>
              <p className="text-xs text-slate-400">{s.totalBatches} lần · {fmt(s.totalRevenue)} ₫</p>
            </div>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {pageData?.totalElements ?? 0} bản ghi
        </p>
        <Button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm gap-2 h-9"
        >
          <Plus size={15} /> Thêm thu hoạch
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          Không thể tải dữ liệu.
        </div>
      ) : harvests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Package size={36} className="mb-2 opacity-30" />
          <p className="text-sm">Chưa có bản ghi thu hoạch nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {harvests.map((h, idx) => (
            <HarvestCard
              key={h.id}
              harvest={h}
              index={idx}
              onEdit={() => { setEditing(h); setShowForm(true); }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-400">Trang {page + 1} / {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0} className="rounded-xl">
              <ChevronLeft size={15} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="rounded-xl">
              <ChevronRight size={15} />
            </Button>
          </div>
        </div>
      )}

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <HarvestFormModal
            farmId={farmId}
            planId={planId}
            initial={editing ?? undefined}
            onClose={() => { setShowForm(false); setEditing(null); }}
            onSubmit={editing ? handleUpdate : handleCreate}
          />
        )}
      </AnimatePresence>
    </div>
  );
};