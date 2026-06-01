import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { getJobCategoryStatsApi } from '../../../services/job-service';

const CIRCUMFERENCE = 439.8;
const COLORS = ['#002660', '#005daa', '#380077', '#fa8c16', '#13c2c2', '#52c41a', '#eb2f96', '#722ed1', '#faad14', '#fa541c'];

const CategoryDonut = () => {
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getJobCategoryStatsApi()
      .then(res => {
        setCategoryStats(res.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalJobs = categoryStats.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="chart-container-card category-donut-card">
      <h4 className="chart-title">Job Categories</h4>
      <Spin spinning={loading}>
        <div className="donut-wrapper">
          <svg className="donut-svg" width="180" height="180">
            {(() => {
              let accum = 0;
              return categoryStats.map((item, index) => {
                const p = item.percentage / 100;
                const arcLength = p * CIRCUMFERENCE;
                const dashArray = `${arcLength.toFixed(1)} ${CIRCUMFERENCE}`;
                const dashOffset = -accum;
                accum += arcLength;
                const color = COLORS[index % COLORS.length];

                return (
                  <circle
                    key={item.name}
                    cx="90"
                    cy="90"
                    fill="none"
                    r="70"
                    stroke={color}
                    strokeWidth="22"
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                  />
                );
              });
            })()}
          </svg>
          <div className="donut-center-text">
            <span className="total-count">
              {totalJobs >= 1000 ? `${(totalJobs / 1000).toFixed(1)}k` : totalJobs}
            </span>
            <span className="total-label">Total</span>
          </div>
        </div>

        <div className="donut-legend">
          {categoryStats.map((item, index) => {
            const color = COLORS[index % COLORS.length];
            return (
              <div className="legend-row" key={item.name}>
                <div className="row-left">
                  <span className="dot" style={{ backgroundColor: color }}></span>
                  <span className="label">{item.name}</span>
                </div>
                <span className="pct">{item.percentage}%</span>
              </div>
            );
          })}
        </div>
      </Spin>
    </div>
  );
};

export default CategoryDonut;
