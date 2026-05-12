export interface WorkSession {
  id: string;
  taskId: string;
  taskName: string;
  employeeId: string;
  employeeName: string;
  checkedInAt: string;
  checkedOutAt: string | null;
  checkInNote: string | null;
  checkOutNote: string | null;
  forceReason: string | null;
  forceClosedAt: string | null;
  forceClosedBy: string | null;
  checkedOutAtOriginal: string | null;
  adjustReason: string | null;
  adjustedAt: string | null;
  adjustedBy: string | null;
  workLogId: string | null;
  createdAt: string;
  open: boolean;
  forceClose: boolean;
}
