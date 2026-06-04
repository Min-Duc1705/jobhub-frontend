import { useState, useEffect, useCallback } from 'react'
import { Avatar, Dropdown, Button, notification, Drawer } from 'antd'
import type { MenuProps } from 'antd'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../redux/hooks'
import { logoutUser } from '../../../redux/slices/authSlice'
import NotificationDropdown from '../../../components/shared/notification/NotificationDropdown'
import type { INotification } from '../../../components/shared/notification/NotificationDropdown'
import ProfileDropdown from '../../../components/shared/header/ProfileDropdown'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useChatHub, useChatHubEvent } from '../../../hooks/useChatHub'
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi
} from '../../../services/notification-service'
import { useConversations, invalidateConversationsCache } from '../../../hooks/useConversations'

import './HeaderClient.scss'

const NAV_LINKS = [
  { to: '/jobs',           label: 'Jobs'       },
  { to: '/companies',      label: 'Companies'  },
  { to: '/salary-predict', label: 'AI Tools'   },
  { to: '/about',          label: 'About Us'   },
  { to: '/contact',        label: 'Contact'    },
]

const getInitials = (name: string) =>
  name.trim().split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

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

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Âm thứ 1: F5 (698.46 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(698.46, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);
    
    // Âm thứ 2: A5 (880.00 Hz) - cao hơn và trễ một chút
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.08);
    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.12, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.5);
  } catch (err) {
    console.warn('Web Audio API not supported or blocked by browser autoplay policy:', err);
  }
}

