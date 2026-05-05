import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFarms } from '@/hooks/farms/useFarms';
import { usePlots } from '@/hooks/plots/usePlots';
import { useCrops } from '@/hooks/crops/useCrops';
import { useAuth } from '@/hooks/auth/useAuth';
import { useSeasonPlans } from '@/hooks/seasonPlans/useSeasonPlans';
import { calculatePlanProgress } from '@/utils/seasonPlanUtils';
import { EditFarmModal } from '../../components/farm/EditFarmModal';
import { toast } from 'sonner';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { extractErrorMessage } from '../../utils/errorUtils';

// New Components
import DashboardHeader from '../../components/farm/DashboardHeader';
import QuickStats from '../../components/farm/QuickStats';
import WelcomeSection from '../../components/farm/WelcomeSection';
import FarmInfoSection from '../../components/farm/FarmInfoSection';

const FarmActionsPage: React.FC = () => {
    const { farmId } = useParams<{ farmId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { farmSummary, farms, fetchFarms, fetchFarmsSummary, deleteFarm, loading: loadingFarms } = useFarms();
    const { plots, fetchPlots, loading: loadingPlots } = usePlots();
    const { crops, fetchCrops, loading: loadingCrops } = useCrops();
    const { plans, fetchPlans, fetchStages, loading: loadingPlans } = useSeasonPlans();

    useEffect(() => {
        if (farmId === 'null' || !farmId) {
            navigate('/farms', { replace: true });
        }
    }, [farmId, navigate]);

    useEffect(() => {
        if (farmId && farmId !== 'null') {
            fetchPlots(farmId);
            fetchCrops();
            fetchPlans();
        }
    }, [farmId, fetchFarmsSummary, fetchPlots, fetchCrops, fetchPlans]);

    // Tự động fetch stages cho tất cả plans để có dữ liệu tiến trình thực tế
    useEffect(() => {
        if (plans.length > 0) {
            plans.forEach(plan => {
                if (!plan.phases || plan.phases.length === 0) {
                    fetchStages(plan.id);
                }
            });
        }
    }, [plans, fetchStages]);

    useEffect(() => {
        if (farms.length === 0) {
            fetchFarms();
        }
    }, [farms.length, fetchFarms]);

    // Calculate plan progress average using unified utility
    const planProgress = plans.length > 0
        ? Math.round(plans.reduce((acc, plan) => acc + calculatePlanProgress(plan), 0) / plans.length)
        : 0;


    // Ưu tiên tìm trong list 'farms' (full detail) để có description
    const farm = farms.find((f: any) => f.id === farmId) ||
        farmSummary.find((f: any) => f.farmId === farmId);
    
    const farmName = farm?.farmName || farm?.name || 'Trang Trại';
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleDelete = async () => {
        if (!farmId) return;

        setIsDeleting(true);
        try {
            await deleteFarm(farmId).unwrap();
            toast.success("Xóa trang trại thành công");
            navigate('/farms');
        } catch (error: any) {
            console.error("Lỗi khi xóa farm:", error);
            toast.error(extractErrorMessage(error));
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    if (!farm) {
        if (loadingFarms) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-emerald-100 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-6 text-gray-500 font-medium animate-pulse">Đang tải thông tin trang trại...</p>
                </div>
            );
        }

        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy trang trại</h2>
                <p className="text-gray-500 mb-8 max-w-sm">Dữ liệu không tồn tại hoặc bạn không có quyền truy cập vào trang trại này.</p>
                <button
                    onClick={() => navigate('/farms')}
                    className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                >
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    const canManage = farm?.owner ||
        farm?.ownerId === user?.id ||
        farm?.myRole?.toLowerCase() === 'owner';

    return (
        <div className="min-h-full bg-[#F8FAFC] pb-20 overflow-y-auto no-scrollbar">
            <DashboardHeader
                farmName={farmName}
                onEdit={() => setIsEditModalOpen(true)}
                onDelete={() => setIsDeleteModalOpen(true)}
                showActions={canManage}
            />

            <div className="px-8 py-8 space-y-8 max-w-7xl mx-auto">
                {/* Welcome Section */}
                <WelcomeSection farmName={farmName} />

                {/* Compact Stats Grid */}
                <QuickStats
                    plotsCount={plots.length}
                    cropsCount={crops.length}
                    plansCount={plans.length}
                    planProgress={planProgress}
                    loading={loadingPlots || loadingCrops || loadingPlans}
                />

                {/* Info & Team Section */}
                <FarmInfoSection
                    farmName={farm?.farmName || farm?.name || 'Trang Trại'}
                    description={farm?.description || 'Chưa có mô tả cho trang trại này.'}
                />
            </div>

            <EditFarmModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                farm={farm}
                onSuccess={() => fetchFarmsSummary()}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Xóa trang trại"
                message={`Bạn có chắc chắn muốn xóa trang trại "${farmName}"? Hành động này không thể hoàn tác và toàn bộ dữ liệu liên quan sẽ bị mất.`}
                confirmLabel="Vâng, hãy xóa nó"
                cancelLabel="Quay lại"
                loading={isDeleting}
                type="danger"
            />
        </div>
    );
};

export default FarmActionsPage;
