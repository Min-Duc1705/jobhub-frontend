import { useState } from 'react'
import { App } from 'antd'
import { ModalForm, ProFormSelect, ProFormTextArea } from '@ant-design/pro-components'
import type { IApplication, ApplicationStatus, UpdateApplicationStatusBody } from '../../../types/application'
import { APPLICATION_STATUS_LABEL } from '../../../types/application'
import { updateApplicationStatusApi } from '../../../services/application-service'

interface Props {
  open: boolean
  data: IApplication | null
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}

const STATUS_OPTIONS = (Object.keys(APPLICATION_STATUS_LABEL) as ApplicationStatus[]).map(k => ({
  label: APPLICATION_STATUS_LABEL[k],
  value: k,
}))

const UpdateApplicationModal = ({ open, data, onOpenChange, onSuccess }: Props) => {
  const { notification } = App.useApp()

  const handleFinish = async (values: UpdateApplicationStatusBody) => {
    if (!data?.id) return false
    try {
      await updateApplicationStatusApi(data.id, values)
      notification.success({ message: 'Thành công', description: 'Đã cập nhật trạng thái đơn ứng tuyển', duration: 2 })
      onSuccess()
      return true
    } catch (err: any) {
      notification.error({
        message: 'Thất bại',
        description: err?.response?.data?.message || 'Cập nhật thất bại',
        duration: 3,
      })
      return false
    }
  }

  return (
    <ModalForm<UpdateApplicationStatusBody>
      title="Cập nhật trạng thái đơn ứng tuyển"
      open={open}
      onOpenChange={onOpenChange}
      modalProps={{ destroyOnHidden: true, okText: 'Lưu', cancelText: 'Hủy', centered: true }}
      layout="vertical"
      width={500}
      initialValues={{ status: data?.status, reviewNote: data?.reviewNote }}
      onFinish={handleFinish}
    >
      <ProFormSelect
        name="status"
        label="Trạng thái"
        options={STATUS_OPTIONS}
        rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
        fieldProps={{ placeholder: 'Chọn trạng thái' }}
      />
      <ProFormTextArea
        name="reviewNote"
        label="Ghi chú duyệt"
        placeholder="Nhập ghi chú cho ứng viên (tuỳ chọn)..."
        fieldProps={{ rows: 3 }}
      />
    </ModalForm>
  )
}

export default UpdateApplicationModal
