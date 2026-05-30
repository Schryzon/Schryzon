import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ScrollToTop() {
    const [visible, set_visible] = useState(false)

    useEffect(() => {
        const toggle_visibility = () => {
            set_visible(window.scrollY > 300)
        }
        window.addEventListener('scroll', toggle_visibility)
        return () => window.removeEventListener('scroll', toggle_visibility)
    }, [])

    const scroll_to_top = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    onClick={scroll_to_top}
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    whileHover={{ scale: 1.12, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        zIndex: 90,
                        background: 'linear-gradient(135deg, var(--accent-dim), var(--accent-primary))',
                        border: '1px solid var(--border-accent)',
                        borderRadius: '50%',
                        width: '46px',
                        height: '46px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'pointer',
                        boxShadow: '0 0 20px var(--accent-glow)',
                        outline: 'none'
                    }}
                    aria-label="Scroll to top"
                >
                    <ArrowUp size={20} strokeWidth={2.5} />
                </motion.button>
            )}
        </AnimatePresence>
    )
}
