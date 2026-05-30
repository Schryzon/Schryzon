import type { SocialLink } from '../../types/content'
import ScrollReveal from '../ui/ScrollReveal'
import { Globe } from 'lucide-react'
import { SiGithub, SiGooglechrome, SiDiscord, SiTopdotgg } from '@icons-pack/react-simple-icons'
import LinkedInIcon from '../ui/LinkedInIcon'

interface ContactProps {
    data: SocialLink[]
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
    GitHub: <SiGithub size={20} />,
    LinkedIn: <LinkedInIcon size={20} />,
    'Google Dev': <SiGooglechrome size={20} />,
    'Discord Bot': <SiTopdotgg size={20} />,
    Discord: <SiDiscord size={20} />,
}

export default function Contact({ data }: ContactProps) {
    return (
        <section className="section" id="contact">
            <div className="container">
                <ScrollReveal>
                    <h2 className="section-title">Contact</h2>
                    <p className="section-subtitle">Find me on these platforms</p>
                </ScrollReveal>

                <ScrollReveal delay={0.1}>
                    <div className="contact-wrapper">
                        <p className="contact-intro">
                            I am available for Cloud, DevOps, and Backend roles. Whether you want to collaborate
                            on something interesting or just say hello, the links below are the right way to reach me.
                        </p>

                        <div className="social-grid">
                            {data.map((link) => (
                                <a
                                    key={link.platform}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="glass-card social-card"
                                    id={`social-${link.platform.toLowerCase().replace(/\s+/g, '-')}`}
                                >
                                    <div className="social-icon">
                                        {PLATFORM_ICONS[link.platform] ?? <Globe size={20} />}
                                    </div>
                                    <div className="social-info">
                                        <div className="social-platform">{link.platform}</div>
                                        <div className="social-label">{link.label}</div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    )
}
