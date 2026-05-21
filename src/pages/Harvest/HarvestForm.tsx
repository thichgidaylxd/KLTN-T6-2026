import { useState } from 'react';
import {
  Plus, Trash2, Warehouse, AlertCircle, Leaf,
  ChevronDown, ChevronUp, PackagePlus, RotateCcw,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { CreateHarvestRequest, WarehouseEntryRequest } from '@/types/harvest/harvest';
import { toast } from 'sonner';

// ─── Local interfaces ─────────────────────────────────────────────────────────

interface WarehouseOption {
  id: string;
  name: string;
}

interface WarehouseItemOption {
  id: string;
  name: string;
  unitCode?: string;
}

interface WarehouseLocationOption {
  id: string;
  name: string;
}

interface UnitOption {
  id: string;
  code: string;
  name: string;
}

interface QualityGradeOption {
  id: string;
  code: string;
  name: string;
}

interface MemberOption {
  userId: string;
  fullName: string;
}

interface PlotOption {
  plotId: string;
  plotName: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface HarvestFormProps {
  planId: string;
  planStageId?: string;
  plots?: PlotOption[];
  units: UnitOption[];
  qualityGrades: QualityGradeOption[];
  members: MemberOption[];
  warehouses: WarehouseOption[];
  /** warehouseId → danh sách item đã có (để user tuỳ chọn dùng lại) */
  warehouseItems: Record<string, WarehouseItemOption[]>;
  /** warehouseId → danh sách vị trí */
  warehouseLocations: Record<string, WarehouseLocationOption[]>;
  onFetchWarehouseItems: (warehouseId: string) => void;
  onFetchWarehouseLocations: (warehouseId: string) => void;
  onSubmit: (data: CreateHarvestRequest) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

// ─── Entry row state ──────────────────────────────────────────────────────────

interface EntryRow {
  _key: number;
  warehouseId: string;
  warehouseLocationId: string;
  qty: string;
  /**
   * Mode chọn sản phẩm:
   *  'new'      → nhập tên sản phẩm mới (productName), service sẽ find-or-create item
   *  'existing' → dùng lại item đã có trong kho (warehouseItemId)
   */
  mode: 'new' | 'existing';
  productName: string;      // dùng khi mode = 'new'
  warehouseItemId: string;  // dùng khi mode = 'existing'
}

let _keyCounter = 1;
const newEntry = (): EntryRow => ({
  _key: _keyCounter++,
  warehouseId: '',
  warehouseLocationId: '',
  qty: '',
  mode: 'new',
  productName: '',
  warehouseItemId: '',
});

// ─── Shared input style ───────────────────────────────────────────────────────

const inputCls =
  'w-full px-2.5 py-1.5 text-[11px] border border-slate-200 rounded-lg ' +
  'focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const labelCls = 'text-[10px] font-semibold text-slate-500 uppercase tracking-wider';

// ─── Component ────────────────────────────────────────────────────────────────

export function HarvestForm({
  planId,
  planStageId,
  plots = [],
  units,
  qualityGrades,
  members,
  warehouses,
  warehouseItems,
  warehouseLocations,
  onFetchWarehouseItems,
  onFetchWarehouseLocations,
  onSubmit,
  onCancel,
  submitting = false,
}: HarvestFormProps) {
  const today = new Date().toISOString().split('T')[0];

  // ── General state ─────────────────────────────────────────────────────────
  const [harvestDate, setHarvestDate]               = useState(today);
  const [quantity, setQuantity]                     = useState('');
  const [unitId, setUnitId]                         = useState(units[0]?.id ?? '');
  const [qualityGradeId, setQualityGradeId]         = useState('');
  const [unitPrice, setUnitPrice]                   = useState('');
  const [harvestedBy, setHarvestedBy]               = useState('');
  const [plotId, setPlotId]                         = useState('');
  const [earlyHarvest, setEarlyHarvest]             = useState(false);
  const [earlyHarvestReason, setEarlyHarvestReason] = useState('');
  const [partial, setPartial]                       = useState(false);
  const [notes, setNotes]                           = useState('');
  const [showAdvanced, setShowAdvanced]             = useState(false);

  // ── Entries ───────────────────────────────────────────────────────────────
  const [entries, setEntries] = useState<EntryRow[]>([newEntry()]);

  const addEntry = () => setEntries(prev => [...prev, newEntry()]);

  const removeEntry = (key: number) =>
    setEntries(prev => prev.filter(e => e._key !== key));

  const updateEntry = (
    key: number,
    patch: Partial<Omit<EntryRow, '_key'>>,
  ) => {
    setEntries(prev =>
      prev.map(e => {
        if (e._key !== key) return e;
        const next = { ...e, ...patch };

        // Khi đổi kho → reset location + product selection, fetch dữ liệu mới
        if ('warehouseId' in patch && patch.warehouseId !== e.warehouseId) {
          next.warehouseLocationId = '';
          next.warehouseItemId     = '';
          next.productName         = '';
          if (patch.warehouseId) {
            onFetchWarehouseItems(patch.warehouseId);
            onFetchWarehouseLocations(patch.warehouseId);
          }
        }

        // Khi đổi mode → reset selection
        if ('mode' in patch) {
          next.warehouseItemId = '';
          next.productName     = '';
        }

        return next;
      }),
    );
  };

  // ── Qty balance ───────────────────────────────────────────────────────────
  const totalEntryQty = entries.reduce((s, e) => s + (parseFloat(e.qty) || 0), 0);
  const harvestQty    = parseFloat(quantity) || 0;
  const qtyMismatch   = harvestQty > 0 && Math.abs(totalEntryQty - harvestQty) > 0.0001;

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!harvestDate) {
      toast.error('Vui lòng chọn ngày thu hoạch');
      return;
    }
    if (!quantity || harvestQty <= 0) {
      toast.error('Vui lòng nhập số lượng thu hoạch');
      return;
    }
    if (!unitId) {
      toast.error('Vui lòng chọn đơn vị');
      return;
    }
    if (earlyHarvest && !earlyHarvestReason.trim()) {
      toast.error('Thu hoạch sớm cần có lý do');
      return;
    }
    if (entries.length === 0) {
      toast.error('Phải có ít nhất 1 điểm nhập kho');
      return;
    }

    for (const e of entries) {
      if (!e.warehouseId) {
        toast.error('Vui lòng chọn kho cho tất cả dòng nhập kho');
        return;
      }
      if (!e.warehouseLocationId) {
        toast.error('Vui lòng chọn vị trí kho cho tất cả dòng nhập kho');
        return;
      }
      if (e.mode === 'new' && !e.productName.trim()) {
        toast.error('Vui lòng nhập tên sản phẩm thu hoạch');
        return;
      }
      if (e.mode === 'existing' && !e.warehouseItemId) {
        toast.error('Vui lòng chọn sản phẩm hiện có trong kho');
        return;
      }
      if (!e.qty || parseFloat(e.qty) <= 0) {
        toast.error('Số lượng nhập kho phải lớn hơn 0');
        return;
      }
    }

    if (qtyMismatch) {
      toast.error(
        `Tổng nhập kho (${totalEntryQty.toFixed(3)}) phải bằng sản lượng (${harvestQty})`,
      );
      return;
    }

    const warehouseEntries: WarehouseEntryRequest[] = entries.map(e => ({
      warehouseId:         e.warehouseId,
      warehouseLocationId: e.warehouseLocationId,
      qty:                 parseFloat(e.qty),
      // mode = 'new'      → gửi productName, không gửi warehouseItemId
      // mode = 'existing' → gửi warehouseItemId, không gửi productName
      ...(e.mode === 'new'
        ? { productName: e.productName.trim() }
        : { warehouseItemId: e.warehouseItemId }),
    }));

    const payload: CreateHarvestRequest = {
      planId,
      planStageId:         planStageId || undefined,
      plotId:              plotId || undefined,
      harvestDate,
      quantity:            harvestQty,
      unitId,
      qualityGradeId:      qualityGradeId || undefined,
      unitPrice:           unitPrice ? parseFloat(unitPrice) : undefined,
      harvestedBy:         harvestedBy || undefined,
      earlyHarvest,
      earlyHarvestReason:  earlyHarvest ? earlyHarvestReason : undefined,
      partial,
      notes:               notes || undefined,
      warehouseEntries,
    };

    await onSubmit(payload);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 p-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
          <Leaf size={13} className="text-emerald-600" />
        </div>
        <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">
          Tạo bản ghi thu hoạch
        </span>
      </div>

      {/* ── Thông tin cơ bản ── */}
      <div className="space-y-3">

        {/* Ngày + Đơn vị */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className={labelCls}>Ngày thu hoạch *</label>
            <input
              type="date"
              value={harvestDate}
              max={today}
              onChange={e => setHarvestDate(e.target.value)}
              className={inputCls.replace('text-[11px]', 'text-[12px]').replace('px-2.5 py-1.5', 'px-3 py-2')}
            />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Đơn vị *</label>
            <select
              value={unitId}
              onChange={e => setUnitId(e.target.value)}
              className={inputCls.replace('text-[11px]', 'text-[12px]').replace('px-2.5 py-1.5', 'px-3 py-2')}
            >
              <option value="">-- Chọn --</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.code} — {u.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sản lượng + Đơn giá */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className={labelCls}>Sản lượng *</label>
            <input
              type="number" min="0.001" step="0.001" placeholder="VD: 100"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className={inputCls.replace('text-[11px]', 'text-[12px]').replace('px-2.5 py-1.5', 'px-3 py-2')}
            />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Đơn giá (VNĐ)</label>
            <input
              type="number" min="0" placeholder="VD: 5000"
              value={unitPrice}
              onChange={e => setUnitPrice(e.target.value)}
              className={inputCls.replace('text-[11px]', 'text-[12px]').replace('px-2.5 py-1.5', 'px-3 py-2')}
            />
          </div>
        </div>

        {/* Cấp chất lượng */}
        <div className="space-y-1">
          <label className={labelCls}>Cấp chất lượng</label>
          <select
            value={qualityGradeId}
            onChange={e => setQualityGradeId(e.target.value)}
            className={inputCls.replace('text-[11px]', 'text-[12px]').replace('px-2.5 py-1.5', 'px-3 py-2')}
          >
            <option value="">-- Không phân loại --</option>
            {qualityGrades.map(g => (
              <option key={g.id} value={g.id}>{g.code} — {g.name}</option>
            ))}
          </select>
        </div>

        {/* Lô đất */}
        {plots.length > 0 && (
          <div className="space-y-1">
            <label className={labelCls}>Lô đất</label>
            <select
              value={plotId}
              onChange={e => setPlotId(e.target.value)}
              className={inputCls.replace('text-[11px]', 'text-[12px]').replace('px-2.5 py-1.5', 'px-3 py-2')}
            >
              <option value="">-- Tất cả lô --</option>
              {plots.map(p => (
                <option key={p.plotId} value={p.plotId}>{p.plotName}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Thông tin thêm (toggle) ── */}
      <button
        type="button"
        onClick={() => setShowAdvanced(v => !v)}
        className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
      >
        {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        Thông tin thêm
      </button>

      {showAdvanced && (
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <label className={labelCls}>Người thu hoạch</label>
            <select
              value={harvestedBy}
              onChange={e => setHarvestedBy(e.target.value)}
              className={inputCls.replace('text-[11px]', 'text-[12px]').replace('px-2.5 py-1.5', 'px-3 py-2')}
            >
              <option value="">-- Không chỉ định --</option>
              {members.map(m => (
                <option key={m.userId} value={m.userId}>{m.fullName}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox" checked={earlyHarvest}
                onChange={e => setEarlyHarvest(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-emerald-500"
              />
              <span className="text-[11px] font-medium text-slate-600">Thu hoạch sớm</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox" checked={partial}
                onChange={e => setPartial(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-emerald-500"
              />
              <span className="text-[11px] font-medium text-slate-600">Thu hoạch một phần</span>
            </label>
          </div>

          {earlyHarvest && (
            <div className="space-y-1">
              <label className={labelCls}>Lý do thu hoạch sớm *</label>
              <textarea
                rows={2} placeholder="Nhập lý do..."
                value={earlyHarvestReason}
                onChange={e => setEarlyHarvestReason(e.target.value)}
                className={inputCls.replace('text-[11px]', 'text-[12px]').replace('px-2.5 py-1.5', 'px-3 py-2') + ' resize-none'}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className={labelCls}>Ghi chú</label>
            <textarea
              rows={2} placeholder="Ghi chú thêm..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className={inputCls.replace('text-[11px]', 'text-[12px]').replace('px-2.5 py-1.5', 'px-3 py-2') + ' resize-none'}
            />
          </div>
        </div>
      )}

      {/* ── Điểm nhập kho ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Warehouse size={10} /> Nhập kho *
            </p>
            {harvestQty > 0 && (
              <span className={cn(
                'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                qtyMismatch
                  ? 'bg-red-50 text-red-500'
                  : 'bg-emerald-50 text-emerald-600',
              )}>
                {totalEntryQty.toFixed(3)}/{harvestQty}
              </span>
            )}
          </div>
          <button
            type="button" onClick={addEntry}
            className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <Plus size={11} /> Thêm dòng
          </button>
        </div>

        {qtyMismatch && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-red-50 rounded-xl border border-red-100">
            <AlertCircle size={11} className="text-red-500 flex-shrink-0" />
            <p className="text-[10px] text-red-600 font-medium">
              Tổng nhập kho phải bằng sản lượng thu hoạch ({harvestQty})
            </p>
          </div>
        )}

        <div className="space-y-2">
          {entries.map((entry, idx) => (
            <EntryCard
              key={entry._key}
              idx={idx}
              entry={entry}
              warehouses={warehouses}
              warehouseItems={warehouseItems[entry.warehouseId] ?? []}
              warehouseLocations={warehouseLocations[entry.warehouseId] ?? []}
              canRemove={entries.length > 1}
              onRemove={() => removeEntry(entry._key)}
              onUpdate={patch => updateEntry(entry._key, patch)}
            />
          ))}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-2 pt-2">
        <button
          type="button" onClick={onCancel} disabled={submitting}
          className="flex-1 px-4 py-2.5 text-[12px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
        >
          Huỷ
        </button>
        <button
          type="button" onClick={handleSubmit}
          disabled={submitting || qtyMismatch}
          className="flex-1 px-4 py-2.5 text-[12px] font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {submitting
            ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Leaf size={12} />}
          Lưu thu hoạch
        </button>
      </div>
    </div>
  );
}

// ─── EntryCard sub-component ──────────────────────────────────────────────────

interface EntryCardProps {
  idx: number;
  entry: EntryRow;
  warehouses: WarehouseOption[];
  warehouseItems: WarehouseItemOption[];
  warehouseLocations: WarehouseLocationOption[];
  canRemove: boolean;
  onRemove: () => void;
  onUpdate: (patch: Partial<Omit<EntryRow, '_key'>>) => void;
}

function EntryCard({
  idx, entry, warehouses, warehouseItems, warehouseLocations,
  canRemove, onRemove, onUpdate,
}: EntryCardProps) {
  const warehouseSelected = !!entry.warehouseId;

  return (
    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">

      {/* Row header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400">Dòng {idx + 1}</span>
        {canRemove && (
          <button
            type="button" onClick={onRemove}
            className="text-slate-300 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* 1. Chọn kho */}
      <div className="space-y-1">
        <label className={labelCls}>Kho nhận *</label>
        <select
          value={entry.warehouseId}
          onChange={e => onUpdate({ warehouseId: e.target.value })}
          className={inputCls}
        >
          <option value="">-- Chọn kho --</option>
          {warehouses.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      {/* 2. Chọn vị trí */}
      <div className="space-y-1">
        <label className={labelCls}>Vị trí trong kho *</label>
        <select
          value={entry.warehouseLocationId}
          disabled={!warehouseSelected}
          onChange={e => onUpdate({ warehouseLocationId: e.target.value })}
          className={inputCls}
        >
          <option value="">-- Chọn vị trí --</option>
          {warehouseLocations.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
      </div>

      {/* 3. Sản phẩm thu hoạch — toggle mode */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className={labelCls}>Sản phẩm thu hoạch *</label>

          {/* Toggle new / existing — chỉ hiện khi đã chọn kho và có item */}
          {warehouseSelected && warehouseItems.length > 0 && (
            <button
              type="button"
              onClick={() => onUpdate({ mode: entry.mode === 'new' ? 'existing' : 'new' })}
              className="flex items-center gap-1 text-[9px] font-semibold text-slate-400 hover:text-indigo-500 transition-colors"
            >
              {entry.mode === 'new' ? (
                <><RotateCcw size={9} /> Dùng sản phẩm đã có</>
              ) : (
                <><PackagePlus size={9} /> Tạo sản phẩm mới</>
              )}
            </button>
          )}
        </div>

        {entry.mode === 'new' ? (
          /* ── Mode: tạo sản phẩm mới ── */
          <div className="space-y-1">
            <input
              type="text"
              placeholder="VD: Lúa ST25 vụ Hè Thu 2025"
              value={entry.productName}
              disabled={!warehouseSelected}
              onChange={e => onUpdate({ productName: e.target.value })}
              className={inputCls}
            />
            <p className="text-[9px] text-slate-400 leading-relaxed pl-0.5">
              Nếu chưa có mặt hàng này trong kho, hệ thống sẽ tự tạo mới.
            </p>
          </div>
        ) : (
          /* ── Mode: dùng sản phẩm đã có ── */
          <div className="space-y-1">
            <select
              value={entry.warehouseItemId}
              disabled={!warehouseSelected}
              onChange={e => onUpdate({ warehouseItemId: e.target.value })}
              className={inputCls}
            >
              <option value="">-- Chọn sản phẩm --</option>
              {warehouseItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}{item.unitCode ? ` (${item.unitCode})` : ''}
                </option>
              ))}
            </select>
            <p className="text-[9px] text-slate-400 leading-relaxed pl-0.5">
              Chọn mặt hàng đã có để cộng dồn vào tồn kho hiện tại.
            </p>
          </div>
        )}
      </div>

      {/* 4. Số lượng */}
      <div className="space-y-1">
        <label className={labelCls}>Số lượng *</label>
        <input
          type="number" min="0.001" step="0.001" placeholder="Số lượng nhập"
          value={entry.qty}
          onChange={e => onUpdate({ qty: e.target.value })}
          className={inputCls}
        />
      </div>
    </div>
  );
}