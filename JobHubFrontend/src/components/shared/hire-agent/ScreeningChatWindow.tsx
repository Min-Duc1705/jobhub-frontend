import React, { Fragment } from 'react';
import { Button, Card, Spin, Tooltip, Typography } from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  RobotOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { IHireAgentConversation } from '../../../services/hire-agent-service';
import type { IMessageDto } from '../../../services/chat-service';
import { getConvStatusTag } from './hireAgentUtils';

const renderContentWithLinks = (text: string, isMe: boolean) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      let href = part;
      let trailingPunctuation = '';
      const match = part.match(/([.,;:?!]+)$/);
      if (match) {
        trailingPunctuation = match[1];
        href = part.slice(0, -trailingPunctuation.length);
      }
      
      // Tự động chuyển đổi localhost sang origin hiện tại (Vercel hoặc bất kỳ tên miền nào khác)
      if (href.startsWith('http://localhost:5173')) {
        href = href.replace('http://localhost:5173', window.location.origin);
      } else if (href.startsWith('https://localhost:5173')) {
        href = href.replace('https://localhost:5173', window.location.origin);
      }

      return (
        <Fragment key={index}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: isMe ? '#91d5ff' : '#1890ff',
              textDecoration: 'underline',
              wordBreak: 'break-all'
            }}
          >
            {href}
          </a>
          {trailingPunctuation}
        </Fragment>
      );
    }
    return part;
  });
};

const { Paragraph, Text } = Typography;

interface ScreeningChatWindowProps {
  selectedConversation: IHireAgentConversation | null;
  chatMessages: IMessageDto[];
  chatLoading: boolean;
  candidateNames: Record<string, string>;
  chatBottomRef: React.RefObject<HTMLDivElement | null>;
  onRefresh: () => void;
}

export default function ScreeningChatWindow({
  selectedConversation,
  chatMessages,
  chatLoading,
  candidateNames,
  chatBottomRef,
  onRefresh,
}: ScreeningChatWindowProps) {
  return (
    <Card
      className="chat-card"
      title={
        selectedConversation ? (
          <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <RobotOutlined style={{ color: '#722ed1' }} />
            {candidateNames[selectedConversation.candidateId] || 'Ứng viên'}
          </span>
        ) : (
          <span style={{ fontSize: 13, color: '#aaa' }}>Hội thoại sàng lọc</span>
        )
      }
      extra={
        selectedConversation && (
          <Button
            icon={<SyncOutlined />}
            onClick={onRefresh}
            type="text"
            size="small"
          />
        )
      }
      bordered={false}
    >
      {/* ── No conversation selected ── */}
      {!selectedConversation ? (
        <div className="chat-placeholder">
          Chọn một ứng viên để xem cuộc trò chuyện sàng lọc do AI thực hiện.
        </div>
      ) : (
        <>
          {/* ── Messages canvas ── */}
          <div className="chat-messages-canvas">
            {chatLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin />
              </div>
            ) : chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>
                Chưa có tin nhắn nào.
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isSystem =
                  msg.content?.startsWith('[HỆ THỐNG]') ||
                  msg.content?.startsWith('[SYSTEM]');
                const isCandidate =
                  msg.senderId?.toLowerCase() ===
                  selectedConversation.candidateId?.toLowerCase();

                if (isSystem) {
                  return (
                    <div key={msg.id} className="system-msg">
                      <span>{renderContentWithLinks(msg.content, false)}</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`chat-bubble-row ${isCandidate ? 'left' : 'right'}`}
                  >
                    <div
                      className={`bubble ${
                        isCandidate ? 'bubble--candidate' : 'bubble--agent'
                      }`}
                    >
                      <Paragraph
                        style={{ margin: 0, fontSize: 13, whiteSpace: 'pre-wrap' }}
                      >
                        {renderContentWithLinks(msg.content, !isCandidate)}
                      </Paragraph>
                      <span className="bubble-time">
                        {dayjs(msg.createdAt).format('HH:mm')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* ── Footer status bar ── */}
          <div className="chat-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Trạng thái:
              </Text>
              {getConvStatusTag(selectedConversation.status)}
            </div>

            {selectedConversation.status === 'Passed' && (
              <Tooltip title="Link đặt lịch hẹn tự động được gửi qua chat box cho ứng viên.">
                <span
                  style={{
                    fontSize: 12,
                    color: '#52c41a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <CalendarOutlined /> Đang đợi chốt lịch
                </span>
              </Tooltip>
            )}

            {selectedConversation.status === 'Scheduled' && (
              <span
                style={{
                  fontSize: 12,
                  color: '#13c2c2',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <CheckCircleOutlined />
                {selectedConversation.interviewDate
                  ? dayjs(selectedConversation.interviewDate).format('DD/MM/YYYY HH:mm')
                  : 'Chưa xác định'}
              </span>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
