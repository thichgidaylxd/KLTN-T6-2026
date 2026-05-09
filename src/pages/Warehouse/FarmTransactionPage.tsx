import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  History,
  ArrowLeft,
  Loader2,
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  CheckCircle2,
  Building,
} from "lucide-react";
import { useTransactionsByFarm } from "../../hooks/warehouseTransactions/useWarehouseTransactions";
import type {
  WarehouseTransaction,
  TransactionType,
} from "../../types/warehouseTransaction/warehouseTransaction";
import { PageableParams } from "../../types/common";
import { cn } from "../../utils/cn";
import { formatDate, formatOnlyTime } from "../../utils/format";

// ── Reuse components from WarehouseDetailPage for consistency ──────────────────

function TransactionTypeBadge({ type }: { type: TransactionType }) {
  const configs: Record<string, { label: string; className: string }> = {
    IMPORT_MANUAL: {
      label: "NHẬP THỦ CÔNG",
      className: "bg-emerald-100 text-emerald-700",
    },
    EXPORT_MANUAL: {
      label: "XUẤT THỦ CÔNG",
      className: "bg-rose-100 text-rose-700",
    },
    TRANSFER_IN: {
      label: "CHUYỂN ĐẾN",
      className: "bg-blue-100 text-blue-700",
    },
    TRANSFER_OUT: {
      label: "CHUYỂN ĐI",
      className: "bg-amber-100 text-amber-700",
    },
    ADJUST_INCREASE: {
      label: "ĐIỀU CHỈNH TĂNG",
      className: "bg-teal-100 text-teal-700",
    },
    ADJUST_DECREASE: {
      label: "ĐIỀU CHỈNH GIẢM",
      className: "bg-orange-100 text-orange-700",
    },
    HARVEST_IN: {
      label: "THU HOẠCH NHẬP KHO",
      className: "bg-indigo-100 text-indigo-700",
    },
    WORKLOG_OUT: {
      label: "XUẤT CHO CÔNG VIỆC",
      className: "bg-violet-100 text-violet-700",
    },
  };
  const config = configs[type] || {
    label: type,
    className: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={cn(
        "text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function FarmTransactionPage() {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Hook configuration ─────────────────────────────────────────────────────
  const {
    transactions,
    loading,
    data,
    pageable,
    setPageable,
    setPageSize: txSetPageSize,
    goToPage: txGoToPage,
    refresh
  } = useTransactionsByFarm(farmId);

  // ── Sync pagination with URL query params ───────────────────────────────────
  const sortParam = searchParams.get('sort');
  const urlPageable = useMemo<PageableParams>(() => ({
    page: Number(searchParams.get('page')) || 0,
    size: Number(searchParams.get('size')) || 20,
    sort: sortParam ? [sortParam] : ['createdAt,desc'],
  }), [searchParams, sortParam]);

  useEffect(() => {
    if (
      urlPageable.page !== pageable.page ||
      urlPageable.size !== pageable.size ||
      (urlPageable.sort?.[0] ?? 'createdAt,desc') !== (pageable.sort?.[0] ?? 'createdAt,desc')
    ) {
      setPageable(urlPageable);
    }
  }, [urlPageable, pageable, setPageable]);

  const goToPage = (p: number) => {
    txGoToPage(p);
    const params = new URLSearchParams(searchParams);
    params.set('page', String(p));
    setSearchParams(params, { replace: true });
  };

  const setPageSize = (s: number) => {
    txSetPageSize(s);
    const params = new URLSearchParams(searchParams);
    params.set('size', String(s));
    params.set('page', '0');
    setSearchParams(params, { replace: true });
  };

  const setSort = (sortKey: string) => {
    setPageable({ page: 0, size: pageable.size, sort: [sortKey] });
    const params = new URLSearchParams(searchParams);
    params.set('sort', sortKey);
    params.set('page', '0');
    setSearchParams(params, { replace: true });
  };

  // ── Filter logic (Client side for simple search) ──────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const filteredTransactions = transactions.filter(tx => 
    tx.warehouseItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.warehouseItem.sku?.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.performedBy.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/farms/${farmId}/warehouses`)}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            title="Quay lại"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-[19px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <History className="text-emerald-500" size={20} />
              Nhật ký giao dịch toàn Farm
            </h1>
            <p className="text-[12px] text-slate-500 font-medium">
              Theo dõi toàn bộ biến động vật tư của tất cả các kho hàng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={() => refresh()}
             className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
             title="Làm mới"
           >
             <Clock size={16} />
           </button>
           {/* <button className="flex items-center gap-1.5 h-9 px-4 text-[12px] font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:border-slate-400 transition-all">
             <Download size={14} />
             Xuất báo cáo
           </button> */}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-6 flex flex-col gap-4">
        
        {/* Filter / Stats Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên vật tư, SKU hoặc người thực hiện..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-11 pr-4 text-[13px] bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
              />
            </div>
            
            <select
              value={pageable.size ?? 20}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-10 text-[12px] font-bold border-slate-200 rounded-xl bg-white shadow-sm px-4 focus:ring-emerald-500"
            >
              <option value={20}>20 dòng</option>
              <option value={50}>50 dòng</option>
              <option value={100}>100 dòng</option>
            </select>

            <select
              value={pageable.sort?.[0] ?? "createdAt,desc"}
              onChange={(e) => setSort(e.target.value)}
              className="h-10 text-[12px] font-bold border-slate-200 rounded-xl bg-white shadow-sm px-4 focus:ring-emerald-500"
            >
              <option value="createdAt,desc">Mới nhất</option>
              <option value="createdAt,asc">Cũ nhất</option>
            </select>
          </div>

          <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-3">
             <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm">
                <CheckCircle2 size={16} />
             </div>
             <div>
                <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">Tổng số bản ghi</p>
                <p className="text-[14px] font-black text-emerald-700 leading-none">{data?.totalElements ?? 0}</p>
             </div>
          </div>
        </div>

        {/* Transactions Table Container */}
        <div className="flex-1 bg-white rounded-[24px] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50/80 backdrop-blur-md border-b border-slate-100">
                  <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Loại giao dịch</th>
                  <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Vật tư & SKU</th>
                  <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">Số lượng</th>
                  <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Lộ trình kho</th>
                  <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Người thực hiện</th>
                  <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                   <tr>
                     <td colSpan={6} className="py-24 text-center">
                        <Loader2 size={32} className="animate-spin text-emerald-500 mx-auto" />
                        <p className="text-xs text-slate-400 mt-4 font-bold uppercase tracking-widest">Đang tải dữ liệu...</p>
                     </td>
                   </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                       <History size={48} className="text-slate-100 mx-auto mb-4" />
                       <p className="text-[15px] font-bold text-slate-700">Không tìm thấy giao dịch nào</p>
                       <p className="text-xs text-slate-400 mt-1">Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx: WarehouseTransaction) => {
                    const isImport = tx.qtyChange > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-5 py-4">
                          <TransactionTypeBadge type={tx.type} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                             <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all shrink-0">
                                <Building size={16} />
                             </div>
                             <div>
                                <p className="text-[14px] font-bold text-slate-800 leading-tight">
                                  {tx.warehouseItem.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] text-emerald-600 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                    {tx.warehouseItem.sku?.sku || "NO SKU"}
                                  </span>
                                </div>
                             </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isImport ? (
                              <ArrowDownCircle size={14} className="text-emerald-500" />
                            ) : (
                              <ArrowUpCircle size={14} className="text-rose-500" />
                            )}
                            <span className={cn("text-[15px] font-black", isImport ? "text-emerald-700" : "text-rose-600")}>
                              {isImport ? "+" : ""}
                              {tx.qtyChange.toLocaleString("vi-VN")}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase">{tx.warehouseItem.unit.code}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                             <div className="flex flex-col gap-0.5">
                               <div className="flex items-center gap-1.5">
                                 <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                 <span className="text-[11px] font-mono font-bold text-slate-500">
                                   {tx.fromLocation?.code || "—"}
                                 </span>
                               </div>
                               <div className="flex items-center gap-1.5">
                                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                 <span className="text-[11px] font-mono font-bold text-emerald-600">
                                   {tx.toLocation?.code || "—"}
                                 </span>
                               </div>
                             </div>
                             
                             {(tx.refTaskId || tx.refWorkLogId) && (
                               <div className="ml-2 pl-3 border-l border-slate-100 py-1 space-y-1">
                                  {tx.refTaskId && <span className="block text-[9px] font-black bg-indigo-50 text-indigo-500 px-1.5 rounded uppercase w-fit">Ref: Task</span>}
                                  {tx.refWorkLogId && <span className="block text-[9px] font-black bg-blue-50 text-blue-500 px-1.5 rounded uppercase w-fit">Ref: Log</span>}
                               </div>
                             )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                           <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 font-black text-[10px]">
                                 {tx.performedBy.fullName.charAt(0)}
                              </div>
                              <span className="text-[13px] font-semibold text-slate-700">{tx.performedBy.fullName}</span>
                           </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col text-right sm:text-left">
                            <span className="text-[13px] font-bold text-slate-800">
                              {formatDate(tx.createdAt)}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {formatOnlyTime(tx.createdAt)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {data && data.totalPages > 1 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
               <p className="text-[12px] text-slate-500 font-medium">
                 Hiển thị trang <span className="text-slate-900 font-bold">{(data.pageNumber ?? 0) + 1}</span> trên tổng số <span className="text-slate-900 font-bold">{data.totalPages}</span> trang
               </p>
               <div className="flex items-center gap-2">
                 <button
                   onClick={() => goToPage(pageable.page! - 1)}
                   disabled={data.first || loading}
                   className="px-4 py-2 text-[12px] font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                 >
                   Trước
                 </button>
                 <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                       // Simple sliding window for pagination if needed, but for now just show up to 5
                       const pageNum = i; 
                       return (
                         <button
                           key={pageNum}
                           onClick={() => goToPage(pageNum)}
                           className={cn(
                             "w-9 h-9 rounded-xl text-[12px] font-bold transition-all",
                             data.pageNumber === pageNum 
                               ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" 
                               : "bg-white text-slate-500 border border-slate-100 hover:border-slate-300"
                           )}
                         >
                           {pageNum + 1}
                         </button>
                       )
                    })}
                 </div>
                 <button
                   onClick={() => goToPage(pageable.page! + 1)}
                   disabled={data.last || loading}
                   className="px-4 py-2 text-[12px] font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                 >
                   Sau
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
