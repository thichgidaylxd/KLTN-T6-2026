import { Phase, SeasonPlan } from '../types/seasonPlan';
const DRAFT_STATUS = { id: '00000000-0000-0000-0000-000000000000', code: 'DRAFT', name: 'Bản nháp', color: '#94a3b8' };


/**
 * Thêm số ngày vào một chuỗi ngày (YYYY-MM-DD)
 */
export const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};



/**
 * Kiểm tra xem hai khoảng thời gian có bị chồng lấn không
 */
export const isOverlapping = (start1: string, end1: string, start2: string, end2: string): boolean => {
  return (start1 >= start2 && start1 < end2) ||
         (end1 > start2 && end1 <= end2) ||
         (start1 <= start2 && end1 >= end2);
};

/**
 * Kiểm tra lỗi chồng lấn cho một lô đất
 * Hỗ trợ kiến trúc đa lô đất: Kiểm tra xem plotId mục tiêu có nằm trong 
 * danh sách plots của các kế hoạch hiện có hay không.
 */
export const hasPlanOverlap = (
  plotId: string, 
  startDate: string, 
  endDate: string, 
  existingPlans: SeasonPlan[],
  excludePlanId?: string
): boolean => {
  return existingPlans.some(p => {
    // Nếu kế hoạch cũ có mảng plots, kiểm tra xem plotId có trong đó không
    const hasPlot = p.plots 
      ? p.plots.some(pp => pp.plotId === plotId)
      : (p as any).plotId === plotId; // Fallback cho dữ liệu cũ nếu cần

    return hasPlot && 
      p.id !== excludePlanId &&
      p.status !== 'CANCELLED' && 
      isOverlapping(startDate, endDate, p.startDate, p.endDate);
  });
};

/**
 * Đồng bộ toàn bộ các giai đoạn khi một giai đoạn thay đổi (thời lượng hoặc ngày bắt đầu)
 */
export const rippleUpdatePhases = (
  phases: Phase[], 
  changedIndex: number, 
  updates: { newDuration?: number, newStartDate?: string }
): Phase[] => {
  const newPhases = [...phases];
  const { newDuration, newStartDate } = updates;

  const updateTasks = (phase: Phase, oldStart: string): Phase => {
    if (!phase.tasks || phase.tasks.length === 0) return phase;
    
    const oldStartDate = new Date(oldStart).getTime();
    const newStartDate = new Date(phase.startDate).getTime();
    const offsetDays = Math.round((newStartDate - oldStartDate) / (1000 * 60 * 60 * 24));
    
    if (offsetDays === 0) return phase;

    return {
      ...phase,
      tasks: phase.tasks.map(task => ({
        ...task,
        startDate: addDays(task.startDate, offsetDays),
        endDate: addDays(task.endDate, offsetDays)
      }))
    };
  };

  // 1. Cập nhật cho giai đoạn bị thay đổi trực tiếp
  const targetPhase = newPhases[changedIndex];
  const oldStart = targetPhase.startDate;
  
  if (newStartDate !== undefined) {
    targetPhase.startDate = newStartDate;
    targetPhase.endDate = addDays(newStartDate, targetPhase.duration);
  }
  
  if (newDuration !== undefined) {
    targetPhase.duration = newDuration;
    targetPhase.endDate = addDays(targetPhase.startDate, newDuration);
  }
  
  newPhases[changedIndex] = updateTasks(targetPhase, oldStart);

  // 2. Cập nhật tất cả các giai đoạn phía sau để chúng nối tiếp nhau
  for (let i = changedIndex + 1; i < newPhases.length; i++) {
    const currentOldStart = newPhases[i].startDate;
    const prevPhase = newPhases[i - 1];
    
    newPhases[i] = {
      ...newPhases[i],
      startDate: prevPhase.endDate,
      endDate: addDays(prevPhase.endDate, newPhases[i].duration)
    };
    
    newPhases[i] = updateTasks(newPhases[i], currentOldStart);
  }

  return newPhases;
};

/**
 * Tính toán lại ngày bắt đầu/kết thúc của toàn bộ kế hoạch dựa trên các giai đoạn
 */
