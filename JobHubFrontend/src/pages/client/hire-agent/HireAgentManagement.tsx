import React, { useEffect, useRef, useState } from 'react';
import { Breadcrumb, Button, Col, Form, Row } from 'antd';
import { PlusOutlined, RobotOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import dayjs from 'dayjs';

import { useAppSelector } from '../../../redux/hooks';
import { getJobsApi } from '../../../services/job-service';
import {
  createCampaignApi,
  getCampaignsApi,
  getCampaignConversationsApi,
  type IHireAgentCampaign,
  type IHireAgentConversation,
} from '../../../services/hire-agent-service';
import { getChatHistoryApi, type IMessageDto } from '../../../services/chat-service';
import { getCustomerByIdApi } from '../../../services/customer-service';

// Shared sub-components
import StatisticsSummary from '../../../components/shared/hire-agent/StatisticCard';
import CampaignList from '../../../components/shared/hire-agent/CampaignList';
import CandidateList from '../../../components/shared/hire-agent/CandidateList';
import ScreeningChatWindow from '../../../components/shared/hire-agent/ScreeningChatWindow';
import CampaignLaunchModal from '../../../components/shared/hire-agent/CampaignLaunchModal';
import CvPreviewModal from '../../../components/shared/hire-agent/CvPreviewModal';

import './HireAgentManagement.scss';

export default function HireAgentManagement() {
  const { user } = useAppSelector((state: any) => state.auth);
  const [form] = Form.useForm();
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const selectedCampaignRef = useRef<IHireAgentCampaign | null>(null);

  // State
  const [campaigns, setCampaigns]                   = useState<IHireAgentCampaign[]>([]);
  const [jobs, setJobs]                             = useState<any[]>([]);
  const [campaignsLoading, setCampaignsLoading]     = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createLoading, setCreateLoading]           = useState(false);

  const [selectedCampaign, setSelectedCampaign]     = useState<IHireAgentCampaign | null>(null);
  const [conversations, setConversations]           = useState<IHireAgentConversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);

  const [selectedConversation, setSelectedConversation] = useState<IHireAgentConversation | null>(null);
  const [chatMessages, setChatMessages]             = useState<IMessageDto[]>([]);
  const [chatLoading, setChatLoading]               = useState(false);
  const [candidateNames, setCandidateNames]         = useState<Record<string, string>>({});

  // CV Preview modal
  const [cvPreviewConv, setCvPreviewConv]           = useState<IHireAgentConversation | null>(null);

  useEffect(() => { selectedCampaignRef.current = selectedCampaign; }, [selectedCampaign]);

  // ── Data loading ──────────────────────────────────────────────────────────────
  const loadCampaigns = async () => {
    setCampaignsLoading(true);
    try {
      const res = await getCampaignsApi();
      if (res.data) setCampaigns(res.data);
    } catch (err) { console.error(err); }
    finally { setCampaignsLoading(false); }
  };

  const loadJobs = async () => {
    if (!user?.id) return;
    try {
      const sp = new URLSearchParams({ pageNumber: '1', pageSize: '100', customerId: user.id, status: 'PUBLISHED' });
      const res = await getJobsApi(sp.toString());
      if (res.data?.result) setJobs(res.data.result);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadCampaigns(); loadJobs(); }, [user?.id]);

  // ── SignalR ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const token = localStorage.getItem('access_token');
    const socketUrl = import.meta.env.VITE_NOTIFICATION_SOCKET_URL || 'http://localhost:5008';

    const connection = new HubConnectionBuilder()
      .withUrl(`${socketUrl}/ws/chat`, { accessTokenFactory: () => token || '' })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('ReceiveMessage', (newMsg: IMessageDto) => {
      // Update active chat window
      setSelectedConversation((curr) => {
        if (curr?.conversationId === newMsg.conversationId) {
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            const updated = [...prev, newMsg].sort((a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix());
            setTimeout(() => {
              const container = chatBottomRef.current;
              if (container) {
                container.scrollTo({
                  top: container.scrollHeight,
                  behavior: 'smooth'
                });
              }
            }, 100);
            return updated;
          });
        }
        return curr;
      });

      // Update conversations list state
      setConversations((prevConvs) => {
        if (!prevConvs.some((c) => c.conversationId === newMsg.conversationId)) return prevConvs;
        const isSystem = newMsg.content?.startsWith('[HỆ THỐNG]') || newMsg.content?.startsWith('[SYSTEM]');
        const isScheduling = isSystem && newMsg.content.includes('đặt lịch hẹn phỏng vấn thành công');

        // Deferred server sync
        setTimeout(() => {
          if (selectedCampaignRef.current) {
            getCampaignConversationsApi(selectedCampaignRef.current.id).then((res) => {
              if (res.data) {
                setConversations(res.data);
                setSelectedConversation((curr) => {
                  if (curr) { const fresh = res.data!.find((c) => c.id === curr.id); if (fresh) return fresh; }
                  return curr;
                });
              }
            });
          }
        }, 1500);

        return prevConvs.map((conv) => {
          if (conv.conversationId !== newMsg.conversationId) return conv;
          const updated = { ...conv };
          if (isScheduling) {
            updated.status = 'Scheduled';
            const m = newMsg.content.match(/vào lúc\s+(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})/);
            if (m?.[1]) {
              const [d, mo, y] = m[1].split(' ')[0].split('/');
              const t = m[1].split(' ')[1];
              const parsed = dayjs(`${y}-${mo}-${d}T${t}`);
              if (parsed.isValid()) updated.interviewDate = parsed.toISOString();
            }
            setSelectedConversation((curr) => {
              if (curr?.conversationId === newMsg.conversationId)
                return { ...curr, status: 'Scheduled', interviewDate: updated.interviewDate };
              return curr;
            });
          }
          return updated;
        });
      });
    });

    connection.start().catch((err) => console.error('SignalR error:', err));
    return () => { connection.stop(); };
  }, [user?.id]);

  // ── Event handlers ────────────────────────────────────────────────────────────
  const handleSelectCampaign = async (campaign: IHireAgentCampaign) => {
    setSelectedCampaign(campaign);
    setSelectedConversation(null);
    setChatMessages([]);
    setConversationsLoading(true);
    try {
      const res = await getCampaignConversationsApi(campaign.id);
      if (res.data) {
        setConversations(res.data);
        res.data.forEach((c) => fetchCandidateName(c.candidateId));
      }
    } catch (err) { console.error(err); }
    finally { setConversationsLoading(false); }
  };

  const fetchCandidateName = async (id: string) => {
    if (candidateNames[id]) return;
    try {
      const res = await getCustomerByIdApi(id);
      if (res.data?.fullName)
        setCandidateNames((prev) => ({ ...prev, [id]: res.data.fullName || 'Candidate' }));
    } catch {
      setCandidateNames((prev) => ({ ...prev, [id]: `Ứng viên (${id.slice(0, 6)})` }));
    }
  };

  const handleSelectConversation = async (conv: IHireAgentConversation) => {
    setSelectedConversation(conv);
    setChatLoading(true);
    try {
      const res = await getChatHistoryApi(conv.conversationId, 100);
      if (res.data)
        setChatMessages([...res.data].sort((a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix()));
    } catch (err) { console.error(err); }
    finally {
      setChatLoading(false);
      setTimeout(() => {
        const container = chatBottomRef.current;
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  const handleCreateCampaign = async (values: any) => {
    const job = jobs.find((j) => j.id === values.jobId);
    if (!job) return;
    setCreateLoading(true);
    try {
      await createCampaignApi({
        jobId: values.jobId,
        jobName: job.name,
        jobDescription: job.description || job.name,
        targetCount: values.targetCount,
      });
      setCreateModalVisible(false);
      form.resetFields();
      loadCampaigns();
    } catch (err) { console.error(err); }
    finally { setCreateLoading(false); }
  };

  // ── Derived ───────────────────────────────────────────────────────────────────
  const totalCampaigns     = campaigns.length;
  const activeCampaigns    = campaigns.filter((c) => c.status === 'Active').length;
  const completedCampaigns = campaigns.filter((c) => c.status === 'Completed').length;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="hire-agent-page">
      {/* Breadcrumb */}
      <Breadcrumb className="page-breadcrumb">
        <Breadcrumb.Item><Link to="/hr/jobs">Quản lý Jobs</Link></Breadcrumb.Item>
        <Breadcrumb.Item>AI Recruiter</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div className="page-header">
        <div className="page-header__title">
          <div className="title-icon"><RobotOutlined /></div>
          <div>
            <h2>AI Recruiter (HireAgent)</h2>
            <p>Tự động hóa tìm kiếm ứng viên, nhắn tin tiếp cận &amp; phỏng vấn sơ bộ thông minh.</p>
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          className="launch-btn"
          onClick={() => setCreateModalVisible(true)}
        >
          Kích hoạt Chiến dịch AI
        </Button>
      </div>

      {/* Stats */}
      <StatisticsSummary
        totalCampaigns={totalCampaigns}
        activeCampaigns={activeCampaigns}
        completedCampaigns={completedCampaigns}
      />

      {/* Main panel */}
      <Row gutter={[20, 20]} className="main-panel">
        {/* Campaign list */}
        <Col xs={24} md={9}>
          <CampaignList
            campaigns={campaigns}
            campaignsLoading={campaignsLoading}
            selectedCampaign={selectedCampaign}
            onSelectCampaign={handleSelectCampaign}
            onRefresh={loadCampaigns}
          />
        </Col>

        {/* Right side: empty state or candidate + chat */}
        <Col xs={24} md={15}>
          {!selectedCampaign ? (
            <div className="empty-panel">
              <div style={{ textAlign: 'center' }}>
                <div className="empty-panel__icon"><RobotOutlined /></div>
                <p>Chọn một chiến dịch để theo dõi tiến độ &amp; xem hội thoại phỏng vấn ảo của ứng viên.</p>
              </div>
            </div>
          ) : (
            <Row gutter={[14, 14]} style={{ height: '100%' }}>
              <Col xs={24} sm={10} style={{ height: '100%' }}>
                <CandidateList
                  conversations={conversations}
                  conversationsLoading={conversationsLoading}
                  selectedConversation={selectedConversation}
                  candidateNames={candidateNames}
                  selectedCampaign={selectedCampaign}
                  onSelectConversation={handleSelectConversation}
                  onViewCv={(conv) => setCvPreviewConv(conv)}
                  onRefresh={() => handleSelectCampaign(selectedCampaign)}
                />
              </Col>
              <Col xs={24} sm={14} style={{ height: '100%' }}>
                <ScreeningChatWindow
                  selectedConversation={selectedConversation}
                  chatMessages={chatMessages}
                  chatLoading={chatLoading}
                  candidateNames={candidateNames}
                  chatBottomRef={chatBottomRef}
                  onRefresh={() => selectedConversation && handleSelectConversation(selectedConversation)}
                />
              </Col>
            </Row>
          )}
        </Col>
      </Row>

      {/* Launch modal */}
      <CampaignLaunchModal
        visible={createModalVisible}
        loading={createLoading}
        jobs={jobs}
        form={form}
        onCancel={() => setCreateModalVisible(false)}
        onFinish={handleCreateCampaign}
      />

      {/* CV Preview modal */}
      <CvPreviewModal
        open={!!cvPreviewConv}
        conversation={cvPreviewConv}
        candidateName={cvPreviewConv ? (candidateNames[cvPreviewConv.candidateId] || 'Ứng viên') : ''}
        onClose={() => setCvPreviewConv(null)}
      />
    </div>
  );
}
