import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useMembers } from '@/hooks/members/useMembers';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { memberService } from '../../services/members/memberService';
import { type Member, type FarmRole } from '../../types/member';
import { changeRoleSchema } from '../../schemas/memberSchemas'
import { getRoleDisplayName } from '../../utils/roleUtils'

interface ChangeRoleModalProps {
  isOpen: boolean
  onClose: () => void
  member: Member
}

export function ChangeRoleModal({ isOpen, onClose, member }: ChangeRoleModalProps) {
  const { farmId } = useParams<{ farmId: string }>()
  const { changeMemberRole } = useMembers()
  const [roles, setRoles] = useState<FarmRole[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch roles khi modal mở
  useEffect(() => {
    if (!isOpen) return
    const fetchRoles = async () => {
      setIsLoadingRoles(true)
      try {
        const res = await memberService.getFarmRoles()
        if (res.success) {
          // Lọc bỏ OWNER — không cho phép assign role owner
          const assignable = res.data.filter(r => r.name !== 'OWNER')
          setRoles(assignable)
          // Default chọn role hiện tại của member
          const current = assignable.find(r => r.id === member.role?.id)
          setSelectedRoleId(current?.id ?? assignable[0]?.id ?? '')
        }
      } catch {
        toast.error('Không thể tải danh sách vai trò')
      } finally {
        setIsLoadingRoles(false)
      }
    }
    fetchRoles()
  }, [isOpen, member.role?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validation = changeRoleSchema.safeParse({ roleId: selectedRoleId })
    if (!validation.success) {
      toast.error(validation.error.errors[0].message)
      return
    }

    if (!farmId) return

    try {
      setIsSubmitting(true)
      await changeMemberRole(farmId, member.userId, validation.data).unwrap()
      toast.success('Đã thay đổi vai trò thành công')
      onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi thay đổi vai trò')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Thay đổi vai trò</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Thông tin member */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Thành viên</p>
            <p className="font-semibold text-gray-900">{member.fullName}</p>
            <p className="text-sm text-gray-600 mt-2">Vai trò hiện tại</p>
            <p className="font-medium text-gray-900">{getRoleDisplayName(member.role?.name)}</p>
          </div>

          {/* Select role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Vai trò mới
            </label>
            {isLoadingRoles ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tải danh sách vai trò...
              </div>
            ) : (
              <select
                value={selectedRoleId}
                onChange={e => setSelectedRoleId(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {getRoleDisplayName(role.name) || role.description || role.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Thay đổi vai trò sẽ ảnh hưởng đến quyền truy cập của thành viên này
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingRoles || !selectedRoleId}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}