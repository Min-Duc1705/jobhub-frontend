import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { getJobCategoryStatsApi } from '../../../services/job-service';

const CIRCUMFERENCE = 439.8;
const COLORS = ['#002660', '#005daa', '#380077', '#fa8c16', '#13c2c2', '#52c41a', '#eb2f96', '#722ed1', '#faad14', '#fa541c'];

const CategoryDonut = () => {
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setLoading(true);
    getJobCategoryStatsApi()
      .then(res => {
        const sortedData = (res.data ?? []).sort((a: any, b: any) => b.count - a.count);
        setCategoryStats(sortedData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (categoryStats.length > 0) {
      setIsAnimated(false);
      const timer = setTimeout(() => {
        setIsAnimated(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [categoryStats]);

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
                    strokeDasharray={isAnimated ? dashArray : `0 ${CIRCUMFERENCE}`}
                    strokeDashoffset={dashOffset}
                    style={{
                      transition: 'stroke-dasharray 1.4s cubic-bezier(0.25, 1, 0.5, 1)',
                    }}
                  />
                );
              });
            })()}
          </svg>
          <div
            className="donut-center-text"
            style={{
              opacity: isAnimated ? 1 : 0,
              transform: isAnimated ? 'scale(1)' : 'scale(0.8)',
              transition: 'opacity 1s ease-out, transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <span className="total-count">
              {totalJobs >= 1000 ? `${(totalJobs / 1000).toFixed(1)}k` : totalJobs}
            </span>
            <span className="total-label">Total</span>
          </div>
        </div>

        <div className="donut-legend">
          {categoryStats.map((item, index) => {
            const color = COLORS[index % COLORS.length];
            const isVisible = showAll || index < 5;
            return (
              <div
                className={`legend-row ${isVisible ? '' : 'hidden-row'}`}
                key={item.name}
                style={{
                  display: isVisible ? 'flex' : 'none',
                  opacity: isAnimated ? 1 : 0,
                  transform: isAnimated ? 'translateX(0)' : 'translateX(-12px)',
                  transition: `opacity 0.6s ease-out ${index * 0.06}s, transform 0.6s cubic-bezier(0.25, 1, 0.5, 1) ${index * 0.06}s`,
                }}
              >
                <div className="row-left">
                  <span className="dot" style={{ backgroundColor: color }}></span>
                  <span className="label">{item.name}</span>
                </div>
                <span className="pct">{item.percentage}%</span>
              </div>
            );
          })}
        </div>

        {categoryStats.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="show-more-btn"
          >
            <span>{showAll ? 'Show Less' : 'Show More'}</span>
            <span className={`material-symbols-outlined toggle-icon ${showAll ? 'expanded' : ''}`}>
              expand_more
            </span>
          </button>
        )}
      </Spin>
    </div>
  );
};

export default CategoryDonut;
