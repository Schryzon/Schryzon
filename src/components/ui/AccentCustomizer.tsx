import { useState, useEffect } from 'react'
import { Palette } from 'lucide-react'
import { motion } from 'framer-motion'

type Theme = 'default-purple' | 'cyberpunk-cyan' | 'emerald-green' | 'sunset-orange'

const THEMES: Theme[] = ['default-purple', 'cyberpunk-cyan', 'emerald-green', 'sunset-orange']

export default function AccentCustomizer() {
    const [theme, set_theme] = useState<Theme>('default-purple')

    useEffect(() => {
        const stored = localStorage.getItem('schryzon_portfolio_accent') as Theme
        if (stored && THEMES.includes(stored)) {
            set_theme(stored)
            if (stored !== 'default-purple') {
                document.documentElement.setAttribute('data-theme', stored)
            }
        }
    }, [])

    const cycle_theme = () => {
        const idx = THEMES.indexOf(theme)
        const next = THEMES[(idx + 1) % THEMES.length]
        set_theme(next)
        localStorage.setItem('schryzon_portfolio_accent', next)
        
        if (next === 'default-purple') {
            document.documentElement.removeAttribute('data-theme')
        } else {
            document.documentElement.setAttribute('data-theme', next)
        }
    }

    return (
        <motion.button
            id="accent-toggle"
            onClick={cycle_theme}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{ scale: 1.12, y: -2 }}
            whileTap={{ scale: 0.95 }}
            style={{
                position: 'fixed',
                bottom: '2rem',
                left: '2rem',
                zIndex: 90,
                background: 'var(--bg-surface-raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '50%',
                width: '46px',
                height: '46px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-bright)',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                outline: 'none',
                transition: 'border-color var(--transition-base), color var(--transition-base)'
            }}
            aria-label="Cycle theme accent color"
            title="Cycle theme accent color"
        >
            <Palette size={20} />
        </motion.button>
    )
}
