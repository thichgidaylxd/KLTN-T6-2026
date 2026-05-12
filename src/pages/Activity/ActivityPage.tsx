import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// ── Types ──────────────────────────────────────────────────────────────────────
interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  body: string;
  referenceId?: string;
  referenceType?: string;
  isRead: boolean;
  createdAt: string;
}

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

interface LogEntry {
  ts: string;
  level: 'info' | 'success' | 'warn' | 'error' | 'recv';
  msg: string;
}

const TYPE_META: Record<string, { icon: string; color: string }> = {
  TASK_ASSIGNED: { icon: '📋', color: '#22c55e' },
  TASK_CREATED:  { icon: '✨', color: '#3b82f6' },
  TASK_UPDATED:  { icon: '✏️', color: '#f59e0b' },
  TASK_OVERDUE:  { icon: '⚠️', color: '#ef4444' },
  SYSTEM:        { icon: '🔔', color: '#94a3b8' },
};

const STATUS_COLOR: Record<ConnectionStatus, string> = {
  idle:         '#475569',
  connecting:   '#f59e0b',
  connected:    '#22c55e',
  disconnected: '#94a3b8',
  error:        '#ef4444',
};

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  idle:         'IDLE',
  connecting:   'CONNECTING...',
  connected:    'CONNECTED',
  disconnected: 'DISCONNECTED',
  error:        'ERROR',
};

function now() {
  return new Date().toISOString().replace('T', ' ').substring(0, 23);
}

