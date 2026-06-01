import { App } from 'antd'
import { ModalForm, ProFormText, ProFormSelect } from '@ant-design/pro-components'
import { useEffect, useState } from 'react'
import type { CreateUserBody } from '../../../types/account'
import { createUserApi } from '../../../services/account-service'
import { getRoleDropdownApi } from '../../../services/role-service'
import type { RoleDropdown } from '../../../types/role'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}

const CreateAccountModal = ({ open, onOpenChange, onSuccess }: Props) => {
  const { notification } = App.useApp()
  const [roles, setRoles] = useState<RoleDropdown[]>([])

  useEffect(() => {
    if (open) {
      getRoleDropdownApi().then(r => setRoles(r.data ?? [])).catch(() => {})
    }
  }, [open])

  const handleFinish = async (values: CreateUserBody) => {
    try {
      await createUserApi(values)
      notification.success({ message: 'Thành công', description: 'Tạo tài khoản thành công', duration: 2 })
      onSuccess()
      return true
    } catch (err: any) {
      notification.error({
        message: 'Thất bại',
        description: err?.response?.data?.message || 'Tạo tài khoản thất bại',
        duration: 3,
      })
      return false
    }
  }

  return (
    <ModalForm<CreateUserBody>
      title="Thêm tài khoản mới"
      open={open}
      onOpenChange={onOpenChange}
      modalProps={{ destroyOnHidden: true, okText: 'Tạo mới', cancelText: 'Hủy', centered: true }}
      layout="vertical"
      width={520}
      onFinish={handleFinish}
    >
      <ProFormText
        name="username"
        label="Tên đăng nhập"
        placeholder="VD: nguyenvana"
        rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
      />
      <ProFormText
        name="email"
        label="Email"
        placeholder="VD: user@example.com"
        rules={[
          { required: true, message: 'Vui lòng nhập email!' },
          { type: 'email', message: 'Email không hợp lệ!' },
        ]}
      />
      <ProFormText.Password
        name="password"
        label="Mật khẩu"
        placeholder="Ít nhất 8 ký tự"
        rules={[
          { required: true, message: 'Vui lòng nhập mật khẩu!' },
          { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự!' },
        ]}
      />
      <ProFormSelect
        name="roleId"
        label="Vai trò"
        placeholder="Chọn vai trò (tuỳ chọn)"
        options={roles.map(r => ({ label: r.name, value: r.id }))}
      />
    </ModalForm>
  )
}

export default CreateAccountModal
