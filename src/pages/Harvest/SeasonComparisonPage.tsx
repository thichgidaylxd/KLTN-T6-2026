import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Filter, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompareSeasons } from '@/hooks/harvest/useHarvest';

interface SeasonComparisonPageProps {
  farmId?: string;
  selectedPlanIds?: string[];
}

export const SeasonComparisonPage: React.FC<SeasonComparisonPageProps> = ({ 
  farmId: propFarmId, 
  selectedPlanIds: propPlanIds 
}) => {
  const { farmId: paramFarmId } = useParams<{ farmId: string }>();
  const [searchParams] = useSearchParams();
  
  const farmId = propFarmId || paramFarmId || '';
  const planIdsFromUrl = searchParams.get('plans')?.split(',') || [];
  const selectedPlanIds = propPlanIds || planIdsFromUrl;
  
  const compareSeasons = useCompareSeasons();
  const [comparisonData, setComparisonData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (selectedPlanIds.length > 0 && farmId) {
      setIsLoading(true);
      compareSeasons
        .mutateAsync({ farmId, planIds: selectedPlanIds })
        .then((data) => {
          setComparisonData(data.data);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [selectedPlanIds, farmId]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!comparisonData || !comparisonData.seasons || comparisonData.seasons.length === 0) {
    return (
      <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-[calc(100vh-4rem)]">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Vui lòng chọn các kế hoạch để so sánh</p>
          </div>
        </div>
      </div>
    );
  }

  const seasons = comparisonData.seasons;

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">So sánh Mùa vụ</h1>
          <p className="text-slate-500 font-medium">{comparisonData.farmName}</p>
        </div>
        <Button variant="outline" className="gap-2 bg-white rounded-xl h-11 border-slate-200">
          <Filter size={18} />
          Bộ lọc
        </Button>
      </div>

      {/* Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Mùa vụ</th>
                <th className="px-6 py-4">Cây trồng</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Sản lượng</th>
                <th className="px-6 py-4">Doanh thu</th>
                <th className="px-6 py-4">Chi phí VT</th>
                <th className="px-6 py-4">Chi phí NL</th>
                <th className="px-6 py-4">Tổng chi phí</th>
                <th className="px-6 py-4">Lợi nhuận</th>
                <th className="px-6 py-4">Tỷ suất LN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {seasons.map((season: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-sm text-slate-700">{season.planName}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{season.cropName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(season.startDate).toLocaleDateString('vi-VN')} - {new Date(season.endDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                    {season.totalHarvestQuantity} {season.unitCode}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                    {season.totalRevenue?.toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {season.totalMaterialCost?.toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {season.totalLaborCost?.toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {season.totalCost?.toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    <span className={season.profitable ? 'text-green-600' : 'text-red-600'}>
                      {season.grossProfit?.toLocaleString('vi-VN')} ₫
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${season.profitable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {season.profitMarginPercent?.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Tổng doanh thu</p>
              <p className="text-2xl font-black text-slate-800">
                {seasons.reduce((sum: number, s: any) => sum + (s.totalRevenue || 0), 0).toLocaleString('vi-VN')} ₫
              </p>
            </div>
            <TrendingUp className="text-emerald-600" size={24} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Tổng chi phí</p>
              <p className="text-2xl font-black text-slate-800">
                {seasons.reduce((sum: number, s: any) => sum + (s.totalCost || 0), 0).toLocaleString('vi-VN')} ₫
              </p>
            </div>
            <TrendingUp className="text-red-600" size={24} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Tổng lợi nhuận</p>
              <p className="text-2xl font-black text-green-600">
                {seasons.reduce((sum: number, s: any) => sum + (s.grossProfit || 0), 0).toLocaleString('vi-VN')} ₫
              </p>
            </div>
            <TrendingUp className="text-green-600" size={24} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
