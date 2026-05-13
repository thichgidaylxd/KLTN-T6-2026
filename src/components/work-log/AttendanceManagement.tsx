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
  Lock,
  Unlock,
  AlertCircle,
} from 'lucide-react';
import { useFarmWorkLogs, useWorkLogSummary, usePlanWorkLogs, useWorkLogs } from '@/hooks/workLog/useWorkLogs';
import { useSeasonPlans } from '@/hooks/seasonPlans/useSeasonPlans';
import { toast } from 'sonner';
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

type ViewMode = 'HISTORY' | 'PLAN_HISTORY' | 'SUMMARY';

export function AttendanceManagement({ plan: initialPlan }: AttendanceManagementProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('SUMMARY');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    activePlanId: initialPlan.id,
    from: initialPlan.startDate?.split('T')[0] || '',
    to: initialPlan.endDate?.split('T')[0] || ''
  });

  const { plans = [] } = useSeasonPlans(initialPlan.farmId);

  const currentPlan = useMemo(() => {
    return plans.find(p => p.id === filters.activePlanId) || initialPlan;
  }, [plans, filters.activePlanId, initialPlan]);

  const handlePlanChange = (newPlanId: string) => {
    const newPlan = plans.find(p => p.id === newPlanId);
    setFilters(prev => ({
      ...prev,
      activePlanId: newPlanId,
      from: newPlan?.startDate?.split('T')[0] || prev.from,
      to: newPlan?.endDate?.split('T')[0] || prev.to
    }));
  };

  const handleDateChange = (type: 'from' | 'to', value: string) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  // Queries - Chỉ kích hoạt khi tab tương ứng được chọn và có đủ tham số lọc
  const { data: farmLogs = [], isLoading: farmLoading } = useFarmWorkLogs(
    initialPlan.farmId, filters.from, filters.to,
    viewMode === 'HISTORY' && !!filters.from && !!filters.to
  );

  const { data: planLogs = [], isLoading: planLoading, isError: planError, error: planErrorInfo } = usePlanWorkLogs(
    filters.activePlanId, filters.from, filters.to,
    viewMode === 'PLAN_HISTORY' && !!filters.activePlanId && !!filters.from && !!filters.to
  );

  const { data: summary = [], isLoading: summaryLoading, isError: summaryError, error: summaryErrorInfo } = useWorkLogSummary(
    filters.from, filters.to,
    viewMode === 'SUMMARY' && !!filters.from && !!filters.to
  );

  const workLogs = viewMode === 'HISTORY' ? farmLogs : planLogs;

  const filteredLogs = useMemo((): WorkLog[] => {
    if (!workLogs) return [];
    let logs = (workLogs as WorkLog[]);
    if (!searchTerm) return logs;
    const q = searchTerm.toLowerCase();
    return logs.filter(log =>
      (log.employee?.fullName || log.employeeName || '').toLowerCase().includes(q) ||
      (log.task?.name || log.taskName || '').toLowerCase().includes(q) ||
      (log.notes || '').toLowerCase().includes(q)
    );
  }, [workLogs, searchTerm]);

  const { lockWorkLog, unlockWorkLog } = useWorkLogs();
  const [isPatching, setIsPatching] = useState(false);

  const handleShowDetail = (logId: string) => {
    setSelectedLogId(logId);
    setIsDetailModalOpen(true);
  };

  const handleToggleLock = async (logId: string, isLocked: boolean) => {
    setIsPatching(true);
    try {
      if (isLocked) {
        await unlockWorkLog(logId);
        toast.success('Mở khóa nhật ký thành công');
      } else {
        await lockWorkLog(logId);
        toast.success('Chốt công thành công');
      }
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsPatching(false);
    }
  };

  const totalStats = useMemo(() => {
    return (summary as WorkLogSummary[]).reduce((acc, curr) => ({
      workDays: acc.workDays + curr.totalWorkDays,
      overtime: acc.overtime + curr.totalOvertimeDays,
      wage: acc.wage + curr.totalWage
    }), { workDays: 0, overtime: 0, wage: 0 });
  }, [summary]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC]">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200/60 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-8 pt-8 pb-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Users size={22} className="text-white" />
                </div>
                <h2 className="text-[22px] font-black text-slate-900 tracking-tight">
                  Quản lý chấm công
                </h2>
              </div>
              <p className="text-[13px] text-slate-500 font-medium ml-[52px]">
                Theo dõi chi tiết công và lương của nhân sự
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhân sự, công việc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] focus:ring-2 focus:ring-indigo-500/20 w-[260px] font-medium focus:outline-none"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden h-10">
                  <div 
                    className="relative flex items-center gap-2 px-3 hover:bg-slate-50 transition-colors border-r border-slate-100 cursor-pointer"
                    onClick={(e) => {
                      const input = e.currentTarget.querySelector('input');
                      if (input) {
                        try { (input as any).showPicker(); } catch (err) { input.focus(); }
                      }
                    }}
                  >
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-[12px] font-bold text-slate-700 whitespace-nowrap">
                      {filters.from ? formatDate(filters.from) : 'Bắt đầu'}
                    </span>
                    <input 
                      type="date" 
                      value={filters.from} 
                      onChange={(e) => handleDateChange('from', e.target.value)} 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full z-10" 
                    />
                  </div>
                  <div 
                    className="relative flex items-center gap-2 px-3 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={(e) => {
                      const input = e.currentTarget.querySelector('input');
                      if (input) {
                        try { (input as any).showPicker(); } catch (err) { input.focus(); }
                      }
                    }}
                  >
                    <span className="text-[12px] font-bold text-slate-700 whitespace-nowrap">
                      {filters.to ? formatDate(filters.to) : 'Kết thúc'}
                    </span>
                    <Calendar size={14} className="text-slate-400" />
                    <input 
                      type="date" 
                      value={filters.to} 
                      onChange={(e) => handleDateChange('to', e.target.value)} 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full z-10" 
                    />
                  </div>
                </div>
                <button className="flex items-center gap-2 h-10 px-4 bg-white text-slate-700 rounded-xl border border-slate-200 text-[13px] font-bold hover:bg-slate-50 transition-all shadow-sm">
                  <Download size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            {['SUMMARY', 'PLAN_HISTORY', 'HISTORY'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as ViewMode)}
                className={cn(
                  "pb-4 text-[14px] font-black transition-all relative group",
                  viewMode === mode ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <div className="flex items-center gap-2">
                  {mode === 'SUMMARY' && <TrendingUp size={18} />}
                  {mode === 'PLAN_HISTORY' && <Package size={18} />}
                  {mode === 'HISTORY' && <BookOpen size={18} />}
                  {mode === 'SUMMARY' ? 'Tổng hợp công' : mode === 'PLAN_HISTORY' ? 'Nhật ký vụ mùa' : 'Toàn trang trại'}
                </div>
                {viewMode === mode && <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <AnimatePresence mode="wait">
            {viewMode === 'SUMMARY' ? (
              <motion.div
                key="summary-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Stats Grid - Shrunk */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Thời gian', title: 'Tổng ngày công', value: `${totalStats.workDays} ngày`, icon: Clock, color: 'indigo' },
                    { label: 'Năng suất', title: 'Giờ tăng ca', value: `${totalStats.overtime} giờ`, icon: TrendingUp, color: 'amber' },
                    { label: 'Tài chính', title: 'Dự kiến chi trả', value: formatCurrency(totalStats.wage), icon: DollarSign, color: 'emerald' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                        <stat.icon size={60} />
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 bg-${stat.color}-50 text-${stat.color}-600 rounded-lg flex items-center justify-center`}>
                          <stat.icon size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{stat.label}</p>
                          <h4 className="text-[12px] font-bold text-slate-900">{stat.title}</h4>
                        </div>
                      </div>
                      <div className={cn("text-[20px] font-black tracking-tight", stat.color === 'emerald' ? 'text-emerald-600' : 'text-slate-900')}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
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
                        <AlertCircle size={32} />
                      </div>
                      <p className="text-[15px] font-bold">Lỗi khi tải bảng tổng hợp công</p>
                      <p className="text-[12px] opacity-70 mt-2">{extractErrorMessage(summaryErrorInfo)}</p>
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
                className="space-y-6"
              >
                {/* Compact Plan Selection */}
                {viewMode === 'PLAN_HISTORY' && (
                  <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm mb-6">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <Package size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Vụ mùa đang xem</p>
                      <h3 className="text-[14px] font-bold text-slate-900 truncate">{currentPlan.name}</h3>
                    </div>
                    <div className="relative">
                      <select
                        value={filters.activePlanId}
                        onChange={(e) => handlePlanChange(e.target.value)}
                        className="bg-slate-50 text-slate-900 py-2 px-4 pr-10 rounded-xl font-bold text-[13px] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer hover:bg-slate-100 transition-colors min-w-[200px]"
                      >
                        {plans.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" size={14} />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[2px]">
                    {viewMode === 'PLAN_HISTORY' ? `Dữ liệu: ${currentPlan.name}` : 'Dữ liệu toàn trang trại'}
                  </h4>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-white text-slate-600 rounded-xl text-[11px] font-black border border-slate-200 shadow-sm">
                      {filteredLogs.length} bản ghi
                    </span>
                  </div>
                </div>

                {/* Logs List */}
                {(planLoading || farmLoading) ? (
                  <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-slate-100 shadow-sm">
                    <Loader2 size={40} className="animate-spin mb-4 text-indigo-500" />
                    <p className="text-[14px] font-bold text-slate-500">Đang đồng bộ nhật ký...</p>
                  </div>
                ) : planError ? (
                   <div className="text-center py-20 bg-red-50/30 rounded-[32px] border border-dashed border-red-200 flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500">
                      <AlertCircle size={32} />
                    </div>
                    <p className="text-[16px] text-red-600 font-black mb-2">Lỗi máy chủ (500)</p>
                    <p className="text-[14px] text-red-500 font-medium px-10 text-center max-w-md">
                      Hệ thống gặp sự cố khi lấy nhật ký cho vụ mùa này. <br/>
                      <span className="text-[12px] opacity-70 mt-2 block font-bold">
                        Chi tiết: {extractErrorMessage(planErrorInfo)}
                      </span>
                    </p>
                  </div>
                ) : filteredLogs.length > 0 ? (
                  <div className="space-y-4">
                    {filteredLogs.map((log, index) => (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        key={log.id}
                        onClick={() => handleShowDetail(log.id)}
                        className="bg-white border border-slate-200/60 rounded-[32px] p-6 hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group cursor-pointer relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                              <div className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-[11px] font-black tracking-wide">
                                {formatDate(log.workDate)}
                              </div>
                              <span className={cn(
                                "text-[10px] px-3 py-1.5 rounded-xl font-black uppercase tracking-[1px] border",
                                (log.isOverTime || log.type === 'OVERTIME')
                                  ? "bg-amber-50 text-amber-600 border-amber-100"
                                  : "bg-indigo-50 text-indigo-600 border-indigo-100"
                              )}>
                                {(log.isOverTime || log.type === 'OVERTIME') ? 'Tăng ca' : 'Chính thức'}
                              </span>
                              <div className="flex items-center gap-2 text-[12px] font-bold text-indigo-600 bg-indigo-50/50 px-3.5 py-1.5 rounded-xl border border-indigo-100/30">
                                <Package size={14} />
                                <span className="truncate max-w-[240px]">
                                  {log.task?.name || log.taskName || 'Công việc'}
                                  <span className="text-slate-400 font-normal ml-2">
                                    ({log.farm?.farmName || currentPlan.name})
                                  </span>
                                </span>
                              </div>
                            </div>

                            <p className="text-[14px] text-slate-600 font-medium leading-[1.7] mb-6 pl-1 border-l-2 border-slate-100 ml-1">
                              {log.notes || <span className="text-slate-300 italic font-normal">Không có ghi chú</span>}
                            </p>

                            <div className="flex items-center gap-6 pt-5 border-t border-slate-50">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 font-black text-[12px] border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                  {(log.employee?.fullName || log.employeeName || 'N').charAt(0)}
                                </div>
                                <div>
                                  <div className="text-[14px] font-black text-slate-900 mb-0.5">{log.employee?.fullName || log.employeeName || 'Chưa xác định'}</div>
                                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nhân sự thực hiện</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-center">
                            {log.lockedAt ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleLock(log.id, true); }}
                                disabled={isPatching}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all"
                              >
                                {isPatching ? <Loader2 size={16} className="animate-spin text-indigo-600" /> : <Unlock size={16} />}
                                <span className="text-[11px] font-black uppercase tracking-wider">Mở khóa</span>
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleLock(log.id, false); }}
                                disabled={isPatching}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl transition-all"
                              >
                                {isPatching ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                                <span className="text-[11px] font-black uppercase tracking-wider">Chốt công</span>
                              </button>
                            )}
                            <div className="p-3 bg-slate-900 text-white rounded-2xl group-hover:bg-indigo-600 transition-colors shadow-lg">
                              <ChevronRight size={20} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-white rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                    <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mb-8 text-slate-300 border border-slate-100">
                      <BookOpen size={48} />
                    </div>
                    <p className="text-[18px] text-slate-900 font-black mb-2">Trống nhật ký</p>
                    <p className="text-[14px] text-slate-400 font-medium">Chưa có ghi nhận công việc nào.</p>
                  </div>
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
          from={filters.from}
          to={filters.to}
        />
      )}
    </div>
  );
}
