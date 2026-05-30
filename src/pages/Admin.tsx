import { useState } from 'react'
import { Save, LogOut, User, Code2, FolderGit2, Briefcase, Trophy, Award, Target, Sparkles, BookOpen, AtSign } from 'lucide-react'
import type { SiteContent } from '../types/content'
import AdminLogin from '../admin/Login'
import content_data from '../data/content.json'

const SESSION_KEY = 'schryzon_admin_auth'
const PAT_KEY = 'schryzon_admin_pat'

type Section =
    | 'hero'
    | 'about'
    | 'skills'
    | 'projects'
    | 'experience'
    | 'competitions'
    | 'certifications'
    | 'target_roles'
    | 'vision'
    | 'blog'
    | 'social'

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'hero', label: 'Hero', icon: <User size={15} /> },
    { id: 'about', label: 'About', icon: <Code2 size={15} /> },
    { id: 'skills', label: 'Skills', icon: <Code2 size={15} /> },
    { id: 'projects', label: 'Projects', icon: <FolderGit2 size={15} /> },
    { id: 'experience', label: 'Experience', icon: <Briefcase size={15} /> },
    { id: 'competitions', label: 'Competitions', icon: <Trophy size={15} /> },
    { id: 'certifications', label: 'Certifications', icon: <Award size={15} /> },
    { id: 'target_roles', label: 'Target Roles', icon: <Target size={15} /> },
    { id: 'vision', label: 'Vision', icon: <Sparkles size={15} /> },
    { id: 'blog', label: 'Blog', icon: <BookOpen size={15} /> },
    { id: 'social', label: 'Social', icon: <AtSign size={15} /> },
]

const OWNER = 'Schryzon'
const REPO = 'Schryzon'
const BRANCH = 'master'
const FILE_PATH = 'src/data/content.json'

