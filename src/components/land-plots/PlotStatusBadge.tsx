import { PlotStatus } from '@/types/plot'

interface PlotStatusBadgeProps {
  status: PlotStatus | string
}

export function PlotStatusBadge({ status }: PlotStatusBadgeProps) {
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#e8f5e9] text-[#2e7d32]">
        Đang hoạt động
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#ffebee] text-[#c62828]">
      Ngưng hoạt động
    </span>
  )
}
