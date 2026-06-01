import { useEffect, useState } from 'react'
import { App, Form, Image, Input, Modal, Select, Row, Col, Upload } from 'antd'
import type { UploadFile } from 'antd'
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import type { ICompany, CompanyBody } from '../../../types/company'
import { updateCompanyApi, uploadCompanyImageApi } from '../../../services/company-service'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  data: ICompany | null
  onSuccess: () => void
}

const COMPANY_SIZE_OPTIONS = [
  { value: 'STARTUP',    label: 'Startup (< 50 nhân viên)' },
  { value: 'SME',        label: 'Vừa (50 – 200 nhân viên)' },
  { value: 'ENTERPRISE', label: 'Lớn (200+ nhân viên)' },
]

const ACCEPT_TYPES = 'image/jpeg,image/png,image/gif,image/webp'
const isImage = (type: string) => ['image/jpeg','image/png','image/gif','image/webp'].includes(type)

/** Chuyển URL string → UploadFile (1 phần tử) */
const urlToFileList = (url: string | undefined, name: string): UploadFile[] =>
  url ? [{ uid: url, name, status: 'done' as const, url }] : []

const UpdateCompanyModal = ({ open, onOpenChange, data, onSuccess }: Props) => {
  const [form]    = Form.useForm<CompanyBody>()
  const [loading, setLoading] = useState(false)
  const { notification } = App.useApp()

  // ── Upload file lists (AntD built-in preview + delete) ────────────────────
  const [logoFileList,     setLogoFileList]     = useState<UploadFile[]>([])
  const [logoLoading,      setLogoLoading]      = useState(false)
  const [coverFileList,    setCoverFileList]    = useState<UploadFile[]>([])
  const [coverLoading,     setCoverLoading]     = useState(false)
  const [activityFileList, setActivityFileList] = useState<UploadFile[]>([])
  const [activityLoading,  setActivityLoading]  = useState(false)

  const [desc, setDesc] = useState('')

  // ── Preview state ──────────────────────────────────────────────────────────
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSrc,  setPreviewSrc]  = useState('')

  // ── Populate form khi mở modal ─────────────────────────────────────────────
  useEffect(() => {
    if (open && data) {
      form.setFieldsValue({
        name:           data.name,
        address:        data.address,
        logo:           data.logo,
        coverImage:     data.coverImage,
        activityImages: data.activityImages ?? [],
        industry:       data.industry,
        companySize:    data.companySize,
        website:        data.website,
        contactEmail:   data.contactEmail,
        taxCode:        data.taxCode,
      })
      setLogoFileList(urlToFileList(data.logo, 'logo'))
      setCoverFileList(urlToFileList(data.coverImage, 'cover'))
      setActivityFileList(
        (data.activityImages ?? []).map((url, i) => ({
          uid: url, name: `activity-${i + 1}`, status: 'done' as const, url,
        }))
      )
      setDesc(data.description ?? '')
    } else if (!open) {
      setLogoFileList([])
      setCoverFileList([])
      setActivityFileList([])
      setDesc('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, data])

  // ── Upload helpers ─────────────────────────────────────────────────────────
  const handleLogoUpload = async (file: File): Promise<false> => {
    try {
      setLogoLoading(true)
      const res = await uploadCompanyImageApi(file)
      const url = res.data.url
      setLogoFileList([{ uid: url, name: file.name, status: 'done', url }])
      form.setFieldValue('logo', url)
      notification.success({ message: 'Tải ảnh logo thành công' })
    } catch (err: any) {
      notification.error({ message: 'Tải ảnh logo thất bại', description: err?.response?.data?.message || 'Lỗi kết nối' })
    } finally { setLogoLoading(false) }
    return false
  }

  const handleCoverUpload = async (file: File): Promise<false> => {
    try {
      setCoverLoading(true)
      const res = await uploadCompanyImageApi(file)
      const url = res.data.url
      setCoverFileList([{ uid: url, name: file.name, status: 'done', url }])
      form.setFieldValue('coverImage', url)
      notification.success({ message: 'Tải ảnh bìa thành công' })
    } catch (err: any) {
      notification.error({ message: 'Tải ảnh bìa thất bại', description: err?.response?.data?.message || 'Lỗi kết nối' })
    } finally { setCoverLoading(false) }
    return false
  }

  const handleActivityUpload = async (file: File): Promise<false> => {
    if (activityFileList.length >= 4) {
      notification.warning({ message: 'Tối đa 4 ảnh hoạt động' })
      return false
    }
    try {
      setActivityLoading(true)
      const res = await uploadCompanyImageApi(file)
      const url = res.data.url
      const newFile: UploadFile = { uid: url, name: file.name, status: 'done', url }
      setActivityFileList(prev => {
        const next = [...prev, newFile]
        form.setFieldValue('activityImages', next.map(f => f.url))
        return next
      })
      notification.success({ message: 'Tải ảnh hoạt động thành công' })
    } catch (err: any) {
      notification.error({ message: 'Tải ảnh thất bại', description: err?.response?.data?.message || 'Lỗi kết nối' })
    } finally { setActivityLoading(false) }
    return false
  }

  const handlePreview = (file: UploadFile) => {
    setPreviewSrc(file.url || file.thumbUrl || '')
    setPreviewOpen(true)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      await updateCompanyApi(data!.id!, {
        ...values,
        description:    desc || undefined,
        logo:           logoFileList[0]?.url,
        coverImage:     coverFileList[0]?.url,
        activityImages: activityFileList.length ? activityFileList.map(f => f.url as string) : [],
      })
      notification.success({ message: 'Thành công', description: 'Cập nhật công ty thành công', duration: 2 })
      onSuccess()
    } catch (err: any) {
      if (err?.errorFields) return
      notification.error({ message: 'Thất bại', description: err?.response?.data?.message || 'Cập nhật công ty thất bại', duration: 3 })
    } finally { setLoading(false) }
  }

  return (
    <>
      <Modal
        title="Cập nhật Công ty"
        open={open}
        onOk={handleOk}
        onCancel={() => { onOpenChange(false); form.resetFields() }}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        confirmLoading={loading}
        width={800}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="name" label="Tên công ty" rules={[{ required: true, message: 'Vui lòng nhập tên công ty' }]}>
                <Input placeholder="Tên công ty" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="industry" label="Ngành nghề">
                <Input placeholder="VD: Công nghệ thông tin, Tài chính..." />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="companySize" label="Quy mô">
                <Select options={COMPANY_SIZE_OPTIONS} placeholder="Chọn quy mô" allowClear style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="taxCode" label="Mã số thuế">
                <Input placeholder="Mã số thuế" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="contactEmail" label="Email liên hệ">
                <Input placeholder="contact@company.com" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="website" label="Website">
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="address" label="Địa chỉ">
                <Input placeholder="Địa chỉ công ty" />
              </Form.Item>
            </Col>

            {/* Logo */}
            <Col xs={24} md={12}>
              <Form.Item name="logo" label="Logo công ty">
                <Upload
                  listType="picture-card"
                  fileList={logoFileList}
                  accept={ACCEPT_TYPES}
                  onPreview={handlePreview}
                  onRemove={() => { setLogoFileList([]); form.setFieldValue('logo', undefined); return false }}
                  beforeUpload={(file) => {
                    if (!isImage(file.type)) { notification.error({ message: 'Chỉ hỗ trợ JPG, PNG, GIF, WEBP' }); return Upload.LIST_IGNORE }
                    handleLogoUpload(file)
                    return false
                  }}
                >
                  {logoFileList.length === 0 && (
                    <div>{logoLoading ? <LoadingOutlined /> : <PlusOutlined />}<div style={{ marginTop: 8 }}>Tải logo</div></div>
                  )}
                </Upload>
              </Form.Item>
            </Col>

            {/* Ảnh bìa */}
            <Col xs={24} md={12}>
              <Form.Item name="coverImage" label="Ảnh bìa công ty">
                <Upload
                  listType="picture-card"
                  fileList={coverFileList}
                  accept={ACCEPT_TYPES}
                  onPreview={handlePreview}
                  onRemove={() => { setCoverFileList([]); form.setFieldValue('coverImage', undefined); return false }}
                  beforeUpload={(file) => {
                    if (!isImage(file.type)) { notification.error({ message: 'Chỉ hỗ trợ JPG, PNG, GIF, WEBP' }); return Upload.LIST_IGNORE }
                    handleCoverUpload(file)
                    return false
                  }}
                >
                  {coverFileList.length === 0 && (
                    <div>{coverLoading ? <LoadingOutlined /> : <PlusOutlined />}<div style={{ marginTop: 8 }}>Tải ảnh bìa</div></div>
                  )}
                </Upload>
              </Form.Item>
            </Col>

            {/* Ảnh hoạt động */}
            <Col span={24}>
              <Form.Item
                name="activityImages"
                label={
                  <span>
                    Ảnh văn phòng / hoạt động
                    <span style={{ fontWeight: 400, color: '#888', marginLeft: 6 }}>({activityFileList.length}/4 ảnh)</span>
                  </span>
                }
              >
                <Upload
                  listType="picture-card"
                  fileList={activityFileList}
                  accept={ACCEPT_TYPES}
                  multiple
                  onPreview={handlePreview}
                  onRemove={(file) => {
                    setActivityFileList(prev => {
                      const next = prev.filter(f => f.uid !== file.uid)
                      form.setFieldValue('activityImages', next.map(f => f.url))
                      return next
                    })
                    return false
                  }}
                  beforeUpload={(file) => {
                    if (!isImage(file.type)) { notification.error({ message: 'Chỉ hỗ trợ JPG, PNG, GIF, WEBP' }); return Upload.LIST_IGNORE }
                    if (activityFileList.length >= 4) { notification.warning({ message: 'Tối đa 4 ảnh hoạt động' }); return Upload.LIST_IGNORE }
                    handleActivityUpload(file)
                    return false
                  }}
                >
                  {activityFileList.length < 4 && (
                    <div>
                      {activityLoading ? <LoadingOutlined /> : <PlusOutlined />}
                      <div style={{ marginTop: 8, fontSize: 12 }}>Thêm ảnh</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="Giới thiệu công ty">
                <ReactQuill
                  theme="snow"
                  value={desc}
                  onChange={setDesc}
                  placeholder="Mô tả lĩnh vực, sứ mệnh và văn hoá doanh nghiệp..."
                  style={{ minHeight: 160 }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* AntD Image preview modal */}
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

export default UpdateCompanyModal
