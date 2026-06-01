import React from 'react';

const KpiCards = () => {
  return (
    <section className="kpi-grid">
      {/* Total Revenue */}
      <div className="kpi-card">
        <div className="kpi-top-row">
          <div className="kpi-icon-wrapper revenue">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <span className="trend-badge positive">
            <span className="material-symbols-outlined trend-arrow">trending_up</span> +12%
          </span>
        </div>
        <p className="kpi-label">Total Revenue</p>
        <h3 className="kpi-value">$425.5k</h3>
        <div className="kpi-sparkline">
          <svg className="sparkline-svg" preserveAspectRatio="none" viewBox="0 0 100 20">
            <path d="M0 15 L20 18 L40 10 L60 12 L80 5 L100 8" fill="none" stroke="#003a8c" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </div>

      {/* New Candidates */}
      <div className="kpi-card">
        <div className="kpi-top-row">
          <div className="kpi-icon-wrapper candidates">
            <span className="material-symbols-outlined">person_search</span>
          </div>
          <span className="trend-badge positive">
            <span className="material-symbols-outlined trend-arrow">trending_up</span> +5%
          </span>
        </div>
        <p className="kpi-label">New Candidates</p>
        <h3 className="kpi-value">1,240</h3>
        <div className="kpi-sparkline">
          <svg className="sparkline-svg" preserveAspectRatio="none" viewBox="0 0 100 20">
            <path d="M0 10 L20 12 L40 8 L60 15 L80 12 L100 5" fill="none" stroke="#005daa" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </div>

      {/* Active Job Postings */}
      <div className="kpi-card">
        <div className="kpi-top-row">
          <div className="kpi-icon-wrapper jobs">
            <span className="material-symbols-outlined">work</span>
          </div>
          <span className="trend-badge positive">
            <span className="material-symbols-outlined trend-arrow">trending_up</span> +8%
          </span>
        </div>
        <p className="kpi-label">Active Job Postings</p>
        <h3 className="kpi-value">856</h3>
        <div className="kpi-sparkline">
          <svg className="sparkline-svg" preserveAspectRatio="none" viewBox="0 0 100 20">
            <path d="M0 18 L20 15 L40 12 L60 10 L80 5 L100 2" fill="none" stroke="#380077" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </div>

      {/* Platform Conversion */}
      <div className="kpi-card">
        <div className="kpi-top-row">
          <div className="kpi-icon-wrapper conversion">
            <span className="material-symbols-outlined">conversion_path</span>
          </div>
          <span className="trend-badge stable">Stable</span>
        </div>
        <p className="kpi-label">Platform Conversion</p>
        <h3 className="kpi-value">3.2%</h3>
        <div className="kpi-sparkline">
          <svg className="sparkline-svg" preserveAspectRatio="none" viewBox="0 0 100 20">
            <path d="M0 10 L20 10 L40 12 L60 8 L80 10 L100 10" fill="none" stroke="#434651" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </div>
    </section>
  );
};

export default KpiCards;
