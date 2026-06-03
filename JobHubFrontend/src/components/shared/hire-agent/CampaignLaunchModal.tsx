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

        {/* Info box */}
        <div className="modal-info-box">
          <InfoCircleOutlined className="info-icon" />
          <div>
            <Text strong className="info-title">
              Quy trình AI Agent tự động:
            </Text>
            <ol>
              <li>Quét và phân tích CV ứng viên trong Database.</li>
              <li>So khớp kỹ năng &amp; chấm điểm độ phù hợp với JD.</li>
              <li>Tự động gửi thư mời làm việc cá nhân hóa cho ứng viên phù hợp.</li>
              <li>Đặt 3–4 câu hỏi phỏng vấn ảo sàng lọc (lương, techstack, thời gian).</li>
              <li>Gửi link đặt lịch hẹn Google Meet nếu ứng viên vượt vòng AI!</li>
            </ol>
          </div>
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
