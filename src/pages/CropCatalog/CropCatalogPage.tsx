import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/useAuth';
import { useCrops } from '@/hooks/crops/useCrops';
import { CreateCropRequest, CreateCropTypeRequest } from '../../types/crop';
import { getRolesFromToken } from '../../utils/jwt';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, ArrowLeft, Filter, LayoutGrid, List, Activity } from 'lucide-react';
import { cn } from '@/utils/cn';

import { CropList } from '@/components/crop-catalog/CropList';
import { CropForm } from '@/components/crop-catalog/CropForm';
import { QuickAddCropTypeModal } from '@/components/crop-catalog/QuickAddCropTypeModal';
import { CropDetailModal } from '@/components/crop-catalog/CropDetailModal';
import { CropTypeDetailModal } from '@/components/crop-catalog/CropTypeDetailModal';
import { DiseaseFormModal } from '@/components/crop-catalog/DiseaseFormModal';

export const CropCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentFarmId, accessToken } = useAuth();
  const { 
    crops,
    systemCrops,
    cropTypes,
    loading,
    fetchFarmCrops,
    fetchCrops,
    fetchCropTypes,
    createCrop,
    createCropType,
    deleteCrop,
    deleteCropType,
    createCropCondition,
    createCropStage,
    createDisease,
    assignDiseaseToCrop,
    getAllDiseases,
    updateDisease,
    deleteDisease
  } = useCrops();

  const roles = accessToken ? getRolesFromToken(accessToken) : [];
  const isAdmin = roles.includes('ROLE_ADMIN');
  
  if (!isAdmin && !currentFarmId) {
    return <Navigate to="/farms" replace />;
  }
  
  const [view, setView] = useState<'list' | 'form'>('list');
  const [activeTab, setActiveTab] = useState<'crops' | 'types' | 'diseases'>('crops');
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [isFarmScope, setIsFarmScope] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'SYSTEM' | 'FARM'>('ALL');
  const [filterTypeId, setFilterTypeId] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // States for disease management
  const [diseases, setDiseases] = useState<any[]>([]);
  const [diseasesLoading, setDiseasesLoading] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState<any | null>(null);
  const [isDiseaseModalOpen, setIsDiseaseModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const diseasePage = parseInt(searchParams.get('page') || '0', 10);
  const diseasePageSize = parseInt(searchParams.get('size') || '5', 10);
  const diseaseSort = searchParams.get('sort') || 'createdAt,desc';

  const setDiseasePage = (page: number | ((prev: number) => number)) => {
    const newPage = typeof page === 'function' ? page(diseasePage) : page;
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', newPage.toString());
      // Also preserve activeTab if we had it, but we use replace: true
      return next;
    }, { replace: true });
  };

  const setDiseasePageSize = (size: number) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('size', size.toString());
      next.set('page', '0'); // Reset page
      return next;
    }, { replace: true });
  };

  const setDiseaseSort = (sort: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('sort', sort);
      next.set('page', '0'); // Reset page
      return next;
    }, { replace: true });
  };

  const [diseaseTotalPages, setDiseaseTotalPages] = useState(1);

  const fetchAllDiseasesList = useCallback(async () => {
    setDiseasesLoading(true);
    try {
      const res = await getAllDiseases(diseasePage, diseasePageSize, diseaseSort);
      setDiseases(res?.content || []);
      setDiseaseTotalPages(res?.totalPages || 1);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải danh sách bệnh hại');
    } finally {
      setDiseasesLoading(false);
    }
  }, [getAllDiseases, diseasePage, diseasePageSize, diseaseSort]);

  useEffect(() => {
    if (activeTab === 'diseases') {
      fetchAllDiseasesList();
    }
  }, [activeTab, fetchAllDiseasesList, diseasePage, diseasePageSize, diseaseSort]);

  // Initial load for crop types only, others are handled by useQuery on mount
  useEffect(() => {
    if (!(currentFarmId || isAdmin)) return;
    fetchCropTypes();
  }, [fetchCropTypes, currentFarmId, isAdmin]);

  const handleScopeChange = (newScope: 'ALL' | 'SYSTEM' | 'FARM') => {
    setScopeFilter(newScope);
    // Explicitly refetch on interaction as requested
    if (newScope === 'SYSTEM' || newScope === 'ALL') {
      void fetchCrops();
    }
    if ((newScope === 'FARM' || newScope === 'ALL') && currentFarmId) {
      void fetchFarmCrops();
    }
  };

  const handleAdd = () => {
    if (activeTab === 'types') {
      setIsTypeModalOpen(true);
    } else if (activeTab === 'diseases') {
      setSelectedDisease(null);
      setIsDiseaseModalOpen(true);
    } else {
      setView('form');
    }
  };
  
  const handleViewDetail = (id: string, itemScope: string) => { 
    if (activeTab === 'types') {
      setSelectedTypeId(id);
    } else if (activeTab === 'diseases') {
      const found = diseases.find(d => d.id === id);
      setSelectedDisease(found || null);
      setIsDiseaseModalOpen(true);
    } else {
      setSelectedItemId(id); 
      // Nếu đang ở tab Trang trại hoặc item có scope là FARM thì dùng API Farm
      setIsFarmScope(scopeFilter === 'FARM' || itemScope === 'FARM'); 
    }
  };

  const handleCancel = () => setView('list');

  const handleDelete = async (id: string) => {
    try {
      if (!isAdmin) return toast.error('Bạn không có quyền thao tác');
      if (activeTab === 'types') {
        await deleteCropType(id).unwrap();
        toast.success('Xóa loại cây thành công');
        fetchCropTypes();
      } else if (activeTab === 'diseases') {
        await deleteDisease(id);
        toast.success('Xóa bệnh hại thành công');
        fetchAllDiseasesList();
      } else {
        await deleteCrop(id).unwrap();
        toast.success('Xóa cây trồng thành công');
        fetchCrops();
      }
    } catch (err: any) { toast.error(err.message || 'Thao tác thất bại'); }
  };

  const handleSave = async (data: any) => {
    try {
      const createCropRes = await createCrop(data as CreateCropRequest);
      const cropId = createCropRes.data?.id;

      if (!cropId) {
        throw new Error('Không lấy được ID của cây trồng sau khi tạo');
      }

      // Tạo điều kiện đất (nếu có form hợp lệ)
      if (data.soil) {
        await createCropCondition(cropId, data.soil);
      }

      // Tạo các giai đoạn
      if (data.stages && data.stages.length > 0) {
        for (let i = 0; i < data.stages.length; i++) {
          const stage = data.stages[i];
          await createCropStage(cropId, { ...stage, orderIndex: i + 1 });
        }
      }

      // Tạo các bệnh và gán vào cây
      if (data.diseases && data.diseases.length > 0) {
        for (const disease of data.diseases) {
          const diseaseRes = await createDisease(disease);
          const diseaseId = diseaseRes.data?.id;
          if (diseaseId) {
            await assignDiseaseToCrop(cropId, diseaseId, false);
          }
        }
      }

      toast.success('Thêm cây trồng mới và cấu hình chi tiết thành công');
      fetchCrops();
      setView('list');
    } catch (err: any) { toast.error(err.message || 'Thao tác thất bại'); }
  };

  const handleSaveType = async (data: CreateCropTypeRequest) => {
    try {
      await createCropType(data).unwrap();
      toast.success('Thêm loại cây trồng mới thành công');
      setIsTypeModalOpen(false);
      fetchCropTypes();
    } catch (err: any) { toast.error(err.message || 'Thao tác thất bại'); }
  };

  const handleSaveDisease = async (data: any) => {
    try {
      if (selectedDisease) {
        await updateDisease(selectedDisease.id, data);
        toast.success('Cập nhật bệnh hại thành công');
      } else {
        await createDisease(data);
        toast.success('Thêm bệnh hại mới thành công');
      }
      fetchAllDiseasesList();
      setIsDiseaseModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Thao tác thất bại');
    }
  };

  const filteredData = useCallback(() => {
    if (activeTab === 'types') {
      return cropTypes.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    if (activeTab === 'diseases') {
      return diseases.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (d.symptoms || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    let list: any[] = [];
    if (scopeFilter === 'ALL') {
      list = [...systemCrops, ...crops];
    } else if (scopeFilter === 'SYSTEM') {
      list = systemCrops;
    } else if (scopeFilter === 'FARM') {
      list = crops;
    }

    if (filterTypeId !== 'All') {
      list = list.filter(c => c.cropType?.id === filterTypeId);
    }
    
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(s) || (c.cropType?.name || '').toLowerCase().includes(s));
    }
    return list;
  }, [crops, systemCrops, cropTypes, diseases, activeTab, scopeFilter, filterTypeId, searchTerm]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Premium Header Section */}
      <div className="bg-white border-b border-slate-200/60 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/80">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => {
                  if (isAdmin && !currentFarmId) {
                    navigate('/admin/dashboard');
                  } else {
                    navigate(`/farms/${currentFarmId}/actions`);
                  }
                }}
                className="group flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-all font-bold text-sm"
              >
                <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-slate-100 transition-colors">
                  <ArrowLeft size={18} />
                </div>
                Quay lại
              </button>
              <div className="h-8 w-px bg-slate-200" />
              <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
                <button 
                  onClick={() => setActiveTab('crops')}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    activeTab === 'crops' ? "bg-white text-green-700 shadow-md shadow-green-100/50" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <List size={14} /> Cây trồng
                </button>
                <button 
                  onClick={() => setActiveTab('types')}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    activeTab === 'types' ? "bg-white text-green-700 shadow-md shadow-green-100/50" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <LayoutGrid size={14} /> Loại cây
                </button>
                <button 
                  onClick={() => setActiveTab('diseases')}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    activeTab === 'diseases' ? "bg-white text-green-700 shadow-md shadow-green-100/50" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Activity size={14} /> Bệnh hại
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-1 max-w-2xl justify-end">
              <div className="relative group w-full max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" size={16} />
                <input 
                  type="text"
                  placeholder={activeTab === 'crops' ? "Tìm cây trồng..." : activeTab === 'types' ? "Tìm loại cây trồng..." : "Tìm bệnh hại..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-[18px] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500/50 transition-all placeholder:text-slate-400"
                />
              </div>
              {isAdmin && (
                <button 
                  onClick={handleAdd}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-[18px] font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
                >
                  <Plus size={18} /> Thêm mới
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <AnimatePresence mode="wait">
          {view === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                {activeTab === 'crops' ? (
                  <div className="flex items-center gap-4">
                    <div className="flex bg-white p-1 rounded-xl border border-slate-200/60 shadow-sm">
                      {(['ALL', 'SYSTEM', 'FARM'] as const).map((scope) => (
                        <button
                          key={scope}
                          onClick={() => handleScopeChange(scope)}
                          className={cn(
                            "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            scopeFilter === scope ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          {scope === 'ALL' ? 'Tất cả' : scope === 'SYSTEM' ? 'Hệ thống' : 'Trang trại'}
                        </button>
                      ))}
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200/60 rounded-xl shadow-sm">
                      <Filter size={14} className="text-slate-400" />
                      <select 
                        value={filterTypeId}
                        onChange={(e) => setFilterTypeId(e.target.value)}
                        className="bg-transparent text-[11px] font-bold outline-none text-slate-700 cursor-pointer min-w-[140px]"
                      >
                        <option value="All">Tất cả danh mục</option>
                        {cropTypes.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : activeTab === 'diseases' ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200/60 rounded-xl shadow-sm">
                      <Filter size={14} className="text-slate-400" />
                      <select 
                        value={diseaseSort}
                        onChange={(e) => {
                          setDiseaseSort(e.target.value);
                        }}
                        className="bg-transparent text-[11px] font-bold outline-none text-slate-700 cursor-pointer"
                      >
                        <option value="createdAt,desc">Mới nhất</option>
                        <option value="createdAt,asc">Cũ nhất</option>
                        <option value="name,asc">Tên A-Z</option>
                        <option value="name,desc">Tên Z-A</option>
                      </select>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200/60 rounded-xl shadow-sm">
                      <span className="text-[11px] font-bold text-slate-400">Hiển thị:</span>
                      <select
                        value={diseasePageSize}
                        onChange={(e) => {
                          setDiseasePageSize(Number(e.target.value));
                        }}
                        className="bg-transparent text-[11px] font-bold outline-none text-slate-700 cursor-pointer"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </div>
                  </div>
                ) : <div />}
              </div>

              <CropList
                crops={filteredData()}
                mode={activeTab}
                onDelete={handleDelete}
                onViewDetail={handleViewDetail}
                loading={activeTab === 'diseases' ? diseasesLoading : loading}
                isAdmin={isAdmin}
              />
              {activeTab === 'diseases' && diseaseTotalPages > 0 && (
                <div className="flex items-center justify-between mt-6 px-4">
                  <span className="text-xs text-slate-500 font-bold">
                    Trang {diseasePage + 1} / {diseaseTotalPages || 1}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={diseasePage === 0}
                      onClick={() => setDiseasePage(p => Math.max(0, p - 1))}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                      Trước
                    </button>
                    <button
                      disabled={diseasePage >= diseaseTotalPages - 1}
                      onClick={() => setDiseasePage(p => p + 1)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-[32px] border border-slate-200/60 shadow-xl overflow-hidden"
            >
              <CropForm onSave={handleSave} onCancel={handleCancel} existingCrops={crops} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <QuickAddCropTypeModal isOpen={isTypeModalOpen} onClose={() => setIsTypeModalOpen(false)} onSave={handleSaveType} loading={loading} />
      <CropDetailModal isOpen={!!selectedItemId} onClose={() => setSelectedItemId(null)} cropId={selectedItemId} isFarmScope={isFarmScope} />
      <CropTypeDetailModal isOpen={!!selectedTypeId} onClose={() => setSelectedTypeId(null)} cropTypeId={selectedTypeId} />
      <DiseaseFormModal isOpen={isDiseaseModalOpen} onClose={() => setIsDiseaseModalOpen(false)} onSave={handleSaveDisease} loading={diseasesLoading} initialData={selectedDisease} />
    </div>
  );
};

export default CropCatalogPage;
