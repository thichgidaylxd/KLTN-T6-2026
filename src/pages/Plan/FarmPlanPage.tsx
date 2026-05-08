import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Calendar,
  MapPin,
  Trash2,
  Edit3,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  CropIcon as Seed,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/auth/useAuth';
import { usePlans } from '@/hooks/plan/usePlan';
import { usePlan } from '@/hooks/plan/usePlan';
import { usePlanPlots } from '@/hooks/plan/usePlan';
import { useCrops } from '@/hooks/crops/useCrops';
import { usePlots } from '@/hooks/plots/usePlots';
import { cn } from '@/utils/cn';
import {
  createPlanSchema,
  updatePlanTimeSchema,
  type CreatePlanInput,
  type UpdatePlanTimeInput,
} from '@/schemas/planSchemas';
import { extractErrorMessage } from '@/utils/errorUtils';

type Tab = 'list' | 'detail';

export function FarmPlanPage() {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();

  const { plans, plansLoading, createPlan, updatePlanTime, deletePlan, addPlotsToPlan } = usePlans();
  const { crops } = useCrops(farmId);
  const { plots, loading: plotsLoading, fetchPlots } = usePlots(farmId);

  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditTimeModalOpen, setIsEditTimeModalOpen] = useState(false);
  const [isAddPlotsModalOpen, setIsAddPlotsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch plots on mount
  useEffect(() => {
    if (farmId) {
      fetchPlots();
    }
  }, [farmId, fetchPlots]);

  const { plan: selectedPlan } = usePlan(selectedPlanId);
  const { plots: planPlots } = usePlanPlots(selectedPlanId);

  // Forms
  const [createForm, setCreateForm] = useState({
    cropId: '',
    name: '',
    startDate: '',
    endDate: '',
    note: '',
  });

  const [editTimeForm, setEditTimeForm] = useState<UpdatePlanTimeInput>({
    version: 0,
    startDate: '',
    endDate: '',
  });

  const [selectedPlotIds, setSelectedPlotIds] = useState<string[]>([]);

  // Handlers
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = createPlanSchema.safeParse(createForm);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    setSubmitting(true);
    try {
      await createPlan(validation.data as CreatePlanInput);
      toast.success('Tạo kế hoạch thành công');
      setIsCreateModalOpen(false);
      setCreateForm({ cropId: '', name: '', startDate: '', endDate: '', note: '' });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return;
    const validation = updatePlanTimeSchema.safeParse(editTimeForm);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    setSubmitting(true);
    try {
      await updatePlanTime(selectedPlanId, validation.data);
      setIsEditTimeModalOpen(false);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPlots = async () => {
    if (!selectedPlanId || selectedPlotIds.length === 0) return;
    setSubmitting(true);
    try {
      await addPlotsToPlan(selectedPlanId, { plotIds: selectedPlotIds });
      toast.success(`Đã thêm ${selectedPlotIds.length} plot vào kế hoạch`);
      setIsAddPlotsModalOpen(false);
      setSelectedPlotIds([]);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPlanId) return;
    setSubmitting(true);
    try {
      await deletePlan(selectedPlanId);
      toast.success('Xóa kế hoạch thành công');
      setIsDeleteConfirmOpen(false);
      setSelectedPlanId(null);
      setActiveTab('list');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = (planId: string) => {
    setSelectedPlanId(planId);
    setActiveTab('detail');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700';
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-700';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-700';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getCropName = (cropId: string) => {
    const crop = crops.find((c) => c.id === cropId);
    return crop?.name || 'Không rõ';
  };

  const availablePlots = plots.filter((p) => !planPlots.some((pp) => pp.plotId === p.id));

  // Render
  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-[12px] text-slate-500">
          <button
            onClick={() => navigate(`/farms/${farmId}/actions`)}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all mr-1"
          >
            <X size={14} />
          </button>
          <span>Kế hoạch sản xuất</span>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 h-8 px-3.5 text-[12px] font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all shadow-sm"
        >
          <Plus size={13} />
          Tạo kế hoạch
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'list' && (
          <div className="space-y-4">
            {plansLoading ? (
              <div className="flex items-center justify-center py-20 gap-3">
                <Loader2 size={24} className="animate-spin text-emerald-500" />
                <p className="text-[13px] text-slate-500">Đang tải kế hoạch...</p>
              </div>
            ) : plans.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 py-16 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-[14px] font-semibold text-slate-700">Chưa có kế hoạch nào</p>
                <p className="text-[12px] text-slate-400">Nhấn "Tạo kế hoạch" để bắt đầu</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                    onClick={() => openDetail(plan.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-[15px] font-bold text-slate-800 leading-tight line-clamp-2">
                        {plan.name}
                      </h3>
                      <span className={cn('text-[10px] font-bold px-2 py-1 rounded-md', getStatusColor(plan.status))}>
                        {plan.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-[12px] text-slate-600">
                      <div className="flex items-center gap-2">
                        <Seed size={14} className="text-emerald-500" />
                        <span>{getCropName(plan.cropId)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-blue-500" />
                        <span>
                          {plan.startDate} → {plan.endDate}
                        </span>
                      </div>
                      {plan.note && (
                        <p className="text-[11px] text-slate-400 italic line-clamp-2 mt-2">{plan.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'detail' && selectedPlan && (
          <div className="space-y-6">
            <button
              onClick={() => setActiveTab('list')}
              className="flex items-center gap-2 text-[12px] text-slate-500 hover:text-slate-800 mb-4"
            >
              <X size={14} />
              Quay lại danh sách
            </button>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-[18px] font-bold text-slate-800">{selectedPlan.name}</h2>
                  <p className="text-[12px] text-slate-500 mt-1">
                    Mã: {selectedPlan.id} • Version {selectedPlan.version}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-[11px] font-bold px-3 py-1.5 rounded-lg', getStatusColor(selectedPlan.status))}>
                    {selectedPlan.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[13px]">
                <div>
                  <p className="text-slate-400 text-[11px] uppercase mb-1">Cây trồng</p>
                  <p className="font-semibold text-slate-800">{getCropName(selectedPlan.cropId)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[11px] uppercase mb-1">Thời gian</p>
                  <p className="font-semibold text-slate-800">
                    {selectedPlan.startDate} – {selectedPlan.endDate}
                  </p>
                </div>
                {selectedPlan.note && (
                  <div className="col-span-2">
                    <p className="text-slate-400 text-[11px] uppercase mb-1">Ghi chú</p>
                    <p className="text-slate-700">{selectedPlan.note}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setEditTimeForm({
                      version: selectedPlan.version,
                      startDate: selectedPlan.startDate,
                      endDate: selectedPlan.endDate,
                    });
                    setIsEditTimeModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  <Edit3 size={13} /> Cập nhật thời gian
                </button>
                <button
                  onClick={() => {
                    setSelectedPlanId(selectedPlan.id);
                    setIsDeleteConfirmOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100"
                >
                  <Trash2 size={13} /> Xóa
                </button>
              </div>
            </div>

            {/* Plots Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                  <MapPin size={16} className="text-violet-500" />
                  Danh sách Plot ({planPlots.length})
                </h3>
                <button
                  onClick={() => setIsAddPlotsModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700"
                >
                  <Plus size={13} /> Thêm Plot
                </button>
              </div>

              {planPlots.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-[13px]">
                  Chưa có plot nào trong kế hoạch này
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {planPlots.map((plot) => (
                    <div
                      key={plot.plotId}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                    >
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800">{plot.plotName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{plot.plotId}</p>
                      </div>
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: Tạo kế hoạch ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Tạo kế hoạch mới</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">Điền thông tin kế hoạch sản xuất</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">
                  Cây trồng <span className="text-rose-500">*</span>
                </label>
                <select
                  value={createForm.cropId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, cropId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                >
                  <option value="">Chọn cây trồng</option>
                  {crops.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {crop.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">
                  Tên kế hoạch <span className="text-rose-500">*</span>
                </label>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="VD: Vụ Xuân 2026"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">
                    Từ ngày <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">
                    Đến ngày <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Ghi chú</label>
                <textarea
                  value={createForm.note}
                  onChange={(e) => setCreateForm((f) => ({ ...f, note: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 h-9 text-[13px] font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-9 text-[13px] font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} />Lưu</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Cập nhật thời gian ── */}
      {isEditTimeModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Cập nhật thời gian</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">Thay đổi ngày bắt đầu/kết thúc kế hoạch</p>
              </div>
              <button onClick={() => setIsEditTimeModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUpdateTime} className="px-6 py-5 space-y-4">
              <input type="hidden" name="version" value={editTimeForm.version} />
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">
                  Từ ngày <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={editTimeForm.startDate}
                  onChange={(e) => setEditTimeForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">
                  Đến ngày <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={editTimeForm.endDate}
                  onChange={(e) => setEditTimeForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditTimeModalOpen(false)}
                  className="flex-1 h-9 text-[13px] font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-9 text-[13px] font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} />Lưu</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Thêm Plot ── */}
      {isAddPlotsModalOpen && selectedPlanId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Thêm Plot vào kế hoạch</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">Chọn các plot muốn thêm</p>
              </div>
              <button onClick={() => setIsAddPlotsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {plotsLoading ? (
                <div className="flex items-center justify-center py-8 gap-2">
                  <Loader2 size={18} className="animate-spin text-violet-500" />
                  <span className="text-[13px] text-slate-500">Đang tải plots...</span>
                </div>
              ) : availablePlots.length === 0 ? (
                <p className="text-center text-[13px] text-slate-500 py-4">Không có plot nào có thể thêm</p>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {availablePlots.map((plot) => (
                    <label
                      key={plot.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlotIds.includes(plot.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPlotIds((ids) => [...ids, plot.id]);
                          } else {
                            setSelectedPlotIds((ids) => ids.filter((id) => id !== plot.id));
                          }
                        }}
                        className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500"
                      />
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800">{plot.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{plot.id}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2.5 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setIsAddPlotsModalOpen(false)}
                className="flex-1 h-9 text-[13px] font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                onClick={handleAddPlots}
                disabled={submitting || selectedPlotIds.length === 0}
                className="flex-1 h-9 text-[13px] font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} />Thêm {selectedPlotIds.length} plot</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Xác nhận xóa ── */}
      {isDeleteConfirmOpen && selectedPlanId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                <AlertCircle size={20} className="text-rose-600" />
              </div>
              <h3 className="text-[15px] font-bold text-slate-900">Xác nhận xóa</h3>
            </div>
            <p className="text-[13px] text-slate-600 mb-6">
              Bạn có chắc chắn muốn xóa kế hoạch &quot;{selectedPlan?.name}&quot;? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 h-9 text-[13px] font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 h-9 text-[13px] font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Xóa ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
