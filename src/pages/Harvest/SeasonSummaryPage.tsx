import React from 'react';
import { motion } from 'framer-motion';
import { Wheat, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const SeasonSummaryPage: React.FC = () => {
  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
              <Wheat size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Tổng kết mùa vụ</h1>
          </div>
          <p className="text-slate-500 font-medium">
            Quản lý và thống kê sản lượng thu hoạch của các mùa vụ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 bg-white rounded-xl h-11 border-slate-200">
            <Filter size={18} />
            Lọc báo cáo
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 shadow-sm">
            <Plus size={18} />
            Tạo báo cáo mới
          </Button>
        </div>
      </div>

      {/* Stats Cards Mockup */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
        >
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Tổng sản lượng</p>
          <p className="text-3xl font-black text-slate-800">0 <span className="text-lg text-slate-500 font-semibold">kg</span></p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
        >
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Mùa vụ đã hoàn thành</p>
          <p className="text-3xl font-black text-slate-800">0</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
        >
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Doanh thu dự kiến</p>
          <p className="text-3xl font-black text-slate-800">0 <span className="text-lg text-slate-500 font-semibold">VNĐ</span></p>
        </motion.div>
      </div>

      {/* Main Content Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Danh sách báo cáo thu hoạch</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm báo cáo..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>
        <div className="p-16 flex flex-col items-center justify-center text-slate-400">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
            <Wheat size={40} className="text-slate-300" />
          </div>
          <p className="text-lg font-semibold text-slate-600 mb-2">Chưa có dữ liệu thu hoạch</p>
          <p className="text-sm text-slate-500 text-center max-w-md">
            Hiện tại trang trại của bạn chưa có bất kỳ báo cáo tổng kết mùa vụ nào. Hãy tạo báo cáo mới khi đến kỳ thu hoạch nhé.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
