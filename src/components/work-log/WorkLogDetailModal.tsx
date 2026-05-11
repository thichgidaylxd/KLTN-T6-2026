import { Modal } from '../ui/Modal';
import { useWorkLogDetail } from '@/hooks/workLog/useWorkLogs';
import { formatDate } from '@/utils/format';
import {
  Loader2, Calendar, User, Clock, FileText, Package,
  AlertCircle, Lock, CheckCircle2, XCircle, Briefcase,
  StickyNote, Hash, Unlock,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { WorkLogMaterial } from '@/types/workLog/workLog';
import { useWorkLogs } from '@/hooks/workLog/useWorkLogs';
import { useState } from 'react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/utils/errorUtils';

interface WorkLogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  workLogId: string;
}

/** Dòng thông tin: icon + label trái, value phải */
function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100/80 last:border-0">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-slate-400">{icon}</span>
        <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">{label}</span>
      </div>
      <div className="text-[12.5px] font-semibold text-slate-800 text-right min-w-0">
        {children}
      </div>
    </div>
  );
}

/** Tiêu đề nhóm section */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[2.5px] mb-2 px-0.5">
      {children}
    </p>
  );
}

export function WorkLogDetailModal({ isOpen, onClose, workLogId }: WorkLogDetailModalProps) {
  const { data: detail, isLoading: loading, error } = useWorkLogDetail(workLogId);
  const { lockWorkLog, unlockWorkLog } = useWorkLogs();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleToggleLock = async () => {
    if (!detail) return;
    setIsProcessing(true);
    try {
      if (detail.lockedAt) {
        await unlockWorkLog(workLogId);
        toast.success('Mở khóa nhật ký thành công');
      } else {
        await lockWorkLog(workLogId);
        toast.success('Chốt công thành công');
      }
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* max-w-2xl = layout 2 cột nằm ngang */}
      <div className="bg-white rounded-[20px] overflow-hidden w-full max-w-2xl shadow-2xl border border-slate-100">

        {/* ── Header gradient ── */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-white overflow-hidden">
          <div className="absolute -top-5 -right-5 w-28 h-28 rounded-full bg-white/[0.04]" />
          <div className="absolute -bottom-8 left-8 w-36 h-36 rounded-full bg-white/[0.04]" />

          <div className="relative flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-black tracking-tight leading-tight">
                Chi tiết nhật ký công việc
              </h3>
              <p className="text-[10.5px] text-white/60 mt-0.5 font-medium">
                Thông tin đầy đủ về phiên làm việc đã ghi nhận
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-all shrink-0 text-white/70 hover:text-white text-base leading-none"
            >
              ×
            </button>
          </div>

          {/* Locked badge — nằm trong header */}
          {!loading && !error && detail?.lockedAt && (
            <div className="relative mt-2.5 inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-300/30 rounded-full px-2.5 py-0.5">
              <Lock size={10} className="text-amber-300" />
              <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wide">
                Đã chốt · {formatDate(detail.lockedAt)}
              </span>
            </div>
          )}
        </div>

        {/* ── Action Bar ── */}
        {!loading && !error && detail && (
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                detail.lockedAt ? "bg-amber-500" : "bg-emerald-500"
              )} />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Trạng thái: {detail.lockedAt ? 'Đã chốt công' : 'Chờ duyệt'}
              </span>
            </div>

            <button
              onClick={handleToggleLock}
              disabled={isProcessing}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-xl text-[12px] font-black transition-all shadow-sm active:scale-95 disabled:opacity-50",
                detail.lockedAt
                  ? "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 shadow-lg"
              )}
            >
              {isProcessing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : detail.lockedAt ? (
                <Unlock size={14} />
              ) : (
                <CheckCircle2 size={14} />
              )}
              {detail.lockedAt ? 'Mở khóa sửa' : 'Chốt công (Duyệt)'}
            </button>
          </div>
        )}

        {/* ── Body ── */}
        <div className="max-h-[70vh] overflow-y-auto scrollbar-hide">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Loader2 size={30} className="animate-spin text-indigo-500" />
              <p className="text-[13px] font-medium">Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-8">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                <AlertCircle size={24} className="text-rose-500" />
              </div>
              <p className="text-[14px] font-bold text-slate-700">Không thể tải nhật ký</p>
              <p className="text-[12px] text-slate-400">Vui lòng thử lại sau</p>
            </div>
          ) : detail ? (
            <div className="p-6">
              {/* ══════════ LAYOUT 2 CỘT ══════════ */}
              <div className="flex gap-5">

                {/* ── CỘT TRÁI ── */}
                <div className="flex-1 min-w-0 space-y-4">

                  {/* Thông tin công */}
                  <div>
                    <SectionTitle>Thông tin công</SectionTitle>
                    <div className="bg-slate-50 rounded-2xl px-3.5 border border-slate-100">
                      <InfoRow icon={<Calendar size={12} />} label="Ngày làm">
                        <span className="text-indigo-600 font-bold">{formatDate(detail.workDate)}</span>
                      </InfoRow>

                      <InfoRow icon={<Clock size={12} />} label="Loại công">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[11px] font-bold',
                          (detail.overtime || detail.type === 'OVERTIME')
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700',
                        )}>
                          {(detail.overtime || detail.type === 'OVERTIME') ? 'Tăng ca' : 'Chính thức'}
                        </span>
                      </InfoRow>

                      <InfoRow icon={<Clock size={12} />} label="Ca làm">
                        {detail.shiftName
                          ? <span>{detail.shiftName}</span>
                          : <span className="text-slate-400 italic font-normal text-[12px]">Chưa xác định</span>
                        }
                      </InfoRow>

                      <InfoRow icon={<CheckCircle2 size={12} />} label="Tăng ca">
                        {detail.overtime ? (
                          <span className="flex items-center gap-1 text-amber-600 justify-end">
                            <CheckCircle2 size={13} className="text-amber-500" />
                            <span className="font-bold">Có</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 justify-end">
                            <XCircle size={13} className="text-slate-300" />
                            <span className="text-slate-500 font-semibold">Không</span>
                          </span>
                        )}
                      </InfoRow>
                    </div>
                  </div>

                  {/* Nhân sự */}
                  <div>
                    <SectionTitle>Nhân sự</SectionTitle>
                    <div className="bg-slate-50 rounded-2xl px-3.5 border border-slate-100">
                      <InfoRow icon={<User size={12} />} label="Người thực hiện">
                        <div className="flex items-center gap-1.5 justify-end">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[10px] shrink-0">
                            {(detail.employee?.fullName || detail.employeeName || 'N').charAt(0)}
                          </div>
                          <span className={cn(
                            'truncate max-w-[120px]',
                            !(detail.employee?.fullName || detail.employeeName)
                            && 'text-slate-400 italic font-normal text-[12px]',
                          )}>
                            {detail.employee?.fullName || detail.employeeName || 'Chưa xác định'}
                          </span>
                        </div>
                      </InfoRow>

                      <InfoRow icon={<Hash size={12} />} label="Mã nhân viên">
                        {detail.employeeId
                          ? <span className="font-mono text-[11.5px] text-slate-600">{detail.employeeId.slice(0, 8)}…</span>
                          : <span className="text-slate-400 italic font-normal text-[12px]">Chưa xác định</span>
                        }
                      </InfoRow>

                      {detail.employee?.email && (
                        <InfoRow icon={<FileText size={12} />} label="Email">
                          <span className="text-[12px] font-normal text-slate-500 truncate max-w-[150px]">
                            {detail.employee.email}
                          </span>
                        </InfoRow>
                      )}
                    </div>
                  </div>

                </div>

                {/* Divider dọc */}
                <div className="w-px bg-slate-100 self-stretch" />

                {/* ── CỘT PHẢI ── */}
                <div className="flex-1 min-w-0 space-y-4">

                  {/* Công việc */}
                  <div>
                    <SectionTitle>Công việc</SectionTitle>
                    <div className="bg-slate-50 rounded-2xl px-3.5 border border-slate-100">
                      <InfoRow icon={<Briefcase size={12} />} label="Tên công việc">
                        {detail.taskName || (detail as any).task?.name
                          ? <span className="truncate max-w-[140px] block">{detail.taskName || (detail as any).task?.name}</span>
                          : <span className="text-slate-400 italic font-normal text-[12px]">Chưa gắn công việc</span>
                        }
                      </InfoRow>

                      <InfoRow icon={<Hash size={12} />} label="Mã công việc">
                        {detail.taskId || (detail as any).task?.id
                          ? <span className="font-mono text-[11.5px] text-slate-600">
                            {(detail.taskId || (detail as any).task?.id)?.slice(0, 8)}…
                          </span>
                          : <span className="text-slate-400 italic font-normal text-[12px]">Chưa xác định</span>
                        }
                      </InfoRow>
                    </div>
                  </div>

                  {/* Ghi chú */}
                  <div>
                    <SectionTitle>Ghi chú</SectionTitle>
                    <div className="bg-slate-50 rounded-2xl px-3.5 py-3 border border-slate-100 min-h-[68px]">
                      <div className="flex items-start gap-2">
                        <StickyNote size={12} className="text-slate-400 mt-0.5 shrink-0" />
                        <p className={cn(
                          'text-[12.5px] leading-relaxed',
                          detail.notes ? 'text-slate-700' : 'text-slate-400 italic',
                        )}>
                          {detail.notes || 'Không có ghi chú'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Vật tư đã dùng — luôn hiển thị đủ 4 field dù null */}
                  <div>
                    <SectionTitle>Vật tư đã dùng</SectionTitle>
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                      {detail.materials && detail.materials.length > 0 ? (
                        /* Có data: mỗi item 1 block, 4 field mỗi item */
                        <div className="divide-y divide-slate-200">
                          {detail.materials.map((m: WorkLogMaterial, idx: number) => (
                            <div key={idx} className="px-3.5 py-3 space-y-0">
                              <InfoRow icon={<Package size={12} />} label="Tên vật tư">
                                {m.warehouseItemName
                                  ? <span className="truncate max-w-[130px] block">{m.warehouseItemName}</span>
                                  : <span className="text-slate-400 italic font-normal text-[12px]">Chưa có</span>
                                }
                              </InfoRow>
                              <InfoRow icon={<Hash size={12} />} label="Số lượng">
                                {m.usedQty != null
                                  ? <span>{m.usedQty}</span>
                                  : <span className="text-slate-400 italic font-normal text-[12px]">Chưa có</span>
                                }
                              </InfoRow>
                              <InfoRow icon={<Hash size={12} />} label="Đơn vị">
                                {m.unitCode
                                  ? <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-bold">{m.unitCode}</span>
                                  : <span className="text-slate-400 italic font-normal text-[12px]">Chưa có</span>
                                }
                              </InfoRow>
                              <InfoRow icon={<FileText size={12} />} label="Lý do sai lệch">
                                {m.deviationReason
                                  ? <span className="text-amber-600 font-semibold max-w-[130px] block truncate">{m.deviationReason}</span>
                                  : <span className="text-slate-400 italic font-normal text-[12px]">Không có</span>
                                }
                              </InfoRow>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Null/rỗng: vẫn show đủ 4 field, value = "Chưa có" */
                        <div className="px-3.5 py-3 space-y-0">
                          <InfoRow icon={<Package size={12} />} label="Tên vật tư">
                            <span className="text-slate-400 italic font-normal text-[12px]">Chưa có</span>
                          </InfoRow>
                          <InfoRow icon={<Hash size={12} />} label="Số lượng">
                            <span className="text-slate-400 italic font-normal text-[12px]">Chưa có</span>
                          </InfoRow>
                          <InfoRow icon={<Hash size={12} />} label="Đơn vị">
                            <span className="text-slate-400 italic font-normal text-[12px]">Chưa có</span>
                          </InfoRow>
                          <InfoRow icon={<FileText size={12} />} label="Lý do sai lệch">
                            <span className="text-slate-400 italic font-normal text-[12px]">Chưa có</span>
                          </InfoRow>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Timestamp footer */}
              {detail.createdAt && (
                <p className="text-[10px] text-slate-400 text-center pt-4 mt-2 border-t border-slate-100 font-medium">
                  Ghi nhận lúc {new Date(detail.createdAt).toLocaleString('vi-VN')}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}