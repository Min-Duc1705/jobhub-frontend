import { useEffect, useState } from 'react'
import { App, DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd'
import dayjs from 'dayjs'
import type { ICustomer } from '../../../types/customer'
import { updateCustomerByIdApi } from '../../../services/customer-service'

const { TextArea } = Input

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  data: ICustomer | null
  onSuccess: () => void
}

const GENDER_OPTIONS = [
  { value: 'MALE',   label: 'Nam'  },
  { value: 'FEMALE', label: 'Nữ'   },
  { value: 'OTHER',  label: 'Khác' },
]

const JOB_STATUS_OPTIONS = [
  { value: 'ACTIVELY_LOOKING', label: 'Đang tìm việc tích cực' },
  { value: 'OPEN_TO_OFFERS',   label: 'Sẵn sàng nghe cơ hội'  },
  { value: 'NOT_LOOKING',      label: 'Không tìm việc hiện tại' },
]

const UpdateCustomerModal = ({ open, onOpenChange, data, onSuccess }: Props) => {
  const [form]    = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { notification } = App.useApp()

  useEffect(() => {
    if (open && data) {
      form.setFieldsValue({
        fullName:          data.fullName,
        phone:             data.phone,
        gender:            data.gender,
        address:           data.address,
        summary:           data.summary,
        yearsOfExperience: data.yearsOfExperience,
        expectedSalary:    data.expectedSalary,
        jobSearchStatus:   data.jobSearchStatus,
        position:          data.position,
        dateOfBirth:       data.dateOfBirth ? dayjs(data.dateOfBirth) : null,
      })
    }
  }, [open, data, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const payload: Partial<ICustomer> = {
        fullName:          values.fullName,
        phone:             values.phone,
        gender:            values.gender,
        address:           values.address,
        summary:           values.summary,
        yearsOfExperience: values.yearsOfExperience ?? null,
        expectedSalary:    values.expectedSalary ?? null,
        jobSearchStatus:   values.jobSearchStatus ?? null,
        position:          values.position ?? null,
        dateOfBirth:       values.dateOfBirth
                             ? (values.dateOfBirth as dayjs.Dayjs).format('YYYY-MM-DD')
                             : undefined,
      }

      await updateCustomerByIdApi(data!.id!, payload)
      notification.success({ message: 'Thành công', description: 'Cập nhật hồ sơ thành công', duration: 2 })
      onSuccess()
    } catch (err: any) {
      if (err?.errorFields) return
      notification.error({
        message: 'Thất bại',
        description: err?.response?.data?.message || 'Cập nhật hồ sơ thất bại',
        duration: 3,
      })
    } finally {
      setLoading(false)
    }
  }

  const isCandidate = data?.type === 'CANDIDATE'
  const isEmployer  = data?.type === 'EMPLOYER'

  return (
    <Modal
      title={`Cập nhật hồ sơ — ${data?.fullName ?? 'Customer'}`}
      open={open}
      onOk={handleOk}
      onCancel={() => { onOpenChange(false); form.resetFields() }}
      okText="Lưu thay đổi"
      cancelText="Hủy"
      confirmLoading={loading}
      width={640}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
          <Input placeholder="Họ và tên" />
        </Form.Item>

        <Form.Item name="phone" label="Số điện thoại">
          <Input placeholder="0xxxxxxxxx" />
        </Form.Item>

        {isCandidate && (
          <>
            <Form.Item name="gender" label="Giới tính">
              <Select options={GENDER_OPTIONS} placeholder="Chọn giới tính" allowClear />
            </Form.Item>

            <Form.Item name="dateOfBirth" label="Ngày sinh">
              <DatePicker style={{ width: '100%' }} placeholder="DD/MM/YYYY" format="DD/MM/YYYY" />
            </Form.Item>

            <Form.Item name="address" label="Địa chỉ">
              <Input placeholder="Địa chỉ" />
            </Form.Item>

            <Form.Item name="summary" label="Giới thiệu bản thân">
              <TextArea rows={3} placeholder="Mô tả ngắn..." />
            </Form.Item>

            <Form.Item name="yearsOfExperience" label="Số năm kinh nghiệm">
              <InputNumber min={0} max={50} style={{ width: '100%' }} placeholder="0" addonAfter="năm" />
            </Form.Item>

            <Form.Item name="expectedSalary" label="Mức lương kỳ vọng (VND)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="15000000" formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>

            <Form.Item name="jobSearchStatus" label="Trạng thái tìm việc">
              <Select options={JOB_STATUS_OPTIONS} placeholder="Chọn trạng thái" allowClear />
            </Form.Item>
          </>
        )}

        {isEmployer && (
          <Form.Item name="position" label="Vị trí / Chức danh">
            <Input placeholder="VD: HR Manager, Recruiter..." />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}

export default UpdateCustomerModal
