import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  FlaskConical,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Lock,
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/auth/useAuth';
import { SoilRecord, CreateSoilRecordRequest, UpdateSoilRecordRequest } from '@/types/soilRecord/soilRecord';
import { extractErrorMessage } from '@/utils/errorUtils';
import { CreateSoilRecordModal } from '@/components/soilRecord/CreateSoilRecordModal';
import { EditSoilRecordModal } from '@/components/soilRecord/EditSoilRecordModal';
import { DeleteSoilRecordDialog } from '@/components/soilRecord/DeleteSoilRecordDialog';
import { useSoilRecords } from '@/hooks/soilRecord/useSoilRecord';
import { usePlots } from '@/hooks/plots/usePlots';
// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────



function classify(
  value: number | undefined,
  low: number,
  high: number,
): { label: 'Thấp' | 'Vừa' | 'Cao'; color: string; bg: string } {
  if (value === undefined || value === null)
    return { label: 'Thấp', color: 'text-slate-400', bg: 'bg-slate-50' };
  if (value < low) return { label: 'Thấp', color: 'text-red-600', bg: 'bg-red-50' };
  if (value <= high) return { label: 'Vừa', color: 'text-amber-600', bg: 'bg-amber-50' };
  return { label: 'Cao', color: 'text-emerald-600', bg: 'bg-emerald-50' };
}

function classifyPH(ph?: number) {
  return classify(ph, 5.5, 7.5);
}

