import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Package,
  Plus,
  Loader2,
  Search,
  Trash2,
  Edit2,
  ChevronRight,
  Building,
  MapPin,
  Grid3X3,
  List,
  Eye,
  X,
  TrendingDown,
  Boxes,
  Warehouse,
  CheckCircle2,
  Clock,
  Tag,
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import {
  useTransactionsByWarehouse,
  useTransactionsByItem,
} from "../../hooks/warehouseTransactions/useWarehouseTransactions";
import type {
  WarehouseTransaction,
  TransactionType,
} from "../../types/warehouseTransaction/warehouseTransaction";
import { PageableParams } from "../../types/common";
import { toast } from "sonner";
import { useAuth } from "../../hooks/auth/useAuth";
import { useWarehouseItems } from "../../hooks/warehouseItems/useWarehouseItems";
import { useSuppliers } from "../../hooks/suppliers/useSuppliers";
import { useSkus } from "../../hooks/skus/useSkus";
import { useUnits } from "../../hooks/units/useUnits";
import { useWarehouses } from "../../hooks/warehouses/useWarehouses";
import { useFarms } from "../../hooks/farms/useFarms";
import { createWarehouseItemSchema } from "../../schemas/warehouseItemSchemas";
import {
  WarehouseItem,
  CreateWarehouseItemDto,
} from "../../types/warehouseItem/warehouseItem";
import { Unit } from "../../types/unit/unit";
import { Sku } from "../../types/sku/sku";
import { Supplier } from "../../types/supplier/supplier";
import { FarmSummary } from "../../types/farm/farm";
import { extractErrorMessage } from "../../utils/errorUtils";
import {
  useWarehouseLocations,
  WarehouseLocation,
} from "@/hooks/warehouses/useWarehouseLocation";
import { cn } from "../../utils/cn";
import {
  EditWarehouseModal,
  EditWarehouseItemModal,
  DeleteWarehouseItemModal,
  DeleteLocationModal,
  LocationDetailModal,
} from "../../components/warehouse";

type ActiveTab = "items" | "locations" | "transactions";

const LOCATION_COLORS = [
  {
    dot: "bg-violet-500",
    light: "bg-violet-50 text-violet-700",
    badge: "bg-violet-100 text-violet-600",
  },
  {
    dot: "bg-sky-500",
    light: "bg-sky-50 text-sky-700",
    badge: "bg-sky-100 text-sky-600",
  },
  {
    dot: "bg-amber-500",
    light: "bg-amber-50 text-amber-700",
    badge: "bg-amber-100 text-amber-600",
  },
  {
    dot: "bg-rose-500",
    light: "bg-rose-50 text-rose-700",
    badge: "bg-rose-100 text-rose-600",
  },
  {
    dot: "bg-emerald-500",
    light: "bg-emerald-50 text-emerald-700",
    badge: "bg-emerald-100 text-emerald-600",
  },
  {
    dot: "bg-orange-500",
    light: "bg-orange-50 text-orange-700",
    badge: "bg-orange-100 text-orange-600",
  },
];

