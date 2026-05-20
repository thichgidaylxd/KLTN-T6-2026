import React from 'react';
import { X, Calendar, MapPin, AlertTriangle, Bug, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DiseaseReportResponse } from '@/types/diseaseReport/diseaseReport';

interface DiseaseReportDetailModalProps {
  report: DiseaseReportResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

// Mapping severity levels to Vietnamese
const severityMap: Record<string, string> = {
  'LOW': 'Thấp',
  'MEDIUM': 'Trung bình',
  'HIGH': 'Cao',
  'CRITICAL': 'Nghiêm trọng'
};

// Mapping report status to Vietnamese
const reportStatusMap: Record<string, string> = {
  'QUEUED': 'Chờ xử lý',
  'IN_PROGRESS': 'Đang xử lý',
  'DONE': 'Đã xử lý',
  'FAILED': 'Thất bại',
  'CANCELLED': 'Đã hủy'
};

// Mapping diagnosis status to Vietnamese
const diagnosisStatusMap: Record<string, string> = {
  'PENDING': 'Chờ xử lý',
  'PROCESSING': 'Đang xử lý',
  'COMPLETED': 'Hoàn thành',
  'FAILED': 'Thất bại'
};

const getSeverityInVietnamese = (severity: string): string => {
  return severityMap[severity] || severity;
};

const getReportStatusInVietnamese = (status: string): string => {
  return reportStatusMap[status] || status;
};

const getDiagnosisStatusInVietnamese = (status: string): string => {
  return diagnosisStatusMap[status] || status;
};

export const DiseaseReportDetailModal: React.FC<DiseaseReportDetailModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !report) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-800">Chi tiết Báo cáo</h2>
                <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-slate-200 text-slate-700">
                  #{report.id.substring(0, 8).toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <Calendar size={14} />
                Được tạo lúc {new Date(report.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: All Text Information */}
              <div className="space-y-6">
                
                {/* Status & Percent (Smaller now) */}
                <div className="flex gap-3">
                  <div className="flex-1 bg-red-50/80 rounded-xl p-3 border border-red-100 flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm border border-red-100">
                      <AlertTriangle size={18} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-[11px] text-red-600/80 font-bold uppercase tracking-wider mb-0.5">Tỉ lệ ảnh hưởng</p>
                      <p className="text-lg font-black text-red-600 leading-none">{report.affectedPercent}%</p>
                    </div>
                  </div>
                  <div className="flex-1 bg-blue-50/80 rounded-xl p-3 border border-blue-100 flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm border border-blue-100">
                      <Bug size={18} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[11px] text-blue-600/80 font-bold uppercase tracking-wider mb-0.5">Trạng thái</p>
                      <p className="text-sm font-bold text-blue-700 leading-none mt-1">
                        {getReportStatusInVietnamese(report.status)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Plot & Crop Info */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MapPin size={14} /> Vị trí & Cây trồng
                  </h3>
                  <div className="bg-slate-50/80 rounded-xl p-4 space-y-4 border border-slate-100">
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">Lô đất</p>
                        <p className="text-sm font-bold text-slate-800">{report.plot?.name || 'N/A'}</p>
                        {report.plot?.status && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Trạng thái: <span className="font-medium text-slate-600">{report.plot.status === 'ACTIVE' ? 'Đang hoạt động' : report.plot.status === 'INACTIVE' ? 'Ngừng hoạt động' : report.plot.status}</span>
                          </p>
                        )}
                      </div>
                      <div className="h-px bg-slate-200 w-full" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">Cây trồng</p>
                        <p className="text-sm font-bold text-slate-800">{report.crop?.name || 'N/A'}</p>
                        {report.crop?.cropType && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {report.crop.cropType.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description & Location Notes */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertTriangle size={14} /> Chi tiết Bệnh hại
                  </h3>
                  <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 space-y-4">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {report.description || 'Không có mô tả chi tiết.'}
                    </p>
                    {report.locationNotes && (
                      <>
                        <div className="h-px bg-slate-200 w-full" />
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-1">Vị trí cụ thể</p>
                          <p className="text-sm text-slate-700">{report.locationNotes}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* AI Diagnosis Info */}
                {(report as any).diagnosisDetails && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Bug size={14} /> Phân tích AI
                    </h3>
                    <div className="bg-purple-50/80 rounded-xl p-4 border border-purple-100 space-y-4">
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">Tên bệnh</p>
                        <p className="text-sm font-bold text-slate-800">{(report as any).diagnosisDetails.diseaseName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">Trạng thái</p>
                        <p className="text-sm font-bold text-slate-800">{getDiagnosisStatusInVietnamese((report as any).diagnosisDetails.status)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-1">Mức độ nghiêm trọng</p>
                          <p className="text-sm font-bold text-slate-800">{getSeverityInVietnamese((report as any).diagnosisDetails.severity)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-1">Độ tin cậy</p>
                          <p className="text-sm font-bold text-slate-800">{((report as any).diagnosisDetails.confidence * 100).toFixed(2)}%</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">Khuyến nghị điều trị</p>
                        <p className="text-sm text-slate-700">{(report as any).diagnosisDetails.treatment}</p>
                      </div>
                      {(report as any).diagnosisDetails.needsExpert && (
                        <div className="bg-orange-100 border border-orange-200 rounded-md p-2">
                          <p className="text-xs font-medium text-orange-700">⚠️ Cần tư vấn chuyên gia</p>
                        </div>
                      )}
                      <div className="text-xs text-slate-500">
                        <p>Mô hình AI: {(report as any).diagnosisDetails.aiModel}</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column: Image */}
              <div className="flex flex-col h-full">
                <div className="flex-1 min-h-[300px]">
                  {report.imageUrl ? (
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-full flex items-center justify-center relative">
                      <img 
                        src={report.imageUrl} 
                        alt="Disease Report" 
                        className="absolute inset-0 w-full h-full object-contain p-2"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 h-full min-h-[300px] flex flex-col items-center justify-center text-slate-400">
                      <ImageIcon size={32} className="mb-3 opacity-50" />
                      <p className="text-sm font-medium">Không có hình ảnh</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
