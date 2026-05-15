import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Loader2 } from 'lucide-react';
import { CreateSoilRecordRequest } from '@/types/soilRecord/soilRecord';
import { Plot } from '@/types/plot/plot';
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateSoilRecordRequest, file?: File) => Promise<void>;
  isLoading?: boolean;
  plots: Plot[];
}
const inputClass =
  'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all bg-white';
const labelClass = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5';
const errorClass = 'text-xs text-red-500 mt-1';

export const CreateSoilRecordModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
  plots,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

const [form, setForm] = useState<CreateSoilRecordRequest>({
  plotId: '',
  sampledAt: '',
  ph: undefined,
  nitrogenMgKg: undefined,
  phosphorusMgKg: undefined,
  potassiumMgKg: undefined,
  moisturePercent: undefined,
  notes: '',
  sourceFileUrl: '',
});

const handleChange = (
  field: keyof CreateSoilRecordRequest,
  value: string,
) => {
  setForm((prev) => ({
    ...prev,
    [field]: value,
  }));

  setErrors((prev) => ({
    ...prev,
    [field]: '',
  }));
};
  const handleNumberChange = (field: keyof CreateSoilRecordRequest, value: string) => {
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
    if (!form.plotId) {
  newErrors.plotId = 'Vui lòng chọn lô đất';
}
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    await onSave(form, selectedFile || undefined);
    handleReset();
  };

  const handleReset = () => {
setForm({
  plotId: '',
  sampledAt: '',
  ph: undefined,
  nitrogenMgKg: undefined,
  phosphorusMgKg: undefined,
  potassiumMgKg: undefined,
  moisturePercent: undefined,
  notes: '',
  sourceFileUrl: '',
});
    setSelectedFile(null);
    setErrors({});
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between rounded-t-3xl z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Thêm bản ghi đất mới</h2>
            <p className="text-xs text-slate-400 mt-0.5">Điền thông tin phân tích mẫu đất</p>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Ngày lấy mẫu */}
          <div>
            <label className={labelClass}>Ngày lấy mẫu *</label>
            <input
              type="date"
              value={form.sampledAt}
              onChange={(e) => handleChange('sampledAt', e.target.value)}
              className={inputClass}
            />
            {errors.sampledAt && <p className={errorClass}>{errors.sampledAt}</p>}
          </div>
          {/* Lô đất */}
<div>
  <label className={labelClass}>Lô đất *</label>

  <select
    value={form.plotId}
    onChange={(e) => handleChange('plotId', e.target.value)}
    className={inputClass}
  >
    <option value="">Chọn lô đất</option>

    {plots.map((plot) => (
      <option key={plot.id} value={plot.id}>
        {plot.name}
      </option>
    ))}
  </select>

  {errors.plotId && (
    <p className={errorClass}>{errors.plotId}</p>
  )}
</div>

          {/* Chỉ số đất - Grid 2 cột */}
          <div>
            <label className={labelClass}>Chỉ số đất</label>
            <div className="grid grid-cols-2 gap-3">
              {/* pH */}
              <div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="14"
                    placeholder="pH (0–14)"
                    value={form.ph ?? ''}
                    onChange={(e) => handleNumberChange('ph', e.target.value)}
                    className={inputClass}
                  />
                </div>
                {errors.ph && <p className={errorClass}>{errors.ph}</p>}
              </div>

              {/* Độ ẩm */}
              <div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="Độ ẩm % (0–100)"
                  value={form.moisturePercent ?? ''}
                  onChange={(e) => handleNumberChange('moisturePercent', e.target.value)}
                  className={inputClass}
                />
                {errors.moisturePercent && <p className={errorClass}>{errors.moisturePercent}</p>}
              </div>

              {/* Nitrogen */}
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Nitơ N (mg/kg)"
                value={form.nitrogenMgKg ?? ''}
                onChange={(e) => handleNumberChange('nitrogenMgKg', e.target.value)}
                className={inputClass}
              />

              {/* Phosphorus */}
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Lân P (mg/kg)"
                value={form.phosphorusMgKg ?? ''}
                onChange={(e) => handleNumberChange('phosphorusMgKg', e.target.value)}
                className={inputClass}
              />

              {/* Potassium - full width */}
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Kali K (mg/kg)"
                value={form.potassiumMgKg ?? ''}
                onChange={(e) => handleNumberChange('potassiumMgKg', e.target.value)}
                className={`${inputClass} col-span-2`}
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className={labelClass}>Ghi chú</label>
            <textarea
              rows={3}
              placeholder="Nhập ghi chú thêm về mẫu đất..."
              value={form.notes ?? ''}
              onChange={(e) => handleChange('notes', e.target.value)}
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
            />
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
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3 p-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50/50 transition-all"
              >
                <Upload size={18} />
                <span>Chọn file PDF để đính kèm</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-3xl">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {isLoading ? 'Đang lưu...' : 'Tạo bản ghi'}
          </button>
        </div>
      </div>
    </div>
  );
};