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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchItems = [
    { label: 'Dashboard (Bảng điều khiển)', path: '/admin/dashboard', icon: 'dashboard', category: 'Trang chính' },
    { label: 'Tài khoản hệ thống', path: '/admin/accounts', icon: 'account_circle', category: 'Người dùng' },
    { label: 'Khách hàng', path: '/admin/customers', icon: 'person', category: 'Người dùng' },
    { label: 'Công ty', path: '/admin/companies', icon: 'business', category: 'Doanh nghiệp' },
    { label: 'Kỹ năng', path: '/admin/skills', icon: 'psychology', category: 'Dữ liệu' },
    { label: 'Liên hệ (Hỗ trợ khách hàng)', path: '/admin/contacts', icon: 'contact_mail', category: 'Hỗ trợ' },
    { label: 'Tin tuyển dụng', path: '/admin/jobs', icon: 'work', category: 'Tuyển dụng' },
    { label: 'Quản lý CV', path: '/admin/resumes', icon: 'article', category: 'CV & Ứng tuyển' },
    { label: 'Đơn ứng tuyển', path: '/admin/applications', icon: 'assignment', category: 'CV & Ứng tuyển' },
    { label: 'Quản lý thông báo', path: '/admin/notifications', icon: 'notifications', category: 'Hệ thống' },
    { label: 'Permissions (Quyền hạn)', path: '/admin/permissions', icon: 'lock', category: 'Bảo mật' },
    { label: 'Roles (Vai trò)', path: '/admin/roles', icon: 'admin_panel_settings', category: 'Bảo mật' },
    { label: 'Analytics (Thống kê)', path: '/admin/analytics', icon: 'analytics', category: 'Thống kê' },
    { label: 'Settings (Cài đặt)', path: '/admin/settings', icon: 'settings', category: 'Cài đặt' },
  ];

  const filteredItems = searchItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 8);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredItems[selectedIndex];
      if (target) {
        navigate(target.path);
        setSearchQuery('');
        (e.target as HTMLInputElement).blur();
      }
    } else if (e.key === 'Escape') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const { user, avatarUrl } = useAppSelector((state: any) => state.auth);

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

  useEffect(() => {
    loadNotifications();
  }, []);

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
            placeholder="Tìm kiếm tài nguyên hệ thống..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => {
              // Delay blur to allow item selection click events to register
              setTimeout(() => setSearchFocused(false), 200);
            }}
            onKeyDown={handleSearchKeyDown}
          />
          {searchFocused && (
            <div className="admin-search-dropdown">
              {filteredItems.length > 0 ? (
                <>
                  <div className="search-dropdown-group-title">Chức năng hệ thống</div>
                  {filteredItems.map((item, idx) => (
                    <div
                      key={item.path}
                      className={`search-dropdown-item ${idx === selectedIndex ? 'active' : ''}`}
                      onMouseDown={() => {
                        navigate(item.path);
                        setSearchQuery('');
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{item.icon}</span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <span style={{ fontSize: 11, color: '#999' }}>{item.category}</span>
                    </div>
                  ))}
                </>
              ) : (
                <div className="search-dropdown-empty">Không tìm thấy tài nguyên hợp lệ</div>
              )}
            </div>
          )}
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
