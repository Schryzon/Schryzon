import { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff, Key } from 'lucide-react'

// SHA-256 of "schryzon2026" - change this by running:
// crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourpassword'))
//   .then(b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2,'0')).join(''))
const PASSPHRASE_HASH = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
// NOTE: Replace the above hash with your actual hash. See /admin page for instructions.

const SESSION_KEY = 'schryzon_admin_auth'
const PAT_KEY = 'schryzon_admin_pat'

async function sha256(text: string): Promise<string> {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return Array.from(new Uint8Array(buf))
        .map(x => x.toString(16).padStart(2, '0'))
        .join('')
}

interface LoginProps {
    on_success: (pat: string) => void
}

export default function AdminLogin({ on_success }: LoginProps) {
    const [passphrase, set_passphrase] = useState('')
    const [pat, set_pat] = useState('')
    const [show_pass, set_show_pass] = useState(false)
    const [show_pat, set_show_pat] = useState(false)
    const [remember_me, set_remember_me] = useState(false)
    const [error, set_error] = useState('')
    const [loading, set_loading] = useState(false)

    // Check for stored session
    useEffect(() => {
        const stored_auth = sessionStorage.getItem(SESSION_KEY)
        const stored_pat = sessionStorage.getItem(PAT_KEY) || localStorage.getItem(PAT_KEY)
        if (stored_auth === 'true' && stored_pat) {
            on_success(stored_pat)
        }
    }, [])

    const handle_login = async (e: React.FormEvent) => {
        e.preventDefault()
        set_loading(true)
        set_error('')

        const hash = await sha256(passphrase)

        if (hash !== PASSPHRASE_HASH) {
            set_error('Incorrect passphrase.')
            set_loading(false)
            return
        }

        if (!pat.startsWith('ghp_') && !pat.startsWith('github_pat_')) {
            set_error('PAT format looks wrong. Should start with ghp_ or github_pat_')
            set_loading(false)
            return
        }

        sessionStorage.setItem(SESSION_KEY, 'true')
        sessionStorage.setItem(PAT_KEY, pat)

        if (remember_me) {
            localStorage.setItem(PAT_KEY, pat)
        }

        on_success(pat)
        set_loading(false)
    }

    return (
        <div className="admin-login">
            <div className="glass-card admin-login-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <Lock size={20} color="var(--accent-bright)" />
                    <div>
                        <div className="admin-login-title">Admin Panel</div>
                        <div className="admin-login-subtitle">schryzon.github.io/admin</div>
                    </div>
                </div>

                <div style={{
                    padding: '0.9rem 1rem',
                    background: 'rgba(155, 89, 230, 0.06)',
                    border: '1px solid rgba(155, 89, 230, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1.5rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap',
                }}>
                    To set your passphrase hash, open DevTools console and run:<br />
                    <code style={{ color: 'var(--accent-bright)' }}>
                        crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourpass')).then(b =&gt; console.log(Array.from(new Uint8Array(b)).map(x =&gt; x.toString(16).padStart(2,'0')).join('')))
                    </code>
                </div>

                <form onSubmit={handle_login}>
                    <div className="form-group">
                        <label className="form-label">Passphrase</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={show_pass ? 'text' : 'password'}
                                className="form-input"
                                placeholder="Enter admin passphrase"
                                value={passphrase}
                                onChange={e => set_passphrase(e.target.value)}
                                required
                                autoComplete="current-password"
                                style={{ paddingRight: '2.5rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => set_show_pass(!show_pass)}
                                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                                {show_pass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">GitHub PAT</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={show_pat ? 'text' : 'password'}
                                className="form-input"
                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                value={pat}
                                onChange={e => set_pat(e.target.value)}
                                required
                                autoComplete="off"
                                style={{ paddingRight: '2.5rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => set_show_pat(!show_pat)}
                                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                                {show_pat ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <p className="form-hint">
                            Fine-grained PAT with <strong>Contents: Read and Write</strong> on Schryzon/Schryzon
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <input
                            type="checkbox"
                            id="remember_me"
                            checked={remember_me}
                            onChange={e => set_remember_me(e.target.checked)}
                            style={{ accentColor: 'var(--accent-primary)' }}
                        />
                        <label htmlFor="remember_me" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            Remember PAT on this device (localStorage)
                        </label>
                    </div>

                    {error && <p className="form-error">{error}</p>}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                        disabled={loading}
                    >
                        <Key size={16} />
                        {loading ? 'Verifying...' : 'Unlock Admin'}
                    </button>
                </form>
            </div>
        </div>
    )
}
