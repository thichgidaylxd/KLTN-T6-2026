import React from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle2, Clock, Info, MailOpen, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/notifications/useNotifications';
import { cn } from '@/utils/cn';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    isLoading, 
    unreadCount, 
    markAllAsRead, 
    isMarkingRead 
  } = useNotifications(0, 50);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED': return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'PLAN_UPDATE': return <Clock className="text-amber-500" size={18} />;
      default: return <Info className="text-indigo-500" size={18} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/farms')}
              className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm text-slate-400 hover:text-indigo-600 group"
              title="Quay lại Quản lý trang trại"
            >
              <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Bell className="text-indigo-600" size={32} />
                Thông báo
              </h1>
              <p className="text-slate-500 font-medium">
                Bạn có <span className="text-indigo-600 font-bold">{unreadCount}</span> thông báo chưa đọc
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => markAllAsRead()}
              disabled={isMarkingRead || unreadCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm disabled:opacity-50"
            >
              <MailOpen size={16} />
              Đánh dấu tất cả đã đọc
            </button>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Đang tải thông báo...</p>
          </div>
        ) : !notifications?.content || notifications.content.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 p-12 text-center space-y-4 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <Bell className="text-slate-200" size={40} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Hộp thư trống</h3>
              <p className="text-slate-500">Bạn hiện không có thông báo nào mới.</p>
            </div>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {notifications.content.map((notify) => (
              <motion.div
                key={notify.id}
                variants={itemVariants}
                className={cn(
                  "group relative bg-white border rounded-2xl p-4 transition-all hover:shadow-md",
                  notify.isRead ? "border-slate-100 opacity-75" : "border-indigo-100 bg-indigo-50/10"
                )}
              >
                {!notify.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-l-2xl" />
                )}
                
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    notify.isRead ? "bg-slate-50" : "bg-white shadow-sm border border-indigo-50"
                  )}>
                    {getIcon(notify.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={cn(
                        "text-sm font-bold truncate",
                        notify.isRead ? "text-slate-600" : "text-slate-900"
                      )}>
                        {notify.title}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">
                        {new Date(notify.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs leading-relaxed",
                      notify.isRead ? "text-slate-400" : "text-slate-600"
                    )}>
                      {notify.body}
                    </p>
                  </div>

                  {/* Removed delete button as per request */}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};
