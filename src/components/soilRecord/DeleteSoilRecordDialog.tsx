import React from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { SoilRecord } from '@/types/soilRecord/soilRecord';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  soilRecord: SoilRecord | null;
  isLoading?: boolean;
}

export const DeleteSoilRecordDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  soilRecord,
  isLoading,
}) => {
  if (!isOpen || !soilRecord) return null;

  const plotName = soilRecord.plot?.name ?? 'lô đất';
  const date = soilRecord.sampledAt;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400"
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle size={26} className="text-red-500" />
        </div>

        <h2 className="text-lg font-bold text-slate-900 mb-1">Xóa bản ghi đất?</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Bạn có chắc muốn xóa bản ghi đất ngày <strong className="text-slate-700">{date}</strong> của{' '}
          <strong className="text-slate-700">{plotName}</strong>? Hành động này sẽ đánh dấu xóa mềm và không thể khôi phục.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-all active:scale-95 disabled:opacity-60 shadow-md shadow-red-600/20"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {isLoading ? 'Đang xóa...' : 'Xóa bản ghi'}
          </button>
        </div>
      </div>
    </div>
  );
};