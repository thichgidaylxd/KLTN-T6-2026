import React, { useEffect, useState } from 'react';
import { X, Calendar, Sprout, Info, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCrops } from '@/hooks/crops/useCrops';
import { CreateSeasonPlanRequest } from '@/types/seasonPlan';
import { createPlanRequestSchema } from '@/schemas/seasonPlanSchemas';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/DateInput';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: CreateSeasonPlanRequest) => Promise<void>;
}

export function CreatePlanModal({
  isOpen,
  onClose,
  onSave,
}: CreatePlanModalProps) {
  const { crops, fetchCrops, loading: cropsLoading } = useCrops();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cropId, setCropId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCrops();
      setError(''); // Clear error when opening
    }
  }, [isOpen, fetchCrops]);

  // Auto-generate name
  useEffect(() => {
    if (cropId && !name) { // Only auto-fill if name is empty
      const crop = crops.find((c) => c.id === cropId);
      if (crop) {
        setName(`${crop.name} - Vụ mùa ${new Date().getFullYear()}`);
      }
    }
  }, [cropId, crops, name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = createPlanRequestSchema.safeParse({
      cropId,
      name,
      startDate,
      endDate,
      note: '',
    });

    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    const crop = crops.find(c => c.id === cropId);
    if (!crop) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name: validation.data.name,
        cropId: validation.data.cropId,
        startDate: validation.data.startDate,
        endDate: validation.data.endDate,
        note: validation.data.note || '', 
      });

      // Reset only on success
      setCropId('');
      setStartDate('');
      setEndDate('');
      setName('');
      onClose();
    } catch (err: any) {
      console.error('[CreatePlanModal] Submit failed:', err);
      setError(err.message || 'Có lỗi xảy ra khi tạo kế hoạch');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100"
        >
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <Calendar size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Thiết lập mùa vụ</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Khởi tạo kế hoạch sản xuất</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="p-4 text-xs font-bold text-rose-600 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-2">
                <Info size={14} />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Cây trồng mục tiêu</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Sprout size={18} />
                </div>
                <select
                  value={cropId}
                  onChange={(e) => setCropId(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl py-3 pl-12 pr-4 outline-none transition-all font-bold text-slate-700 appearance-none disabled:opacity-50"
                  disabled={cropsLoading}
                >
                  <option value="">{cropsLoading ? 'Đang tải cây trồng...' : 'Chọn cây trồng muốn canh tác'}</option>
                  {crops.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {crop.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DateInput
                label="Ngày bắt đầu"
                value={startDate}
                onChange={setStartDate}
              />
              <DateInput
                label="Ngày kết thúc"
                value={endDate}
                onChange={setEndDate}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Tên kế hoạch</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Vụ mùa Đông Xuân 2024"
                className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-2xl py-3 px-4 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="flex-1 py-6 rounded-2xl font-black uppercase tracking-wider text-slate-400 hover:text-slate-600"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] py-6 rounded-2xl font-black uppercase tracking-wider bg-slate-900 text-white shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all border-none relative overflow-hidden"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    <span>Đang tạo kế hoạch...</span>
                  </div>
                ) : (
                  'Tạo kế hoạch'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
