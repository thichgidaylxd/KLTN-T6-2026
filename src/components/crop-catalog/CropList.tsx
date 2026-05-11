import React, { useState } from 'react';
import { Sprout, Trash2, Loader2, Tag, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

interface CropListProps {
  crops: any[]; 
  mode?: 'crops' | 'types';
  onDelete: (id: string) => void;
  onViewDetail?: (id: string, scope: string) => void;
  loading: boolean;
  isAdmin: boolean;
}

export const CropList: React.FC<CropListProps> = ({ 
  crops, 
  mode = 'crops',
  onDelete, 
  onViewDetail,
  loading, 
  isAdmin 
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  return (
    <div className="w-full">
      <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-green-100 border-t-green-600 rounded-full animate-spin" />
              <Loader2 className="absolute inset-0 m-auto w-6 h-6 text-green-600 animate-pulse" />
            </div>
            <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Đang đồng bộ dữ liệu...</p>
          </div>
        ) : crops.length > 0 ? (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-10 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {mode === 'crops' ? 'Thông tin cây trồng' : 'Danh mục loại cây'}
                </th>
                <th className="px-10 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {mode === 'crops' ? 'Danh mục' : 'Mô tả chi tiết'}
                </th>
                <th className="px-10 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {crops.map((item: any) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-5">
                      {mode === 'crops' ? (
                        <>
                          <div className="relative shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-14 h-14 rounded-2xl object-cover ring-4 ring-slate-50 shadow-sm" />
                            ) : (
                              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                                <Sprout className="w-7 h-7" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="text-[15px] font-bold text-slate-800">{item.name}</div>
                              {item.inUse && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Đang sử dụng" />}
                            </div>
                            <div className="text-xs text-slate-400 font-medium line-clamp-1 max-w-sm italic">
                              {item.description || 'Không có mô tả cho cây trồng này'}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <Tag className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="text-[15px] font-bold text-slate-800">{item.name}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    {mode === 'crops' ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border",
                            item.cropType?.name === 'Quả' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                            item.cropType?.name === 'Rau' ? 'bg-green-50 text-green-600 border-green-100' :
                            'bg-slate-50 text-slate-600 border-slate-100'
                          )}>
                            {item.cropType?.name || 'Chưa phân loại'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 leading-relaxed max-w-xl line-clamp-2">
                        {item.description || 'Chưa có thông tin mô tả chi tiết cho loại danh mục này.'}
                      </div>
                    )}
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end gap-3 transition-opacity duration-300">
                      <button
                        onClick={() => onViewDetail?.(item.id, item.scope)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-[14px] text-xs font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                      >
                        Chi tiết <ChevronRight size={14} />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-3 rounded-[14px] transition-all border bg-red-50 text-red-500 border-red-100 hover:bg-red-500 hover:text-white shadow-sm"
                          title="Xóa bản ghi"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-200">
              {mode === 'crops' ? <Sprout className="w-12 h-12" /> : <Tag className="w-12 h-12" />}
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Kho dữ liệu trống</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">Không tìm thấy bất kỳ bản ghi nào khớp với điều kiện lọc hiện tại.</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
              onClick={() => setDeleteConfirmId(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl"
            >
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mb-8 mx-auto">
                <Trash2 className="w-10 h-10" />
              </div>
              <div className="text-center mb-10">
                <h3 className="text-2xl font-black text-slate-800 mb-3 uppercase tracking-tight">Xác nhận xóa?</h3>
                <p className="text-slate-500 leading-relaxed font-medium">
                  Dữ liệu về {mode === 'crops' ? 'cây trồng' : 'loại cây'} này sẽ bị gỡ bỏ vĩnh viễn khỏi hệ thống.
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-4 px-6 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={() => {
                    onDelete(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                  className="flex-1 py-4 px-6 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-200 active:scale-95"
                >
                  Xóa dữ liệu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
