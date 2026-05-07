import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Trash2, Filter, Loader2, Sprout, ChevronDown, Check, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/useAuth';
import { useCrops } from '@/hooks/crops/useCrops';
import { Crop } from '@/types/crop';

interface CropListProps {
  crops: Crop[];
  mode?: 'crops' | 'types';
  onTabChange?: (tab: 'crops' | 'types') => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  loading: boolean;
  isAdmin: boolean;
}

export const CropList: React.FC<CropListProps> = ({ 
  crops, 
  mode = 'crops', 
  onTabChange,
  onAdd, 
  onDelete, 
  loading, 
  isAdmin 
}) => {
  const navigate = useNavigate();
  const { currentFarmId } = useAuth();
  const { cropTypes } = useCrops();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTypeId, setFilterTypeId] = useState<string>('All');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Xử lý đóng dropdown khi Click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedTypeName = filterTypeId === 'All' 
    ? 'Tất cả danh mục' 
    : cropTypes.find((t: any) => t.id === filterTypeId)?.name || 'Danh mục';

  // Chọn nguồn dữ liệu dựa trên mode
  const displayItems = mode === 'types' ? cropTypes : crops;

  const filteredItems = displayItems.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Chỉ lọc theo chủng loại nếu đang xem danh sách Cây trồng
    if (mode === 'crops') {
      const matchesType = filterTypeId === 'All' || (item as Crop).cropType.id === filterTypeId;
      return matchesSearch && matchesType;
    }
    
    return matchesSearch;
  });

  const handleDeleteClick = (item: any) => {
    setDeleteConfirmId(item.id);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Search & Filter Bar - Seamless */}
      <div className="p-8 pr-12 sticky top-0 z-10 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(`/farms/${currentFarmId}/actions`)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all font-bold text-xs shrink-0"
              >
                <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm hover:shadow-md transition-all">
                  <ArrowLeft size={14} />
                </div>
                Quay lại
              </button>

              <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-xl text-green-600 flex-shrink-0">
                    <Sprout className="w-5 h-5" />
                </div>
                <div className="whitespace-nowrap">
                  <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none">
                    Cây trồng
                  </h1>
                  <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest">
                    {mode === 'crops' ? 'Hệ thống' : 'Phân loại'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Switcher - "Nằm ngang với tiêu đề" */}
            <div className="flex gap-1 p-1 bg-slate-100/80 w-fit rounded-xl border border-slate-200/50">
              <button
                onClick={() => onTabChange?.('crops')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  mode === 'crops' 
                    ? 'bg-white text-green-700 shadow-sm border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Cây trồng
              </button>
              <button
                onClick={() => onTabChange?.('types')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  mode === 'types' 
                    ? 'bg-white text-green-700 shadow-sm border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Loại cây
              </button>
            </div>
          </div>

          <div className="flex flex-1 items-center gap-4 w-full lg:max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={`Tìm ${mode === 'crops' ? 'tên cây' : 'tên loại cây'}...`}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {isAdmin && (
              <button
                onClick={onAdd}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all active:scale-95 whitespace-nowrap ${
                  mode === 'types' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-bold">{mode === 'crops' ? 'Thêm mới' : 'Thêm loại'}</span>
              </button>
            )}
          </div>
        </div>

        {mode === 'crops' && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <div className="flex items-center gap-2 pr-4 border-r border-slate-100 flex-shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Lọc theo:</span>
            </div>
            
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center justify-between gap-3 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  isDropdownOpen 
                    ? 'border-green-500 bg-green-50/50 text-green-700 ring-4 ring-green-500/10' 
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="truncate max-w-[150px]">{selectedTypeName}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-green-600' : 'text-slate-400'}`} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 mt-2 min-w-[220px] bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden"
                  >
                    <div className="px-3 pb-2 mb-2 border-b border-slate-50">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-2 pt-1">Chọn danh mục</p>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      <button
                        onClick={() => {
                          setFilterTypeId('All');
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-all group ${
                          filterTypeId === 'All' 
                            ? 'bg-green-50 text-green-700' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <span>Tất cả danh mục</span>
                        {filterTypeId === 'All' && <Check className="w-4 h-4 text-green-600" />}
                      </button>

                      {cropTypes.map((type: any) => (
                        <button
                          key={type.id}
                          onClick={() => {
                            setFilterTypeId(type.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-all group ${
                            filterTypeId === type.id 
                              ? 'bg-green-50 text-green-700' 
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span className="truncate">{type.name}</span>
                          {filterTypeId === type.id && <Check className="w-4 h-4 text-green-600" />}
                        </button>
                      ))}
                    </div>

                    {cropTypes.length === 0 && (
                      <div className="px-4 py-6 text-center">
                        <p className="text-xs text-slate-400 font-medium italic">Không có danh mục nào</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
            <p className="text-slate-500 font-medium tracking-wide">Đang tải dữ liệu...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {mode === 'crops' ? 'Thông tin cây trồng' : 'Tên loại cây'}
                </th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {mode === 'crops' ? 'Phân loại' : 'Mô tả'}
                </th>
                {(isAdmin && mode === 'types') && <th className="px-8 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map((item: any) => (
                <tr key={item.id} className="group hover:bg-slate-50/80 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      {mode === 'crops' ? (
                        <>
                          <div className="relative">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-medium">
                                <Sprout className="w-6 h-6" />
                              </div>
                            )}
                            {item.inUse && <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white" />}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800">{item.name}</div>
                            <div className="text-xs text-slate-500 truncate max-w-xs">{item.description || 'Không có mô tả'}</div>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm font-bold text-slate-800">{item.name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {mode === 'crops' ? (
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        item.cropType.name === 'Quả' ? 'bg-orange-100 text-orange-600' :
                        item.cropType.name === 'Rau' ? 'bg-green-100 text-green-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {item.cropType.name}
                      </span>
                    ) : (
                      <div className="text-xs text-slate-500">{item.description || 'Không có mô tả'}</div>
                    )}
                  </td>
                  {(isAdmin && mode === 'types') && (
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button
                          onClick={() => handleDeleteClick(item)}
                          className="p-2.5 rounded-xl transition-all shadow-sm border bg-red-50 text-red-500 border-red-100 hover:bg-red-500 hover:text-white hover:scale-110"
                          title="Xóa loại cây trồng"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <Search className="w-10 h-10" />
            </div>
            <div className="text-center">
              <p className="text-slate-800 font-bold text-lg">Không tìm thấy dữ liệu</p>
              <p className="text-slate-400 text-sm">Hãy thử tìm kiếm với từ khóa khác.</p>
            </div>
            <button onClick={() => {setSearchTerm(''); setFilterTypeId('All');}} className="text-green-600 font-semibold text-sm hover:underline">Xóa bộ lọc</button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Xác nhận xóa?</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Bạn đang chuẩn bị xóa loại cây trồng này. Các cây trồng thuộc loại này có thể bị ảnh hưởng.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-4 px-6 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  onDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-4 px-6 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-colors shadow-lg shadow-red-100"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
