import React from 'react';
import { 
  Bug, 
  Search, 
  Filter, 
  Download, 
  Plus
} from 'lucide-react';

export const PestDiseaseReportPage: React.FC = () => {

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shadow-inner">
              <Bug size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                Lịch sử báo cáo sâu bệnh
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Theo dõi và quản lý các vấn đề dịch hại tại trang trại
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-semibold text-sm shadow-sm">
            <Download size={18} />
            Xuất báo cáo
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold text-sm shadow-sm shadow-red-200">
            <Plus size={18} />
            Tạo báo cáo mới
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Tìm kiếm theo tên bệnh, lô trồng..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>
          
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 transition-all font-semibold text-sm h-full shrink-0">
            <Filter size={18} />
            Lọc
          </button>
        </div>

        {/* Status tabs/pills could go here */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
          <button className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-bold whitespace-nowrap border border-red-100">
            Tất cả
          </button>
          <button className="px-4 py-2 bg-white text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-semibold whitespace-nowrap border border-transparent">
            Chưa xử lý
          </button>
          <button className="px-4 py-2 bg-white text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-semibold whitespace-nowrap border border-transparent">
            Đang theo dõi
          </button>
          <button className="px-4 py-2 bg-white text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-semibold whitespace-nowrap border border-transparent">
            Đã khắc phục
          </button>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Mã BC</th>
                <th className="px-6 py-4">Loại dịch hại</th>
                <th className="px-6 py-4">Vị trí lô</th>
                <th className="px-6 py-4">Ngày phát hiện</th>
                <th className="px-6 py-4">Mức độ</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Empty state when no data is provided */}
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <Bug size={32} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600 mb-1">Chưa có dữ liệu báo cáo</p>
                    <p className="text-xs text-slate-500">Dữ liệu sẽ được hiển thị khi API được tích hợp.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between mt-auto">
          <p className="text-xs font-semibold text-slate-500">
            Hiển thị <span className="text-slate-800">0</span> báo cáo
          </p>
          <div className="flex items-center gap-1">
            <button disabled className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-400 opacity-50 cursor-not-allowed">
              Trước
            </button>
            <button disabled className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-400 opacity-50 cursor-not-allowed">
              Tiếp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PestDiseaseReportPage;
