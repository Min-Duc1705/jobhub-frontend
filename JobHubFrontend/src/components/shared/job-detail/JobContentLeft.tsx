import { Tag } from 'antd'
import dayjs from 'dayjs'
import type { IJob } from '../../../types/job'
import { JOB_LEVEL_LABEL, JOB_TYPE_LABEL } from '../../../types/job'
import { extractTextLines, hasListTags } from './jobDetailHelpers'

interface Props {
  job: IJob
}

const JobContentLeft = ({ job }: Props) => {
  const benefitLines = extractTextLines(job.benefits)
  const requireLines = extractTextLines(job.requirements)

  const infoItems = [
    { icon: 'work',        label: 'Cấp độ',    val: JOB_LEVEL_LABEL[job.level]  ?? job.level   },
    { icon: 'schedule',    label: 'Hình thức', val: JOB_TYPE_LABEL[job.jobType] ?? job.jobType },
    { icon: 'group',       label: 'Số lượng',  val: `${job.quantity} vị trí`    },
    ...(job.endDate            ? [{ icon: 'event',        label: 'Hạn nộp',     val: dayjs(job.endDate).format('DD/MM/YYYY') }] : []),
    ...(job.experienceRequired ? [{ icon: 'work_history', label: 'Kinh nghiệm', val: job.experienceRequired }] : []),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0, overflow: 'hidden' }}>

      {/* ① Thông tin chung */}
      <div className="jd-content-card">
        <div className="jd-section-title"><div className="jd-section-bar" />Thông tin chung</div>
        <div className="jd-info-grid">
          {infoItems.map((item, i) => (
            <div key={i} className="jd-info-item">
              <span className="material-symbols-outlined">{item.icon}</span>
              <div>
                <div className="jd-info-label">{item.label}</div>
                <div className="jd-info-val">{item.val}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ② Mô tả công việc */}
      {job.description && (
        <div className="jd-content-card">
          <div className="jd-section-title"><div className="jd-section-bar" />Mô tả công việc</div>
          <div className="jd-description" dangerouslySetInnerHTML={{ __html: job.description }} />
        </div>
      )}

      {/* ③ Yêu cầu ứng viên */}
      {job.requirements && (
        <div className="jd-content-card">
          <div className="jd-section-title"><div className="jd-section-bar" />Yêu cầu ứng viên</div>
          {hasListTags(job.requirements) ? (
            <ul className="jd-responsibility-list">
              {requireLines.map((line, i) => (
                <li key={i}>
                  <span className="material-symbols-outlined">check_circle</span>
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            <div
              className="jd-description"
              dangerouslySetInnerHTML={{
                __html: (job.requirements ?? '')
                  .replace(/\n/g, '<br />')
                  .replace(/•/g, '<span style="color:#002660;margin-right:6px">•</span>'),
              }}
            />
          )}
          {job.skills?.length > 0 && (
            <>
              <div className="jd-section-title" style={{ marginTop: 14 }}>
                <div className="jd-section-bar" />Kỹ năng yêu cầu
              </div>
              <div className="jd-skill-tags">
                {job.skills.map(s => <Tag key={s.id} color="geekblue">{s.name}</Tag>)}
              </div>
            </>
          )}
        </div>
      )}

      {/* ④ Phúc lợi */}
      {benefitLines.length > 0 && (
        <div className="jd-content-card">
          <div className="jd-section-title"><div className="jd-section-bar" />Phúc lợi &amp; Đãi ngộ</div>
          <ul className="jd-responsibility-list">
            {benefitLines.map((line, i) => (
              <li key={i}>
                <span className="material-symbols-outlined">check_circle</span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default JobContentLeft
