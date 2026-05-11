import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/auth/useAuth';
import { extractErrorMessage } from '@/utils/errorUtils';
import {
  useFarmConfig,
  useUpdateFarmConfig,
  useWorkShifts,
  useCreateWorkShift,
  useDeleteWorkShift,
  useWageConfigs,
  useCreateWageConfig,
  useDeleteWageConfig,
} from '@/hooks/farm/useFarmConfig';
import type {
  FarmConfig,
  CreateWorkShiftRequest,
  CreateWageConfigRequest,
} from '@/types/farmConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'config' | 'shift' | 'wage';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'config', label: 'Cấu hình Farm',  icon: '⚙' },
  { key: 'shift',  label: 'Ca làm việc',    icon: '⏱' },
  { key: 'wage',   label: 'Cấu hình lương', icon: '₫' },
];

// ─── Design tokens (AWS-style) ─────────────────────────────────────────────

const aws = {
  // Surfaces
  pageBg:       'bg-[#f2f3f3]',
  navBg:        'bg-[#232f3e]',
  cardBg:       'bg-white',
  sectionBg:    'bg-[#f8f9f9]',

  // Borders
  border:       'border border-[#c6c6c6]',
  borderLight:  'border border-[#e9ebed]',
  borderBottom: 'border-b border-[#c6c6c6]',

  // Text
  textPrimary:  'text-[#0d1117]',
  textMuted:    'text-[#545b64]',
  textLink:     'text-[#0073bb]',

  // Interactive
  orange:       '#ff9900',
  blue:         '#0073bb',

  // Input
  input: [
    'w-full px-2.5 py-1.5 text-sm',
    'border border-[#c6c6c6] rounded-sm',
    'bg-white text-[#0d1117]',
    'focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]',
    'hover:border-[#888]',
    'transition-all duration-100',
    'font-[\'Amazon_Ember\',Arial,sans-serif]',
  ].join(' '),

  select: [
    'w-full px-2.5 py-1.5 text-sm',
    'border border-[#c6c6c6] rounded-sm',
    'bg-white text-[#0d1117]',
    'focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]',
    'hover:border-[#888]',
    'transition-all duration-100',
    'cursor-pointer',
    'font-[\'Amazon_Ember\',Arial,sans-serif]',
  ].join(' '),
} as const;

// ─── Shared primitives ────────────────────────────────────────────────────────

const FieldLabel = ({ text, required }: { text: string; required?: boolean }) => (
  <label className="block text-[13px] font-medium text-[#0d1117] mb-1">
    {text}
    {required && <span className="text-[#d13212] ml-0.5">*</span>}
  </label>
);

const FieldHint = ({ text }: { text: string }) => (
  <p className="text-[12px] text-[#545b64] mt-1">{text}</p>
);

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  required?: boolean;
};
const Field = ({ label, hint, required, ...props }: FieldProps) => (
  <div>
    <FieldLabel text={label} required={required} />
    <input {...props} className={aws.input} />
    {hint && <FieldHint text={hint} />}
  </div>
);

type DropProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  required?: boolean;
};
const Drop = ({ label, hint, required, children, ...props }: DropProps) => (
  <div>
    <FieldLabel text={label} required={required} />
    <select {...props} className={aws.select}>
      {children}
    </select>
    {hint && <FieldHint text={hint} />}
  </div>
);

// Buttons
type BtnVariant = 'primary' | 'normal' | 'danger';

const BtnStyles: Record<BtnVariant, string> = {
  primary:
    'bg-[#ff9900] border border-[#c87200] text-[#111] hover:bg-[#e68900] active:bg-[#cc7a00]',
  normal:
    'bg-white border border-[#c6c6c6] text-[#0073bb] hover:bg-[#f8f9f9] hover:border-[#0073bb] active:bg-[#e9ebed]',
  danger:
    'bg-white border border-[#c6c6c6] text-[#d13212] hover:bg-[#fdf3f1] hover:border-[#d13212]',
};

