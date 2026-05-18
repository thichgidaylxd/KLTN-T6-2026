import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Upload,
  FileText,
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface SoilAnalysisJob {
  id: string;
  status: 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED';
  result?: string;       // JSON string or text returned by AI
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Upload file to R2, returns public fileUrl */
  onUploadFile: (file: File) => Promise<string>;
  /** Submit analysis job, returns jobId */
  onSubmitAnalysis: (payload: {
    plotId: string;
    farmId: string;
    sampledAt: string;
    fileUrl: string;
  }) => Promise<string>;
  /** Poll job status by jobId */
  onPollJob: (jobId: string) => Promise<SoilAnalysisJob>;
  /** Available plots for selection */
  plots: { id: string; name: string }[];
  farmId: string;
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40; // 2 phút

type Step = 'form' | 'uploading' | 'queued' | 'processing' | 'done' | 'failed';

const inputClass =
  'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all bg-white';
const labelClass = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5';

export const SoilAnalysisModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onUploadFile,
  onSubmitAnalysis,
  onPollJob,
  plots,
  farmId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  const [file, setFile] = useState<File | null>(null);
  const [plotId, setPlotId] = useState('');
  const [sampledAt, setSampledAt] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [step, setStep] = useState<Step>('form');
  const [stepLabel, setStepLabel] = useState('');
  const [job, setJob] = useState<SoilAnalysisJob | null>(null);
  const [resultExpanded, setResultExpanded] = useState(false);

  // Cleanup polling on unmount / close
  useEffect(() => {
    return () => stopPolling();
  }, []);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = useCallback(
    (jobId: string) => {
      pollCountRef.current = 0;
      pollRef.current = setInterval(async () => {
        pollCountRef.current += 1;
        try {
          const updated = await onPollJob(jobId);
          setJob(updated);

          if (updated.status === 'DONE') {
            stopPolling();
            setStep('done');
          } else if (updated.status === 'FAILED') {
            stopPolling();
            setStep('failed');
          } else if (updated.status === 'PROCESSING') {
            setStep('processing');
          }

          if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
            stopPolling();
            setStep('failed');
            setJob((prev) => ({
              ...(prev as SoilAnalysisJob),
              errorMessage: 'Hết thời gian chờ. Vui lòng thử lại.',
            }));
          }
        } catch {
          // ignore transient errors, keep polling
        }
      }, POLL_INTERVAL_MS);
    },
    [onPollJob]
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!plotId) e.plotId = 'Vui lòng chọn lô đất';
    if (!sampledAt) e.sampledAt = 'Vui lòng nhập ngày lấy mẫu';
    if (!file) e.file = 'Vui lòng chọn file PDF';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      // Step 1: Upload file
      setStep('uploading');
      setStepLabel('Đang tải file lên...');
      const fileUrl = await onUploadFile(file!);

      // Step 2: Submit analysis job
      setStepLabel('Đang gửi yêu cầu phân tích...');
      setStep('queued');
      const jobId = await onSubmitAnalysis({ plotId, farmId, sampledAt, fileUrl });
      setJob({ id: jobId, status: 'QUEUED' });

      // Step 3: Start polling
      startPolling(jobId);
    } catch (err: any) {
      stopPolling();
      setStep('failed');
      setJob({ id: '', status: 'FAILED', errorMessage: err?.message ?? 'Có lỗi xảy ra' });
    }
  };

  const handleReset = () => {
    stopPolling();
    setFile(null);
    setPlotId('');
    setSampledAt('');
    setErrors({});
    setStep('form');
    setStepLabel('');
    setJob(null);
    setResultExpanded(false);
    pollCountRef.current = 0;
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  const isProcessing = step === 'uploading' || step === 'queued' || step === 'processing';

  // ── Render result text nicely
  const renderResult = () => {
    if (!job?.result) return null;
    let parsed: any = null;
    try { parsed = JSON.parse(job.result); } catch { /* plain text */ }

    if (parsed && typeof parsed === 'object') {
      return (
        <div className="space-y-2 text-sm">
          {Object.entries(parsed).map(([key, val]) => (
            <div key={key} className="flex gap-2">
              <span className="font-bold text-slate-600 min-w-[120px] shrink-0">{key}:</span>
              <span className="text-slate-700">{String(val)}</span>
            </div>
          ))}
        </div>
      );
    }
    return <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{job.result}</p>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!isProcessing ? handleClose : undefined} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Phân tích đất bằng AI</h2>
              <p className="text-xs text-slate-400 mt-0.5">Upload báo cáo PDF để AI trích xuất dữ liệu</p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="px-6 py-5">
          {/* ── FORM ── */}
          {step === 'form' && (
            <div className="space-y-4">
              {/* Plot select */}
              <div>
                <label className={labelClass}>Lô đất *</label>
                <select
                  value={plotId}
                  onChange={(e) => { setPlotId(e.target.value); setErrors((p) => ({ ...p, plotId: '' })); }}
                  className={inputClass}
                >
                  <option value="">— Chọn lô đất —</option>
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.plotId && <p className="text-xs text-red-500 mt-1">{errors.plotId}</p>}
              </div>

              {/* Ngày lấy mẫu */}
              <div>
                <label className={labelClass}>Ngày lấy mẫu *</label>
                <input
                  type="date"
                  value={sampledAt}
                  onChange={(e) => { setSampledAt(e.target.value); setErrors((p) => ({ ...p, sampledAt: '' })); }}
                  className={inputClass}
                />
                {errors.sampledAt && <p className="text-xs text-red-500 mt-1">{errors.sampledAt}</p>}
              </div>

              {/* File upload */}
              <div>
                <label className={labelClass}>File báo cáo PDF *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] ?? null);
                    setErrors((p) => ({ ...p, file: '' }));
                  }}
                />
                {file ? (
                  <div className="flex items-center gap-3 p-3 bg-violet-50 border border-violet-200 rounded-xl">
                    <FileText size={18} className="text-violet-600 shrink-0" />
                    <span className="text-sm text-violet-700 font-medium truncate flex-1">{file.name}</span>
                    <button onClick={() => setFile(null)} className="text-violet-400 hover:text-violet-600">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-violet-400 hover:text-violet-500 hover:bg-violet-50/50 transition-all"
                  >
                    <Upload size={22} />
                    <span className="text-sm font-medium">Kéo thả hoặc click để chọn PDF</span>
                  </button>
                )}
                {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file}</p>}
              </div>

              {/* Info note */}
              <div className="flex items-start gap-2.5 p-3 bg-violet-50 border border-violet-100 rounded-xl">
                <Sparkles size={14} className="text-violet-500 mt-0.5 shrink-0" />
                <p className="text-xs text-violet-700 leading-relaxed">
                  AI sẽ đọc nội dung báo cáo và tự động trích xuất pH, N, P, K, độ ẩm và các khuyến nghị canh tác.
                </p>
              </div>
            </div>
          )}

          {/* ── PROCESSING ── */}
          {isProcessing && (
            <div className="py-8 flex flex-col items-center text-center gap-4">
              {/* Animated rings */}
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
                <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 border-r-violet-500 border-b-transparent border-l-transparent animate-spin" />
                <div className="absolute inset-3 rounded-full bg-violet-50 flex items-center justify-center">
                  <Sparkles size={20} className="text-violet-500" />
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-800 mb-1">
                  {step === 'uploading' ? 'Đang tải file lên...' :
                   step === 'queued' ? 'Đang chờ xử lý...' :
                   'AI đang phân tích...'}
                </p>
                <p className="text-sm text-slate-400">
                  {step === 'processing'
                    ? 'Quá trình này có thể mất 30–60 giây'
                    : stepLabel || 'Vui lòng chờ...'}
                </p>
              </div>

              {/* Status pills */}
              <div className="flex items-center gap-2 mt-2">
                {(['uploading', 'queued', 'processing'] as Step[]).map((s, i) => {
                  const steps: Step[] = ['uploading', 'queued', 'processing'];
                  const currentIdx = steps.indexOf(step as Step);
                  const isDone = i < currentIdx;
                  const isActive = i === currentIdx;
                  return (
                    <React.Fragment key={s}>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        isActive ? 'bg-violet-100 text-violet-700' :
                        isDone ? 'bg-emerald-50 text-emerald-600' :
                        'bg-slate-50 text-slate-400'
                      }`}>
                        {isDone ? <CheckCircle2 size={11} /> : isActive ? <Loader2 size={11} className="animate-spin" /> : <Clock size={11} />}
                        {s === 'uploading' ? 'Upload' : s === 'queued' ? 'Hàng chờ' : 'Phân tích'}
                      </div>
                      {i < 2 && <div className={`w-4 h-px ${isDone ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── DONE ── */}
          {step === 'done' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-800 text-sm">Phân tích hoàn tất!</p>
                  <p className="text-xs text-emerald-600 mt-0.5">AI đã trích xuất dữ liệu từ báo cáo của bạn</p>
                </div>
              </div>

              {job?.result && (
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setResultExpanded((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <span>Kết quả phân tích</span>
                    {resultExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </button>
                  {resultExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50">
                      {renderResult()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── FAILED ── */}
          {step === 'failed' && (
            <div className="py-4 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <XCircle size={22} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-800 text-sm">Phân tích thất bại</p>
                  <p className="text-xs text-red-600 mt-1 leading-relaxed">
                    {job?.errorMessage ?? 'Có lỗi xảy ra trong quá trình phân tích. Vui lòng thử lại.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          {step === 'form' && (
            <>
              <button
                onClick={handleClose}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all active:scale-95 shadow-md shadow-violet-600/20"
              >
                <Sparkles size={15} />
                Bắt đầu phân tích
              </button>
            </>
          )}

          {(step === 'done' || step === 'failed') && (
            <>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Phân tích mới
              </button>
              <button
                onClick={handleClose}
                className="px-5 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-900 transition-all active:scale-95"
              >
                Đóng
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};