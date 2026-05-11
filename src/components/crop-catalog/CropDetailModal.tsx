import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Loader2,
  Sprout,
  Tag,
  Info,
  Image as ImageIcon
} from 'lucide-react';
import { useCrops } from '@/hooks/crops/useCrops';
import { useAuth } from '@/hooks/auth/useAuth';

interface CropDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cropId: string | null;
  isFarmScope?: boolean;
}

export const CropDetailModal: React.FC<CropDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  cropId,
  isFarmScope = false 
}) => {
  const { getCropById, getFarmCropById } = useCrops();
  const { currentFarmId } = useAuth();
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!cropId) return;
      setLoading(true);
      try {
        let fullResponse;
        if (isFarmScope && currentFarmId) {
          fullResponse = await getFarmCropById(currentFarmId, cropId).unwrap();
        } else {
          fullResponse = await getCropById(cropId).unwrap();
        }
        setResponse(fullResponse);
      } catch (err) {
        console.error('Error fetching crop detail:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && cropId) {
      fetchDetail();
    }
  }, [isOpen, cropId, isFarmScope, currentFarmId]);

  if (!isOpen) return null;

  const data = response?.data;

  const DetailItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: any }) => (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon size={14} />
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-sm font-bold text-slate-700 leading-relaxed">
        {value || <span className="text-slate-300 font-medium italic">Chưa có thông tin</span>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px]"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.99, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.99, y: 10 }}
        className="relative bg-white w-full max-w-2xl overflow-hidden rounded-[24px] shadow-2xl flex flex-col border border-slate-100"
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Chi tiết cây trồng</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content Section - Horizontal Layout */}
        <div className="flex-1 overflow-y-auto p-8 max-h-[70vh] custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 text-slate-200 animate-spin" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Left Column: Text Info */}
              <div className="space-y-8">
                <DetailItem icon={Sprout} label="Tên cây trồng" value={data?.name} />
                
                <div className="space-y-6 pt-2">
                  <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-5">
                    <DetailItem icon={Tag} label="Tên loại cây trồng" value={data?.cropType?.name} />
                    <DetailItem icon={Info} label="Mô tả loại" value={data?.cropType?.description} />
                  </div>
                </div>

                <DetailItem icon={Info} label="Mô tả giống cây" value={data?.description} />
              </div>

              {/* Right Column: Image */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <ImageIcon size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Hình ảnh minh họa</span>
                </div>
                <div className="aspect-square bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100 flex items-center justify-center overflow-hidden">
                  {data?.imageUrl && data.imageUrl !== 'string' && data.imageUrl !== "" ? (
                    <img src={data.imageUrl} alt={data.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-slate-300">
                      <ImageIcon size={48} strokeWidth={1} />
                      <span className="text-[11px] font-bold uppercase tracking-widest">Chưa có hình ảnh</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-50 flex justify-end gap-3 bg-slate-50/30">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
          >
            Đóng cửa sổ
          </button>
        </div>
      </motion.div>
    </div>
  );
};