async function push_content(pat: string, content: SiteContent): Promise<void> {
    // Get current file SHA
    const info_res = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
        { headers: { Authorization: `Bearer ${pat}`, Accept: 'application/vnd.github+json' } }
    )
    if (!info_res.ok) throw new Error(`Failed to fetch file info: ${info_res.statusText}`)
    const info = await info_res.json()

    const json_string = JSON.stringify(content, null, 4)
    const b64 = btoa(unescape(encodeURIComponent(json_string)))

    const put_res = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
        {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${pat}`,
                Accept: 'application/vnd.github+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'chore: update portfolio content via admin panel',
                content: b64,
                sha: info.sha,
                branch: BRANCH,
            }),
        }
    )
    if (!put_res.ok) {
        const err = await put_res.json()
        throw new Error(err.message || 'GitHub API write failed')
    }
}

export default function Admin() {
    const [pat, set_pat] = useState<string | null>(null)
    const [content, set_content] = useState<SiteContent>(content_data as SiteContent)
    const [active, set_active] = useState<Section>('hero')
    const [save_status, set_save_status] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
    const [save_message, set_save_message] = useState('')

    const handle_login = (token: string) => set_pat(token)

    const handle_logout = () => {
        sessionStorage.removeItem(SESSION_KEY)
        sessionStorage.removeItem(PAT_KEY)
        localStorage.removeItem(PAT_KEY)
        set_pat(null)
    }

    const handle_save = async () => {
        if (!pat) return
        set_save_status('saving')
        set_save_message('Pushing to GitHub...')
        try {
            await push_content(pat, content)
            set_save_status('success')
            set_save_message('Saved. Deploy will complete in ~30s.')
            setTimeout(() => set_save_status('idle'), 5000)
        } catch (err: any) {
            set_save_status('error')
            set_save_message(err.message || 'Unknown error')
        }
    }

    const update = (path: string[], value: unknown) => {
        set_content(prev => {
            const next = structuredClone(prev) as unknown as Record<string, unknown>
            let cur = next
            for (let i = 0; i < path.length - 1; i++) {
                cur = (cur as Record<string, unknown>)[path[i]] as Record<string, unknown>
            }
            (cur as Record<string, unknown>)[path[path.length - 1]] = value
            return next as unknown as SiteContent
        })
    }

    if (!pat) {
        return (
            <div className="admin-page">
                <AdminLogin on_success={handle_login} />
            </div>
        )
    }

    return (
        <div className="admin-page">
            <div className="admin-layout">
                <aside className="admin-sidebar">
                    <div className="admin-sidebar-top">
                        <div className="admin-sidebar-header">
                            <div className="admin-sidebar-title">// admin panel</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                                schryzon.github.io
                            </div>
                        </div>
                        <div className="admin-sidebar-logout-wrapper">
                            <button className="admin-logout-btn" onClick={handle_logout}>
                                <LogOut size={12} className="admin-logout-icon" />
                                Logout
                            </button>
                        </div>
                    </div>
                    <ul className="admin-nav">
                        {NAV_ITEMS.map(item => (
                            <li
                                key={item.id}
                                className={`admin-nav-item ${active === item.id ? 'active' : ''}`}
                                onClick={() => set_active(item.id)}
                            >
                                {item.icon}
                                {item.label}
                            </li>
                        ))}
                    </ul>
                </aside>

                <div className="admin-content-wrapper">
                    <div className="admin-main">
                        {active === 'hero' && <HeroEditor content={content} update={update} />}
                        {active === 'about' && <AboutEditor content={content} update={update} />}
                        {active === 'projects' && <ProjectsEditor content={content} update={update} />}
                        {active === 'experience' && <ExperienceEditor content={content} update={update} />}
                        {active === 'competitions' && <CompetitionsEditor content={content} update={update} />}
                        {active === 'certifications' && <CertsEditor content={content} update={update} />}
                        {active === 'target_roles' && <RolesEditor content={content} update={update} />}
                        {active === 'vision' && <VisionEditor content={content} update={update} />}
                        {active === 'blog' && <BlogEditor content={content} update={update} />}
                        {active === 'social' && <SocialEditor content={content} update={update} />}
                        {active === 'skills' && <SkillsInfo />}
                    </div>

                    <div className="admin-save-bar">
                        <span className={`save-status ${save_status}`}>
                            {save_status === 'idle' && 'Unsaved changes will be lost on refresh.'}
                            {save_status === 'saving' && save_message}
                            {save_status === 'success' && save_message}
                            {save_status === 'error' && `Error: ${save_message}`}
                        </span>
                        <button
                            className="btn btn-primary"
                            onClick={handle_save}
                            disabled={save_status === 'saving'}
                        >
                            <Save size={15} />
                            {save_status === 'saving' ? 'Saving...' : 'Save & Deploy'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Inline editors ──────────────────────────────────────────────────────────

type EditorProps = {
    content: SiteContent
    update: (path: string[], value: unknown) => void
}

function Field({ label, value, onChange, hint, multiline }: {
    label: string
    value: string | number
    onChange: (v: string) => void
    hint?: string
    multiline?: boolean
}) {
    return (
        <div className="form-group">
            <label className="form-label">{label}</label>
            {multiline ? (
                <textarea className="form-textarea" value={value} onChange={e => onChange(e.target.value)} />
            ) : (
                <input className="form-input" type="text" value={value} onChange={e => onChange(e.target.value)} />
            )}
            {hint && <p className="form-hint">{hint}</p>}
        </div>
    )
}

function HeroEditor({ content, update }: EditorProps) {
    const h = content.hero
    return (
        <div>
            <div className="admin-section-title">Hero</div>
            <div className="admin-section-desc">// name, handle, taglines, location, avatar</div>
            <div className="admin-form">
                <Field label="Full Name" value={h.name} onChange={v => update(['hero', 'name'], v)} />
                <Field label="Handle" value={h.handle} onChange={v => update(['hero', 'handle'], v)} />
                <Field label="Avatar URL" value={h.avatar_url} onChange={v => update(['hero', 'avatar_url'], v)} hint="Direct image URL (e.g., GitHub avatar)" />
                <Field label="Location" value={h.location} onChange={v => update(['hero', 'location'], v)} />
                <div className="form-group">
                    <label className="form-label">Open to Work</label>
                    <select
                        className="form-input"
                        value={h.open_to_work ? 'true' : 'false'}
                        onChange={e => update(['hero', 'open_to_work'], e.target.value === 'true')}
                    >
                        <option value="true">Yes - show badge</option>
                        <option value="false">No - hide badge</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Taglines (typed animation)</label>
                    {h.taglines.map((t, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                            <input
                                className="form-input"
                                type="text"
                                value={t}
                                onChange={e => {
                                    const next = [...h.taglines]
                                    next[i] = e.target.value
                                    update(['hero', 'taglines'], next)
                                }}
                                style={{ flex: 1 }}
                            />
                            <button
                                className="btn-delete"
                                onClick={() => update(['hero', 'taglines'], h.taglines.filter((_, j) => j !== i))}
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    <button
                        className="btn-add"
                        onClick={() => update(['hero', 'taglines'], [...h.taglines, ''])}
                    >
                        + Add tagline
                    </button>
                </div>
            </div>
        </div>
    )
}

function AboutEditor({ content, update }: EditorProps) {
    const a = content.about
    return (
        <div>
            <div className="admin-section-title">About</div>
            <div className="admin-section-desc">// bio, quote, fun facts</div>
            <div className="admin-form">
                <div className="form-group">
                    <label className="form-label">Bio Paragraphs</label>
                    {a.bio.map((p, i) => (
                        <div key={i} style={{ marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.25rem' }}>
                                <button className="btn-delete" onClick={() => update(['about', 'bio'], a.bio.filter((_, j) => j !== i))}>Remove</button>
                            </div>
                            <textarea className="form-textarea" value={p} onChange={e => {
                                const next = [...a.bio]
                                next[i] = e.target.value
                                update(['about', 'bio'], next)
                            }} />
                        </div>
                    ))}
                    <button className="btn-add" onClick={() => update(['about', 'bio'], [...a.bio, ''])}>+ Add paragraph</button>
                </div>
                <Field label="Quote" value={a.quote} onChange={v => update(['about', 'quote'], v)} />
                <Field label="Quote Author" value={a.quote_author} onChange={v => update(['about', 'quote_author'], v)} />
                <Field label="Years of Experience" value={a.years_experience} onChange={v => update(['about', 'years_experience'], parseInt(v) || 0)} />
                <div className="form-group">
                    <label className="form-label">Fun Facts</label>
                    {a.fun_facts.map((f, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input className="form-input" type="text" value={f} style={{ flex: 1 }} onChange={e => {
                                const next = [...a.fun_facts]
                                next[i] = e.target.value
                                update(['about', 'fun_facts'], next)
                            }} />
                            <button className="btn-delete" onClick={() => update(['about', 'fun_facts'], a.fun_facts.filter((_, j) => j !== i))}>Remove</button>
                        </div>
                    ))}
                    <button className="btn-add" onClick={() => update(['about', 'fun_facts'], [...a.fun_facts, ''])}>+ Add fact</button>
                </div>
            </div>
        </div>
    )
}

function ProjectsEditor({ content, update }: EditorProps) {
    const projects = content.featured_projects
    return (
        <div>
            <div className="admin-section-title">Featured Projects</div>
            <div className="admin-section-desc">// controls which repos appear and their description overrides</div>
            <div className="admin-form">
                {projects.map((p, i) => (
                    <div key={i} className="admin-array-item">
                        <div className="admin-array-item-header">
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-bright)' }}>{p.repo}</span>
                            <button className="btn-delete" onClick={() => update(['featured_projects'], projects.filter((_, j) => j !== i))}>Remove</button>
                        </div>
                        <Field label="Repo Name" value={p.repo} onChange={v => { const n = [...projects]; n[i] = { ...n[i], repo: v }; update(['featured_projects'], n) }} />
                        <Field label="Description Override" value={p.description_override || ''} multiline onChange={v => { const n = [...projects]; n[i] = { ...n[i], description_override: v }; update(['featured_projects'], n) }} hint="Leave blank to use GitHub description" />
                        <div className="form-group">
                            <label className="form-label">Tags (comma separated)</label>
                            <input className="form-input" type="text" value={p.tags.join(', ')} onChange={e => { const n = [...projects]; n[i] = { ...n[i], tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }; update(['featured_projects'], n) }} />
                        </div>
                    </div>
                ))}
                <button className="btn-add" onClick={() => update(['featured_projects'], [...projects, { repo: '', description_override: '', tags: [], featured: true }])}>
                    + Add project
                </button>
            </div>
        </div>
    )
}

function ExperienceEditor({ content, update }: EditorProps) {
    const exp = content.experience
    const edu = content.education
    return (
        <div>
            <div className="admin-section-title">Experience & Education</div>
            <div className="admin-section-desc">// work experience and education</div>
            <div className="admin-form">
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>EXPERIENCE</div>
                {exp.map((e, i) => (
                    <div key={i} className="admin-array-item">
                        <div className="admin-array-item-header">
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{e.role} @ {e.org}</span>
                            <button className="btn-delete" onClick={() => update(['experience'], exp.filter((_, j) => j !== i))}>Remove</button>
                        </div>
                        <Field label="Role" value={e.role} onChange={v => { const n = [...exp]; n[i] = { ...n[i], role: v }; update(['experience'], n) }} />
                        <Field label="Organization" value={e.org} onChange={v => { const n = [...exp]; n[i] = { ...n[i], org: v }; update(['experience'], n) }} />
                        <Field label="Period" value={e.period} onChange={v => { const n = [...exp]; n[i] = { ...n[i], period: v }; update(['experience'], n) }} />
                        <Field label="Description" value={e.description} multiline onChange={v => { const n = [...exp]; n[i] = { ...n[i], description: v }; update(['experience'], n) }} />
                    </div>
                ))}
                <button className="btn-add" onClick={() => update(['experience'], [...exp, { org: '', role: '', period: '', description: '', type: 'work' as const }])}>+ Add experience</button>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2rem 0 1rem' }}>EDUCATION</div>
                {edu.map((ed, i) => (
                    <div key={i} className="admin-array-item">
                        <div className="admin-array-item-header">
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ed.degree} @ {ed.university}</span>
                            <button className="btn-delete" onClick={() => update(['education'], edu.filter((_, j) => j !== i))}>Remove</button>
                        </div>
                        <Field label="University" value={ed.university} onChange={v => { const n = [...edu]; n[i] = { ...n[i], university: v }; update(['education'], n) }} />
                        <Field label="Degree" value={ed.degree} onChange={v => { const n = [...edu]; n[i] = { ...n[i], degree: v }; update(['education'], n) }} />
                        <Field label="Field of Study" value={ed.field} onChange={v => { const n = [...edu]; n[i] = { ...n[i], field: v }; update(['education'], n) }} />
                        <Field label="Period" value={ed.period} onChange={v => { const n = [...edu]; n[i] = { ...n[i], period: v }; update(['education'], n) }} />
                        <Field label="GPA" value={ed.gpa || ''} onChange={v => { const n = [...edu]; n[i] = { ...n[i], gpa: v }; update(['education'], n) }} />
                    </div>
                ))}
                <button className="btn-add" onClick={() => update(['education'], [...edu, { university: '', degree: '', field: '', period: '', gpa: '' }])}>+ Add education</button>
            </div>
        </div>
    )
}

function CompetitionsEditor({ content, update }: EditorProps) {
    const comps = content.competitions
    return (
        <div>
            <div className="admin-section-title">Competitions</div>
            <div className="admin-section-desc">// IT competitions you have participated in</div>
            <div className="admin-form">
                {comps.map((c, i) => (
                    <div key={i} className="admin-array-item">
                        <div className="admin-array-item-header">
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.name}</span>
                            <button className="btn-delete" onClick={() => update(['competitions'], comps.filter((_, j) => j !== i))}>Remove</button>
                        </div>
                        <Field label="Competition Name" value={c.name} onChange={v => { const n = [...comps]; n[i] = { ...n[i], name: v }; update(['competitions'], n) }} />
                        <Field label="Year" value={c.year} onChange={v => { const n = [...comps]; n[i] = { ...n[i], year: parseInt(v) || c.year }; update(['competitions'], n) }} />
                        <Field label="Result" value={c.result || ''} onChange={v => { const n = [...comps]; n[i] = { ...n[i], result: v }; update(['competitions'], n) }} />
                        <Field label="Organizer" value={c.organizer || ''} onChange={v => { const n = [...comps]; n[i] = { ...n[i], organizer: v }; update(['competitions'], n) }} />
                    </div>
                ))}
                <button className="btn-add" onClick={() => update(['competitions'], [...comps, { name: '', year: new Date().getFullYear(), result: '', organizer: '' }])}>+ Add competition</button>
            </div>
        </div>
    )
}

function CertsEditor({ content, update }: EditorProps) {
    const certs = content.certifications
    return (
        <div>
            <div className="admin-section-title">Certifications</div>
            <div className="admin-section-desc">// professional certifications and courses</div>
            <div className="admin-form">
                {certs.map((c, i) => (
                    <div key={i} className="admin-array-item">
                        <div className="admin-array-item-header">
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.name}</span>
                            <button className="btn-delete" onClick={() => update(['certifications'], certs.filter((_, j) => j !== i))}>Remove</button>
                        </div>
                        <Field label="Certification Name" value={c.name} onChange={v => { const n = [...certs]; n[i] = { ...n[i], name: v }; update(['certifications'], n) }} />
                        <Field label="Issuer" value={c.issuer} onChange={v => { const n = [...certs]; n[i] = { ...n[i], issuer: v }; update(['certifications'], n) }} />
                        <Field label="Date" value={c.date} onChange={v => { const n = [...certs]; n[i] = { ...n[i], date: v }; update(['certifications'], n) }} />
                        <Field label="Certificate URL" value={c.url || ''} onChange={v => { const n = [...certs]; n[i] = { ...n[i], url: v }; update(['certifications'], n) }} />
                    </div>
                ))}
                <button className="btn-add" onClick={() => update(['certifications'], [...certs, { name: '', issuer: '', date: '', url: '' }])}>+ Add certification</button>
            </div>
        </div>
    )
}

function RolesEditor({ content, update }: EditorProps) {
    const roles = content.target_roles
    return (
        <div>
            <div className="admin-section-title">Target Roles</div>
            <div className="admin-section-desc">// roles and positions you are open to</div>
            <div className="admin-form">
                {roles.map((r, i) => (
                    <div key={i} className="admin-array-item">
                        <div className="admin-array-item-header">
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.title}</span>
                            <button className="btn-delete" onClick={() => update(['target_roles'], roles.filter((_, j) => j !== i))}>Remove</button>
                        </div>
                        <Field label="Role Title" value={r.title} onChange={v => { const n = [...roles]; n[i] = { ...n[i], title: v }; update(['target_roles'], n) }} />
                        <Field label="Description" value={r.description} multiline onChange={v => { const n = [...roles]; n[i] = { ...n[i], description: v }; update(['target_roles'], n) }} />
                    </div>
                ))}
                <button className="btn-add" onClick={() => update(['target_roles'], [...roles, { title: '', description: '' }])}>+ Add role</button>
            </div>
        </div>
    )
}

function VisionEditor({ content, update }: EditorProps) {
    const v = content.future_vision
    return (
        <div>
            <div className="admin-section-title">Future Vision</div>
            <div className="admin-section-desc">// personal statement and goals</div>
            <div className="admin-form">
                <Field label="Vision Statement" value={v.statement} multiline onChange={val => update(['future_vision', 'statement'], val)} />
                <div className="form-group">
                    <label className="form-label">Goals</label>
                    {v.goals.map((g, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input className="form-input" type="text" value={g} style={{ flex: 1 }} onChange={e => {
                                const n = [...v.goals]; n[i] = e.target.value; update(['future_vision', 'goals'], n)
                            }} />
                            <button className="btn-delete" onClick={() => update(['future_vision', 'goals'], v.goals.filter((_, j) => j !== i))}>Remove</button>
                        </div>
                    ))}
                    <button className="btn-add" onClick={() => update(['future_vision', 'goals'], [...v.goals, ''])}>+ Add goal</button>
                </div>
            </div>
        </div>
    )
}

function BlogEditor({ content, update }: EditorProps) {
    const posts = content.blog_posts
    return (
        <div>
            <div className="admin-section-title">Blog Posts</div>
            <div className="admin-section-desc">// writing section - hidden on site when empty</div>
            <div className="admin-form">
                {posts.map((p, i) => (
                    <div key={i} className="admin-array-item">
                        <div className="admin-array-item-header">
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{p.title || '(untitled)'}</span>
                            <button className="btn-delete" onClick={() => update(['blog_posts'], posts.filter((_, j) => j !== i))}>Remove</button>
                        </div>
                        <Field label="ID (slug)" value={p.id} onChange={v => { const n = [...posts]; n[i] = { ...n[i], id: v }; update(['blog_posts'], n) }} hint="e.g., my-first-post" />
                        <Field label="Title" value={p.title} onChange={v => { const n = [...posts]; n[i] = { ...n[i], title: v }; update(['blog_posts'], n) }} />
                        <Field label="Date (YYYY-MM-DD)" value={p.date} onChange={v => { const n = [...posts]; n[i] = { ...n[i], date: v }; update(['blog_posts'], n) }} />
                        <Field label="Tags (comma separated)" value={p.tags.join(', ')} onChange={v => { const n = [...posts]; n[i] = { ...n[i], tags: v.split(',').map(t => t.trim()).filter(Boolean) }; update(['blog_posts'], n) }} />
                        <Field label="Excerpt" value={p.excerpt} multiline onChange={v => { const n = [...posts]; n[i] = { ...n[i], excerpt: v }; update(['blog_posts'], n) }} />
                        <Field label="Content (Markdown)" value={p.content} multiline onChange={v => { const n = [...posts]; n[i] = { ...n[i], content: v }; update(['blog_posts'], n) }} />
                    </div>
                ))}
                <button className="btn-add" onClick={() => update(['blog_posts'], [...posts, {
                    id: `post-${Date.now()}`,
                    title: '',
                    date: new Date().toISOString().split('T')[0],
                    tags: [],
                    excerpt: '',
                    content: '',
                }])}>
                    + Write new post
                </button>
            </div>
        </div>
    )
}

function SocialEditor({ content, update }: EditorProps) {
    const links = content.social_links
    return (
        <div>
            <div className="admin-section-title">Social Links</div>
            <div className="admin-section-desc">// contact section social cards</div>
            <div className="admin-form">
                {links.map((l, i) => (
                    <div key={i} className="admin-array-item">
                        <div className="admin-array-item-header">
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{l.platform}</span>
                            <button className="btn-delete" onClick={() => update(['social_links'], links.filter((_, j) => j !== i))}>Remove</button>
                        </div>
                        <Field label="Platform" value={l.platform} onChange={v => { const n = [...links]; n[i] = { ...n[i], platform: v }; update(['social_links'], n) }} />
                        <Field label="URL" value={l.url} onChange={v => { const n = [...links]; n[i] = { ...n[i], url: v }; update(['social_links'], n) }} />
                        <Field label="Display Label" value={l.label} onChange={v => { const n = [...links]; n[i] = { ...n[i], label: v }; update(['social_links'], n) }} />
                    </div>
                ))}
                <button className="btn-add" onClick={() => update(['social_links'], [...links, { platform: '', url: '', label: '' }])}>+ Add link</button>
            </div>
        </div>
    )
}

function SkillsInfo() {
    return (
        <div>
            <div className="admin-section-title">Skills</div>
            <div className="admin-section-desc">// edit skills directly in src/data/content.json</div>
            <div style={{ padding: '1.5rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                Skills use devicon CDN icon URLs. Edit <code>src/data/content.json</code> under the <code>skills</code> key directly.
                Each skill needs a <code>name</code> and <code>icon_url</code> from <a href="https://devicon.dev" target="_blank" rel="noopener noreferrer">devicon.dev</a>.
            </div>
        </div>
    )
}
