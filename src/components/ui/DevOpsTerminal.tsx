import { useState, useRef, useEffect } from 'react'
import { Terminal, Send, ShieldAlert } from 'lucide-react'
import content_data from '../../data/content.json'

interface HistoryItem {
    type: 'input' | 'output' | 'error' | 'success' | 'ascii'
    text: string
}

export default function DevOpsTerminal() {
    const [history, set_history] = useState<HistoryItem[]>([
        { type: 'ascii', text: '   _____       __                                 \n  / ___/_____ / /_   _____ __  __ ___   ____   ____ \n  \\__ \\ / ___// __ \\ / ___// / / //_  / / __ \\ / __ \\\n ___/ // /__ / / / // /   / /_/ /  / /_/ /_/ // / / /\n/____/ \\___//_/ /_//_/    \\__, /  /___/\\____//_/ /_/ \n                         /____/                      ' },
        { type: 'success', text: 'Welcome to XYD-OS v1.0.4 Terminal simulation!' },
        { type: 'output', text: 'Type "help" to view a list of available system commands.' },
    ])
    const [input, set_input] = useState('')
    const [is_hacking, set_is_hacking] = useState(false)
    const history_container_ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const container = history_container_ref.current
        if (container) {
            container.scrollTop = container.scrollHeight
        }
    }, [history, is_hacking])

    const handle_command = async (cmd: string) => {
        const trimmed = cmd.trim().toLowerCase()
        if (!trimmed) return

        const new_history = [...history, { type: 'input' as const, text: `guest@schryzon:~$ ${cmd}` }]

        if (trimmed === 'clear') {
            set_history([])
            return
        }

        if (trimmed === 'help') {
            set_history([
                ...new_history,
                { type: 'output', text: 'Available commands:' },
                { type: 'success', text: '  about      - Display short summary of who I am' },
                { type: 'success', text: '  skills     - List my core tech stack categories' },
                { type: 'success', text: '  projects   - Show highlights of my featured repositories' },
                { type: 'success', text: '  neofetch   - Display system info with retro ASCII art' },
                { type: 'success', text: '  theme      - Cycle portfolio accent colors' },
                { type: 'success', text: '  clear      - Clear the terminal console' },
                { type: 'success', text: '  sudo ufw disable - Disable active system firewall safeguards' },
            ])
            return
        }

        if (trimmed === 'about') {
            set_history([
                ...new_history,
                { type: 'output', text: 'Profile: I Nyoman Widiyasa Jayananda (Jay / Schryzon)' },
                { type: 'output', text: 'Role: Cloud, DevOps & Backend Developer' },
                { type: 'output', text: 'Location: Mataram, Indonesia' },
                { type: 'output', text: 'Bio: Crafting scalable backends, configuring automated CI/CD pipelines, and writing predictably robust systems.' },
            ])
            return
        }

        if (trimmed === 'skills') {
            set_history([
                ...new_history,
                { type: 'success', text: '=== Tech Stack Overview ===' },
                { type: 'output', text: '• Backend: Node.js, Python, TypeScript, Express, Prisma' },
                { type: 'output', text: '• Cloud & Infra: Docker, GitHub Actions, Linux, GCP' },
                { type: 'output', text: '• Databases: PostgreSQL, MongoDB, Redis, MySQL' },
                { type: 'output', text: '• Tooling: Git, Vite, Bash, VS Code, Scoop' },
            ])
            return
        }

        if (trimmed === 'projects') {
            const list = content_data.featured_projects.map((p, idx) => ({
                type: 'output' as const,
                text: `${idx + 1}. ${p.repo} - ${p.description_override || 'GitHub repository'}`
            }))
            set_history([
                ...new_history,
                { type: 'success', text: '=== Featured Projects ===' },
                ...list,
                { type: 'success', text: 'Search & filter them dynamically in the Projects section above!' }
            ])
            return
        }

        if (trimmed === 'neofetch') {
            const ascii_logo =
                `    /\\_/\\      ><(((°>
   ( o.o )
    > ^ <
   /     \\
  / | | | \\
 (  |_|_|  )`
            set_history([
                ...new_history,
                { type: 'ascii', text: ascii_logo },
                { type: 'success', text: 'guest@schryzon.github.io' },
                { type: 'output', text: '-----------------------' },
                { type: 'output', text: 'OS: XYD-OS v1.0.4 x86_64' },
                { type: 'output', text: 'Host: React Portfolio SPA' },
                { type: 'output', text: 'Kernel: Gemini Core v3.5' },
                { type: 'output', text: 'Uptime: ' + Math.floor(performance.now() / 1000) + 's' },
                { type: 'output', text: 'Shell: Antigravity-PowerShell-5.1' },
                { type: 'output', text: 'Theme: HSL Cyberpunk Custom' },
                { type: 'output', text: 'Editor: VS Code + pair_programming_mommy' },
            ])
            return
        }

        if (trimmed === 'theme') {
            // Trigger Accent switcher click
            const customizer = document.getElementById('accent-toggle')
            if (customizer) {
                customizer.click()
                set_history([
                    ...new_history,
                    { type: 'success', text: 'Accent color cycled successfully!' }
                ])
            } else {
                set_history([
                    ...new_history,
                    { type: 'error', text: 'Accent customizer controller not found in viewport.' }
                ])
            }
            return
        }

        if (trimmed === 'sudo ufw disable') {
            set_is_hacking(true)
            set_history([...new_history, { type: 'error', text: 'WARNING: SHUTTING DOWN ACTIVE SYSTEM FIREWALL SAFEGUARDS...' }])

            const hack_steps = [
                'Connecting to local system socket...',
                'Stopping active UFW daemon process...',
                'Flushing active iptables firewall rules...',
                'Disabling firewall at boot time (systemctl)...',
                'Firewall safeguards successfully disabled.',
                'SYSTEM STATUS: UNPROTECTED. Cyberattack threshold exceeded!'
            ]

            for (let i = 0; i < hack_steps.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 400))
                set_history(prev => [...prev, { type: 'error', text: `>> ${hack_steps[i]}` }])
            }

            await new Promise(resolve => setTimeout(resolve, 600))
            set_history(prev => [
                ...prev,
                { type: 'ascii', text: ' ACCESS DENIED \n SECURITY BYPASS BLOCKED ' },
                { type: 'success', text: 'Just kidding! XYD-OS is fully secured. Nice try, hacker. 😺🐟' }
            ])
            set_is_hacking(false)
            return
        }

        // Default error response
        set_history([
            ...new_history,
            { type: 'error', text: `Command not found: "${cmd}". Type "help" to see valid commands.` }
        ])
    }

    const handle_submit = (e: React.FormEvent) => {
        e.preventDefault()
        const cmd = input.trim()
        if (!cmd) return
        set_input('')
        handle_command(cmd)
    }

    return (
        <article className="glass-card" style={{
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            background: 'rgba(8, 8, 16, 0.75)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
            width: '100%',
            maxWidth: '680px',
            height: '360px',
            margin: '0 auto'
        }}>
            {/* Terminal Title Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 1rem',
                background: 'rgba(15, 15, 26, 0.9)',
                borderBottom: '1px solid var(--border-subtle)',
                userSelect: 'none'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <Terminal size={14} color="var(--accent-bright)" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>schryzon_devops_console.sh</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24' }} />
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                </div>
            </div>

            {/* Terminal History */}
            <div
                ref={history_container_ref}
                style={{
                    flex: 1,
                    padding: '1rem',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    lineHeight: 1.5,
                    color: 'var(--text-primary)',
                    scrollbarWidth: 'thin'
                }}
            >
                {history.map((item, idx) => {
                    let color = 'var(--text-primary)'
                    if (item.type === 'input') color = 'var(--text-secondary)'
                    if (item.type === 'success') color = 'var(--accent-bright)'
                    if (item.type === 'error') color = '#ef4444'
                    if (item.type === 'ascii') color = 'var(--accent-primary)'

                    return (
                        <div key={idx} style={{
                            color,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontWeight: item.type === 'input' ? 600 : 400
                        }}>
                            {item.type === 'ascii' ? (
                                <pre style={{ fontFamily: 'inherit', margin: 0, fontSize: '0.78rem' }}>{item.text}</pre>
                            ) : (
                                item.text
                            )}
                        </div>
                    );
                })}

                {is_hacking && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', animation: 'pulse 1.5s infinite' }}>
                        <ShieldAlert size={14} />
                        <span>EXECUTING SYSTEM OVERRIDE...</span>
                    </div>
                )}
            </div>

            {/* Terminal Form Input */}
            <form onSubmit={handle_submit} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.5rem 1rem',
                background: 'rgba(15, 15, 26, 0.9)',
                borderTop: '1px solid var(--border-subtle)'
            }}>
                <span style={{ color: 'var(--accent-bright)', fontWeight: 600, marginRight: '0.5rem', userSelect: 'none' }}>guest@schryzon:~$</span>
                <input
                    type="text"
                    value={input}
                    onChange={e => set_input(e.target.value)}
                    placeholder='Type a command... (e.g. "help", "neofetch")'
                    disabled={is_hacking}
                    style={{
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.85rem',
                        caretColor: 'var(--accent-primary)'
                    }}
                />
                <button
                    type="submit"
                    disabled={is_hacking || !input.trim()}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: input.trim() ? 'var(--accent-bright)' : 'var(--text-muted)',
                        padding: '0.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.15s ease'
                    }}
                >
                    <Send size={14} />
                </button>
            </form>
        </article>
    )
}
