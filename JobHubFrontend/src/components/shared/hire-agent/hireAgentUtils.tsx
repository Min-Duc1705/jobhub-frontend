import React from 'react';
import { Tag } from 'antd';
import { SyncOutlined, CheckCircleOutlined, PlayCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

export function getCampaignStatusTag(status: string) {
  switch (status) {
    case 'Active':    return <Tag color="processing" icon={<SyncOutlined spin />}>Đang tìm ứng viên</Tag>;
    case 'Completed': return <Tag color="success"    icon={<CheckCircleOutlined />}>Hoàn thành</Tag>;
    case 'Paused':    return <Tag color="warning"    icon={<PlayCircleOutlined />}>Tạm dừng</Tag>;
    default:          return <Tag color="default">{status}</Tag>;
  }
}

export function getConvStatusTag(status: string) {
  switch (status) {
    case 'Screening':              return <Tag color="purple">Sàng lọc sơ bộ</Tag>;
    case 'Passed':                 return <Tag color="success">Đạt vòng AI</Tag>;
    case 'PendingCandidateConfirm': return <Tag color="gold" icon={<ClockCircleOutlined />}>Chờ ứng viên xác nhận</Tag>;
    case 'Scheduled':              return <Tag color="cyan"  icon={<CheckCircleOutlined />}>Đã chốt lịch</Tag>;
    case 'Failed':                 return <Tag color="error">Không đạt</Tag>;
    default:                       return <Tag color="default">{status}</Tag>;
  }
}
