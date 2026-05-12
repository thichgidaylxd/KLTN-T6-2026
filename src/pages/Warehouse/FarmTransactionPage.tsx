import { useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  History,
  ArrowLeft,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  CheckCircle2,
  Building,
} from "lucide-react";
import { useTransactionsByFarm } from "../../hooks/warehouseTransactions/useWarehouseTransactions";
import type {
  WarehouseTransaction,
} from "../../types/warehouseTransaction/warehouseTransaction";
import { PageableParams } from "../../types/common";
import { cn } from "../../utils/cn";
import { formatDate, formatOnlyTime } from "../../utils/format";

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
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-6 flex flex-col gap-4">
        
        {/* Stats & Parameters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Hiển thị:</span>
              <select
                value={pageable.size ?? 10}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-9 text-[12px] font-bold border-slate-200 rounded-xl bg-white shadow-sm px-4 focus:ring-emerald-500 outline-none"
              >
                <option value={10}>10 dòng</option>
                <option value={20}>20 dòng</option>
                <option value={50}>50 dòng</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Sắp xếp:</span>
              <select
                value={pageable.sort?.[0] ?? "createdAt,desc"}
                onChange={(e) => setSort(e.target.value)}
                className="h-9 text-[12px] font-bold border-slate-200 rounded-xl bg-white shadow-sm px-4 focus:ring-emerald-500 outline-none"
              >
                <option value="createdAt,desc">Mới nhất</option>
                <option value="createdAt,asc">Cũ nhất</option>
              </select>
            </div>
          </div>

          <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-3">
             <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm">
                <CheckCircle2 size={16} />
             </div>
             <div>
                <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest leading-tight">Tổng số giao dịch</p>
                <p className="text-[14px] font-black text-emerald-700 leading-none">{data?.totalElements ?? 0}</p>
             </div>
          </div>
        </div>

        {/* Transactions Table Container */}
        <div className="flex-1 bg-white rounded-[24px] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse border-spacing-0">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50/80 backdrop-blur-md border-b border-slate-100">
                  <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Vật tư & SKU</th>
                  <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">Số lượng</th>
                  <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">Đơn giá</th>
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
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                       <History size={48} className="text-slate-100 mx-auto mb-4" />
                       <p className="text-[15px] font-bold text-slate-700">Không có dữ liệu giao dịch</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx: WarehouseTransaction) => {
                    const isImport = tx.qtyChange > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                             <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all shrink-0">
                                <Building size={16} />
                             </div>
                             <div>
                                <p className="text-[14px] font-bold text-slate-800 leading-tight">
                                  {tx.warehouseItem.name}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                    {tx.warehouseItem.unit.name}
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
                        <td className="px-5 py-4 text-right">
                           <span className="text-[14px] font-bold text-slate-700">
                             {tx.warehouseItem.unitPrice?.toLocaleString("vi-VN")}
                             <span className="text-[10px] ml-0.5 text-slate-400">đ</span>
                           </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                               {tx.fromLocation ? (
                                 <div className="flex flex-col">
                                   <span className="text-[11px] font-bold text-slate-600 uppercase">{tx.fromLocation.name}</span>
                                   <span className="text-[9px] text-slate-400">{tx.fromLocation.description || "N/A"}</span>
                                 </div>
                               ) : (
                                 <span className="text-[10px] font-bold text-slate-300 italic">Không có dữ liệu</span>
                               )}
                             </div>
                             <div className="flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                               {tx.toLocation ? (
                                 <div className="flex flex-col">
                                   <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-bold text-emerald-600 uppercase">{tx.toLocation.name}</span>
                                      <span className={cn("text-[8px] px-1 rounded font-black uppercase", tx.toLocation.isActive ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                                        {tx.toLocation.isActive ? "Active" : "Inactive"}
                                      </span>
                                   </div>
                                   <span className="text-[9px] text-slate-400">{tx.toLocation.description || "N/A"}</span>
                                 </div>
                               ) : (
                                 <span className="text-[10px] font-bold text-slate-300 italic">Không có dữ liệu</span>
                               )}
                             </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                           <div className="flex items-start gap-2.5">
                              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 font-black text-[10px] shrink-0">
                                 {tx.performedBy.fullName.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-[13px] font-bold text-slate-700">{tx.performedBy.fullName}</span>
                                  <span className={cn("text-[8px] px-1 rounded font-black uppercase", tx.performedBy.status === "ACTIVE" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600")}>
                                    {tx.performedBy.status}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500">{tx.performedBy.email}</span>
                                <span className="text-[10px] text-slate-400">{tx.performedBy.phone || "No Phone"}</span>
                              </div>
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
          {data && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-4">
                  <p className="text-[12px] text-slate-500 font-medium">
                    Trang <span className="text-slate-900 font-bold">{(data.pageNumber ?? 0) + 1}</span> / <span className="text-slate-900 font-bold">{data.totalPages || 1}</span> 
                    <span className="mx-3 text-slate-300">|</span> 
                    Tổng <span className="text-slate-900 font-bold">{data.totalElements}</span> giao dịch
                  </p>
               </div>

               <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(Math.max(data.totalPages, 1), 5) }, (_, i) => {
                     const currentPage = data.pageNumber ?? 0;
                     const total = Math.max(data.totalPages, 1);
                     let pageNum: number;
                     if (total <= 5) pageNum = i;
                     else if (currentPage < 3) pageNum = i;
                     else if (currentPage >= total - 2) pageNum = total - 5 + i;
                     else pageNum = currentPage - 2 + i;

                     return (
                       <button
                         key={pageNum}
                         onClick={() => goToPage(pageNum)}
                         className={cn(
                           "w-9 h-9 rounded-xl text-[12px] font-bold transition-all",
                           currentPage === pageNum 
                             ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" 
                             : "bg-white text-slate-500 border border-slate-100 hover:border-slate-300"
                         )}
                       >
                         {pageNum + 1}
                       </button>
                     )
                  })}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
