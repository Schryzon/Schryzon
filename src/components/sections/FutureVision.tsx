import type { FutureVision as FutureVisionType } from '../../types/content'
import ScrollReveal from '../ui/ScrollReveal'

interface FutureVisionProps {
    data: FutureVisionType
}

export default function FutureVision({ data }: FutureVisionProps) {
    return (
        <section className="section" id="vision">
            <div className="container">
                <ScrollReveal>
                    <h2 className="section-title">Future Vision</h2>
                    <p className="section-subtitle">Where I am heading and what I want to build</p>
                </ScrollReveal>

                <div className="vision-wrapper">
                    <ScrollReveal delay={0.1}>
                        <p className="vision-statement">{data.statement}</p>
                    </ScrollReveal>

                    <ScrollReveal delay={0.2}>
                        <ul className="vision-goals">
                            {data.goals.map((goal, i) => (
                                <li key={i} className="glass-card vision-goal">
                                    <span className="vision-goal-number">0{i + 1}.</span>
                                    <span className="vision-goal-text">{goal}</span>
                                </li>
                            ))}
                        </ul>
                    </ScrollReveal>
                </div>
            </div>
        </section>
    )
}
