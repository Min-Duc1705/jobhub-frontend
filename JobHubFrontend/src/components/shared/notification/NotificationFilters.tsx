import React from 'react'

export type FilterCategory = 'all' | 'view' | 'invite' | 'recommend' | 'default'

interface NotificationFiltersProps {
  activeCategory: FilterCategory
  onChangeCategory: (category: FilterCategory) => void
  unreadCounts: Record<FilterCategory, number>
}

const NotificationFilters = ({
  activeCategory,
  onChangeCategory,
  unreadCounts
}: NotificationFiltersProps) => {
  const tabs: { key: FilterCategory; label: string; icon?: string; isAi?: boolean }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'view', label: 'Ứng tuyển' },
    { key: 'invite', label: 'Phỏng vấn' },
    { key: 'recommend', label: 'Gợi ý AI', icon: 'auto_awesome', isAi: true },
    { key: 'default', label: 'Hệ thống' },
  ]

  return (
    <div className="notification-filters">
      {tabs.map(tab => {
        const isActive = activeCategory === tab.key
        const count = unreadCounts[tab.key]
        
        let tabClass = 'filter-tab'
        if (isActive) tabClass += ' filter-tab--active'
        if (tab.isAi) tabClass += ' filter-tab--ai'

        return (
          <button
            key={tab.key}
            className={tabClass}
            onClick={() => onChangeCategory(tab.key)}
          >
            {tab.icon && (
              <span className="material-symbols-outlined tab-icon">{tab.icon}</span>
            )}
            <span className="tab-label">{tab.label}</span>
            {count > 0 && (
              <span className="tab-badge">{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default NotificationFilters
