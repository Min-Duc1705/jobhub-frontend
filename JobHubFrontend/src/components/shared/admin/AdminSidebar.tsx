import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../../redux/hooks';

type NavItem =
  | { type: 'link'; path: string; label: string; icon: string }
  | { type: 'group'; label: string; icon: string; children: { path: string; label: string; icon: string }[] };

const NAV_ITEMS: NavItem[] = [
  { type: 'link', path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  {
    type: 'group',
    label: 'Người dùng',
    icon: 'manage_accounts',
    children: [
      { path: '/admin/accounts', label: 'Tài khoản hệ thống', icon: 'account_circle' },
      { path: '/admin/customers', label: 'Khách hàng', icon: 'person' },
    ],
  },
  { type: 'link', path: '/admin/companies', label: 'Công ty', icon: 'business' },
  { type: 'link', path: '/admin/skills', label: 'Kỹ năng', icon: 'psychology' },
  { type: 'link', path: '/admin/contacts', label: 'Liên hệ', icon: 'contact_mail' },
  { type: 'link', path: '/admin/jobs', label: 'Tin tuyển dụng', icon: 'work' },
  {
    type: 'group',
    label: 'CV & Ứng tuyển',
    icon: 'description',
    children: [
      { path: '/admin/resumes', label: 'Quản lý CV', icon: 'article' },
      { path: '/admin/applications', label: 'Đơn ứng tuyển', icon: 'assignment' },
    ],
  },
  { type: 'link', path: '/admin/notifications', label: 'Quản lý thông báo', icon: 'notifications' },
  {
    type: 'group',
    label: 'Hệ thống',
    icon: 'security',
    children: [
      { path: '/admin/permissions', label: 'Permissions', icon: 'lock' },
      { path: '/admin/roles', label: 'Roles', icon: 'admin_panel_settings' },
    ],
  },
];

const PATH_PERMISSIONS: Record<string, { method: string; apiPath: string; module: string }> = {
  '/admin/accounts': { method: 'GET', apiPath: '/api/v1/users', module: 'USER' },
  '/admin/customers': { method: 'GET', apiPath: '/api/v1/customers', module: 'PROFILE' },
  '/admin/companies': { method: 'GET', apiPath: '/api/v1/companies', module: 'COMPANY' },
  '/admin/skills': { method: 'GET', apiPath: '/api/v1/skills', module: 'SKILL' },
  '/admin/contacts': { method: 'GET', apiPath: '/api/v1/contacts', module: 'CONTACT' },
  '/admin/jobs': { method: 'GET', apiPath: '/api/v1/jobs', module: 'JOB' },
  '/admin/resumes': { method: 'GET', apiPath: '/api/v1/resumes', module: 'RESUME' },
  '/admin/applications': { method: 'GET', apiPath: '/api/v1/applications', module: 'APPLICATION' },
  '/admin/permissions': { method: 'GET', apiPath: '/api/v1/permissions', module: 'PERMISSION' },
  '/admin/roles': { method: 'GET', apiPath: '/api/v1/roles', module: 'ROLE' },
};

interface AdminSidebarProps {
  sidebarCollapsed: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function AdminSidebar({ sidebarCollapsed, mobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const location = useLocation();
  const { user } = useAppSelector((state: any) => state.auth);
  const permissions = user?.role?.permissions || [];
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Người dùng', 'CV & Ứng tuyển', 'Hệ thống']);

  const hasPathPermission = (path: string) => {
    if (user?.role?.name?.toLowerCase().includes('admin')) {
      return true;
    }
    const permission = PATH_PERMISSIONS[path];
    if (!permission) return true;

    return permissions.some(
      (item: any) =>
        item &&
        item.apiPath === permission.apiPath &&
        item.method === permission.method &&
        item.module === permission.module
    );
  };

  const isPathActive = (path: string) => location.pathname.startsWith(path);

  const isGroupActive = (children: { path: string }[]) =>
    children.some((c) => isPathActive(c.path));

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  return (
    <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
      <div className="sidebar-brand-area">
        <div className="brand-icon-wrapper">
          <span className="material-symbols-outlined brand-icon">shield_person</span>
        </div>
        <div className="brand-text-wrapper">
          <p className="brand-name">JobHub</p>
          <p className="brand-subtitle">Admin Console</p>
        </div>
      </div>

      <nav className="sidebar-navigation">
        {NAV_ITEMS.map((item) => {
          if (item.type === 'link') {
            if (!hasPathPermission(item.path)) return null;
            const active = isPathActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
                onClick={onMobileClose}
              >
                <span className="material-symbols-outlined nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          }

          // Group (sub-menu)
          const allowedChildren = item.children.filter((child) => hasPathPermission(child.path));
          if (allowedChildren.length === 0) return null;

          const groupActive = isGroupActive(allowedChildren);
          const expanded = expandedGroups.includes(item.label);

          return (
            <div key={item.label} className={`sidebar-nav-group ${groupActive ? 'active' : ''}`}>
              <button
                className={`sidebar-nav-group__header ${groupActive ? 'active' : ''}`}
                onClick={() => !sidebarCollapsed && toggleGroup(item.label)}
              >
                <span className="material-symbols-outlined nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                <span className={`sidebar-nav-group__chevron material-symbols-outlined ${expanded ? 'open' : ''}`}>
                  chevron_right
                </span>
              </button>

              {!sidebarCollapsed && expanded && (
                <div className="sidebar-nav-group__children">
                  {allowedChildren.map((child) => {
                    const childActive = isPathActive(child.path);
                    return (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={`sidebar-nav-child ${childActive ? 'active' : ''}`}
                        onClick={onMobileClose}
                      >
                        <span className="material-symbols-outlined nav-icon">{child.icon}</span>
                        <span className="nav-label">{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer-links">
        <Link to="/admin/support" className="sidebar-footer-item">
          <span className="material-symbols-outlined nav-icon">contact_support</span>
          <span className="nav-label">Support</span>
        </Link>
        <Link to="/admin/docs" className="sidebar-footer-item">
          <span className="material-symbols-outlined nav-icon">description</span>
          <span className="nav-label">Documentation</span>
        </Link>
      </div>
    </aside>
  );
}
