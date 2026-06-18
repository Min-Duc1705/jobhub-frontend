import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Switch, Button, Spin } from 'antd'
import { useAppSelector } from '../../../redux/hooks'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { message } from '../../../utils/antd'
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi
} from '../../../services/notification-service'

import NotificationSidebar from '../../../components/shared/notification/NotificationSidebar'
import NotificationFilters from '../../../components/shared/notification/NotificationFilters'
import type { FilterCategory } from '../../../components/shared/notification/NotificationFilters'
import NotificationItemCard from '../../../components/shared/notification/NotificationItemCard'
import type { INotification } from '../../../components/shared/notification/NotificationDropdown'

import './NotificationList.scss'

const timeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Vừa xong'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} ngày trước`
  const months = Math.floor(days / 30)
  return `${months} tháng trước`
}

const PAGE_SIZE = 5

const NotificationList = () => {
  const navigate = useNavigate()
  const { user } = useAppSelector((state: any) => state.auth)
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'feed' | 'settings' | 'archived'>('feed')
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Notification states
  const [notifications, setNotifications] = useState<INotification[]>([])
  const [archivedNotifications, setArchivedNotifications] = useState<INotification[]>([])
  const [loading, setLoading] = useState(true)

  // Settings states
  const [settings, setSettings] = useState({
    emailAppUpdates: true,
    emailJobRecs: true,
    emailInterviews: true,
    pushActivity: true,
    pushNewJobs: true
  })

  // 1. Fetch notifications on mount
  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await getNotificationsApi()
      if (res && res.data) {
        const formatted = res.data.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          time: timeAgo(n.createdDate),
          type: n.type
        }))
        setNotifications(formatted)
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
      message.error('Lỗi khi tải danh sách thông báo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Load archived notifications & settings from localStorage
    const savedArchived = localStorage.getItem('jobhub_archived_notifications')
    if (savedArchived) {
      try {
        setArchivedNotifications(JSON.parse(savedArchived))
      } catch (e) {
        console.warn('Error parsing archived notifications', e)
      }
    }

    const savedSettings = localStorage.getItem('jobhub_notification_settings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.warn('Error parsing notification settings', e)
      }
    }
  }, [])

  // 2. Setup SignalR Realtime connection
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const socketUrl = import.meta.env.VITE_NOTIFICATION_SOCKET_URL || 'http://localhost:5008'
    const connection = new HubConnectionBuilder()
      .withUrl(`${socketUrl}/ws/notifications`, {
        accessTokenFactory: () => token || ''
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build()

    connection.on('ReceiveNotification', (newNotif: any) => {
      const formatted: INotification = {
        id: newNotif.id,
        title: newNotif.title,
        message: newNotif.message,
        isRead: newNotif.isRead,
        time: 'Vừa xong',
        type: newNotif.type
      }
      setNotifications(prev => [formatted, ...prev])
    })

    connection.start()
      .then(() => console.log('SignalR connected on NotificationList page'))
      .catch(err => console.error('SignalR NotificationList page connection error:', err))

    return () => {
      connection.stop()
        .then(() => console.log('SignalR disconnected from NotificationList page'))
        .catch(err => console.error('SignalR stop error on NotificationList page:', err))
    }
  }, [])

  // Reset pagination when category changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeCategory, activeTab])

  // Listen to notification sync events from Header or other triggers
  useEffect(() => {
    const handleSync = () => {
      fetchNotifications()
    }
    window.addEventListener('notification-updated', handleSync)
    return () => {
      window.removeEventListener('notification-updated', handleSync)
    }
  }, [])

  // Count unread notifications by category
  const unreadCounts = useMemo(() => {
    const counts: Record<FilterCategory, number> = {
      all: 0,
      view: 0,
      invite: 0,
      recommend: 0,
      default: 0
    }
    
    notifications.forEach(n => {
      if (!n.isRead) {
        counts.all++
        let cat: FilterCategory = 'default'
        if (n.type === 'view') cat = 'view'
        else if (n.type === 'invite' || n.type.startsWith('hire_agent_passed')) cat = 'invite'
        else if (n.type === 'recommend') cat = 'recommend'
        counts[cat]++
      }
    })
    
    return counts
  }, [notifications])

  // Filter notifications for active category (in Main feed)
  const filteredNotifications = useMemo(() => {
    if (activeCategory === 'all') return notifications
    return notifications.filter(n => {
      if (activeCategory === 'invite') return n.type === 'invite' || n.type.startsWith('hire_agent_passed')
      return n.type === activeCategory
    })
  }, [notifications, activeCategory])

  // Slice notifications for pagination (Main feed)
  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return filteredNotifications.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredNotifications, currentPage])

  // Slice archived notifications for pagination
  const paginatedArchived = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return archivedNotifications.slice(startIndex, startIndex + PAGE_SIZE)
  }, [archivedNotifications, currentPage])

  // Handlers
  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationReadApi(id)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      )
      message.success('Đã đánh dấu là đã đọc.')
      window.dispatchEvent(new Event('notification-updated'))
    } catch (err) {
      console.error('Error marking notification as read:', err)
      message.error('Lỗi khi cập nhật trạng thái thông báo.')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadApi()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      message.success('Đã đánh dấu đã đọc tất cả thông báo.')
      window.dispatchEvent(new Event('notification-updated'))
    } catch (err) {
      console.error('Error marking all notifications read:', err)
      message.error('Thao tác thất bại.')
    }
  }


  const handleArchive = (id: string) => {
    const target = notifications.find(n => n.id === id)
    if (!target) return

    // Move to archived state
    const nextArchived = [target, ...archivedNotifications]
    setArchivedNotifications(nextArchived)
    localStorage.setItem('jobhub_archived_notifications', JSON.stringify(nextArchived))

    // Remove from active state
    setNotifications(prev => prev.filter(n => n.id !== id))
    message.success('Đã lưu trữ thông báo.')
    window.dispatchEvent(new Event('notification-updated'))
  }

  const handleActionClick = (id: string, actionType: 'accept' | 'reschedule') => {
    if (actionType === 'accept') {
      message.success('Chấp nhận lời mời phỏng vấn thành công! Nhà tuyển dụng sẽ được thông báo.')
    } else {
      message.info('Vui lòng liên hệ trực tiếp với Nhà tuyển dụng qua Chat để thương lượng lịch hẹn mới.')
    }
    // Automatically mark read
    handleMarkRead(id)
  }

  const handleCardClick = async (notif: INotification) => {
    if (!notif.isRead) {
      await handleMarkRead(notif.id)
    }
    if (notif.type.startsWith('hire_agent_passed')) {
      const parts = notif.type.split(':')
      const campaignId = parts[1]
      const candidateId = parts[2]
      navigate(`/hr/hire-agent?campaignId=${campaignId}&candidateId=${candidateId}`)
    } else if (notif.type === 'view') {
      navigate('/candidate/profile')
    } else if (notif.type === 'invite') {
      const isHR = user?.role?.name === 'HR'
      if (isHR) {
        navigate('/hr/jobs')
      } else {
        navigate('/candidate/applied-jobs')
      }
    } else if (notif.type === 'recommend') {
      navigate('/jobs')
    }
  }

  const handleSaveSettings = () => {
    localStorage.setItem('jobhub_notification_settings', JSON.stringify(settings))
    message.success('Cập nhật cài đặt thông báo thành công!')
  }

  const handleViewMatchesClick = () => {
    setActiveTab('feed')
    setActiveCategory('recommend')
  }

  // Count AI Matches
  const aiMatchCount = notifications.filter(n => n.type === 'recommend').length

  return (
    <main className="notification-page">
      <div className="notification-layout">
        
        {/* Sidebar Component */}
        <NotificationSidebar
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onViewMatchesClick={handleViewMatchesClick}
          aiMatchCount={aiMatchCount}
        />

        {/* Main Area */}
        <section className="notification-content">
          
          {/* Header Area */}
          <div className="content-header">
            <div className="header-title-section">
              <h1 className="page-title">
                {activeTab === 'feed' && 'Thông báo'}
                {activeTab === 'settings' && 'Cài đặt thông báo'}
                {activeTab === 'archived' && 'Thông báo đã lưu trữ'}
              </h1>
              <p className="page-subtitle">
                {activeTab === 'feed' && 'Theo dõi trạng thái ứng tuyển và các hoạt động tuyển dụng quan trọng của bạn.'}
                {activeTab === 'settings' && 'Tùy chỉnh các kênh và loại thông tin bạn muốn nhận từ JobHub.'}
                {activeTab === 'archived' && 'Quản lý và xem lại các thông báo quan trọng đã được lưu trữ.'}
              </p>
            </div>
            
            {activeTab !== 'settings' && (
              <div className="header-actions">
                {activeTab === 'feed' && unreadCounts.all > 0 && (
                  <button
                    className="action-link-btn action-link-btn--readall"
                    onClick={handleMarkAllRead}
                  >
                    Đọc tất cả
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Feed Content Tab (Main Feed) */}
          {activeTab === 'feed' && (
            <>
              {/* Category Filter Tabs */}
              <NotificationFilters
                activeCategory={activeCategory}
                onChangeCategory={setActiveCategory}
                unreadCounts={unreadCounts}
              />

              {/* Notification Cards List */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <Spin size="large" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon-wrap">
                    <span className="material-symbols-outlined empty-icon">notifications_off</span>
                  </div>
                  <h2 className="empty-title">Không có thông báo</h2>
                  <p className="empty-desc">Hộp thư của bạn đang trống. Chúng tôi sẽ báo cho bạn khi có thông tin mới.</p>
                  <button className="empty-action-btn" onClick={() => navigate('/')}>
                    Về trang chủ
                  </button>
                </div>
              ) : (
                <>
                  <div className="notifications-list">
                    {paginatedNotifications.map(notif => (
                      <NotificationItemCard
                        key={notif.id}
                        notification={notif}
                        onMarkRead={handleMarkRead}
                        onArchive={handleArchive}
                        onActionClick={handleActionClick}
                        onCardClick={() => handleCardClick(notif)}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {filteredNotifications.length > PAGE_SIZE && (
                    <div className="pagination-container">
                      <button
                        className="pag-nav-btn"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <span className="material-symbols-outlined btn-arrow-icon">west</span>
                        <span>Trang trước</span>
                      </button>
                      <div className="pag-pages-wrap">
                        {Array.from({ length: Math.ceil(filteredNotifications.length / PAGE_SIZE) }).map((_, i) => (
                          <button
                            key={i}
                            className={`pag-page-btn ${currentPage === i + 1 ? 'pag-page-btn--active' : ''}`}
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <button
                        className="pag-nav-btn"
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredNotifications.length / PAGE_SIZE), prev + 1))}
                        disabled={currentPage === Math.ceil(filteredNotifications.length / PAGE_SIZE)}
                      >
                        <span>Trang sau</span>
                        <span className="material-symbols-outlined btn-arrow-icon">east</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Archived Notifications Tab */}
          {activeTab === 'archived' && (
            <>
              {archivedNotifications.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon-wrap">
                    <span className="material-symbols-outlined empty-icon">archive</span>
                  </div>
                  <h2 className="empty-title">Thư mục lưu trữ trống</h2>
                  <p className="empty-desc">Chưa có thông báo nào được chuyển vào mục lưu trữ.</p>
                </div>
              ) : (
                <>
                  <div className="notifications-list">
                    {paginatedArchived.map(notif => (
                      <NotificationItemCard
                        key={notif.id}
                        notification={notif}
                        onMarkRead={handleMarkRead}
                        onArchive={handleArchive}
                        onCardClick={() => handleCardClick(notif)}
                        isArchivedView
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {archivedNotifications.length > PAGE_SIZE && (
                    <div className="pagination-container">
                      <button
                        className="pag-nav-btn"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <span className="material-symbols-outlined btn-arrow-icon">west</span>
                        <span>Trang trước</span>
                      </button>
                      <div className="pag-pages-wrap">
                        {Array.from({ length: Math.ceil(archivedNotifications.length / PAGE_SIZE) }).map((_, i) => (
                          <button
                            key={i}
                            className={`pag-page-btn ${currentPage === i + 1 ? 'pag-page-btn--active' : ''}`}
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <button
                        className="pag-nav-btn"
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(archivedNotifications.length / PAGE_SIZE), prev + 1))}
                        disabled={currentPage === Math.ceil(archivedNotifications.length / PAGE_SIZE)}
                      >
                        <span>Trang sau</span>
                        <span className="material-symbols-outlined btn-arrow-icon">east</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="notification-settings-panel">
              <div className="settings-section">
                <h3 className="settings-section-title">Thông báo qua Email</h3>
                
                <div className="settings-row">
                  <div className="settings-info">
                    <p className="settings-label">Cập nhật ứng tuyển</p>
                    <p className="settings-desc">Nhận email khi có thay đổi trạng thái hồ sơ ứng tuyển của bạn.</p>
                  </div>
                  <Switch
                    checked={settings.emailAppUpdates}
                    onChange={val => setSettings(prev => ({ ...prev, emailAppUpdates: val }))}
                  />
                </div>

                <div className="settings-row">
                  <div className="settings-info">
                    <p className="settings-label">Gợi ý việc làm phù hợp</p>
                    <p className="settings-desc">Nhận tin tuyển dụng đề xuất bởi AI phù hợp với kỹ năng của bạn hàng tuần.</p>
                  </div>
                  <Switch
                    checked={settings.emailJobRecs}
                    onChange={val => setSettings(prev => ({ ...prev, emailJobRecs: val }))}
                  />
                </div>

                <div className="settings-row">
                  <div className="settings-info">
                    <p className="settings-label">Lời mời phỏng vấn</p>
                    <p className="settings-desc">Nhận email thông báo ngay khi có lời mời đặt lịch phỏng vấn mới.</p>
                  </div>
                  <Switch
                    checked={settings.emailInterviews}
                    onChange={val => setSettings(prev => ({ ...prev, emailInterviews: val }))}
                  />
                </div>
              </div>

              <div className="settings-section">
                <h3 className="settings-section-title">Thông báo đẩy (Browser Push Notifications)</h3>

                <div className="settings-row">
                  <div className="settings-info">
                    <p className="settings-label">Hoạt động tài khoản</p>
                    <p className="settings-desc">Báo tin nhắn mới và các cập nhật tương tác của tài khoản.</p>
                  </div>
                  <Switch
                    checked={settings.pushActivity}
                    onChange={val => setSettings(prev => ({ ...prev, pushActivity: val }))}
                  />
                </div>

                <div className="settings-row">
                  <div className="settings-info">
                    <p className="settings-label">Việc làm mới phát hành</p>
                    <p className="settings-desc">Thông báo tức thời về việc làm mới tương ứng với hồ sơ trực tuyến của bạn.</p>
                  </div>
                  <Switch
                    checked={settings.pushNewJobs}
                    onChange={val => setSettings(prev => ({ ...prev, pushNewJobs: val }))}
                  />
                </div>
              </div>

              <Button
                type="primary"
                className="btn-save-settings"
                onClick={handleSaveSettings}
              >
                Lưu cài đặt
              </Button>
            </div>
          )}

        </section>

      </div>
    </main>
  )
}

export default NotificationList
