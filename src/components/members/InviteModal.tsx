import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useMembers } from '@/hooks/members/useMembers';
import { X, UserPlus, Mail, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { cn } from '../../utils/cn';
import { memberService } from '../../services/members/memberService';
import { inviteMemberSchema } from '../../schemas/memberSchemas'

interface FarmRole {
  id: string
  name: string
  description: string
}

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
}

export function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const { farmId } = useParams<{ farmId: string }>()
  const { inviteMember } = useMembers()
  const [email, setEmail] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roles, setRoles] = useState<FarmRole[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)

  useEffect(() => {
    if (!isOpen) return
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true)
        const res = await memberService.getFarmRoles()
        if (res.success) {
          // Lọc bỏ OWNER — không được mời trực tiếp thành OWNER
          const filtered = res.data.filter((r: FarmRole) => r.name !== 'OWNER')
          setRoles(filtered)
          if (filtered.length > 0) setSelectedRoleId(filtered[0].id)
        }
      } catch {
        toast.error('Không thể tải danh sách vai trò')
      } finally {
        setLoadingRoles(false)
      }
    }
    fetchRoles()
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = inviteMemberSchema.safeParse({ email, roleId: selectedRoleId })
    if (!validation.success) {
      toast.error(validation.error.errors[0].message)
      return
    }

    if (!farmId) { toast.error('Không tìm thấy thông tin trang trại'); return }

    try {
      setIsSubmitting(true)
      await inviteMember(farmId, validation.data).unwrap()
      toast.success('Đã gửi lời mời đến ' + email)
      handleClose()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi lời mời')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setSelectedRoleId(roles[0]?.id ?? '')
    setIsSubmitting(false)
    onClose()
  }

  const getRoleIcon = (name: string) => {
    if (name === 'MANAGER') return <UserPlus className="w-3.5 h-3.5 text-gray-800" />
    return <Users className="w-3.5 h-3.5 text-gray-800" />
  }

  const getRoleLabel = (name: string) => {
    const map: Record<string, string> = {
      MANAGER: 'Quản lý',
      WORKER: 'Nhân công',
    }
    return map[name] ?? name
  }

  const getRoleDesc = (name: string) => {
    const map: Record<string, string> = {
      MANAGER: 'Quản lý lô đất, kho và phân công nhân sự',
      WORKER: 'Chỉ xem và thực hiện phần được giao',
    }
    return map[name] ?? ''
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden border border-gray-200 shadow-sm">

        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-200">
          <UserPlus className="w-4 h-4 text-gray-800" />
          <span className="text-sm font-medium text-gray-900">Mời thành viên mới</span>
          <button
            onClick={handleClose}
            className="ml-auto p-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">

          {/* Email */}
          <div>
            <label htmlFor="email" className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1.5">
              <Mail className="w-3 h-3" />
              Địa chỉ email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-50 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all border-gray-200"
              placeholder="email@gmail.com"
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-[11px] text-gray-500 mb-1.5 block">Vai trò</label>

            {loadingRoles ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {roles.map(role => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all duration-200",
                      selectedRoleId === role.id
                        ? "border-gray-900 bg-gray-50 shadow-sm opacity-100"
                        : "border-gray-200 bg-white hover:border-gray-300 opacity-40 hover:opacity-100"
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {getRoleIcon(role.name)}
                      <span className="text-xs font-medium text-gray-900">
                        {getRoleLabel(role.name)}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-snug">
                      {getRoleDesc(role.name)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loadingRoles}
              className="flex-[2] py-2 text-xs border border-gray-900 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Đang mời...</span></>
              ) : 'Gửi lời mời'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}