import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";
import { useWarehouses } from "@/hooks/warehouses/useWarehouses";
import { usePlots } from "@/hooks/plots/usePlots";
import { X, Loader2, Warehouse, Info, MapPin } from "lucide-react";
import LocationPickerMap from "./LocationPickerMap";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { createWarehouseSchema, type CreateWarehouseFormValues } from "@/schemas/warehouseSchemas";

interface Props {
  farmId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateWarehouseModal({ farmId, isOpen, onClose, onSuccess }: Props) {
  const { warehouses, fetchWarehouses, createWarehouse, submitting } = useWarehouses();
  const { plots, fetchPlots } = usePlots();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateWarehouseFormValues>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
    }
  });

  // Tự động nạp danh sách lô đất và kho hàng khi mở modal
  useEffect(() => {
    if (isOpen && farmId) {
      void fetchPlots();
      void fetchWarehouses(farmId);
    }
  }, [isOpen, farmId, fetchPlots, fetchWarehouses]);

  const handleLocationChange = (coords: { lat: number; lng: number } | null) => {
    setLocation(coords);
    if (coords) {
      setValue("latitude", coords.lat, { shouldValidate: true });
      setValue("longitude", coords.lng, { shouldValidate: true });
    } else {
      // @ts-ignore
      setValue("latitude", undefined);
      // @ts-ignore
      setValue("longitude", undefined);
    }
  };

  const onSubmit = async (data: CreateWarehouseFormValues) => {
    try {
      await createWarehouse(farmId, {
        ...data,
        latitude: data.latitude ?? 0,
        longitude: data.longitude ?? 0,
      }).unwrap();
      toast.success("Tạo kho hàng thành công!");
      handleClose();
      onSuccess?.();
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : "Có lỗi xảy ra khi tạo kho hàng");
    }
  };

  const handleClose = () => {
    reset();
    setLocation(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 shrink-0">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
              <Warehouse className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Thêm kho hàng mới</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Xác định vị trí kho trên bản đồ Google Maps</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form id="create-warehouse-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Thông tin cơ bản */}
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Tên kho hàng <span className="text-rose-500">*</span>
                </label>
                <Input
                  {...register("name")}
                  placeholder="VD: Kho tổng A1"
                  className="font-bold"
                />
                {errors.name && (
                  <p className="mt-1.5 text-[10px] font-bold text-rose-500 flex items-center gap-1">
                    <Info size={10} /> {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Mô tả</label>
                <Textarea
                  {...register("description")}
                  placeholder="Mô tả công năng của kho..."
                  rows={3}
                  className="font-bold"
                />
              </div>

              {location && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 text-emerald-600 shadow-sm">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tọa độ đã chọn</p>
                      <p className="text-sm font-black text-slate-700 font-mono">
                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleLocationChange(null as any)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Địa chỉ cụ thể
                </label>
                <Input
                  {...register("address")}
                  placeholder="Số nhà, tên đường, khu vực... (không bắt buộc)"
                  className="font-bold"
                />
              </div>
            </div>

            {/* Bản đồ chọn tọa độ */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Vị trí tọa độ <span className="text-rose-500">*</span>
              </label>
              <LocationPickerMap 
                value={location} 
                onChange={handleLocationChange} 
                plots={plots} 
                warehouses={warehouses}
              />
              {(errors.latitude || errors.longitude) && (
                <p className="mt-1 text-[10px] font-bold text-rose-500 flex items-center gap-1">
                  <Info size={10} /> Vui lòng click chọn vị trí trên bản đồ
                </p>
              )}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-slate-50 flex gap-4 shrink-0 bg-slate-50/50">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1 rounded-2xl h-[54px] font-bold"
          >
            Hủy bỏ
          </Button>
          <Button
            form="create-warehouse-form"
            type="submit"
            variant="dark-olive"
            disabled={submitting}
            className="flex-[2] rounded-2xl h-[54px] font-bold flex items-center justify-center gap-2 shadow-lg"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Warehouse className="w-4 h-4" />
                <span>Hoàn tất tạo kho</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
