import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";
import { useWarehouses } from "@/hooks/warehouses/useWarehouses";
import { usePlots } from "@/hooks/plots/usePlots";
import { X, Loader2, Warehouse, Info, Save } from "lucide-react";
import LocationPickerMap from "./LocationPickerMap";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { createWarehouseSchema, type CreateWarehouseFormValues } from "@/schemas/warehouseSchemas";
import { Warehouse as WarehouseType } from "@/types/warehouse/warehouse";

interface Props {
  farmId: string;
  warehouse: WarehouseType;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditWarehouseModal({ farmId, warehouse, isOpen, onClose, onSuccess }: Props) {
  const { updateWarehouse, submitting } = useWarehouses();
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
  });

  // Pre-fill dữ liệu khi mở modal
  useEffect(() => {
    if (isOpen && warehouse) {
      reset({
        name: warehouse.name,
        description: warehouse.description || "",
        address: warehouse.address || "",
        latitude: warehouse.latitude || 0,
        longitude: warehouse.longitude || 0,
      });
      
      if (warehouse.latitude && warehouse.longitude) {
        setLocation({ lat: warehouse.latitude, lng: warehouse.longitude });
      }
      
      if (farmId) {
        void fetchPlots();
      }
    }
  }, [isOpen, warehouse, reset, farmId, fetchPlots]);

  const handleLocationChange = (coords: { lat: number; lng: number } | null) => {
    setLocation(coords);
    if (coords) {
      setValue("latitude", coords.lat, { shouldValidate: true });
      setValue("longitude", coords.lng, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: CreateWarehouseFormValues) => {
    try {
      // Backend PATCH yêu cầu field version để chống conflict
      const payload = {
        ...data,
        version: warehouse.version
      };
      
      await updateWarehouse(farmId, warehouse.id, payload).unwrap();
      toast.success("Cập nhật kho hàng thành công!");
      onClose();
      onSuccess?.();
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : "Có lỗi xảy ra khi cập nhật kho hàng");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 shrink-0">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 text-blue-600">
              <Warehouse className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Chỉnh sửa kho hàng</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Cập nhật thông tin và vị trí kho hàng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form id="edit-warehouse-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6 text-left">
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
              <LocationPickerMap value={location} onChange={handleLocationChange} plots={plots} />
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
            onClick={onClose}
            className="flex-1 rounded-2xl h-[54px] font-bold"
          >
            Hủy bỏ
          </Button>
          <Button
            form="edit-warehouse-form"
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
                <Save className="w-4 h-4" />
                <span>Lưu thay đổi</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
