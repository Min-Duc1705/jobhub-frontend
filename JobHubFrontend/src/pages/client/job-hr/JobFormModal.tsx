import { App, Modal, Form, Input, Select, InputNumber, DatePicker, Checkbox } from 'antd'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

import type { IJob, JobLevel, JobType } from '../../../types/job'
import { JOB_LEVEL_LABEL, JOB_TYPE_LABEL } from '../../../types/job'
import { createJobApi, updateJobApi } from '../../../services/job-service'
import { getCompanyByIdApi } from '../../../services/company-service'
import { getMyProfileApi } from '../../../services/profile-service'
import type { ICompany } from '../../../types/company'
import type { ISkill } from '../../../types/skill'
import { getSkillsDropdownApi } from '../../../services/skill-service'

interface Props {
  open: boolean
  data: IJob | null   // null = tạo mới, non-null = chỉnh sửa
  onClose: () => void
  onSuccess: () => void
}

const JOB_LEVEL_OPTIONS = (Object.keys(JOB_LEVEL_LABEL) as JobLevel[]).map(k => ({
  label: JOB_LEVEL_LABEL[k], value: k,
}))
const JOB_TYPE_OPTIONS = (Object.keys(JOB_TYPE_LABEL) as JobType[]).map(k => ({
  label: JOB_TYPE_LABEL[k], value: k,
}))


const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean'],
  ],
}

