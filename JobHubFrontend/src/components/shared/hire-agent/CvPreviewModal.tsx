import React, { useMemo } from 'react';
import { Avatar, Button, Divider, Modal, Space, Tag, Tooltip, Typography } from 'antd';
import {
  CopyOutlined,
  FileTextOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { message } from '../../../utils/antd';
import type { IHireAgentConversation } from '../../../services/hire-agent-service';

const { Text, Title } = Typography;

interface CvPreviewModalProps {
  open: boolean;
  conversation: IHireAgentConversation | null;
  candidateName: string;
  onClose: () => void;
}

/**
 * Render cvText thành các đoạn có định dạng.
 * Dòng ALL CAPS hoặc có dấu ":" cuối → xem là tiêu đề section.
 */
const renderCvContent = (text: string) => {
  if (!text?.trim()) {
    return (
      <div style={{ textAlign: 'center', color: '#aaa', padding: '40px 0' }}>
        <FileTextOutlined style={{ fontSize: 32, marginBottom: 8 }} />
        <p>Không có nội dung CV.</p>
      </div>
    );
  }

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = (key: string) => {
    if (bulletBuffer.length === 0) return;
    elements.push(
      <ul key={`ul-${key}`} style={{ paddingLeft: 20, margin: '4px 0 12px' }}>
        {bulletBuffer.map((b, i) => (
          <li key={i} style={{ fontSize: 13.5, lineHeight: 1.7, color: '#d0d0d0' }}>
            {b}
          </li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushBullets(String(idx));
      return;
    }

    // Detect section heading: ALL CAPS or ends with ":"
    const isHeading =
      (trimmed === trimmed.toUpperCase() && trimmed.length > 2 && !/^\d/.test(trimmed)) ||
      (trimmed.endsWith(':') && trimmed.length < 60);

    // Detect bullet point
    const isBullet = /^[-•*▪]\s+/.test(trimmed) || /^\d+\.\s/.test(trimmed);

    if (isHeading) {
      flushBullets(String(idx));
      elements.push(
        <div key={idx} style={{ margin: '16px 0 6px' }}>
          <Text
            strong
            style={{
              fontSize: 13,
              color: '#a78bfa',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {trimmed.replace(/:$/, '')}
          </Text>
          <Divider style={{ margin: '6px 0', borderColor: '#3d3d5c' }} />
        </div>
      );
    } else if (isBullet) {
      bulletBuffer.push(trimmed.replace(/^[-•*▪]\s+/, '').replace(/^\d+\.\s/, ''));
    } else {
      flushBullets(String(idx));
      elements.push(
        <p key={idx} style={{ fontSize: 13.5, lineHeight: 1.75, color: '#d0d0d0', margin: '3px 0' }}>
          {trimmed}
        </p>
      );
    }
  });

  flushBullets('end');
  return elements;
};

export default function CvPreviewModal({
  open,
  conversation,
  candidateName,
  onClose,
}: CvPreviewModalProps) {
  const cvText = conversation?.cvText ?? '';

  const wordCount = useMemo(
    () => cvText.trim().split(/\s+/).filter(Boolean).length,
    [cvText]
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(cvText).then(() => {
      message.success('Đã sao chép nội dung CV!');
    });
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={760}
      centered
      destroyOnClose
      styles={{
        content: {
          background: '#1a1a2e',
          borderRadius: 16,
          padding: 0,
          overflow: 'hidden',
          border: '1px solid #2e2e4d',
        },
        header: { display: 'none' },
        body: { padding: 0 },
        mask: { backdropFilter: 'blur(4px)' },
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #3b0764 0%, #1e1b4b 100%)',
          padding: '20px 24px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          borderBottom: '1px solid #2e2e4d',
        }}
      >
        <Avatar
          size={48}
          icon={<UserOutlined />}
          style={{ background: 'rgba(167,139,250,0.2)', border: '2px solid #7c3aed' }}
        />
        <div style={{ flex: 1 }}>
          <Title level={5} style={{ color: '#fff', margin: 0, fontSize: 15 }}>
            {candidateName || 'Ứng viên'}
          </Title>
          <Space size={6} style={{ marginTop: 4 }}>
            <Tag
              icon={<FileTextOutlined />}
              color="purple"
              style={{ fontSize: 11, border: 'none' }}
            >
              CV được AI phân tích
            </Tag>
            {wordCount > 0 && (
              <Text style={{ fontSize: 11, color: '#888' }}>
                ~{wordCount} từ
              </Text>
            )}
          </Space>
        </div>
        <Space>
          <Tooltip title="Sao chép toàn bộ CV">
            <Button
              icon={<CopyOutlined />}
              size="small"
              onClick={handleCopy}
              style={{
                background: 'rgba(124,58,237,0.15)',
                border: '1px solid #7c3aed',
                color: '#a78bfa',
              }}
            >
              Copy
            </Button>
          </Tooltip>
          <Button
            type="text"
            onClick={onClose}
            style={{ color: '#888', fontWeight: 600, fontSize: 18, lineHeight: 1 }}
          >
            ×
          </Button>
        </Space>
      </div>

      {/* ── CV Content ── */}
      <div
        style={{
          padding: '20px 28px 28px',
          maxHeight: '70vh',
          overflowY: 'auto',
          background: '#1a1a2e',
        }}
        className="cv-preview-scroll"
      >
        {/* Raw text fallback notice */}
        <div
          style={{
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid #3d2b6b',
            borderRadius: 8,
            padding: '8px 14px',
            marginBottom: 16,
            fontSize: 12,
            color: '#888',
          }}
        >
          📄 Đây là nội dung văn bản CV mà AI đã trích xuất và sử dụng để phỏng vấn ứng viên.
        </div>

        <div style={{ fontFamily: "'Inter', sans-serif" }}>
          {renderCvContent(cvText)}
        </div>
      </div>
    </Modal>
  );
}
