import { useEffect, useState } from 'react'
import { App, Col, DatePicker, Form, Input, InputNumber, Modal, Row, Select } from 'antd'
import dayjs from 'dayjs'
import type { ICustomer } from '../../../types/customer'
import { updateCustomerByIdApi } from '../../../services/customer-service'
import { useProvinces } from '../../../hooks/useProvinces'

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

// ── Vietnam Province / Ward types ──────────────────────────────────
interface VietnamProvinceItem {
  id: string
  province: string
  wards: { name: string; mergedFrom: string[] }[]
}

// ── Address helpers (đồng bộ với ProfileSettings) ──────────────────
// Format: "addressDetail | ward | province"
const SEP = ' | '
const buildAddress = (parts: { province?: string; ward?: string; addressDetail?: string }) => {
  const { province = '', ward = '', addressDetail = '' } = parts
  return [addressDetail, ward, province].filter(Boolean).join(SEP) || undefined
}
const parseAddress = (raw: string | null | undefined) => {
  if (!raw) return { province: undefined, ward: undefined, addressDetail: undefined }
  const parts = raw.split(SEP)
  // Format mới: "addressDetail | ward | province"
  if (parts.length === 3) return {
    addressDetail: parts[0] || undefined,
    ward:          parts[1] || undefined,
    province:      parts[2] || undefined,
  }
  // Legacy 4-part (district removed)
  if (parts.length === 4) return {
    addressDetail: parts[0] || undefined,
    ward:          parts[1] || undefined,
    province:      parts[3] || undefined,
  }
  // Legacy 2-part: "ward | province" (RegisterPage cũ chưa có addressDetail)
  if (parts.length === 2) return {
    addressDetail: undefined,
    ward:          parts[0] || undefined,
    province:      parts[1] || undefined,
  }
  // Plain string → put into addressDetail
  return { addressDetail: raw, ward: undefined, province: undefined }
}

// ── Component ──────────────────────────────────────────────────────
const UpdateCustomerModal = ({ open, onOpenChange, data, onSuccess }: Props) => {
  const [form]    = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { notification } = App.useApp()

  // ── Province / Ward state (dùng shared hook — cache toàn module) ────────────────────────
  const { provinceOptions, getWards } = useProvinces()
  const [wardOptions, setWardOptions] = useState<{ value: string; label: string }[]>([])
  const [loadingWards, setLoadingWards] = useState(false)

  // ── Khi user chọn tỉnh → populate ward list ────────────────────────────────
  const selectProvince = (provinceName: string | undefined) => {
    setWardOptions([])
    if (!provinceName) return
    setLoadingWards(true)
    setWardOptions(getWards(provinceName))
    setLoadingWards(false)
  }

  // ── Khi modal mở + data thay đổi → fill form ─────────────
  useEffect(() => {
    if (open && data) {
      const addr = parseAddress(data.address)

      form.setFieldsValue({
        fullName:          data.fullName,
        phone:             data.phone,
        gender:            data.gender,
        province:          addr.province,
        ward:              addr.ward,
        addressDetail:     addr.addressDetail,
        summary:           data.summary,
        yearsOfExperience: data.yearsOfExperience,
        expectedSalary:    data.expectedSalary,
        jobSearchStatus:   data.jobSearchStatus,
        position:          data.position,
        dateOfBirth:       data.dateOfBirth ? dayjs(data.dateOfBirth) : null,
      })

      // Pre-load wards nếu tỉnh đã có
      if (addr.province) selectProvince(addr.province)
    }
  }, [open, data, form]) // eslint-disable-line react-hooks/exhaustive-deps


  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const payload: Partial<ICustomer> = {
        fullName:          values.fullName,
        phone:             values.phone,
        gender:            values.gender,
        address:           buildAddress({
          province:      values.province,
          ward:          values.ward,
          addressDetail: values.addressDetail,
        }),
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

  const handleCancel = () => {
    onOpenChange(false)
    form.resetFields()
    setWardOptions([])
  }

  const isCandidate = data?.type === 'CANDIDATE'
  const isEmployer  = data?.type === 'EMPLOYER'

  return (
    <Modal
      title={`Cập nhật hồ sơ — ${data?.fullName ?? 'Customer'}`}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Lưu thay đổi"
      cancelText="Hủy"
      confirmLoading={loading}
      width={800}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" autoComplete="off">
        {/* ── Hàng 1: Họ tên + SĐT ── */}
        <Row gutter={12}>
          <Col span={16}>
            <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
              <Input placeholder="Họ và tên" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="phone" label="Số điện thoại">
              <Input placeholder="0xxxxxxxxx" />
            </Form.Item>
          </Col>
        </Row>

        {isCandidate && (
          <>
            {/* ── Hàng 2: Giới tính + Ngày sinh + Trạng thái ── */}
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item name="gender" label="Giới tính">
                  <Select options={GENDER_OPTIONS} placeholder="Chọn giới tính" allowClear />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="dateOfBirth" label="Ngày sinh">
                  <DatePicker style={{ width: '100%' }} placeholder="DD/MM/YYYY" format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="jobSearchStatus" label="Trạng thái tìm việc">
                  <Select options={JOB_STATUS_OPTIONS} placeholder="Chọn trạng thái" allowClear />
                </Form.Item>
              </Col>
            </Row>

            {/* ── Hàng 3: Tỉnh + Phường/Xã + Kinh nghiệm ── */}
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item name="province" label="Tỉnh / Thành phố">
                  <Select
                    showSearch
                    placeholder="Chọn tỉnh"
                    allowClear
                    filterOption={(input, opt) =>
                      String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={provinceOptions}
                    onChange={(val) => {
                      form.setFieldValue('ward', undefined)
                      selectProvince(val)
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="ward" label="Phường / Xã">
                  <Select
                    showSearch
                    placeholder={loadingWards ? 'Đang tải...' : 'Chọn phường / xã'}
                    allowClear
                    loading={loadingWards}
                    disabled={wardOptions.length === 0 && !loadingWards}
                    filterOption={(input, opt) =>
                      String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={wardOptions}
                    notFoundContent={loadingWards ? 'Đang tải...' : 'Chưa có dữ liệu'}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="yearsOfExperience" label="Kinh nghiệm">
                  <InputNumber min={0} max={50} style={{ width: '100%' }} placeholder="0" addonAfter="năm" />
                </Form.Item>
              </Col>
            </Row>

            {/* ── Hàng 4: Địa chỉ chi tiết + Lương kỳ vọng ── */}
            <Row gutter={12}>
              <Col span={14}>
                <Form.Item name="addressDetail" label="Địa chỉ chi tiết">
                  <Input placeholder="Số nhà, tên đường, toà nhà..." />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item name="expectedSalary" label="Lương kỳ vọng (VND)">
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="15,000,000" formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Form.Item>
              </Col>
            </Row>

            {/* ── Hàng 5: Giới thiệu ── */}
            <Form.Item name="summary" label="Giới thiệu bản thân">
              <TextArea rows={3} placeholder="Mô tả ngắn..." />
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
