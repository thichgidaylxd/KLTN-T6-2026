import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/useAuth';
import { useCrops } from '@/hooks/crops/useCrops';
import { CreateCropRequest } from '../../types/crop';
import { getRolesFromToken } from '../../utils/jwt';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { CropList } from '@/components/crop-catalog/CropList';
import { CropForm } from '@/components/crop-catalog/CropForm';
import { QuickAddCropTypeModal } from '@/components/crop-catalog/QuickAddCropTypeModal';
import { CreateCropTypeRequest } from '../../types/crop';

export const CropCatalogPage: React.FC = () => {
  const { currentFarmId, accessToken } = useAuth();
  const { 
    crops,
    systemCrops,
    loading,
    error,
    fetchFarmCrops,
    fetchCrops,
    fetchCropTypes,
    createCrop,
    createCropType,
    deleteCropType
  } = useCrops();

  // Giải mã token để lấy quyền thực tế
  const roles = accessToken ? getRolesFromToken(accessToken) : [];
  const isAdmin = roles.includes('ROLE_ADMIN');
  
  // Redirect non-admin users without farm context to farm selection
  if (!isAdmin && !currentFarmId) {
    return <Navigate to="/farms" replace />;
  }
  
  const [view, setView] = useState<'list' | 'form'>('list');
  const [activeTab, setActiveTab] = useState<'crops' | 'types'>('crops');
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  useEffect(() => {
    if (!(currentFarmId || isAdmin)) return;

    if (activeTab === 'crops') {
      // Luôn fetch danh mục hệ thống (Public API)
      fetchCrops();
      
      // Nếu có farm context, fetch thêm cây trồng của farm
      if (currentFarmId) {
        fetchFarmCrops(currentFarmId);
      }
      
      fetchCropTypes();
      return;
    }

    if (activeTab === 'types') {
      fetchCropTypes();
    }
  }, [fetchCropTypes, fetchCrops, fetchFarmCrops, currentFarmId, isAdmin, activeTab]);

  useEffect(() => {
    if (error) {
      const err = error as any;
      toast.error(err.message || String(error));
    }
  }, [error]);

  const handleAdd = () => {
    if (activeTab === 'types') {
      setIsTypeModalOpen(true);
      return;
    }
    setView('form');
  };

  const handleDelete = async (id: string) => {
    try {
      if (!isAdmin) {
        toast.error('Bạn không có quyền thực hiện thao tác này');
        return;
      }
      
      if (activeTab === 'types') {
        await deleteCropType(id).unwrap();
        toast.success('Xóa loại cây trồng thành công');
        // Tải lại cả cây trồng vì có thể ảnh hưởng đến danh mục
        fetchCrops();
        fetchCropTypes();
      }
    } catch (err: any) {
      toast.error(err.message || 'Thao tác thất bại');
    }
  };

  const handleSave = async (data: any) => {
    try {
      await createCrop(data as CreateCropRequest).unwrap();
      toast.success('Thêm cây trồng mới thành công');
      // Tải lại để lấy thông tin đầy đủ từ Backend (bao gồm các object liên quan)
      fetchCrops();
      setView('list');
    } catch (err: any) {
      toast.error(err.message || 'Thao tác thất bại');
    }
  };

  const handleSaveType = async (data: CreateCropTypeRequest) => {
    try {
      await createCropType(data).unwrap();
      toast.success('Thêm loại cây trồng mới thành công');
      setIsTypeModalOpen(false);
      // Tải lại danh sách
      fetchCropTypes();
    } catch (err: any) {
      toast.error(err.message || 'Thao tác thất bại');
    }
  };

  const handleCancel = () => {
    setView('list');
  };

  return (
    <div className="w-full h-full flex flex-col">

      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div
            key="list"
            className="w-full flex-1 flex flex-col"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <CropList
              crops={activeTab === 'crops' ? (currentFarmId ? [...systemCrops, ...crops] : systemCrops) : []}
              mode={activeTab}
              onTabChange={setActiveTab}
              onAdd={handleAdd}
              onDelete={handleDelete}
              loading={loading}
              isAdmin={isAdmin}
            />
          </motion.div>
        ) : (
          <motion.div
            key="form"
            className="w-full flex-1 flex flex-col"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <CropForm
              onSave={handleSave}
              onCancel={handleCancel}
              existingCrops={crops}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <QuickAddCropTypeModal 
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        onSave={handleSaveType}
        loading={loading}
      />
    </div>
  );
};

export default CropCatalogPage;
