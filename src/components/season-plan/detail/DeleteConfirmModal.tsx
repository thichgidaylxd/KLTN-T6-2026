import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message
}: DeleteConfirmModalProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: .96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: .96 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100"
          >
            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 mb-4">
              <Trash2 size={22} />
            </div>
            <h3 className="text-[15px] font-bold text-slate-900 mb-1.5">
              {title}
            </h3>
            <p className="text-[12px] text-slate-500 mb-5 leading-relaxed">
              {message}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onConfirm}
                className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl text-[12px] font-bold hover:bg-rose-600 transition-all"
              >
                Xác nhận xóa
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-[12px] font-bold hover:bg-slate-200 transition-all"
              >
                Hủy bỏ
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
