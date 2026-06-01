import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button, Collapse, Form, Input, Slider, Spin, Switch, Tag,
  Tooltip, Tabs, Upload,
} from 'antd'
import { message } from '../../../utils/antd'
import type { CollapseProps } from 'antd'
import type { RcFile } from 'antd/es/upload'
import { getResumeByIdApi, updateCvContentApi } from '../../../services/resume-service'
import TemplateSelectorModal from '../../../components/client/resume/TemplateSelectorModal'
import TemplateModern from '../../../components/client/resume/templates/TemplateModern'
import TemplateClassic from '../../../components/client/resume/templates/TemplateClassic'
import {
  DEFAULT_RESUME_CONTENT, RESUME_TEMPLATES,
  type ResumeContent, type ResumeExperience,
  type ResumeEducation, type ResumeSkillGroup,
  type ResumeCertification, type ResumeProject,
  type ResumeTemplate,
} from '../../../types/resume-builder'
import './ResumeBuilderPage.scss'

// ── Helpers ───────────────────────────────────────────────────────────────────
const newExp = (): ResumeExperience => ({
  id: crypto.randomUUID(), company: '', position: '',
  startDate: '', endDate: 'Hiện tại', description: '', bullets: [''], tags: [],
})
const newEdu = (): ResumeEducation => ({
  id: crypto.randomUUID(), school: '', degree: '', startYear: '', endYear: '', gpa: '',
})
const newSkillGroup = (): ResumeSkillGroup => ({
  id: crypto.randomUUID(), category: '', items: [],
})
const newCert = (): ResumeCertification => ({
  id: crypto.randomUUID(), name: '', issuer: '', year: '', icon: '',
})
const newProject = (): ResumeProject => ({
  id: crypto.randomUUID(), name: '', description: '', stars: '', githubUrl: '', demoUrl: '', tags: [],
})

