import React from 'react';
import { Button, Card, List, Spin, Empty, Typography } from 'antd';
import { PlayCircleOutlined, SyncOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { IHireAgentCampaign } from '../../../services/hire-agent-service';
import { getCampaignStatusTag } from './hireAgentUtils';

const { Text } = Typography;

interface CampaignListProps {
  campaigns: IHireAgentCampaign[];
  campaignsLoading: boolean;
  selectedCampaign: IHireAgentCampaign | null;
  onSelectCampaign: (campaign: IHireAgentCampaign) => void;
  onRefresh: () => void;
}

export default function CampaignList({
  campaigns,
  campaignsLoading,
  selectedCampaign,
  onSelectCampaign,
  onRefresh,
}: CampaignListProps) {
  return (
    <Card
      className="campaign-card"
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PlayCircleOutlined style={{ color: '#1890ff' }} />
          Chiến dịch của bạn
        </span>
      }
      extra={
        <Button
          icon={<SyncOutlined />}
          onClick={onRefresh}
          type="text"
          size="small"
        />
      }
      bordered={false}
    >
      {campaignsLoading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      ) : campaigns.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Chưa có chiến dịch nào. Tạo mới để AI tự tìm ứng viên!"
          style={{ padding: '60px 20px' }}
        />
      ) : (
        <List
          dataSource={campaigns}
          renderItem={(item) => (
            <List.Item
              onClick={() => onSelectCampaign(item)}
              className={`campaign-item ${selectedCampaign?.id === item.id ? 'selected' : ''}`}
            >
              <div style={{ width: '100%' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <Text className="ci-name">{item.jobName}</Text>
                  {getCampaignStatusTag(item.status)}
                </div>
                <div className="ci-meta">
                  <span>Mục tiêu: {item.targetCount} ứng viên</span>
                  <span>{dayjs(item.createdAt).format('DD/MM/YY HH:mm')}</span>
                </div>
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
