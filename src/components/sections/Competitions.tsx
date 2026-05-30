import type { Competition } from '../../types/content'
import ScrollReveal from '../ui/ScrollReveal'

interface CompetitionsProps {
    data: Competition[]
}

export default function Competitions({ data }: CompetitionsProps) {
    if (data.length === 0) return null

    return (
        <section className="section" id="competitions">
            <div className="container">
                <ScrollReveal>
                    <h2 className="section-title">Competitions</h2>
                    <p className="section-subtitle">Joining for the fun of it, learning under pressure</p>
                </ScrollReveal>

                <ScrollReveal delay={0.1}>
                    <div className="competitions-list">
                        {data.map((comp, i) => (
                            <article key={i} className="glass-card competition-item">
                                <div className="competition-name">{comp.name}</div>
                                <div className="competition-meta">
                                    {comp.organizer && (
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {comp.organizer}
                                        </span>
                                    )}
                                    <span className="competition-year">{comp.year}</span>
                                    {comp.result && (
                                        <span className="competition-result">{comp.result}</span>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                </ScrollReveal>
            </div>
        </section>
    )
}
