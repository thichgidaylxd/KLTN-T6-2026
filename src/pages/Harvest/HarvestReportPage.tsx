import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2, Package, Users, TrendingDown, TrendingUp,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { useMaterialCost, useLaborCost } from '@/hooks/harvest/useHarvest';
import type { MaterialCostItem, LaborCostItem } from '@/types/harvest/harvest';

const fmt = (v?: number | null) => v?.toLocaleString('vi-VN') ?? '0';

// ─── Material Cost Report ───────────────────────────────────────
export const MaterialCostReport: React.FC<{ farmId: string; planId: string }> = ({ farmId, planId }) => {
  const { data, isLoading, error } = useMaterialCost(farmId, planId);

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-emerald-600" /></div>;
  if (error || !data) return <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl">Không thể tải dữ liệu vật tư.</div>;

  const items: MaterialCostItem[] = data.items ?? [];
  const maxCost = Math.max(...items.map(i => i.totalCost ?? 0), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={18} className="text-emerald-600" />
          <span className="font-bold text-slate-800">Chi phí vật tư</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Tổng cộng</p>
          <p className="font-bold text-slate-800">{fmt(data.totalMaterialCost)} ₫</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">Chưa có dữ liệu vật tư.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const usedRatio = item.plannedQty > 0 ? item.usedQty / item.plannedQty : 0;
            const overUsed  = item.usedQty > item.plannedQty;
            return (
              <motion.div
                key={item.warehouseItemId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border border-slate-100 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{item.warehouseItemName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{fmt(item.unitPrice)} ₫ / {item.unitCode}</p>
                  </div>
                  <p className="font-bold text-slate-800 text-sm">{fmt(item.totalCost)} ₫</p>
                </div>

                {/* Usage bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Sử dụng: {item.usedQty} / {item.plannedQty} {item.unitCode}</span>
                    <span className={overUsed ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                      {overUsed ? `+${Math.abs(item.deviation)} vượt` : item.deviation === 0 ? 'Đúng kế hoạch' : `${Math.abs(item.deviation)} còn dư`}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${overUsed ? 'bg-red-400' : 'bg-emerald-400'}`}
                      style={{ width: `${Math.min(usedRatio * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Cost bar relative to max */}
                <div className="mt-2 h-1 bg-slate-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-300 rounded-full"
                    style={{ width: `${((item.totalCost ?? 0) / maxCost) * 100}%` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Table summary */}
      {items.length > 0 && (
        <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
          <table className="w-full text-xs">
            <thead className="border-b border-slate-100">
              <tr>
                <th className="text-left py-2.5 px-3 font-semibold text-slate-500">Vật tư</th>
                <th className="text-center py-2.5 px-3 font-semibold text-slate-500">KH</th>
                <th className="text-center py-2.5 px-3 font-semibold text-slate-500">Dùng</th>
                <th className="text-center py-2.5 px-3 font-semibold text-slate-500">Đơn giá</th>
                <th className="text-right py-2.5 px-3 font-semibold text-slate-500">Chi phí</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map(item => (
                <tr key={item.warehouseItemId} className="hover:bg-white">
                  <td className="py-2 px-3 font-medium text-slate-700">{item.warehouseItemName}</td>
                  <td className="py-2 px-3 text-center text-slate-500">{item.plannedQty} {item.unitCode}</td>
                  <td className="py-2 px-3 text-center text-slate-500">{item.usedQty} {item.unitCode}</td>
                  <td className="py-2 px-3 text-center text-slate-500">{fmt(item.unitPrice)} ₫</td>
                  <td className="py-2 px-3 text-right font-semibold text-slate-800">{fmt(item.totalCost)} ₫</td>
                </tr>
              ))}
              <tr className="bg-white border-t border-slate-200">
                <td colSpan={4} className="py-2 px-3 font-bold text-slate-700">Tổng</td>
                <td className="py-2 px-3 text-right font-bold text-slate-800">{fmt(data.totalMaterialCost)} ₫</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

// ─── Labor Cost Report ──────────────────────────────────────────
export const LaborCostReport: React.FC<{ farmId: string; planId: string }> = ({ farmId, planId }) => {
  const { data, isLoading, error } = useLaborCost(farmId, planId);

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>;
  if (error || !data) return <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl">Không thể tải dữ liệu nhân công.</div>;

  const items: LaborCostItem[] = data.items ?? [];
  const maxWage = Math.max(...items.map(i => i.totalWage ?? 0), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-blue-600" />
          <span className="font-bold text-slate-800">Chi phí nhân công</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">{data.totalWorkDays} ngày công</p>
          <p className="font-bold text-slate-800">{fmt(data.totalLaborCost)} ₫</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">Chưa có dữ liệu nhân công.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <motion.div
              key={item.employeeId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white border border-slate-100 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                    {item.employeeName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{item.employeeName}</p>
                    <p className="text-xs text-slate-400">
                      {item.workDays} ngày công
                      {item.overtimeDays > 0 && ` + ${item.overtimeDays} tăng ca`}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-slate-800 text-sm">{fmt(item.totalWage)} ₫</p>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full"
                  style={{ width: `${((item.totalWage ?? 0) / maxWage) * 100}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Table */}
      {items.length > 0 && (
        <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
          <table className="w-full text-xs">
            <thead className="border-b border-slate-100">
              <tr>
                <th className="text-left py-2.5 px-3 font-semibold text-slate-500">Nhân viên</th>
                <th className="text-center py-2.5 px-3 font-semibold text-slate-500">Ngày công</th>
                <th className="text-center py-2.5 px-3 font-semibold text-slate-500">Tăng ca</th>
                <th className="text-right py-2.5 px-3 font-semibold text-slate-500">Lương</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map(item => (
                <tr key={item.employeeId} className="hover:bg-white">
                  <td className="py-2 px-3 font-medium text-slate-700">{item.employeeName}</td>
                  <td className="py-2 px-3 text-center text-slate-500">{item.workDays}</td>
                  <td className="py-2 px-3 text-center text-slate-500">{item.overtimeDays}</td>
                  <td className="py-2 px-3 text-right font-semibold text-slate-800">{fmt(item.totalWage)} ₫</td>
                </tr>
              ))}
              <tr className="bg-white border-t border-slate-200">
                <td colSpan={3} className="py-2 px-3 font-bold text-slate-700">Tổng</td>
                <td className="py-2 px-3 text-right font-bold text-slate-800">{fmt(data.totalLaborCost)} ₫</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

// ─── Combined Reports Page ──────────────────────────────────────
interface HarvestReportsPageProps {
  farmId: string;
  planId: string;
}

export const HarvestReportsPage: React.FC<HarvestReportsPageProps> = ({ farmId, planId }) => {
  const [activeTab, setActiveTab] = useState<'material' | 'labor'>('material');

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['material', 'labor'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'material' ? (
              <span className="flex items-center gap-1.5"><Package size={14} /> Vật tư</span>
            ) : (
              <span className="flex items-center gap-1.5"><Users size={14} /> Nhân công</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'material'
        ? <MaterialCostReport farmId={farmId} planId={planId} />
        : <LaborCostReport farmId={farmId} planId={planId} />}
    </div>
  );
};