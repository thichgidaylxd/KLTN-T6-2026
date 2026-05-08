import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trees,
  FileText,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFarms } from '@/hooks/farms/useFarms';
import { createFarmSchema, type CreateFarmInput } from '../../schemas/farmSchemas';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

interface CreateFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateFarmModal({ isOpen, onClose, onSuccess }: CreateFarmModalProps) {
  const { createFarm, loading } = useFarms();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFarmInput>({
    resolver: zodResolver(createFarmSchema),
    defaultValues: {
      farmName: '',
      description: '',
    },
  });

  const onSubmit = async (data: CreateFarmInput) => {
    try {
      await createFarm(data).unwrap();
      toast.success('Khởi tạo trang trại thành công!');
      reset();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra khi tạo trang trại');
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="flex w-full items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !loading && onClose()}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[520px] max-h-[90vh] overflow-y-auto bg-white rounded-[32px] shadow-2xl pointer-events-auto"
            >
              <>
                  <div className="p-6 pb-0 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                        <Trees size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Thêm trang trại mới</h2>
                        <p className="text-gray-400 text-sm font-medium">Khởi tạo không gian canh tác của bạn</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      disabled={loading}
                      className="rounded-full hover:bg-gray-100"
                    >
                      <X size={20} />
                    </Button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    {/* Farm Name */}
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                        Tên trang trại <span className="text-red-500">*</span>
                      </label>
                      <Input
                        {...register('farmName')}
                        placeholder="Ví dụ: Trang Trại Xanh"
                        className="h-11 bg-gray-50 border-gray-100 focus:bg-white transition-all text-base font-medium rounded-xl"
                      />
                      {errors.farmName && (
                        <span className="text-red-500 text-[10px] font-bold pl-1 uppercase tracking-wider">{errors.farmName.message}</span>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                        Mô tả ngắn
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 text-gray-400" size={16} />
                        <textarea
                          {...register('description')}
                          rows={4}
                          placeholder="Kể về trang trại của bạn..."
                          className="w-full pl-10 p-3 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-base resize-none"
                        />
                      </div>
                      {errors.description && (
                        <span className="text-red-500 text-[10px] font-bold pl-1 uppercase tracking-wider">{errors.description.message}</span>
                      )}
                    </div>


                    <div className="pt-2 flex gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 h-11 rounded-xl font-bold text-gray-500 hover:bg-gray-50"
                      >
                        Hủy bỏ
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-base shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-70"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 size={20} className="animate-spin" />
                            <span>Đang xử lý</span>
                          </div>
                        ) : (
                          "Tạo trang trại"
                        )}
                      </Button>
                    </div>
                  </form>
              </>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
