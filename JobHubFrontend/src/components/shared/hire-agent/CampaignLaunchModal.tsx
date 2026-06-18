import React from 'react';
import type { FormInstance } from 'antd';
import {
  Button,
  Form,
  InputNumber,
  Modal,
  Select,
  Space,
  Typography,
  DatePicker,
  Row,
  Col,
} from 'antd';
import { InfoCircleOutlined, RobotOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Job {
  id: string;
  name: string;
  description?: string;
  location?: string;
}

interface CampaignLaunchModalProps {
  visible: boolean;
  loading: boolean;
  jobs: Job[];
  form: FormInstance;
  onCancel: () => void;
  onFinish: (values: any) => void;
}

export default function CampaignLaunchModal({
  visible,
  loading,
  jobs,
  form,
  onCancel,
  onFinish,
}: CampaignLaunchModalProps) {
  return (
    <Modal
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
          <RobotOutlined style={{ color: '#722ed1' }} /> Kích hoạt AI Agent Tuyển Dụng
        </span>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      width={520}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ targetCount: 5 }}
      >
        <Form.Item
          name="jobId"
          label="Chọn vị trí tuyển dụng"
          rules={[{ required: true, message: 'Vui lòng chọn vị trí tuyển dụng' }]}
        >
          <Select placeholder="Chọn một tin tuyển dụng đang hoạt động" size="large">
            {jobs.map((job) => (
              <Select.Option key={job.id} value={job.id}>
                {job.name} ({job.location || 'Hà Nội'})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="targetCount"
          label="Số lượng ứng viên muốn mời phỏng vấn sơ bộ"
          rules={[{ required: true, message: 'Vui lòng nhập số lượng mục tiêu' }]}
        >
          <InputNumber min={1} max={50} style={{ width: '100%' }} size="large" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="interviewDate"
              label="Ngày phỏng vấn chính thức"
              rules={[{ required: true, message: 'Vui lòng chọn ngày phỏng vấn chính thức' }]}
            >
              <DatePicker
                showTime={{ format: 'HH:mm' }}
                format="DD/MM/YYYY HH:mm"
                style={{ width: '100%' }}
                size="large"
                placeholder="Chọn ngày & giờ"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="backupInterviewDate"
              label="Ngày phỏng vấn dự phòng"
              rules={[
                { required: true, message: 'Vui lòng chọn ngày phỏng vấn dự phòng' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || !getFieldValue('interviewDate')) {
                      return Promise.resolve();
                    }
                    if (value.isBefore(getFieldValue('interviewDate'))) {
                      return Promise.reject(new Error('Ngày dự phòng phải sau ngày chính thức'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <DatePicker
                showTime={{ format: 'HH:mm' }}
                format="DD/MM/YYYY HH:mm"
                style={{ width: '100%' }}
                size="large"
                placeholder="Chọn ngày & giờ"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Info box */}
        <div 
          className="modal-info-box"
          style={{
            marginTop: 14,
            background: 'linear-gradient(135deg, #f9f0ff 0%, #f0f4ff 100%)',
            padding: 14,
            borderRadius: 10,
            border: '1px solid #d3adf7',
          }}
        >
          {/* Header containing icon and title horizontally */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <InfoCircleOutlined 
              style={{
                color: '#722ed1',
                fontSize: 14,
                flexShrink: 0,
              }}
            />
            <Text 
              strong 
              style={{
                color: '#722ed1',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Quy trình AI Agent tự động:
            </Text>
          </div>
          {/* List starting below */}
          <ol style={{ paddingLeft: 18, margin: 0, fontSize: 12, color: 'rgba(0, 0, 0, 0.65)', lineHeight: 1.8 }}>
            <li>Quét và phân tích CV ứng viên trong Database.</li>
            <li>So khớp kỹ năng &amp; chấm điểm độ phù hợp với JD (từ 50/100 trở lên).</li>
            <li>Tự động nhắn tin qua Telegram mời ứng viên tham gia phỏng vấn sàng lọc.</li>
            <li>Trợ lý AI chat đặt 3–4 câu hỏi sàng lọc (lương, techstack, thời gian).</li>
            <li>Tự động đề xuất lịch hẹn và lịch dự phòng ngay khi ứng viên vượt vòng AI!</li>
          </ol>
        </div>

        <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                background: 'linear-gradient(90deg, #003a8c 0%, #0075d5 100%)',
                border: 0,
              }}
            >
              Bắt đầu Săn tìm
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
