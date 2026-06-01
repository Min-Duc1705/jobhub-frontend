import { useEffect, useState } from 'react'
import { App, Modal, Form, Input, Select, InputNumber, DatePicker, Checkbox, Row, Col } from 'antd'
import dayjs from 'dayjs'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

import type { IJob, JobLevel, JobType } from '../../../types/job'
import { JOB_LEVEL_LABEL, JOB_TYPE_LABEL } from '../../../types/job'
import { updateJobApi } from '../../../services/job-service'
import { getCompaniesApi } from '../../../services/company-service'
import { getSkillsDropdownApi } from '../../../services/skill-service'
import type { ICompany } from '../../../types/company'
import type { ISkill } from '../../../types/skill'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  data: IJob | null
  onSuccess: () => void
}

const JOB_LEVEL_OPTIONS = (Object.keys(JOB_LEVEL_LABEL) as JobLevel[]).map(k => ({
  label: JOB_LEVEL_LABEL[k], value: k,
}))
const JOB_TYPE_OPTIONS = (Object.keys(JOB_TYPE_LABEL) as JobType[]).map(k => ({
  label: JOB_TYPE_LABEL[k], value: k,
}))


const JOB_STATUS_OPTIONS = [
  { label: 'Bản nháp', value: 'DRAFT' },
  { label: 'Đang tuyển', value: 'PUBLISHED' },
  { label: 'Đã đóng', value: 'CLOSED' },
  { label: 'Bị khoá', value: 'SUSPENDED' },
]

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean'],
  ],
}

