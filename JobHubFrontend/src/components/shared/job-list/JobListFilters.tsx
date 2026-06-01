import { Button } from 'antd'
import type { JobType, JobLevel } from '../../../types/job'
import { JOB_LEVEL_LABEL, JOB_TYPE_LABEL } from '../../../types/job'

interface Props {
  tempTypes: JobType[]
  tempLevels: JobLevel[]
  toggleType: (t: JobType) => void
  toggleLevel: (l: JobLevel) => void
  onApply: () => void
  onClear: () => void
}

const JobListFilters = ({
  tempTypes,
  tempLevels,
  toggleType,
  toggleLevel,
  onApply,
  onClear,
}: Props) => {
  return (
    <aside className="sidebar-filters">
      <div className="filters-header">
        <h2 className="filters-title">Bộ lọc</h2>
        <button className="btn-clear-all" onClick={onClear}>
          Xoá tất cả
        </button>
      </div>

      {/* Job Type */}
      <div className="filter-category">
        <h3 className="category-title">Loại hình</h3>
        <div className="checkbox-group">
          {(['FULL_TIME', 'PART_TIME', 'REMOTE', 'HYBRID', 'INTERNSHIP'] as JobType[]).map(t => (
            <label key={t} className="custom-checkbox">
              <input
                type="checkbox"
                checked={tempTypes.includes(t)}
                onChange={() => toggleType(t)}
              />
              <span>{JOB_TYPE_LABEL[t]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Level */}
      <div className="filter-category border-top">
        <h3 className="category-title">Cấp độ</h3>
        <div className="checkbox-group">
          {(['INTERN', 'FRESHER', 'JUNIOR', 'MIDDLE', 'SENIOR', 'LEADER', 'MANAGER'] as JobLevel[]).map(l => (
            <label key={l} className="custom-checkbox">
              <input
                type="checkbox"
                checked={tempLevels.includes(l)}
                onChange={() => toggleLevel(l)}
              />
              <span>{JOB_LEVEL_LABEL[l]}</span>
            </label>
          ))}
        </div>
      </div>

      <Button className="btn-apply-filters" onClick={onApply}>
        Áp dụng bộ lọc
      </Button>
    </aside>
  )
}

export default JobListFilters
