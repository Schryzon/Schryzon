import { useEffect, useState } from 'react'
import { Star, GitFork, ExternalLink } from 'lucide-react'
import { SiGithub } from '@icons-pack/react-simple-icons'
import type { FeaturedProject } from '../../types/content'
import ScrollReveal from '../ui/ScrollReveal'

interface ProjectsProps {
    featured: FeaturedProject[]
}

interface GitHubRepo {
    name: string
    description: string | null
    html_url: string
    homepage: string | null
    stargazers_count: number
    forks_count: number
    language: string | null
    topics: string[]
    is_fallback?: boolean
}

const LANG_COLORS: Record<string, string> = {
    Python: '#3572A5',
    TypeScript: '#3178C6',
    JavaScript: '#F1E05A',
    'C++': '#F34B7D',
    Java: '#B07219',
    Rust: '#DEA584',
    Go: '#00ADD8',
    HTML: '#E34C26',
    CSS: '#563D7C',
    Shell: '#89E051',
}

export default function Projects({ featured }: ProjectsProps) {
    const [repos, set_repos] = useState<GitHubRepo[]>([])
    const [loading, set_loading] = useState(true)

    useEffect(() => {
        Promise.all(
            featured.map(f =>
                fetch(`https://api.github.com/repos/Schryzon/${f.repo}`, {
                    headers: { Accept: 'application/vnd.github+json' },
                })
                    .then(r => (r.ok ? r.json() : null))
                    .catch(() => null)
                    .then(data => {
                        if (data) {
                            return {
                                ...data,
                                is_fallback: false
                            } as GitHubRepo
                        } else {
                            // construct fallback object from local data if api rate limited or offline
                            return {
                                name: f.repo,
                                description: f.description_override || null,
                                html_url: `https://github.com/Schryzon/${f.repo}`,
                                homepage: null,
                                stargazers_count: 0,
                                forks_count: 0,
                                language: f.tags[0] || null,
                                topics: f.tags,
                                is_fallback: true
                            } as GitHubRepo
                        }
                    })
            )
        )
            .then(results => {
                set_repos(results as GitHubRepo[])
                set_loading(false)
            })
            .catch(() => {
                // compile static fallbacks for all repositories if promise fails
                const fallbacks = featured.map(f => ({
                    name: f.repo,
                    description: f.description_override || null,
                    html_url: `https://github.com/Schryzon/${f.repo}`,
                    homepage: null,
                    stargazers_count: 0,
                    forks_count: 0,
                    language: f.tags[0] || null,
                    topics: f.tags,
                    is_fallback: true
                }))
                set_repos(fallbacks)
                set_loading(false)
            })
    }, [featured])

    const [search_query, set_search_query] = useState('')
    const [selected_tag, set_selected_tag] = useState<string | null>(null)

    const get_description = (repo_name: string, api_desc: string | null) => {
        const override = featured.find(f => f.repo === repo_name)?.description_override
        return override || api_desc || 'No description available.'
    }

    const get_tags = (repo_name: string, lang: string | null, topics: string[]) => {
        const override_tags = featured.find(f => f.repo === repo_name)?.tags || []
        return override_tags.length > 0 ? override_tags : [...topics, lang].filter(Boolean) as string[]
    }

    // Extract top distinct tags to filter by
    const all_tags = Array.from(
        new Set(
            repos.flatMap(repo => get_tags(repo.name, repo.language, repo.topics))
        )
    ).slice(0, 9)

    const filtered_repos = repos.filter(repo => {
        const query = search_query.toLowerCase().trim()
        const tags = get_tags(repo.name, repo.language, repo.topics)
        const tag_matches = !selected_tag || tags.includes(selected_tag)

        if (!query) return tag_matches

        // Fuzzy match: check if characters of search query appear in sequence
        const fuzzy_match = (text: string, search: string) => {
            let search_idx = 0
            const text_lower = text.toLowerCase()
            for (let i = 0; i < text_lower.length && search_idx < search.length; i++) {
                if (text_lower[i] === search[search_idx]) {
                    search_idx++
                }
            }
            return search_idx === search.length
        }

        const name = repo.name.toLowerCase()
        const desc = get_description(repo.name, repo.description).toLowerCase()
        const tag_list = tags.map(t => t.toLowerCase())

        const is_direct_match = name.includes(query) || desc.includes(query) || tag_list.some(t => t.includes(query))
        const is_fuzzy_match = fuzzy_match(name, query) || fuzzy_match(desc, query) || tag_list.some(t => fuzzy_match(t, query))

        return (is_direct_match || is_fuzzy_match) && tag_matches
    })

    return (
        <section className="section" id="projects">
            <div className="container">
                <ScrollReveal>
                    <h2 className="section-title">Projects</h2>
                    <p className="section-subtitle">Things I built, whether I was bored or assigned</p>
                </ScrollReveal>

                {loading && (
                    <div className="projects-loading">
                        <span>Fetching repos from GitHub API...</span>
                    </div>
                )}

                {!loading && (
                    <>
                        <ScrollReveal delay={0.05}>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                marginBottom: '2.5rem',
                                maxWidth: '600px',
                                margin: '0 auto 2.5rem'
                            }}>
                                <input
                                    type="text"
                                    placeholder="Search projects by name or description..."
                                    value={search_query}
                                    onChange={e => set_search_query(e.target.value)}
                                    className="form-input"
                                    style={{
                                        background: 'rgba(15, 15, 26, 0.6)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '0.7rem 1rem'
                                    }}
                                />
                                
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '0.4rem',
                                    justifyContent: 'center'
                                }}>
                                    <button
                                        onClick={() => set_selected_tag(null)}
                                        className="tag"
                                        style={{
                                            cursor: 'pointer',
                                            background: !selected_tag ? 'var(--accent-primary)' : 'rgba(155, 89, 230, 0.05)',
                                            color: !selected_tag ? 'white' : 'var(--accent-bright)',
                                            border: !selected_tag ? '1px solid var(--accent-primary)' : '1px solid rgba(155, 89, 230, 0.15)',
                                            transition: 'all 0.25s ease'
                                        }}
                                    >
                                        All
                                    </button>
                                    {all_tags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => set_selected_tag(tag === selected_tag ? null : tag)}
                                            className="tag"
                                            style={{
                                                cursor: 'pointer',
                                                background: tag === selected_tag ? 'var(--accent-primary)' : 'rgba(155, 89, 230, 0.05)',
                                                color: tag === selected_tag ? 'white' : 'var(--accent-bright)',
                                                border: tag === selected_tag ? '1px solid var(--accent-primary)' : '1px solid rgba(155, 89, 230, 0.15)',
                                                transition: 'all 0.25s ease'
                                            }}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </ScrollReveal>

                        {filtered_repos.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                No projects match your search criteria.
                            </div>
                        )}

                        {filtered_repos.length > 0 && (
                            <div className="projects-grid">
                                {filtered_repos.map((repo, i) => (
                                    <ScrollReveal key={repo.name} delay={i * 0.08}>
                                        <article className="glass-card project-card">
                                            <div className="project-header">
                                                <div className="project-name">{repo.name}</div>
                                                <div className="project-links">
                                                    <a
                                                        href={repo.html_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="project-link"
                                                        aria-label={`View ${repo.name} on GitHub`}
                                                    >
                                                        <SiGithub size={17} />
                                                    </a>
                                                    {repo.homepage && (
                                                        <a
                                                            href={repo.homepage}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="project-link"
                                                            aria-label={`Visit ${repo.name} live site`}
                                                        >
                                                            <ExternalLink size={17} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="project-description">
                                                {get_description(repo.name, repo.description)}
                                            </p>

                                            <div className="project-tags">
                                                {get_tags(repo.name, repo.language, repo.topics).slice(0, 5).map(tag => (
                                                    <span key={tag} className="tag">{tag}</span>
                                                ))}
                                            </div>

                                            <div className="project-meta">
                                                {repo.language && (
                                                    <div className="project-stat">
                                                        <span
                                                            className="project-lang-dot"
                                                            style={{ background: LANG_COLORS[repo.language] || '#888' }}
                                                        />
                                                        {repo.language}
                                                    </div>
                                                )}
                                                {!repo.is_fallback && (
                                                    <div className="project-stats">
                                                        <div className="project-stat">
                                                            <Star size={13} />
                                                            {repo.stargazers_count}
                                                        </div>
                                                        <div className="project-stat">
                                                            <GitFork size={13} />
                                                            {repo.forks_count}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </article>
                                    </ScrollReveal>
                                ))}
                            </div>
                        )}
                    </>
                )}

                <ScrollReveal delay={0.3}>
                    <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                        <a
                            href="https://github.com/Schryzon?tab=repositories"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline"
                        >
                            <SiGithub size={16} />
                            View all 28 repositories
                        </a>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    )
}
