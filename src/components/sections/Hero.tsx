import { TypeAnimation } from 'react-type-animation'
import { motion } from 'framer-motion'
import { MapPin, ExternalLink } from 'lucide-react'
import { SiGithub } from '@icons-pack/react-simple-icons'
import LinkedInIcon from '../ui/LinkedInIcon'
import type { Hero } from '../../types/content'
import ParticleCanvas from '../ui/ParticleCanvas'

interface HeroProps {
    data: Hero
}

const make_anim = (i: number) => ({
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' as const },
})

export default function Hero({ data }: HeroProps) {
    const typed_sequence = data.taglines.flatMap(t => [t, 2200])

    return (
        <section className="hero" id="hero">
            <ParticleCanvas />
            <div className="hero-gradient" />
            <div className="hero-gradient-2" />

            <div className="hero-content">
                <div className="hero-text">
                    {data.open_to_work && (
                        <motion.div
                            className="hero-status"
                            {...make_anim(0)}
                        >
                            <span className="hero-status-dot" />
                            Open to Work
                        </motion.div>
                    )}

                    <motion.h1
                        className="hero-name"
                        {...make_anim(1)}
                    >
                        {data.name}
                    </motion.h1>

                    <motion.div
                        className="hero-handle"
                        {...make_anim(2)}
                    >
                        {data.handle}
                    </motion.div>

                    <motion.div
                        className="hero-typed-wrapper"
                        {...make_anim(3)}
                    >
                        <TypeAnimation
                            sequence={typed_sequence as (string | number)[]}
                            wrapper="span"
                            speed={55}
                            repeat={Infinity}
                            cursor={true}
                        />
                    </motion.div>

                    <motion.div
                        className="hero-location"
                        {...make_anim(4)}
                    >
                        <MapPin size={14} />
                        {data.location}
                    </motion.div>

                    <motion.div
                        className="hero-actions"
                        {...make_anim(5)}
                    >
                        <a
                            href="https://github.com/Schryzon"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                        >
                            <SiGithub size={16} />
                            GitHub
                        </a>
                        <a
                            href="https://linkedin.com/in/schryzon"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline"
                        >
                            <LinkedInIcon size={16} />
                            LinkedIn
                        </a>
                        <a
                            href="#contact"
                            className="btn btn-outline"
                        >
                            <ExternalLink size={16} />
                            Contact
                        </a>
                    </motion.div>
                </div>

                <motion.div
                    className="hero-avatar"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="hero-avatar-ring">
                        <img
                            src={data.avatar_url}
                            alt={`${data.name} avatar`}
                            className="hero-avatar-img"
                        />
                        <div className="hero-avatar-glow" />
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
