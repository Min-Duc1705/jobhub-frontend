import React, { useEffect, useState } from 'react';
import { Area } from '@ant-design/plots';
import { Spin } from 'antd';
import dayjs from 'dayjs';

import { getApplicationsApi } from '../../../services/application-service';
import type { IApplication } from '../../../types/application';

const RecruitmentChart = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getApplicationsApi('pageSize=1000&sortBy=createdDate&isDescending=true')
      .then((res) => {
        const apps = res.data?.result ?? res.data ?? [];
        
        // Build last 30 days map using DD/MM format (numerical, avoids localization parsing issues)
        const daysMap: Record<string, { apps: number; hires: number }> = {};
        const datesList: string[] = [];
        
        for (let i = 29; i >= 0; i--) {
          const d = dayjs().subtract(i, 'day');
          const formatted = d.format('DD/MM');
          daysMap[formatted] = { apps: 0, hires: 0 };
          datesList.push(formatted);
        }

        // Aggregate real data if present
        if (Array.isArray(apps)) {
          apps.forEach((app: IApplication) => {
            if (!app.createdDate) return;
            const appDate = dayjs(app.createdDate).format('DD/MM');
            if (daysMap[appDate] !== undefined) {
              daysMap[appDate].apps += 1;
              if (app.status === 'APPROVED') {
                daysMap[appDate].hires += 1;
              }
            }
          });
        }

        // Convert to format required by G2 v5
        const chartList: any[] = [];
        datesList.forEach((date) => {
          chartList.push({
            date,
            value: daysMap[date].apps,
            type: 'Applications',
          });
          chartList.push({
            date,
            value: daysMap[date].hires,
            type: 'Hires',
          });
        });

        setData(chartList);
      })
      .catch((err) => {
        console.error('Failed to load recruitment stats:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const config = {
    data,
    xField: 'date',
    yField: 'value',
    colorField: 'type',
    height: 240,
    legend: false,
    scale: {
      x: {
        type: 'point', // Force categorical axis representation to prevent auto-translation of months
      },
      color: {
        domain: ['Applications', 'Hires'],
        range: ['#002660', '#005daa'],
      },
    },
    style: {
      lineDash: (datum: any) => (datum.type === 'Hires' ? [4, 4] : [0, 0]),
      strokeWidth: 2.5,
      fillOpacity: 0.15,
    },
    interaction: {
      tooltip: {
        shared: true,
        showMarkers: true,
      },
    },
    tooltip: {
      title: 'date',
      items: [
        {
          channel: 'y',
          valueFormatter: (v: any) => `${v}`,
        },
      ],
    },
  };

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

      <Spin spinning={loading}>
        <div className="chart-canvas-wrapper" style={{ minHeight: 240 }}>
          <Area {...config} />
        </div>
      </Spin>
    </div>
  );
};

export default RecruitmentChart;
