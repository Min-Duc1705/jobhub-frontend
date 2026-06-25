import React, { useState } from 'react';
import { Card, Row, Col, Menu, Typography, Table, Tag, Divider, Alert } from 'antd';
import {
  BookOutlined,
  CompassOutlined,
  SecurityScanOutlined,
  ApiOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function DocsPage() {
  const [currentSection, setCurrentSection] = useState('intro');

  const menuItems = [
    { key: 'intro', icon: <CompassOutlined />, label: 'Giới thiệu hệ thống' },
    { key: 'rbac', icon: <SecurityScanOutlined />, label: 'Phân quyền & RBAC' },
    { key: 'ai', icon: <ApiOutlined />, label: 'Tích hợp Trợ lý AI' },
    { key: 'telegram', icon: <CustomerServiceOutlined />, label: 'Cấu hình Telegram Bot' },
  ];

  const columns = [
    { title: 'Module', dataIndex: 'module', key: 'module', render: (text: string) => <Tag color="blue">{text}</Tag> },
    { title: 'API Path', dataIndex: 'apiPath', key: 'apiPath', render: (text: string) => <code>{text}</code> },
    { title: 'Phương thức', dataIndex: 'method', key: 'method', render: (text: string) => <Tag color={text === 'GET' ? 'green' : 'orange'}>{text}</Tag> },
    { title: 'Mô tả quyền', dataIndex: 'desc', key: 'desc' },
  ];

  const permissionData = [
    { key: '1', module: 'USER', apiPath: '/api/v1/users', method: 'GET', desc: 'Xem danh sách tài khoản hệ thống' },
    { key: '2', module: 'COMPANY', apiPath: '/api/v1/companies', method: 'POST', desc: 'Đăng ký/Tạo mới doanh nghiệp' },
    { key: '3', module: 'JOB', apiPath: '/api/v1/jobs', method: 'DELETE', desc: 'Xóa tin tuyển dụng trên hệ thống' },
    { key: '4', module: 'PERMISSION', apiPath: '/api/v1/permissions', method: 'GET', desc: 'Truy vấn bảng phân quyền chi tiết' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1300px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#1f2937', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOutlined style={{ color: '#1890ff' }} /> Tài liệu Hướng dẫn Vận hành Hệ thống
        </h1>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>
          Tài liệu kỹ thuật nội bộ dành cho Quản trị viên (Admin) và Nhân viên vận hành JobHub.
        </p>
      </div>

      <Row gutter={24}>
        {/* Left Side: Sidebar Menu */}
        <Col xs={24} md={6}>
          <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'sticky', top: '24px' }}>
            <Menu
              mode="inline"
              selectedKeys={[currentSection]}
              onClick={(e) => setCurrentSection(e.key)}
              style={{ borderRight: 0 }}
              items={menuItems}
            />
          </Card>
        </Col>

        {/* Right Side: Document Content */}
        <Col xs={24} md={18}>
          <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', minHeight: '550px' }}>
            
            {currentSection === 'intro' && (
              <Typography>
                <Title level={2}>1. Giới thiệu Kiến trúc JobHub</Title>
                <Paragraph>
                  JobHub là nền tảng tuyển dụng thông minh được xây dựng theo kiến trúc **Microservices** hiện đại, kết hợp sức mạnh của trí tuệ nhân tạo (AI) để tối ưu hóa quá trình sàng lọc hồ sơ ứng viên và lên lịch phỏng vấn tự động.
                </Paragraph>
                
                <Title level={3}>Các Microservices chính:</Title>
                <ul>
                  <li><Text strong>AuthService</Text>: Quản lý đăng ký, đăng nhập, bảo mật JWT và cơ chế phân quyền (RBAC).</li>
                  <li><Text strong>JobService & CompanyService</Text>: Quản lý tin tuyển dụng, danh mục kỹ năng và thông tin doanh nghiệp.</li>
                  <li><Text strong>CVIntelligenceService (Python)</Text>: Phân tích CV bằng AI, trích xuất kỹ năng, dự đoán lương và điều phối Chatbot AI Assistant.</li>
                  <li><Text strong>NotificationService</Text>: Gửi OTP, thông báo Email, thông báo đẩy thời gian thực qua SignalR và quản lý Telegram Bot kết nối.</li>
                </ul>

                <Alert 
                  message="Môi trường Vận hành" 
                  description="Toàn bộ hệ thống được container hóa bằng Docker. Trong môi trường production, hãy đảm bảo các container giao tiếp nội bộ qua docker network được bảo mật tốt."
                  type="info"
                  showIcon
                  style={{ marginTop: '20px' }}
                />
              </Typography>
            )}

            {currentSection === 'rbac' && (
              <Typography>
                <Title level={2}>2. Cơ chế phân quyền dựa trên Vai trò (RBAC)</Title>
                <Paragraph>
                  Hệ thống áp dụng cơ chế phân quyền động. Mỗi tài khoản người dùng gắn với một **Role** (Vai trò), và mỗi Role chứa danh sách các **Permissions** (Quyền hạn). Mỗi quyền hạn tương ứng với một cặp **[Method + API Path]** cụ thể của backend.
                </Paragraph>
                
                <Divider />
                
                <Title level={4}>Bảng ví dụ ánh xạ quyền hạn:</Title>
                <Table dataSource={permissionData} columns={columns} pagination={false} size="middle" style={{ marginBottom: '24px' }} />

                <Alert 
                  message="Lưu ý về Bảo mật" 
                  description="Khi cấu hình quyền hạn mới, thay đổi sẽ có hiệu lực ngay lập tức đối với các request API. Token JWT của người dùng sẽ tự động cập nhật cache phân quyền lưu trên Redis khi họ thực hiện thao tác Refresh Token."
                  type="warning"
                  showIcon
                />
              </Typography>
            )}

            {currentSection === 'ai' && (
              <Typography>
                <Title level={2}>3. Tích hợp và cấu hình Trợ lý AI</Title>
                <Paragraph>
                  AI Assistant của JobHub sử dụng mô hình ngôn ngữ lớn **Gemini** (Google Generative AI) để trả lời thắc mắc, phân tích dữ liệu tuyển dụng và tự động gọi các tool hệ thống (Function Calling).
                </Paragraph>

                <Title level={3}>Cơ chế xoay vòng khóa API (Key Rotation)</Title>
                <Paragraph>
                  Để tránh lỗi giới hạn hạn ngạch (Quota 429), hệ thống tự động xoay vòng danh sách API keys được khai báo trong file cấu hình. Khi một key bị lỗi hoặc hết hạn ngạch, AI Assistant sẽ tự động chuyển sang key tiếp theo và thử lại request mà không làm gián đoạn trải nghiệm của người dùng.
                </Paragraph>

                <Title level={3}>Cấu trúc Payload Chat API:</Title>
                <pre style={{ background: '#f4f4f5', padding: '16px', borderRadius: '6px', border: '1px solid #e4e4e7', fontSize: '13px' }}>
{`POST /api/v1/assistant/chat
Headers:
  Authorization: Bearer <UserToken>
  X-Session-Id: <SessionGuid>
Payload:
{
  "message": "Tìm cho tôi ứng viên React Native có 3 năm kinh nghiệm",
  "conversation_history": [
    { "role": "user", "content": "Chào bạn" },
    { "role": "model", "content": "Chào bạn, tôi có thể giúp gì?" }
  ]
}`}
                </pre>
              </Typography>
            )}

            {currentSection === 'telegram' && (
              <Typography>
                <Title level={2}>4. Hướng dẫn cấu hình Telegram Bot</Title>
                <Paragraph>
                  Telegram Bot đóng vai trò là kênh nhận thông báo đẩy nhanh chóng (thông báo tin nhắn mới, cập nhật chiến dịch tuyển dụng, đổi lịch phỏng vấn) và cho phép người dùng chat trực tiếp với AI Assistant ngay trên Telegram.
                </Paragraph>

                <Title level={3}>Cấu hình Webhook cho Bot:</Title>
                <Paragraph>
                  Khi service khởi động, nó tự động đăng ký Webhook với máy chủ Telegram qua API `SetWebhookAsync`. Domain webhook được định nghĩa tại biến cấu hình:
                </Paragraph>
                <pre style={{ background: '#f4f4f5', padding: '16px', borderRadius: '6px', border: '1px solid #e4e4e7', fontSize: '13px' }}>
{`Telegram:
  BotToken: "YOUR_TELEGRAM_BOT_TOKEN"
  WebhookDomain: "https://your-domain.com"`}
                </pre>

                <Title level={3}>Quy tắc Reply trực tiếp:</Title>
                <Paragraph>
                  Để tin nhắn reply từ Telegram chuyển tiếp chính xác về cuộc hội thoại Web Chat, hệ thống đính kèm mã định danh <code>{'Ref: {senderId}'}</code> ở cuối mỗi tin nhắn thông báo đẩy. Bot sẽ parse mã này khi người dùng reply tin nhắn để xác định người nhận chính xác.
                </Paragraph>
              </Typography>
            )}

          </Card>
        </Col>
      </Row>
    </div>
  );
}
