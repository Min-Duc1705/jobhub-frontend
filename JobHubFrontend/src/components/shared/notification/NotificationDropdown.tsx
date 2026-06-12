import { useNavigate } from 'react-router-dom'

export interface INotification {
  id: string
  title: string
  message: string
  isRead: boolean
  time: string
  type: 'view' | 'invite' | 'recommend' | 'default'
}

interface Props {
  notifications: INotification[]
  onMarkAllRead: () => void
  onItemClick: (id: string) => void
  onClose: () => void
}

const getIconConfig = (type: string) => {
  const normType = type.startsWith('hire_agent_passed') ? 'invite' : type
  switch (normType) {
    case 'view':
      return {
        icon: 'visibility',
        bgColor: '#e0f2fe',
        color: '#0369a1'
      }
    case 'invite':
      return {
        icon: 'event_available',
        bgColor: '#e0f2fe',
        color: '#0284c7'
      }
    case 'recommend':
      return {
        icon: 'auto_awesome',
        bgColor: '#f3e8ff',
        color: '#7e22ce'
      }
    default:
      return {
        icon: 'notifications',
        bgColor: '#f1f5f9',
        color: '#64748b'
      }
  }
}

const NotificationDropdown = ({ notifications, onMarkAllRead, onItemClick, onClose }: Props) => {
  const navigate = useNavigate()
  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleViewAll = () => {
    onClose()
    navigate('/candidate/notifications')
  }

  return (
    <div className="ant-dropdown-menu nav-notification-dropdown">
      {/* Header */}
      <div className="nav-notification-dropdown__header">
        <span className="nav-notification-dropdown__title">Thông báo</span>
        {unreadCount > 0 && (
          <button className="nav-notification-dropdown__readall" onClick={onMarkAllRead}>
            Đánh dấu đã đọc
          </button>
        )}
      </div>

      <div className="nav-dropdown-divider" style={{ margin: 0 }} />

      {/* List */}
      <div className="nav-notification-dropdown__list">
        {notifications.length === 0 ? (
          <div className="nav-notification-dropdown__empty">
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#94a3b8' }}>
              notifications_off
            </span>
            <p>Không có thông báo nào</p>
          </div>
        ) : (
          notifications.map(n => {
            const config = getIconConfig(n.type)
            return (
              <div
                key={n.id}
                className={`nav-notification-dropdown__item ${
                  n.isRead ? '' : 'nav-notification-dropdown__item--unread'
                }`}
                onClick={() => onItemClick(n.id)}
              >
                {/* Icon Column */}
                <div
                  className="nav-notification-dropdown__item-icon-wrap"
                  style={{ backgroundColor: config.bgColor, color: config.color }}
                >
                  <span className="material-symbols-outlined">{config.icon}</span>
                </div>

                {/* Content Column */}
                <div className="nav-notification-dropdown__item-body">
                  <div className="nav-notification-dropdown__item-title-row">
                    <span className="nav-notification-dropdown__item-subject">{n.title}</span>
                    {!n.isRead && <span className="nav-notification-dropdown__unread-dot" />}
                  </div>
                  <p className="nav-notification-dropdown__item-message">{n.message}</p>
                  <span className="nav-notification-dropdown__item-time">{n.time}</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="nav-dropdown-divider" style={{ margin: 0 }} />

      {/* Footer */}
      <div className="nav-notification-dropdown__footer" onClick={handleViewAll}>
        Xem tất cả
      </div>
    </div>
  )
}

export default NotificationDropdown