// ── Small reusable modal wrapper ──────────────────────────────────────────────
function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 shrink-0">
      <div>
        <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
      {children}
      {required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all";
const selectCls =
  "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all";

function TransactionTypeBadge({ type }: { type: TransactionType }) {
  const configs: Record<string, { label: string; className: string }> = {
    IMPORT_MANUAL: {
      label: "NHẬP VẬT TƯ THỦ CÔNG",
      className: "bg-emerald-100 text-emerald-700",
    },
  };
  const config = configs[type] || {
    label: type,
    className: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={cn(
        "text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}

function sanitizeTransactionNote(note?: string | null) {
  if (!note) return null;
  const normalized = note.trim().toUpperCase();
  if (
    normalized === "IMPORT WAREHOUSE ITEM MANUAL" ||
    normalized === "IMPORT_WAREHOUSE_ITEM_MANUAL"
  ) {
    return null;
  }
  return note;
}

// ─────────────────────────────────────────────────────────────────────────────

export function WarehouseDetailPage() {
  const { farmId, warehouseId } = useParams<{
    farmId: string;
    warehouseId: string;
  }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { items, loading, fetchItems, createItem, deleteItem } =
    useWarehouseItems(farmId, warehouseId);

  const [activeTab, setActiveTab] = useState<ActiveTab>("items");
  const [filterItemId, setFilterItemId] = useState<string | null>(null);

  // Conditionally fetch transactions based on filter
  const warehouseTx = useTransactionsByWarehouse(farmId, warehouseId, undefined, { 
    enabled: activeTab === "transactions" 
  });
  const itemTx = useTransactionsByItem(filterItemId, undefined, { 
    enabled: activeTab === "transactions" 
  });

  const {
    transactions,
    loading: txLoading,
    data: txData,
    pageable: txPageable,
    setPageable: txSetPageable,
    setPageSize: txSetPageSize,
    goToPage: txGoToPage,
  } = filterItemId ? itemTx : warehouseTx;

  // ── Sync pagination with URL query params ───────────────────────────────────
  const sortParam = searchParams.get('sort');
  const urlPageable = useMemo<PageableParams>(() => ({
    page: Number(searchParams.get('page')) || 0,
    size: Number(searchParams.get('size')) || 20,
    sort: sortParam ? [sortParam] : ['createdAt,desc'],
  }), [searchParams, sortParam]);

  // When URL changes externally, sync to hook state
  useEffect(() => {
    if (
      urlPageable.page !== txPageable.page ||
      urlPageable.size !== txPageable.size ||
      (urlPageable.sort?.[0] ?? 'createdAt,desc') !== (txPageable.sort?.[0] ?? 'createdAt,desc')
    ) {
      txSetPageable(urlPageable);
    }
  }, [urlPageable, txPageable, txSetPageable]);

  // Wrapped mutators that also update URL
  const goToPage = (p: number) => {
    txGoToPage(p);
    const params = new URLSearchParams(searchParams);
    params.set('page', String(p));
    setSearchParams(params, { replace: true });
  };

  const setPageSize = (s: number) => {
    txSetPageSize(s);
    const params = new URLSearchParams(searchParams);
    params.set('size', String(s));
    params.set('page', '0');
    setSearchParams(params, { replace: true });
  };

  const setSort = (sortKey: string) => {
    txSetPageable({ page: 0, size: txPageable.size, sort: [sortKey] });
    const params = new URLSearchParams(searchParams);
    params.set('sort', sortKey);
    params.set('page', '0');
    setSearchParams(params, { replace: true });
  };
  // ──────────────────────────────────────────────────────────────────────────────

  const refreshAllTx = () => {
    warehouseTx.refresh();
    itemTx.refresh();
  };

  const {
    locations,
    loading: locLoading,
    submitting: locSubmitting,
    fetchLocations,
    createLocation,
    deleteLocation,
  } = useWarehouseLocations(farmId, warehouseId);
  const { suppliers, fetchSuppliers } = useSuppliers();
  const { skus, fetchSkus } = useSkus();
  const { units, fetchUnits } = useUnits();
  const { warehouses, fetchWarehouses } = useWarehouses();
  const { farmSummary } = useFarms();
  const { user } = useAuth();


  const [searchTerm, setSearchTerm] = useState("");
  const [locationView, setLocationView] = useState<"grid" | "list">("grid");
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WarehouseItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteLocModalOpen, setIsDeleteLocModalOpen] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState<WarehouseLocation | null>(
    null,
  );
  const [isDetailLocModalOpen, setIsDetailLocModalOpen] = useState(false);
  const [selectedLocId, setSelectedLocId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentWarehouse = useMemo(
    () => warehouses.find((w) => w.id === warehouseId),
    [warehouses, warehouseId],
  );

  const [itemForm, setItemForm] = useState({
    name: "",
    unitId: "",
    stock: 0,
    sku: "",
    supplierId: "",
    unitPrice: 0,
    minStockQty: 0,
    toLocationId: "",
  });
  const [locationForm, setLocationForm] = useState({
    code: "",
    name: "",
    description: "",
    isActive: true,
  });

  const canManage = useMemo(() => {
    const currentFarm = farmSummary.find(
      (f: FarmSummary) => f.farmId === farmId,
    );
    const myFarmRole = currentFarm?.myRole?.toLowerCase() || user?.role;
    return ["owner", "manager", "admin"].includes(myFarmRole || "");
  }, [farmSummary, farmId, user]);

  const lowStockCount = useMemo(
    () =>
      items.filter(
        (item: WarehouseItem) => item.stock <= (item.minStockQty || 0),
      ).length,
    [items],
  );

  const totalInventoryValue = useMemo(
    () =>
      items.reduce(
        (acc: number, item: WarehouseItem) =>
          acc + item.stock * (item.unitPrice || 0),
        0,
      ),
    [items],
  );

  const filteredItems = items.filter(
    (item: WarehouseItem) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const activeLocations = locations.filter(
    (l: WarehouseLocation) => l.isActive,
  );
  const inactiveLocations = locations.filter(
    (l: WarehouseLocation) => !l.isActive,
  );

  useEffect(() => {
    if (farmId && warehouseId) {
      fetchItems(farmId, warehouseId);
      fetchWarehouses(farmId);
      fetchLocations(farmId, warehouseId);
    }
  }, [fetchItems, fetchWarehouses, fetchLocations, farmId, warehouseId]);

  useEffect(() => {
    if (isItemModalOpen && farmId) {
      fetchSuppliers(farmId);
      fetchSkus(farmId);
      fetchUnits();
    }
  }, [isItemModalOpen, farmId, fetchSuppliers, fetchSkus, fetchUnits]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = createWarehouseItemSchema.safeParse(itemForm);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    if (!farmId || !warehouseId) return;
    try {
      setIsSubmitting(true);
      const payload: CreateWarehouseItemDto = {
        name: validation.data.name,
        unitId: validation.data.unitId,
        stock: validation.data.stock,
        sku: validation.data.sku,
        unitPrice: validation.data.unitPrice ?? 0,
        minStockQty: validation.data.minStockQty ?? 0,
        supplierId: validation.data.supplierId || "",
        toLocationId: validation.data.toLocationId,
      };
      await createItem(farmId, warehouseId, payload).unwrap();
      toast.success("Đã thêm vật tư mới");
      refreshAllTx();
      setIsItemModalOpen(false);
      setItemForm({
        name: "",
        unitId: "",
        stock: 0,
        sku: "",
        supplierId: "",
        unitPrice: 0,
        minStockQty: 0,
        toLocationId: "",
      });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = (item: WarehouseItem) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteItem = async () => {
    if (!farmId || !warehouseId || !selectedItem) return;
    try {
      setIsSubmitting(true);
      await deleteItem(farmId, warehouseId, selectedItem.id).unwrap();
      toast.success("Đã xóa vật tư thành công");
      refreshAllTx();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    }
  };

  const handleEditItem = (item: WarehouseItem) => {
    setSelectedItem(item);
    setIsEditItemModalOpen(true);
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmId || !warehouseId) return;
    try {
      setIsSubmitting(true);
      await createLocation(farmId, warehouseId, locationForm).unwrap();
      toast.success("Đã tạo vị trí kho mới");
      refreshAllTx();
      setIsLocationModalOpen(false);
      setLocationForm({ code: "", name: "", description: "", isActive: true });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLocation = (loc: WarehouseLocation) => {
    setSelectedLoc(loc);
    setIsDeleteLocModalOpen(true);
  };

  const confirmDeleteLocation = async () => {
    if (!farmId || !warehouseId || !selectedLoc) return;
    try {
      setIsSubmitting(true);
      await deleteLocation(farmId, warehouseId, selectedLoc.id).unwrap();
      toast.success("Đã xóa vị trí thành công");
      refreshAllTx();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
      setIsDeleteLocModalOpen(false);
      setSelectedLoc(null);
    }
  };

  const handleViewLocationDetail = (locId: string) => {
    setSelectedLocId(locId);
    setIsDetailLocModalOpen(true);
  };

  const numericInput = (
    value: number,
    onChange: (n: number) => void,
    extra?: React.InputHTMLAttributes<HTMLInputElement>,
  ) => ({
    type: "text" as const,
    value: value === 0 ? "" : value.toLocaleString("vi-VN"),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "");
      onChange(raw === "" ? 0 : Number(raw));
    },
    placeholder: "0",
    ...extra,
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* ── Top bar ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-[12px] text-slate-500">
          <button
            onClick={() => navigate(`/farms/${farmId}/warehouses`)}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all mr-1"
            title="Quay lại"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            onClick={() => navigate(`/farms/${farmId}/warehouses`)}
            className="hover:text-slate-800 transition-colors font-medium"
          >
            Kho hàng
          </button>
          <ChevronRight size={13} className="text-slate-300" />
          <span className="text-slate-800 font-semibold">
            {currentWarehouse?.name || "Chi tiết kho"}
          </span>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-1.5 h-8 px-3.5 text-[12px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-400 hover:text-slate-800 transition-all"
            >
              <MapPin size={13} />
              Thêm vị trí
            </button>
            <button
              onClick={() => setIsItemModalOpen(true)}
              className="flex items-center gap-1.5 h-8 px-3.5 text-[12px] font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all shadow-sm"
            >
              <Plus size={13} />
              Nhập vật tư
            </button>
          </div>
        )}
      </div>

      {/* ── Page header ── */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
            <Warehouse size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[17px] font-bold text-slate-900 leading-tight">
                {currentWarehouse?.name || "Đang tải..."}
              </h1>
              {/* Tạm ẩn nút sửa vì API chưa hỗ trợ PATCH/PUT cho Warehouse */}
              {/* {canManage && currentWarehouse && (
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                  title="Chỉnh sửa thông tin kho"
                >
                  <Edit2 size={14} />
                </button>
              )} */}
            </div>
            {currentWarehouse?.address && (
              <p className="text-[12px] text-slate-500 mt-0.5 flex items-center gap-1">
                <MapPin size={11} /> {currentWarehouse.address}
              </p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              label: "Tổng vật tư",
              value: items.length,
              icon: Boxes,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Sắp hết hàng",
              value: lowStockCount,
              icon: TrendingDown,
              color: lowStockCount > 0 ? "text-rose-600" : "text-slate-400",
              bg: lowStockCount > 0 ? "bg-rose-50" : "bg-slate-50",
            },
            {
              label: "Giá trị tồn kho",
              value: totalInventoryValue.toLocaleString("vi-VN") + " ₫",
              icon: Tag,
              color: "text-amber-600",
              bg: "bg-amber-50",
              wide: true,
            },
            {
              label: "Vị trí kho",
              value: locations.length,
              icon: MapPin,
              color: "text-violet-600",
              bg: "bg-violet-50",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  s.bg,
                )}
              >
                <s.icon size={15} className={s.color} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                  {s.label}
                </p>
                <p className={cn("text-[15px] font-bold truncate", s.color)}>
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white border-b border-slate-200 px-6 flex items-center gap-0">
        {(
          [
            { key: "items", label: "Vật tư tồn kho", count: items.length },
            { key: "locations", label: "Vị trí kho", count: locations.length },
            {
              key: "transactions",
              label: "Lịch sử giao dịch",
              count: txData?.totalElements ?? 0,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-all",
              activeTab === tab.key
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                activeTab === tab.key
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500",
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto px-6 py-5">
        {/* ══ ITEMS tab ══ */}
        {activeTab === "items" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                />
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-[12px] text-slate-500 hover:text-slate-800"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2
                    size={28}
                    className="animate-spin text-emerald-500"
                  />
                  <p className="text-[12px] text-slate-400">
                    Đang tải dữ liệu...
                  </p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <Package size={24} className="text-slate-300" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-slate-700">
                      Chưa có vật tư nào
                    </p>
                    <p className="text-[12px] text-slate-400 mt-1">
                      {searchTerm
                        ? "Không tìm thấy kết quả phù hợp"
                        : 'Nhấn "Nhập vật tư" để bắt đầu'}
                    </p>
                  </div>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Vật tư
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Đơn vị
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                        Tồn kho
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Nhà cung cấp
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                        Đơn giá
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                        Giá trị
                      </th>
                      <th className="px-4 py-3 w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredItems.map((item: WarehouseItem) => {
                      const isLow = item.stock <= (item.minStockQty || 0);
                      const value = item.stock * (item.unitPrice || 0);
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/60 transition-colors group"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                                <Package size={14} />
                              </div>
                              <div>
                                <p className="text-[13px] font-semibold text-slate-800 leading-tight">
                                  {item.name}
                                </p>
                                <p className="text-[11px] text-emerald-600 font-mono mt-0.5">
                                  {item.sku?.sku || "N/A"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                              {item.unit.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isLow && (
                                <TrendingDown
                                  size={12}
                                  className="text-rose-500"
                                />
                              )}
                              <span
                                className={cn(
                                  "text-[13px] font-bold",
                                  isLow ? "text-rose-600" : "text-slate-800",
                                )}
                              >
                                {item.stock?.toLocaleString("vi-VN") ?? "—"}
                              </span>
                            </div>
                            {isLow && (
                              <p className="text-[10px] text-rose-400 text-right mt-0.5">
                                Dưới mức tối thiểu
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Building
                                size={12}
                                className="text-slate-300 shrink-0"
                              />
                              <span className="text-[12px] text-slate-600">
                                {item.supplier?.name || "—"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-[12px] font-medium text-slate-700">
                              {item.unitPrice
                                ? item.unitPrice.toLocaleString("vi-VN") + " ₫"
                                : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-[12px] font-semibold text-slate-800">
                              {value
                                ? value.toLocaleString("vi-VN") + " ₫"
                                : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditItem(item);
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item)}
                                disabled={loading}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ══ LOCATIONS tab ══ */}
        {activeTab === "locations" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-slate-600">
                <span className="font-bold text-slate-900">
                  {activeLocations.length}
                </span>{" "}
                vị trí hoạt động
                {inactiveLocations.length > 0 && (
                  <span className="text-slate-400 ml-2">
                    · {inactiveLocations.length} vô hiệu
                  </span>
                )}
              </p>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
                <button
                  onClick={() => setLocationView("grid")}
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    locationView === "grid"
                      ? "bg-white shadow-sm text-slate-800"
                      : "text-slate-400",
                  )}
                >
                  <Grid3X3 size={14} />
                </button>
                <button
                  onClick={() => setLocationView("list")}
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    locationView === "list"
                      ? "bg-white shadow-sm text-slate-800"
                      : "text-slate-400",
                  )}
                >
                  <List size={14} />
                </button>
              </div>
            </div>

            {locLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 size={28} className="animate-spin text-violet-500" />
                <p className="text-[12px] text-slate-400">
                  Đang tải vị trí kho...
                </p>
              </div>
            ) : locations.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 py-16 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center">
                  <MapPin size={20} className="text-violet-300" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-slate-700">
                    Chưa có vị trí nào
                  </p>
                  <p className="text-[12px] text-slate-400 mt-1">
                    Tạo kệ, ô, khu vực để phân loại vật tư trong kho
                  </p>
                </div>
                {canManage && (
                  <button
                    onClick={() => setIsLocationModalOpen(true)}
                    className="mt-1 flex items-center gap-1.5 h-8 px-4 text-[12px] font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-all"
                  >
                    <Plus size={13} /> Tạo vị trí đầu tiên
                  </button>
                )}
              </div>
            ) : locationView === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {locations.map((loc: WarehouseLocation, idx: number) => {
                  const c = LOCATION_COLORS[idx % LOCATION_COLORS.length];
                  return (
                    <div
                      key={loc.id}
                      onClick={() => handleViewLocationDetail(loc.id)}
                      className={cn(
                        "bg-white rounded-xl border border-slate-100 p-4 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group",
                        !loc.isActive && "opacity-50",
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            c.badge,
                          )}
                        >
                          <MapPin size={15} />
                        </div>
                        <div className="flex items-center gap-1">
                          {canManage && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLocation(loc);
                              }}
                              disabled={locLoading}
                              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50 shrink-0"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                          <span
                            className={cn(
                              "inline-flex items-center justify-center text-[10px] font-bold px-2 h-5 rounded-full whitespace-nowrap",
                              loc.isActive
                                ? c.badge
                                : "bg-slate-100 text-slate-400",
                            )}
                          >
                            {loc.isActive ? "Active" : "Off"}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-bold text-slate-800 leading-tight">
                          {loc.name}
                        </p>
                        {loc.description && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                            {loc.description}
                          </p>
                        )}
                      </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={cn("w-1.5 h-1.5 rounded-full", c.dot)}
                            />
                            <span className="text-[11px] font-mono font-semibold text-slate-500">
                              {loc.code}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded-lg shadow-sm border border-violet-100/50 transition-all hover:bg-violet-100">
                            <span>Chi tiết</span>
                            <ChevronRight size={10} />
                          </div>
                        </div>
                    </div>
                  );
                })}
                {canManage && (
                  <button
                    onClick={() => setIsLocationModalOpen(true)}
                    className="rounded-xl border-2 border-dashed border-slate-200 p-4 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-violet-300 hover:text-violet-500 hover:bg-violet-50/50 transition-all min-h-[120px] group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-violet-100 flex items-center justify-center transition-all">
                      <Plus
                        size={16}
                        className="group-hover:rotate-90 transition-transform duration-300"
                      />
                    </div>
                    <span className="text-[11px] font-semibold">
                      Thêm vị trí
                    </span>
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Vị trí
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Mã
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Mô tả
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {locations.map((loc: WarehouseLocation, idx: number) => {
                      const c = LOCATION_COLORS[idx % LOCATION_COLORS.length];
                      return (
                        <tr
                          key={loc.id}
                          className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                          onClick={() => handleViewLocationDetail(loc.id)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                  c.badge,
                                )}
                              >
                                <MapPin size={13} />
                              </div>
                              <span className="text-[13px] font-semibold text-slate-800">
                                {loc.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {loc.code}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[12px] text-slate-500">
                              {loc.description || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {loc.isActive ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <CheckCircle2 size={11} /> Hoạt động
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                <Clock size={11} /> Vô hiệu
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewLocationDetail(loc.id);
                                }}
                                className="p-1.5 text-violet-500 hover:text-white hover:bg-violet-600 rounded-lg transition-all shadow-sm border border-violet-100"
                                title="Xem chi tiết"
                              >
                                <Eye size={13} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // logic sửa nếu có
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteLocation(loc)}
                                disabled={locLoading}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ TRANSACTIONS tab ══ */}
        {activeTab === "transactions" && (
          <div className="flex flex-col h-full space-y-4 min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-slate-600">
                <span className="font-bold text-slate-900">
                  {txData?.totalElements ?? 0}
                </span>{" "}
                giao dịch
                {txData && txData.totalPages > 1 && (
                  <span className="text-slate-400 ml-2">
                    · Trang {(txData.pageNumber ?? 0) + 1}/{txData.totalPages}
                  </span>
                )}
              </p>
            </div>

            {/* Table Area (Scrollable) */}
            <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-slate-400" />
                  <span className="text-[14px] font-bold text-slate-700">
                    Chi tiết giao dịch
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Lọc theo vật tư:
                  </span>
                  <select
                    value={filterItemId || ""}
                    onChange={(e) => {
                      const newItemId = e.target.value || null;
                      setFilterItemId(newItemId);
                      // Reset cả hai hook để tránh lệch trang khi switch filter
                      warehouseTx.goToPage(0);
                      itemTx.goToPage(0);
                      const params = new URLSearchParams(searchParams);
                      params.set('page', '0');
                      setSearchParams(params, { replace: true });
                    }}
                    className="text-[12px] border-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 py-1 pl-3 pr-8 min-w-[200px] bg-white shadow-sm"
                  >
                    <option value="">— Tất cả vật tư —</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={txPageable.size ?? 20}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="text-[12px] border-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 py-1 pl-3 pr-8 bg-white shadow-sm"
                    title="Số dòng mỗi trang"
                  >
                    <option value={10}>10 / trang</option>
                    <option value={20}>20 / trang</option>
                    <option value={50}>50 / trang</option>
                  </select>

                  <select
                    value={txPageable.sort?.[0] ?? "createdAt,desc"}
                    onChange={(e) => setSort(e.target.value)}
                    className="text-[12px] border-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 py-1 pl-3 pr-8 bg-white shadow-sm"
                    title="Sắp xếp"
                  >
                    <option value="createdAt,desc">Mới nhất</option>
                    <option value="createdAt,asc">Cũ nhất</option>
                  </select>

                  {txData && txData.totalElements > 0 && (
                    <div className="ml-2 pl-4 border-l border-slate-200 py-1">
                      <p className="text-[12px] text-slate-500">
                        Hiển thị{" "}
                        <span className="font-bold text-slate-700">
                          {transactions.length}
                        </span>{" "}
                        /{" "}
                        <span className="font-bold text-slate-700">
                          {txData.totalElements}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {txLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2
                    size={28}
                    className="animate-spin text-emerald-500"
                  />
                  <p className="text-[12px] text-slate-400">
                    Đang tải giao dịch...
                  </p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <History size={24} className="text-slate-300" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-slate-700">
                      Chưa có giao dịch nào
                    </p>
                    <p className="text-[12px] text-slate-400 mt-1">
                      Giao dịch sẽ xuất hiện khi nhập/xuất vật tư
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Loại
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Vật tư
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                          SL thay đổi
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Từ vị trí
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Đến vị trí
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Người thực hiện
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Thời gian
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transactions.map((tx: WarehouseTransaction) => {
                        const isImport = tx.qtyChange > 0;
                        const safeNote = sanitizeTransactionNote(tx.notes);
                        return (
                          <tr
                            key={tx.id}
                            className="hover:bg-slate-50/60 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <TransactionTypeBadge type={tx.type} />
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-[13px] font-semibold text-slate-800 leading-tight">
                                  {tx.warehouseItem.name}
                                </p>
                                {tx.warehouseItem.sku && (
                                  <p className="text-[11px] text-emerald-600 font-mono mt-0.5">
                                    {tx.warehouseItem.sku.sku}
                                  </p>
                                )}
                                {(safeNote ||
                                  tx.refHavestId ||
                                  tx.refTaskId ||
                                  tx.refTransferId ||
                                  tx.refWorkLogId) && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {safeNote && (
                                      <span className="text-[10px] text-slate-400 italic">
                                        "{safeNote}"
                                      </span>
                                    )}
                                    {tx.refHavestId && (
                                      <span className="text-[9px] font-bold bg-indigo-50 text-indigo-500 px-1 rounded uppercase">
                                        Ref: Harvest
                                      </span>
                                    )}
                                    {tx.refTaskId && (
                                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-500 px-1 rounded uppercase">
                                        Ref: Task
                                      </span>
                                    )}
                                    {tx.refTransferId && (
                                      <span className="text-[9px] font-bold bg-amber-50 text-amber-500 px-1 rounded uppercase">
                                        Ref: Transfer
                                      </span>
                                    )}
                                    {tx.refWorkLogId && (
                                      <span className="text-[9px] font-bold bg-blue-50 text-blue-500 px-1 rounded uppercase">
                                        Ref: WorkLog
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {isImport ? (
                                  <ArrowDownCircle
                                    size={13}
                                    className="text-emerald-500"
                                  />
                                ) : (
                                  <ArrowUpCircle
                                    size={13}
                                    className="text-rose-500"
                                  />
                                )}
                                <span
                                  className={cn(
                                    "text-[13px] font-bold",
                                    isImport
                                      ? "text-emerald-700"
                                      : "text-rose-600",
                                  )}
                                >
                                  {isImport ? "+" : ""}
                                  {tx.qtyChange.toLocaleString("vi-VN")}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {tx.warehouseItem.unit.code}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {tx.fromLocation ? (
                                <span className="text-[12px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {tx.fromLocation.code}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {tx.toLocation ? (
                                <span className="text-[12px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {tx.toLocation.code}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[12px] text-slate-600">
                                {tx.performedBy?.fullName ?? "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[11px] text-slate-400">
                                {new Date(tx.createdAt).toLocaleString(
                                  "vi-VN",
                                  { dateStyle: "short", timeStyle: "short" },
                                )}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination Area (Fixed at bottom) */}
            {txData && (
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shrink-0">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-slate-500">
                    Trang <span className="font-semibold text-slate-700">{(txData.pageNumber ?? 0) + 1}</span> /{" "}
                    <span className="font-semibold text-slate-700">{Math.max(txData.totalPages, 1)}</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => goToPage((txData.pageNumber ?? 0) - 1)}
                      disabled={txData.first || txData.totalPages <= 1}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    {Array.from(
                      { length: Math.min(Math.max(txData.totalPages, 1), 5) },
                      (_, i) => {
                        const currentPage = txData.pageNumber ?? 0;
                        const total = Math.max(txData.totalPages, 1);
                        let pageNum: number;
                        if (total <= 5) {
                          pageNum = i;
                        } else if (currentPage < 3) {
                          pageNum = i;
                        } else if (currentPage >= total - 2) {
                          pageNum = total - 5 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={cn(
                              "w-7 h-7 text-[12px] font-semibold rounded-lg transition-all",
                              currentPage === pageNum
                                ? "bg-emerald-600 text-white"
                                : "text-slate-600 hover:bg-slate-100",
                            )}
                          >
                            {pageNum + 1}
                          </button>
                        );
                      },
                    )}
                    <button
                      onClick={() => goToPage((txData.pageNumber ?? 0) + 1)}
                      disabled={txData.last || txData.totalPages <= 1}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRightIcon size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ MODAL: Tạo vật tư ══ */}
      {isItemModalOpen && (
        <Modal>
          <ModalHeader
            title="Nhập vật tư mới"
            subtitle="Điền thông tin vật tư cần nhập kho"
            onClose={() => setIsItemModalOpen(false)}
          />

          <div className="overflow-y-auto flex-1 px-6 py-5">
            <form
              id="create-item-form"
              onSubmit={handleCreateItem}
              className="space-y-4"
            >
               <div>
                 <FieldLabel required>Tên vật tư</FieldLabel>
                 <input
                   // required
                   value={itemForm.name}
                   onChange={(e) =>
                     setItemForm((p) => ({ ...p, name: e.target.value }))
                   }
                   className={inputCls}
                   placeholder="VD: Phân bón NPK 20-20-15"
                 />
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <FieldLabel required>Đơn vị tính</FieldLabel>
                   <select
                     // required
                     value={itemForm.unitId}
                     onChange={(e) =>
                       setItemForm((p) => ({ ...p, unitId: e.target.value }))
                     }
                     className={selectCls}
                   >
                     <option value="">Chọn đơn vị</option>
                     {units.map((u: Unit) => (
                       <option key={u.id} value={u.id}>
                         {u.name} ({u.code})
                       </option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <FieldLabel required>Mã SKU</FieldLabel>
                   <select
                     // required
                     value={itemForm.sku}
                     onChange={(e) =>
                       setItemForm((p) => ({ ...p, sku: e.target.value }))
                     }
                     className={selectCls}
                   >
                     <option value="">Chọn SKU</option>
                     {skus.map((s: Sku) => (
                       <option key={s.sku} value={s.sku}>
                         {s.sku}
                       </option>
                     ))}
                   </select>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <FieldLabel>Nhà cung cấp</FieldLabel>
                   <select
                     value={itemForm.supplierId}
                     onChange={(e) =>
                       setItemForm((p) => ({ ...p, supplierId: e.target.value }))
                     }
                     className={selectCls}
                   >
                     <option value="">Chọn nhà cung cấp</option>
                     {suppliers.map((s: Supplier) => (
                       <option key={s.id} value={s.id}>
                         {s.name}
                       </option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <FieldLabel required>Vị trí trong kho</FieldLabel>
                   <select
                     // required
                     value={itemForm.toLocationId}
                     onChange={(e) =>
                       setItemForm((p) => ({
                         ...p,
                         toLocationId: e.target.value,
                       }))
                     }
                     className={selectCls}
                   >
                     <option value="">Chọn vị trí</option>
                     {locations
                       .filter((l: WarehouseLocation) => l.isActive)
                       .map((l: WarehouseLocation) => (
                         <option key={l.id} value={l.id}>
                           {l.name} [{l.code}]
                         </option>
                       ))}
                   </select>
                 </div>
               </div>

               <div className="grid grid-cols-3 gap-3">
                 <div>
                   <FieldLabel required>Số lượng tồn</FieldLabel>
                   <input
                     // required
                     {...numericInput(itemForm.stock, (v) =>
                       setItemForm((p) => ({ ...p, stock: v })),
                     )}
                     className={cn(inputCls, "font-bold text-emerald-700")}
                   />
                 </div>
                <div>
                  <FieldLabel>Đơn giá (₫)</FieldLabel>
                  <input
                    {...numericInput(itemForm.unitPrice, (v) =>
                      setItemForm((p) => ({ ...p, unitPrice: v })),
                    )}
                    className={inputCls}
                  />
                </div>
                <div>
                  <FieldLabel>Tồn tối thiểu</FieldLabel>
                  <input
                    {...numericInput(itemForm.minStockQty, (v) =>
                      setItemForm((p) => ({ ...p, minStockQty: v })),
                    )}
                    className={cn(inputCls, "text-rose-600")}
                  />
                </div>
              </div>
            </form>
          </div>

          <div className="flex gap-2.5 px-6 py-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={() => setIsItemModalOpen(false)}
              className="flex-1 h-9 text-[13px] font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="create-item-form"
              disabled={isSubmitting}
              className="flex-1 h-9 text-[13px] font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <Plus size={14} />
                  Xác nhận nhập kho
                </>
              )}
            </button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL: Tạo vị trí ══ */}
      {isLocationModalOpen && (
        <Modal>
          <ModalHeader
            title="Tạo vị trí kho"
            subtitle="Kệ, ô chứa, khu vực, ..."
            onClose={() => setIsLocationModalOpen(false)}
          />

           <form
             id="create-location-form"
             onSubmit={handleCreateLocation}
             className="px-6 py-5 space-y-4"
           >
             <div className="grid grid-cols-2 gap-3">
               <div>
                 <FieldLabel required>Mã vị trí</FieldLabel>
                 <input
                   // required
                   value={locationForm.code}
                   onChange={(e) =>
                     setLocationForm((p) => ({
                       ...p,
                       code: e.target.value.toUpperCase(),
                     }))
                   }
                   className={cn(inputCls, "font-mono uppercase")}
                   placeholder="VD: A1, KEL-01"
                   maxLength={20}
                 />
               </div>
               <div>
                 <FieldLabel required>Tên vị trí</FieldLabel>
                 <input
                   // required
                   value={locationForm.name}
                   onChange={(e) =>
                     setLocationForm((p) => ({ ...p, name: e.target.value }))
                   }
                   className={inputCls}
                   placeholder="VD: Kệ A hàng 1"
                 />
               </div>
            </div>

            <div>
              <FieldLabel>Mô tả</FieldLabel>
              <textarea
                rows={2}
                value={locationForm.description}
                onChange={(e) =>
                  setLocationForm((p) => ({
                    ...p,
                    description: e.target.value,
                  }))
                }
                className={cn(inputCls, "resize-none")}
                placeholder="Mô tả thêm về vị trí này..."
              />
            </div>

            <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <p className="text-[13px] font-semibold text-slate-700">
                  Kích hoạt ngay
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Cho phép nhập hàng vào vị trí này
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setLocationForm((p) => ({ ...p, isActive: !p.isActive }))
                }
                className={cn(
                  "relative w-10 h-5 rounded-full transition-colors duration-300",
                  locationForm.isActive ? "bg-emerald-500" : "bg-slate-300",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300",
                    locationForm.isActive ? "left-5" : "left-0.5",
                  )}
                />
              </button>
            </div>
          </form>

          <div className="flex gap-2.5 px-6 py-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(false)}
              className="flex-1 h-9 text-[13px] font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="create-location-form"
              disabled={isSubmitting || locSubmitting}
              className="flex-1 h-9 text-[13px] font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
            >
              {isSubmitting || locSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <MapPin size={14} />
                  Tạo vị trí
                </>
              )}
            </button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL: Chỉnh sửa kho hàng ══ */}
      {farmId && currentWarehouse && (
        <EditWarehouseModal
          farmId={farmId}
          warehouse={currentWarehouse}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            fetchWarehouses(farmId);
          }}
        />
      )}

      {/* ══ MODAL: Chỉnh sửa vật tư ══ */}
      {farmId && warehouseId && selectedItem && (
        <EditWarehouseItemModal
          farmId={farmId}
          warehouseId={warehouseId}
          item={selectedItem}
          isOpen={isEditItemModalOpen}
          onClose={() => {
            setIsEditItemModalOpen(false);
            setSelectedItem(null);
          }}
          onSuccess={() => {
            fetchItems(farmId, warehouseId);
          }}
        />
      )}

      {selectedItem && (
        <DeleteWarehouseItemModal
          isOpen={isDeleteModalOpen}
          item={selectedItem}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedItem(null);
          }}
          onConfirm={confirmDeleteItem}
          loading={isSubmitting}
        />
      )}

      {selectedLoc && (
        <DeleteLocationModal
          isOpen={isDeleteLocModalOpen}
          location={selectedLoc}
          onClose={() => {
            setIsDeleteLocModalOpen(false);
            setSelectedLoc(null);
          }}
          onConfirm={confirmDeleteLocation}
          loading={isSubmitting}
        />
      )}

      {selectedLocId && (
        <LocationDetailModal
          farmId={farmId!}
          warehouseId={warehouseId!}
          locationId={selectedLocId}
          isOpen={isDetailLocModalOpen}
          onClose={() => setIsDetailLocModalOpen(false)}
        />
      )}
    </div>
  );
}

export default WarehouseDetailPage;