const HeaderClient = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user, avatarUrl } = useAppSelector((state) => state.auth)

  // Toggle mở/đóng sub Jobs cho candidate
  const [jobsOpen,     setJobsOpen]     = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Notification state
  const [notifications, setNotifications] = useState<INotification[]>([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [isRinging, setIsRinging] = useState(false)
  // Chat unread count — dùng shared hook (cache chung với FloatingChatWidget)
  const { totalUnread: chatUnreadCount } = useConversations(isAuthenticated)
  const unreadCount = notifications.filter(n => !n.isRead).length

  // Singleton Chat Hub — chia sẻ connection với FloatingChatWidget, ChatPage
  const { connection: chatConnection } = useChatHub(isAuthenticated ? user?.id : null)

  // Lắng nghe tin nhắn mới → invalidate conversations cache + hiện toast
  useChatHubEvent(chatConnection, 'ReceiveMessage', (msg: any) => {
    if (!user || msg.senderId.toLowerCase() === user.id.toLowerCase()) return
    invalidateConversationsCache()
    if (window.location.pathname !== '/chat') {
      notification.info({
        message: 'Tin nhắn mới',
        description: msg.content.length > 60 ? msg.content.substring(0, 60) + '...' : msg.content,
        placement: 'bottomRight',
        duration: 4,
        onClick: () => navigate('/chat'),
        style: { borderRadius: '10px', borderLeft: '4px solid #52c41a', cursor: 'pointer' }
      })
      playNotificationSound()
    }
  })

  // Lắng nghe ConversationRead → invalidate cache để cập nhật badge
  useChatHubEvent(chatConnection, 'ConversationRead', () => {
    invalidateConversationsCache()
  })

  // Stable notification fetch function
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return
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
    }
  }, [isAuthenticated, user])

  // Sync event listener (stable)
  useEffect(() => {
    if (!isAuthenticated) return

    const handleSync = () => {
      fetchNotifications()
    }

    window.addEventListener('notification-updated', handleSync)
    return () => {
      window.removeEventListener('notification-updated', handleSync)
    }
  }, [isAuthenticated, fetchNotifications])

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotifications([])
      return
    }

    fetchNotifications()

    // 2. Setup SignalR connection - kết nối trực tiếp đến NotificationService
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

      // Kích hoạt hiệu ứng lắc chuông
      setIsRinging(true)
      setTimeout(() => setIsRinging(false), 600)

      // Phát âm thanh báo hiệu
      playNotificationSound()

      // Hiển thị toast thông báo nổi bật
      notification.info({
        message: newNotif.title || 'Thông báo mới',
        description: newNotif.message,
        placement: 'bottomRight',
        duration: 5,
        style: {
          borderRadius: '10px',
          borderLeft: '4px solid #005daa',
        }
      })
    })

    connection.start()
      .then(() => console.log('SignalR Connected to NotificationHub'))
      .catch(err => console.error('SignalR Connection Error:', err))

    return () => {
      connection.stop()
        .then(() => console.log('SignalR Connection Stopped'))
        .catch(err => console.error('SignalR Stop Error:', err))
    }
  }, [isAuthenticated, user, fetchNotifications])

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsReadApi()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      window.dispatchEvent(new Event('notification-updated'))
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  const handleNotificationClick = async (id: string) => {
    try {
      const notification = notifications.find(n => n.id === id)
      
      await markNotificationReadApi(id)
      setNotifications(prev => prev.map(item => item.id === id ? { ...item, isRead: true } : item))
      window.dispatchEvent(new Event('notification-updated'))
      
      // Đóng dropdown khi click
      setNotificationsOpen(false)

      if (notification) {
        if (notification.type === 'view') {
          navigate('/candidate/profile')
        } else if (notification.type === 'invite') {
          if (isHR) {
            navigate('/hr/jobs')
          } else {
            navigate('/candidate/applied-jobs')
          }
        } else if (notification.type === 'recommend') {
          navigate('/jobs')
        }
      }
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const handleLogout = async () => {
    await dispatch(logoutUser())
    navigate('/login')
  }

  const isHR        = user?.role?.name === 'HR'
  const isCandidate = user?.role?.name === 'CANDIDATE' || (!isHR && !!user)

  // ── Render Helpers ────────────────────────────────────────────────────────

  return (
    <nav className="nav-bar">
      <div className="nav-bar__inner">

        {/* ── Brand ── */}
        <div className="nav-bar__brand-wrap">
          <button className="nav-bar__mobile-menu-btn" onClick={() => setMobileMenuOpen(true)} aria-label="Menu">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <Link to="/" className="nav-bar__brand">JobHub</Link>
        </div>

        {/* ── Nav links ── */}
        <div className="nav-bar__links">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-bar__link${isActive ? ' nav-bar__link--active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* ── Auth ── */}
        <div className="nav-bar__right">
          {isAuthenticated && user ? (
            <>
              {/* Chat Button */}
              <button
                className="nav-chat-btn"
                onClick={() => navigate('/chat')}
                aria-label="Tin nhắn"
                style={{ marginRight: '8px' }}
              >
                <span className="material-symbols-outlined">chat</span>
                {chatUnreadCount > 0 && <span className="chat-badge">{chatUnreadCount}</span>}
              </button>

              {/* Notification Dropdown */}
              <Dropdown
                popupRender={() => (
                  <NotificationDropdown
                    notifications={notifications}
                    onMarkAllRead={markAllAsRead}
                    onItemClick={handleNotificationClick}
                    onClose={() => setNotificationsOpen(false)}
                  />
                )}
                placement="bottomRight"
                trigger={['click']}
                overlayClassName="nav-notification-dropdown-wrap"
                open={notificationsOpen}
                onOpenChange={setNotificationsOpen}
              >
                <button
                  className={`nav-notification-btn ${isRinging ? 'nav-notification-btn--ring' : ''}`}
                  aria-label="Thông báo"
                >
                  <span className="material-symbols-outlined">notifications</span>
                  {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                </button>
              </Dropdown>

              <Dropdown
                popupRender={() => (
                  <ProfileDropdown
                    user={user}
                    jobsOpen={jobsOpen}
                    setJobsOpen={setJobsOpen}
                    onLogout={handleLogout}
                    onClose={() => setDropdownOpen(false)}
                  />
                )}
                placement="bottomRight"
                trigger={['click']}
                overlayClassName="nav-dropdown"
                open={dropdownOpen}
                onOpenChange={(open) => {
                  setDropdownOpen(open)
                  if (!open) setJobsOpen(false) // reset sub khi đóng
                }}
              >
                <button className="nav-avatar-btn" aria-label="Tài khoản">
                  <Avatar className="nav-avatar" size={38} src={avatarUrl || undefined}>
                    {!avatarUrl && getInitials(user.username || user.email)}
                  </Avatar>
                  <span className="nav-avatar-name">{user.username}</span>
                  <span className="material-symbols-outlined nav-avatar-chevron">expand_more</span>
                </button>
              </Dropdown>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-bar__login">Login</Link>
              <Button className="btn-signup">
                <Link to="/register" style={{ color: 'inherit', textDecoration: 'none' }}>Sign Up</Link>
              </Button>
            </>
          )}
        </div>

      </div>

      {/* ── Mobile Menu Drawer ── */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link to="/" className="nav-bar__brand" style={{ fontSize: '28px' }} onClick={() => setMobileMenuOpen(false)}>
              JobHub
            </Link>
          </div>
        }
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
        styles={{
          header: { padding: '16px 24px', borderBottom: '1px solid var(--outline-variant)' },
          body: { padding: '24px' }
        }}
        className="nav-bar__drawer"
      >
        <div className="nav-bar__drawer-links" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-bar__drawer-link${isActive ? ' nav-bar__drawer-link--active' : ''}`
              }
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '15px',
                fontWeight: 500,
                color: 'var(--on-surface-variant)',
                textDecoration: 'none',
                padding: '12px 16px',
                borderRadius: '8px',
                display: 'block',
                transition: 'background 0.18s'
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}

          {!isAuthenticated && (
            <div className="nav-bar__drawer-auth" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--outline-variant)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link
                to="/login"
                className="nav-bar__drawer-login"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--on-surface-variant)',
                  textDecoration: 'none',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--outline)'
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Button className="btn-signup" style={{ width: '100%' }}>
                <Link to="/register" style={{ color: 'inherit', textDecoration: 'none' }} onClick={() => setMobileMenuOpen(false)}>
                  Sign Up
                </Link>
              </Button>
            </div>
          )}
        </div>
      </Drawer>
    </nav>
  )
}

export default HeaderClient
