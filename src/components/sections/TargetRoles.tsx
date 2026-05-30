import type { TargetRole } from '../../types/content'
import ScrollReveal from '../ui/ScrollReveal'
import { Briefcase } from 'lucide-react'

interface TargetRolesProps {
    data: TargetRole[]
}

export default function TargetRoles({ data }: TargetRolesProps) {
    if (data.length === 0) return null

    return (
        <section className="section" id="roles">
            <div className="container">
                <ScrollReveal>
                    <h2 className="section-title">Target Roles</h2>
                    <p className="section-subtitle">What I am looking for and where I want to contribute</p>
                </ScrollReveal>

                <div className="roles-grid">
                    {data.map((role, i) => (
                        <ScrollReveal key={role.title} delay={i * 0.08}>
                            <article className="glass-card role-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                                    <Briefcase size={16} color="var(--accent-bright)" />
                                    <div className="role-title">{role.title}</div>
                                </div>
                                <p className="role-description">{role.description}</p>
                            </article>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    )
}