export const syncPlanDatesWithPhases = (plan: SeasonPlan): SeasonPlan => {
  if (plan.phases.length === 0) return plan;
  
  const startDate = plan.phases[0].startDate;
  const endDate = plan.phases[plan.phases.length - 1].endDate;
  
  return {
    ...plan,
    startDate,
    endDate
  };
};

/**
 * Kiểm tra quyền thao tác dựa trên Role (PB11)
 * Owner/Admin: được chỉnh sửa kế hoạch; Manager/Employee: chỉ xem
 */
export const canEditPlan = (role: string | undefined | null, token?: string | null): boolean => {
  // 1. Kiểm tra dựa trên Role đã qua xử lý (từ parseRole)
  if (role) {
    const r = role.toLowerCase();
    if (r === 'owner' || r === 'admin') return true;
    if (r === 'manager' || r === 'employee' || r === 'user') return false;
  }

  // 2. Kiểm tra sâu trong Token (nếu có)
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const perms: string[] = payload.perms || payload.permissions || [];
      const rawRoles = payload.roles || payload.authorities || payload.role || [];
      
      const upperRoles = (Array.isArray(rawRoles) ? rawRoles : [rawRoles]).map(r => String(r).toUpperCase());

      // Ưu tiên 1: Hệ thống Admin luôn có quyền
      if (upperRoles.includes('ROLE_ADMIN') || upperRoles.includes('ADMIN')) return true;

      // Ưu tiên 2: Quyền dựa trên permissions thực tế (ABAC)
      // Nếu có quyền mời thành viên hoặc xóa farm -> Chắc chắn là Owner -> Được sửa
      if (perms.includes('member:invite') || perms.includes('farm:delete')) return true;

      // Nếu có quyền tạo plan nhưng KHÔNG có quyền mời thành viên -> Manager -> Chỉ xem
      if (perms.includes('plan:create')) return false;

      // Ưu tiên 3: Role cứng
      if (upperRoles.includes('ROLE_OWNER') || upperRoles.includes('OWNER')) return true;

      return false;
    } catch {
      return false;
    }
  }

  return false;
};

export const canDeletePlan = (role: string | undefined, status: string): boolean => {
  if (!canEditPlan(role)) return false;
  // PB11: Cho phép xóa/hủy kể cả khi đang thực hiện (có xác nhận)
  return status !== 'COMPLETED' && status !== 'CANCELLED';
};

/**
 * Nhân bản kế hoạch với ngày bắt đầu mới và sao chép toàn bộ nhiệm vụ
 */
export const clonePlanLogic = (plan: SeasonPlan, newName: string, newStartDate: string): SeasonPlan => {
  const newPlanId = `plan-clone-${Date.now()}`;
  const newPhases: Phase[] = [];
  let currentDate = newStartDate;

  plan.phases.forEach((phase, index) => {
    const duration = phase.duration;
    const endDate = addDays(currentDate, duration);
    
    // Sao chép và cập nhật ngày cho các tasks
    const oldStartDate = new Date(phase.startDate).getTime();
    const nStart = new Date(currentDate).getTime();
    const offsetDays = Math.round((nStart - oldStartDate) / (1000 * 60 * 60 * 24));

    const newPhaseId = `phase-${Date.now()}-${index}`;

    newPhases.push({
      ...phase,
      id: newPhaseId,
      planId: newPlanId,
      startDate: currentDate,
      endDate: endDate,
      status: DRAFT_STATUS,
      tasks: phase.tasks.map(task => ({
        ...task,
        id: `task-${Date.now()}-${Math.random()}`,
        planStageId: newPhaseId,
        startDate: addDays(task.startDate, offsetDays),
        endDate: addDays(task.endDate, offsetDays),
        status: DRAFT_STATUS
      }))
    });
    currentDate = endDate;
  });

  return {
    ...plan,
    id: newPlanId,
    name: newName,
    startDate: newStartDate,
    endDate: currentDate,
    status: DRAFT_STATUS,
    phases: newPhases
  };
};
