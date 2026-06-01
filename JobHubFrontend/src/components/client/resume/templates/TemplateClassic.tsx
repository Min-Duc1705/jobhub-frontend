import type { ResumeContent } from '../../../../types/resume-builder'
import './TemplateClassic.scss'

interface Props { data: ResumeContent }

export default function TemplateClassic({ data }: Props) {
  const { personal, experiences, education, skills, certifications, projects } = data

  return (
    <div className="tc-wrap">
      {/* ── Left sidebar ─────────────────────────────────────────────────── */}
      <aside className="tc-sidebar">
        <div className="tc-sidebar__avatar-wrap">
          {personal.avatarUrl ? (
            <img className="tc-sidebar__avatar" src={personal.avatarUrl} alt={personal.fullName} />
          ) : (
            <div className="tc-sidebar__avatar tc-sidebar__avatar--placeholder">
              {personal.fullName ? personal.fullName.charAt(0).toUpperCase() : '?'}
            </div>
          )}
        </div>

        {personal.openToWork && (
          <div className="tc-sidebar__open-to-work">🟢 Open to Work</div>
        )}

        {/* Contact */}
        <div className="tc-sidebar__section">
          <h4 className="tc-sidebar__label">Liên hệ</h4>
          {personal.email && (
            <p className="tc-sidebar__contact">
              <span className="material-symbols-outlined">mail</span> {personal.email}
            </p>
          )}
          {personal.phone && (
            <p className="tc-sidebar__contact">
              <span className="material-symbols-outlined">phone</span> {personal.phone}
            </p>
          )}
          {personal.location && (
            <p className="tc-sidebar__contact">
              <span className="material-symbols-outlined">location_on</span> {personal.location}
            </p>
          )}
          {personal.website && (
            <p className="tc-sidebar__contact">
              <span className="material-symbols-outlined">language</span> {personal.website}
            </p>
          )}
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="tc-sidebar__section">
            <h4 className="tc-sidebar__label">Kỹ năng</h4>
            {skills.map(group => (
              <div key={group.id} className="tc-sidebar__skill-group">
                {group.category && (
                  <p className="tc-sidebar__skill-cat">{group.category}</p>
                )}
                {group.items.filter(Boolean).map((item, i) => (
                  <span key={i} className="tc-sidebar__skill-chip">{item}</span>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div className="tc-sidebar__section">
            <h4 className="tc-sidebar__label">Chứng chỉ</h4>
            {certifications.map(cert => (
              <div key={cert.id} className="tc-sidebar__cert">
                <p className="tc-sidebar__cert-name">{cert.name}</p>
                <p className="tc-sidebar__cert-issuer">{cert.issuer} · {cert.year}</p>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="tc-main">
        {/* Header */}
        <div className="tc-main__header">
          <h1 className="tc-main__name">{personal.fullName || 'Họ và tên'}</h1>
          <h2 className="tc-main__title">{personal.title || 'Vị trí ứng tuyển'}</h2>
          {personal.summary && (
            <p className="tc-main__summary">{personal.summary}</p>
          )}
        </div>

        {/* Experience */}
        {experiences.length > 0 && (
          <section className="tc-section">
            <h3 className="tc-section__title">
              <span className="tc-section__title-bar" />
              Kinh nghiệm làm việc
            </h3>
            {experiences.map(exp => (
              <div key={exp.id} className="tc-exp">
                <div className="tc-exp__header">
                  <div>
                    <h4 className="tc-exp__position">{exp.position || 'Vị trí'}</h4>
                    <p className="tc-exp__company">{exp.company || 'Công ty'}</p>
                  </div>
                  <span className="tc-exp__period">{exp.startDate} – {exp.endDate}</span>
                </div>
                {exp.description && <p className="tc-exp__desc" style={{ whiteSpace: 'pre-wrap' }}>{exp.description}</p>}
                {exp.bullets.filter(Boolean).length > 0 && (
                  <ul className="tc-exp__bullets">
                    {exp.bullets.filter(Boolean).map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section className="tc-section">
            <h3 className="tc-section__title">
              <span className="tc-section__title-bar" />
              Học vấn
            </h3>
            {education.map(edu => (
              <div key={edu.id} className="tc-edu">
                <div className="tc-edu__header">
                  <h4 className="tc-edu__school">{edu.school}</h4>
                  <span className="tc-edu__years">{edu.startYear} – {edu.endYear}</span>
                </div>
                <p className="tc-edu__degree">{edu.degree}</p>
                {edu.gpa && <p className="tc-edu__gpa">GPA: {edu.gpa}</p>}
              </div>
            ))}
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section className="tc-section">
            <h3 className="tc-section__title">
              <span className="tc-section__title-bar" />
              Dự án nổi bật
            </h3>
            {projects.map(proj => (
              <div key={proj.id} className="tc-project">
                <div className="tc-project__header">
                  <h4 className="tc-project__name">{proj.name}</h4>
                  <div className="tc-project__links">
                    {proj.githubUrl && <a href={proj.githubUrl}>GitHub</a>}
                    {proj.demoUrl && <a href={proj.demoUrl}>Demo</a>}
                  </div>
                </div>
                <p className="tc-project__desc" style={{ whiteSpace: 'pre-wrap' }}>{proj.description}</p>
                {proj.tags.filter(Boolean).length > 0 && (
                  <div className="tc-project__tags">
                    {proj.tags.filter(Boolean).map((t, i) => (
                      <span key={i} className="tc-project__tag">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
