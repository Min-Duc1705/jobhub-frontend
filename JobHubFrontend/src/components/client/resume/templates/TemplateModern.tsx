import type { ResumeContent } from '../../../../types/resume-builder'
import './TemplateModern.scss'

interface Props {
  data: ResumeContent
}

export default function TemplateModern({ data }: Props) {
  const { personal, experiences, education, skills, certifications, projects } = data

  return (
    <div className="tm-wrap">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <section className="tm-hero">
        <div className="tm-hero__avatar-wrap">
          {personal.avatarUrl ? (
            <img className="tm-hero__avatar" src={personal.avatarUrl} alt={personal.fullName} />
          ) : (
            <div className="tm-hero__avatar tm-hero__avatar--placeholder">
              {personal.fullName ? personal.fullName.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          {personal.openToWork && (
            <div className="tm-hero__badge">
              <span className="tm-hero__badge-dot" />
              OPEN TO WORK
            </div>
          )}
        </div>

        <div className="tm-hero__info">
          <h1 className="tm-hero__name">{personal.fullName || 'Họ và tên'}</h1>
          <p className="tm-hero__title">{personal.title || 'Vị trí ứng tuyển'}</p>

          <div className="tm-hero__contacts">
            {personal.location && (
              <span className="tm-hero__contact">
                <span className="material-symbols-outlined">location_on</span>
                {personal.location}
              </span>
            )}
            {personal.email && (
              <span className="tm-hero__contact">
                <span className="material-symbols-outlined">mail</span>
                {personal.email}
              </span>
            )}
            {personal.phone && (
              <span className="tm-hero__contact">
                <span className="material-symbols-outlined">phone</span>
                {personal.phone}
              </span>
            )}
            {personal.website && (
              <span className="tm-hero__contact">
                <span className="material-symbols-outlined">language</span>
                {personal.website}
              </span>
            )}
          </div>

          {personal.summary && (
            <p className="tm-hero__summary">{personal.summary}</p>
          )}
        </div>
      </section>

      <div className="tm-divider" />

      {/* ── Experience ─────────────────────────────────────────────────────── */}
      {experiences.length > 0 && (
        <section className="tm-section">
          <h2 className="tm-section__title">
            <span className="material-symbols-outlined">history</span>
            Kinh nghiệm làm việc
          </h2>
          <div className="tm-timeline">
            {experiences.map((exp, idx) => (
              <div key={exp.id} className="tm-timeline__item">
                <div
                  className={`tm-timeline__dot ${idx === 0 ? 'tm-timeline__dot--active' : ''}`}
                />
                <div className="tm-timeline__content">
                  <div className="tm-exp__header">
                    <div>
                      <h3 className="tm-exp__position">{exp.position || 'Vị trí'}</h3>
                      <p className="tm-exp__company">{exp.company || 'Công ty'}</p>
                    </div>
                    <span className="tm-exp__period">
                      {exp.startDate} – {exp.endDate}
                    </span>
                  </div>
                  {exp.description && (
                    <p className="tm-exp__desc" style={{ whiteSpace: 'pre-wrap' }}>{exp.description}</p>
                  )}
                  {exp.bullets.filter(Boolean).length > 0 && (
                    <ul className="tm-exp__bullets">
                      {exp.bullets.filter(Boolean).map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {exp.tags.filter(Boolean).length > 0 && (
                    <div className="tm-tags">
                      {exp.tags.filter(Boolean).map((t, i) => (
                        <span key={i} className="tm-tag">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="tm-divider" />

      {/* ── Skills ─────────────────────────────────────────────────────────── */}
      {skills.length > 0 && (
        <section className="tm-section">
          <h2 className="tm-section__title">
            <span className="material-symbols-outlined">bolt</span>
            Kỹ năng chuyên môn
          </h2>
          <div className="tm-skills-grid">
            {skills.map(group => (
              <div key={group.id} className="tm-skill-group">
                <h4 className="tm-skill-group__title">{group.category}</h4>
                <div className="tm-skill-tags">
                  {group.items.filter(Boolean).map((item, i) => (
                    <span key={i} className="tm-skill-tag">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="tm-divider" />

      {/* ── Education + Certifications ─────────────────────────────────────── */}
      <div className="tm-two-col">
        {education.length > 0 && (
          <section className="tm-section">
            <h2 className="tm-section__title">
              <span className="material-symbols-outlined">school</span>
              Học vấn
            </h2>
            {education.map(edu => (
              <div key={edu.id} className="tm-edu">
                <p className="tm-edu__school">{edu.school}</p>
                <p className="tm-edu__degree">
                  {edu.degree} | {edu.startYear} – {edu.endYear}
                </p>
                {edu.gpa && <p className="tm-edu__gpa">GPA: {edu.gpa}</p>}
              </div>
            ))}
          </section>
        )}

        {certifications.length > 0 && (
          <section className="tm-section">
            <h2 className="tm-section__title">
              <span className="material-symbols-outlined">verified</span>
              Chứng chỉ
            </h2>
            <ul className="tm-cert-list">
              {certifications.map(cert => (
                <li key={cert.id} className="tm-cert">
                  <div className="tm-cert__icon">
                    <span className="material-symbols-outlined">
                      {cert.icon || 'workspace_premium'}
                    </span>
                  </div>
                  <div>
                    <p className="tm-cert__name">{cert.name}</p>
                    <p className="tm-cert__issuer">{cert.issuer} | {cert.year}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* ── Featured Project ───────────────────────────────────────────────── */}
      {projects.length > 0 && (
        <>
          <div className="tm-divider" />
          <section className="tm-section">
            <h2 className="tm-section__title">
              <span className="material-symbols-outlined">rocket_launch</span>
              Dự án nổi bật
            </h2>
            {projects.map(proj => (
              <div key={proj.id} className="tm-project">
                <div className="tm-project__header">
                  <div>
                    <h3 className="tm-project__name">{proj.name}</h3>
                    {proj.stars && (
                      <span className="tm-project__stars">
                        <span className="material-symbols-outlined">star</span>
                        {proj.stars}
                      </span>
                    )}
                  </div>
                  <div className="tm-project__links">
                    {proj.githubUrl && (
                      <a href={proj.githubUrl} target="_blank" rel="noreferrer">
                        GitHub
                      </a>
                    )}
                    {proj.demoUrl && (
                      <a href={proj.demoUrl} target="_blank" rel="noreferrer">
                        Demo
                      </a>
                    )}
                  </div>
                </div>
                <p className="tm-project__desc" style={{ whiteSpace: 'pre-wrap' }}>{proj.description}</p>
                {proj.tags.filter(Boolean).length > 0 && (
                  <div className="tm-tags">
                    {proj.tags.filter(Boolean).map((t, i) => (
                      <span key={i} className="tm-tag">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  )
}
