import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  App, Form, Input, DatePicker, Select, InputNumber,
  Switch, Button, Tag, Progress, Popconfirm,
  Avatar, Image, Spin, Alert,
} from 'antd'
import { message } from '../../../utils/antd'
import dayjs from 'dayjs'
import { useAppSelector, useAppDispatch } from '../../../redux/hooks'
import { setAvatarUrl as syncAvatarUrl, fetchAccount } from '../../../redux/slices/authSlice'
import { updateUsernameApi } from '../../../services/auth-service'
import {
  getMyProfileApi,
  updateMyProfileApi,
  uploadAvatarApi,
  getSkillsDropdownApi,
  addSkillToProfileApi,
  removeSkillFromProfileApi,
} from '../../../services/profile-service'
import type { CustomerProfile, CustomerSkillDto, SkillOption } from '../../../types/profile'
import { getVerifiedCompaniesApi } from '../../../services/company-service'
import './ProfileSettings.scss'

const { TextArea } = Input
const { Option }   = Select

// ─── Constants ─────────────────────────────────────────────────────
const JOB_STATUS_OPTIONS = [
  { value: 'ACTIVELY_LOOKING', label: 'Đang tìm việc tích cực' },
  { value: 'OPEN_TO_OFFERS',   label: 'Sẵn sàng nghe cơ hội'   },
  { value: 'NOT_LOOKING',      label: 'Không tìm việc hiện tại' },
]

const GENDER_OPTIONS = [
  { value: 'MALE',   label: 'Nam'  },
  { value: 'FEMALE', label: 'Nữ'   },
  { value: 'OTHER',  label: 'Khác' },
]

// PROVINCES được tải động từ vietnamlabs.com/api/vietnamprovince (xem useEffect bên dưới)

// ─── Address helpers ──────────────────────────────────────────────
// 3-level format: "addressDetail | ward | province"
const SEP = ' | '
const buildAddress = (parts: { province?: string; ward?: string; addressDetail?: string }) => {
  const { province = '', ward = '', addressDetail = '' } = parts
  return [addressDetail, ward, province].filter(Boolean).join(SEP) || null
}
const parseAddress = (raw: string | null | undefined) => {
  if (!raw) return { province: undefined, ward: undefined, addressDetail: undefined }
  const parts = raw.split(SEP)
  if (parts.length === 3) return {
    addressDetail: parts[0] || undefined,
    ward:          parts[1] || undefined,
    province:      parts[2] || undefined,
  }
  // Legacy 4-part format (district was removed) — map gracefully
  if (parts.length === 4) return {
    addressDetail: parts[0] || undefined,
    ward:          parts[1] || undefined,
    // skip parts[2] (district)
    province:      parts[3] || undefined,
  }
  // Fully legacy plain string → put into addressDetail
  return { addressDetail: raw, ward: undefined, province: undefined }
}

// ─── Helpers ───────────────────────────────────────────────────────
const getInitials = (name: string) =>
  name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

