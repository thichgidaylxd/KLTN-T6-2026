import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Loader2,
  Sprout,
  Tag,
  Info,
  Image as ImageIcon,
  Droplets,
  Thermometer,
  FlaskConical,
  Activity,
  Pencil,
  Trash2,
  Check
} from 'lucide-react';
import { useCrops } from '@/hooks/crops/useCrops';
import { useAuth } from '@/hooks/auth/useAuth';

type TabType = 'basic' | 'stages' | 'soil' | 'diseases';

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
  const { 
    getCropById, 
    getFarmCropById, 
    getCropConditionByCrop, 
    getCropStageByCrop, 
    getDiseasesByCrop, 
    deleteCropCondition,
    removeDiseaseFromCrop,
    updateCropStage,
    deleteCropStage
  } = useCrops();
  const { currentFarmId } = useAuth();
  const [response, setResponse] = useState<any>(null);
  const [extraData, setExtraData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editStageForm, setEditStageForm] = useState<{ name: string; durationDays: number; description: string }>({
    name: '',
    durationDays: 1,
    description: ''
  });

  useEffect(() => {
    const fetchDetail = async () => {
      if (!cropId) return;
      setLoading(true);
      try {
        let fullResponse;
        if (isFarmScope && currentFarmId) {
          fullResponse = await getFarmCropById(currentFarmId, cropId);
        } else {
          fullResponse = await getCropById(cropId);
        }
        setResponse(fullResponse);

        // Lấy thêm dữ liệu chi tiết
        const [conditionRes, stagesRes, diseasesRes] = await Promise.all([
          getCropConditionByCrop(cropId).catch(() => null),
          getCropStageByCrop(cropId, 0, 100).catch(() => null),
          getDiseasesByCrop(cropId).catch(() => [])
        ]);

        setExtraData({
          soil: conditionRes,
          stages: stagesRes?.content || [],
          diseases: diseasesRes || []
        });

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

  const handleDeleteCondition = async () => {
    if (!cropId || !extraData?.soil?.id) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa cấu hình điều kiện lý hóa của cây trồng này?')) return;
    try {
      await deleteCropCondition(cropId, extraData.soil.id);
      setExtraData((prev: any) => ({ ...prev, soil: null }));
    } catch (err: any) {
      console.error('Lỗi khi xóa điều kiện:', err);
      alert(err.message || 'Có lỗi xảy ra khi xóa');
    }
  };

  const handleRemoveDisease = async (diseaseId: string) => {
    if (!cropId) return;
    if (!window.confirm('Bạn có chắc chắn muốn gỡ bệnh hại này khỏi cây trồng?')) return;
    try {
      await removeDiseaseFromCrop(cropId, diseaseId);
      setExtraData((prev: any) => ({
        ...prev,
        diseases: (prev.diseases || []).filter((d: any) => d.id !== diseaseId)
      }));
    } catch (err: any) {
      console.error('Lỗi khi gỡ bệnh hại:', err);
      alert(err.message || 'Có lỗi xảy ra khi gỡ bệnh');
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!cropId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa giai đoạn sinh trưởng này?')) return;
    try {
      await deleteCropStage(cropId, stageId);
      setExtraData((prev: any) => ({
        ...prev,
        stages: (prev.stages || []).filter((s: any) => s.id !== stageId)
      }));
    } catch (err: any) {
      console.error('Lỗi khi xóa giai đoạn:', err);
      alert(err.message || 'Có lỗi xảy ra khi xóa giai đoạn');
    }
  };

  const handleStartEditStage = (stage: any) => {
    setEditingStageId(stage.id);
    setEditStageForm({
      name: stage.name,
      durationDays: stage.durationDays,
      description: stage.description || ''
    });
  };

  const handleSaveStage = async (stageId: string, orderIndex: number) => {
    if (!cropId) return;
    if (!editStageForm.name.trim()) {
      alert('Tên giai đoạn không được để trống');
      return;
    }
    try {
      await updateCropStage(cropId, stageId, {
        name: editStageForm.name,
        durationDays: editStageForm.durationDays,
        description: editStageForm.description,
        orderIndex: orderIndex
      });
      setExtraData((prev: any) => ({
        ...prev,
        stages: (prev.stages || []).map((s: any) => 
          s.id === stageId 
            ? { ...s, name: editStageForm.name, durationDays: editStageForm.durationDays, description: editStageForm.description }
            : s
        )
      }));
      setEditingStageId(null);
    } catch (err: any) {
      console.error('Lỗi khi cập nhật giai đoạn:', err);
      alert(err.message || 'Có lỗi xảy ra khi cập nhật giai đoạn');
    }
  };

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

        {/* Tabs Navigation */}
        <div className="px-8 bg-slate-50/50 border-b border-slate-100 flex gap-2">
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
            </button>
          ))}
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-8 max-h-[60vh] custom-scrollbar bg-slate-50/20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 text-slate-200 animate-spin" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <>
              {activeTab === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
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

              {activeTab === 'stages' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {extraData.stages?.length > 0 ? extraData.stages.map((stage: any, idx: number) => {
                    const isEditing = editingStageId === stage.id;
                    return (
                      <div key={stage.id || idx} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col gap-3">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="flex gap-3">
                              <div className="flex-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tên giai đoạn</label>
                                <input
                                  type="text"
                                  value={editStageForm.name}
                                  onChange={(e) => setEditStageForm(prev => ({ ...prev, name: e.target.value }))}
                                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm"
                                  placeholder="Ví dụ: Gieo hạt"
                                />
                              </div>
                              <div className="w-24">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Số ngày</label>
                                <input
                                  type="number"
                                  value={editStageForm.durationDays}
                                  onChange={(e) => setEditStageForm(prev => ({ ...prev, durationDays: Number(e.target.value) }))}
                                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm"
                                  min={1}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mô tả chi tiết</label>
                              <textarea
                                value={editStageForm.description}
                                onChange={(e) => setEditStageForm(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm h-16 resize-none"
                                placeholder="Mô tả công việc trong giai đoạn này..."
                              />
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                onClick={() => setEditingStageId(null)}
                                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                              >
                                Hủy
                              </button>
                              <button
                                onClick={() => handleSaveStage(stage.id, stage.orderIndex || idx + 1)}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors flex items-center gap-1"
                              >
                                <Check size={12} /> Lưu
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-800">Giai đoạn {idx + 1}: {stage.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">{stage.durationDays} ngày</span>
                                <button
                                  onClick={() => handleStartEditStage(stage)}
                                  className="p-1.5 text-slate-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                                  title="Chỉnh sửa giai đoạn"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteStage(stage.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Xóa giai đoạn"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            {stage.description && (
                              <p className="text-sm text-slate-500 mt-2">{stage.description}</p>
                            )}
                          </>
                        )}
                      </div>
                    );
                  }) : (
                    <div className="text-center py-12 text-slate-400 font-medium">Chưa có thông tin giai đoạn sinh trưởng.</div>
                  )}
                </div>
              )}

              {activeTab === 'soil' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {extraData.soil ? (
                    <div className="space-y-6">
                      <div className="flex justify-end">
                        <button 
                          onClick={handleDeleteCondition}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-colors"
                        >
                          Xóa điều kiện
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                          <span className="text-xs font-bold text-slate-400 uppercase">pH</span>
                          <div className="text-lg font-bold text-slate-800 mt-1">{extraData.soil.phMin} - {extraData.soil.phMax}</div>
                        </div>
                        <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                          <span className="text-xs font-bold text-slate-400 uppercase">Nitơ (N)</span>
                          <div className="text-lg font-bold text-slate-800 mt-1">{extraData.soil.nMin} - {extraData.soil.nMax} mg/kg</div>
                        </div>
                        <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                          <span className="text-xs font-bold text-slate-400 uppercase">Phốt pho (P)</span>
                          <div className="text-lg font-bold text-slate-800 mt-1">{extraData.soil.pMin} - {extraData.soil.pMax} mg/kg</div>
                        </div>
                        <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                          <span className="text-xs font-bold text-slate-400 uppercase">Kali (K)</span>
                          <div className="text-lg font-bold text-slate-800 mt-1">{extraData.soil.kMin} - {extraData.soil.kMax} mg/kg</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 font-medium">Chưa có cấu hình điều kiện đất.</div>
                  )}
                </div>
              )}

              {activeTab === 'diseases' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {extraData.diseases?.length > 0 ? extraData.diseases.map((disease: any, idx: number) => (
                    <div key={disease.id || idx} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col gap-4 relative group">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-red-600 flex items-center gap-2">
                          <Activity size={16} />
                          {disease.name}
                        </h4>
                        <button
                          onClick={() => handleRemoveDisease(disease.id)}
                          className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          title="Gỡ bệnh khỏi cây"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Triệu chứng</span>
                          <p className="text-sm text-slate-600">{disease.symptoms}</p>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Cách xử lý</span>
                          <p className="text-sm text-slate-600">{disease.treatment}</p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12 text-slate-400 font-medium">Chưa có thư viện bệnh hại.</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
