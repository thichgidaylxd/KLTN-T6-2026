import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, Leaf, ChevronRight, RotateCcw, Wheat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskSuggestions } from '@/hooks/ai/useGemini';
import { useAiChat } from '@/hooks/ai/useAiChat';

interface SuggestTask {
  title: string;
  description: string;
  category: string;
  priority: 'Cao' | 'Trung bình' | 'Thấp' | string;
}

interface ChatMessage {
  role: 'user' | 'ai';
  title?: string;
  description?: string;
  text?: string;
}

const PriorityBadge = ({ priority }: { priority: string }) => {
  const map: Record<string, string> = {
    Cao: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200',
    'Trung bình': 'bg-amber-50 text-amber-600 ring-1 ring-amber-200',
    Thấp: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200',
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${map[priority] ?? 'bg-gray-100 text-gray-500'}`}>
      {priority}
    </span>
  );
};

const ContextBadge = ({ cropType, stage }: { cropType: string; stage: string }) => {
  if (!cropType && !stage) return null;
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-lg">
      <Wheat size={11} className="text-emerald-500 shrink-0" />
      <span className="text-[11px] font-medium text-emerald-700 truncate max-w-[150px]">
        {[cropType, stage].filter(Boolean).join(' · ')}
      </span>
    </div>
  );
};

export default function AiAssistantPage() {
  const [cropType, setCropType] = useState('');
  const [stage, setStage] = useState('');
  const [committed, setCommitted] = useState({ cropType: '', stage: '' });
  const [hasRequested, setHasRequested] = useState(false);

  const { data: suggestData, isLoading: suggestLoading, refetch, isFetching } = useTaskSuggestions(
    committed.cropType,
    committed.stage
  );

  const handleSuggest = async () => {
    if (!cropType.trim() || !stage.trim()) return;
    setCommitted({ cropType: cropType.trim(), stage: stage.trim() });
    setHasRequested(true);
    await refetch();
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { mutate, isPending } = useAiChat();

  const sendMessage = () => {
    const text = input.trim();
    if (!text || isPending) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    mutate(
      { message: text, cropType: committed.cropType, stage: committed.stage },
      {
        onSuccess: (res: any) => {
          const data = res?.data;
          if (Array.isArray(data)) {
            data.forEach((item: any) =>
              setMessages((prev) => [...prev, { role: 'ai', title: item.title, description: item.description }])
            );
          } else if (typeof data === 'string') {
            setMessages((prev) => [...prev, { role: 'ai', text: data }]);
          }
        },
      }
    );
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  const isLoading = suggestLoading || isFetching;
  const hasContextDrift = (cropType || stage) && (cropType !== committed.cropType || stage !== committed.stage);

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: '100dvh', fontFamily: "'DM Sans', sans-serif", background: '#f9fafb' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        * { box-sizing: border-box; }
        .sa { overflow-y: auto; scrollbar-width: thin; scrollbar-color: #e5e7eb transparent; }
        .sa::-webkit-scrollbar { width: 3px; }
        .sa::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
        .dot { animation: db 1.2s ease-in-out infinite; }
        .dot:nth-child(2) { animation-delay:.2s }
        .dot:nth-child(3) { animation-delay:.4s }
        @keyframes db { 0%,80%,100%{transform:scale(.7);opacity:.4} 40%{transform:scale(1);opacity:1} }
      `}</style>

      {/* ── TOP BAR ── */}
      <header className="shrink-0 bg-white border-b border-gray-100 px-4 py-2.5 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg,#16a34a,#2563eb)' }}
        >
          <Leaf size={16} color="white" />
        </div>
        <div className="shrink-0">
          <span className="text-sm font-bold text-gray-900">Farmer AI</span>
        </div>

        {/* Context inputs */}
        <div className="flex-1 flex items-center gap-2 justify-end">
          <input
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSuggest()}
            placeholder="Cây trồng..."
            className="w-32 sm:w-40 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 transition-all"
            style={{ fontFamily: 'inherit' }}
          />
          <input
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSuggest()}
            placeholder="Giai đoạn..."
            className="w-36 sm:w-44 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 transition-all"
            style={{ fontFamily: 'inherit' }}
          />
          <button
            onClick={handleSuggest}
            disabled={!cropType.trim() || !stage.trim() || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}
          >
            <Sparkles size={12} />
            <span className="hidden sm:inline">{isLoading ? 'Phân tích...' : 'Gợi ý AI'}</span>
            <span className="sm:hidden">AI</span>
          </button>
        </div>
      </header>

      {/* ── MAIN SPLIT ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* LEFT: SUGGESTIONS */}
        <div className="flex flex-col lg:w-[400px] xl:w-[440px] shrink-0 border-r border-gray-100 bg-white overflow-hidden"
          style={{ height: 'calc(50dvh - 42px)', width: 'auto' }}
        >
          <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-emerald-500" />
              <span className="text-xs font-semibold text-gray-600">Gợi ý công việc</span>
            </div>
            <ContextBadge cropType={committed.cropType} stage={committed.stage} />
          </div>

          <div className="flex-1 sa p-3 space-y-2">
            {!hasRequested && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                  <Leaf size={18} className="text-gray-200" />
                </div>
                <p className="text-xs text-gray-400 font-medium">Nhập cây trồng & giai đoạn</p>
                <p className="text-[11px] text-gray-300 mt-1">rồi bấm "Gợi ý AI"</p>
              </div>
            )}

            {isLoading && (
              <div className="space-y-2 pt-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-gray-100 animate-pulse">
                    <div className="h-3 bg-gray-100 rounded w-3/5 mb-2" />
                    <div className="h-2.5 bg-gray-50 rounded w-full mb-1.5" />
                    <div className="h-2.5 bg-gray-50 rounded w-4/5" />
                  </div>
                ))}
              </div>
            )}

            <AnimatePresence>
              {!isLoading && hasRequested && suggestData?.map((task: SuggestTask, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3.5 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-gray-800 leading-snug">{task.title}</span>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-2">{task.description}</p>
                  <div className="flex items-center gap-1 text-[11px] text-gray-300">
                    <ChevronRight size={10} />{task.category}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {!isLoading && hasRequested && (!suggestData || suggestData.length === 0) && (
              <p className="text-center text-xs text-gray-400 py-8">Không có gợi ý. Thử thay đổi thông tin.</p>
            )}
          </div>
        </div>

        {/* RIGHT: CHAT */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">

          {/* Chat header */}
          <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Bot size={13} className="text-blue-500" />
              <span className="text-xs font-semibold text-gray-600">Chat AI</span>
              <ContextBadge cropType={committed.cropType} stage={committed.stage} />
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                <RotateCcw size={11} /> Xoá
              </button>
            )}
          </div>

          {/* Context drift banner */}
          <AnimatePresence>
            {hasContextDrift && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="shrink-0 overflow-hidden"
              >
                <button
                  onClick={() => setCommitted({ cropType: cropType.trim(), stage: stage.trim() })}
                  className="w-full py-2 px-4 bg-emerald-50 border-b border-emerald-100 text-xs text-emerald-700 font-medium hover:bg-emerald-100 transition-colors text-left flex items-center gap-1.5"
                >
                  <Sparkles size={11} />
                  Áp dụng ngữ cảnh "{cropType}{stage ? ' · ' + stage : ''}" vào chat →
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div className="flex-1 sa px-4 py-3 space-y-3">
            {messages.length === 0 && !isPending && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
                  <Bot size={20} className="text-blue-300" />
                </div>
                <p className="text-sm text-gray-400 font-medium">Hỏi bất kỳ điều gì</p>
                <p className="text-[11px] text-gray-300 mt-1 mb-5">Về cây trồng, sâu bệnh, kỹ thuật...</p>
                <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                  {['Triệu chứng đạo ôn là gì?', 'Khi nào bón phân kali?', 'Cách phòng rầy nâu?', 'Lịch tưới nước tối ưu'].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-500 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'user' ? (
                    <div
                      className="max-w-[72%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm text-white leading-relaxed"
                      style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}
                    >
                      {msg.text}
                    </div>
                  ) : (
                    <div className="max-w-[78%] px-4 py-3 bg-gray-50 rounded-2xl rounded-tl-sm border border-gray-100">
                      {msg.title && <p className="text-sm font-semibold text-gray-800 mb-1">{msg.title}</p>}
                      <p className="text-xs text-gray-600 leading-relaxed">{msg.description ?? msg.text}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isPending && (
              <div className="flex justify-start">
                <div className="px-4 py-3 bg-gray-50 rounded-2xl rounded-tl-sm border border-gray-100 flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="dot w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                  ))}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input bar */}
          <div className="shrink-0 px-4 py-3 border-t border-gray-50 bg-white">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={committed.cropType ? `Hỏi về ${committed.cropType}...` : 'Nhập câu hỏi, Enter để gửi...'}
                disabled={isPending}
                className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-300"
                style={{ fontFamily: 'inherit' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isPending}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all disabled:opacity-30 shrink-0"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}