import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, DatePicker, Button, Result, Typography, Spin, Row, Col, Space, Divider, Alert, message, Avatar } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, InfoCircleOutlined, UserOutlined, RobotOutlined, ArrowLeftOutlined, MessageOutlined } from '@ant-design/icons';
import { getCampaignByIdApi, scheduleInterviewApi, getMyConversationApi } from '../../../services/hire-agent-service';
import type { IHireAgentCampaign, IHireAgentConversation } from '../../../services/hire-agent-service';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export default function ScheduleInterview() {
  const { campaignId } = useParams<{ campaignId: string }>();
  
  const [campaign, setCampaign] = useState<IHireAgentCampaign | null>(null);
  const [conversation, setConversation] = useState<IHireAgentConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [successData, setSuccessData] = useState<{ interviewDate: string } | null>(null);

  // Load Campaign and Conversation details
  useEffect(() => {
    const fetchData = async () => {
      if (!campaignId) return;
      try {
        setLoading(true);
        const campaignRes = await getCampaignByIdApi(campaignId);
        if (campaignRes.data) {
          setCampaign(campaignRes.data);
        }

        try {
          const convRes = await getMyConversationApi(campaignId);
          if (convRes.data) {
            setConversation(convRes.data);
          }
        } catch (convErr) {
          console.warn('Lỗi khi lấy thông tin hội thoại ứng viên:', convErr);
        }
      } catch (err: any) {
        console.error('Lỗi khi lấy thông tin chiến dịch:', err);
        message.error('Không thể tải thông tin chiến dịch tuyển dụng.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [campaignId]);

  // Handle scheduling submit
  const handleSchedule = async () => {
    if (!campaignId || !selectedDate) {
      message.warning('Vui lòng chọn ngày và giờ phỏng vấn.');
      return;
    }

    // Disable past times
    if (selectedDate.isBefore(dayjs())) {
      message.error('Vui lòng chọn thời gian trong tương lai.');
      return;
    }

    try {
      setScheduling(true);
      const isoString = selectedDate.toISOString();
      const res = await scheduleInterviewApi(campaignId, isoString);
      if (res.data) {
        setSuccessData({
          interviewDate: selectedDate.format('DD/MM/YYYY HH:mm')
        });
        message.success('Đặt lịch hẹn phỏng vấn thành công!');
      }
    } catch (err: any) {
      console.error('Lỗi khi đặt lịch hẹn phỏng vấn:', err);
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch hẹn phỏng vấn. Vui lòng thử lại.');
    } finally {
      setScheduling(false);
    }
  };

  // Date range limitation: disable past dates
  const disabledDate = (current: Dayjs) => {
    return current && current.isBefore(dayjs().startOf('day'));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Spin size="large" tip="Đang tải thông tin phỏng vấn..." />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ padding: '60px 20px', maxWidth: 600, margin: '0 auto' }}>
        <Result
          status="warning"
          title="Không tìm thấy thông tin phỏng vấn"
          subTitle="Liên kết đặt lịch hẹn này có thể đã hết hạn hoặc không tồn tại."
          extra={[
            <Button type="primary" key="home">
              <Link to="/jobs">Về trang Tìm việc làm</Link>
            </Button>
          ]}
        />
      </div>
    );
  }

  if (conversation && conversation.status === 'Scheduled') {
    const formattedDate = conversation.interviewDate
      ? dayjs(conversation.interviewDate).format('DD/MM/YYYY HH:mm')
      : 'Chưa rõ';

    return (
      <div style={{ padding: '60px 20px', maxWidth: 650, margin: '0 auto' }}>
        <Card 
          bordered={false} 
          style={{ 
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)', 
            borderRadius: 16,
            overflow: 'hidden'
          }}
        >
          <Result
            status="info"
            title={<Title level={3}>Bạn đã đặt lịch phỏng vấn!</Title>}
            subTitle={
              <div style={{ fontSize: 16 }}>
                Bạn đã đặt lịch hẹn thành công cho vị trí{' '}
                <Text strong style={{ color: '#096dd9' }}>{campaign.jobName}</Text>.
              </div>
            }
            extra={[
              <Card 
                key="details"
                style={{ 
                  backgroundColor: '#e6f7ff', 
                  border: '1px solid #91d5ff', 
                  borderRadius: 12,
                  marginBottom: 24,
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <CalendarOutlined style={{ fontSize: 24, color: '#1890ff', marginTop: 4 }} />
                  <div>
                    <div style={{ fontSize: 14, color: '#8c8c8c' }}>Thời gian đã hẹn:</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#2f54eb' }}>{formattedDate}</div>
                    <div style={{ fontSize: 13, color: '#e62f2f', marginTop: 8, fontWeight: 500 }}>
                      * Liên kết đặt lịch này đã được sử dụng và bị vô hiệu hóa. 
                    </div>
                    <div style={{ fontSize: 13, color: '#595959', marginTop: 4 }}>
                      Nếu bạn muốn đổi lịch, vui lòng quay lại khung chat và nhắn tin với nội dung <Text code>đổi lịch</Text> để nhận liên kết mới.
                    </div>
                  </div>
                </div>
              </Card>,
              <Space key="actions" size="middle">
                <Button type="primary" size="large" icon={<MessageOutlined />}>
                  <Link to="/chat">Vào khung chat</Link>
                </Button>
                <Button size="large">
                  <Link to="/jobs">Về trang Tìm việc làm</Link>
                </Button>
              </Space>
            ]}
          />
        </Card>
      </div>
    );
  }

  if (successData) {
    return (
      <div style={{ padding: '40px 20px', maxWidth: 650, margin: '0 auto' }}>
        <Card 
          bordered={false} 
          style={{ 
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)', 
            borderRadius: 16,
            overflow: 'hidden'
          }}
        >
          <Result
            status="success"
            title={<Title level={3}>Đặt lịch phỏng vấn thành công!</Title>}
            subTitle={
              <div style={{ fontSize: 16 }}>
                Chúc mừng bạn đã hoàn thành chốt lịch hẹn phỏng vấn vị trí{' '}
                <Text strong style={{ color: '#096dd9' }}>{campaign.jobName}</Text>.
              </div>
            }
            extra={[
              <Card 
                key="details"
                style={{ 
                  backgroundColor: '#f6ffed', 
                  border: '1px solid #b7eb8f', 
                  borderRadius: 12,
                  marginBottom: 24,
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <CalendarOutlined style={{ fontSize: 24, color: '#52c41a', marginTop: 4 }} />
                  <div>
                    <div style={{ fontSize: 14, color: '#8c8c8c' }}>Thời gian đã chọn:</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#2f54eb' }}>{successData.interviewDate}</div>
                    <div style={{ fontSize: 13, color: '#595959', marginTop: 4 }}>
                      * Hệ thống đã tự động gửi tin nhắn xác nhận lịch hẹn vào khung chat của bạn.
                    </div>
                  </div>
                </div>
              </Card>,
              <Space key="actions" size="middle">
                <Button type="primary" size="large" icon={<MessageOutlined />}>
                  <Link to="/chat">Vào khung chat</Link>
                </Button>
                <Button size="large">
                  <Link to="/jobs">Xem các công việc khác</Link>
                </Button>
              </Space>
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '45px 20px', maxWidth: 700, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Link to="/chat" style={{ color: '#8c8c8c', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <ArrowLeftOutlined /> Trở lại hội thoại chat
        </Link>
        
        <Card 
          bordered={false}
          style={{ 
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)', 
            borderRadius: 16,
            padding: '12px'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Avatar 
              size={64} 
              icon={<RobotOutlined />} 
              style={{ backgroundColor: '#e6f7ff', color: '#1890ff', marginBottom: 16 }} 
            />
            <Title level={2} style={{ margin: 0 }}>Đặt lịch phỏng vấn chính thức</Title>
            <Paragraph style={{ color: '#8c8c8c', fontSize: 15, marginTop: 8 }}>
              Chúc mừng bạn đã xuất sắc vượt qua cuộc phỏng vấn sàng lọc sơ bộ với JobHub AI Agent. Hãy chọn thời gian thích hợp nhất để trao đổi trực tiếp với nhà tuyển dụng của chúng tôi.
            </Paragraph>
          </div>

          <Divider />

          {/* Job Details Card */}
          <Card 
            title={
              <Space>
                <RobotOutlined style={{ color: '#1890ff' }} />
                <span>Chi tiết cơ hội việc làm</span>
              </Space>
            }
            bordered={false}
            style={{ backgroundColor: '#fafafa', borderRadius: 12, marginBottom: 28 }}
          >
            <Row gutter={[16, 12]}>
              <Col span={24}>
                <div style={{ fontSize: 13, color: '#8c8c8c' }}>Vị trí ứng tuyển:</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#262626' }}>{campaign.jobName}</div>
              </Col>
              <Col span={24}>
                <div style={{ fontSize: 13, color: '#8c8c8c' }}>Hình thức phỏng vấn:</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: '#595959' }}>
                  Online (Link phòng họp trực tuyến sẽ được gửi trong box chat 10 phút trước buổi phỏng vấn)
                </div>
              </Col>
            </Row>
          </Card>

          {/* Time Selection */}
          <div style={{ marginBottom: 32 }}>
            <Title level={4} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarOutlined style={{ color: '#1890ff' }} />
              Chọn ngày và giờ phỏng vấn
            </Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <DatePicker 
                showTime={{ 
                  format: 'HH:mm',
                  minuteStep: 15,
                  hideDisabledOptions: true
                }}
                format="YYYY-MM-DD HH:mm"
                size="large"
                placeholder="Chọn ngày và giờ"
                style={{ width: '100%', height: 48, borderRadius: 8 }}
                disabledDate={disabledDate}
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
              />
              <Text type="secondary" style={{ fontSize: 13 }}>
                * Vui lòng chuẩn bị kết nối mạng ổn định, tai nghe và camera trong suốt buổi phỏng vấn.
              </Text>
            </Space>
          </div>

          {/* Alert Instructions */}
          <Alert
            message="Thông tin hướng dẫn"
            description="Sau khi chốt lịch, hệ thống sẽ tự động cập nhật lịch làm việc với Phòng Nhân sự. Bạn sẽ nhận được email nhắc lịch và link phòng họp trực tuyến 24h trước khi diễn ra."
            type="info"
            showIcon
            style={{ borderRadius: 12, marginBottom: 32 }}
          />

          {/* Actions */}
          <Button 
            type="primary" 
            size="large" 
            block
            loading={scheduling}
            onClick={handleSchedule}
            style={{ 
              height: 50, 
              borderRadius: 8, 
              fontSize: 16, 
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.2)'
            }}
          >
            Xác nhận đặt lịch hẹn phỏng vấn
          </Button>
        </Card>
      </Space>
    </div>
  );
}