const calcStrength = (vals: Record<string, any>, skills: CustomerSkillDto[]) => {
  const checks = [
    vals?.fullName, vals?.phone, vals?.dateOfBirth,
    vals?.gender,   vals?.province, vals?.summary,
    vals?.yearsOfExperience, vals?.expectedSalary,
    skills.length > 0,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

const strengthRank = (s: number) => {
  if (s >= 80) return { rank: 'A+', color: '#005daa' }
  if (s >= 60) return { rank: 'B',  color: '#1677ff' }
  if (s >= 40) return { rank: 'C',  color: '#faad14' }
  return            { rank: 'D',  color: '#ff4d4f' }
}

// ─── Component ─────────────────────────────────────────────────────
const ProfileSettings = () => {
  const [form]   = Form.useForm()
  const { user } = useAppSelector(s => s.auth)
  const dispatch  = useAppDispatch()
  const { notification } = App.useApp()
  const navigate = useNavigate()

  // ── Loading / Error state
  const [loading,   setLoading]   = useState(true)
  const [isSaving,  setIsSaving]  = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // ── Profile data
  const [profile,  setProfile]  = useState<CustomerProfile | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Clean up object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // ── Skills
  const [skills,           setSkills]           = useState<CustomerSkillDto[]>([])
  const [skillOptions,     setSkillOptions]     = useState<SkillOption[]>([])
  const [addingSkill,      setAddingSkill]      = useState(false)
  const [selectedSkillId,  setSelectedSkillId]  = useState<string | null>(null)
  const [newSkillYears,    setNewSkillYears]    = useState<number>(1)
  const [skillActionId,    setSkillActionId]    = useState<string | null>(null) // which skill is being actioned

  // ── Notifications (UI only, extend later)
  const [notif, setNotif] = useState({ newJobs: true, recruiter: true, newsletter: false })

  // ── Ward (Phường/Xã) + Province data from vietnamlabs.com API
  interface VietnamProvinceItem {
    id: string
    province: string
    wards: { name: string; mergedFrom: string[] }[]
  }
  const [allProvinceData, setAllProvinceData] = useState<VietnamProvinceItem[]>([])
  const [provinceOptions,  setProvinceOptions]  = useState<{ value: string; label: string }[]>([])
  const [wardOptions,   setWardOptions]   = useState<{ value: string; label: string }[]>([])
  const [loadingWards,  setLoadingWards]  = useState(false)
  const [companyOptions, setCompanyOptions] = useState<{ value: string; label: string }[]>([])

  // ── Profile strength
  const watched = Form.useWatch([], form)
  const [strength, setStrength] = useState(0)
  useEffect(() => { setStrength(calcStrength(watched ?? {}, skills)) }, [watched, skills])
  const { rank, color } = strengthRank(strength)

  // ── Fetch tất cả tỉnh/phường từ vietnamlabs.com khi mount ──────────
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const res  = await fetch('https://vietnamlabs.com/api/vietnamprovince')
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setAllProvinceData(json.data)
          setProvinceOptions(
            json.data.map((p: any) => ({ value: p.province, label: p.province }))
          )
        }
      } catch {
        // Fallback: để trống — user có thể nhập tay
        console.warn('Vietnam Province API không khả dụng')
      }
    }
    loadProvinces()
  }, [])

  // ── Khi user chọn tỉnh → lọc phường/xã từ cache ─────────────────
  const selectProvince = (provinceName: string | undefined) => {
    setWardOptions([])
    if (!provinceName) return
    const found = allProvinceData.find(p => p.province === provinceName)
    if (found) {
      setWardOptions(found.wards.map(w => ({ value: w.name, label: w.name })))
    }
  }

  // Khi allProvinceData v\u1eeba load xong, n\u1ebfu form \u0111\u00e3 c\u00f3 t\u1ec9nh \u2192 populate ward lu\u00f4n
  // (x\u1eed l\u00fd race-condition: profile load xong tr\u01b0\u1edbc khi province API tr\u1ea3 v\u1ec1)
  useEffect(() => {
    if (allProvinceData.length === 0) return
    const currentProvince = form.getFieldValue('province')
    if (currentProvince) selectProvince(currentProvince)
  }, [allProvinceData]) // eslint-disable-line react-hooks/exhaustive-deps

  // Alias cho các nơi g\u1ecdi fetchWards(addr.province) trong loadData
  const fetchWards = selectProvince


  // ── Load profile & skills on mount ─────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const [profileRes, skillsRes] = await Promise.all([
        getMyProfileApi(),
        getSkillsDropdownApi(),
      ])

      const p = profileRes.data
      setProfile(p)
      setAvatarUrl(p.avatar)
      dispatch(syncAvatarUrl(p.avatar))   // sync header
      setSkills(p.skills ?? [])

      // Reset local file/preview selection
      setAvatarFile(null)
      setPreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })

      // Pre-fill form
      const addr = parseAddress(p.address)
      form.setFieldsValue({
        fullName:          p.fullName,
        email:             user?.email,
        username:          user?.username,
        phone:             p.phone,
        dateOfBirth:       p.dateOfBirth ? dayjs(p.dateOfBirth) : null,
        gender:            p.gender,
        province:          addr.province,
        ward:              addr.ward,
        addressDetail:     addr.addressDetail,
        summary:           p.summary,
        yearsOfExperience: p.yearsOfExperience,
        expectedSalary:    p.expectedSalary,
        jobSearchStatus:   p.jobSearchStatus ?? 'OPEN_TO_OFFERS',
        position:          p.position,
        companyId:         p.companyId,
      })

      // Fetch companies list if user is an employer
      if (p.type === 'EMPLOYER') {
        try {
          const compRes = await getVerifiedCompaniesApi("pageSize=100")
          const options = (compRes.data?.result ?? []).map(c => ({
            value: c.id ?? '',
            label: c.name ?? ''
          }))
          setCompanyOptions(options)
        } catch (err) {
          console.error("Failed to load companies", err)
        }
      }

      // Pre-load wards if province was already set
      if (addr.province) fetchWards(addr.province)

      // Available skills to choose from (loại trừ đã có)
      setSkillOptions(skillsRes.data ?? [])
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể tải hồ sơ. Vui lòng thử lại.'
      setFetchError(msg)
    } finally {
      setLoading(false)
    }
  }, [form, user?.email])

  useEffect(() => {
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // F5 race-condition fix: fetchAccount resolve sau loadData → fill email/username khi user sẵn sàng
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        email: user.email,
        username: user.username,
      })
    }
  }, [user, form]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save profile ────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setIsSaving(true)

      let finalAvatarUrl = avatarUrl

      // --- STAGE 1: Parallel execute (Username update & Avatar upload)
      const stage1Promises: Promise<any>[] = []
      let usernamePromiseIndex = -1
      let avatarPromiseIndex = -1

      if (values.username && values.username !== user?.username) {
        usernamePromiseIndex = stage1Promises.length
        stage1Promises.push(updateUsernameApi(values.username))
      }

      if (avatarFile) {
        setAvatarUploading(true)
        avatarPromiseIndex = stage1Promises.length
        stage1Promises.push(uploadAvatarApi(avatarFile))
      }

      const stage1Results = await Promise.all(stage1Promises)

      // Retrieve Stage 1 results
      if (avatarPromiseIndex !== -1) {
        const uploadRes = stage1Results[avatarPromiseIndex]
        finalAvatarUrl = uploadRes.data?.url || uploadRes.data?.Url
        setAvatarUrl(finalAvatarUrl)
        setAvatarFile(null)
        setPreviewUrl(prev => {
          if (prev) URL.revokeObjectURL(prev)
          return null
        })
        setAvatarUploading(false)
      }

      // --- STAGE 2: Parallel execute (Profile save & Redux auth sync)
      const stage2Promises: Promise<any>[] = []
      let authSyncPromiseIndex = -1
      let profileSavePromiseIndex = -1

      if (usernamePromiseIndex !== -1) {
        authSyncPromiseIndex = stage2Promises.length
        stage2Promises.push(dispatch(fetchAccount()))
      }

      const payload = {
        fullName:          values.fullName,
        avatar:            finalAvatarUrl,
        phone:             values.phone,
        dateOfBirth:       values.dateOfBirth
                             ? (values.dateOfBirth as dayjs.Dayjs).format('YYYY-MM-DD')
                             : null,
        gender:            values.gender || null,
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
        companyId:         isEmployer ? (values.companyId || null) : null,
      }

      profileSavePromiseIndex = stage2Promises.length
      stage2Promises.push(updateMyProfileApi(payload))

      const stage2Results = await Promise.all(stage2Promises)

      const profileRes = stage2Results[profileSavePromiseIndex]
      setProfile(profileRes.data)
      setAvatarUrl(profileRes.data.avatar)
      dispatch(syncAvatarUrl(profileRes.data.avatar))  // sync header

      notification.success({
        message: 'Cập nhật thành công',
        description: 'Hồ sơ cá nhân của bạn đã được lưu lại.',
        placement: 'topRight',
        duration: 3,
      })
    } catch (err: any) {
      const msg = err?.response?.data?.message
      if (msg) {
        notification.error({
          message: 'Cập nhật thất bại',
          description: msg,
          placement: 'topRight',
          duration: 4,
        })
      } else {
        notification.warning({
          message: 'Thông tin chưa hợp lệ',
          description: 'Vui lòng kiểm tra lại các trường bắt buộc.',
          placement: 'topRight',
          duration: 4,
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  // ── Avatar selection & preview ──────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowed.includes(file.type)) {
      message.error('Chỉ hỗ trợ ảnh JPG, PNG, GIF, WEBP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error('Kích thước ảnh tối đa 5MB.')
      return
    }

    setAvatarFile(file)
    setPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  // ── Add skill ───────────────────────────────────────────────────
  const handleAddSkill = async () => {
    if (!selectedSkillId) { message.warning('Vui lòng chọn kỹ năng.'); return }
    if (skills.some(s => s.skillId === selectedSkillId)) {
      message.warning('Kỹ năng này đã có trong hồ sơ.'); return
    }
    setSkillActionId(selectedSkillId)
    try {
      const res = await addSkillToProfileApi(selectedSkillId, newSkillYears)
      setSkills(res.data.skills)
      setSelectedSkillId(null)
      setNewSkillYears(1)
      setAddingSkill(false)
      message.success('Đã thêm kỹ năng vào hồ sơ.')
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Thêm kỹ năng thất bại.')
    } finally {
      setSkillActionId(null)
    }
  }

  // ── Remove skill ────────────────────────────────────────────────
  const handleRemoveSkill = async (skillId: string) => {
    setSkillActionId(skillId)
    try {
      const res = await removeSkillFromProfileApi(skillId)
      setSkills(res.data.skills)
      message.success('Đã xóa kỹ năng.')
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Xóa kỹ năng thất bại.')
    } finally {
      setSkillActionId(null)
    }
  }

  // ── Available skills to add (loại trừ đã có) ────────────────────
  const availableSkills = skillOptions.filter(
    opt => !skills.some(s => s.skillId === opt.id)
  )

  // ─── Render ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="ps-loading">
        <Spin size="large" tip="Đang tải hồ sơ..." />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="ps-loading">
        <Alert
          type="error"
          message="Không thể tải hồ sơ"
          description={fetchError}
          action={<Button onClick={loadData}>Thử lại</Button>}
          showIcon
        />
      </div>
    )
  }

  const displayName = profile?.fullName || user?.username || user?.email || 'U'
  const isEmployer  = profile?.type === 'EMPLOYER'

  return (
    <div className="profile-settings">

      {/* ── Page Header ── */}
      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-header__title">Cài đặt cá nhân</h1>
          <p className="ps-page-header__sub">Quản lý thông tin hồ sơ và quyền riêng tư của bạn.</p>
        </div>
        <div className="ps-page-header__actions">
          <Button onClick={loadData}>Hủy thay đổi</Button>
          <Button
            type="primary"
            loading={isSaving}
            onClick={handleSave}
            icon={<span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>}
            iconPosition="start"
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>

      {/* ── Profile Strength Banner ── */}
      <div className="ps-strength-card">
        <div className="ps-strength-card__glow" />
        <div className="ps-strength-card__icon">
          <span className="material-symbols-outlined">rocket_launch</span>
        </div>
        <div className="ps-strength-card__body">
          <div className="ps-strength-card__top">
            <span className="ps-strength-card__label">Độ mạnh hồ sơ của bạn</span>
            <span className="ps-strength-card__badge" style={{ color, background: `${color}18` }}>
              Hạng {rank} ({strength}%)
            </span>
          </div>
          <Progress
            percent={strength}
            showInfo={false}
            strokeColor={{ from: '#005daa', to: '#7c3aed' }}
            trailColor="#e9e8e8"
            strokeWidth={10}
          />
          <p className="ps-strength-card__tip">
            Mẹo: Điền đầy đủ thông tin để tăng khả năng được nhà tuyển dụng tìm thấy.
          </p>
        </div>
        <Button className="ps-strength-cta" onClick={handleSave} loading={isSaving}>
          Lưu ngay
        </Button>
      </div>

      {/* ── Main Form ── */}
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        className="ps-form-root"
      >
        <div className="ps-grid">

          {/* ── LEFT COLUMN ── */}
          <div className="ps-left">

            {/* Basic Info */}
            <section className="ps-card">
              <div className="ps-card__header">
                <span className="material-symbols-outlined">badge</span>
                <h2>Thông tin cá nhân</h2>
              </div>

              {/* Avatar */}
              <div className="ps-avatar-row">
                <div className="ps-avatar-wrap">
                  {avatarUploading ? (
                    <div className="ps-avatar ps-avatar--loading">
                      <Spin size="small" />
                    </div>
                  ) : previewUrl || avatarUrl ? (
                    <Image
                      src={previewUrl || avatarUrl || ''}
                      alt="Avatar"
                      width={72}
                      height={72}
                      className="ps-avatar ps-avatar--img"
                      preview={{
                        mask: (
                          <span style={{ fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>zoom_in</span>
                            Xem ảnh
                          </span>
                        ),
                      }}
                    />
                  ) : (
                    <Avatar size={72} className="ps-avatar">
                      {getInitials(displayName)}
                    </Avatar>
                  )}
                  <label className="ps-avatar-edit" htmlFor="avatar-input" title="Đổi ảnh">
                    <span className="material-symbols-outlined">photo_camera</span>
                  </label>
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                  />
                </div>
                <div className="ps-avatar-info">
                  <p className="ps-avatar-name">{displayName}</p>
                  <p className="ps-avatar-email">{user?.email}</p>
                  <p className="ps-avatar-hint">JPG, PNG, GIF — tối đa 5MB</p>
                </div>
              </div>

              <div className="ps-form-grid">
                <Form.Item
                  name="username"
                  label="Tên hiển thị"
                  rules={[
                    { required: true, message: 'Vui lòng nhập tên hiển thị' },
                    { min: 3, message: 'Tên hiển thị phải có ít nhất 3 ký tự' },
                    { max: 50, message: 'Tên hiển thị không được vượt quá 50 ký tự' }
                  ]}
                >
                  <Input placeholder="Ví dụ: jobhub_user" size="large" />
                </Form.Item>

                <Form.Item
                  name="fullName"
                  label="Họ và tên"
                  rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                >
                  <Input placeholder="Nguyễn Văn A" size="large" />
                </Form.Item>

                <Form.Item name="email" label="Email">
                  <Input disabled size="large" defaultValue={user?.email} />
                </Form.Item>

                <Form.Item name="phone" label="Số điện thoại">
                  <Input placeholder="0987 654 321" size="large" />
                </Form.Item>

                <Form.Item name="dateOfBirth" label="Ngày sinh">
                  <DatePicker
                    className="ps-full-width"
                    placeholder="DD/MM/YYYY"
                    size="large"
                    format="DD/MM/YYYY"
                    disabledDate={d => d && d > dayjs()}
                  />
                </Form.Item>

                <Form.Item name="gender" label="Giới tính">
                  <Select placeholder="Chọn giới tính" size="large" allowClear>
                    {GENDER_OPTIONS.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                  </Select>
                </Form.Item>

                <Form.Item name="province" label="Tỉnh / Thành phố">
                  <Select
                    showSearch
                    placeholder="Chọn tỉnh / thành phố"
                    size="large"
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

                <Form.Item name="ward" label="Phường / Xã">
                  <Select
                    showSearch
                    placeholder={loadingWards ? 'Đang tải...' : 'Chọn phường / xã'}
                    size="large"
                    allowClear
                    loading={loadingWards}
                    disabled={wardOptions.length === 0 && !loadingWards}
                    filterOption={(input, opt) =>
                      String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={wardOptions}
                    notFoundContent={loadingWards ? 'Đang tải dữ liệu...' : 'Chưa có dữ liệu'}
                  />
                </Form.Item>

                <Form.Item name="addressDetail" label="Địa chỉ chi tiết" className="ps-form-grid--full">
                  <Input placeholder="Số nhà, tên đường, toà nhà..." size="large" />
                </Form.Item>
              </div>

              <Form.Item name="summary" label="Giới thiệu bản thân">
                <TextArea
                  rows={3}
                  placeholder="Mô tả ngắn về bản thân, kinh nghiệm và mục tiêu nghề nghiệp..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </section>

            {/* Career Info */}
            <section className="ps-card">
              <div className="ps-card__header">
                <span className="material-symbols-outlined">work_history</span>
                <h2>Thông tin nghề nghiệp</h2>
              </div>

              <div className="ps-form-grid">
                {!isEmployer && (
                  <>
                    <Form.Item name="yearsOfExperience" label="Tổng số năm kinh nghiệm">
                      <InputNumber
                        min={0} max={50}
                        addonAfter="năm"
                        placeholder="0"
                        className="ps-full-width"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item name="expectedSalary" label="Lương kỳ vọng (VNĐ/tháng)">
                      <InputNumber<number>
                        min={0}
                        formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={v => Number(v?.replace(/,/g, ''))}
                        addonAfter="₫"
                        placeholder="15,000,000"
                        className="ps-full-width"
                        size="large"
                      />
                    </Form.Item>
                  </>
                )}

                {/* Company Selection: Shown for Employer only */}
                {isEmployer && (
                  <>
                    <Form.Item name="companyId" label="Công ty tuyển dụng" className="ps-form-grid--full" rules={[{ required: true, message: 'Vui lòng chọn công ty của bạn!' }]}>
                      <Select
                        showSearch
                        placeholder="Chọn công ty của bạn..."
                        size="large"
                        options={companyOptions}
                        filterOption={(input, opt) =>
                          String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    </Form.Item>

                    {/* CTA đăng ký công ty mới */}
                    <div className="ps-form-grid--full" style={{
                      background: 'linear-gradient(135deg, #e8f0fe 0%, #f0e8ff 100%)',
                      border: '1px dashed #b0c6ff',
                      borderRadius: 10,
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      flexWrap: 'wrap',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%',
                          background: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,.1)',
                          flexShrink: 0,
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#002660', fontVariationSettings: "'FILL' 1" }}>domain_add</span>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#002660' }}>Công ty của bạn chưa có trên JobHub?</p>
                          <p style={{ margin: 0, fontSize: 12, color: '#434651' }}>Đăng ký để bắt đầu đăng tuyển — Admin sẽ xét duyệt trong 1–3 ngày.</p>
                        </div>
                      </div>
                      <Button
                        type="primary"
                        onClick={() => navigate('/company/register')}
                        icon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_business</span>}
                        iconPosition="start"
                      >
                        Đăng ký công ty
                      </Button>
                    </div>
                  </>
                )}

                {/* Position: Shown for both Candidate and Employer */}
                <Form.Item
                  name="position"
                  label={isEmployer ? "Chức danh trong công ty" : "Vị trí công việc mong muốn (Headline)"}
                  className="ps-form-grid--full"
                  style={{ marginTop: 12 }}
                >
                  <Input
                    placeholder={isEmployer ? "Ví dụ: HR Manager, CTO, Recruiter..." : "Ví dụ: Frontend Developer, Software Engineer..."}
                    size="large"
                  />
                </Form.Item>
              </div>

              {/* Skills — managed separately via API */}
              <div className="ps-skills">
                <label className="ps-skills__label">Kỹ năng chuyên môn</label>
                <p className="ps-skills__hint">
                  Mỗi kỹ năng lưu số năm kinh nghiệm riêng. Thay đổi được lưu ngay lập tức.
                </p>

                <div className="ps-skills__tags">
                  {skills.map(sk => (
                    <Tag
                      key={sk.skillId}
                      closable
                      onClose={() => handleRemoveSkill(sk.skillId)}
                      className="ps-skill-tag"
                      style={{ opacity: skillActionId === sk.skillId ? 0.5 : 1 }}
                    >
                      <span>{sk.skillName}</span>
                      {sk.yearsOfExperience != null && (
                        <span className="ps-skill-tag__years">{sk.yearsOfExperience}y</span>
                      )}
                    </Tag>
                  ))}

                  {!addingSkill && (
                    <Tag
                      className="ps-skill-tag ps-skill-tag--add"
                      onClick={() => setAddingSkill(true)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle' }}>add</span>
                      Thêm kỹ năng
                    </Tag>
                  )}
                </div>

                {addingSkill && (
                  <div className="ps-skill-add-panel">
                    <div className="ps-skill-add-panel__header">
                      <span className="material-symbols-outlined ps-skill-add-panel__icon">psychology</span>
                      <span className="ps-skill-add-panel__title">Thêm kỹ năng chuyên môn</span>
                    </div>
                    <div className="ps-skill-add-panel__body">
                      <div className="ps-skill-add-panel__field ps-skill-add-panel__field--select">
                        <span className="ps-skill-add-panel__field-label">Chọn kỹ năng</span>
                        <Select
                          showSearch
                          placeholder="Tìm kỹ năng..."
                          value={selectedSkillId}
                          onChange={setSelectedSkillId}
                          filterOption={(input, opt) =>
                            String(opt?.children ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                          className="ps-skill-add-panel__select"
                          notFoundContent="Không tìm thấy kỹ năng"
                        >
                          {availableSkills.map(s => (
                            <Option key={s.id} value={s.id}>{s.name}</Option>
                          ))}
                        </Select>
                      </div>

                      <div className="ps-skill-add-panel__field ps-skill-add-panel__field--years">
                        <span className="ps-skill-add-panel__field-label">Số năm kinh nghiệm</span>
                        <InputNumber
                          min={1} max={30}
                          value={newSkillYears}
                          onChange={v => setNewSkillYears(v ?? 1)}
                          addonAfter="năm"
                          className="ps-skill-add-panel__input"
                        />
                      </div>

                      <div className="ps-skill-add-panel__actions">
                        <Button
                          onClick={() => { setAddingSkill(false); setSelectedSkillId(null) }}
                          className="ps-skill-add-panel__btn-cancel"
                        >
                          Hủy
                        </Button>
                        <Button
                          type="primary"
                          loading={!!skillActionId}
                          onClick={handleAddSkill}
                          className="ps-skill-add-panel__btn-submit"
                        >
                          Thêm
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Account & Security */}
            <section className="ps-card">
              <div className="ps-card__header">
                <span className="material-symbols-outlined">security</span>
                <h2>Tài khoản &amp; Bảo mật</h2>
              </div>

              <div className="ps-security-item">
                <div className="ps-security-item__icon">
                  <span className="material-symbols-outlined">password</span>
                </div>
                <div>
                  <p className="ps-security-item__title">Mật khẩu</p>
                  <p className="ps-security-item__sub">Cập nhật định kỳ để bảo vệ tài khoản.</p>
                </div>
                <Button type="link" className="ps-security-item__action">Đổi mật khẩu</Button>
              </div>

              <div className="ps-social-section">
                <p className="ps-social-section__title">Liên kết mạng xã hội</p>
                <div className="ps-social-row">
                  <div className="ps-social-item ps-social-item--connected">
                    <div className="ps-social-item__left">
                      <span className="material-symbols-outlined">link</span>
                      <span>LinkedIn</span>
                    </div>
                    <span className="material-symbols-outlined ps-social-item__check">check_circle</span>
                  </div>
                  <button className="ps-social-item ps-social-item--dashed">
                    <div className="ps-social-item__left">
                      <span className="material-symbols-outlined">code</span>
                      <span>Kết nối GitHub</span>
                    </div>
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>
            </section>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="ps-right">

            {/* Notifications */}
            <section className="ps-card">
              <div className="ps-card__header">
                <span className="material-symbols-outlined">notifications_active</span>
                <h2>Thông báo</h2>
              </div>
              <div className="ps-notif-list">
                {([
                  { key: 'newJobs',    label: 'Việc làm mới phù hợp'     },
                  { key: 'recruiter',  label: 'Tin nhắn nhà tuyển dụng'  },
                  { key: 'newsletter', label: 'Newsletter hàng tuần'      },
                ] as const).map(({ key, label }) => (
                  <div key={key} className="ps-notif-item">
                    <span>{label}</span>
                    <Switch
                      checked={notif[key]}
                      onChange={v => setNotif(p => ({ ...p, [key]: v }))}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Privacy / Job search status */}
            <section className="ps-card">
              <div className="ps-card__header">
                <span className="material-symbols-outlined">visibility</span>
                <h2>Quyền riêng tư</h2>
              </div>
              <div className="ps-privacy">
                <p className="ps-privacy__label">Trạng thái tìm việc</p>
                <Form.Item name="jobSearchStatus" style={{ marginBottom: 8 }}>
                  <Select size="large" placeholder="Chọn trạng thái">
                    {JOB_STATUS_OPTIONS.map(o =>
                      <Option key={o.value} value={o.value}>{o.label}</Option>
                    )}
                  </Select>
                </Form.Item>
                <p className="ps-privacy__tip">
                  Giúp hồ sơ của bạn xuất hiện đúng với nhà tuyển dụng phù hợp.
                </p>
              </div>
            </section>

            {/* Profile type badge */}
            <section className="ps-card ps-card--type">
              <div className="ps-card__header">
                <span className="material-symbols-outlined">person_pin</span>
                <h2>Loại tài khoản</h2>
              </div>
              <div className="ps-type-badge">
                <span className="material-symbols-outlined">
                  {isEmployer ? 'domain' : 'person_search'}
                </span>
                <div>
                  <p className="ps-type-badge__name">
                    {isEmployer ? 'Nhà tuyển dụng' : 'Ứng viên'}
                  </p>
                  <p className="ps-type-badge__desc">
                    {isEmployer
                      ? 'Bạn đang dùng tài khoản HR/Employer.'
                      : 'Bạn đang dùng tài khoản tìm việc.'}
                  </p>
                </div>
              </div>
            </section>

            {/* Danger Zone */}
            <div className="ps-danger">
              <p className="ps-danger__title">Vùng nguy hiểm</p>
              <p className="ps-danger__desc">
                Xóa tài khoản sẽ gỡ bỏ toàn bộ lịch sử ứng tuyển, hồ sơ và CV của bạn. Không thể khôi phục.
              </p>
              <Popconfirm
                title="Xác nhận xóa tài khoản"
                description="Hành động này không thể hoàn tác. Bạn chắc chắn muốn xóa?"
                okText="Xóa vĩnh viễn"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button danger block icon={
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete_forever</span>
                }>
                  Xóa tài khoản
                </Button>
              </Popconfirm>
            </div>

          </div>
        </div>
      </Form>
    </div>
  )
}

export default ProfileSettings
