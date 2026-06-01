import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Dropdown, Avatar } from 'antd';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { logoutUser } from '../../../redux/slices/authSlice';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import NotificationDropdown from '../notification/NotificationDropdown';
import type { INotification } from '../notification/NotificationDropdown';
import ProfileDropdown from '../header/ProfileDropdown';
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from '../../../services/notification-service';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const getInitials = (name?: string) => {
  if (!name) return 'A';
  return name.trim().split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
};

interface AdminHeaderProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export default function AdminHeader({ sidebarCollapsed, setSidebarCollapsed }: AdminHeaderProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchFocused, setSearchFocused] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [jobsOpen, setJobsOpen] = useState(false);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const { user, avatarUrl } = useAppSelector((state: any) => state.auth);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await getNotificationsApi();
      if (res.data) {
        const mapped = res.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          message: item.message,
          isRead: item.isRead,
          time: dayjs(item.createdDate).locale('vi').fromNow(),
          type: item.type || 'default',
        }));
        setNotifications(mapped);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = async (id: string) => {
    try {
      const notification = notifications.find((n) => n.id === id);
      await markNotificationReadApi(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setNotifOpen(false);

      if (notification) {
        const isHR = user?.role?.name === 'HR';
        if (notification.type === 'view') {
          navigate('/candidate/profile');
        } else if (notification.type === 'invite') {
          if (isHR) {
            navigate('/hr/jobs');
          } else {
            navigate('/candidate/applied-jobs');
          }
        } else if (notification.type === 'recommend') {
          navigate('/jobs');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="admin-header">
      <div className="header-left">
        <h1 className="admin-logo-text" onClick={() => navigate('/')}>JobHub</h1>
        <button className="sidebar-toggle-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
          <span className="material-symbols-outlined">
            {sidebarCollapsed ? 'menu' : 'menu_open'}
          </span>
        </button>
      </div>

      <nav className="header-right">
        <div className={`admin-search-box ${searchFocused ? 'focused' : ''}`}>
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            placeholder="Search system resources..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        <div className="header-action-icons">
          <Dropdown
            overlayClassName="nav-notification-dropdown-wrap"
            dropdownRender={() => (
              <NotificationDropdown
                notifications={notifications}
                onMarkAllRead={handleMarkAllRead}
                onItemClick={handleItemClick}
                onClose={() => setNotifOpen(false)}
              />
            )}
            trigger={['click']}
            placement="bottomRight"
            open={notifOpen}
            onOpenChange={setNotifOpen}
          >
            <button className="icon-btn hover-effect">
              <Badge count={unreadCount} size="small" offset={[2, -2]}>
                <span className="material-symbols-outlined text-icon">notifications</span>
              </Badge>
            </button>
          </Dropdown>
          <button className="icon-btn hover-effect">
            <span className="material-symbols-outlined text-icon">help</span>
          </button>

          <Dropdown
            popupRender={() => (
              <ProfileDropdown
                user={user}
                isHR={user?.role?.name === 'HR'}
                isCandidate={user?.role?.name === 'CANDIDATE'}
                jobsOpen={jobsOpen}
                setJobsOpen={setJobsOpen}
                onLogout={handleLogout}
                onClose={() => setProfileDropdownOpen(false)}
              />
            )}
            trigger={['click']}
            placement="bottomRight"
            overlayClassName="nav-dropdown"
            open={profileDropdownOpen}
            onOpenChange={(open) => {
              setProfileDropdownOpen(open);
              if (!open) setJobsOpen(false);
            }}
          >
            <button className="admin-profile-trigger nav-avatar-btn" aria-label="Tài khoản" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Avatar className="nav-avatar" size={38} src={(avatarUrl && avatarUrl !== 'null' && avatarUrl !== 'undefined') ? avatarUrl : undefined}>
                {(!avatarUrl || avatarUrl === 'null' || avatarUrl === 'undefined') && user && getInitials(user?.username || user?.email)}
              </Avatar>
              <span className="nav-avatar-name" style={{ fontWeight: 500, color: '#333' }}>{user?.username || 'Admin'}</span>
              <span className="material-symbols-outlined nav-avatar-chevron" style={{ color: '#666' }}>expand_more</span>
            </button>
          </Dropdown>
        </div>
      </nav>
    </header>
  );
}
