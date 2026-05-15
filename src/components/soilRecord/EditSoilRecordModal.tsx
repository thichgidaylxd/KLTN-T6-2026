import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, Lock, Loader2, ExternalLink } from 'lucide-react';
import { SoilRecord, UpdateSoilRecordRequest } from '@/types/soilRecord/soilRecord';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (soilRecord: SoilRecord, updatedData: UpdateSoilRecordRequest, file?: File) => Promise<void>;
  soilRecord: SoilRecord | null;
  isLoading?: boolean;
}

const inputClass =
  'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all bg-white disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed';
const labelClass = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5';
const errorClass = 'text-xs text-red-500 mt-1';

export const EditSoilRecordModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  soilRecord,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<UpdateSoilRecordRequest>({
    sampledAt: '',
    isLocked: false,
  });

  const isLocked = !!soilRecord?.lockedAt;

  useEffect(() => {
    if (soilRecord) {
      setForm({
        sampledAt: soilRecord.sampledAt ?? '',
        ph: soilRecord.ph,
        nitrogenMgKg: soilRecord.nitrogenMgKg,
        phosphorusMgKg: soilRecord.phosphorusMgKg,
        potassiumMgKg: soilRecord.potassiumMgKg,
        moisturePercent: soilRecord.moisturePercent,
        notes: soilRecord.notes ?? '',
        sourceFileUrl: soilRecord.sourceFileUrl ?? '',
        isLocked: !!soilRecord.lockedAt,
      });
      setSelectedFile(null);
      setErrors({});
    }
  }, [soilRecord]);

  if (!isOpen || !soilRecord) return null;

  const handleChange = (field: keyof UpdateSoilRecordRequest, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value === '' ? undefined : value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleNumberChange = (field: keyof UpdateSoilRecordRequest, value: string) => {
    const parsed = value === '' ? undefined : parseFloat(value);
    setForm((prev) => ({ ...prev, [field]: parsed }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.sampledAt) newErrors.sampledAt = 'Vui lòng nhập ngày lấy mẫu';
    if (form.ph !== undefined && (form.ph < 0 || form.ph > 14)) newErrors.ph = 'pH phải từ 0 đến 14';
    if (form.moisturePercent !== undefined && (form.moisturePercent < 0 || form.moisturePercent > 100))
      newErrors.moisturePercent = 'Độ ẩm phải từ 0 đến 100';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isLocked) return;
    if (!validate()) return;
    await onSave(soilRecord, form, selectedFile || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between rounded-t-3xl z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Cập nhật bản ghi đất</h2>
              {isLocked && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Lock size={10} /> Đã khóa
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isLocked ? 'Bản ghi này đã bị khóa, không thể chỉnh sửa' : 'Cập nhật thông tin phân tích mẫu đất'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {isLocked && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <Lock size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700 font-medium">
                Bản ghi đất này đã được khóa và không thể chỉnh sửa nữa.
              </p>
            </div>
          )}

          {/* Lock toggle (chỉ hiện khi chưa lock) */}
          {!isLocked && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-700">Khóa bản ghi</p>
                <p className="text-xs text-slate-400">Sau khi khóa sẽ không thể chỉnh sửa</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.isLocked}
                  onChange={(e) => handleChange('isLocked', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>
          )}

          {/* Ngày lấy mẫu */}
          <div>
            <label className={labelClass}>Ngày lấy mẫu *</label>
            <input
              type="date"
              value={form.sampledAt}
              onChange={(e) => handleChange('sampledAt', e.target.value)}
              disabled={isLocked}
              className={inputClass}
            />
            {errors.sampledAt && <p className={errorClass}>{errors.sampledAt}</p>}
          </div>

          {/* Chỉ số đất */}
          <div>
            <label className={labelClass}>Chỉ số đất</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="14"
                  placeholder="pH (0–14)"
                  value={form.ph ?? ''}
                  onChange={(e) => handleNumberChange('ph', e.target.value)}
                  disabled={isLocked}
                  className={inputClass}
                />
                {errors.ph && <p className={errorClass}>{errors.ph}</p>}
              </div>
              <div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="Độ ẩm % (0–100)"
                  value={form.moisturePercent ?? ''}
                  onChange={(e) => handleNumberChange('moisturePercent', e.target.value)}
                  disabled={isLocked}
                  className={inputClass}
                />
                {errors.moisturePercent && <p className={errorClass}>{errors.moisturePercent}</p>}
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Nitơ N (mg/kg)"
                value={form.nitrogenMgKg ?? ''}
                onChange={(e) => handleNumberChange('nitrogenMgKg', e.target.value)}
                disabled={isLocked}
                className={inputClass}
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Lân P (mg/kg)"
                value={form.phosphorusMgKg ?? ''}
                onChange={(e) => handleNumberChange('phosphorusMgKg', e.target.value)}
                disabled={isLocked}
                className={inputClass}
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Kali K (mg/kg)"
                value={form.potassiumMgKg ?? ''}
                onChange={(e) => handleNumberChange('potassiumMgKg', e.target.value)}
                disabled={isLocked}
                className={`${inputClass} col-span-2`}
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className={labelClass}>Ghi chú</label>
            <textarea
              rows={3}
              placeholder="Nhập ghi chú..."
              value={form.notes ?? ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              disabled={isLocked}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* File đính kèm */}
          <div>
            <label className={labelClass}>File báo cáo (PDF)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              disabled={isLocked}
            />

            {/* Current file from server */}
            {soilRecord.sourceFileUrl && !selectedFile && (
              <a
                href={soilRecord.sourceFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 mb-2 text-xs text-emerald-600 hover:underline"
              >
                <ExternalLink size={13} />
                Xem file hiện tại
              </a>
            )}

            {selectedFile ? (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <FileText size={18} className="text-emerald-600 shrink-0" />
                <span className="text-sm text-emerald-700 font-medium truncate flex-1">
                  {selectedFile.name}
                </span>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-emerald-400 hover:text-emerald-600"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              !isLocked && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-3 p-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50/50 transition-all"
                >
                  <Upload size={18} />
                  <span>{soilRecord.sourceFileUrl ? 'Thay thế file PDF' : 'Chọn file PDF để đính kèm'}</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            {isLocked ? 'Đóng' : 'Hủy'}
          </button>
          {!isLocked && (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};