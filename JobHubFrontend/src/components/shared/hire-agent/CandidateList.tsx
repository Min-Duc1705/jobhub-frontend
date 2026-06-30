import React from 'react';
import { Avatar, Button, Card, Empty, List, Space, Spin, Tag, Tooltip, Typography } from 'antd';
import { CalendarOutlined, FileTextOutlined, SyncOutlined, UserOutlined } from '@ant-design/icons';
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
  onViewCv: (conv: IHireAgentConversation) => void;
  onRefresh: () => void;
}

// Helper to parse date string as local time ignoring timezone offset/Z shift
const parseRawDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return dayjs();
  return dayjs(dateStr);
};

export default function CandidateList({
  conversations,
  conversationsLoading,
  selectedConversation,
  candidateNames,
  selectedCampaign,
  onSelectConversation,
  onViewCv,
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
          dataSource={[...conversations].sort((a, b) => {
            const scoreA = a.matchingScore ?? 0;
            const scoreB = b.matchingScore ?? 0;
            if (scoreB !== scoreA) return scoreB - scoreA;
            return dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix();
          })}
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
                    <Space size={6}>
                      {getConvStatusTag(conv.status)}
                      {conv.matchingScore !== undefined && conv.matchingScore > 0 && (
                        <Tag 
                          color={conv.matchingScore >= 70 ? 'success' : conv.matchingScore >= 50 ? 'warning' : 'default'} 
                          style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '16px' }}
                        >
                          Match: {conv.matchingScore.toFixed(0)}%
                        </Tag>
                      )}
                    </Space>
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
                        {parseRawDate(conv.interviewDate).format('DD/MM HH:mm')}
                      </Text>
                    )}
                  </Space>
                  <Space size={4}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {dayjs(conv.createdAt).format('HH:mm DD/MM')}
                    </Text>
                    <Tooltip title="Xem CV ứng viên" placement="left">
                      <Button
                        type="text"
                        size="small"
                        icon={<FileTextOutlined style={{ color: '#a78bfa' }} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewCv(conv);
                        }}
                        style={{ padding: '0 4px' }}
                      />
                    </Tooltip>
                  </Space>
                </div>
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
