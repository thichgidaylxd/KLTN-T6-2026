import React, { useState } from 'react';
import { X, Copy, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SeasonPlan } from '@/types/seasonPlan';
import { clonePlanLogic } from '@/utils/seasonPlanUtils';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/DateInput';
import { clonePlanSchema } from '@/schemas/seasonPlanSchemas';

interface ClonePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClone: (newPlan: SeasonPlan) => void;
  plan: SeasonPlan | null;
}

export function ClonePlanModal({
  isOpen,
  onClose,
  onClone,
  plan,
}: ClonePlanModalProps) {
  const [newStartDate, setNewStartDate] = useState('');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  // Set initial name when modal opens
  React.useEffect(() => {
    if (plan && isOpen) {
      setNewName(`Bản sao của ${plan.name}`);
      setNewStartDate(new Date().toISOString().split('T')[0]);
    }
  }, [plan, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = clonePlanSchema.safeParse({
      newName,
      newStartDate,
    });

    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    if (plan) {
      const clonedPlan = clonePlanLogic(plan, validation.data.newName, validation.data.newStartDate);
      onClone(clonedPlan);
      onClose();
    }
  };

  if (!isOpen || !plan) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
        >
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                <Copy size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Nhân bản kế hoạch</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sao chép toàn bộ giai đoạn</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="p-4 text-xs font-bold text-rose-600 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-2">
                <Info size={14} />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Tên kế hoạch mới</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl py-3 px-4 outline-none transition-all font-bold text-slate-700"
              />
            </div>

            <div className="space-y-2">
              <DateInput
                label="Ngày bắt đầu mới"
                value={newStartDate}
                onChange={setNewStartDate}
              />
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 px-1">Tất cả các giai đoạn sẽ tự động lùi theo ngày này</p>
            </div>

            <div className="pt-4 flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="flex-1 py-6 rounded-2xl font-black uppercase tracking-wider text-slate-400 hover:text-slate-600"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="flex-[2] py-6 rounded-2xl font-black uppercase tracking-wider bg-slate-900 text-white shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all border-none"
              >
                Nhân bản ngay
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
