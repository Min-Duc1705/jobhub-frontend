import { App, Form } from 'antd'
import { ModalForm, ProFormText, ProFormSelect } from '@ant-design/pro-components'
import { useEffect } from 'react'
import type { IPermission, PermissionBody } from '../../../types/permission'
import { updatePermissionApi } from '../../../services/permission-service'


interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  data: IPermission | null
  onSuccess: () => void
}

const HTTP_METHODS = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
]

const UpdatePermissionModal = ({ open, onOpenChange, data, onSuccess }: Props) => {
  const [form] = Form.useForm()
  const { notification } = App.useApp()

  useEffect(() => {
    if (open && data) {
      form.setFieldsValue({
        name: data.name,
        method: data.method,
        apiPath: data.apiPath,
        module: data.module,
      })
    } else {
      form.resetFields()
    }
  }, [open, data, form])

  const handleFinish = async (values: PermissionBody) => {
    if (!data?.id) return false
    try {
      await updatePermissionApi(data.id, values)
      notification.success({ message: 'Thành công', description: 'Cập nhật quyền hạn thành công', duration: 2 })
      onSuccess()
      return true
    } catch (err: any) {
      notification.error({
        message: 'Thất bại',
        description: err?.response?.data?.message || 'Cập nhật quyền hạn thất bại',
        duration: 3,
      })
      return false
    }
  }

  return (
    <ModalForm<PermissionBody>
      title="Cập nhật quyền hạn"
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      modalProps={{ destroyOnHidden: true, okText: 'Cập nhật', cancelText: 'Hủy', centered: true }}
      layout="vertical"
      width={560}
      onFinish={handleFinish}
    >
      <ProFormText
        name="name"
        label="Tên quyền hạn"
        placeholder="VD: Lấy danh sách người dùng"
        rules={[{ required: true, message: 'Vui lòng nhập tên quyền hạn!' }]}
      />
      <ProFormSelect
        name="method"
        label="Phương thức HTTP"
        placeholder="Chọn phương thức"
        options={HTTP_METHODS}
        rules={[{ required: true, message: 'Vui lòng chọn phương thức!' }]}
      />
      <ProFormText
        name="apiPath"
        label="Đường dẫn API"
        placeholder="VD: /api/v1/users"
        rules={[{ required: true, message: 'Vui lòng nhập đường dẫn API!' }]}
      />
      <ProFormText
        name="module"
        label="Module"
        placeholder="VD: USERS"
        rules={[{ required: true, message: 'Vui lòng nhập module!' }]}
        normalize={(v: string) => v?.toUpperCase()}
        fieldProps={{ style: { textTransform: 'uppercase' }, onChange: e => e.target.value = e.target.value.toUpperCase() }}
      />
    </ModalForm>
  )
}

export default UpdatePermissionModal
