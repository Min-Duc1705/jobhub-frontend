import React, { Fragment, useState } from 'react';
import { Button, Card, DatePicker, Modal, Spin, Tag, Tooltip, Typography, message as antMessage } from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RobotOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { IHireAgentConversation } from '../../../services/hire-agent-service';
import { scheduleInterviewApi } from '../../../services/hire-agent-service';
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
      
      // Tự động chuyển đổi localhost sang origin hiện tại
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
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [scheduling, setScheduling] = useState(false);

  const handleScheduleSubmit = async () => {
    if (!selectedDate || !selectedConversation) return;
    if (selectedDate.isBefore(dayjs())) {
      antMessage.error('Vui lòng chọn thời gian trong tương lai.');
      return;
    }
    try {
      setScheduling(true);
      await scheduleInterviewApi(
        selectedConversation.campaignId,
        selectedConversation.candidateId,
        selectedDate.toISOString()
      );
      antMessage.success(`Đã gửi đề xuất lịch phỏng vấn ${selectedDate.format('DD/MM/YYYY HH:mm')} tới ứng viên!`);
      setScheduleModalOpen(false);
      setSelectedDate(null);
      onRefresh();
    } catch {
      antMessage.error('Có lỗi xảy ra khi gửi đề xuất lịch. Vui lòng thử lại.');
    } finally {
      setScheduling(false);
    }
  };

  return (
    <>
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
            <div ref={chatBottomRef} className="chat-messages-canvas">
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
            </div>

            {/* ── Footer status bar ── */}
            <div className="chat-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Trạng thái:
                  </Text>
                  {getConvStatusTag(selectedConversation.status)}
                </div>
                {selectedConversation.matchingScore !== undefined && selectedConversation.matchingScore > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      AI Match:
                    </Text>
                    <Tag 
                      color={selectedConversation.matchingScore >= 70 ? 'success' : selectedConversation.matchingScore >= 50 ? 'warning' : 'default'} 
                      style={{ fontSize: 11, margin: 0 }}
                    >
                      {selectedConversation.matchingScore.toFixed(1)}%
                    </Tag>
                  </div>
                )}
              </div>

              {/* HR: Passed → nút Đặt lịch */}
              {selectedConversation.status === 'Passed' && (
                <Tooltip title="HR chọn ngày phỏng vấn và gửi đề xuất cho ứng viên xác nhận">
                  <Button
                    type="primary"
                    size="small"
                    icon={<CalendarOutlined />}
                    onClick={() => setScheduleModalOpen(true)}
                    style={{ fontSize: 12 }}
                  >
                    📅 Đặt lịch phỏng vấn
                  </Button>
                </Tooltip>
              )}

              {/* PendingCandidateConfirm → đang chờ candidate xác nhận */}
              {selectedConversation.status === 'PendingCandidateConfirm' && (
                <Tooltip title="Đã gửi đề xuất lịch, đang chờ ứng viên xác nhận">
                  <span
                    style={{
                      fontSize: 12,
                      color: '#d48806',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <ClockCircleOutlined />
                    {selectedConversation.interviewDate
                      ? `Đề xuất: ${dayjs(selectedConversation.interviewDate).format('DD/MM/YYYY HH:mm')} — Chờ xác nhận`
                      : 'Chờ ứng viên xác nhận'}
                  </span>
                </Tooltip>
              )}

              {/* Scheduled → đã chốt lịch chính thức */}
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

      {/* Modal HR chọn ngày phỏng vấn */}
      <Modal
        title={
          <span>
            <CalendarOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            Đặt lịch phỏng vấn cho {selectedConversation ? candidateNames[selectedConversation.candidateId] || 'ứng viên' : 'ứng viên'}
          </span>
        }
        open={scheduleModalOpen}
        onCancel={() => { setScheduleModalOpen(false); setSelectedDate(null); }}
        onOk={handleScheduleSubmit}
        okText="Gửi đề xuất lịch"
        cancelText="Hủy"
        confirmLoading={scheduling}
        okButtonProps={{ disabled: !selectedDate }}
      >
        <div style={{ marginBottom: 16, color: '#595959', fontSize: 13 }}>
          Chọn ngày và giờ phỏng vấn. Hệ thống sẽ gửi thông báo đến ứng viên để xác nhận. Email chính thức chỉ được gửi sau khi ứng viên đồng ý.
        </div>
        <DatePicker
          showTime={{ format: 'HH:mm', minuteStep: 15 }}
          format="DD/MM/YYYY HH:mm"
          size="large"
          placeholder="Chọn ngày và giờ phỏng vấn"
          style={{ width: '100%' }}
          disabledDate={(current) => current && current.isBefore(dayjs().startOf('day'))}
          value={selectedDate}
          onChange={(date) => setSelectedDate(date)}
        />
      </Modal>
    </>
  );
}
