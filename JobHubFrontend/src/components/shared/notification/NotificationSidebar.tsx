import React from 'react'

interface NotificationSidebarProps {
  activeTab: 'feed' | 'settings' | 'archived'
  onChangeTab: (tab: 'feed' | 'settings' | 'archived') => void
  onViewMatchesClick: () => void
  aiMatchCount?: number
}

const NotificationSidebar = ({
  activeTab,
  onChangeTab,
  onViewMatchesClick,
  aiMatchCount = 4
}: NotificationSidebarProps) => {
  return (
    <aside className="notification-sidebar">
      <div className="sidebar-group">
        <h2 className="sidebar-group-title">Quản lý</h2>
        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${activeTab === 'feed' ? 'sidebar-nav-item--active' : ''}`}
            onClick={() => onChangeTab('feed')}
          >
            <span className="material-symbols-outlined nav-icon">notifications</span>
            <span className="nav-text">Tất cả thông báo</span>
          </button>
          
          <button
            className={`sidebar-nav-item ${activeTab === 'settings' ? 'sidebar-nav-item--active' : ''}`}
            onClick={() => onChangeTab('settings')}
          >
            <span className="material-symbols-outlined nav-icon">settings</span>
            <span className="nav-text font-body">Cài đặt</span>
          </button>
          
          <button
            className={`sidebar-nav-item ${activeTab === 'archived' ? 'sidebar-nav-item--active' : ''}`}
            onClick={() => onChangeTab('archived')}
          >
            <span className="material-symbols-outlined nav-icon">archive</span>
            <span className="nav-text">Đã lưu trữ</span>
          </button>
        </nav>
      </div>

      <div className="ai-insights-card">
        <div className="ai-insights-bg-decor">
          <span className="material-symbols-outlined decor-icon">auto_awesome</span>
        </div>
        
        <h3 className="ai-insights-title">
          <span className="material-symbols-outlined title-icon">temp_preferences_custom</span>
          AI Insights
        </h3>
        
        <p className="ai-insights-desc">
          {aiMatchCount > 0 
            ? `Có ${aiMatchCount} cơ hội việc làm độ tương thích cao mới được phát hiện.` 
            : 'Hệ thống AI đang phân tích các tin tuyển dụng mới phù hợp với bạn.'}
        </p>
        
        <button className="ai-insights-btn" onClick={onViewMatchesClick}>
          Xem gợi ý AI
        </button>
      </div>
    </aside>
  )
}

export default NotificationSidebar