// ══════════════════════════════════════════════════════════════════════════════
export default function ActivityPage() {
  const [wsUrl,     setWsUrl]     = useState('http://localhost:8080/ws');
  const [token,     setToken]     = useState('');
  const [userId,    setUserId]    = useState('');
  const [status,    setStatus]    = useState<ConnectionStatus>('idle');
  const [logs,      setLogs]      = useState<LogEntry[]>([]);
  const [notifs,    setNotifs]    = useState<NotificationPayload[]>([]);
  const [unread,    setUnread]    = useState(0);

  const clientRef  = useRef<Client | null>(null);
  const logEndRef  = useRef<HTMLDivElement>(null);

  // ── Log helper ──────────────────────────────────────────────────────────────
  const log = useCallback((level: LogEntry['level'], msg: string) => {
    setLogs(prev => [...prev.slice(-199), { ts: now(), level, msg }]);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // ── Connect ─────────────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!token.trim() || !userId.trim()) {
      log('warn', 'Token và User ID không được để trống');
      return;
    }

    setStatus('connecting');
    log('info', `Kết nối đến ${wsUrl} …`);

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token.trim()}`,
        'X-Farm-UserId': userId.trim(),
      },
      reconnectDelay: 0,

      onConnect: () => {
        setStatus('connected');
        log('success', 'WebSocket CONNECTED ✓');
        log('info', `Subscribe /user/${userId}/queue/notifications`);

        client.subscribe(
          `/user/${userId}/queue/notifications`,
          (msg) => {
            try {
              const payload: NotificationPayload = JSON.parse(msg.body);
              log('recv', `[${payload.type}] ${payload.title} — ${payload.body}`);
              setNotifs(prev => [payload, ...prev]);
              setUnread(u => u + 1);
            } catch {
              log('error', `Parse error: ${msg.body}`);
            }
          }
        );
      },

      onDisconnect: () => {
        setStatus('disconnected');
        log('warn', 'WebSocket DISCONNECTED');
      },

      onStompError: (frame) => {
        setStatus('error');
        log('error', `STOMP error: ${frame.headers?.message ?? JSON.stringify(frame.headers)}`);
      },

      onWebSocketError: (evt) => {
        setStatus('error');
        log('error', `WebSocket error: ${(evt as any)?.message ?? 'unknown'}`);
      },
    });

    client.activate();
    clientRef.current = client;
  }, [wsUrl, token, userId, log]);

  // ── Disconnect ──────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    clientRef.current?.deactivate();
    clientRef.current = null;
    setStatus('disconnected');
    log('info', 'Đã ngắt kết nối thủ công');
  }, [log]);

  const clearLogs   = () => setLogs([]);
  const clearNotifs = () => { setNotifs([]); setUnread(0); };
  const markAllRead = () => setUnread(0);

  // ── Log color ───────────────────────────────────────────────────────────────
  const levelColor = (l: LogEntry['level']) => ({
    info:    '#64748b',
    success: '#22c55e',
    warn:    '#f59e0b',
    error:   '#ef4444',
    recv:    '#38bdf8',
  }[l]);

  const levelPrefix = (l: LogEntry['level']) => ({
    info:    '  INFO',
    success: '    OK',
    warn:    '  WARN',
    error:   ' ERROR',
    recv:    '  RECV',
  }[l]);

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0e1a',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      color: '#e2e8f0',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        input { background: #0f172a !important; }
        input::placeholder { color: #334155 !important; }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes scan { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
      `}</style>

      {/* ── SCANLINE overlay ── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.03) 2px,rgba(0,0,0,.03) 4px)',
      }} />

      {/* ── HEADER ── */}
      <header style={{
        borderBottom: '1px solid #1e293b',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: '#0d1220',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: STATUS_COLOR[status],
            animation: status === 'connecting' ? 'pulse-dot 1s infinite' : undefined,
            boxShadow: `0 0 8px ${STATUS_COLOR[status]}`,
          }} />
          <span style={{ color: STATUS_COLOR[status], fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>
            {STATUS_LABEL[status]}
          </span>
        </div>

        <div style={{ flex: 1, color: '#334155', fontSize: 11 }}>
          WebSocket Notification Tester · Farm Smart Management
        </div>

        {unread > 0 && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{
              background: '#ef4444', color: '#fff',
              fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 99,
              letterSpacing: 1,
            }}
          >
            {unread} UNREAD
          </motion.div>
        )}

        <div style={{ display: 'flex', gap: 6 }}>
          {[['#ef4444'], ['#f59e0b'], ['#22c55e']].map(([c], i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* ── LEFT: CONFIG + LOGS ── */}
        <div style={{
          width: 560, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          borderRight: '1px solid #1e293b',
        }}>
          {/* Config panel */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', background: '#0d1220' }}>
            <div style={{ fontSize: 10, color: '#475569', letterSpacing: 3, marginBottom: 12, fontWeight: 600 }}>
              ── CONNECTION CONFIG ──────────────────
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'WS_URL', value: wsUrl,   setter: setWsUrl,   ph: 'http://localhost:8080/ws' },
                { label: 'TOKEN',  value: token,    setter: setToken,   ph: 'eyJhbGciOiJIUzUxMiJ9...' },
                { label: 'USERID', value: userId,   setter: setUserId,  ph: 'b67d0077-7f2e-4016-...' },
              ].map(({ label, value, setter, ph }) => (
                <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, width: 52, flexShrink: 0 }}>
                    {label}
                  </span>
                  <span style={{ color: '#334155', fontSize: 10 }}>=</span>
                  <input
                    value={value}
                    onChange={e => setter(e.target.value)}
                    placeholder={ph}
                    disabled={status === 'connected' || status === 'connecting'}
                    style={{
                      flex: 1, border: '1px solid #1e293b', borderRadius: 4,
                      padding: '5px 10px', fontSize: 11, color: '#94a3b8',
                      fontFamily: 'inherit', outline: 'none',
                      opacity: status === 'connected' ? 0.5 : 1,
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={status === 'connected' ? disconnect : connect}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 4, border: 'none',
                  fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', letterSpacing: 1,
                  background: status === 'connected' ? '#1e293b' : '#16a34a',
                  color: status === 'connected' ? '#ef4444' : '#fff',
                  transition: 'all .15s',
                }}
              >
                {status === 'connected' ? '[ DISCONNECT ]' : '[ CONNECT ]'}
              </button>
              <button
                onClick={clearLogs}
                style={{
                  padding: '8px 16px', borderRadius: 4, border: '1px solid #1e293b',
                  fontFamily: 'inherit', fontSize: 11, cursor: 'pointer',
                  background: 'transparent', color: '#475569', letterSpacing: 1,
                }}
              >
                CLEAR
              </button>
            </div>
          </div>

          {/* Log terminal */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              padding: '8px 20px', fontSize: 10, color: '#334155',
              letterSpacing: 2, borderBottom: '1px solid #111827',
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>── EVENT LOG ({logs.length}) ────────────────</span>
              <span style={{ cursor: 'pointer', color: '#475569' }} onClick={clearLogs}>CLR</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              <AnimatePresence initial={false}>
                {logs.map((entry, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{
                      display: 'flex', gap: 8,
                      padding: '2px 20px',
                      fontSize: 11, lineHeight: 1.6,
                    }}
                  >
                    <span style={{ color: '#1e293b', flexShrink: 0, fontSize: 10 }}>
                      {entry.ts.substring(11)}
                    </span>
                    <span style={{ color: levelColor(entry.level), flexShrink: 0, fontWeight: 700, fontSize: 10 }}>
                      {levelPrefix(entry.level)}
                    </span>
                    <span style={{ color: entry.level === 'recv' ? '#7dd3fc' : '#64748b', wordBreak: 'break-all' }}>
                      {entry.msg}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={logEndRef} />

              {logs.length === 0 && (
                <div style={{ padding: '24px 20px', color: '#1e293b', fontSize: 11 }}>
                  _ Chờ sự kiện...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: NOTIFICATIONS ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          <div style={{
            padding: '8px 20px', fontSize: 10, color: '#334155',
            letterSpacing: 2, borderBottom: '1px solid #111827',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#0d1220',
          }}>
            <span>── NOTIFICATIONS ({notifs.length}) ─────────────</span>
            <div style={{ display: 'flex', gap: 12 }}>
              {unread > 0 && (
                <span
                  style={{ cursor: 'pointer', color: '#22c55e', fontSize: 10 }}
                  onClick={markAllRead}
                >
                  MARK ALL READ
                </span>
              )}
              <span
                style={{ cursor: 'pointer', color: '#475569', fontSize: 10 }}
                onClick={clearNotifs}
              >
                CLR
              </span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

            {notifs.length === 0 ? (
              <div style={{
                height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 16,
                color: '#1e293b',
              }}>
                <div style={{ fontSize: 48 }}>📭</div>
                <div style={{ fontSize: 12, letterSpacing: 2 }}>WAITING FOR NOTIFICATIONS</div>
                <div style={{ fontSize: 10, color: '#1e293b' }}>
                  {status !== 'connected'
                    ? '→ Kết nối WebSocket để bắt đầu nhận thông báo'
                    : `→ Đã kết nối. Subscribe /user/${userId}/queue/notifications`}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <AnimatePresence initial={false}>
                  {notifs.map((n, i) => {
                    const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM;
                    const isNew = i < unread;
                    return (
                      <motion.div
                        key={n.id ?? i}
                        initial={{ opacity: 0, y: -12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        style={{
                          border: `1px solid ${isNew ? meta.color + '40' : '#1e293b'}`,
                          borderLeft: `3px solid ${meta.color}`,
                          borderRadius: 4,
                          padding: '12px 14px',
                          background: isNew ? meta.color + '08' : '#0d1220',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Glow on new */}
                        {isNew && (
                          <div style={{
                            position: 'absolute', top: 0, right: 0,
                            width: 6, height: 6, borderRadius: '50%',
                            background: meta.color, margin: 8,
                            boxShadow: `0 0 8px ${meta.color}`,
                          }} />
                        )}

                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <span style={{ fontSize: 18, lineHeight: 1 }}>{meta.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{
                                fontSize: 10, fontWeight: 700, color: meta.color,
                                letterSpacing: 1.5,
                              }}>
                                {n.type}
                              </span>
                              <span style={{ fontSize: 10, color: '#334155' }}>
                                {n.createdAt ? new Date(n.createdAt).toLocaleTimeString('vi-VN') : '—'}
                              </span>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>
                              {n.title}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
                              {n.body}
                            </div>
                            {n.referenceId && (
                              <div style={{ marginTop: 6, fontSize: 10, color: '#334155' }}>
                                ref: {n.referenceType}/{n.referenceId}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Status bar */}
          <div style={{
            borderTop: '1px solid #111827', padding: '6px 20px',
            fontSize: 10, color: '#1e293b', display: 'flex', gap: 24,
            background: '#0d1220',
          }}>
            <span>NOTIFS: {notifs.length}</span>
            <span>UNREAD: {unread}</span>
            <span>LOG: {logs.length}</span>
            <span style={{ marginLeft: 'auto', color: '#1e293b' }}>
              /user/{userId || '?'}/queue/notifications
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}