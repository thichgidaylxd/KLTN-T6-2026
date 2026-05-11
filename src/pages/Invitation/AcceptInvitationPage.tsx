import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff, Sprout } from 'lucide-react'
import { toast } from 'sonner'
import { loginSchema } from '../../schemas/authSchemas'
import { useDispatch } from 'react-redux'
import { loginSuccess } from '../../store/authSlice'
import { authService } from '../../services/auth/authService'
import { farmInvitationService } from '../../services/farm/farmInvitationService'
import { extractErrorMessage } from '../../utils/errorUtils'
import { useQueryClient, useMutation } from '@tanstack/react-query'

type Phase = 'loading' | 'login-required' | 'accepting' | 'success' | 'error'

interface InvitationInfo {
    farmName: string
    inviterName: string
    role: string
    email: string
    expiresAt: string
}

const ROLE_LABEL: Record<string, string> = {
    MANAGER: 'Quản lý',
    WORKER: 'Nhân công',
}

export function AcceptInvitationPage() {
    const { invitationId } = useParams<{ invitationId: string }>()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const queryClient = useQueryClient()

    const [phase, setPhase] = useState<Phase>('loading')
    const [invitation, setInvitation] = useState<InvitationInfo | null>(null)
    const [errorMsg, setErrorMsg] = useState('')

    // Login form
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loginError, setLoginError] = useState('')
    const [isLoggingIn, setIsLoggingIn] = useState(false)
    const hasAcceptedRef = useRef(false)

    // Accept invitation mutation — invalidates all queries on success
    const acceptMutation = useMutation({
        mutationFn: (id: string) => farmInvitationService.acceptInvitation(id),
        onSuccess: () => {
            queryClient.invalidateQueries()
        },
        onError: (err: unknown) => {
            console.error('[AcceptInvitationPage] Error accepting invitation:', err)
        }
    })

    // Bước 1 — fetch thông tin invitation (public, không cần auth)
    useEffect(() => {
        let isMounted = true;

        const fetchAndAccept = async () => {
            try {
                const preview = await farmInvitationService.getInvitationPreview(invitationId as string)
                if (!isMounted) return;
                
                setInvitation(preview)
                setEmail(preview.email)

                // Kiểm tra đã login chưa
                const token = sessionStorage.getItem('accessToken')
                if (token) {
                    if (hasAcceptedRef.current) return;
                    hasAcceptedRef.current = true;
                    
                    setPhase('accepting')
                    try {
                        await acceptMutation.mutateAsync(invitationId as string)
                        if (!isMounted) return;
                        setPhase('success')
                        toast.success('Đã chấp nhận lời mời thành công')
                        setTimeout(() => navigate('/farms'), 3000)
                    } catch (err: unknown) {
                        if (!isMounted) return;
                        setErrorMsg(extractErrorMessage(err))
                        setPhase('error')
                    }
                } else {
                    setPhase('login-required')
                }
            } catch (err: unknown) {
                if (!isMounted) return;
                setErrorMsg(extractErrorMessage(err))
                setPhase('error')
            }
        }

        void fetchAndAccept()

        return () => {
            isMounted = false;
        }
    }, [invitationId, navigate]); // Removed acceptMutation from dependencies to be safe

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoginError('')

        const validation = loginSchema.safeParse({ email, password })
        if (!validation.success) {
            setLoginError(validation.error.errors[0].message)
            return
        }

        try {
            setIsLoggingIn(true)
            const response = await authService.login({ email, password })

            if (response.success && response.data.accessToken) {
                // Dispatch vào Redux — giống hệt useLogin hook
                dispatch(loginSuccess(response.data))
                // Sau khi store có auth → accept invitation
                if (hasAcceptedRef.current) return;
                hasAcceptedRef.current = true;

                setPhase('accepting')
                try {
                    await acceptMutation.mutateAsync(invitationId as string)
                    setPhase('success')
                    toast.success('Đã chấp nhận lời mời thành công')
                    setTimeout(() => navigate('/farms'), 3000)
                } catch (err: unknown) {
                    setErrorMsg(extractErrorMessage(err))
                    setPhase('error')
                    hasAcceptedRef.current = false;
                }
            } else {
                setLoginError('Email hoặc mật khẩu không đúng')
            }
        } catch (err: unknown) {
            setLoginError(extractErrorMessage(err))
        } finally {
            setIsLoggingIn(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#f5f4f0] flex flex-col items-center justify-center p-4 font-['DM_Sans',sans-serif]">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@500;600&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }
        .fade-up { animation: fadeUp .45s ease both; }
        .fade-up-2 { animation: fadeUp .45s .1s ease both; }
        .fade-up-3 { animation: fadeUp .45s .2s ease both; }

        input:focus { outline: none; }
        .field {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #e2e0da;
          border-radius: 10px;
          background: #faf9f7;
          font-size: 14px;
          color: #1a1a18;
          transition: border-color .2s, box-shadow .2s;
          font-family: 'DM Sans', sans-serif;
        }
        .field:focus {
          border-color: #3d6b4f;
          box-shadow: 0 0 0 3px rgba(61,107,79,.08);
        }
        .field.err { border-color: #d04a4a; background: #fdf5f5; }
        .btn-primary {
          width: 100%;
          padding: 12px;
          background: #1c2b1e;
          color: #f5f4f0;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background .2s, transform .1s;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: .01em;
        }
        .btn-primary:hover:not(:disabled) { background: #2d4430; }
        .btn-primary:active:not(:disabled) { transform: scale(.985); }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
      `}</style>

            {/* Logo */}
            <div className="fade-up flex items-center gap-2 mb-8">
                <div className="w-8 h-8 bg-[#1c2b1e] rounded-lg flex items-center justify-center">
                    <Sprout className="w-4 h-4 text-[#a8d4b0]" />
                </div>
                <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, fontSize: 18, color: '#1c2b1e', letterSpacing: '-.01em' }}>
                    FarmSmart
                </span>
            </div>

            {/* Card */}
            <div className="fade-up-2 w-full max-w-[400px] bg-white rounded-2xl border border-[#e8e6e0] shadow-sm overflow-hidden">

                {/* ── LOADING ── */}
                {phase === 'loading' && (
                    <div className="p-10 flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-2 border-[#e2e0da] border-t-[#3d6b4f] rounded-full"
                            style={{ animation: 'spin-slow 1s linear infinite' }} />
                        <p className="text-sm text-[#6b6b60]">Đang tải thông tin lời mời...</p>
                    </div>
                )}

                {/* ── LOGIN REQUIRED ── */}
                {phase === 'login-required' && invitation && (
                    <>
                        {/* Invitation banner */}
                        <div className="px-6 pt-6 pb-5 border-b border-[#f0ede6]">
                            <p className="text-[11px] font-medium text-[#3d6b4f] uppercase tracking-widest mb-3">
                                Lời mời tham gia
                            </p>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-[#eaf2ec] rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Sprout className="w-5 h-5 text-[#3d6b4f]" />
                                </div>
                                <div>
                                    <p className="text-base font-semibold text-[#1a1a18]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                        {invitation.farmName}
                                    </p>
                                    <p className="text-[12px] text-[#8a8a7a] mt-0.5">
                                        {invitation.inviterName} mời bạn với vai trò{' '}
                                        <span className="font-medium text-[#3d6b4f]">
                                            {ROLE_LABEL[invitation.role] ?? invitation.role}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Login form */}
                        <form onSubmit={handleLogin} className="px-6 py-5 flex flex-col gap-4">
                            <div>
                                <p className="text-[13px] font-medium text-[#1a1a18] mb-1">Đăng nhập để tiếp tục</p>
                                <p className="text-[12px] text-[#8a8a7a]">
                                    Sau khi đăng nhập, bạn sẽ được thêm vào trang trại tự động.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div>
                                    <label className="text-[11px] text-[#6b6b60] mb-1.5 block">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className={`field ${loginError ? 'err' : ''}`}
                                        placeholder="email@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] text-[#6b6b60] mb-1.5 block">Mật khẩu</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => { setPassword(e.target.value); setLoginError('') }}
                                            className={`field pr-10 ${loginError ? 'err' : ''}`}
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a090] hover:text-[#5a5a50] transition-colors"
                                        >
                                            {showPassword
                                                ? <EyeOff className="w-4 h-4" />
                                                : <Eye className="w-4 h-4" />
                                            }
                                        </button>
                                    </div>
                                    {loginError && (
                                        <p className="mt-1.5 text-[11px] text-[#d04a4a]">{loginError}</p>
                                    )}
                                </div>
                            </div>

                            <button type="submit" disabled={isLoggingIn} className="btn-primary">
                                {isLoggingIn
                                    ? <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Đang đăng nhập...
                                    </span>
                                    : 'Đăng nhập và chấp nhận lời mời'
                                }
                            </button>

                            <p className="text-center text-[11px] text-[#a0a090]">
                                Bằng cách đăng nhập, bạn đồng ý tham gia trang trại này
                            </p>
                        </form>
                    </>
                )}

                {/* ── ACCEPTING ── */}
                {phase === 'accepting' && (
                    <div className="p-10 flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-2 border-[#e2e0da] border-t-[#3d6b4f] rounded-full"
                            style={{ animation: 'spin-slow 1s linear infinite' }} />
                        <div className="text-center">
                            <p className="text-sm font-medium text-[#1a1a18]">Đang xử lý...</p>
                            <p className="text-[12px] text-[#8a8a7a] mt-1">Đang thêm bạn vào trang trại</p>
                        </div>
                    </div>
                )}

                {/* ── SUCCESS ── */}
                {phase === 'success' && invitation && (
                    <div className="p-10 flex flex-col items-center gap-4 text-center">
                        <div className="w-14 h-14 bg-[#eaf2ec] rounded-2xl flex items-center justify-center">
                            <CheckCircle2 className="w-7 h-7 text-[#3d6b4f]" />
                        </div>
                        <div>
                            <p className="text-base font-semibold text-[#1a1a18]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Chào mừng đến {invitation.farmName}!
                            </p>
                            <p className="text-[12px] text-[#8a8a7a] mt-1">
                                Bạn đã tham gia với vai trò <span className="font-medium text-[#3d6b4f]">{ROLE_LABEL[invitation.role] ?? invitation.role}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#a0a090]">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Đang chuyển hướng...
                        </div>
                    </div>
                )}

                {/* ── ERROR ── */}
                {phase === 'error' && (
                    <div className="p-10 flex flex-col items-center gap-4 text-center">
                        <div className="w-14 h-14 bg-[#fdf0f0] rounded-2xl flex items-center justify-center">
                            <XCircle className="w-7 h-7 text-[#d04a4a]" />
                        </div>
                        <div>
                            <p className="text-base font-semibold text-[#1a1a18]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Không thể chấp nhận
                            </p>
                            <p className="text-[12px] text-[#8a8a7a] mt-1 max-w-[240px]">{errorMsg}</p>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="text-[12px] font-medium text-[#3d6b4f] hover:underline"
                        >
                            Về trang chủ
                        </button>
                    </div>
                )}
            </div>

            {/* Footer */}
            <p className="fade-up-3 mt-6 text-[11px] text-[#b0ae a4]" style={{ color: '#b0aea4' }}>
                © 2026 FarmSmart. Nền tảng quản lý nông trại thông minh.
            </p>
        </div>
    )
}
