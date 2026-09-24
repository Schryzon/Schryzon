import { useState } from 'react'
import type { Experience as ExperienceType, Education, Certification } from '../../types/content'
import ScrollReveal from '../ui/ScrollReveal'

interface ExperienceProps {
    experience: ExperienceType[]
    education: Education[]
    certifications: Certification[]
}

const resolve_asset_url = (path?: string) => {
    if (!path) return undefined
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}

const ISSUER_LOGOS: Record<string, string> = {
    'Google Cloud Asia Pacific': 'images/orgs/google_cloud_asia_pacific.png',
    'Google Cloud Skills Boost': 'images/orgs/google_cloud_skills_boost.png',
    'Google for Education': 'images/orgs/google_for_education.png',
    'Dicoding Indonesia': 'images/orgs/dicoding_indonesia.png',
    'HackerRank': 'images/orgs/hackerrank.png',
    'Sololearn': 'images/orgs/sololearn.png',
    'MySkill': 'images/orgs/myskill.png',
    'University of Mataram': 'images/orgs/university_of_mataram.png',
    'University of Pennsylvania': 'images/orgs/university_of_pennsylvania.png',
    'Udemy': 'images/orgs/udemy.png',
    'BCG X': 'images/orgs/bcg_x.png',
    'Discord': 'images/orgs/discord.png',
    'Telkom University': 'images/orgs/telkom_university.png',
    'Institut Teknologi Bandung': 'images/orgs/institut_teknologi_bandung.png',
    'HMIF FT-UNRAM': 'images/orgs/hmif.png',
}

