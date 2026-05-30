import type { About as AboutType } from '../../types/content'
import ScrollReveal from '../ui/ScrollReveal'

interface AboutProps {
    data: AboutType
}

export default function About({ data }: AboutProps) {
    return (
        <section className="section" id="about">
            <div className="container">
                <ScrollReveal>
                    <h2 className="section-title">About</h2>
                    <p className="section-subtitle">Who I am when I am not staring at logs</p>
                </ScrollReveal>

                <div className="about-grid">
                    <ScrollReveal delay={0.1}>
                        <div className="about-bio">
                            {data.bio.map((paragraph, i) => (
                                <p key={i}>{paragraph}</p>
                            ))}

                            <blockquote className="about-quote">
                                <p>{data.quote}</p>
                                <cite>- {data.quote_author}</cite>
                            </blockquote>
                        </div>
                    </ScrollReveal>

                    <div className="about-sidebar">
                        <ScrollReveal delay={0.2}>
                            <div className="glass-card stat-card">
                                <div className="stat-number">{data.years_experience}+</div>
                                <div className="stat-label">Years of experience</div>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal delay={0.3}>
                            <div className="glass-card fun-facts">
                                <h4>Quick Facts</h4>
                                <ul>
                                    {data.fun_facts.map((fact, i) => (
                                        <li key={i}>{fact}</li>
                                    ))}
                                </ul>
                            </div>
                        </ScrollReveal>

                        {data.languages && data.languages.length > 0 && (
                            <ScrollReveal delay={0.35}>
                                <div className="glass-card fun-facts">
                                    <h4>Languages</h4>
                                    <ul>
                                        {data.languages.map((lang, i) => (
                                            <li key={i}>
                                                <strong>{lang.name}</strong> - {lang.proficiency}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </ScrollReveal>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}
