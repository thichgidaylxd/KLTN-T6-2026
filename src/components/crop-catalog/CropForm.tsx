import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Plus, Trash2, Upload, AlertCircle, Info, Thermometer, Droplets, FlaskConical, PlusCircle, Image as ImageIcon } from 'lucide-react';
import { useCrops } from '@/hooks/crops/useCrops';
import { type Crop, type CreateCropTypeRequest } from '@/types/crop';
import { createCropSchema, type CreateCropFormInput } from '@/schemas/cropSchemas';
import { QuickAddCropTypeModal } from './QuickAddCropTypeModal';
import { toast } from 'sonner';

interface CropFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  existingCrops: Crop[];
}

type TabType = 'basic' | 'stages' | 'soil' | 'diseases';

export const CropForm: React.FC<CropFormProps> = ({
  onSave,
  onCancel,
  existingCrops,
}) => {
  const { cropTypes, loading: cropTypesLoading, fetchCropTypes, createCropType } = useCrops();

  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [base64Image, setBase64Image] = useState<string>('');

  // Load crop types on mount
  React.useEffect(() => {
    if (cropTypes.length === 0) {
      fetchCropTypes();
    }
  }, [fetchCropTypes, cropTypes.length]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateCropFormInput>({
    resolver: zodResolver(createCropSchema),
    defaultValues: {
      name: '',
      cropTypeId: '',
      description: '',
      imageUrl: '',
      stages: [],
      soil: { phMin: 5.5, phMax: 7.0, nMin: 100, nMax: 200, pMin: 50, pMax: 100, kMin: 100, kMax: 200 },
      diseases: [],
    },
  });

  const { fields: stageFields, append: appendStage, remove: removeStage } = useFieldArray({
    control,
    name: 'stages',
  });

  const { fields: diseaseFields, append: appendDisease, remove: removeDisease } = useFieldArray({
    control,
    name: 'diseases',
  });

  const imageUrl = watch('imageUrl');

  const onSubmit = (data: CreateCropFormInput) => {
    // Kiểm tra trùng tên
    const isDuplicate = existingCrops.some(
      (crop) =>
        crop.name.toLowerCase().trim() === data.name.toLowerCase().trim()
    );

    if (isDuplicate) {
      toast.error(`Tên cây trồng "${data.name}" đã tồn tại trong danh mục hệ thống.`);
      return;
    }

    // Luôn gửi JSON để đảm bảo đúng theo Schema API POST /api/v1/crops (imageUrl: string)
    // Nếu có base64Image (từ việc chọn file), ta dùng nó làm imageUrl.
    const payload = {
      name: data.name,
      cropTypeId: data.cropTypeId,
      description: data.description,
      imageUrl: base64Image || data.imageUrl, // Ưu tiên ảnh upload từ máy (dưới dạng string base64)
    };
    
    onSave(payload);
  };

  const handleQuickAddType = async (typeData: CreateCropTypeRequest) => {
    try {
      await createCropType(typeData).unwrap();
      toast.success('Thêm loại cây thành công');
      setIsTypeModalOpen(false);
    } catch (err: any) {
      toast.error(err || 'Không thể thêm loại cây');
    }
  };

  const handleError = () => {
    if (errors.name || errors.cropTypeId || errors.imageUrl) setActiveTab('basic');
    else if (errors.stages) setActiveTab('stages');
    else if (errors.soil) setActiveTab('soil');
    else if (errors.diseases) setActiveTab('diseases');
    
    toast.error('Vui lòng kiểm tra lại các trường thông tin còn thiếu hoặc sai định dạng.');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Kích thước ảnh upload trực tiếp nên dưới 2MB để đảm bảo hiệu năng');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setBase64Image(base64String);
        setPreviewUrl(base64String);
        setValue('imageUrl', file.name); // Để bypass các kiểm tra UI
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <button
            onClick={onCancel}
            className="p-3 bg-slate-50 text-slate-500 hover:text-slate-800 rounded-2xl hover:bg-slate-100 transition-all active:scale-90"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Thêm mới danh mục
            </h1>
            <p className="text-sm text-slate-500 font-medium">Cấu hình dữ liệu sinh trưởng cho AI tư vấn.</p>
          </div>
        </div>
        <button
          onClick={handleSubmit(onSubmit, handleError)}
          className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 font-bold active:scale-95"
        >
          <Save className="w-5 h-5" />
          Lưu dữ liệu
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="px-10 bg-slate-50/50 border-b border-slate-100">
        <nav className="flex gap-2 p-1">
          {[
            { id: 'basic', name: 'Thông tin chung', icon: Info },
            { id: 'stages', name: 'Giai đoạn sinh trưởng', icon: Thermometer },
            { id: 'soil', name: 'Điều kiện lý hóa', icon: Droplets },
            { id: 'diseases', name: 'Thư viện bệnh hại', icon: FlaskConical },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`
                flex items-center gap-2 px-6 py-4 text-sm font-bold rounded-t-2xl transition-all relative
                ${activeTab === tab.id
                  ? 'bg-white text-green-700 border-x border-t border-slate-100 -mb-[1px] shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.02)]'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'}
              `}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-green-600' : ''}`} />
              {tab.name}
              {errors[tab.id as keyof CreateCropFormInput] && (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-1" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Form Content */}
      <div className="flex-1 p-10 overflow-y-auto">
        <form className="max-w-4xl space-y-8">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tên cây trồng <span className="text-red-500">*</span></label>
                  <input
                    {...register('name')}
                    placeholder="Ví dụ: Cà chua Cherry"
                    className={`w-full px-5 py-3 bg-slate-50 border ${errors.name ? 'border-red-300 bg-red-50' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all`}
                  />
                  {errors.name && <p className="mt-2 text-xs font-bold text-red-500">{errors.name.message}</p>}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-slate-700">Phân loại <span className="text-red-500">*</span></label>
                    <button
                      type="button"
                      onClick={() => setIsTypeModalOpen(true)}
                      className="text-xs font-bold text-green-600 hover:text-green-700 flex items-center gap-1 transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Thêm loại mới
                    </button>
                  </div>
                  <div className="relative">
                    <select
                      {...register('cropTypeId')}
                      disabled={cropTypesLoading}
                      className={`w-full px-5 py-3 bg-slate-50 border ${errors.cropTypeId ? 'border-red-300 bg-red-50' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all appearance-none cursor-pointer disabled:opacity-50`}
                    >
                      <option value="">-- Chọn loại cây trồng --</option>
                      {cropTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {cropTypesLoading && (
                      <div className="absolute right-10 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {errors.cropTypeId && <p className="mt-2 text-xs font-bold text-red-500">{errors.cropTypeId.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Mô tả cây trồng</label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    placeholder="Giới thiệu sơ lược về đặc tính của cây..."
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <label className="block text-sm font-bold text-slate-700">Ảnh cây trồng</label>
                <div className="relative group">
                  <input
                    type="file"
                    id="crop-image-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {previewUrl || imageUrl ? (
                    <div className="relative w-full aspect-video rounded-[24px] overflow-hidden bg-slate-100 ring-4 ring-slate-50 shadow-inner">
                      <img 
                        src={previewUrl || imageUrl} 
                        alt="Crop Preview" 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBase64Image('');
                          setPreviewUrl('');
                          setValue('imageUrl', '');
                        }}
                        className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-xl shadow-lg hover:bg-red-500 hover:text-white transition-all shadow-red-200"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => document.getElementById('crop-image-upload')?.click()}
                      className="w-full aspect-video border-4 border-dashed border-slate-100 rounded-[24px] flex flex-col items-center justify-center bg-slate-50/50 hover:bg-white hover:border-green-300 transition-all cursor-pointer group"
                    >
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Upload className="w-8 h-8 group-hover:text-green-500 transition-colors" />
                      </div>
                      <p className="text-slate-800 font-bold">Tải ảnh từ máy tính</p>
                      <p className="text-slate-400 text-[11px] mt-1 font-medium">Hệ thống sẽ chuyển sang Base64 để lưu trữ</p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  <input
                    {...register('imageUrl')}
                    placeholder={base64Image ? "Đã nhận ảnh từ máy tính" : "Hoặc dán URL ảnh trực tiếp tại đây..."}
                    className="flex-1 bg-transparent text-[11px] font-medium text-slate-500 focus:outline-none"
                  />
                </div>
                {errors.imageUrl && <p className="mt-2 text-xs font-bold text-red-500">{errors.imageUrl.message}</p>}
              </div>
            </div>
          )}

          {/* TAB 2: GROWTH STAGES */}
          {activeTab === 'stages' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Các giai đoạn sinh trưởng</h3>
                  <p className="text-sm text-slate-500 mt-1">Thiết lập lộ trình từ khi gieo hạt đến lúc thu hoạch.</p>
                </div>
                <button
                  type="button"
                  onClick={() => appendStage({ name: '', durationDays: 1, description: '' })}
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 font-bold transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Thêm giai đoạn
                </button>
              </div>

              {stageFields.map((field: any, index: number) => (
                <div key={field.id} className="relative p-10 bg-slate-50/50 border border-slate-100 rounded-[32px] group hover:bg-slate-50 hover:border-green-100 transition-all">
                  <div className="absolute -left-4 top-10 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg ring-8 ring-white z-10">
                    {index + 1}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeStage(index)}
                    className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-8">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Tên giai đoạn *</label>
                      <input
                        {...register(`stages.${index}.name`)}
                        placeholder="Ví dụ: Nảy mầm"
                        className={`w-full px-6 py-4 bg-white border ${errors.stages?.[index]?.name ? 'border-red-300 shadow-[0_0_0_4px_rgba(239,68,68,0.05)]' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-semibold`}
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Độ dài (Ngày) *</label>
                      <input
                        type="number"
                        {...register(`stages.${index}.durationDays`, { valueAsNumber: true })}
                        className={`w-full px-6 py-4 bg-white border ${errors.stages?.[index]?.durationDays ? 'border-red-300 shadow-[0_0_0_4px_rgba(239,68,68,0.05)]' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-bold text-center`}
                      />
                    </div>
                    <div className="md:col-span-12 mt-2">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Mô tả công việc chăm sóc</label>
                      <textarea
                        {...register(`stages.${index}.description`)}
                        placeholder="Ví dụ: Tưới nước 2 lần/ngày, bón phân vi lượng..."
                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all resize-none font-medium h-32"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {errors.stages?.root && <p className="text-sm font-bold text-red-500 text-center">{errors.stages.root.message}</p>}
            </div>
          )}

          {/* TAB 3: SOIL CONDITIONS */}
          {activeTab === 'soil' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-blue-50/80 p-6 rounded-[24px] border border-blue-100 flex gap-4">
                <AlertCircle className="w-6 h-6 text-blue-500 shrink-0" />
                <p className="text-sm text-blue-800 leading-relaxed font-medium">
                  Hệ thống AI sẽ đối chiếu dữ liệu đất của trang trại với các khoảng giá trị này để đưa ra gợi ý nuôi trồng phù hợp nhất.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* pH */}
                <div className="p-8 bg-slate-50/50 rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-400 opacity-50" />
                  <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-indigo-500" />
                    Chỉ số pH (Độ chua/kiềm)
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tối thiểu</label>
                      <input type="number" step="0.1" {...register('soil.phMin', { valueAsNumber: true })} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm" />
                    </div>
                    <div className="mt-4 text-slate-300">─</div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tối đa</label>
                      <input type="number" step="0.1" {...register('soil.phMax', { valueAsNumber: true })} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm" />
                    </div>
                  </div>
                </div>

                {/* Nitơ */}
                <div className="p-8 bg-slate-50/50 rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-green-400 opacity-50" />
                  <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 text-green-700">
                    <Info className="w-4 h-4" />
                    Nitơ (N) - mg/kg
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tối thiểu</label>
                      <input type="number" {...register('soil.nMin', { valueAsNumber: true })} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm" />
                    </div>
                    <div className="mt-4 text-slate-300">─</div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tối đa</label>
                      <input type="number" {...register('soil.nMax', { valueAsNumber: true })} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm" />
                    </div>
                  </div>
                </div>

                {/* Phốt pho */}
                <div className="p-8 bg-slate-50/50 rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400 opacity-50" />
                  <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 text-orange-700">
                    <Info className="w-4 h-4" />
                    Phốt pho (P) - mg/kg
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tối thiểu</label>
                      <input type="number" {...register('soil.pMin', { valueAsNumber: true })} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm" />
                    </div>
                    <div className="mt-4 text-slate-300">─</div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tối đa</label>
                      <input type="number" {...register('soil.pMax', { valueAsNumber: true })} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm" />
                    </div>
                  </div>
                </div>

                {/* Kali */}
                <div className="p-8 bg-slate-50/50 rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-red-400 opacity-50" />
                  <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 text-red-700">
                    <Info className="w-4 h-4" />
                    Kali (K) - mg/kg
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tối thiểu</label>
                      <input type="number" {...register('soil.kMin', { valueAsNumber: true })} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm" />
                    </div>
                    <div className="mt-4 text-slate-300">─</div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tối đa</label>
                      <input type="number" {...register('soil.kMax', { valueAsNumber: true })} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DISEASES */}
          {activeTab === 'diseases' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Cơ sở dữ liệu bệnh hại</h3>
                  <p className="text-xs text-slate-500">Thông tin hỗ trợ AI nhận diện và đưa ra giải pháp bảo vệ cây trồng.</p>
                </div>
                <button
                  type="button"
                  onClick={() => appendDisease({ name: '', symptoms: '', treatment: '', images: [] })}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-bold transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Thêm thẻ bệnh
                </button>
              </div>

              {diseaseFields.length === 0 ? (
                <div className="text-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[32px]">
                  <p className="text-slate-400 font-medium">Chưa có dữ liệu bệnh hại cho loại cây này.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {diseaseFields.map((field: any, index: number) => (
                    <div key={field.id} className="p-8 bg-white border border-slate-100 rounded-[28px] shadow-sm relative group">
                      <button
                        type="button"
                        onClick={() => removeDisease(index)}
                        className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tên bệnh *</label>
                          <input
                            {...register(`diseases.${index}.name`)}
                            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Triệu chứng nhận biết *</label>
                            <textarea
                              {...register(`diseases.${index}.symptoms`)}
                              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 h-24 resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Giải pháp xử lý *</label>
                            <textarea
                              {...register(`diseases.${index}.treatment`)}
                              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 h-24 resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      <QuickAddCropTypeModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        onSave={handleQuickAddType}
        loading={cropTypesLoading}
      />
    </div>
  );
};
