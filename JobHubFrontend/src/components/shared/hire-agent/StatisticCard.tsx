import React from 'react';
import { Row, Col } from 'antd';
import {
  RobotOutlined,
  SyncOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

interface StatisticsSummaryProps {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
}

export default function StatisticsSummary({
  totalCampaigns,
  activeCampaigns,
  completedCampaigns,
}: StatisticsSummaryProps) {
  const stats = [
    {
      label: 'Tổng chiến dịch',
      value: totalCampaigns,
      color: '#1890ff',
      bg: '#e6f4ff',
      icon: <RobotOutlined />,
    },
    {
      label: 'Đang tìm kiếm',
      value: activeCampaigns,
      color: '#722ed1',
      bg: '#f9f0ff',
      icon: <SyncOutlined spin={activeCampaigns > 0} />,
    },
    {
      label: 'Hoàn thành',
      value: completedCampaigns,
      color: '#52c41a',
      bg: '#f6ffed',
      icon: <CheckCircleOutlined />,
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {stats.map((s) => (
        <Col xs={24} sm={8} key={s.label}>
          <div className="stat-card">
            <div>
              <div className="stat-card__label">{s.label}</div>
              <div className="stat-card__value">{s.value}</div>
            </div>
            <div
              className="stat-card__icon"
              style={{ background: s.bg, color: s.color }}
            >
              {s.icon}
            </div>
          </div>
        </Col>
      ))}
    </Row>
  );
}
