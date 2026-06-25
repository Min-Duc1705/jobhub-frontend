import React from 'react';
import { Card, Row, Col, Button, Input, Form, Collapse, Timeline, message } from 'antd';
import { 
  CustomerServiceOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  QuestionCircleOutlined, 
  SendOutlined,
  ClockCircleOutlined 
} from '@ant-design/icons';

const { TextArea } = Input;
const { Panel } = Collapse;

export default function SupportPage() {
  const [form] = Form.useForm();

  const handleSubmit = () => {
    message.success('Gửi yêu cầu hỗ trợ thành công! Đội ngũ IT sẽ phản hồi qua email trong vòng 24h.');
    form.resetFields();
  };

  const faqs = [
    {
      q: 'Làm thế nào để cấp quyền (Permissions) cho một vai trò (Role)?',
      a: 'Bạn vào mục Hệ thống > Roles, nhấn vào nút Chỉnh sửa của vai trò mong muốn và tích chọn các quyền hạn tương ứng được liệt kê, sau đó nhấn Lưu cấu hình.'
    },
    {
      q: 'Tôi phải làm gì khi kết nối AI Assistant bị gián đoạn (Quota 429)?',
      a: 'Hệ thống đã tự động cấu hình cơ chế xoay vòng (rotating) các API Key của Gemini. Nếu tất cả key đều bị quá tải, vui lòng kiểm tra danh sách API keys tại file cấu hình hoặc liên hệ bộ phận DevOps để bổ sung key mới.'
    },
    {
      q: 'Tại sao tin tuyển dụng mới tạo không hiển thị ngoài trang chủ client?',
      a: 'Tin tuyển dụng cần được kích hoạt ở trạng thái "Active" và không bị vi phạm các chính sách kiểm duyệt. Hãy kiểm tra trạng thái tin tuyển dụng trong danh sách Quản lý Tin tuyển dụng.'
    },
    {
      q: 'Làm cách nào để đồng bộ dữ liệu cache Redis?',
      a: 'Khi có thay đổi lớn về phân quyền hoặc cấu hình hệ thống, Redis sẽ tự động cập nhật. Trong trường hợp cần ép buộc đồng bộ, hãy nhấn nút "Đồng bộ Cache" trong mục Cài đặt hệ thống.'
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#1f2937', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CustomerServiceOutlined style={{ color: '#1890ff' }} /> Trung tâm Hỗ trợ Kỹ thuật Admin
        </h1>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>
          Hỗ trợ vận hành, xử lý sự cố hệ thống và tiếp nhận các yêu cầu khẩn cấp từ ban quản trị JobHub.
        </p>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column: Form & FAQs */}
        <Col xs={24} lg={16}>
          {/* Support Ticket Form */}
          <Card 
            title={<span style={{ fontWeight: 600 }}><SendOutlined /> Gửi Yêu cầu Kỹ thuật (Ticket)</span>}
            bordered={false} 
            style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px' }}
          >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item 
                    name="title" 
                    label="Tiêu đề yêu cầu" 
                    rules={[{ required: true, message: 'Vui lòng nhập tiêu đề yêu cầu!' }]}
                  >
                    <Input placeholder="Ví dụ: Lỗi đồng bộ dữ liệu ứng viên" size="large" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    name="priority" 
                    label="Mức độ ưu tiên" 
                    initialValue="medium"
                  >
                    <select className="ant-input ant-input-lg" style={{ width: '100%', height: '40px', borderRadius: '6px' }}>
                      <option value="low">Thấp (Chỉnh sửa UI/UX nhẹ)</option>
                      <option value="medium">Trung bình (Chức năng bị lỗi nhẹ)</option>
                      <option value="high">Cao (Lỗi chức năng cốt lõi)</option>
                      <option value="critical">Khẩn cấp (Sập dịch vụ/Lỗi database)</option>
                    </select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item 
                name="description" 
                label="Mô tả chi tiết sự cố" 
                rules={[{ required: true, message: 'Vui lòng nhập mô tả chi tiết!' }]}
              >
                <TextArea 
                  rows={5} 
                  placeholder="Mô tả các bước dẫn đến lỗi, thông báo lỗi cụ thể (nếu có) và ảnh hưởng của nó..." 
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" size="large" icon={<SendOutlined />} style={{ borderRadius: '6px' }}>
                  Gửi yêu cầu hỗ trợ
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* FAQs */}
          <Card 
            title={<span style={{ fontWeight: 600 }}><QuestionCircleOutlined /> Câu hỏi thường gặp (FAQs)</span>}
            bordered={false}
            style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            <Collapse ghost expandIconPosition="right">
              {faqs.map((faq, index) => (
                <Panel header={<strong style={{ color: '#374151' }}>{faq.q}</strong>} key={index}>
                  <p style={{ color: '#4b5563', lineHeight: '1.6' }}>{faq.a}</p>
                </Panel>
              ))}
            </Collapse>
          </Card>
        </Col>

        {/* Right Column: Contact Channels & System Status */}
        <Col xs={24} lg={8}>
          {/* Hotline / Live Support */}
          <Card 
            title={<span style={{ fontWeight: 600 }}>Kênh hỗ trợ trực tiếp</span>} 
            bordered={false}
            style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: '#e6f7ff', padding: '12px', borderRadius: '50%', color: '#1890ff', fontSize: '20px' }}>
                  <PhoneOutlined />
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#8c8c8c' }}>Hotline Kỹ thuật (24/7)</div>
                  <strong style={{ fontSize: '16px', color: '#262626' }}>1900 8198 (Ext 4)</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: '#f6ffed', padding: '12px', borderRadius: '50%', color: '#52c41a', fontSize: '20px' }}>
                  <MailOutlined />
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#8c8c8c' }}>Email hỗ trợ hệ thống</div>
                  <strong style={{ fontSize: '16px', color: '#262626' }}>support@jobhub.com</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: '#fff7e6', padding: '12px', borderRadius: '50%', color: '#fa8c16', fontSize: '20px' }}>
                  <ClockCircleOutlined />
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#8c8c8c' }}>Thời gian phản hồi cam kết (SLA)</div>
                  <strong style={{ fontSize: '15px', color: '#262626' }}>Tối đa 2 giờ đối với sự cố mức High</strong>
                </div>
              </div>
            </div>
          </Card>

          {/* System Health Status */}
          <Card 
            title={<span style={{ fontWeight: 600 }}>Trạng thái dịch vụ</span>} 
            bordered={false}
            style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            <Timeline>
              <Timeline.Item color="green">
                <div style={{ fontWeight: 600 }}>Auth & User Services</div>
                <div style={{ color: '#8c8c8c', fontSize: '12px' }}>Hoạt động bình thường - Sạch lỗi (Uptime 99.98%)</div>
              </Timeline.Item>
              <Timeline.Item color="green">
                <div style={{ fontWeight: 600 }}>Job & Company Services</div>
                <div style={{ color: '#8c8c8c', fontSize: '12px' }}>Hoạt động bình thường (Uptime 99.95%)</div>
              </Timeline.Item>
              <Timeline.Item color="green">
                <div style={{ fontWeight: 600 }}>AI Intelligence Service</div>
                <div style={{ color: '#8c8c8c', fontSize: '12px' }}>Đã cấu hình tự động xoay key. Phản hồi tốt.</div>
              </Timeline.Item>
              <Timeline.Item color="green">
                <div style={{ fontWeight: 600 }}>Notification & Telegram Bot</div>
                <div style={{ color: '#8c8c8c', fontSize: '12px' }}>Đã tối ưu hóa ngữ cảnh và trang trí. Đang hoạt động.</div>
              </Timeline.Item>
            </Timeline>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
