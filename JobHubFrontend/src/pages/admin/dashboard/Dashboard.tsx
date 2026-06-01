import React from 'react';
import { Button } from 'antd';
import { message } from '../../../utils/antd';
import './Dashboard.scss';
import AuditLogTable from '../../../components/admin/audit-log/audit-log.table';
import KpiCards from '../../../components/admin/dashboard/kpi-cards';
import RecruitmentChart from '../../../components/admin/dashboard/recruitment-chart';
import CategoryDonut from '../../../components/admin/dashboard/category-donut';
import AiPredictor from '../../../components/admin/dashboard/ai-predictor';

export default function Dashboard() {
  const handleExport = () => {
    message.loading({ content: 'Preparing system report...', key: 'export' });
    setTimeout(() => {
      message.success({ content: 'Report exported successfully (CSV/PDF)!', key: 'export', duration: 2 });
    }, 1500);
  };

  return (
    <div className="admin-dashboard-page">
      {/* Page Header */}
      <section className="dashboard-header-row">
        <div className="title-area">
          <h2 className="title-text">System Overview</h2>
          <p className="subtitle-text">Good morning, Admin. Here's what's happening today.</p>
        </div>
        <div className="action-area">
          <Button className="btn-filter-date" icon={<span className="material-symbols-outlined icon-size-antd">calendar_today</span>}>
            Last 30 Days
          </Button>
          <Button type="primary" className="btn-export" onClick={handleExport} icon={<span className="material-symbols-outlined icon-size-antd">download</span>}>
            Export Report
          </Button>
        </div>
      </section>

      {/* KPI Cards Grid */}
      <KpiCards />

      {/* Analytics Visualization Section */}
      <section className="analytics-section">
        {/* Large Activity Line Chart */}
        <RecruitmentChart />

        {/* Category Donut Distribution */}
        <CategoryDonut />
      </section>

      {/* AI Market Predictor Banner */}
      <AiPredictor />

      {/* Recent Activity Section */}
      <AuditLogTable />
    </div>
  );
}
