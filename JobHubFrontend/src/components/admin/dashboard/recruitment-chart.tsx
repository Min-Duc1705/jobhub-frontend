import React from 'react';

const RecruitmentChart = () => {
  return (
    <div className="chart-container-card recruitment-chart">
      <div className="chart-header">
        <div className="chart-info">
          <h4 className="chart-title">Recruitment Activity</h4>
          <p className="chart-subtitle">Daily tracking of applications and successful hires</p>
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-dot applications"></span>
            <span className="legend-label">Applications</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot hires"></span>
            <span className="legend-label">Hires</span>
          </div>
        </div>
      </div>

      <div className="chart-canvas-wrapper">
        <svg className="main-chart-svg" viewBox="0 0 600 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartLineGradient" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#002660" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#002660" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Horizontal Gridlines */}
          <line stroke="#f0f0f0" strokeWidth="1" x1="0" x2="600" y1="0" y2="0" />
          <line stroke="#f0f0f0" strokeWidth="1" x1="0" x2="600" y1="50" y2="50" />
          <line stroke="#f0f0f0" strokeWidth="1" x1="0" x2="600" y1="100" y2="100" />
          <line stroke="#f0f0f0" strokeWidth="1" x1="0" x2="600" y1="150" y2="150" />
          <line stroke="#f0f0f0" strokeWidth="1" x1="0" x2="600" y1="200" y2="200" />

          {/* Area Fill Under Applications Line */}
          <path d="M0 150 L100 120 L200 140 L300 80 L400 90 L500 40 L600 60 V200 H0 Z" fill="url(#chartLineGradient)" />

          {/* Applications Solid Line */}
          <path d="M0 150 L100 120 L200 140 L300 80 L400 90 L500 40 L600 60" fill="none" stroke="#002660" strokeWidth="2.5" />

          {/* Hires Dashed Line */}
          <path d="M0 190 L100 180 L200 185 L300 160 L400 170 L500 150 L600 155" fill="none" stroke="#005daa" strokeDasharray="5,4" strokeWidth="2" />
        </svg>

        <div className="chart-axis-x">
          <span>01 May</span>
          <span>08 May</span>
          <span>15 May</span>
          <span>22 May</span>
          <span>29 May</span>
        </div>
      </div>
    </div>
  );
};

export default RecruitmentChart;
