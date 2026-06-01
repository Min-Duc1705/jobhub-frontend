import { App, Divider } from 'antd'
import { ModalForm, ProFormText, ProFormSelect } from '@ant-design/pro-components'
import { useEffect, useState } from 'react'
import type { IUser, UpdateUserBody, ResetPasswordBody } from '../../../types/account'
import { USER_STATUS_LABEL } from '../../../types/account'
import { updateUserApi, resetUserPasswordApi } from '../../../services/account-service'
import { getRoleDropdownApi } from '../../../services/role-service'
import type { RoleDropdown } from '../../../types/role'

interface Props {
  open: boolean
  data: IUser | null
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}

const STATUS_OPTIONS = (Object.keys(USER_STATUS_LABEL) as Array<keyof typeof USER_STATUS_LABEL>).map(k => ({
  label: USER_STATUS_LABEL[k],
  value: k,
}))

const UpdateAccountModal = ({ open, data, onOpenChange, onSuccess }: Props) => {
  const { notification, modal } = App.useApp()
  const [roles, setRoles] = useState<RoleDropdown[]>([])

  useEffect(() => {
    if (open) {
      getRoleDropdownApi().then(r => setRoles(r.data ?? [])).catch(() => {})
    }
  }, [open])

  const handleFinish = async (values: UpdateUserBody) => {
    if (!data?.id) return false
    try {
      await updateUserApi(data.id, values)
      notification.success({ message: 'Thành công', description: 'Cập nhật tài khoản thành công', duration: 2 })
      onSuccess()
      return true
    } catch (err: any) {
      notification.error({
        message: 'Thất bại',
        description: err?.response?.data?.message || 'Cập nhật tài khoản thất bại',
        duration: 3,
      })
      return false
    }
  }

  // ── Reset password flow ────────────────────────────────────────────────────
  const handleResetPassword = () => {
    let newPwd = ''
    modal.confirm({
      title: 'Đặt lại mật khẩu',
      content: (
        <input
          type="password"
          placeholder="Nhập mật khẩu mới (≥8 ký tự)"
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, marginTop: 8 }}
          onChange={e => { newPwd = e.target.value }}
        />
      ),
      okText: 'Đặt lại',
      cancelText: 'Hủy',
      onOk: async () => {
        if (!newPwd || newPwd.length < 8) {
          notification.warning({ message: 'Mật khẩu phải có ít nhất 8 ký tự!', duration: 2 })
          return Promise.reject()
        }
        await resetUserPasswordApi(data!.id, { newPassword: newPwd })
        notification.success({ message: 'Đặt lại mật khẩu thành công', duration: 2 })
      },
    })
  }

  return (
    <ModalForm<UpdateUserBody>
      title={`Chỉnh sửa tài khoản: ${data?.username ?? ''}`}
      open={open}
      onOpenChange={onOpenChange}
      modalProps={{ destroyOnHidden: true, okText: 'Lưu', cancelText: 'Hủy', centered: true }}
      layout="vertical"
      width={520}
      initialValues={{
        username: data?.username,
        email:    data?.email,
        status:   data?.status,
        roleId:   data?.role?.id,
      }}
      onFinish={handleFinish}
      submitter={{
        render: (props, doms) => [
          ...doms,
          <a
            key="reset-pw"
            onClick={handleResetPassword}
            style={{ marginRight: 'auto', color: '#ff4d4f', fontSize: 13, cursor: 'pointer' }}
          >
            Đặt lại mật khẩu
          </a>,
        ],
      }}
    >
      <ProFormText
        name="username"
        label="Tên đăng nhập"
        rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
      />
      <ProFormText
        name="email"
        label="Email"
        rules={[
          { required: true, message: 'Vui lòng nhập email!' },
          { type: 'email', message: 'Email không hợp lệ!' },
        ]}
      />
      <ProFormSelect
        name="status"
        label="Trạng thái"
        options={STATUS_OPTIONS}
        rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
      />
      <ProFormSelect
        name="roleId"
        label="Vai trò"
        placeholder="Chọn vai trò"
        options={roles.map(r => ({ label: r.name, value: r.id }))}
      />
    </ModalForm>
  )
}

export default UpdateAccountModal
