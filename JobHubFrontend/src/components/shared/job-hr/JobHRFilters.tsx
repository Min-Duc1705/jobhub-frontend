import React from 'react'
import type { JobLevel } from '../../../types/job'
import { JOB_LEVEL_LABEL } from '../../../types/job'

interface JobHRFiltersProps {
  search: string
  setSearch: (search: string) => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  levelFilter: string
  setLevelFilter: (level: string) => void
  setPage: (page: number) => void
}

const JobHRFilters: React.FC<JobHRFiltersProps> = ({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  levelFilter,
  setLevelFilter,
  setPage,
}) => {
  return (
    <div className="hr-filter-bar">
      <div className="filter-search-wrap" style={{ gridColumn: 'span 2' }}>
        <span className="material-symbols-outlined">search</span>
        <input
          placeholder="Tìm kiếm tên công việc..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>
      <div className="filter-select-wrap">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">Tất cả Trạng thái</option>
          <option value="PUBLISHED">Đang tuyển</option>
          <option value="DRAFT">Bản nháp</option>
          <option value="CLOSED">Đã đóng</option>
          <option value="SUSPENDED">Bị khoá</option>
        </select>
        <span className="material-symbols-outlined">expand_more</span>
      </div>
      <div className="filter-select-wrap">
        <select value={levelFilter} onChange={e => { setLevelFilter(e.target.value); setPage(1) }}>
          <option value="">Tất cả Cấp độ</option>
          {(Object.keys(JOB_LEVEL_LABEL) as JobLevel[]).map(l => (
            <option key={l} value={l}>{JOB_LEVEL_LABEL[l]}</option>
          ))}
        </select>
        <span className="material-symbols-outlined">expand_more</span>
      </div>
    </div>
  )
}

export default JobHRFilters
