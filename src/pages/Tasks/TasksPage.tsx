import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, 
  Calendar, 
  ChevronRight,
  MapPin,
  CalendarDays,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useAssignedTasks } from '@/hooks/tasks/useAssignedTasks';
import { cn } from '@/utils/cn';
import { useSearchParams } from 'react-router-dom';

export default function TasksPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const filter = (searchParams.get('filter') as 'ALL' | 'TODAY' | 'DATE') || 'ALL';
  const selectedDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const viewMode = (searchParams.get('view') as 'GRID' | 'LIST') || 'LIST';
  const currentPage = Number(searchParams.get('page')) || 0;
  const pageSize = Number(searchParams.get('size')) || 10;
  const sort = searchParams.get('sort') || 'createdAt,desc';

  const { tasks, pagedData, todayTasks, loading, refresh, refreshToday, fetchByDate } = useAssignedTasks(user?.id);

  const displayTasks = filter === 'TODAY' ? todayTasks : tasks;

  // Sync with URL changes
  useEffect(() => {
    if (user?.id) {
      if (filter === 'ALL') {
        refresh({ page: currentPage, size: pageSize, sort: [sort] });
      } else if (filter === 'DATE') {
        fetchByDate(selectedDate, { page: currentPage, size: pageSize, sort: [sort] });
      } else {
        refreshToday();
      }
    }
  }, [user?.id, filter, selectedDate, currentPage, pageSize, sort, refresh, refreshToday, fetchByDate]);

  const updateParams = (newParams: Record<string, string | number>) => {
    const current = Object.fromEntries(searchParams.entries());
    const next = { ...current, ...newParams };
    
    // Ensure all values are strings for URLSearchParams
    const stringified: Record<string, string> = {};
    Object.entries(next).forEach(([key, value]) => {
      stringified[key] = String(value);
    });
    
    setSearchParams(stringified);
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage });
    // Scroll to top of list
    const mainContent = document.getElementById('tasks-scroll-container');
    if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusColor = (isTerminal?: boolean, isInitial?: boolean) => {
    if (isTerminal) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (isInitial) return 'bg-blue-50 text-blue-600 border-blue-100';
    return 'bg-amber-50 text-amber-600 border-amber-100';
  };

  const formatDate = (dateStr: string, includeYear = false) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: includeYear ? 'numeric' : undefined
      }).format(date);
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Header Area */}
      <div className="bg-white border-b border-slate-200 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-[0.2em]">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                Công việc của tôi
              </div>
              <span className="text-[10px] text-slate-400 font-medium ml-3.5">
                {user?.email}
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Danh sách <span className="text-indigo-600">Nhiệm vụ</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Filter Group */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button 
                onClick={() => updateParams({ filter: 'ALL', page: 0 })}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  filter === 'ALL' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Tất cả
              </button>
              <button 
                onClick={() => {
                  // Clear pagination params when switching to TODAY
                  setSearchParams({ filter: 'TODAY', view: viewMode });
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  filter === 'TODAY' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Hôm nay
              </button>
              <button 
                onClick={() => updateParams({ filter: 'DATE', page: 0 })}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  filter === 'DATE' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Theo ngày
              </button>
            </div>

            {filter === 'DATE' && (
              <div className="relative flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <Calendar size={16} className="text-slate-400 mr-2" />
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => updateParams({ date: e.target.value, page: 0 })}
                  className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-32 cursor-pointer"
                />
              </div>
            )}

            {(filter === 'ALL' || filter === 'DATE') && (
              <>
                <div className="h-8 w-px bg-slate-200" />
                
                {/* Size Selector */}
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Size:</span>
                  <select 
                    value={pageSize}
                    onChange={(e) => updateParams({ size: e.target.value, page: 0 })}
                    className="bg-transparent border-none text-xs font-black text-slate-900 p-0 outline-none focus:ring-0"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* Sort Selector */}
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sort:</span>
                  <select 
                    value={sort}
                    onChange={(e) => updateParams({ sort: e.target.value })}
                    className="bg-transparent border-none text-xs font-black text-indigo-600 p-0 outline-none focus:ring-0"
                  >
                    <option value="createdAt,desc">Mới nhất</option>
                    <option value="createdAt,asc">Cũ nhất</option>
                    <option value="name,asc">Tên A-Z</option>
                  </select>
                </div>
              </>
            )}

            <div className="h-8 w-px bg-slate-200" />

            {/* View Mode */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button 
                onClick={() => updateParams({ view: 'LIST' })}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'LIST' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                )}
              >
                <ListIcon size={16} />
              </button>
              <button 
                onClick={() => updateParams({ view: 'GRID' })}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'GRID' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                )}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div id="tasks-scroll-container" className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-white rounded-3xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : displayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <ClipboardList size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Không có công việc nào</h3>
              <p className="text-slate-500 max-w-xs mt-2">
                Bạn chưa có công việc nào được giao trong danh sách này.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className={cn(
                "grid gap-4",
                viewMode === 'GRID' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
              )}>
                <AnimatePresence mode="popLayout">
                  {displayTasks.map((task, idx) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      className={cn(
                        "group bg-white rounded-[2rem] border border-slate-200 p-6 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden",
                        viewMode === 'LIST' && "flex items-center justify-between gap-6"
                      )}
                    >
                      {/* Progress indicator on background */}
                      <div 
                        className="absolute bottom-0 left-0 h-1 bg-indigo-500/10" 
                        style={{ width: `${task.progressPercent}%` }}
                      />

                      <div className={cn("flex gap-5", viewMode === 'LIST' ? "flex-1" : "flex-col")}>
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0">
                          <Calendar size={24} />
                        </div>

                        <div className="space-y-2 flex-1">
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                              getStatusColor(task.status?.isTerminal, task.status?.isInitial)
                            )}>
                              {task.status?.name}
                            </span>
                          </div>

                          <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {task.name}
                          </h3>

                          <div className="flex flex-wrap gap-x-4 gap-y-2">
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                              <MapPin size={14} className="text-slate-400" />
                              {task.farmName || 'N/A'} {task.plotId ? `• Lô ${task.plotId.slice(0, 4)}` : ''}
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                              <CalendarDays size={14} className="text-slate-400" />
                              {formatDate(task.startDate)} - {formatDate(task.endDate, true)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={cn(
                        "flex items-center gap-4",
                        viewMode === 'GRID' ? "mt-6 pt-6 border-t border-slate-50" : ""
                      )}>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiến độ</span>
                            <span className="text-xs font-black text-indigo-600">{task.progressPercent}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                              style={{ width: `${task.progressPercent}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                          <ChevronRight size={20} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination UI - Only Page navigation at bottom */}
              {(filter === 'ALL' || filter === 'DATE') && pagedData && pagedData.totalElements > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-200 rounded-[2rem] px-8 py-4 gap-4">
                  <div className="text-xs font-medium text-slate-500">
                    Trang <span className="font-black text-slate-900">{pagedData.pageNumber + 1}</span> / {pagedData.totalPages || 1} 
                    <span className="mx-2 text-slate-300">·</span> 
                    Tổng cộng <span className="font-black text-slate-900">{pagedData.totalElements}</span> nhiệm vụ
                  </div>
                  
                  {pagedData.totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={pagedData.first}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-600 transition-colors"
                      >
                        Trang trước
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagedData.totalPages) }, (_, i) => {
                          const pageNum = i;
                          return (
                            <button
                              key={i}
                              onClick={() => handlePageChange(pageNum)}
                              className={cn(
                                "w-8 h-8 rounded-full text-xs font-black transition-all",
                                pagedData.pageNumber === pageNum 
                                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                              )}
                            >
                              {pageNum + 1}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={pagedData.last}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-600 transition-colors"
                      >
                        Trang sau
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