const Btn = ({
  variant = 'normal',
  className = '',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) => (
  <button
    {...props}
    className={[
      'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm text-[13px] font-medium',
      'transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed',
      'focus:outline-none focus:ring-2 focus:ring-[#0073bb] focus:ring-offset-1',
      "font-['Amazon_Ember',Arial,sans-serif]",
      BtnStyles[variant],
      className,
    ].join(' ')}
  >
    {children}
  </button>
);

// Status badge
const StatusBadge = ({ active }: { active: boolean }) =>
  active ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[12px] font-medium bg-[#ebf5ee] text-[#1e8900]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#1e8900] inline-block" />
      Đang dùng
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[12px] font-medium bg-[#f1f1f1] text-[#666]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#999] inline-block" />
      Ẩn
    </span>
  );

// Section container
const Section = ({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="bg-white border border-[#c6c6c6] rounded-sm mb-4">
    <div className="flex items-center justify-between px-4 py-3 bg-[#f8f9f9] border-b border-[#e9ebed]">
      <div>
        <h2 className="text-[14px] font-semibold text-[#0d1117]">{title}</h2>
        {subtitle && <p className="text-[12px] text-[#545b64] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

// Info banner
const InfoBanner = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-2 p-3 mb-4 bg-[#f0f8ff] border border-[#a7d5f2] rounded-sm text-[12px] text-[#0c5577]">
    <span className="mt-0.5 shrink-0">ℹ</span>
    <span>{children}</span>
  </div>
);

// Divider
const Divider = () => <hr className="border-[#e9ebed] my-4" />;

// Empty state
const EmptyState = ({ message }: { message: string }) => (
  <div className="py-10 text-center text-[13px] text-[#545b64]">
    <div className="text-3xl mb-2 opacity-30">☰</div>
    {message}
  </div>
);

// ─── Tab: Farm Config ─────────────────────────────────────────────────────────

function FarmConfigTab({ farmId }: { farmId: string }) {
  const { data: config, isLoading } = useFarmConfig(farmId);
  const updateMutation = useUpdateFarmConfig(farmId);
  const [form, setForm] = useState<Partial<FarmConfig>>({});

  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  const handleSave = async () => {
    if (!config) return;
    try {
      await updateMutation.mutateAsync({
        version:               config.version,
        timezone:              form.timezone,
        locale:                form.locale,
        currency:              form.currency,
        allowCropClone:        form.allowCropClone,
        taskOverdueNotifyDays: form.taskOverdueNotifyDays,
      });
      toast.success('Cập nhật cấu hình thành công');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center gap-2 py-8 text-[13px] text-[#545b64]">
        <span className="animate-spin inline-block w-4 h-4 border-2 border-[#c6c6c6] border-t-[#0073bb] rounded-full" />
        Đang tải cấu hình...
      </div>
    );

  return (
    <>
      <InfoBanner>
        Thay đổi múi giờ hoặc ngôn ngữ sẽ có hiệu lực ngay sau khi lưu. Người dùng khác trong
        farm sẽ thấy giao diện được cập nhật sau lần tải trang tiếp theo.
      </InfoBanner>

      <Section title="Cài đặt khu vực & ngôn ngữ" subtitle="Cấu hình múi giờ, ngôn ngữ hiển thị và đơn vị tiền tệ">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Drop
            label="Múi giờ"
            value={form.timezone ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
            hint="Tất cả thời gian trong hệ thống sẽ hiển thị theo múi giờ này"
          >
            <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
            <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
            <option value="UTC">UTC (GMT+0)</option>
          </Drop>

          <Drop
            label="Ngôn ngữ hiển thị"
            value={form.locale ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, locale: e.target.value }))}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </Drop>

          <Drop
            label="Đơn vị tiền tệ"
            value={form.currency ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
          >
            <option value="VND">VND – Đồng Việt Nam</option>
            <option value="USD">USD – US Dollar</option>
          </Drop>

          <Field
            label="Số ngày cảnh báo quá hạn"
            type="number"
            min={1}
            max={30}
            value={form.taskOverdueNotifyDays ?? ''}
            onChange={(e) =>
              setForm((p) => ({ ...p, taskOverdueNotifyDays: +e.target.value }))
            }
            hint="Hệ thống sẽ gửi cảnh báo trước N ngày khi công việc sắp quá hạn (1–30)"
          />
        </div>
      </Section>

      <Section title="Tùy chọn cây trồng" subtitle="Cấu hình các tính năng liên quan đến quản lý cây trồng">
        <label className="flex items-start gap-3 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={form.allowCropClone ?? false}
            onChange={(e) => setForm((p) => ({ ...p, allowCropClone: e.target.checked }))}
            className="mt-0.5 w-4 h-4 accent-[#0073bb] cursor-pointer"
          />
          <div>
            <p className="text-[13px] font-medium text-[#0d1117] group-hover:text-[#0073bb] transition-colors">
              Cho phép clone cây trồng
            </p>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Người dùng có thể tạo bản sao từ một cây trồng đã có trong hệ thống
            </p>
          </div>
        </label>
      </Section>

      <Divider />

      <div className="flex items-center gap-3">
        <Btn
          variant="primary"
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Btn>
        <Btn variant="normal" onClick={() => config && setForm(config)}>
          Hủy
        </Btn>
      </div>
    </>
  );
}

// ─── Tab: Work Shift ──────────────────────────────────────────────────────────

function WorkShiftTab({ farmId }: { farmId: string }) {
  const { data: shifts = [], isLoading } = useWorkShifts(farmId);
  const createMutation = useCreateWorkShift(farmId);
  const deleteMutation = useDeleteWorkShift(farmId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateWorkShiftRequest>({
    name: '',
    startTime: '',
    endTime: '',
    coefficient: 1.0,
  });

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(form);
      toast.success('Tạo ca làm việc thành công');
      setForm({ name: '', startTime: '', endTime: '', coefficient: 1.0 });
      setShowForm(false);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa ca làm việc này?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Xóa ca làm việc thành công');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <>
      {/* Create form */}
      {showForm && (
        <Section
          title="Thêm ca làm việc mới"
          action={
            <button
              onClick={() => setShowForm(false)}
              className="text-[12px] text-[#0073bb] hover:underline"
            >
              Đóng ✕
            </button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field
              label="Tên ca"
              required
              placeholder="VD: Ca sáng, Ca chiều..."
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            <Field
              label="Hệ số ngày công"
              type="number"
              step="0.01"
              min="0.01"
              max="1"
              hint="Từ 0.01 đến 1.00"
              value={form.coefficient}
              onChange={(e) =>
                setForm((p) => ({ ...p, coefficient: +e.target.value }))
              }
            />
            <Field
              label="Giờ bắt đầu"
              type="time"
              required
              value={form.startTime}
              onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
            />
            <Field
              label="Giờ kết thúc"
              type="time"
              required
              value={form.endTime}
              onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Btn
              variant="primary"
              onClick={handleCreate}
              disabled={createMutation.isPending || shifts.length >= 24}
            >
              {createMutation.isPending ? 'Đang tạo...' : 'Tạo ca làm việc'}
            </Btn>
            <Btn variant="normal" onClick={() => setShowForm(false)}>
              Hủy
            </Btn>
          </div>
        </Section>
      )}

      {/* Table */}
      <Section
        title="Ca làm việc"
        subtitle={`${shifts.length} / 24 ca đã tạo`}
        action={
          !showForm && (
            <Btn
              variant="primary"
              onClick={() => setShowForm(true)}
              disabled={shifts.length >= 24}
            >
              + Thêm ca làm việc
            </Btn>
          )
        }
      >
        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-[13px] text-[#545b64]">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-[#c6c6c6] border-t-[#0073bb] rounded-full" />
            Đang tải...
          </div>
        ) : shifts.length === 0 ? (
          <EmptyState message="Chưa có ca làm việc nào. Nhấn '+ Thêm ca làm việc' để bắt đầu." />
        ) : (
          <div className="overflow-x-auto -mx-4 -mb-4">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#f8f9f9]">
                  {['Tên ca', 'Thời gian', 'Hệ số ngày công', 'Trạng thái', ''].map(
                    (h, i) => (
                      <th
                        key={i}
                        className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#545b64] uppercase tracking-wide border-b border-[#e9ebed] whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {shifts.map((s, idx) => (
                  <tr
                    key={s.id}
                    className={`hover:bg-[#f5f5f5] transition-colors ${
                      idx !== shifts.length - 1 ? 'border-b border-[#e9ebed]' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-[#0d1117]">{s.name}</td>
                    <td className="px-4 py-3 text-[#0d1117] font-mono text-[12px]">
                      {s.startTime} – {s.endTime}
                    </td>
                    <td className="px-4 py-3 text-[#0d1117]">
                      <span className="font-medium">{s.coefficient}</span>
                      <span className="text-[#545b64] ml-1">ngày công</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge active={s.isActive} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Btn
                        variant="danger"
                        onClick={() => handleDelete(s.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Xóa
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </>
  );
}

// ─── Tab: Wage Config ─────────────────────────────────────────────────────────

function WageConfigTab({ farmId }: { farmId: string }) {
  const { data: wages = [], isLoading } = useWageConfigs(farmId);
  const createMutation = useCreateWageConfig(farmId);
  const deleteMutation = useDeleteWageConfig(farmId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateWageConfigRequest>({
    userId: '',
    dailyRate: 0,
    otMultiplier: 1.5,
    effectiveFrom: '',
    effectiveTo: null,
  });

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(form);
      toast.success('Tạo cấu hình lương thành công');
      setForm({
        userId: '',
        dailyRate: 0,
        otMultiplier: 1.5,
        effectiveFrom: '',
        effectiveTo: null,
      });
      setShowForm(false);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa cấu hình lương này?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Xóa cấu hình lương thành công');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <>
      {showForm && (
        <Section
          title="Thêm cấu hình lương mới"
          action={
            <button
              onClick={() => setShowForm(false)}
              className="text-[12px] text-[#0073bb] hover:underline"
            >
              Đóng ✕
            </button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field
              label="User ID nhân viên"
              required
              placeholder="Nhập ID của nhân viên"
              value={form.userId}
              onChange={(e) => setForm((p) => ({ ...p, userId: e.target.value }))}
            />
            <Field
              label="Lương ngày (VND)"
              type="number"
              required
              placeholder="0"
              value={form.dailyRate || ''}
              onChange={(e) => setForm((p) => ({ ...p, dailyRate: +e.target.value }))}
              hint="Đơn vị: VNĐ / ngày công"
            />
            <Field
              label="Hệ số OT"
              type="number"
              step="0.1"
              min="1"
              value={form.otMultiplier}
              onChange={(e) => setForm((p) => ({ ...p, otMultiplier: +e.target.value }))}
              hint="Hệ số nhân lương khi làm thêm giờ (tối thiểu 1.0)"
            />
            <Field
              label="Hiệu lực từ ngày"
              type="date"
              required
              value={form.effectiveFrom}
              onChange={(e) => setForm((p) => ({ ...p, effectiveFrom: e.target.value }))}
            />
            <Field
              label="Hiệu lực đến ngày"
              type="date"
              value={form.effectiveTo ?? ''}
              onChange={(e) =>
                setForm((p) => ({ ...p, effectiveTo: e.target.value || null }))
              }
              hint="Để trống nếu không có ngày kết thúc (vô thời hạn)"
            />
          </div>
          <div className="flex gap-2">
            <Btn
              variant="primary"
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Đang tạo...' : 'Tạo cấu hình lương'}
            </Btn>
            <Btn variant="normal" onClick={() => setShowForm(false)}>
              Hủy
            </Btn>
          </div>
        </Section>
      )}

      <Section
        title="Cấu hình lương nhân viên"
        subtitle={`${wages.length} cấu hình đang hoạt động`}
        action={
          !showForm && (
            <Btn variant="primary" onClick={() => setShowForm(true)}>
              + Thêm cấu hình lương
            </Btn>
          )
        }
      >
        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-[13px] text-[#545b64]">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-[#c6c6c6] border-t-[#0073bb] rounded-full" />
            Đang tải...
          </div>
        ) : wages.length === 0 ? (
          <EmptyState message="Chưa có cấu hình lương nào. Nhấn '+ Thêm cấu hình lương' để bắt đầu." />
        ) : (
          <div className="overflow-x-auto -mx-4 -mb-4">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#f8f9f9]">
                  {[
                    'Nhân viên',
                    'Lương ngày',
                    'Hệ số OT',
                    'Hiệu lực từ',
                    'Hiệu lực đến',
                    '',
                  ].map((h, i) => (
                    <th
                      key={i}
                      className="px-4 py-2.5 text-left text-[12px] font-semibold text-[#545b64] uppercase tracking-wide border-b border-[#e9ebed] whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {wages.map((w, idx) => (
                  <tr
                    key={w.id}
                    className={`hover:bg-[#f5f5f5] transition-colors ${
                      idx !== wages.length - 1 ? 'border-b border-[#e9ebed]' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-[#0073bb]">
                      {w.userFullName}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[#0d1117]">
                      {w.dailyRate.toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="px-4 py-3 text-[#0d1117]">
                      <span className="font-medium">×{w.otMultiplier}</span>
                    </td>
                    <td className="px-4 py-3 text-[#0d1117]">{w.effectiveFrom}</td>
                    <td className="px-4 py-3">
                      {w.effectiveTo ? (
                        <span className="text-[#0d1117]">{w.effectiveTo}</span>
                      ) : (
                        <span className="text-[12px] px-2 py-0.5 bg-[#f0f8ff] text-[#0073bb] border border-[#a7d5f2] rounded-sm">
                          Vô thời hạn
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Btn
                        variant="danger"
                        onClick={() => handleDelete(w.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Xóa
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ConfigPage() {
  const { currentFarmId } = useAuth();
  const [tab, setTab] = useState<Tab>('config');

  if (!currentFarmId) return <Navigate to="/farms" replace />;

  return (
    <div className="min-h-screen bg-[#f2f3f3] font-['Amazon_Ember',Arial,sans-serif]">
      {/* Top navigation bar */}
      <div className="bg-[#232f3e] border-b-2 border-[#ff9900]">
        <div className="max-w-5xl mx-auto px-5 h-11 flex items-center gap-4">
          <span className="text-white text-[15px] font-bold tracking-tight">
            🌿 FarmConsole
          </span>
          <nav className="flex items-center gap-1 text-[#9dadb8] text-[12px]">
            <span className="cursor-pointer hover:text-white transition-colors">Trang chủ</span>
            <span className="mx-1.5 opacity-40">/</span>
            <span className="cursor-pointer hover:text-white transition-colors">Farm Nguyễn</span>
            <span className="mx-1.5 opacity-40">/</span>
            <span className="text-[#c9d2d8]">Cấu hình hệ thống</span>
          </nav>
        </div>
      </div>

      {/* Page header */}
      <div className="bg-white border-b border-[#c6c6c6]">
        <div className="max-w-5xl mx-auto px-5 py-4">
          <h1 className="text-[20px] font-semibold text-[#0d1117]">Cấu hình hệ thống</h1>
          <p className="text-[13px] text-[#545b64] mt-1">
            Quản lý cài đặt farm, ca làm việc và bảng lương
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="bg-white border-b border-[#c6c6c6]">
        <div className="max-w-5xl mx-auto px-5 flex gap-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                'flex items-center gap-2 px-5 py-3 text-[13px] font-medium border-b-2 -mb-px transition-all',
                tab === t.key
                  ? 'border-[#ff9900] text-[#0073bb]'
                  : 'border-transparent text-[#545b64] hover:text-[#0073bb] hover:bg-[#f8f9f9]',
              ].join(' ')}
            >
              <span className="text-[15px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-5 py-5">
        {tab === 'config' && <FarmConfigTab farmId={currentFarmId} />}
        {tab === 'shift'  && <WorkShiftTab  farmId={currentFarmId} />}
        {tab === 'wage'   && <WageConfigTab farmId={currentFarmId} />}
      </div>
    </div>
  );
}