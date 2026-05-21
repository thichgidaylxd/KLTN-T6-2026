import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wheat, BarChart3, TrendingUp, Package, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const HarvestDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'summary' | 'list' | 'comparison' | 'by-stage' | 'by-plot'>('summary');

  const tabs = [
    {
      id: 'summary',
      label: 'Tóm tắt mùa vụ',
      icon: BarChart3,
      description: 'Thống kê tổng quan',
    },
    {
      id: 'list',
      label: 'Danh sách thu hoạch',
      icon: Package,
      description: 'Toàn bộ lần thu hoạch',
    },
    {
      id: 'comparison',
      label: 'So sánh mùa vụ',
      icon: TrendingUp,
      description: 'So sánh giữa các mùa',
    },
    {
      id: 'by-stage',
      label: 'Theo giai đoạn',
      icon: Clock,
      description: 'Thu hoạch theo giai đoạn',
    },
    {
      id: 'by-plot',
      label: 'Theo lô đất',
      icon: Wheat,
      description: 'Thu hoạch theo lô đất',
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
              <Wheat size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Quản lý Thu hoạch</h1>
          </div>
          <p className="text-slate-500 font-medium">Theo dõi và quản lý toàn bộ dữ liệu thu hoạch</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              whileHover={{ y: -2 }}
              className={`p-4 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg'
                  : 'bg-white border-slate-100 text-slate-700 hover:border-emerald-200'
              }`}
            >
              <Icon size={24} className="mb-2" />
              <p className="text-sm font-bold">{tab.label}</p>
              <p className="text-xs opacity-75">{tab.description}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={selectedTab}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
      >
        <div className="h-96 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">
              {tabs.find(t => t.id === selectedTab)?.label}
            </p>
            <p className="text-sm">
              Nội dung cho tab này sẽ được tải từ component tương ứng
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 rounded-2xl border border-emerald-200"
        >
          <h3 className="font-bold text-emerald-900 mb-2">Thêm Thu hoạch Mới</h3>
          <p className="text-sm text-emerald-700 mb-4">Ghi nhận một lần thu hoạch mới</p>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white w-full">
            Tạo thu hoạch
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-2xl border border-blue-200"
        >
          <h3 className="font-bold text-blue-900 mb-2">Báo cáo Chi tiết</h3>
          <p className="text-sm text-blue-700 mb-4">Xem các báo cáo chi phí và doanh thu</p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">
            Xem báo cáo
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 rounded-2xl border border-purple-200"
        >
          <h3 className="font-bold text-purple-900 mb-2">So Sánh Mùa Vụ</h3>
          <p className="text-sm text-purple-700 mb-4">So sánh hiệu suất giữa các mùa</p>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full">
            So sánh
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
