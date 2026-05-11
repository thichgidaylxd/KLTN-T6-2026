import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, Info, Loader2 } from 'lucide-react';
import { useCrops } from '@/hooks/crops/useCrops';
import { type CropType } from '@/types/crop';

interface CropTypeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cropTypeId: string | null;
}

export const CropTypeDetailModal: React.FC<CropTypeDetailModalProps> = ({
  isOpen,
  onClose,
  cropTypeId,
}) => {
  const { getCropTypeById } = useCrops();
  const [cropType, setCropType] = useState<CropType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && cropTypeId) {
      const loadDetail = async () => {
        setLoading(true);
        try {
          const res = await getCropTypeById(cropTypeId);
          setCropType(res);
        } catch (error) {
          console.error('Failed to fetch crop type detail:', error);
        } finally {
          setLoading(false);
        }
      };
      loadDetail();
    } else {
      setCropType(null);
    }
  }, [isOpen, cropTypeId, getCropTypeById]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Thông tin phân loại</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Danh mục hệ thống</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Đang tải...</p>
                </div>
              ) : cropType ? (
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tên loại cây</span>
                    </div>
                    <p className="text-xl font-bold text-slate-800">{cropType.name}</p>
                  </div>

                  <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mô tả danh mục</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {cropType.description || 'Không có mô tả chi tiết cho mục này.'}
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={onClose}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-100"
                    >
                      Đã hiểu
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400 font-bold text-sm">Không tìm thấy thông tin.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