function renderTemplate(templateId: number, data: ResumeContent) {
  switch (templateId) {
    case 2:  return <TemplateClassic data={data} />
    default: return <TemplateModern  data={data} />
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ResumeBuilderPage() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()

  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [exporting,     setExporting]     = useState(false)
  const [resumeTitle,   setResumeTitle]   = useState('CV Online')
  const [templateId,    setTemplateId]    = useState(1)
  const [data,          setData]          = useState<ResumeContent>(DEFAULT_RESUME_CONTENT)
  const [showTplPicker, setShowTplPicker] = useState(false)
  const [mobileTab,     setMobileTab]     = useState<'form' | 'preview'>('form')

  const previewRef = useRef<HTMLDivElement>(null)

  // ── Load CV ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) { setLoading(false); return }
    getResumeByIdApi(id)
      .then(res => {
        const cv = res.data
        setResumeTitle(cv.title)
        setTemplateId(cv.templateId ?? 1)
        if (cv.contentJson) {
          try { setData(JSON.parse(cv.contentJson)) } catch {}
        }
      })
      .catch(() => message.error('Không thể tải CV'))
      .finally(() => setLoading(false))
  }, [id])

  // ── Export PDF (html2canvas + jsPDF) ─────────────────────────────────────────
  const handleExportPdf = async () => {
    const el = previewRef.current
    if (!el) return
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF }   = await import('jspdf')

      // Clone element ra ngoài mọi overflow container → tránh bị cắt
      const clone = el.cloneNode(true) as HTMLElement
      const cvWidth = 860  // khớp với max-width của rb__preview-inner
      clone.style.cssText = [
        'position:fixed',
        'top:0',
        `left:-${cvWidth + 100}px`,  // đẩy ra ngoài màn hình
        `width:${cvWidth}px`,
        'background:#fff',
        'z-index:-9999',
        'overflow:visible',
        'height:auto',
        'min-height:0',
        'box-shadow:none',
        'border-radius:0',
      ].join(';')
      document.body.appendChild(clone)

      // Chờ browser render xong
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

      const canvas = await html2canvas(clone, {
        scale:           2,
        useCORS:         true,
        backgroundColor: '#ffffff',
        logging:         false,
        width:           cvWidth,
        height:          clone.scrollHeight,
        windowWidth:     cvWidth,
        windowHeight:    clone.scrollHeight,
        scrollX:         0,
        scrollY:         0,
      })

      document.body.removeChild(clone)

      // Tạo PDF A4 (đơn vị px để tính chính xác)
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf     = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' })
      const pageW   = pdf.internal.pageSize.getWidth()
      const pageH   = pdf.internal.pageSize.getHeight()
      const ratio   = pageW / canvas.width
      const imgH    = canvas.height * ratio

      // Cắt từng trang A4
      let yOffset = 0
      while (yOffset < imgH) {
        if (yOffset > 0) pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, -yOffset, pageW, imgH)
        yOffset += pageH
      }

      pdf.save(`${resumeTitle || 'CV'}.pdf`)
    } catch (err) {
      console.error(err)
      message.error('Xuất PDF thất bại. Vui lòng thử lại.')
    } finally {
      setExporting(false)
    }
  }


  // ── Manual save ───────────────────────────────────────────────────────────────────
  const handleSave = async (overrideData?: ResumeContent, overrideTplId?: number) => {
    if (!id) return
    setSaving(true)
    setSaved(false)
    try {
      await updateCvContentApi(id, {
        title:       resumeTitle,
        templateId:  overrideTplId ?? templateId,
        contentJson: JSON.stringify(overrideData ?? data),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)

      // Tạo thumbnail nhỏ lưu vào localStorage (cho trang quản lý CV)
      generateThumbnail(id)
    } catch {
      message.error('Lưu thất bại, vui lòng thử lại')
    } finally {
      setSaving(false)
    }
  }

  // Chụp preview thu nhỏ → localStorage (silent, không block UI)
  const generateThumbnail = async (cvId: string) => {
    const el = previewRef.current
    if (!el) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const clone = el.cloneNode(true) as HTMLElement
      const thumbW  = 860                              // full CV width
      const thumbH  = 1120                             // chỉ 1 trang đầu (A4)

      clone.style.cssText = [
        'position:fixed', 'top:0', `left:-${thumbW + 200}px`,
        `width:${thumbW}px`, 'background:#fff', 'z-index:-9999',
        'overflow:visible', 'height:auto', 'min-height:0',
        'box-shadow:none', 'border-radius:0',
      ].join(';')
      document.body.appendChild(clone)
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

      const canvas = await html2canvas(clone, {
        scale:           0.5,
        useCORS:         true,
        backgroundColor: '#ffffff',
        logging:         false,
        width:           thumbW,
        height:          thumbH,    // chỉ chụp đến hết trang 1
        windowWidth:     thumbW,
        windowHeight:    thumbH,
      })
      document.body.removeChild(clone)

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      localStorage.setItem(`cv-thumb-${cvId}`, dataUrl)
    } catch { /* silent fail */ }
  }



  // ── Updaters ──────────────────────────────────────────────────────────────
  const setPersonal = (patch: Partial<typeof data.personal>) => {
    setData(prev => ({ ...prev, personal: { ...prev.personal, ...patch } }))
  }
  const setExperiences = (arr: ResumeExperience[]) => {
    setData(prev => ({ ...prev, experiences: arr }))
  }
  const setEducation = (arr: ResumeEducation[]) => {
    setData(prev => ({ ...prev, education: arr }))
  }
  const setSkills = (arr: ResumeSkillGroup[]) => {
    setData(prev => ({ ...prev, skills: arr }))
  }
  const setCerts = (arr: ResumeCertification[]) => {
    setData(prev => ({ ...prev, certifications: arr }))
  }
  const setProjects = (arr: ResumeProject[]) => {
    setData(prev => ({ ...prev, projects: arr }))
  }

  const handleTemplateChange = (tpl: ResumeTemplate) => {
    setShowTplPicker(false)
    setTemplateId(tpl.id)
    handleSave(data, tpl.id)
  }

  // ── Form Sections ─────────────────────────────────────────────────────────
  const personalPanel = (
    <div className="rb-form-section">
      <div className="rb-row">
        <label>Họ và tên *</label>
        <Input
          placeholder="Nguyễn Văn A"
          value={data.personal.fullName}
          onChange={e => setPersonal({ fullName: e.target.value })}
        />
      </div>
      <div className="rb-row">
        <label>Chức danh *</label>
        <Input
          placeholder="Senior Fullstack Engineer"
          value={data.personal.title}
          onChange={e => setPersonal({ title: e.target.value })}
        />
      </div>
      <div className="rb-row">
        <label>Email *</label>
        <Input
          placeholder="example@gmail.com"
          value={data.personal.email}
          onChange={e => setPersonal({ email: e.target.value })}
        />
      </div>
      <div className="rb-row">
        <label>Số điện thoại</label>
        <Input
          placeholder="0912 345 678"
          value={data.personal.phone}
          onChange={e => setPersonal({ phone: e.target.value })}
        />
      </div>
      <div className="rb-row">
        <label>Địa điểm</label>
        <Input
          placeholder="Hà Nội, Việt Nam"
          value={data.personal.location}
          onChange={e => setPersonal({ location: e.target.value })}
        />
      </div>
      <div className="rb-row">
        <label>Website / LinkedIn</label>
        <Input
          placeholder="https://linkedin.com/in/..."
          value={data.personal.website}
          onChange={e => setPersonal({ website: e.target.value })}
        />
      </div>
      <div className="rb-row">
        <label>Ảnh đại diện</label>
        <div className="rb-avatar-upload">
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={(file: RcFile) => {
              const reader = new FileReader()
              reader.onload = e => {
                const base64 = e.target?.result as string
                setPersonal({ avatarUrl: base64 })
              }
              reader.readAsDataURL(file)
              return false // ngăn upload lên server
            }}
          >
            <div className="rb-avatar-upload__trigger">
              {data.personal.avatarUrl ? (
                <img
                  src={data.personal.avatarUrl}
                  alt="avatar"
                  className="rb-avatar-upload__preview"
                />
              ) : (
                <div className="rb-avatar-upload__placeholder">
                  <span className="material-symbols-outlined">add_photo_alternate</span>
                  <span>Tải ảnh lên</span>
                </div>
              )}
              <div className="rb-avatar-upload__overlay">
                <span className="material-symbols-outlined">photo_camera</span>
              </div>
            </div>
          </Upload>
          {data.personal.avatarUrl && (
            <Button
              size="small"
              danger
              type="text"
              icon={<span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>}
              onClick={() => setPersonal({ avatarUrl: '' })}
            >
              Xóa ảnh
            </Button>
          )}
        </div>
      </div>
      <div className="rb-row">
        <label>Giới thiệu bản thân</label>
        <Input.TextArea
          rows={4}
          placeholder="Tôi là kỹ sư với 5 năm kinh nghiệm..."
          value={data.personal.summary}
          onChange={e => setPersonal({ summary: e.target.value })}
        />
      </div>
      <div className="rb-row rb-row--inline">
        <label>Open to Work</label>
        <Switch
          checked={data.personal.openToWork}
          onChange={v => setPersonal({ openToWork: v })}
        />
      </div>
    </div>
  )

  const experiencePanel = (
    <div className="rb-form-section">
      {data.experiences.map((exp, idx) => (
        <div key={exp.id} className="rb-list-item">
          <div className="rb-list-item__header">
            <span className="rb-list-item__index">#{idx + 1}</span>
            <Button
              danger size="small"
              icon={<span className="material-symbols-outlined">delete</span>}
              onClick={() => setExperiences(data.experiences.filter(e => e.id !== exp.id))}
            />
          </div>
          <div className="rb-row">
            <label>Vị trí</label>
            <Input placeholder="Senior Developer" value={exp.position}
              onChange={e => setExperiences(data.experiences.map(x =>
                x.id === exp.id ? { ...x, position: e.target.value } : x))} />
          </div>
          <div className="rb-row">
            <label>Công ty</label>
            <Input placeholder="TechCorp VN" value={exp.company}
              onChange={e => setExperiences(data.experiences.map(x =>
                x.id === exp.id ? { ...x, company: e.target.value } : x))} />
          </div>
          <div className="rb-row-2col">
            <div className="rb-row">
              <label>Từ</label>
              <Input placeholder="01/2021" value={exp.startDate}
                onChange={e => setExperiences(data.experiences.map(x =>
                  x.id === exp.id ? { ...x, startDate: e.target.value } : x))} />
            </div>
            <div className="rb-row">
              <label>Đến</label>
              <Input placeholder="Hiện tại" value={exp.endDate}
                onChange={e => setExperiences(data.experiences.map(x =>
                  x.id === exp.id ? { ...x, endDate: e.target.value } : x))} />
            </div>
          </div>
          <div className="rb-row">
            <label>Mô tả</label>
            <Input.TextArea rows={2} placeholder="Mô tả công việc..." value={exp.description}
              onChange={e => setExperiences(data.experiences.map(x =>
                x.id === exp.id ? { ...x, description: e.target.value } : x))} />
          </div>
          <div className="rb-row">
            <label>Điểm nổi bật (mỗi dòng = 1 bullet)</label>
            <Input.TextArea rows={3} placeholder={"Tăng hiệu suất 50%\nTriển khai CI/CD tự động"} 
              value={exp.bullets.join('\n')}
              onChange={e => setExperiences(data.experiences.map(x =>
                x.id === exp.id ? { ...x, bullets: e.target.value.split('\n') } : x))} />
          </div>
          <div className="rb-row">
            <label>Tags (cách nhau bằng dấu phẩy)</label>
            <Input placeholder="React, Node.js, AWS" value={exp.tags.join(', ')}
              onChange={e => setExperiences(data.experiences.map(x =>
                x.id === exp.id ? { ...x, tags: e.target.value.split(',').map(t => t.trim()) } : x))} />
          </div>
        </div>
      ))}
      <Button
        block
        icon={<span className="material-symbols-outlined">add</span>}
        onClick={() => setExperiences([...data.experiences, newExp()])}
      >
        Thêm kinh nghiệm
      </Button>
    </div>
  )

  const educationPanel = (
    <div className="rb-form-section">
      {data.education.map((edu, idx) => (
        <div key={edu.id} className="rb-list-item">
          <div className="rb-list-item__header">
            <span className="rb-list-item__index">#{idx + 1}</span>
            <Button danger size="small"
              icon={<span className="material-symbols-outlined">delete</span>}
              onClick={() => setEducation(data.education.filter(e => e.id !== edu.id))} />
          </div>
          <div className="rb-row">
            <label>Tên trường</label>
            <Input placeholder="Đại học Bách Khoa HN" value={edu.school}
              onChange={e => setEducation(data.education.map(x => x.id === edu.id ? { ...x, school: e.target.value } : x))} />
          </div>
          <div className="rb-row">
            <label>Ngành học</label>
            <Input placeholder="Kỹ thuật Phần mềm" value={edu.degree}
              onChange={e => setEducation(data.education.map(x => x.id === edu.id ? { ...x, degree: e.target.value } : x))} />
          </div>
          <div className="rb-row-2col">
            <div className="rb-row">
              <label>Năm bắt đầu</label>
              <Input placeholder="2018" value={edu.startYear}
                onChange={e => setEducation(data.education.map(x => x.id === edu.id ? { ...x, startYear: e.target.value } : x))} />
            </div>
            <div className="rb-row">
              <label>Năm kết thúc</label>
              <Input placeholder="2022" value={edu.endYear}
                onChange={e => setEducation(data.education.map(x => x.id === edu.id ? { ...x, endYear: e.target.value } : x))} />
            </div>
          </div>
          <div className="rb-row">
            <label>GPA</label>
            <Input placeholder="3.6 / 4.0" value={edu.gpa}
              onChange={e => setEducation(data.education.map(x => x.id === edu.id ? { ...x, gpa: e.target.value } : x))} />
          </div>
        </div>
      ))}
      <Button block icon={<span className="material-symbols-outlined">add</span>}
        onClick={() => setEducation([...data.education, newEdu()])}>
        Thêm học vấn
      </Button>
    </div>
  )

  const skillsPanel = (
    <div className="rb-form-section">
      {data.skills.map((group, idx) => (
        <div key={group.id} className="rb-list-item">
          <div className="rb-list-item__header">
            <span className="rb-list-item__index">Nhóm #{idx + 1}</span>
            <Button danger size="small"
              icon={<span className="material-symbols-outlined">delete</span>}
              onClick={() => setSkills(data.skills.filter(s => s.id !== group.id))} />
          </div>
          <div className="rb-row">
            <label>Tên nhóm kỹ năng</label>
            <Input placeholder="Lập trình & Frameworks" value={group.category}
              onChange={e => setSkills(data.skills.map(x => x.id === group.id ? { ...x, category: e.target.value } : x))} />
          </div>
          <div className="rb-row">
            <label>Kỹ năng (cách nhau bằng dấu phẩy)</label>
            <Input.TextArea rows={2} placeholder="React, Node.js, TypeScript, Docker"
              value={group.items.join(', ')}
              onChange={e => setSkills(data.skills.map(x =>
                x.id === group.id ? { ...x, items: e.target.value.split(',').map(s => s.trim()) } : x))} />
          </div>
        </div>
      ))}
      <Button block icon={<span className="material-symbols-outlined">add</span>}
        onClick={() => setSkills([...data.skills, newSkillGroup()])}>
        Thêm nhóm kỹ năng
      </Button>
    </div>
  )

  const certsPanel = (
    <div className="rb-form-section">
      {data.certifications.map((cert, idx) => (
        <div key={cert.id} className="rb-list-item">
          <div className="rb-list-item__header">
            <span className="rb-list-item__index">#{idx + 1}</span>
            <Button danger size="small"
              icon={<span className="material-symbols-outlined">delete</span>}
              onClick={() => setCerts(data.certifications.filter(c => c.id !== cert.id))} />
          </div>
          <div className="rb-row">
            <label>Tên chứng chỉ</label>
            <Input placeholder="AWS Solutions Architect" value={cert.name}
              onChange={e => setCerts(data.certifications.map(x => x.id === cert.id ? { ...x, name: e.target.value } : x))} />
          </div>
          <div className="rb-row-2col">
            <div className="rb-row">
              <label>Tổ chức cấp</label>
              <Input placeholder="Amazon Web Services" value={cert.issuer}
                onChange={e => setCerts(data.certifications.map(x => x.id === cert.id ? { ...x, issuer: e.target.value } : x))} />
            </div>
            <div className="rb-row">
              <label>Năm</label>
              <Input placeholder="2023" value={cert.year}
                onChange={e => setCerts(data.certifications.map(x => x.id === cert.id ? { ...x, year: e.target.value } : x))} />
            </div>
          </div>
        </div>
      ))}
      <Button block icon={<span className="material-symbols-outlined">add</span>}
        onClick={() => setCerts([...data.certifications, newCert()])}>
        Thêm chứng chỉ
      </Button>
    </div>
  )

  const projectsPanel = (
    <div className="rb-form-section">
      {data.projects.map((proj, idx) => (
        <div key={proj.id} className="rb-list-item">
          <div className="rb-list-item__header">
            <span className="rb-list-item__index">#{idx + 1}</span>
            <Button danger size="small"
              icon={<span className="material-symbols-outlined">delete</span>}
              onClick={() => setProjects(data.projects.filter(p => p.id !== proj.id))} />
          </div>
          <div className="rb-row">
            <label>Tên dự án</label>
            <Input placeholder="AI Task Manager" value={proj.name}
              onChange={e => setProjects(data.projects.map(x => x.id === proj.id ? { ...x, name: e.target.value } : x))} />
          </div>
          <div className="rb-row">
            <label>Mô tả</label>
            <Input.TextArea rows={2} value={proj.description}
              onChange={e => setProjects(data.projects.map(x => x.id === proj.id ? { ...x, description: e.target.value } : x))} />
          </div>
          <div className="rb-row-2col">
            <div className="rb-row">
              <label>GitHub URL</label>
              <Input placeholder="https://github.com/..." value={proj.githubUrl}
                onChange={e => setProjects(data.projects.map(x => x.id === proj.id ? { ...x, githubUrl: e.target.value } : x))} />
            </div>
            <div className="rb-row">
              <label>Demo URL</label>
              <Input placeholder="https://demo.example.com" value={proj.demoUrl}
                onChange={e => setProjects(data.projects.map(x => x.id === proj.id ? { ...x, demoUrl: e.target.value } : x))} />
            </div>
          </div>
          <div className="rb-row">
            <label>Tags (cách nhau bằng dấu phẩy)</label>
            <Input placeholder="React, TypeScript, OpenAI" value={proj.tags.join(', ')}
              onChange={e => setProjects(data.projects.map(x =>
                x.id === proj.id ? { ...x, tags: e.target.value.split(',').map(t => t.trim()) } : x))} />
          </div>
        </div>
      ))}
      <Button block icon={<span className="material-symbols-outlined">add</span>}
        onClick={() => setProjects([...data.projects, newProject()])}>
        Thêm dự án
      </Button>
    </div>
  )

  const collapseItems: CollapseProps['items'] = [
    { key: '1', label: '👤 Thông tin cá nhân',      children: personalPanel   },
    { key: '2', label: '💼 Kinh nghiệm làm việc',   children: experiencePanel },
    { key: '3', label: '🎓 Học vấn',                 children: educationPanel  },
    { key: '4', label: '⚡ Kỹ năng chuyên môn',      children: skillsPanel     },
    { key: '5', label: '🏆 Chứng chỉ',               children: certsPanel      },
    { key: '6', label: '🚀 Dự án nổi bật',           children: projectsPanel   },
  ]

  if (loading) {
    return <div className="rb-loading"><Spin size="large" /></div>
  }

  const currentTpl = RESUME_TEMPLATES.find(t => t.id === templateId)

  return (
    <div className="rb">
      {/* ── Top toolbar ──────────────────────────────────────────────────── */}
      <div className="rb__toolbar">
        <div className="rb__toolbar-left">
          <Button
            type="text"
            icon={<span className="material-symbols-outlined">arrow_back</span>}
            onClick={() => navigate('/candidate/resume')}
          />
          <Input
            className="rb__title-input"
            value={resumeTitle}
            onChange={e => setResumeTitle(e.target.value)}
            variant="borderless"
          />
          {saving && (
            <span className="rb__saving-indicator">
              <Spin size="small" /> Đang lưu...
            </span>
          )}
          {!saving && saved && (
            <span className="rb__saved-indicator">
              <span className="material-symbols-outlined">cloud_done</span> Đã lưu
            </span>
          )}
        </div>

        <div className="rb__toolbar-right">
          <Tooltip title="Đổi mẫu CV">
            <Button
              icon={<span className="material-symbols-outlined">style</span>}
              onClick={() => setShowTplPicker(true)}
            >
              {currentTpl?.name ?? 'Modern'}
            </Button>
          </Tooltip>
          <Tooltip title="Lưu CV">
            <Button
              icon={<span className="material-symbols-outlined">save</span>}
              loading={saving}
              onClick={() => handleSave()}
              style={{ background: '#005daa', color: '#fff', borderColor: '#005daa' }}
            >
              Lưu
            </Button>
          </Tooltip>
          <Tooltip title="In / Xuất PDF">
            <Button
              type="primary"
              icon={<span className="material-symbols-outlined">download</span>}
              loading={exporting}
              onClick={handleExportPdf}
            >
              Tải PDF
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* ── Mobile tab switcher ───────────────────────────────────────────── */}
      <div className="rb__mobile-tabs">
        <button
          className={`rb__mobile-tab ${mobileTab === 'form' ? 'rb__mobile-tab--active' : ''}`}
          onClick={() => setMobileTab('form')}
        >
          <span className="material-symbols-outlined">edit_note</span> Chỉnh sửa
        </button>
        <button
          className={`rb__mobile-tab ${mobileTab === 'preview' ? 'rb__mobile-tab--active' : ''}`}
          onClick={() => setMobileTab('preview')}
        >
          <span className="material-symbols-outlined">visibility</span> Xem trước
        </button>
      </div>

      {/* ── Main layout ───────────────────────────────────────────────────── */}
      <div className="rb__body">
        {/* Form panel */}
        <div className={`rb__form-panel ${mobileTab === 'preview' ? 'rb__form-panel--hidden-mobile' : ''}`}>
          <Collapse
            items={collapseItems}
            defaultActiveKey={['1']}
            accordion={false}
            className="rb-collapse"
            expandIconPosition="end"
          />
        </div>

        {/* Preview panel */}
        <div className={`rb__preview-panel ${mobileTab === 'form' ? 'rb__preview-panel--hidden-mobile' : ''}`}>
          <div className="rb__preview-inner" ref={previewRef}>
            {renderTemplate(templateId, data)}
          </div>
        </div>
      </div>

      {/* Template selector */}
      <TemplateSelectorModal
        open={showTplPicker}
        currentId={templateId}
        onSelect={handleTemplateChange}
        onCancel={() => setShowTplPicker(false)}
      />
    </div>
  )
}
