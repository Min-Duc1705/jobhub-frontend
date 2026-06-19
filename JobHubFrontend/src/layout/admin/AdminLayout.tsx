import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from '../../components/shared/admin/AdminHeader';
import AdminSidebar from '../../components/shared/admin/AdminSidebar';
import FloatingChatWidget from '../../components/shared/chat/FloatingChatWidget';
import FloatingAIButton from '../../components/shared/ai-assistant/FloatingAIButton';
import './AdminLayout.scss';

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-layout-wrapper">
      {/* ── Top App Bar ──────────────────────────────────────────────────────── */}
      <AdminHeader
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <AdminSidebar
        sidebarCollapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* ── Mobile Backdrop ──────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <main className={`admin-main-canvas ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="admin-content-inner">
          <Outlet />
        </div>
      </main>

      {/* ── Chat Widget ────────────────────────────────────────────────────────── */}
      <FloatingChatWidget />

      {/* ── AI Assistant ──────────────────────────────────────────────────────── */}
      <FloatingAIButton />
    </div>
  );
}

