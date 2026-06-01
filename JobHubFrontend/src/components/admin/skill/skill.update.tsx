import { useEffect, useState } from 'react'
import { App, Form, Input, Modal } from 'antd'
import type { ISkill, SkillBody } from '../../../types/skill'
import { updateSkillApi } from '../../../services/profile-service'

interface Props {
  open:         boolean
  onOpenChange: (v: boolean) => void
  data:         ISkill | null
  onSuccess:    () => void
}

const UpdateSkillModal = ({ open, onOpenChange, data, onSuccess }: Props) => {
  const [form]    = Form.useForm<SkillBody>()
  const [loading, setLoading] = useState(false)
  const { notification } = App.useApp()

  // Prefill form khi mở modal
  useEffect(() => {
    if (open && data) {
      form.setFieldsValue({ name: data.name })
    }
  }, [open, data, form])

  const handleOk = async () => {
    if (!data?.id) return
    try {
      const values = await form.validateFields()
      setLoading(true)
      await updateSkillApi(data.id, values)
      notification.success({ message: 'Thành công', description: 'Cập nhật kỹ năng thành công', duration: 2 })
      form.resetFields()
      onSuccess()
    } catch (err: any) {
      if (err?.errorFields) return
      notification.error({
        message: 'Thất bại',
        description: err?.response?.data?.message || 'Cập nhật kỹ năng thất bại',
        duration: 3,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="Chỉnh sửa Kỹ năng"
      open={open}
      onOk={handleOk}
      onCancel={() => { onOpenChange(false); form.resetFields() }}
      okText="Lưu thay đổi"
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

export default UpdateSkillModal
