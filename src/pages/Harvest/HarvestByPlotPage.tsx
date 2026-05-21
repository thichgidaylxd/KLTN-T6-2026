import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { useHarvestsByPlot, useHarvestSummaryByPlot } from '@/hooks/harvest/useHarvest';

interface HarvestByPlotPageProps {
  planId?: string;
  plotId?: string;
  plotName?: string;
}

export const HarvestByPlotPage: React.FC<HarvestByPlotPageProps> = ({ 
  planId: propPlanId, 
  plotId: propPlotId, 
  plotName: propPlotName 
}) => {
  const { planId: paramPlanId, plotId: paramPlotId, plotName: paramPlotName } = useParams<{ 
    planId: string; 
    plotId: string; 
    plotName: string 
  }>();
  
  const planId = propPlanId || paramPlanId || '';
  const plotId = propPlotId || paramPlotId || '';
  const plotName = propPlotName || paramPlotName || '';
  
  const [page, setPage] = useState(0);
  const { data: harvests, isLoading: harvestLoading } = useHarvestsByPlot(planId, plotId, page, 10);
  const { data: summaryData, isLoading: summaryLoading } = useHarvestSummaryByPlot(planId, plotId);

  if (harvestLoading || summaryLoading) {
    return (
      <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const summary = summaryData?.[0];
  const harvestList = harvests?.content || [];

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Thu hoạch theo lô đất</h1>
        <p className="text-slate-500 font-medium">{plotName}</p>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
          >
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Tổng lô</p>
            <p className="text-3xl font-black text-slate-800">{summary.totalBatches}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
          >
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Tổng sản lượng</p>
            <p className="text-3xl font-black text-slate-800">
              {summary.totalQuantity} <span className="text-lg text-slate-500 font-semibold">{summary.unitCode}</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
          >
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Tổng doanh thu</p>
            <p className="text-3xl font-black text-slate-800">
              {summary.totalRevenue?.toLocaleString('vi-VN')} <span className="text-lg text-slate-500 font-semibold">₫</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
          >
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Khoảng thời gian</p>
            <p className="text-sm font-bold text-slate-700">
              {new Date(summary.firstHarvestDate).toLocaleDateString('vi-VN')} -<br />
              {new Date(summary.lastHarvestDate).toLocaleDateString('vi-VN')}
            </p>
          </motion.div>
        </div>
      )}

      {/* Harvests Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Lô #</th>
                <th className="px-6 py-4">Ngày thu hoạch</th>
                <th className="px-6 py-4">Sản lượng</th>
                <th className="px-6 py-4">Chất lượng</th>
                <th className="px-6 py-4">Đơn giá</th>
                <th className="px-6 py-4">Doanh thu</th>
                <th className="px-6 py-4">Thu hoạch sớm</th>
                <th className="px-6 py-4">Riêng phần</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {harvestList.length > 0 ? (
                harvestList.map((harvest: any) => (
                  <tr key={harvest.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">#{harvest.batchNumber}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(harvest.harvestDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {harvest.quantity} {harvest.unitCode}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                        {harvest.qualityGradeName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {harvest.unitPrice?.toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      {harvest.estimatedRevenue?.toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {harvest.earlyHarvest ? (
                        <span className="text-yellow-600 font-semibold">Có</span>
                      ) : (
                        <span className="text-slate-500">Không</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {harvest.partial ? (
                        <span className="text-orange-600 font-semibold">Có</span>
                      ) : (
                        <span className="text-slate-500">Không</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <AlertCircle size={32} className="mb-3 opacity-50" />
                      <p className="text-sm font-semibold">Chưa có dữ liệu thu hoạch</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};