function formatDate(iso: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CardMenu
// ─────────────────────────────────────────────────────────────────────────────

interface CardMenuProps {
  record: SoilRecord;
  onEdit: (r: SoilRecord) => void;
  onDelete: (r: SoilRecord) => void;
}

const CardMenu: React.FC<CardMenuProps> = ({ record, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const isLocked = !!record.lockedAt;

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 bg-white border border-slate-100 rounded-2xl shadow-xl w-44 py-1.5 overflow-hidden">
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(record); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Pencil size={14} className="text-slate-400" />
              {isLocked ? 'Xem chi tiết' : 'Chỉnh sửa'}
            </button>
            {record.sourceFileUrl && (
              <a
                href={record.sourceFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ExternalLink size={14} className="text-slate-400" />
                Xem file PDF
              </a>
            )}
            {!isLocked && (
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(record); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
                Xóa
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RecordCard
// ─────────────────────────────────────────────────────────────────────────────

interface RecordCardProps {
  record: SoilRecord;
  onEdit: (r: SoilRecord) => void;
  onDelete: (r: SoilRecord) => void;
}

const RecordCard: React.FC<RecordCardProps> = ({ record, onEdit, onDelete }) => {
  const phClass = classifyPH(record.ph);
  const nClass = classify(record.nitrogenMgKg, 50, 150);
  const pClass = classify(record.phosphorusMgKg, 10, 30);
  const kClass = classify(record.potassiumMgKg, 100, 200);
  const isLocked = !!record.lockedAt;

  const stats = [
    { label: 'pH', value: record.ph?.toFixed(1), cls: phClass },
    { label: 'N', value: record.nitrogenMgKg?.toFixed(0), cls: nClass },
    { label: 'P', value: record.phosphorusMgKg?.toFixed(0), cls: pClass },
    { label: 'K', value: record.potassiumMgKg?.toFixed(0), cls: kClass },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all group cursor-pointer relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex gap-3.5">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
            <FlaskConical size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">{record.plot?.name ?? '—'}</h3>
              {isLocked && (
                <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                  <Lock size={9} /> Đã khóa
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">📅 {formatDate(record.sampledAt)}</p>
          </div>
        </div>
        <CardMenu record={record} onEdit={onEdit} onDelete={onDelete} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2.5 mb-5">
        {stats.map(({ label, value, cls }) => (
          <div key={label} className="bg-slate-50 rounded-2xl p-2.5 text-center">
            <p className="text-[9px] font-bold text-slate-400 mb-1 uppercase">{label}</p>
            <p className="text-sm font-black text-slate-700 mb-1 leading-none">{value ?? '—'}</p>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${cls.color} ${cls.bg}`}>
              {cls.label}
            </span>
          </div>
        ))}
      </div>

      {/* Moisture row */}
      {record.moisturePercent !== undefined && record.moisturePercent !== null && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Độ ẩm</span>
            <span className="text-xs font-black text-slate-700">{record.moisturePercent.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
              style={{ width: `${Math.min(record.moisturePercent, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-wider">
          <Sparkles size={13} className="animate-pulse" />
          AI gợi ý sẵn sàng
        </div>
        <ChevronRight
          size={17}
          className="text-slate-300 group-hover:translate-x-1 group-hover:text-emerald-500 transition-all"
        />
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-emerald-50/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export const SoilProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { farmId } = useParams<{ farmId: string }>();
  const { currentFarmId } = useAuth();

  const {
    soilRecords,
    loading,
    createSoilRecord,
    updateSoilRecord,
    deleteSoilRecord,
    uploadFile,
  } = useSoilRecords(); // Farm-wide query (không truyền plotId)

const { plots } = usePlots(currentFarmId || undefined);
  // ── UI state ──────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SoilRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<SoilRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return soilRecords;
    const q = searchTerm.toLowerCase();
    return soilRecords.filter(
      (r) =>
        r.plot?.name?.toLowerCase().includes(q) ||
        r.sampledAt?.includes(q) ||
        r.notes?.toLowerCase().includes(q),
    );
  }, [soilRecords, searchTerm]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const lockedCount = soilRecords.filter((r) => !!r.lockedAt).length;
  const totalCount = soilRecords.length;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreate = async (data: CreateSoilRecordRequest, file?: File) => {
    setIsSaving(true);
    try {
      let sourceFileUrl = data.sourceFileUrl;
      if (file) {
        sourceFileUrl = await uploadFile(file);
      }

      const plotId = (data as any).plotId as string;
      if (!plotId) throw new Error('Vui lòng chọn lô đất');

      await createSoilRecord(plotId, { ...data, sourceFileUrl }).unwrap();
      setIsCreateOpen(false);
      toast.success('Tạo bản ghi đất thành công');
    } catch (err: any) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (
    record: SoilRecord,
    updated: UpdateSoilRecordRequest,
    file?: File,
  ) => {
    setIsSaving(true);
    try {
      let sourceFileUrl = updated.sourceFileUrl;
      if (file) {
        sourceFileUrl = await uploadFile(file);
      }

      await updateSoilRecord(record.plot.id, record.id, {
        ...updated,
        sourceFileUrl,
      }).unwrap();

      setEditingRecord(null);
      toast.success('Cập nhật bản ghi đất thành công');
    } catch (err: any) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRecord) return;
    setIsSaving(true);
    try {
      await deleteSoilRecord(deletingRecord.plot.id, deletingRecord.id).unwrap();
      toast.success('Đã xóa bản ghi đất');
      setDeletingRecord(null);
    } catch (err: any) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full flex-1 flex flex-col font-sans bg-slate-50 min-h-0 text-left">
      {/* ── Header ── */}
      <div
        className="bg-white px-5 flex items-center justify-between border-b border-slate-200 shrink-0"
        style={{ height: '56px' }}
      >
        <div className="flex items-center">
          <button
            onClick={() => navigate(`/farms/${farmId}/actions`)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
          >
            <ArrowLeft size={15} /> Quay lại
          </button>
          <div className="w-px bg-slate-200 mx-4 self-stretch my-2" />
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20 flex items-center justify-center text-white mr-4 shrink-0">
            <FlaskConical size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Hồ sơ đất</h1>
            <p className="text-sm text-slate-500 font-medium leading-tight mt-1">
              Quản lý bản ghi phân tích đất theo lô
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all active:scale-95 font-bold text-sm shadow-md shadow-emerald-600/20"
        >
          <Plus size={18} strokeWidth={2.5} /> Thêm bản ghi
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="bg-white border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 shrink-0 shadow-sm">
        <div className="px-8 py-5 flex flex-col justify-center hover:bg-slate-50/50 transition-colors">
          <div className="text-[13px] text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Tổng bản ghi</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{totalCount}</span>
            <span className="text-sm text-slate-500 font-semibold">bản ghi</span>
          </div>
        </div>
        <div className="px-8 py-5 flex flex-col justify-center hover:bg-slate-50/50 transition-colors">
          <div className="text-[13px] text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Đã khóa</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-amber-600 tracking-tight">{lockedCount}</span>
            <span className="text-lg text-slate-400 font-bold">/ {totalCount}</span>
          </div>
        </div>
        <div className="px-8 py-5 flex flex-col justify-center hover:bg-slate-50/50 transition-colors">
          <div className="text-[13px] text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Lô đất được đo</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
              {new Set(soilRecords.map((r) => r.plot?.id)).size}
            </span>
            <span className="text-sm text-slate-500 font-semibold">lô</span>
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="bg-white border-b border-slate-100 px-5 py-3 flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-md group">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
          />
          <input
            type="text"
            placeholder="Tìm theo lô đất, ngày lấy mẫu, ghi chú..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm"
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-slate-400 gap-2">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-medium">Đang tải dữ liệu...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-start p-16 bg-white rounded-3xl border border-slate-100">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300 border border-slate-100">
              <FlaskConical size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Không tìm thấy bản ghi nào</h3>
            <p className="text-slate-500 mt-1 font-medium text-sm">
              {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm.' : 'Thêm bản ghi đất đầu tiên để bắt đầu.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                onEdit={setEditingRecord}
                onDelete={setDeletingRecord}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
<CreateSoilRecordModal
  isOpen={isCreateOpen}
  onClose={() => setIsCreateOpen(false)}
  onSave={handleCreate}
  isLoading={isSaving}
  plots={plots}
/>

      <EditSoilRecordModal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={handleUpdate}
        soilRecord={editingRecord}
        isLoading={isSaving}
      />

      <DeleteSoilRecordDialog
        isOpen={!!deletingRecord}
        onClose={() => setDeletingRecord(null)}
        onConfirm={handleDelete}
        soilRecord={deletingRecord}
        isLoading={isSaving}
      />
    </div>
  );
};

export default SoilProfilePage;