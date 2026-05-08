import { useEffect } from 'react';
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
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useFarms } from '@/hooks/farms/useFarms';
import { farmEditSchema, FarmEditInput } from '../../schemas/farmSchemas';
import type { UpdateFarmRequest } from '../../types/farm';

interface EditFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  farm: any | null;
  onSuccess?: () => void;
}

export function EditFarmModal({ isOpen, onClose, farm, onSuccess }: EditFarmModalProps) {
  const { updateFarm } = useFarms();


  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FarmEditInput>({
    resolver: zodResolver(farmEditSchema),
    defaultValues: {
      name: '',
      description: '',
    }
  });

  useEffect(() => {
    if (farm && isOpen) {
      reset({
        name: farm.name || farm.farmName || '',
        description: farm.description || '',
      });
    }
  }, [farm, isOpen, reset]);

   const onSubmit = async (data: FarmEditInput) => {
     try {
       const targetFarmId = farm.id || farm.farmId;
       if (!targetFarmId) {
         toast.error('Không tìm thấy ID trang trại');
         return;
       }

       const updateData: UpdateFarmRequest = {
         name: data.name,
         description: data.description || '',
       };
       if (farm.version !== undefined) {
         updateData.version = farm.version;
       }

       await updateFarm(targetFarmId, updateData).unwrap();
      
      toast.success('Cập nhật trang trại thành công');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Đã xảy ra lỗi hệ thống');
    }
  };

  if (!farm) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — fixed để luôn cover full viewport */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && onClose()}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          />

          {/* Scroll container */}
          <div className="fixed inset-0 z-[101] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-[520px] bg-white rounded-[32px] shadow-2xl pointer-events-auto"
              >
                {/* Header */}
                <div className="p-8 pb-0 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                      <Trees size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">Chỉnh sửa trang trại</h2>
                      <p className="text-gray-400 text-sm font-medium">Cập nhật thông tin cho trang trại</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="rounded-full hover:bg-gray-100"
                  >
                    <X size={20} />
                  </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                      Tên trang trại <span className="text-red-500">*</span>
                    </label>
                    <Input
                      {...register('name')}
                      placeholder="Ví dụ: Trang Trại Xanh"
                      className="h-12 bg-gray-50 border-gray-100 focus:bg-white transition-all text-base font-medium rounded-xl"
                    />
                    {errors.name && (
                      <span className="text-red-500 text-[10px] font-bold pl-1 uppercase tracking-wider">
                        {errors.name.message}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                      Mô tả ngắn
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 text-gray-400" size={16} />
                      <textarea
                        {...register('description')}
                        rows={3}
                        placeholder="Kể về trang trại của bạn..."
                        className="w-full pl-10 p-3 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-base resize-none"
                      />
                    </div>
                  </div>




                  <div className="pt-4 flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="flex-1 h-12 rounded-xl font-bold text-gray-500 hover:bg-gray-50"
                    >
                      Hủy bỏ
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-lg shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <Loader2 size={20} className="animate-spin" />
                          <span>Đang xử lý</span>
                        </div>
                      ) : (
                        'Lưu thay đổi'
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
