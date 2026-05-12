import { useState } from 'react';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCcw,
  AlertCircle
} from 'lucide-react';
import { useOpenSessions } from '../../hooks/workLog/useSessions';
import { Button } from '../ui/button';
import { cn } from '../../utils/cn';
import { sessionService } from '../../services/workLog/sessionService';
import { Modal } from '../ui/Modal';
import { toast } from 'sonner';

export function OpenSessionTable() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortField, setSortField] = useState('checkedInAt');
  const [sortDir, setSortDir] = useState('desc');

  const [isForceClosing, setIsForceClosing] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [forceCloseReason, setForceCloseReason] = useState('');

  const { data, isLoading, error, refetch } = useOpenSessions({ 
    page, 
    size,
    sort: [`${sortField},${sortDir}`]
  });

  const handleForceClose = async () => {
    if (!selectedSessionId || !forceCloseReason.trim()) return;
    
    setIsForceClosing(true);
    try {
      await sessionService.forceCloseSession(selectedSessionId, forceCloseReason);
      toast.success('Đã kết thúc phiên làm việc cưỡng chế');
      setSelectedSessionId(null);
      setForceCloseReason('');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Không thể kết thúc phiên làm việc');
    } finally {
      setIsForceClosing(false);
    }
  };

  const sessions = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;
  const isFirst = data?.first ?? true;
  const isLast = data?.last ?? true;


  const formatTime = (dateStr: string) => {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle className="text-red-500" size={24} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Không thể tải dữ liệu</h3>
        <p className="text-slate-500 max-w-xs mt-2">Đã có lỗi xảy ra khi lấy danh sách phiên làm việc. Vui lòng thử lại sau.</p>
        <Button 
          variant="outline" 
          className="mt-6 gap-2" 
          onClick={() => refetch()}
        >
          <RefreshCcw size={16} />
          Thử lại
        </Button>
      </div>
    );
  }


  return (
    <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
      {/* Top Bar */}
      <div className="p-4 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">Danh sách phiên đang mở</h4>
            <p className="text-[11px] text-slate-500">Cập nhật thời gian thực từ hệ thống</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Sắp xếp:</span>
            <select 
              value={`${sortField},${sortDir}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split(',');
                setSortField(field);
                setSortDir(dir);
                setPage(0);
              }}
              className="bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-700 py-1 pl-2 pr-8 focus:ring-0 cursor-pointer"
            >
              <option value="checkedInAt,desc">Giờ Check-in (Mới nhất)</option>
              <option value="checkedInAt,asc">Giờ Check-in (Cũ nhất)</option>
              <option value="checkedOutAt,desc">Giờ Check-out (Mới nhất)</option>
              <option value="checkedOutAt,asc">Giờ Check-out (Cũ nhất)</option>
              <option value="employeeName,asc">Nhân viên (A-Z)</option>
              <option value="employeeName,desc">Nhân viên (Z-A)</option>
              <option value="taskName,asc">Nhiệm vụ (A-Z)</option>
            </select>
          </div>

          <div className="h-4 w-px bg-slate-100" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Hiển thị:</span>
            <select 
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0);
              }}
              className="bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-700 py-1 pl-2 pr-8 focus:ring-0 cursor-pointer"
            >
              <option value={5}>5 / trang</option>
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-slate-50">
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[140px]">Nhân viên</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[140px]">Nhiệm vụ</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[100px]">Check-in</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[100px]">Check-out</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[140px]">Ghi chú</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[140px]">Lý do kết thúc</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[100px]">Giờ kết thúc</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[100px]">Người kết thúc</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[120px]">Lý do điều chỉnh</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[100px]">Giờ điều chỉnh</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[100px]">Người điều chỉnh</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[70px]">Đang mở</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[100px]">Cho phép đóng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4" colSpan={8}><div className="h-10 w-full bg-slate-100 rounded-lg"></div></td>
                </tr>
              ))
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-slate-200">
                      <Clock size={32} />
                    </div>
                    <p className="text-slate-500 font-medium">Không có phiên làm việc nào đang mở</p>
                  </div>
                </td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr key={session.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">{session.employeeName}</span>
                      <span className="text-[10px] text-slate-400">ID: {session.employeeId.substring(0, 8)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-600">{session.taskName}</span>
                      <span className="text-[10px] text-slate-400">ID: {session.taskId.substring(0, 8)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">{formatTime(session.checkedInAt)}</span>
                      <span className="text-[10px] text-slate-500">{formatDate(session.checkedInAt)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {session.checkedOutAt ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">{formatTime(session.checkedOutAt)}</span>
                        <span className="text-[10px] text-slate-500">{formatDate(session.checkedOutAt)}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">TRUE (Mở)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 italic">
                    {session.checkInNote || 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">{session.forceReason || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                    {session.forceClosedAt ? formatDate(session.forceClosedAt) : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">{session.forceClosedBy || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">{session.adjustReason || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                    {session.adjustedAt ? formatDate(session.adjustedAt) : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">{session.adjustedBy || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-full",
                      session.open ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                    )}>
                      {session.open ? 'TRUE' : 'FALSE'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-full",
                      session.forceClose ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"
                    )}>
                      {session.forceClose ? 'TRUE' : 'FALSE'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-50 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-4">
          <p className="text-[12px] text-slate-500">
            Tổng số: <span className="font-bold text-slate-900">{totalElements}</span> phiên làm việc
          </p>
          <div className="h-3 w-px bg-slate-200" />
          <p className="text-[12px] text-slate-500">
            Trang <span className="font-bold text-slate-900">{page + 1}</span> / {totalPages || 1}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={isFirst || page === 0}
            className="rounded-xl h-8 px-3 border-slate-200 hover:bg-slate-50 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
            <span className="ml-1 text-[12px]">Trước</span>
          </Button>
          
          <div className="flex items-center gap-1 mx-1">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              let pageNum = page;
              if (totalPages <= 5) pageNum = i;
              else if (page < 2) pageNum = i;
              else if (page > totalPages - 3) pageNum = totalPages - 5 + i;
              else pageNum = page - 2 + i;

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-[12px] font-bold transition-all",
                    page === pageNum 
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" 
                      : "text-slate-500 hover:bg-slate-100"
                  )}
                >
                  {pageNum + 1}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={isLast || page >= totalPages - 1}
            className="rounded-xl h-8 px-3 border-slate-200 hover:bg-slate-50 disabled:opacity-30"
          >
            <span className="mr-1 text-[12px]">Sau</span>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
      {/* Force Close Reason Modal */}
      <Modal isOpen={!!selectedSessionId} onClose={() => setSelectedSessionId(null)}>
        <div className="bg-white rounded-[32px] p-8 w-full max-w-md overflow-hidden border border-slate-100 shadow-2xl">
          <div className="flex flex-col">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-6 text-rose-500">
              <AlertCircle size={32} />
            </div>
            
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2 uppercase">
              Kết thúc phiên cưỡng chế
            </h3>
            
            <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
              Vui lòng nhập lý do để kết thúc phiên làm việc này. Hành động này sẽ được ghi lại trong lịch sử hệ thống.
            </p>

            <textarea
              placeholder="Nhập lý do tại đây..."
              value={forceCloseReason}
              onChange={(e) => setForceCloseReason(e.target.value)}
              className="w-full h-32 p-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-rose-500/20 transition-all resize-none mb-6"
            />

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setSelectedSessionId(null)}
                className="flex-1 py-6 rounded-2xl font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-none"
              >
                Hủy
              </Button>
              <Button
                disabled={isForceClosing || !forceCloseReason.trim()}
                onClick={handleForceClose}
                className="flex-1 py-6 rounded-2xl font-black uppercase tracking-wider text-white bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-100 border-none transition-all active:scale-95"
              >
                {isForceClosing ? 'Đang xử lý...' : 'Xác nhận'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
