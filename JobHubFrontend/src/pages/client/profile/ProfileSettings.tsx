import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  App, Form, Input, DatePicker, Select, InputNumber,
  Switch, Button, Tag, Progress, Popconfirm,
  Avatar, Image, Spin, Alert, Modal,
} from 'antd'
import { message } from '../../../utils/antd'
import dayjs from 'dayjs'
import { useAppSelector, useAppDispatch } from '../../../redux/hooks'
import { setAvatarUrl as syncAvatarUrl, fetchAccount } from '../../../redux/slices/authSlice'
import { updateUsernameApi, changePasswordApi } from '../../../services/auth-service'
import {
  getMyProfileApi,
  updateMyProfileApi,
  uploadAvatarApi,
  getSkillsDropdownApi,
  addSkillToProfileApi,
  removeSkillFromProfileApi,
} from '../../../services/profile-service'
import type { CustomerProfile, CustomerSkillDto, SkillOption } from '../../../types/profile'
import {
  getVerifiedCompaniesApi,
  getCompanyByIdApi,
  updateCompanyApi,
  uploadCompanyPublicImageApi,
} from '../../../services/company-service'
import type { ICompany, CompanyBody } from '../../../types/company'
import { useProvinces } from '../../../hooks/useProvinces'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { getTelegramBindingApi, deleteTelegramBindingApi, bindCustomBotApi } from '../../../services/notification-service'
import type { ITelegramBindingDto } from '../../../services/notification-service'
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
  // Legacy 2-part format: "ward | province" (RegisterPage cũ chưa có addressDetail)
  if (parts.length === 2) return {
    addressDetail: undefined,
    ward:          parts[0] || undefined,
    province:      parts[1] || undefined,
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

  // ── Company states (Employer/HR)
  const [companyForm] = Form.useForm()
  const [editCompanyVisible, setEditCompanyVisible] = useState(false)
  const [registeredCompany, setRegisteredCompany] = useState<ICompany | null>(null)
  const [companyDesc, setCompanyDesc] = useState('')
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null)
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null)
  const [companyCoverUrl, setCompanyCoverUrl] = useState<string | null>(null)
  const [companyCoverFile, setCompanyCoverFile] = useState<File | null>(null)
  const [companyActivityPreviews, setCompanyActivityPreviews] = useState<string[]>([])
  const [companyActivityFiles, setCompanyActivityFiles] = useState<File[]>([])
  const [isSavingCompany, setIsSavingCompany] = useState(false)

  // ── Change Password states
  const [changePasswordForm] = Form.useForm()
  const [changePasswordVisible, setChangePasswordVisible] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

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

  // ── Telegram Bot states
  const [telegramLoading, setTelegramLoading] = useState(false)
  const [telegramBinding, setTelegramBinding] = useState<ITelegramBindingDto | null>(null)
  const [botTokenInput, setBotTokenInput] = useState('')
  const [isBindingBot, setIsBindingBot] = useState(false)

  // ── Province / Ward (shared hook — cache toàn module, chỉ fetch 1 lần) ──────────────────────
  const { provinceOptions, getWards } = useProvinces()
  const [wardOptions,  setWardOptions]  = useState<{ value: string; label: string }[]>([])
  const [loadingWards, setLoadingWards] = useState(false)
  const [companyOptions, setCompanyOptions] = useState<{ value: string; label: string }[]>([])

  // ── Profile strength
  const watched = Form.useWatch([], form)
  const [strength, setStrength] = useState(0)
  useEffect(() => { setStrength(calcStrength(watched ?? {}, skills)) }, [watched, skills])
  const { rank, color } = strengthRank(strength)

  // ── Khi user chọn tỉnh → populate ward list từ cache
  const selectProvince = (provinceName: string | undefined) => {
    setWardOptions([])
    if (!provinceName) return
    setLoadingWards(true)
    setWardOptions(getWards(provinceName))
    setLoadingWards(false)
  }

  // Khi provinceOptions load xong (hook cache ready) → populate ward nếu form đã có tỉnh
  // (xử lý race-condition: profile load xong trước khi province hook trả về)
  useEffect(() => {
    if (provinceOptions.length === 0) return
    const currentProvince = form.getFieldValue('province')
    if (currentProvince) selectProvince(currentProvince)
  }, [provinceOptions]) // eslint-disable-line react-hooks/exhaustive-deps


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
          let options = (compRes.data?.result ?? []).map(c => ({
            value: c.id ?? '',
            label: c.name ?? ''
          }))

          if (p.companyId) {
            try {
              const currentCompRes = await getCompanyByIdApi(p.companyId)
              const currentComp = currentCompRes.data
              if (currentComp) {
                setRegisteredCompany(currentComp)
                setCompanyDesc(currentComp.description || '')
                if (!options.some(opt => opt.value === p.companyId)) {
                  options = [
                    {
                      value: currentComp.id ?? '',
                      label: currentComp.name ?? ''
                    },
                    ...options
                  ]
                }
              }
            } catch (err) {
              console.error("Failed to load current registered company details", err)
            }
          }
          setCompanyOptions(options)
        } catch (err) {
          console.error("Failed to load companies", err)
        }
      }

      // Pre-load wards if province was already set
      if (addr.province) fetchWards(addr.province)

      // Available skills to choose from (loại trừ đã có)
      setSkillOptions(skillsRes.data ?? [])

      // Fetch Telegram status
      try {
        const tgRes = await getTelegramBindingApi()
        if (tgRes && tgRes.data) {
          setTelegramBinding(tgRes.data)
        }
      } catch (err) {
        console.error("Failed to load Telegram binding", err)
      }
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
      let profileSavePromiseIndex = -1

      if (usernamePromiseIndex !== -1) {
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
        jobSearchStatus:   isEmployer ? null : (values.jobSearchStatus ?? null),
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

  // ── Company Edit Handlers ─────────────────────────────────────────
  const handleCompanyLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { message.error('Logo tối đa 2MB.'); return }
    setCompanyLogoFile(file)
    setCompanyLogoUrl(URL.createObjectURL(file))
  }

  const handleCompanyCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { message.error('Ảnh bìa tối đa 5MB.'); return }
    setCompanyCoverFile(file)
    setCompanyCoverUrl(URL.createObjectURL(file))
  }

  const handleCompanyActivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const remaining = 4 - companyActivityPreviews.length
    if (remaining <= 0) { message.warning('Tối đa 4 ảnh hoạt động.'); return }
    const selected = files.slice(0, remaining)
    const oversized = selected.some(f => f.size > 5 * 1024 * 1024)
    if (oversized) { message.error('Mỗi ảnh tối đa 5MB.'); return }
    setCompanyActivityFiles(prev => [...prev, ...selected])
    setCompanyActivityPreviews(prev => [...prev, ...selected.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }

  const handleSaveCompany = async (values: any) => {
    if (!profile?.companyId) return
    setIsSavingCompany(true)
    try {
      let logoUrl = companyLogoUrl
      let coverUrl = companyCoverUrl

      const uploadTasks: Promise<void>[] = []

      if (companyLogoFile) {
        uploadTasks.push(
          uploadCompanyPublicImageApi(companyLogoFile)
            .then(res => { logoUrl = res.data?.url })
        )
      }
      if (companyCoverFile) {
        uploadTasks.push(
          uploadCompanyPublicImageApi(companyCoverFile)
            .then(res => { coverUrl = res.data?.url })
        )
      }

      const finalActivityUrls: string[] = companyActivityPreviews.filter(url => url.startsWith('http'))
      
      companyActivityFiles.forEach((file) => {
        uploadTasks.push(
          uploadCompanyPublicImageApi(file)
            .then(res => {
              if (res.data?.url) {
                finalActivityUrls.push(res.data.url)
              }
            })
        )
      })

      await Promise.all(uploadTasks)

      const payload: CompanyBody = {
        name: values.name,
        description: companyDesc,
        address: values.address,
        industry: values.industry,
        companySize: values.companySize,
        website: values.website,
        contactEmail: values.contactEmail,
        taxCode: values.taxCode,
        logo: logoUrl || undefined,
        coverImage: coverUrl || undefined,
        activityImages: finalActivityUrls.length ? finalActivityUrls : undefined,
      }

      const updateRes = await updateCompanyApi(profile.companyId, payload)
      if (updateRes.data) {
        setRegisteredCompany(updateRes.data)
        
        setCompanyOptions(prev =>
          prev.map(opt =>
            opt.value === profile.companyId ? { ...opt, label: updateRes.data.name } : opt
          )
        )

        notification.success({
          message: 'Cập nhật thành công',
          description: 'Hồ sơ công ty của bạn đã được cập nhật.',
          placement: 'topRight',
          duration: 3,
        })
        setEditCompanyVisible(false)
        setCompanyLogoFile(null)
        setCompanyCoverFile(null)
        setCompanyActivityFiles([])
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Cập nhật hồ sơ công ty thất bại.'
      notification.error({
        message: 'Cập nhật thất bại',
        description: msg,
        placement: 'topRight',
        duration: 4,
      })
    } finally {
      setIsSavingCompany(false)
    }
  }

  const handleChangePassword = async (values: any) => {
    setIsChangingPassword(true)
    try {
      await changePasswordApi(values.currentPassword, values.newPassword)
      notification.success({
        message: 'Đổi mật khẩu thành công',
        description: 'Mật khẩu tài khoản của bạn đã được cập nhật.',
        placement: 'topRight',
        duration: 3,
      })
      setChangePasswordVisible(false)
      changePasswordForm.resetFields()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.'
      notification.error({
        message: 'Đổi mật khẩu thất bại',
        description: msg,
        placement: 'topRight',
        duration: 4,
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDisconnectTelegram = async () => {
    try {
      setTelegramLoading(true)
      const res = await deleteTelegramBindingApi()
      if (res && res.data?.success) {
        message.success('Đã hủy liên kết Telegram thành công.')
        setTelegramBinding({ isConnected: false })
        setBotTokenInput('')
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Hủy liên kết Telegram thất bại.')
    } finally {
      setTelegramLoading(false)
    }
  }

  const handleBindCustomBot = async () => {
    if (!botTokenInput || !botTokenInput.trim()) {
      message.warning('Vui lòng nhập Token Bot Telegram của bạn.')
      return
    }

    try {
      setIsBindingBot(true)
      const res = await bindCustomBotApi(botTokenInput.trim())
      if (res && res.data?.success) {
        message.success(res.data.message || 'Đăng ký Webhook cho Bot thành công!')
        setTelegramBinding({
          isConnected: false,
          botToken: botTokenInput.trim(),
          botUsername: res.data.botUsername
        })
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể liên kết Bot Telegram. Vui lòng kiểm tra lại Token.')
    } finally {
      setIsBindingBot(false)
    }
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
                <Button type="link" className="ps-security-item__action" onClick={() => setChangePasswordVisible(true)}>Đổi mật khẩu</Button>
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

            {/* Telegram Bot Integration Card */}
            <section className="ps-card" style={{ borderLeft: '4px solid #0088cc' }}>
              <div className="ps-card__header">
                <span className="material-symbols-outlined" style={{ color: '#0088cc' }}>robot_2</span>
                <h2>Trợ lý AI &amp; Telegram Bot riêng</h2>
              </div>
              
              <p style={{ marginBottom: 16, color: '#475569', fontSize: 13, lineHeight: 1.6 }}>
                Bạn có thể tự đăng ký và đặt tên Bot Telegram theo sở thích cá nhân để trò chuyện trực tiếp với <strong>Trợ lý AI (AI Assistant)</strong> và nhận thông báo tức thời từ hệ thống JobHub. Mọi cuộc hội thoại trên Telegram sẽ được đồng bộ thời gian thực với Assistant trên Web.
              </p>

              {/* Case 1: Connected successfully (both system bot and custom bot) */}
              {telegramBinding?.isConnected ? (
                <div className="ps-telegram-active-flow">
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 16,
                    padding: '8px 12px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 8
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>Đã liên kết hoạt động thành công</span>
                  </div>

                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20,
                    fontSize: 13,
                    color: '#334155'
                  }}>
                    <p style={{ margin: '0 0 8px 0' }}>Bot Telegram liên kết: <strong style={{ color: '#0088cc' }}>@{telegramBinding.botUsername || 'JobHub_Control_Bot'}</strong></p>
                    <p style={{ margin: '0 0 8px 0' }}>Tài khoản Telegram: <strong>@{telegramBinding.username}</strong></p>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                      Hệ thống thông báo JobHub đã sẵn sàng gửi cập nhật trực tiếp qua Telegram của bạn. Trợ lý AI Assistant cũng sẵn sàng phục vụ bạn qua chatbot.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => {
                        window.open(`https://t.me/${telegramBinding.botUsername || 'JobHub_Control_Bot'}`, '_blank')
                      }}
                      style={{ background: '#0088cc', borderColor: '#0088cc' }}
                    >
                      Mở Chat trên Telegram
                    </Button>

                    <Popconfirm
                      title="Xác nhận hủy liên kết"
                      description="Hành động này sẽ hủy liên kết Bot và ngừng nhận thông báo. Bạn chắc chắn muốn hủy?"
                      onConfirm={handleDisconnectTelegram}
                      okText="Hủy liên kết"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true, loading: telegramLoading }}
                    >
                      <Button size="large" danger>
                        Hủy liên kết Telegram
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              ) : null}

              {/* Case 2: Custom Bot registered, waiting for activation */}
              {!telegramBinding?.isConnected && telegramBinding?.botToken ? (
                <div className="ps-telegram-activate-flow">
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 16,
                    padding: '8px 12px',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: 8
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#b45309' }}>Đã đăng ký Bot - Chờ kích hoạt kết nối</span>
                  </div>

                  <div style={{ marginBottom: 20, fontSize: 13, color: '#334155' }}>
                    <p style={{ margin: '0 0 6px 0' }}>Bot của bạn: <strong style={{ color: '#0088cc' }}>@{telegramBinding.botUsername}</strong></p>
                    <p style={{ margin: '0 0 6px 0', fontSize: 12, color: '#64748b', wordBreak: 'break-all' }}>Token: <code>{telegramBinding.botToken}</code></p>
                  </div>

                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                      Bước cuối cùng để kích hoạt kết nối:
                    </h4>
                    <p style={{ margin: '0 0 16px 0', fontSize: 12.5, color: '#475569', lineHeight: 1.6 }}>
                      Nhấp vào nút bên dưới để mở Telegram và nhấn <strong>Bắt đầu (Start)</strong> hoặc gửi tin nhắn <code>/start</code> cho Bot của bạn để hoàn tất đồng bộ tài khoản.
                    </p>
                    
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <Button
                        type="primary"
                        size="large"
                        icon={<span className="material-symbols-outlined" style={{ fontSize: 18 }}>near_me</span>}
                        onClick={() => {
                          window.open(`https://t.me/${telegramBinding.botUsername}?start=BIND_${profile?.appUserId || user?.id}`, '_blank')
                        }}
                        style={{ background: '#0088cc', borderColor: '#0088cc', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        Kích hoạt Bot trên Telegram
                      </Button>

                      <Popconfirm
                        title="Xác nhận hủy đăng ký Bot"
                        description="Bạn có chắc chắn muốn hủy đăng ký Bot này và liên kết Bot khác?"
                        onConfirm={handleDisconnectTelegram}
                        okText="Hủy đăng ký"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true, loading: telegramLoading }}
                      >
                        <Button size="large" danger>
                          Sử dụng Bot khác
                        </Button>
                      </Popconfirm>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Case 3: Not connected, no custom bot registered */}
              {!telegramBinding?.isConnected && !telegramBinding?.botToken ? (
                <div className="ps-telegram-bind-flow">
                  {/* Option 1: Connect to default System Bot */}
                  <div style={{
                    background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)',
                    border: '1px solid #bae6fd',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20
                  }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 700, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#0284c7' }}>notifications_active</span>
                      Cách 1: Kết nối trực tiếp với Bot JobHub (Mặc định)
                    </h3>
                    <p style={{ margin: '0 0 16px 0', fontSize: 12.5, color: '#334155', lineHeight: 1.6 }}>
                      Nhận nhanh thông báo tin tuyển dụng mới, trạng thái duyệt hồ sơ và trò chuyện với trợ lý AI qua Bot chính thức của JobHub.
                    </p>
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => {
                        const botName = telegramBinding?.botUsername || import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'JobHub_Control_Bot';
                        window.open(`https://t.me/${botName}?start=BIND_${profile?.appUserId || user?.id}`, '_blank');
                      }}
                      style={{ background: '#0284c7', borderColor: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>link</span>
                      Kết nối Telegram ngay
                    </Button>
                  </div>

                  {/* Option 2: Connect to custom Bot */}
                  <div style={{
                    border: '1px dashed #cbd5e1',
                    borderRadius: 12,
                    padding: 16
                  }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#0088cc' }}>robot</span>
                      Cách 2: Sử dụng Bot riêng của bạn (Cá nhân hóa)
                    </h3>
                    
                    {/* Instructions */}
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 16
                    }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: 12.5, fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#0088cc' }}>help</span>
                        Hướng dẫn tạo Bot riêng qua @BotFather:
                      </h4>
                      <ol style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#475569', lineHeight: 1.7 }}>
                        <li>Chat với <strong><a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer">@BotFather</a></strong> trên Telegram.</li>
                        <li>Gửi lệnh <code>/newbot</code>, nhập Tên hiển thị và Username cho Bot của bạn.</li>
                        <li>Sao chép chuỗi <strong>HTTP API Token</strong> (dạng <code>739274028:AAHh_...</code>) được cấp.</li>
                      </ol>
                    </div>

                    {/* Input field */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 500, color: '#334155' }}>Dán HTTP API Token của Bot riêng:</label>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <Input
                          placeholder="Ví dụ: 739274028:AAHh_P..."
                          size="large"
                          value={botTokenInput}
                          onChange={(e) => setBotTokenInput(e.target.value)}
                          style={{ flex: 1, minWidth: 240 }}
                          disabled={isBindingBot}
                        />
                        <Button
                          type="primary"
                          size="large"
                          loading={isBindingBot}
                          onClick={handleBindCustomBot}
                          style={{ background: '#0088cc', borderColor: '#0088cc' }}
                        >
                          Kích hoạt Bot riêng
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            {isEmployer && registeredCompany && (
              <section className="ps-card ps-company-card" style={{ marginTop: 20 }}>
                <div className="ps-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="material-symbols-outlined">domain</span>
                    <h2 style={{ margin: 0 }}>Thông tin doanh nghiệp của bạn</h2>
                  </div>
                  <Button
                    type="primary"
                    ghost
                    onClick={() => {
                      setEditCompanyVisible(true)
                      companyForm.setFieldsValue({
                        name: registeredCompany.name,
                        address: registeredCompany.address,
                        industry: registeredCompany.industry,
                        companySize: registeredCompany.companySize,
                        website: registeredCompany.website,
                        contactEmail: registeredCompany.contactEmail,
                        taxCode: registeredCompany.taxCode,
                      })
                      setCompanyDesc(registeredCompany.description || '')
                      setCompanyLogoUrl(registeredCompany.logo || null)
                      setCompanyCoverUrl(registeredCompany.coverImage || null)
                      setCompanyActivityPreviews(registeredCompany.activityImages || [])
                      setCompanyLogoFile(null)
                      setCompanyCoverFile(null)
                      setCompanyActivityFiles([])
                    }}
                    icon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    Chỉnh sửa
                  </Button>
                </div>

                <div className="ps-company-view">
                  <div className="ps-company-banner" style={{
                    backgroundImage: registeredCompany.coverImage ? `url(${registeredCompany.coverImage})` : 'linear-gradient(135deg, #ecefef 0%, #cbd5e1 100%)',
                    height: 140,
                    borderRadius: 12,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                    marginBottom: 44,
                    border: '1px solid #e2e8f0'
                  }}>
                    <div className="ps-company-view-logo" style={{
                      position: 'absolute',
                      bottom: -22,
                      left: 20,
                      width: 68,
                      height: 68,
                      borderRadius: 10,
                      border: '3px solid #fff',
                      backgroundColor: '#fff',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {registeredCompany.logo ? (
                        <img src={registeredCompany.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#94a3b8' }}>domain</span>
                      )}
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: 12,
                      right: 12,
                    }}>
                      {registeredCompany.isVerified ? (
                        <Tag color="success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, margin: 0, padding: '2px 8px', borderRadius: 4 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>verified</span>
                          Đã xác minh
                        </Tag>
                      ) : (
                        <Tag color="warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, margin: 0, padding: '2px 8px', borderRadius: 4 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>hourglass_empty</span>
                          Đang chờ duyệt
                        </Tag>
                      )}
                    </div>
                  </div>

                  <div style={{ paddingLeft: 4 }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: 20, fontWeight: 700, color: '#0f172a', wordBreak: 'break-word' }}>{registeredCompany.name}</h3>
                    <p style={{ margin: '0 0 20px 0', fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#94a3b8' }}>category</span>
                      <span>{registeredCompany.industry || 'Chưa cập nhật lĩnh vực'}</span>
                      <span style={{ color: '#cbd5e1' }}>&bull;</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#94a3b8' }}>groups</span>
                      <span>
                        {registeredCompany.companySize === 'STARTUP' ? 'Startup (< 50 nhân viên)' :
                         registeredCompany.companySize === 'SME' ? 'SME (50 - 500 nhân viên)' :
                         registeredCompany.companySize === 'ENTERPRISE' ? 'Enterprise (> 500 nhân viên)' :
                         'Chưa cập nhật quy mô'}
                      </span>
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 16, marginBottom: 20 }}>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f1f5f9' }}>
                          <span className="material-symbols-outlined" style={{ color: '#64748b', fontSize: 16 }}>mail</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email liên hệ</div>
                          <div style={{ fontSize: 13, color: '#334155', fontWeight: 500, wordBreak: 'break-word' }}>{registeredCompany.contactEmail || 'N/A'}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f1f5f9' }}>
                          <span className="material-symbols-outlined" style={{ color: '#64748b', fontSize: 16 }}>language</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Website</div>
                          <div style={{ fontSize: 13, color: '#334155', fontWeight: 500, wordBreak: 'break-all' }}>
                            {registeredCompany.website ? (
                              <a href={registeredCompany.website} target="_blank" rel="noopener noreferrer" style={{ color: '#1677ff', textDecoration: 'none' }}>
                                {registeredCompany.website}
                              </a>
                            ) : 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f1f5f9' }}>
                          <span className="material-symbols-outlined" style={{ color: '#64748b', fontSize: 16 }}>pin_drop</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Địa chỉ trụ sở</div>
                          <div style={{ fontSize: 13, color: '#334155', fontWeight: 500, wordBreak: 'break-word' }}>{registeredCompany.address || 'N/A'}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f1f5f9' }}>
                          <span className="material-symbols-outlined" style={{ color: '#64748b', fontSize: 16 }}>receipt_long</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mã số thuế</div>
                          <div style={{ fontSize: 13, color: '#334155', fontWeight: 500, wordBreak: 'break-word' }}>{registeredCompany.taxCode || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {registeredCompany.description && (
                      <div style={{ marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#64748b' }}>description</span>
                          Giới thiệu công ty
                        </div>
                        <div className="ps-company-desc" style={{ fontSize: 13, color: '#475569', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: registeredCompany.description }} />
                      </div>
                    )}

                    {registeredCompany.activityImages && registeredCompany.activityImages.length > 0 && (
                      <div style={{ marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#64748b' }}>gallery_thumbnail</span>
                          Hình ảnh hoạt động
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                          {registeredCompany.activityImages.map((img, i) => (
                            <Image
                              key={i}
                              src={img}
                              alt={`Hoạt động ${i+1}`}
                              width={120}
                              height={80}
                              style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

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
            {!isEmployer && (
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
            )}

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

      {isEmployer && registeredCompany && (
        <Modal
          title="Chỉnh sửa Hồ sơ Công ty"
          open={editCompanyVisible}
          onCancel={() => setEditCompanyVisible(false)}
          footer={null}
          width={800}
          destroyOnClose
        >
          <Form
            form={companyForm}
            layout="vertical"
            onFinish={handleSaveCompany}
            requiredMark={false}
          >
            <Alert
              message="Lưu ý quan trọng"
              description="Mọi thay đổi đối với hồ sơ công ty sẽ hủy trạng thái xác minh hiện tại. Doanh nghiệp của bạn sẽ cần được Admin phê duyệt lại để hiển thị công khai."
              type="warning"
              showIcon
              style={{ marginBottom: 20 }}
            />
            <div className="ps-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 16 }}>
              <Form.Item
                name="name"
                label="Tên công ty"
                rules={[{ required: true, message: 'Vui lòng nhập tên công ty' }]}
                style={{ gridColumn: '1 / -1' }}
              >
                <Input placeholder="Tên doanh nghiệp..." size="large" />
              </Form.Item>

              <Form.Item
                name="industry"
                label="Lĩnh vực hoạt động"
                rules={[{ required: true, message: 'Vui lòng nhập hoặc chọn lĩnh vực hoạt động' }]}
              >
                <Input placeholder="Ví dụ: Công nghệ thông tin, Bán lẻ..." size="large" />
              </Form.Item>

              <Form.Item
                name="companySize"
                label="Quy mô nhân sự"
                rules={[{ required: true, message: 'Vui lòng chọn quy mô nhân sự' }]}
              >
                <Select placeholder="Chọn quy mô..." size="large">
                  <Option value="STARTUP">Startup (dưới 50 nhân viên)</Option>
                  <Option value="SME">SME (50 - 500 nhân viên)</Option>
                  <Option value="ENTERPRISE">Enterprise (trên 500 nhân viên)</Option>
                </Select>
              </Form.Item>

              <Form.Item name="website" label="Website công ty">
                <Input placeholder="https://..." size="large" />
              </Form.Item>

              <Form.Item name="contactEmail" label="Email liên hệ" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
                <Input placeholder="hr@domain.com" size="large" />
              </Form.Item>

              <Form.Item name="taxCode" label="Mã số thuế / MST">
                <Input placeholder="Mã số thuế..." size="large" />
              </Form.Item>



              <Form.Item name="address" label="Địa chỉ trụ sở chính" style={{ gridColumn: '1 / -1' }}>
                <Input placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..." size="large" />
              </Form.Item>
            </div>

            {/* Giới thiệu công ty (ReactQuill) */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>
                Giới thiệu công ty
              </label>
              <ReactQuill
                theme="snow"
                value={companyDesc}
                onChange={setCompanyDesc}
                placeholder="Mô tả về lĩnh vực, sứ mệnh và văn hoá doanh nghiệp..."
                style={{ minHeight: 160 }}
              />
            </div>

            {/* Logo and Cover Uploads */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>
                  Logo công ty
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar shape="square" size={64} src={companyLogoUrl} icon={<span className="material-symbols-outlined">domain</span>} />
                  <Button icon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>} style={{ position: 'relative' }}>
                    Tải Logo
                    <input
                      type="file"
                      accept="image/*"
                      style={{ position: 'absolute', opacity: 0, left: 0, top: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                      onChange={handleCompanyLogoChange}
                    />
                  </Button>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 250 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>
                  Ảnh bìa công ty
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {companyCoverUrl ? (
                    <img src={companyCoverUrl} alt="Cover" style={{ width: 120, height: 64, objectFit: 'cover', borderRadius: 4, border: '1px solid #cbd5e1' }} />
                  ) : (
                    <div style={{ width: 120, height: 64, background: '#e2e8f0', borderRadius: 4, border: '1px dashed #cbd5e1' }} />
                  )}
                  <Button icon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>} style={{ position: 'relative' }}>
                    Tải Ảnh bìa
                    <input
                      type="file"
                      accept="image/*"
                      style={{ position: 'absolute', opacity: 0, left: 0, top: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                      onChange={handleCompanyCoverChange}
                    />
                  </Button>
                </div>
              </div>
            </div>

            {/* Activity Images */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>
                Ảnh hoạt động (Tối đa 4 ảnh)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                {companyActivityPreviews.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <Image src={img} alt={`Hoạt động ${idx + 1}`} width={80} height={56} style={{ objectFit: 'cover', borderRadius: 4 }} />
                    <Button
                      type="primary"
                      shape="circle"
                      danger
                      size="small"
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        width: 18,
                        height: 18,
                        minWidth: 18,
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      icon={<span className="material-symbols-outlined" style={{ fontSize: 12, fontWeight: 'bold' }}>close</span>}
                      onClick={() => {
                        setCompanyActivityPreviews(prev => prev.filter((_, i) => i !== idx))
                        setCompanyActivityFiles(prev => prev.filter((_, i) => i !== idx))
                      }}
                    />
                  </div>
                ))}
                {companyActivityPreviews.length < 4 && (
                  <div style={{
                    width: 80,
                    height: 56,
                    border: '1px dashed #cbd5e1',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    cursor: 'pointer',
                    background: '#f8fafc'
                  }}>
                    <span className="material-symbols-outlined" style={{ color: '#94a3b8' }}>add</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      style={{ position: 'absolute', opacity: 0, left: 0, top: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                      onChange={handleCompanyActivityChange}
                    />
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <Button onClick={() => setEditCompanyVisible(false)} size="large">Hủy</Button>
              <Button type="primary" loading={isSavingCompany} htmlType="submit" size="large">Lưu thông tin</Button>
            </div>
          </Form>
        </Modal>
      )}

      <Modal
        title="Đổi mật khẩu tài khoản"
        open={changePasswordVisible}
        onCancel={() => {
          setChangePasswordVisible(false)
          changePasswordForm.resetFields()
        }}
        footer={null}
        width={440}
        destroyOnClose
      >
        <Form
          form={changePasswordForm}
          layout="vertical"
          onFinish={handleChangePassword}
          requiredMark={false}
        >
          <Form.Item
            name="currentPassword"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu hiện tại..." size="large" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' }
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..." size="large" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không trùng khớp!'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="Xác nhận lại mật khẩu mới..." size="large" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <Button onClick={() => {
              setChangePasswordVisible(false)
              changePasswordForm.resetFields()
            }} size="large">
              Hủy
            </Button>
            <Button type="primary" loading={isChangingPassword} htmlType="submit" size="large">
              Xác nhận đổi mật khẩu
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default ProfileSettings
