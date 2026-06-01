import { Input, Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { ApplicationStatus } from '../../../types/application'

export type MatchScoreFilter = '' | '90' | '80' | '70' | '60'
export type SortByFilter     = 'createdDate' | 'status' | 'scoreDesc' | 'scoreAsc'

interface Props {
  search:          string
  statusFilter:    ApplicationStatus | ''
  matchScore:      MatchScoreFilter
  sortBy:          SortByFilter
  onSearchChange:  (v: string) => void
  onStatusChange:  (v: ApplicationStatus | '') => void
  onMatchChange:   (v: MatchScoreFilter) => void
  onSortChange:    (v: SortByFilter) => void
  onReset:         () => void
}

const STATUS_OPTIONS = [
  { label: 'Tất cả trạng thái', value: ''          },
  { label: 'Chờ xử lý',        value: 'PENDING'    },
  { label: 'Đang xem xét',     value: 'REVIEWING'  },
  { label: 'Đã duyệt',         value: 'APPROVED'   },
  { label: 'Đã từ chối',       value: 'REJECTED'   },
]

const MATCH_OPTIONS = [
  { label: 'Tất cả điểm',  value: ''   },
  { label: '90%+',         value: '90' },
  { label: '80%+',         value: '80' },
  { label: '70%+',         value: '70' },
  { label: '60%+',         value: '60' },
]

const SORT_OPTIONS = [
  { label: 'Mới nhất trước',  value: 'createdDate' },
  { label: 'Theo trạng thái', value: 'status'      },
  { label: 'Điểm giảm dần',   value: 'scoreDesc'   },
  { label: 'Điểm tăng dần',   value: 'scoreAsc'    },
]

/** Thanh filter: tìm kiếm + match score + trạng thái + sắp xếp + reset */
const ApplicationFilterBar = ({
  search, statusFilter, matchScore, sortBy,
  onSearchChange, onStatusChange, onMatchChange, onSortChange, onReset,
}: Props) => (
  <div className="jap-filter-bar">

    {/* Search */}
    <div>
      <span className="jap-filter-label">Tìm ứng viên</span>
      <Input
        prefix={<SearchOutlined style={{ color: '#747783' }} />}
        placeholder="Tên, email, kỹ năng..."
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        allowClear
        style={{ borderRadius: 8 }}
      />
    </div>

    {/* Match Score */}
    <div>
      <span className="jap-filter-label">Match Score</span>
      <Select
        value={matchScore}
        onChange={onMatchChange}
        options={MATCH_OPTIONS}
        style={{ width: '100%' }}
      />
    </div>

    {/* Status */}
    <div>
      <span className="jap-filter-label">Trạng thái</span>
      <Select
        value={statusFilter}
        onChange={onStatusChange}
        options={STATUS_OPTIONS}
        style={{ width: '100%' }}
      />
    </div>

    {/* Sort By */}
    <div>
      <span className="jap-filter-label">Sắp xếp</span>
      <Select
        value={sortBy}
        onChange={onSortChange}
        options={SORT_OPTIONS}
        style={{ width: '100%' }}
      />
    </div>

    {/* Reset */}
    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
      <button
        className="jap-filter-reset-btn"
        onClick={onReset}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 17 }}>filter_list_off</span>
        Đặt lại
      </button>
    </div>
  </div>
)

export default ApplicationFilterBar