export default function Experience({ experience, education, certifications }: ExperienceProps) {
    const [expanded, set_expanded] = useState(false)
    const [filter_type, set_filter_type] = useState<'all' | 'work' | 'volunteering' | 'org'>('all')

    const filtered_experience = experience.filter(exp => {
        if (filter_type === 'all') return true
        return exp.type === filter_type
    })

    // Show 4 items by default when collapsed for experience, 3 for education, and 6 for certifications
    const displayed_experience = expanded ? filtered_experience : filtered_experience.slice(0, 4)
    const displayed_education = expanded ? education : education.slice(0, 3)
    const displayed_certs = expanded ? certifications : certifications.slice(0, 6)

    const hidden_experience_count = filtered_experience.length - displayed_experience.length
    const hidden_education_count = education.length - displayed_education.length
    const hidden_certs_count = certifications.length - displayed_certs.length
    const total_hidden = hidden_experience_count + hidden_education_count + hidden_certs_count

    const work_count = experience.filter(e => e.type === 'work').length
    const vol_count = experience.filter(e => e.type === 'volunteering').length
    const org_count = experience.filter(e => e.type === 'org').length

    return (
        <section className="section" id="experience">
            <div className="container">
                <ScrollReveal>
                    <h2 className="section-title">Experience & Education</h2>
                    <p className="section-subtitle">Where I have been and what I learned</p>
                </ScrollReveal>

                <div className="experience-columns-grid">
                    <ScrollReveal delay={0.1}>
                        <div className="experience-column">
                            <h3 className="experience-column-title">
                                Work & Community
                            </h3>

                            <div className="experience-filter-tabs">
                                <button
                                    onClick={() => set_filter_type('all')}
                                    className={`experience-filter-btn ${filter_type === 'all' ? 'active' : ''}`}
                                >
                                    All ({experience.length})
                                </button>
                                <button
                                    onClick={() => set_filter_type('work')}
                                    className={`experience-filter-btn ${filter_type === 'work' ? 'active' : ''}`}
                                >
                                    Work ({work_count})
                                </button>
                                <button
                                    onClick={() => set_filter_type('volunteering')}
                                    className={`experience-filter-btn ${filter_type === 'volunteering' ? 'active' : ''}`}
                                >
                                    Volunteering ({vol_count})
                                </button>
                                <button
                                    onClick={() => set_filter_type('org')}
                                    className={`experience-filter-btn ${filter_type === 'org' ? 'active' : ''}`}
                                >
                                    Leadership ({org_count})
                                </button>
                            </div>

                            <div className="timeline">
                                {displayed_experience.map((exp, i) => (
                                    <article key={i} className="glass-card timeline-item">
                                        <div className="timeline-dot" />
                                        <div className="timeline-header-row">
                                            <div className="timeline-period">{exp.period}</div>
                                            <span className={`timeline-badge badge-${exp.type || 'work'}`}>
                                                {exp.type === 'volunteering' ? 'Volunteering' : exp.type === 'org' ? 'Leadership' : 'Work'}
                                            </span>
                                        </div>
                                        <div className="timeline-title">{exp.role}</div>
                                        <div className="timeline-org-row">
                                            {exp.logo_url && (
                                                <img
                                                    src={resolve_asset_url(exp.logo_url)}
                                                    alt={`${exp.org} logo`}
                                                    className="timeline-org-logo"
                                                    loading="lazy"
                                                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                                                />
                                            )}
                                            <span className="timeline-org" style={{ marginBottom: 0 }}>{exp.org}</span>
                                        </div>
                                        <p className="timeline-desc">{exp.description}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={0.15}>
                        <div className="experience-column">
                            <h3 className="experience-column-title">
                                Education
                            </h3>
                            <div className="timeline">
                                {displayed_education.map((edu, i) => (
                                    <article key={i} className="glass-card timeline-item">
                                        <div className="timeline-dot" />
                                        <div className="timeline-period">{edu.period}</div>
                                        <div className="timeline-title">{edu.degree}</div>
                                        <div className="timeline-org-row">
                                            <img
                                                src={resolve_asset_url('images/orgs/university_of_mataram.png')}
                                                alt="University logo"
                                                className="timeline-org-logo"
                                                loading="lazy"
                                                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                                            />
                                            <span className="timeline-org" style={{ marginBottom: 0 }}>
                                                {edu.field ? `${edu.field} - ` : ''}{edu.university}
                                                {edu.gpa ? ` (GPA: ${edu.gpa})` : ''}
                                            </span>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </ScrollReveal>

                    {certifications.length > 0 && (
                        <ScrollReveal delay={0.2}>
                            <div className="experience-column">
                                <h3 className="experience-column-title">
                                    Certifications
                                </h3>
                                <div className="certs-list-vertical">
                                    {displayed_certs.map((cert, i) => {
                                        const logo_path = ISSUER_LOGOS[cert.issuer]
                                        return (
                                            <div key={i} className="glass-card cert-card">
                                                <div className="cert-card-header">
                                                    {logo_path && (
                                                        <img
                                                            src={resolve_asset_url(logo_path)}
                                                            alt={`${cert.issuer} logo`}
                                                            className="cert-logo"
                                                            loading="lazy"
                                                            onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="cert-name">{cert.name}</div>
                                                        <div className="cert-issuer">{cert.issuer}</div>
                                                    </div>
                                                </div>
                                                <div className="cert-date">{cert.date}</div>
                                                {cert.url && (
                                                    <a href={cert.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: 'var(--accent-bright)', marginTop: '0.25rem', display: 'inline-block' }}>
                                                        View certificate &rarr;
                                                    </a>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </ScrollReveal>
                    )}
                </div>

                {total_hidden > 0 && (
                    <ScrollReveal delay={0.25}>
                        <div className="show-more-wrapper">
                            {!expanded ? (
                                <button className="clickable-text" onClick={() => set_expanded(true)}>
                                    [ + show {total_hidden} more items ]
                                </button>
                            ) : (
                                <button className="clickable-text" onClick={() => set_expanded(false)}>
                                    [ - show fewer items ]
                                </button>
                            )}
                        </div>
                    </ScrollReveal>
                )}
            </div>
        </section>
    )
}