const UpdateJobModal = ({ open, onOpenChange, data, onSuccess }: Props) => {
  const [form] = Form.useForm()
  const { notification } = App.useApp()

  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<ICompany[]>([])
  const [skills, setSkills] = useState<ISkill[]>([])
  const [negotiable, setNegotiable] = useState(false)
  const [companiesLoading, setCompaniesLoading] = useState(false)

  const currency = Form.useWatch('salaryCurrency', form) ?? 'VND'

  // ── Load companies & skills ──────────────────────────────────────────────
  useEffect(() => {
    if (!open) return

    setCompaniesLoading(true)
    getCompaniesApi('pageSize=200')
      .then(res => setCompanies(res.data?.result ?? []))
      .catch(() => {})
      .finally(() => setCompaniesLoading(false))

    getSkillsDropdownApi()
      .then(res => setSkills(res.data ?? []))
      .catch(() => {})
  }, [open])

  // ── Prefill form data ────────────────────────────────────────────────────
  useEffect(() => {
    if (open && data) {
      setNegotiable(data.isSalaryNegotiable)
      form.setFieldsValue({
        companyId: data.companyId,
        name: data.name,
        location: data.location,
        level: data.level,
        jobType: data.jobType,
        category: data.category ?? '',
        quantity: data.quantity,
        isSalaryNegotiable: data.isSalaryNegotiable,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        salaryCurrency: data.salaryCurrency ?? 'VND',
        experienceRequired: data.experienceRequired,
        description: data.description ?? '',
        requirements: data.requirements ?? '',
        benefits: data.benefits ?? '',
        skillIds: data.skills.map(s => s.id),
        startDate: data.startDate ? dayjs(data.startDate) : null,
        endDate: data.endDate ? dayjs(data.endDate) : null,
        status: data.status,
      })
    } else if (!open) {
      form.resetFields()
      setNegotiable(false)
    }
  }, [open, data, form])

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleOk = async () => {
    if (!data?.id) return
    try {
      const values = await form.validateFields()
      setLoading(true)

      const selectedCompany = companies.find(c => c.id === values.companyId)

      const body = {
        ...values,
        companyName: selectedCompany?.name ?? data.companyName,
        companyLogo: selectedCompany?.logo ?? data.companyLogo,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null,
        skillIds: values.skillIds ?? [],
      }

      await updateJobApi(data.id, body)
      notification.success({ message: 'Cập nhật tin tuyển dụng thành công!', duration: 2 })
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      if (err?.errorFields) return
      notification.error({
        message: 'Thất bại',
        description: err?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật tin tuyển dụng',
        duration: 3,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      onOk={handleOk}
      confirmLoading={loading}
      title={
        <span style={{ fontWeight: 700, color: '#002660', fontSize: 18 }}>
          ✏️ Chỉnh sửa tin tuyển dụng (Admin)
        </span>
      }
      okText="Lưu thay đổi"
      cancelText="Huỷ"
      width={800}
      destroyOnClose
      centered
      styles={{ body: { maxHeight: '75vh', overflowY: 'auto', paddingRight: 8 } }}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Row gutter={16}>
          {/* Chọn Công ty */}
          <Col span={12}>
            <Form.Item
              name="companyId"
              label={<span style={{ fontWeight: 600 }}>Công ty tuyển dụng</span>}
              rules={[{ required: true, message: 'Vui lòng chọn công ty!' }]}
            >
              <Select
                showSearch
                loading={companiesLoading}
                placeholder="Tìm kiếm và chọn công ty..."
                optionFilterProp="label"
                options={companies.map(c => ({ label: c.name, value: c.id }))}
              />
            </Form.Item>
          </Col>

          {/* Trạng thái tuyển dụng */}
          <Col span={12}>
            <Form.Item
              name="status"
              label={<span style={{ fontWeight: 600 }}>Trạng thái hiển thị</span>}
              rules={[{ required: true }]}
            >
              <Select options={JOB_STATUS_OPTIONS} />
            </Form.Item>
          </Col>

          {/* Tên vị trí */}
          <Col span={24}>
            <Form.Item
              name="name"
              label={<span style={{ fontWeight: 600 }}>Tên vị trí tuyển dụng</span>}
              rules={[{ required: true, message: 'Vui lòng nhập tên vị trí!' }]}
            >
              <Input placeholder="VD: Senior React Developer" />
            </Form.Item>
          </Col>

          {/* Cấp độ, Hình thức, Ngành nghề, Số lượng */}
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="level" label={<span style={{ fontWeight: 600 }}>Cấp độ</span>} rules={[{ required: true }]}>
              <Select options={JOB_LEVEL_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="jobType" label={<span style={{ fontWeight: 600 }}>Hình thức</span>} rules={[{ required: true }]}>
              <Select options={JOB_TYPE_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="category" label={<span style={{ fontWeight: 600 }}>Ngành nghề</span>} rules={[{ required: true, message: 'Vui lòng nhập ngành nghề!' }]}>
              <Input placeholder="VD: Kỹ thuật, Kinh doanh..." />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="quantity" label={<span style={{ fontWeight: 600 }}>Số lượng tuyển</span>} rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          {/* Địa điểm & Kinh nghiệm */}
          <Col span={12}>
            <Form.Item name="location" label={<span style={{ fontWeight: 600 }}>Địa điểm</span>}>
              <Input placeholder="VD: Quận 1, TP. Hồ Chí Minh" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="experienceRequired" label={<span style={{ fontWeight: 600 }}>Kinh nghiệm yêu cầu</span>}>
              <Input placeholder="VD: Trên 2 năm kinh nghiệm" />
            </Form.Item>
          </Col>

          {/* Lương */}
          <Col span={24}>
            <Form.Item name="isSalaryNegotiable" valuePropName="checked" label=" " style={{ marginBottom: 8 }}>
              <Checkbox
                onChange={e => {
                  setNegotiable(e.target.checked)
                  form.setFieldsValue({ salaryMin: null, salaryMax: null })
                }}
              >
                Lương thoả thuận
              </Checkbox>
            </Form.Item>
          </Col>

          {!negotiable && (
            <>
              <Col span={8}>
                <Form.Item name="salaryMin" label={<span style={{ fontWeight: 600 }}>Lương tối thiểu</span>}>
                  <InputNumber<number>
                    min={0}
                    step={currency === 'USD' ? 100 : 1_000_000}
                    style={{ width: '100%' }}
                    formatter={v => v != null ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                    parser={v => parseFloat((v ?? '').replace(/,/g, '')) || 0}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="salaryMax" label={<span style={{ fontWeight: 600 }}>Lương tối đa</span>}>
                  <InputNumber<number>
                    min={0}
                    step={currency === 'USD' ? 100 : 1_000_000}
                    style={{ width: '100%' }}
                    formatter={v => v != null ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                    parser={v => parseFloat((v ?? '').replace(/,/g, '')) || 0}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="salaryCurrency" label={<span style={{ fontWeight: 600 }}>Tiền tệ</span>}>
                  <Select
                    options={[{ label: 'VND', value: 'VND' }, { label: 'USD', value: 'USD' }]}
                    onChange={() => form.setFieldsValue({ salaryMin: null, salaryMax: null })}
                  />
                </Form.Item>
              </Col>
            </>
          )}

          {/* Ngày bắt đầu & Hạn nộp */}
          <Col span={12}>
            <Form.Item name="startDate" label={<span style={{ fontWeight: 600 }}>Ngày bắt đầu</span>}>
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="endDate" label={<span style={{ fontWeight: 600 }}>Hạn nộp hồ sơ</span>}>
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          {/* Kỹ năng yêu cầu */}
          <Col span={24}>
            <Form.Item name="skillIds" label={<span style={{ fontWeight: 600 }}>Kỹ năng yêu cầu</span>}>
              <Select
                mode="multiple"
                placeholder="Chọn các kỹ năng cần thiết..."
                options={skills.map(s => ({ label: s.name, value: s.id }))}
                optionFilterProp="label"
                showSearch
              />
            </Form.Item>
          </Col>

          {/* Mô tả công việc */}
          <Col span={24}>
            <Form.Item name="description" label={<span style={{ fontWeight: 600 }}>Mô tả công việc</span>}>
              <ReactQuill theme="snow" modules={quillModules} placeholder="Mô tả chi tiết về công việc và trách nhiệm..." />
            </Form.Item>
          </Col>

          {/* Yêu cầu ứng viên */}
          <Col span={24}>
            <Form.Item name="requirements" label={<span style={{ fontWeight: 600 }}>Yêu cầu ứng viên</span>}>
              <ReactQuill theme="snow" modules={quillModules} placeholder="Các kỹ năng, kinh nghiệm cần thiết..." />
            </Form.Item>
          </Col>

          {/* Phúc lợi */}
          <Col span={24}>
            <Form.Item name="benefits" label={<span style={{ fontWeight: 600 }}>Phúc lợi ứng viên</span>}>
              <ReactQuill theme="snow" modules={quillModules} placeholder="Chế độ đãi ngộ, bảo hiểm, thưởng..." />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

export default UpdateJobModal
