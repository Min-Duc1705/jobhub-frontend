import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Form, Button, Image } from 'antd'
import { message } from '../../../utils/antd'
import type { CompanyBody, CompanySize } from '../../../types/company'
import { registerCompanyApi, uploadCompanyPublicImageApi } from '../../../services/company-service'
import RegisterSuccess from '../../../components/shared/company/RegisterSuccess'
import RegisterStepBasic from '../../../components/shared/company/RegisterStepBasic'
import RegisterStepImages from '../../../components/shared/company/RegisterStepImages'
import RegisterStepVerify from '../../../components/shared/company/RegisterStepVerify'
import './CompanyRegisterPage.scss'

const CompanyRegisterPage = () => {
  const navigate = useNavigate()
  const { notification } = App.useApp()
  const [form] = Form.useForm()

  const [step,        setStep]        = useState(0)   // 0 | 1 | 2
  const [submitting,  setSubmitting]  = useState(false)
  const [done,        setDone]        = useState(false)
  const [desc,        setDesc]        = useState('')  // ReactQuill controlled state

  // ── Image state
  const [logoFile,         setLogoFile]         = useState<File | null>(null)
  const [logoPreview,      setLogoPreview]      = useState<string | null>(null)
  const [coverFile,        setCoverFile]        = useState<File | null>(null)
  const [coverPreview,     setCoverPreview]     = useState<string | null>(null)
  const [activityFiles,    setActivityFiles]    = useState<File[]>([])
  const [activityPreviews, setActivityPreviews] = useState<string[]>([])
  const [uploadingImg,     setUploadingImg]     = useState(false)

  // ── Preview state (logo / cover)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSrc,  setPreviewSrc]  = useState('')

  // ─── Image pick helpers ─────────────────────────────────────────────────────
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { message.error('Logo tối đa 2MB.'); return }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { message.error('Ảnh bìa tối đa 5MB.'); return }
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const handleActivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const remaining = 4 - activityFiles.length
    if (remaining <= 0) { message.warning('Tối đa 4 ảnh hoạt động.'); return }
    const selected = files.slice(0, remaining)
    const oversized = selected.some(f => f.size > 5 * 1024 * 1024)
    if (oversized) { message.error('Mỗi ảnh tối đa 5MB.'); return }
    setActivityFiles(prev => [...prev, ...selected])
    setActivityPreviews(prev => [...prev, ...selected.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }

  const removeActivityImage = (idx: number) => {
    setActivityFiles(prev => prev.filter((_, i) => i !== idx))
    setActivityPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  // ─── Step navigation ────────────────────────────────────────────────────────
  const nextStep = async () => {
    if (step === 0) {
      try {
        const fieldsToValidate = ['name', 'industry']
        if (form.getFieldValue('industry') === 'Khác') {
          fieldsToValidate.push('customIndustry')
        }
        await form.validateFields(fieldsToValidate)
      } catch {
        return
      }
    }
    setStep(s => s + 1)
  }

  const prevStep = () => setStep(s => s - 1)

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true)
    setUploadingImg(true)

    try {
      const values = form.getFieldsValue(true) as CompanyBody & {
        companySize?: CompanySize
        customIndustry?: string
      }

      // 1. Upload images if selected
      let logoUrl: string | undefined
      let coverUrl: string | undefined
      const activityUrls: string[] = []

      if (logoFile) {
        const res = await uploadCompanyPublicImageApi(logoFile)
        logoUrl = res.data?.url
      }
      if (coverFile) {
        const res = await uploadCompanyPublicImageApi(coverFile)
        coverUrl = res.data?.url
      }
      for (const f of activityFiles) {
        const res = await uploadCompanyPublicImageApi(f)
        if (res.data?.url) activityUrls.push(res.data.url)
      }

      setUploadingImg(false)

      // 2. Register company
      const payload: CompanyBody = {
        name:           values.name,
        description:    values.description,
        address:        values.address,
        industry:       values.industry === 'Khác' ? values.customIndustry : values.industry,
        companySize:    values.companySize,
        website:        values.website,
        contactEmail:   values.contactEmail,
        taxCode:        values.taxCode,
        logo:           logoUrl,
        coverImage:     coverUrl,
        activityImages: activityUrls.length ? activityUrls : undefined,
      }

      await registerCompanyApi(payload)
      setDone(true)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.'
      notification.error({ message: 'Đăng ký thất bại', description: msg, placement: 'topRight' })
    } finally {
      setSubmitting(false)
      setUploadingImg(false)
    }
  }

  // ─── Success screen ─────────────────────────────────────────────────────────
  if (done) {
    return <RegisterSuccess onBack={() => navigate('/candidate/profile')} />
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="cr-wrap">
        {/* Sticky header */}
        <div className="cr-header">
          <div className="cr-header__inner">
            <button className="cr-header__back" onClick={() => navigate(-1)}>
              <span className="material-symbols-outlined">arrow_back</span>
              Quay lại
            </button>
            <div className="cr-header__divider" />
            <span className="cr-header__title">Đăng ký Hồ sơ Công ty</span>
          </div>
        </div>

        <div className="cr-body">
          {/* Page heading */}
          <div className="cr-heading">
            <h1>Thiết lập Hồ sơ Công ty</h1>
            <p>Hoàn thành các bước dưới đây để bắt đầu đăng tuyển và tìm kiếm tài năng.</p>
          </div>

          {/* Stepper */}
          <div className="cr-stepper">
            {[
              'Thông tin cơ bản',
              'Hình ảnh & Thương hiệu',
              'Xác thực doanh nghiệp',
            ].map((label, i) => {
              const cls = i < step ? 'done' : i === step ? 'active' : ''
              return (
                <div key={i} className={`cr-step cr-step--${cls}`}>
                  <div className="cr-step__circle">
                    {i < step ? (
                      <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
                        check
                      </span>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className="cr-step__label">{label}</span>
                </div>
              )
            })}
          </div>

          {/* Form */}
          <Form form={form} layout="vertical" requiredMark={false}>
            {/* STEP 0: Basic Info */}
            {step === 0 && (
              <RegisterStepBasic
                form={form}
                desc={desc}
                setDesc={setDesc}
              />
            )}

            {/* STEP 1: Images */}
            {step === 1 && (
              <RegisterStepImages
                logoPreview={logoPreview}
                handleLogoChange={handleLogoChange}
                setPreviewSrc={setPreviewSrc}
                setPreviewOpen={setPreviewOpen}
                coverPreview={coverPreview}
                handleCoverChange={handleCoverChange}
                activityPreviews={activityPreviews}
                removeActivityImage={removeActivityImage}
                handleActivityChange={handleActivityChange}
              />
            )}

            {/* STEP 2: Verify info */}
            {step === 2 && (
              <RegisterStepVerify
                form={form}
                logoPreview={logoPreview}
                coverPreview={coverPreview}
              />
            )}

            {/* Footer buttons */}
            <div className="cr-footer">
              {step > 0 && (
                <Button size="large" onClick={prevStep}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle' }}>arrow_back</span>
                  &nbsp;Quay lại
                </Button>
              )}
              {step < 2 && (
                <Button type="primary" size="large" onClick={nextStep}>
                  Tiếp tục&nbsp;
                  <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle' }}>arrow_forward</span>
                </Button>
              )}
              {step === 2 && (
                <Button
                  type="primary"
                  size="large"
                  loading={submitting}
                  onClick={handleSubmit}
                  icon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span>}
                  iconPosition="end"
                >
                  {uploadingImg ? 'Đang tải ảnh...' : 'Gửi đăng ký'}
                </Button>
              )}
            </div>
          </Form>
        </div>
      </div>

      {/* AntD Image preview modal (logo / cover) */}
      <Image
        style={{ display: 'none' }}
        preview={{
          visible: previewOpen,
          src: previewSrc,
          onVisibleChange: (v) => setPreviewOpen(v),
        }}
      />
    </>
  )
}

export default CompanyRegisterPage
