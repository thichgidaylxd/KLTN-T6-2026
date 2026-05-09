import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ChevronRight,
  Package,
  Loader2,
  Calendar,
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  Download,
  Filter,
  Search,
} from 'lucide-react';
import { usePlanWorkLogs, useWorkLogSummary } from '@/hooks/workLog/useWorkLogs';
import { WorkLog, WorkLogSummary } from '@/types/workLog/workLog';
import { formatDate, formatCurrency } from '@/utils/format';
import { SeasonPlan } from '@/types/seasonPlan';
import { cn } from '@/utils/cn';
import { extractErrorMessage } from '@/utils/errorUtils';
import { WorkLogDetailModal } from './WorkLogDetailModal';
import { EmployeeWorkLogModal } from './EmployeeWorkLogModal';

interface AttendanceManagementProps {
  plan: SeasonPlan;
}

type ViewMode = 'HISTORY' | 'SUMMARY';

export function AttendanceManagement({ plan }: AttendanceManagementProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('SUMMARY');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);

  // Cho phép người dùng tùy chỉnh khoảng thời gian lọc (mặc định lấy theo kế hoạch)
  const [dateRange, setDateRange] = useState({
    from: plan.startDate?.split('T')[0] || '',
    to: plan.endDate?.split('T')[0] || ''
  });
  // Chỉ fetch khi người dùng mở đúng tab tương ứng
  // Sử dụng API lấy nhật ký theo Plan (chuẩn theo tài liệu backend)
  const { data: workLogs = [], isLoading: historyLoading } = usePlanWorkLogs(
    plan.id, dateRange.from, dateRange.to,
    viewMode === 'HISTORY'
  );
  const { data: summary = [], isLoading: summaryLoading, isError: summaryError, error: summaryErrorInfo } = useWorkLogSummary(
    dateRange.from, dateRange.to,
    viewMode === 'SUMMARY'
  );

  const filteredLogs = useMemo((): WorkLog[] => {
    if (!workLogs) return [];

    let logs = (workLogs as WorkLog[]);

    // 2. Lọc theo Search Term (API đã lọc theo Plan rồi)
    if (!searchTerm) return logs;

    const q = searchTerm.toLowerCase();
    return logs.filter(log =>
      (log.employee?.fullName || log.employeeName || '').toLowerCase().includes(q) ||
      (log.task?.name || log.taskName || '').toLowerCase().includes(q) ||
      (log.notes || '').toLowerCase().includes(q)
    );
  }, [workLogs, plan.phases, searchTerm]);

  const handleShowDetail = (logId: string) => {
    setSelectedLogId(logId);
    setIsDetailModalOpen(true);
  };

  const totalStats = useMemo(() => {
    return (summary as WorkLogSummary[]).reduce((acc, curr) => ({
      workDays: acc.workDays + curr.totalWorkDays,
      overtime: acc.overtime + curr.totalOvertimeDays,
      wage: acc.wage + curr.totalWage
    }), { workDays: 0, overtime: 0, wage: 0 });
  }, [summary]);

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC]">
      {/* Premium Header Section */}
      <div className="bg-white border-b border-slate-200/60 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-8 pt-8 pb-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Users size={22} className="text-white" />
                </div>
                <h2 className="text-[22px] font-black text-slate-900 tracking-tight">
                  Quản lý lao động
                </h2>
              </div>
              <p className="text-[13px] text-slate-500 font-medium ml-[52px]">
                Theo dõi chi tiết công và lương của nhân sự trong dự án
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhân sự, công việc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-[260px] font-medium"
                />
              </div>
              <div className="flex bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">
                <div className="relative group flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="text-[12px] font-bold text-slate-700 tabular-nums min-w-[70px] text-center">
                    {dateRange.from ? formatDate(dateRange.from) : 'Bắt đầu'}
                  </span>
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  />
                </div>

                <div className="w-[1px] bg-slate-200 self-stretch my-2" />

                <div className="relative group flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors">
                  <span className="text-[12px] font-bold text-slate-700 tabular-nums min-w-[70px] text-center">
                    {dateRange.to ? formatDate(dateRange.to) : 'Kết thúc'}
                  </span>
                  <Calendar size={14} className="text-slate-400" />
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  />
                </div>
              </div>

              <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 rounded-2xl border border-slate-200 text-[13px] font-bold hover:bg-slate-50 transition-all shadow-sm">
                <Download size={16} /> Xuất báo cáo
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => setViewMode('SUMMARY')}
              className={cn(
                "pb-4 text-[14px] font-black transition-all relative group",
                viewMode === 'SUMMARY' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div className="flex items-center gap-2"><TrendingUp size={18} />Tổng hợp công</div>
              {viewMode === 'SUMMARY' && <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
            </button>
            <button
              onClick={() => setViewMode('HISTORY')}
              className={cn(
                "pb-4 text-[14px] font-black transition-all relative group",
                viewMode === 'HISTORY' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div className="flex items-center gap-2"><BookOpen size={18} />Lịch sử nhật ký</div>
              {viewMode === 'HISTORY' && <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <AnimatePresence mode="wait">
            {viewMode === 'SUMMARY' ? (
              <motion.div
                key="summary-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Visual Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-[32px] border border-slate-200/60 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                      <Clock size={80} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                        <Clock size={24} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[2px]">Thời gian</p>
                        <h4 className="text-[14px] font-bold text-slate-900">Tổng ngày công</h4>
                      </div>
                    </div>
                    <div className="text-[32px] font-black text-slate-900 tracking-tight">
                      {totalStats.workDays} <span className="text-[16px] text-slate-400 font-bold ml-1">ngày</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-[32px] border border-slate-200/60 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                      <TrendingUp size={80} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                        <TrendingUp size={24} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[2px]">Năng suất</p>
                        <h4 className="text-[14px] font-bold text-slate-900">Giờ tăng ca</h4>
                      </div>
                    </div>
                    <div className="text-[32px] font-black text-slate-900 tracking-tight">
                      {totalStats.overtime} <span className="text-[16px] text-slate-400 font-bold ml-1">giờ</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-[32px] border border-slate-200/60 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                      <DollarSign size={80} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <DollarSign size={24} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[2px]">Tài chính</p>
                        <h4 className="text-[14px] font-bold text-slate-900">Dự kiến chi trả</h4>
                      </div>
                    </div>
                    <div className="text-[32px] font-black text-emerald-600 tracking-tight">
                      {formatCurrency(totalStats.wage)}
                    </div>
                  </div>
                </div>

                {/* Summary Table */}
                <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-[16px] font-black text-slate-900 flex items-center gap-2">
                      <Filter size={18} className="text-slate-400" />
                      Chi tiết bảng công
                    </h3>
                  </div>
                  {summaryLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center">
                      <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
                      <p className="text-[14px] font-bold text-slate-500">Đang đồng bộ dữ liệu...</p>
                    </div>
                  ) : summaryError ? (
                    <div className="py-24 flex flex-col items-center justify-center text-red-500">
                      <div className="w-20 h-20 bg-red-50 rounded-[28px] flex items-center justify-center mb-6">
                        <Filter size={32} />
                      </div>
                      <p className="text-[15px] font-bold">Lỗi khi tải bảng tổng hợp công</p>
                      <p className="text-[12px] opacity-70 mt-2">{extractErrorMessage(summaryErrorInfo)}</p>
                    </div>
                  ) : summary.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center text-slate-400">
                      <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center mb-6">
                        <Calendar size={32} />
                      </div>
                      <p className="text-[15px] font-bold">Chưa có dữ liệu lao động trong khoảng thời gian này</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[2px]">Nhân viên</th>
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[2px] text-center">Tổng ngày công</th>
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[2px] text-center">Tăng ca (giờ)</th>
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[2px] text-right">Thành tiền</th>
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[2px] text-center">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {summary.map((emp) => (
                            <tr
                              key={emp.employeeId}
                              className="hover:bg-slate-50/40 transition-colors group cursor-pointer"
                              onClick={() => {
                                setSelectedEmployee({ id: emp.employeeId, name: emp.employeeName || 'N/A' });
                                setIsEmployeeModalOpen(true);
                              }}
                            >
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center text-indigo-600 font-black text-sm border border-indigo-100 shadow-sm">
                                    {emp.employeeName?.charAt(0) || 'N'}
                                  </div>
                                  <div>
                                    <div className="text-[14px] font-black text-slate-900 mb-0.5 group-hover:text-indigo-600 transition-colors">{emp.employeeName || 'N/A'}</div>
                                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">ID: {emp.employeeId.slice(0, 8)}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5 text-center">
                                <span className="inline-flex items-center px-3 py-1 bg-blue-50/50 text-blue-600 rounded-xl text-[14px] font-black border border-blue-100/50">{emp.totalWorkDays}</span>
                              </td>
                              <td className="px-8 py-5 text-center">
                                <span className="inline-flex items-center px-3 py-1 bg-amber-50/50 text-amber-600 rounded-xl text-[14px] font-black border border-amber-100/50">{emp.totalOvertimeDays}</span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <div className="text-[14px] font-black text-slate-900 tracking-tight">{formatCurrency(emp.totalWage)}</div>
                              </td>
                              <td className="px-8 py-5 text-center">
                                <button className="p-2.5 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 rounded-2xl transition-all">
                                  <ChevronRight size={20} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="history-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {historyLoading ? (
                  <div className="py-24 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
                    <p className="text-[14px] font-bold text-slate-500">Đang tải dòng thời gian...</p>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="py-24 flex flex-col items-center justify-center text-slate-400 text-center">
                    <div className="w-20 h-20 bg-white rounded-[28px] flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                      <BookOpen size={32} />
                    </div>
                    <h3 className="text-[16px] font-black text-slate-900 mb-2">Không tìm thấy nhật ký</h3>
                    <p className="text-[13px] text-slate-500 max-w-sm font-medium">Hãy thử thay đổi từ khóa tìm kiếm hoặc kiểm tra lại các ghi nhận công việc.</p>
                  </div>
                ) : (
                  filteredLogs.map((log, index) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      key={log.id}
                      className="bg-white border border-slate-200/60 rounded-[28px] p-5 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <div className="px-3 py-1 bg-slate-900 text-white rounded-xl text-[12px] font-black">
                              {formatDate(log.workDate)}
                            </div>
                            <span className={cn(
                              "text-[10px] px-2.5 py-1 rounded-xl font-black uppercase tracking-[1px] border",
                              (log.isOverTime || log.type === 'OVERTIME')
                                ? "bg-amber-50 text-amber-600 border-amber-100"
                                : "bg-indigo-50 text-indigo-600 border-indigo-100"
                            )}>
                              {(log.isOverTime || log.type === 'OVERTIME') ? 'Tăng ca' : 'Chính thức'}
                            </span>
                            <div className="flex items-center gap-2 text-[12px] font-bold text-indigo-600 bg-indigo-50/50 px-3 py-1 rounded-xl border border-indigo-100/30">
                              <Package size={14} />
                              <span className="truncate max-w-[240px]">{log.task?.name || log.taskName || 'Công việc'}</span>
                            </div>
                          </div>

                          <p className="text-[14px] text-slate-700 font-medium leading-[1.6] mb-4 pl-1">
                            {log.notes || <span className="text-slate-300 italic font-normal">Không có ghi chú cho phiên làm việc này</span>}
                          </p>

                          <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-[11px] border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                {(log.employee?.fullName || log.employeeName || 'N').charAt(0)}
                              </div>
                              <span className="text-[13px] font-bold text-slate-900">{log.employee?.fullName || log.employeeName || 'Chưa xác định'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[12px] text-slate-500 font-bold">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              <span>Vật tư: (Xem chi tiết)</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 self-center">
                          <button
                            onClick={() => handleShowDetail(log.id)}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white hover:bg-indigo-600 rounded-2xl transition-all shadow-lg shadow-slate-200 hover:shadow-indigo-200"
                          >
                            <span className="text-[12px] font-black">Chi tiết</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {selectedLogId && (
        <WorkLogDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          workLogId={selectedLogId}
        />
      )}

      {selectedEmployee && (
        <EmployeeWorkLogModal
          isOpen={isEmployeeModalOpen}
          onClose={() => setIsEmployeeModalOpen(false)}
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
          from={dateRange.from}
          to={dateRange.to}
        />
      )}
    </div>
  );
}
