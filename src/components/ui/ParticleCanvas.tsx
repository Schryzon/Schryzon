import { useEffect, useRef } from 'react'

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    opacity: number
    color: string
}

const COLORS = ['#9b59e6', '#b27ae4', '#7b2fd4', '#6a22c2']

export default function ParticleCanvas() {
    const canvas_ref = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvas_ref.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const particles: Particle[] = []
        let animation_id: number

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        const spawn_particle = (): Particle => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.4 + 0.1,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
        })

        for (let i = 0; i < 80; i++) {
            particles.push(spawn_particle())
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            particles.forEach(p => {
                p.x += p.vx
                p.y += p.vy

                if (p.x < 0) p.x = canvas.width
                if (p.x > canvas.width) p.x = 0
                if (p.y < 0) p.y = canvas.height
                if (p.y > canvas.height) p.y = 0

                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fillStyle = p.color
                ctx.globalAlpha = p.opacity
                ctx.fill()
            })

            // Draw connecting lines between nearby particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x
                    const dy = particles[i].y - particles[j].y
                    const dist = Math.sqrt(dx * dx + dy * dy)

                    if (dist < 120) {
                        ctx.beginPath()
                        ctx.moveTo(particles[i].x, particles[i].y)
                        ctx.lineTo(particles[j].x, particles[j].y)
                        ctx.strokeStyle = '#9b59e6'
                        ctx.globalAlpha = (1 - dist / 120) * 0.1
                        ctx.lineWidth = 0.5
                        ctx.stroke()
                    }
                }
            }

            ctx.globalAlpha = 1
            animation_id = requestAnimationFrame(draw)
        }

        resize()
        window.addEventListener('resize', resize)
        draw()

        return () => {
            cancelAnimationFrame(animation_id)
            window.removeEventListener('resize', resize)
        }
    }, [])

    return (
        <canvas
            ref={canvas_ref}
            className="hero-canvas"
            style={{ opacity: 0.6 }}
        />
    )
}
