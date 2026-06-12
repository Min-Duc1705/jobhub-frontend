import React from 'react'
import type { INotification } from './NotificationDropdown'

interface NotificationItemCardProps {
  notification: INotification
  onMarkRead: (id: string) => void
  onArchive: (id: string) => void
  onActionClick?: (id: string, actionType: 'accept' | 'reschedule') => void
  onCardClick?: (id: string) => void
  isArchivedView?: boolean
}

const getIconConfig = (type: string) => {
  const normType = type.startsWith('hire_agent_passed') ? 'invite' : type
  switch (normType) {
    case 'view':
      return {
        icon: 'work',
        class: 'icon-view'
      }
    case 'invite':
      return {
        icon: 'calendar_today',
        class: 'icon-invite'
      }
    case 'recommend':
      return {
        icon: 'auto_awesome',
        class: 'icon-recommend'
      }
    default:
      return {
        icon: 'info',
        class: 'icon-default'
      }
  }
}

const NotificationItemCard = ({
  notification,
  onMarkRead,
  onArchive,
  onActionClick,
  onCardClick,
  isArchivedView = false
}: NotificationItemCardProps) => {
  const { id, title, message, isRead, time, type } = notification
  const iconConfig = getIconConfig(type)

  let cardClass = 'notification-card'
  if (isRead) {
    cardClass += ' notification-card--read'
  }
  if (type === 'recommend' && !isRead) {
    cardClass += ' notification-card--premium'
  }
  if (onCardClick) {
    cardClass += ' notification-card--clickable'
  }

  return (
    <div
      className={cardClass}
      onClick={() => onCardClick?.(id)}
      style={{ cursor: onCardClick ? 'pointer' : 'default' }}
    >
      {/* Icon Box */}
      <div className={`card-icon-box ${iconConfig.class}`}>
        <span className="material-symbols-outlined card-icon">
          {iconConfig.icon}
        </span>
      </div>

      {/* Content Box */}
      <div className="card-content-box">
        <div className="card-title-row">
          <h3 className="card-title">{title}</h3>
          {!isRead && (
            <span className="card-unread-dot" />
          )}
          {type === 'recommend' && !isRead && (
            <span className="card-premium-badge">98% Match</span>
          )}
        </div>
        
        <p className="card-message">{message}</p>

        {/* Action Buttons for Interviews */}
        {type === 'invite' && !isRead && onActionClick && (
          <div className="card-action-row">
            <button
              className="action-btn action-btn--primary"
              onClick={(e) => { e.stopPropagation(); onActionClick(id, 'accept'); }}
            >
              Chấp nhận lời mời
            </button>
            <button
              className="action-btn action-btn--outline"
              onClick={(e) => { e.stopPropagation(); onActionClick(id, 'reschedule'); }}
            >
              Đổi lịch hẹn
            </button>
          </div>
        )}

        {/* Timestamp */}
        <div className="card-timestamp">
          <span className="material-symbols-outlined time-icon">schedule</span>
          <span>{time}</span>
        </div>
      </div>

      {/* Actions (Top Right Corner) */}
      <div className="card-actions-overlay">
        {!isRead && (
          <button
            className="action-icon-btn"
            onClick={(e) => { e.stopPropagation(); onMarkRead(id); }}
            title="Đánh dấu đã đọc"
          >
            <span className="material-symbols-outlined">check_circle</span>
          </button>
        )}
        
        {!isArchivedView && (
          <button
            className="action-icon-btn"
            onClick={(e) => { e.stopPropagation(); onArchive(id); }}
            title="Lưu trữ"
          >
            <span className="material-symbols-outlined">archive</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default NotificationItemCard
