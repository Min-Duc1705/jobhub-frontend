import React from 'react';
import { Avatar, Button, Card, Empty, List, Space, Spin, Typography } from 'antd';
import { CalendarOutlined, SyncOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { IHireAgentCampaign, IHireAgentConversation } from '../../../services/hire-agent-service';
import { getConvStatusTag } from './hireAgentUtils';

const { Text } = Typography;

interface CandidateListProps {
  conversations: IHireAgentConversation[];
  conversationsLoading: boolean;
  selectedConversation: IHireAgentConversation | null;
  candidateNames: Record<string, string>;
  selectedCampaign: IHireAgentCampaign;
  onSelectConversation: (conv: IHireAgentConversation) => void;
  onRefresh: () => void;
}

export default function CandidateList({
  conversations,
  conversationsLoading,
  selectedConversation,
  candidateNames,
  selectedCampaign,
  onSelectConversation,
  onRefresh,
}: CandidateListProps) {
  return (
    <Card
      className="candidate-card"
      title={
        <span style={{ fontSize: 13 }}>
          Ứng viên ({conversations.length})
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
      {conversationsLoading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Spin />
        </div>
      ) : conversations.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="AI đang tìm kiếm ứng viên phù hợp..."
          style={{ padding: '40px 10px' }}
        />
      ) : (
        <List
          dataSource={conversations}
          renderItem={(conv) => (
            <List.Item
              onClick={() => onSelectConversation(conv)}
              className={`candidate-item ${selectedConversation?.id === conv.id ? 'selected' : ''}`}
            >
              <div style={{ width: '100%' }}>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <Avatar
                    size="small"
                    icon={<UserOutlined />}
                    style={{ background: '#722ed1' }}
                  />
                  <Text strong style={{ fontSize: 13 }}>
                    {candidateNames[conv.candidateId] || 'Đang tải...'}
                  </Text>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Space direction="vertical" size={2}>
                    {getConvStatusTag(conv.status)}
                    {conv.status === 'Scheduled' && conv.interviewDate && (
                      <Text
                        style={{
                          fontSize: 11,
                          color: '#13c2c2',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <CalendarOutlined />{' '}
                        {dayjs(conv.interviewDate).format('DD/MM HH:mm')}
                      </Text>
                    )}
                  </Space>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {dayjs(conv.createdAt).format('HH:mm DD/MM')}
                  </Text>
                </div>
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
