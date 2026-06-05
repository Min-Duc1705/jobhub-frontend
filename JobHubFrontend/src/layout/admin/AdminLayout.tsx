import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from '../../components/shared/admin/AdminHeader';
import AdminSidebar from '../../components/shared/admin/AdminSidebar';
import FloatingAIButton from '../../components/shared/ai-assistant/FloatingAIButton';
import './AdminLayout.scss';

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="admin-layout-wrapper">
      {/* ── Top App Bar ──────────────────────────────────────────────────────── */}
      <AdminHeader
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <AdminSidebar sidebarCollapsed={sidebarCollapsed} />

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <main className={`admin-main-canvas ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="admin-content-inner">
          <Outlet />
        </div>
      </main>

      {/* ── AI Assistant ──────────────────────────────────────────────────────── */}
      <FloatingAIButton />
    </div>
  );
}

