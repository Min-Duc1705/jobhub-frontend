import { App } from 'antd'
import { ModalForm, ProFormText, ProFormSelect } from '@ant-design/pro-components'
import type { PermissionBody } from '../../../types/permission'
import { createPermissionApi } from '../../../services/permission-service'


interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}

const HTTP_METHODS = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
]

const CreatePermissionModal = ({ open, onOpenChange, onSuccess }: Props) => {
  const { notification } = App.useApp()

  const handleFinish = async (values: PermissionBody) => {
    try {
      await createPermissionApi(values)
      notification.success({ message: 'Thành công', description: 'Tạo quyền hạn thành công', duration: 2 })
      onSuccess()
      return true
    } catch (err: any) {
      notification.error({
        message: 'Thất bại',
        description: err?.response?.data?.message || 'Tạo quyền hạn thất bại',
        duration: 3,
      })
      return false
    }
  }

  return (
    <ModalForm<PermissionBody>
      title="Thêm quyền hạn mới"
      open={open}
      onOpenChange={onOpenChange}
      modalProps={{ destroyOnHidden: true, okText: 'Tạo mới', cancelText: 'Hủy', centered: true }}
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

export default CreatePermissionModal
