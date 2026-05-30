import { useState } from 'react'
import type { Experience as ExperienceType, Education, Certification } from '../../types/content'
import ScrollReveal from '../ui/ScrollReveal'

interface ExperienceProps {
    experience: ExperienceType[]
    education: Education[]
    certifications: Certification[]
}

export default function Experience({ experience, education, certifications }: ExperienceProps) {
    const [expanded, set_expanded] = useState(false)

    // Show 3 items by default when collapsed for experience/education, and 6 for certifications
    const displayed_experience = expanded ? experience : experience.slice(0, 3)
    const displayed_education = expanded ? education : education.slice(0, 3)
    const displayed_certs = expanded ? certifications : certifications.slice(0, 6)

    const hidden_experience_count = experience.length - displayed_experience.length
    const hidden_education_count = education.length - displayed_education.length
    const hidden_certs_count = certifications.length - displayed_certs.length
    const total_hidden = hidden_experience_count + hidden_education_count + hidden_certs_count

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
                                Work & Projects
                            </h3>
                            <div className="timeline">
                                {displayed_experience.map((exp, i) => (
                                    <article key={i} className="glass-card timeline-item">
                                        <div className="timeline-dot" />
                                        <div className="timeline-period">{exp.period}</div>
                                        <div className="timeline-title">{exp.role}</div>
                                        <div className="timeline-org">{exp.org}</div>
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
                                        <div className="timeline-org">
                                            {edu.field ? `${edu.field} - ` : ''}{edu.university}
                                            {edu.gpa ? ` (GPA: ${edu.gpa})` : ''}
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
                                    {displayed_certs.map((cert, i) => (
                                        <div key={i} className="glass-card cert-card">
                                            <div className="cert-name">{cert.name}</div>
                                            <div className="cert-issuer">{cert.issuer}</div>
                                            <div className="cert-date">{cert.date}</div>
                                            {cert.url && (
                                                <a href={cert.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: 'var(--accent-bright)', marginTop: '0.25rem' }}>
                                                    View certificate
                                                </a>
                                            )}
                                        </div>
                                    ))}
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
