import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Loader2, Package, Calendar, Search, ChevronLeft, ChevronRight,
  Wheat, MapPin, Star, Clock, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHarvestsByFarm } from '@/hooks/harvest/useHarvest';
import type { HarvestResponse } from '@/types/harvest/harvest';

// ─── Helpers ────────────────────────────────────────────────────
const fmt = (v?: number | null) => v?.toLocaleString('vi-VN') ?? '0';
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const GRADE_COLOR: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-700',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
};

// ─── Harvest Row Card ───────────────────────────────────────────
const HarvestCard: React.FC<{ harvest: HarvestResponse; index: number }> = ({ harvest, index }) => (
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
            <p className="font-semibold text-slate-800 text-sm">{harvest.planName}</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${GRADE_COLOR[harvest.qualityGradeCode] ?? 'bg-slate-100 text-slate-600'}`}>
              {harvest.qualityGradeName}
            </span>
            {harvest.earlyHarvest && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                <AlertTriangle size={10} /> Sớm
              </span>
            )}
            {harvest.partial && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                Một phần
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin size={10} /> {harvest.plotName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={10} /> {fmtDate(harvest.harvestDate)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} /> Lô #{harvest.batchNumber}
            </span>
          </div>
          {harvest.earlyHarvestReason && (
            <p className="text-xs text-orange-600 mt-1">Lý do: {harvest.earlyHarvestReason}</p>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="font-bold text-slate-800 text-sm">
          {harvest.quantity} <span className="text-slate-400 font-normal">{harvest.unitCode}</span>
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{fmt(harvest.estimatedRevenue)} ₫</p>
        {harvest.warehouseItemName && (
          <p className="text-xs text-blue-600 mt-1 flex items-center justify-end gap-1">
            <Package size={10} /> {harvest.warehouseItemName}
          </p>
        )}
      </div>
    </div>

    {harvest.notes && (
      <p className="mt-2 text-xs text-slate-400 border-t border-slate-50 pt-2">{harvest.notes}</p>
    )}
  </motion.div>
);

// ─── Main Page ──────────────────────────────────────────────────
export const HarvestListPage: React.FC = () => {
  const { farmId } = useParams<{ farmId: string }>();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');
  const [page, setPage]         = useState(0);
  const PAGE_SIZE = 10;

  const { data, isLoading, error } = useHarvestsByFarm(
    farmId ?? '',
    fromDate || undefined,
    toDate || undefined,
    page,
    PAGE_SIZE
  );

  const harvests   = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalItems = data?.totalElements ?? 0;

  const handleFilter = () => setPage(0);

  if (!farmId) return null;

  return (
    <div className="p-6 md:p-8 space-y-6 bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600"><Package size={22} /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Lịch sử thu hoạch</h1>
            <p className="text-sm text-slate-500">
              {totalItems > 0 ? `${totalItems} bản ghi` : 'Toàn bộ nông trại'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Từ ngày</label>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Đến ngày</label>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <Button
          onClick={handleFilter}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-4 gap-2 text-sm"
        >
          <Search size={15} /> Lọc
        </Button>
        {(fromDate || toDate) && (
          <Button
            variant="outline"
            onClick={() => { setFromDate(''); setToDate(''); setPage(0); }}
            className="rounded-xl h-10 text-sm"
          >
            Xoá lọc
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          Không thể tải dữ liệu.
        </div>
      ) : harvests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Package size={40} className="mb-3 opacity-30" />
          <p className="text-sm">Chưa có bản ghi thu hoạch nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {harvests.map((h, idx) => (
            <HarvestCard key={h.id} harvest={h} index={idx} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400">
            Trang {page + 1} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-xl"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-xl"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};