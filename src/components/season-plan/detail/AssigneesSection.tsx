import { useMemo, useState } from 'react';
import { ChevronDown, Loader2, Trash2, UserPlus, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { TaskAssignee } from '@/types/taskAssignee';
import { Member } from '@/types/member';

interface AssigneesSectionProps {
  assignees: TaskAssignee[];
  loading: boolean;
  adding: boolean;
  canEdit: boolean;
  members: Member[];
  selectedUserId: string;
  onUserChange: (id: string) => void;
  onAdd: () => void;
  onDelete: (assigneeId: string) => void;
}

export function AssigneesSection({
  assignees,
  loading,
  adding,
  canEdit,
  members,
  selectedUserId,
  onUserChange,
  onAdd,
  onDelete,
}: AssigneesSectionProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const assignedUserIds = new Set(assignees.filter((a) => !a.removedAt).map((a) => a.user.id));
  const selectableMembers = members.filter((m) => !assignedUserIds.has(m.userId));
  const selectedMember = useMemo(
    () => members.find((m) => m.userId === selectedUserId),
    [members, selectedUserId]
  );

  return (
    <div className="px-4 py-3 border-t border-slate-100">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
        <Users size={11} /> Thành viên thực hiện
      </p>

      {canEdit && (
        <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsSelecting((prev) => !prev)}
              disabled={selectableMembers.length === 0}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-700 disabled:opacity-50"
            >
              <ChevronDown size={14} className={`transition-transform ${isSelecting ? 'rotate-180' : ''}`} />
              {isSelecting ? 'Đóng danh sách thành viên' : 'Thêm thành viên'}
            </button>
            {selectedMember && (
              <span className="text-[11px] text-slate-500">
                Vai trò: <b>{selectedMember.role?.name || selectedMember.role?.description || 'N/A'}</b>
              </span>
            )}
          </div>
          {isSelecting && (
            <div className="space-y-2">
              <select
                value={selectedUserId}
                onChange={(e) => onUserChange(e.target.value)}
                className="w-full text-[12px] bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 transition-all"
              >
                <option value="">Chọn thành viên...</option>
                {selectableMembers.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.fullName || member.email}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  disabled={adding || !selectedUserId}
                  onClick={() => {
                    onAdd();
                    setIsSelecting(false);
                  }}
                  className="px-4 bg-indigo-600 text-white rounded-lg text-[12px] font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {adding ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  Giao
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <Loader2 size={24} className="animate-spin mb-2" />
          <p className="text-[12px]">Đang tải người thực hiện...</p>
        </div>
      ) : assignees.length > 0 ? (
        <div className="space-y-2">
          {assignees
            .filter((a) => !a.removedAt)
            .map((assignee) => (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                key={assignee.id}
                className="group p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-100 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-bold text-slate-800 truncate">{assignee.user.fullName || assignee.user.email}</h4>
                    <div className="text-[11px] text-slate-500 truncate">{assignee.user.email}</div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => onDelete(assignee.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-600 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-[12px] text-slate-500 font-medium">Chưa có thành viên nào được giao việc</p>
        </div>
      )}
    </div>
  );
}
