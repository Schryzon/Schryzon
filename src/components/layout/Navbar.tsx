import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_LINKS = [
    { label: 'About', href: '#about' },
    { label: 'Stack', href: '#stack' },
    { label: 'Projects', href: '#projects' },
    { label: 'Experience', href: '#experience' },
    { label: 'Vision', href: '#vision' },
    { label: 'Contact', href: '#contact' },
]

export default function Navbar() {
    const [scrolled, set_scrolled] = useState(false)
    const [menu_open, set_menu_open] = useState(false)

    useEffect(() => {
        const handle_scroll = () => set_scrolled(window.scrollY > 40)
        window.addEventListener('scroll', handle_scroll)
        return () => window.removeEventListener('scroll', handle_scroll)
    }, [])

    const close_menu = () => set_menu_open(false)

    return (
        <>
            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
                <a href="/" className="navbar-logo">
                    <span>{'<'}</span>Schryzon<span>{'/>'}</span>
                </a>

                <ul className="navbar-links">
                    {NAV_LINKS.map(link => (
                        <li key={link.href}>
                            <a href={link.href}>{link.label}</a>
                        </li>
                    ))}
                </ul>

                <button
                    className="navbar-mobile-toggle"
                    onClick={() => set_menu_open(!menu_open)}
                    aria-label="Toggle navigation"
                >
                    {menu_open ? <X size={22} /> : <Menu size={22} />}
                </button>
            </nav>

            <AnimatePresence>
                {menu_open && (
                    <motion.div
                        className="navbar-mobile-menu open"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <button
                            className="navbar-mobile-toggle"
                            style={{ position: 'absolute', top: '1rem', right: '1.5rem' }}
                            onClick={close_menu}
                            aria-label="Close navigation"
                        >
                            <X size={24} />
                        </button>
                        {NAV_LINKS.map((link, i) => (
                            <motion.a
                                key={link.href}
                                href={link.href}
                                onClick={close_menu}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                            >
                                {link.label}
                            </motion.a>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
