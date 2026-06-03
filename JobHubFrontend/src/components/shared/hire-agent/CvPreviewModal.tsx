import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Avatar,
  Button,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  DownloadOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  GlobalOutlined,
  UserOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import type { IHireAgentConversation } from '../../../services/hire-agent-service';
import { getMyResumesApi } from '../../../services/resume-service';
import type { IResume } from '../../../types/resume-builder';

const { Text, Title } = Typography;

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || 'http://localhost:5000';

/** Fetch file preview qua API (có Bearer token) rồi trả blob URL */
async function fetchPreviewBlobUrl(resumeId: string): Promise<string> {
  const token = localStorage.getItem('access_token') ?? '';
  const res = await fetch(`${BACKEND_URL}/api/v1/resumes/${resumeId}/preview`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true',
    },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Preview API trả về ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/** Compact pill style helper for file type badges */
const pillStyle = (bg: string, color: string, border: string): React.CSSProperties => ({
  background: bg,
  color,
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 20,
  border: `1px solid ${border}`,
  whiteSpace: 'nowrap',
  flexShrink: 0,
});

function getFileIcon(resume: IResume) {
  if (resume.isOnlineCv) return <GlobalOutlined style={{ color: '#7c3aed' }} />;
  const url = resume.url?.toLowerCase() ?? '';
  if (url.endsWith('.pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
  if (url.endsWith('.docx') || url.endsWith('.doc'))
    return <FileWordOutlined style={{ color: '#1677ff' }} />;
  return <FileTextOutlined style={{ color: '#faad14' }} />;
}

function getFileTypeTag(resume: IResume) {
  if (resume.isOnlineCv)
    return (
      <Tag color="purple" style={{ fontSize: 11, border: 'none' }}>
        Online CV
      </Tag>
    );
  const url = resume.url?.toLowerCase() ?? '';
  if (url.endsWith('.pdf'))
    return (
      <Tag color="red" style={{ fontSize: 11, border: 'none' }}>
        PDF
      </Tag>
    );
  if (url.endsWith('.docx') || url.endsWith('.doc'))
    return (
      <Tag color="blue" style={{ fontSize: 11, border: 'none' }}>
        Word
      </Tag>
    );
  return null;
}

// ── Render Online CV từ contentJson ─────────────────────────────────────────

function OnlineCvViewer({ resume }: { resume: IResume }) {
  if (!resume.contentJson) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
        <GlobalOutlined style={{ fontSize: 40, marginBottom: 12 }} />
        <p>Không có dữ liệu nội dung CV này.</p>
      </div>
    );
  }

  let content: any = {};
  try {
    content = JSON.parse(resume.contentJson);
  } catch {
    return <p style={{ color: '#f87171', padding: 20 }}>Không đọc được nội dung CV.</p>;
  }

  const p = content.personal ?? {};

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        color: '#e5e7eb',
        lineHeight: 1.7,
        padding: '0 4px',
      }}
    >
      {/* Personal */}
      <div
        style={{
          background: 'linear-gradient(135deg,#3b0764,#1e1b4b)',
          borderRadius: 10,
          padding: '18px 20px',
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ color: '#fff', margin: 0 }}>
          {p.fullName || '—'}
        </Title>
        {p.title && (
          <Text style={{ color: '#c4b5fd', fontSize: 13 }}>{p.title}</Text>
        )}
        <div style={{ marginTop: 8, fontSize: 12, color: '#a78bfa' }}>
          {[p.email, p.phone, p.location].filter(Boolean).join(' · ')}
        </div>
        {p.summary && (
          <p style={{ fontSize: 12.5, color: '#d4d4f7', marginTop: 8 }}>{p.summary}</p>
        )}
      </div>

      {/* Experience */}
      {content.experiences?.length > 0 && (
        <Section title="Kinh nghiệm làm việc">
          {content.experiences.map((exp: any) => (
            <div key={exp.id} style={{ marginBottom: 12 }}>
              <Text strong style={{ color: '#e2e8f0', fontSize: 13 }}>
                {exp.position}
              </Text>{' '}
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>tại {exp.company}</Text>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                {exp.startDate} – {exp.endDate}
              </div>
              {exp.description && (
                <p style={{ fontSize: 12.5, color: '#cbd5e1', margin: '4px 0' }}>
                  {exp.description}
                </p>
              )}
              {exp.bullets?.length > 0 && (
                <ul style={{ paddingLeft: 18, margin: '4px 0' }}>
                  {exp.bullets.map((b: string, i: number) => (
                    <li key={i} style={{ fontSize: 12.5, color: '#cbd5e1' }}>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Education */}
      {content.education?.length > 0 && (
        <Section title="Học vấn">
          {content.education.map((edu: any) => (
            <div key={edu.id} style={{ marginBottom: 10 }}>
              <Text strong style={{ color: '#e2e8f0', fontSize: 13 }}>
                {edu.degree}
              </Text>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                {edu.school} · {edu.startYear}–{edu.endYear}
                {edu.gpa ? ` · GPA ${edu.gpa}` : ''}
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* Skills */}
      {content.skills?.length > 0 && (
        <Section title="Kỹ năng">
          {content.skills.map((sg: any) => (
            <div key={sg.id} style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>
                {sg.category}:
              </Text>{' '}
              <Text style={{ fontSize: 12, color: '#cbd5e1' }}>
                {sg.items?.join(', ')}
              </Text>
            </div>
          ))}
        </Section>
      )}

      {/* Projects */}
      {content.projects?.length > 0 && (
        <Section title="Dự án">
          {content.projects.map((pr: any) => (
            <div key={pr.id} style={{ marginBottom: 10 }}>
              <Text strong style={{ color: '#e2e8f0', fontSize: 13 }}>
                {pr.name}
              </Text>
              {pr.description && (
                <p style={{ fontSize: 12.5, color: '#cbd5e1', margin: '2px 0' }}>
                  {pr.description}
                </p>
              )}
              {pr.tags?.length > 0 && (
                <Space size={4} wrap style={{ marginTop: 4 }}>
                  {pr.tags.map((t: string) => (
                    <Tag key={t} style={{ fontSize: 11, background: '#1e1b4b', borderColor: '#4f46e5', color: '#a5b4fc' }}>
                      {t}
                    </Tag>
                  ))}
                </Space>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Certifications */}
      {content.certifications?.length > 0 && (
        <Section title="Chứng chỉ">
          {content.certifications.map((c: any) => (
            <div key={c.id} style={{ marginBottom: 6 }}>
              <Text style={{ color: '#e2e8f0', fontSize: 13 }}>{c.name}</Text>
              <Text style={{ color: '#64748b', fontSize: 12 }}>
                {' '}· {c.issuer}, {c.year}
              </Text>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          borderLeft: '3px solid #7c3aed',
          paddingLeft: 10,
          marginBottom: 8,
        }}
      >
        <Text
          strong
          style={{ fontSize: 12, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          {title}
        </Text>
      </div>
      {children}
    </div>
  );
}

// ── PDF / Word viewer ────────────────────────────────────────────────────────

function FileViewer({ resume }: { resume: IResume }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const prevUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setBlobUrl(null);

    fetchPreviewBlobUrl(resume.id)
      .then((url) => {
        if (!cancelled) {
          // Revoke old blob to avoid memory leak
          if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
          prevUrlRef.current = url;
          setBlobUrl(url);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? 'Không thể tải file CV.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resume.id]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 420, gap: 12 }}>
        <Spin size="large" />
        <Text style={{ color: '#888', fontSize: 13 }}>Đang tải file CV...</Text>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
        <FilePdfOutlined style={{ fontSize: 40, color: '#f87171', marginBottom: 12 }} />
        <p style={{ color: '#f87171' }}>Không thể xem trước file CV.</p>
        <p style={{ fontSize: 12 }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Zoom controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 6,
          padding: '6px 0 10px',
        }}
      >
        <Tooltip title="Thu nhỏ">
          <Button
            icon={<ZoomOutOutlined />}
            size="small"
            type="text"
            style={{ color: '#a78bfa' }}
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            disabled={zoom <= 50}
          />
        </Tooltip>
        <Text style={{ color: '#888', fontSize: 12, minWidth: 36, textAlign: 'center' }}>
          {zoom}%
        </Text>
        <Tooltip title="Phóng to">
          <Button
            icon={<ZoomInOutlined />}
            size="small"
            type="text"
            style={{ color: '#a78bfa' }}
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            disabled={zoom >= 200}
          />
        </Tooltip>
      </div>

      <div
        style={{
          overflow: 'auto',
          maxHeight: '62vh',
          border: '1px solid #2e2e4d',
          borderRadius: 8,
          background: '#fff',
        }}
      >
        <iframe
          src={blobUrl}
          title="CV Preview"
          style={{
            width: `${zoom}%`,
            minHeight: 600,
            border: 'none',
            display: 'block',
          }}
        />
      </div>
    </div>
  );
}

// ── Main Modal ───────────────────────────────────────────────────────────────

interface CvPreviewModalProps {
  open: boolean;
  conversation: IHireAgentConversation | null;
  candidateName: string;
  onClose: () => void;
}

export default function CvPreviewModal({
  open,
  conversation,
  candidateName,
  onClose,
}: CvPreviewModalProps) {
  const [resumes, setResumes]           = useState<IResume[]>([]);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  const selectedResume = resumes.find((r) => r.id === selectedResumeId) ?? null;

  // Fetch resumes khi mở modal
  useEffect(() => {
    if (!open || !conversation?.candidateId) return;
    setResumesLoading(true);
    setResumes([]);
    setSelectedResumeId(null);

    getMyResumesApi(conversation.candidateId)
      .then((res) => {
        const list = res.data?.result ?? [];
        setResumes(list);
        // Ưu tiên CV mặc định, nếu không có thì lấy CV đầu tiên
        const defaultCv = list.find((r) => r.isDefault) ?? list[0] ?? null;
        setSelectedResumeId(defaultCv?.id ?? null);
      })
      .catch(console.error)
      .finally(() => setResumesLoading(false));
  }, [open, conversation?.candidateId]);

  const handleDownload = useCallback(() => {
    if (!selectedResume) return;
    const token = localStorage.getItem('access_token') ?? '';
    const url = `${BACKEND_URL}/api/v1/resumes/${selectedResume.id}/download`;
    // Fetch rồi trigger download
    fetch(url, {
      headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      credentials: 'include',
    })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = selectedResume.title || 'CV';
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(console.error);
  }, [selectedResume]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={820}
      centered
      destroyOnClose
      styles={{
        content: {
          background: '#13111e',
          borderRadius: 16,
          padding: 0,
          overflow: 'hidden',
          border: '1px solid #2e2e4d',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
        },
        header: { display: 'none' },
        body: { padding: 0 },
        mask: { backdropFilter: 'blur(6px)' },
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #3b0764 0%, #1e1b4b 100%)',
          padding: '18px 24px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          borderBottom: '1px solid #2e2e4d',
        }}
      >
        <Avatar
          size={44}
          icon={<UserOutlined />}
          style={{ background: 'rgba(167,139,250,0.2)', border: '2px solid #7c3aed', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Title level={5} style={{ color: '#fff', margin: 0, fontSize: 15 }}>
            {candidateName || 'Ứng viên'}
          </Title>
          <Text style={{ fontSize: 12, color: '#a78bfa' }}>Hồ sơ CV</Text>
        </div>

        {/* CV selector dropdown */}
        {resumes.length > 1 && (
          <Select
            size="small"
            value={selectedResumeId}
            onChange={setSelectedResumeId}
            style={{ width: 200 }}
            options={resumes.map((r) => ({
              value: r.id,
              label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                  {getFileIcon(r)}
                  <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.title}
                  </span>
                  {r.isDefault && (
                    <span style={{ background: '#451a03', color: '#fcd34d', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, border: '1px solid #92400e', flexShrink: 0 }}>
                      ★
                    </span>
                  )}
                </div>
              ),
            }))}
          />
        )}

        {/* Actions */}
        <Space size={6}>
          {selectedResume && !selectedResume.isOnlineCv && (
            <Tooltip title="Tải xuống CV">
              <Button
                icon={<DownloadOutlined />}
                size="small"
                onClick={handleDownload}
                style={{
                  background: 'rgba(124,58,237,0.15)',
                  border: '1px solid #7c3aed',
                  color: '#a78bfa',
                }}
              />
            </Tooltip>
          )}
          <Button
            type="text"
            onClick={onClose}
            style={{ color: '#888', fontWeight: 700, fontSize: 18, lineHeight: 1, padding: '0 6px' }}
          >
            ×
          </Button>
        </Space>
      </div>

      {/* ── Body ── */}
      <div
        style={{
          padding: '16px 24px 24px',
          background: '#13111e',
          minHeight: 300,
        }}
      >
        {resumesLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
            <Spin size="large" />
            <Text style={{ color: '#888', fontSize: 13 }}>Đang tải danh sách CV...</Text>
          </div>
        ) : resumes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
            <FileTextOutlined style={{ fontSize: 44, marginBottom: 12, color: '#4f46e5' }} />
            <p style={{ fontSize: 14 }}>Ứng viên chưa có CV nào trong hệ thống.</p>
          </div>
        ) : (
          <>
            {/* CV info bar */}
            {selectedResume && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 12,
                  padding: '9px 14px',
                  background: 'rgba(124,58,237,0.08)',
                  borderRadius: 10,
                  border: '1px solid rgba(124,58,237,0.25)',
                }}
              >
                {/* File icon */}
                <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>
                  {getFileIcon(selectedResume)}
                </span>

                {/* Title */}
                <Text
                  ellipsis={{ tooltip: selectedResume.title }}
                  style={{ color: '#ddd6fe', fontSize: 13, fontWeight: 500, flex: 1, minWidth: 0 }}
                >
                  {selectedResume.title}
                </Text>

                {/* File type label */}
                {(() => {
                  if (selectedResume.isOnlineCv)
                    return <span style={pillStyle('#3b0764','#c4b5fd','#6d28d9')}>Online CV</span>;
                  const u = selectedResume.url?.toLowerCase() ?? '';
                  if (u.endsWith('.pdf'))
                    return <span style={pillStyle('#2d0a0a','#fca5a5','#7f1d1d')}>PDF</span>;
                  if (u.endsWith('.docx') || u.endsWith('.doc'))
                    return <span style={pillStyle('#0a1628','#93c5fd','#1e3a5f')}>Word</span>;
                  return null;
                })()}

                {/* Default: just a ★ star */}
                {selectedResume.isDefault && (
                  <span title="CV mặc định" style={{ color: '#fbbf24', fontSize: 14, lineHeight: 1, flexShrink: 0 }}>
                    ★
                  </span>
                )}
              </div>
            )}

            {/* Viewer */}
            {selectedResume?.isOnlineCv ? (
              <div
                style={{
                  maxHeight: '68vh',
                  overflowY: 'auto',
                  padding: '4px 2px',
                }}
              >
                <OnlineCvViewer resume={selectedResume} />
              </div>
            ) : selectedResume ? (
              <FileViewer resume={selectedResume} />
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}
