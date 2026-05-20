import React, { useState } from 'react';
import { X, Loader2, Image as ImageIcon, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlots } from '@/hooks/plots/usePlots';
import { useCrops } from '@/hooks/crops/useCrops';
import { useDiseaseReports } from '@/hooks/diseaseReport/useDiseaseReports';

interface CreateDiseaseReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateDiseaseReportModal: React.FC<CreateDiseaseReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { plots } = usePlots();
  const { allCrops } = useCrops();
  const { createReport } = useDiseaseReports();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    plotId: '',
    cropId: '',
    locationNotes: '',
    description: '',
    imageUrl: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plotId || !formData.cropId || !formData.description) {
      alert("Vui lòng điền các thông tin bắt buộc (Lô trồng, Cây trồng, Mô tả)");
      return;
    }

    try {
      setIsSubmitting(true);
      await createReport({
        plotId: formData.plotId,
        cropId: formData.cropId,
        locationNotes: formData.locationNotes,
        description: formData.description,
        imageUrl: formData.imageUrl || undefined
      });
      alert('Tạo báo cáo thành công!');
      onClose();
      setFormData({
        plotId: '',
        cropId: '',
        locationNotes: '',
        description: '',
        imageUrl: ''
      });
    } catch (error: any) {
      alert(error.message || 'Có lỗi xảy ra khi tạo báo cáo');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-800">Tạo báo cáo sâu bệnh</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Lô đất <span className="text-red-500">*</span></label>
                <select
                  value={formData.plotId}
                  onChange={e => setFormData({ ...formData, plotId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="">Chọn lô đất</option>
                  {plots.map(plot => (
                    <option key={plot.id} value={plot.id}>{plot.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Cây trồng <span className="text-red-500">*</span></label>
                <select
                  value={formData.cropId}
                  onChange={e => setFormData({ ...formData, cropId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="">Chọn cây trồng</option>
                  {allCrops.map((crop: any) => (
                    <option key={crop.id} value={crop.id}>{crop.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Vị trí cụ thể</label>
              <input
                type="text"
                value={formData.locationNotes}
                onChange={e => setFormData({ ...formData, locationNotes: e.target.value })}
                placeholder="Góc Tây Bắc của lô, hàng số 3..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Mô tả tình trạng <span className="text-red-500">*</span></label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Lá bị đốm vàng, sâu ăn lá..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Hình ảnh minh họa (URL hoặc tải lên)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="Nhập URL hình ảnh hoặc tải lên..."
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    title="Tải ảnh lên"
                  />
                  <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors text-sm font-semibold flex items-center justify-center h-full pointer-events-none whitespace-nowrap">
                    Tải ảnh
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                Xác nhận tạo
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
