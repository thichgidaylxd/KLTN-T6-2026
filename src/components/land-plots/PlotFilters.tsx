import { SearchIcon, FilterIcon, LayoutGridIcon, ListIcon } from 'lucide-react'

interface PlotFiltersProps {
  viewMode: 'table' | 'card'
  onViewModeChange: (mode: 'table' | 'card') => void
  searchTerm: string
  onSearchChange: (term: string) => void
  statusFilter: string | 'all'
  onStatusFilterChange: (status: string | 'all') => void
}

export function PlotFilters({
  viewMode,
  onViewModeChange,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: PlotFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white px-5 py-4 border-b border-slate-200">
      <div className="flex flex-1 items-center gap-4 w-full sm:w-auto">
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên lô..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100 transition-all text-slate-700"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) =>
              onStatusFilterChange(e.target.value)
            }
            className="appearance-none pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100 transition-all text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Ngưng hoạt động</option>
          </select>
          <FilterIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="flex items-center gap-1 border border-slate-200 p-0.5 rounded-lg bg-white">
        <button
          onClick={() => onViewModeChange('table')}
          className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          title="Xem dạng bảng"
        >
          <ListIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewModeChange('card')}
          className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          title="Xem dạng thẻ"
        >
          <LayoutGridIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
