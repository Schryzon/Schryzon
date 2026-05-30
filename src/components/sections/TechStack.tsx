import type { SkillGroup } from '../../types/content'
import ScrollReveal from '../ui/ScrollReveal'

interface TechStackProps {
    data: SkillGroup[]
}

const FALLBACK_ICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/devicon/devicon-original.svg'

export default function TechStack({ data }: TechStackProps) {
    return (
        <section className="section" id="stack">
            <div className="container">
                <ScrollReveal>
                    <h2 className="section-title">Tech Stack</h2>
                    <p className="section-subtitle">Tools I use to build things that work</p>
                </ScrollReveal>

                {data.map((group, gi) => (
                    <ScrollReveal key={group.category} delay={gi * 0.1}>
                        <div className="skills-group">
                            <div className="skills-group-title">{group.category}</div>
                            <div className="skills-grid">
                                {group.skills.map((skill) => (
                                    <div key={skill.name} className="glass-card skill-card">
                                        <img
                                            src={skill.icon_url}
                                            alt={skill.name}
                                            className="skill-icon"
                                            onError={e => {
                                                (e.target as HTMLImageElement).src = FALLBACK_ICON
                                            }}
                                        />
                                        <span className="skill-name">{skill.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ScrollReveal>
                ))}
            </div>
        </section>
    )
}
