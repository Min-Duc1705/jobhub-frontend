import { App, Form, Input, Modal } from 'antd'
import type { SkillBody } from '../../../types/skill'
import { createSkillApi } from '../../../services/profile-service'
import { useState } from 'react'

interface Props {
  open:         boolean
  onOpenChange: (v: boolean) => void
  onSuccess:    () => void
}

const CreateSkillModal = ({ open, onOpenChange, onSuccess }: Props) => {
  const [form]    = Form.useForm<SkillBody>()
  const [loading, setLoading] = useState(false)
  const { notification } = App.useApp()

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      await createSkillApi(values)
      notification.success({ message: 'Thành công', description: 'Tạo kỹ năng thành công', duration: 2 })
      form.resetFields()
      onSuccess()
    } catch (err: any) {
      if (err?.errorFields) return
      notification.error({
        message: 'Thất bại',
        description: err?.response?.data?.message || 'Tạo kỹ năng thất bại',
        duration: 3,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="Thêm mới Kỹ năng"
      open={open}
      onOk={handleOk}
      onCancel={() => { onOpenChange(false); form.resetFields() }}
      okText="Tạo mới"
      cancelText="Hủy"
      confirmLoading={loading}
      width={440}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item
          name="name"
          label="Tên kỹ năng"
          rules={[
            { required: true, message: 'Vui lòng nhập tên kỹ năng' },
            { max: 100,       message: 'Tên tối đa 100 ký tự' },
          ]}
        >
          <Input placeholder="VD: React, Spring Boot, Docker..." size="large" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CreateSkillModal
