import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const diseaseSchema = z.object({
  name: z.string().min(1, 'Tên bệnh không được để trống'),
  symptoms: z.string().min(1, 'Triệu chứng không được để trống'),
  treatment: z.string().min(1, 'Giải pháp xử lý không được để trống'),
  images: z.array(z.string()).optional().default([]),
  severityLevel: z.string().default('LOW'),
});

type DiseaseFormInput = z.infer<typeof diseaseSchema>;

interface DiseaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DiseaseFormInput) => Promise<void>;
  loading?: boolean;
  initialData?: {
    name: string;
    symptoms: string;
    treatment: string;
    severityLevel?: string;
    images?: string[];
  } | null;
}

export const DiseaseFormModal: React.FC<DiseaseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  loading = false,
  initialData = null,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DiseaseFormInput>({
    resolver: zodResolver(diseaseSchema),
    defaultValues: {
      name: '',
      symptoms: '',
      treatment: '',
      severityLevel: 'LOW',
      images: [],
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        symptoms: initialData.symptoms,
        treatment: initialData.treatment,
        severityLevel: initialData.severityLevel || 'LOW',
        images: initialData.images || [],
      });
    } else {
      reset({
        name: '',
        symptoms: '',
        treatment: '',
        severityLevel: 'LOW',
        images: [],
      });
    }
  }, [initialData, reset, isOpen]);

  const onSubmit = async (data: DiseaseFormInput) => {
    try {
      await onSave(data);
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                  {initialData ? 'Cập nhật thông tin bệnh' : 'Thêm bệnh hại mới'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Cung cấp các thông tin chẩn đoán và khắc phục dịch bệnh cho hệ thống.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-700 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                  Tên bệnh hại *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm font-bold text-slate-800 transition-all placeholder:text-slate-300"
                  placeholder="Ví dụ: Bệnh sương mai hại dưa chuột"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1.5 font-bold">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                  Triệu chứng nhận biết *
                </label>
                <textarea
                  rows={4}
                  {...register('symptoms')}
                  className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm font-semibold text-slate-600 transition-all placeholder:text-slate-300 resize-none"
                  placeholder="Mô tả các dấu hiệu trên lá, quả, thân..."
                />
                {errors.symptoms && (
                  <p className="text-red-500 text-xs mt-1.5 font-bold">{errors.symptoms.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                  Giải pháp điều trị & Khắc phục *
                </label>
                <textarea
                  rows={4}
                  {...register('treatment')}
                  className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm font-semibold text-slate-600 transition-all placeholder:text-slate-300 resize-none"
                  placeholder="Hướng dẫn sử dụng thuốc sinh học, kỹ thuật cắt tỉa..."
                />
                {errors.treatment && (
                  <p className="text-red-500 text-xs mt-1.5 font-bold">{errors.treatment.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                  Mức độ nghiêm trọng
                </label>
                <select
                  {...register('severityLevel')}
                  className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm font-semibold text-slate-600 transition-all"
                >
                  <option value="LOW">Thấp</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HIGH">Cao</option>
                </select>
              </div>

              {/* Action Footer */}
              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Lưu thông tin
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
