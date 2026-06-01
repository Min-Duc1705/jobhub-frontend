import React, { useState } from 'react'
import { Card, Form, Input, Select, Button, Space, Alert, Typography } from 'antd'
import { message, modal } from '../../../utils/antd'
import { broadcastNotificationApi } from '../../../services/notification-service'
import type { IBroadcastNotificationRequest } from '../../../services/notification-service'
import { SendOutlined, InfoCircleOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

const NotificationManagement = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleSubmit = (values: IBroadcastNotificationRequest) => {
    console.log('Form values submitted:', values)
    let targetText = 'Tất cả người dùng'
    if (values.targetGroup === 'HR') targetText = 'Tất cả Nhà tuyển dụng (HR)'
    else if (values.targetGroup === 'CANDIDATE') targetText = 'Tất cả Ứng viên (Candidate)'

    modal.confirm({
      title: 'Xác nhận gửi thông báo hệ thống',
      icon: <InfoCircleOutlined style={{ color: '#002660' }} />,
      content: `Bạn có chắc chắn muốn gửi thông báo này tới ${targetText}? Tất cả người dùng thuộc nhóm này sẽ nhận được thông báo trong thời gian thực qua SignalR WebSocket và được lưu vào hộp thư.`,
      okText: 'Gửi ngay',
      cancelText: 'Hủy',
      okButtonProps: { type: 'primary', style: { backgroundColor: '#002660' } },
      onOk: async () => {
        setLoading(true)
        console.log('Sending broadcast notification to API...')
        try {
          const res = await broadcastNotificationApi(values)
          console.log('API Response received:', res)
          if (res && res.statusCode === 200) {
            message.success('Gửi thông báo broadcast thành công!')
            form.resetFields()
          } else {
            message.error(res.message || 'Gửi thông báo thất bại')
          }
        } catch (error) {
          console.error('Error broadcasting notification:', error)
          message.error('Lỗi kết nối đến máy chủ')
        } finally {
          setLoading(false)
        }
      },
    })
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 0' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ color: '#002660', margin: 0 }}>
          Quản lý Thông báo
        </Title>
        <Paragraph style={{ color: '#8c8c8c', marginTop: 4 }}>
          Gửi thông báo hệ thống trực tiếp hoặc theo nhóm đối tượng (Tất cả người dùng, Nhà tuyển dụng HR, hoặc Ứng viên)
        </Paragraph>
      </div>

      <Alert
        message="Lưu ý quan trọng"
        description="Thông báo broadcast sẽ được gửi tới toàn bộ tài khoản thuộc nhóm được chọn. Người dùng đang online sẽ nhận được thông báo tức thời thông qua kết nối Real-time Socket. Người dùng offline sẽ nhìn thấy thông báo khi đăng nhập lại."
        type="info"
        showIcon
        style={{ marginBottom: 24, borderRadius: 8 }}
      />

      <Card
        bordered
        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        title={<span style={{ fontWeight: 600, color: '#002660' }}>Soạn thông báo mới</span>}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ type: 'default', targetGroup: 'ALL' }}
        >
          <Form.Item
            name="targetGroup"
            label={<strong>Nhóm đối tượng nhận</strong>}
            rules={[{ required: true }]}
          >
            <Select size="large">
              <Select.Option value="ALL">Tất cả người dùng hệ thống (All Users)</Select.Option>
              <Select.Option value="HR">Chỉ Nhà tuyển dụng (HR / Employers)</Select.Option>
              <Select.Option value="CANDIDATE">Chỉ Ứng viên (Candidates / Job Seekers)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label={<strong>Tiêu đề thông báo</strong>}
            rules={[
              { required: true, message: 'Vui lòng nhập tiêu đề thông báo' },
              { max: 200, message: 'Tiêu đề không được vượt quá 200 ký tự' }
            ]}
          >
            <Input size="large" placeholder="Nhập tiêu đề ngắn gọn hiển thị ở danh sách thông báo..." />
          </Form.Item>

          <Form.Item
            name="message"
            label={<strong>Nội dung chi tiết</strong>}
            rules={[
              { required: true, message: 'Vui lòng nhập nội dung thông báo' },
              { max: 1000, message: 'Nội dung không được vượt quá 1000 ký tự' }
            ]}
          >
            <Input.TextArea
              rows={5}
              placeholder="Nhập nội dung chi tiết thông báo..."
              style={{ borderRadius: 6 }}
            />
          </Form.Item>

          <Form.Item
            name="type"
            label={<strong>Loại thông báo</strong>}
            rules={[{ required: true }]}
          >
            <Select size="large">
              <Select.Option value="default">Mặc định (Thông báo hệ thống)</Select.Option>
              <Select.Option value="recommend">Gợi ý việc làm (Recommend)</Select.Option>
              <Select.Option value="invite">Mời ứng tuyển (Invite)</Select.Option>
              <Select.Option value="view">Nhà tuyển dụng xem hồ sơ (View profile)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 12 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button size="large" onClick={() => form.resetFields()}>
                Làm mới
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={loading}
                icon={<SendOutlined />}
                style={{ backgroundColor: '#002660', borderColor: '#002660' }}
              >
                Gửi thông báo
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default NotificationManagement