const JobFormModal = ({ open, data, onClose, onSuccess }: Props) => {
  const [form] = Form.useForm()
  const { notification } = App.useApp()

  const [loading,       setLoading]       = useState(false)
  const [skills,        setSkills]        = useState<ISkill[]>([])
  const [negotiable,    setNegotiable]    = useState(false)
  const [myCompany,     setMyCompany]     = useState<ICompany | null>(null)
  const [companyLoading, setCompanyLoading] = useState(false)

  // Đọc currency trực tiếp từ form — luôn đồng bộ, không dùng state riêng
  const currency = Form.useWatch('salaryCurrency', form) ?? 'VND'

  const isEdit = !!data

  // ── Load skills + company profile song song khi modal mở ───────────────────
  useEffect(() => {
    if (!open) return

    // Skills không phụ thuộc profile → gọi song song
    const skillsPromise = getSkillsDropdownApi()
      .then(r => setSkills(r.data ?? []))
      .catch(() => {})

    // Company chỉ cần fetch khi create mode (isEdit = false)
    const companyPromise = (!isEdit)
      ? (setCompanyLoading(true),
        getMyProfileApi()
          .then(async res => {
            const companyId = res.data?.companyId
            if (companyId) {
              const compRes = await getCompanyByIdApi(companyId)
              setMyCompany(compRes.data ?? null)
              form.setFieldValue('companyId', companyId)
            } else {
              setMyCompany(null)
            }
          })
          .catch(() => setMyCompany(null))
          .finally(() => setCompanyLoading(false)))
      : Promise.resolve()

    // Chạy song song
    Promise.all([skillsPromise, companyPromise])
  }, [open, isEdit])

  // ── Populate form khi mở ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      form.resetFields()
      setMyCompany(null)
      setNegotiable(false)
      return
    }

    if (data) {
      // Edit mode — lấy company info từ data job
      setNegotiable(data.isSalaryNegotiable)
      setMyCompany(data.companyId
        ? { id: data.companyId, name: data.companyName ?? '', logo: data.companyLogo } as ICompany
        : null
      )
      form.setFieldsValue({
        companyId:          data.companyId,
        name:               data.name,
        location:           data.location,
        level:              data.level,
        jobType:            data.jobType,
        category:           data.category ?? '',
        quantity:           data.quantity,
        isSalaryNegotiable: data.isSalaryNegotiable,
        salaryMin:          data.salaryMin,
        salaryMax:          data.salaryMax,
        salaryCurrency:     data.salaryCurrency ?? 'VND',
        experienceRequired: data.experienceRequired,
        description:        data.description,
        requirements:       data.requirements,
        benefits:           data.benefits,
        skillIds:           data.skills.map(s => s.id),
        startDate:          data.startDate ? dayjs(data.startDate) : null,
        endDate:            data.endDate   ? dayjs(data.endDate)   : null,
      })
    } else {
      // Create mode — default values
      setNegotiable(false)
      form.setFieldsValue({
        salaryCurrency: 'VND',
        quantity:       1,
        level:          'JUNIOR',
        jobType:        'FULL_TIME',
        description:    '',
        requirements:   '',
        benefits:       '',
      })
    }
  }, [open, data])

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const body = {
        ...values,
        companyName: myCompany?.name   ?? undefined,
        companyLogo: myCompany?.logo   ?? undefined,
        startDate:   values.startDate  ? values.startDate.toISOString()  : null,
        endDate:     values.endDate    ? values.endDate.toISOString()    : null,
        skillIds:    values.skillIds   ?? [],
      }

      if (isEdit) {
        await updateJobApi(data!.id, body)
        notification.success({ message: 'Cập nhật tin tuyển dụng thành công!', duration: 2 })
      } else {
        await createJobApi(body)
        notification.success({ message: 'Tạo tin tuyển dụng thành công! (Bản nháp)', duration: 2 })
      }

      onSuccess()
    } catch (err: any) {
      if (err?.errorFields) return   // lỗi validation form — không toast
      notification.error({
        message: 'Thất bại',
        description: err?.response?.data?.message || 'Có lỗi xảy ra',
        duration: 3,
      })
    } finally {
      setLoading(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      forceRender
      title={
        <span style={{ fontWeight: 700, color: '#002660', fontSize: 17 }}>
          {isEdit ? '✏️ Chỉnh sửa tin tuyển dụng' : '➕ Đăng tin tuyển dụng mới'}
        </span>
      }
      okText={isEdit ? 'Lưu thay đổi' : 'Tạo bản nháp'}
      cancelText="Huỷ"
      width={720}
      destroyOnClose
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 } }}
    >
      <Form form={form} layout="vertical" requiredMark={false}>

        {/* ── Công ty (read-only) ── */}
        {/* Hidden field để form validation biết companyId */}
        <Form.Item name="companyId" hidden><Input /></Form.Item>
        <Form.Item
          label="Công ty"
          validateStatus={!companyLoading && !myCompany ? 'error' : undefined}
          help={!companyLoading && !myCompany ? 'Bạn chưa liên kết công ty. Vui lòng cập nhật hồ sơ.' : undefined}
        >
          {companyLoading ? (
            <Input disabled placeholder="Đang tải thông tin công ty..." />
          ) : myCompany ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 12px', borderRadius: 6,
              background: '#f5f5f5', border: '1px solid #d9d9d9',
            }}>
              {myCompany.logo && (
                <img
                  src={myCompany.logo}
                  alt={myCompany.name}
                  style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4 }}
                />
              )}
              <span style={{ fontWeight: 600, color: '#1b1c1c' }}>{myCompany.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#888' }}>Công ty của bạn</span>
            </div>
          ) : (
            <Input
              disabled
              placeholder="Bạn chưa liên kết với công ty nào. Vui lòng cập nhật hồ sơ."
              style={{ color: '#ff4d4f' }}
            />
          )}
        </Form.Item>

        {/* ── Tên vị trí ── */}
        <Form.Item name="name" label="Tên vị trí" rules={[{ required: true, message: 'Nhập tên vị trí!' }]}>
          <Input placeholder="VD: Senior Java Developer" />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
          <Form.Item name="level" label="Cấp độ" rules={[{ required: true }]}>
            <Select options={JOB_LEVEL_OPTIONS} />
          </Form.Item>
          <Form.Item name="jobType" label="Hình thức" rules={[{ required: true }]}>
            <Select options={JOB_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="category" label="Ngành nghề" rules={[{ required: true, message: 'Vui lòng nhập ngành nghề!' }]}>
            <Input placeholder="VD: Kỹ thuật, Kinh doanh..." />
          </Form.Item>
          <Form.Item name="quantity" label="Số lượng" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <Form.Item name="location" label="Địa điểm">
          <Input placeholder="VD: Hà Nội, TP.HCM, Remote..." />
        </Form.Item>

        {/* ── Lương ── */}
        <Form.Item name="isSalaryNegotiable" valuePropName="checked" label=" ">
          <Checkbox
            onChange={e => {
              setNegotiable(e.target.checked)
              form.setFieldsValue({ salaryMin: null, salaryMax: null })
            }}
          >
            Lương thoả thuận
          </Checkbox>
        </Form.Item>

        {!negotiable && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: 12 }}>
            <Form.Item name="salaryMin" label="Lương tối thiểu">
              <InputNumber<number>
                min={0}
                step={currency === 'USD' ? 100 : 1_000_000}
                style={{ width: '100%' }}
                formatter={v => v != null ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                parser={v => parseFloat((v ?? '').replace(/,/g, '')) || 0}
              />
            </Form.Item>
            <Form.Item name="salaryMax" label="Lương tối đa">
              <InputNumber<number>
                min={0}
                step={currency === 'USD' ? 100 : 1_000_000}
                style={{ width: '100%' }}
                formatter={v => v != null ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                parser={v => parseFloat((v ?? '').replace(/,/g, '')) || 0}
              />
            </Form.Item>
            <Form.Item name="salaryCurrency" label="Tiền tệ">
              <Select
                options={[{ label: 'VND', value: 'VND' }, { label: 'USD', value: 'USD' }]}
                onChange={() => form.setFieldsValue({ salaryMin: null, salaryMax: null })}
              />
            </Form.Item>
          </div>
        )}

        <Form.Item name="experienceRequired" label="Kinh nghiệm yêu cầu">
          <Input placeholder="VD: 2-3 năm kinh nghiệm Java..." />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item name="startDate" label="Ngày bắt đầu">
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="endDate" label="Hạn nộp">
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </div>

        {/* ── Kỹ năng ── */}
        <Form.Item name="skillIds" label="Kỹ năng yêu cầu">
          <Select
            mode="multiple"
            placeholder="Chọn kỹ năng..."
            options={skills.map(s => ({ label: s.name, value: s.id }))}
            optionFilterProp="label"
            showSearch
          />
        </Form.Item>

        <Form.Item name="description" label="Mô tả công việc">
          <ReactQuill theme="snow" modules={quillModules} placeholder="Mô tả chi tiết về công việc và trách nhiệm..." />
        </Form.Item>

        <Form.Item
          name="requirements"
          label={
            <span style={{ fontWeight: 600 }}>
              Yêu cầu ứng viên
              <span style={{ marginLeft: 6, fontSize: 12, color: '#747783', fontWeight: 400 }}>
                (Your skills and experience)
              </span>
            </span>
          }
        >
          <ReactQuill
            theme="snow"
            modules={quillModules}
            placeholder="VD: Tốt nghiệp đại học CNTT, Thành thạo Java Spring Boot..."
          />
        </Form.Item>

        <Form.Item name="benefits" label="Phúc lợi">
          <ReactQuill
            theme="snow"
            modules={quillModules}
            placeholder="Các phúc lợi dành cho ứng viên (Lương thưởng, bảo hiểm, du lịch...)"
          />
        </Form.Item>

      </Form>
    </Modal>
  )
}

export default JobFormModal
