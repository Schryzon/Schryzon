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
    const [error, set_error] = useState(false)

    useEffect(() => {
        const featured_names = featured.map(f => f.repo)

        Promise.all(
            featured_names.map(name =>
                fetch(`https://api.github.com/repos/Schryzon/${name}`, {
                    headers: { Accept: 'application/vnd.github+json' },
                })
                    .then(r => (r.ok ? r.json() : null))
                    .catch(() => null)
            )
        )
            .then(results => {
                set_repos(results.filter(Boolean) as GitHubRepo[])
                set_loading(false)
            })
            .catch(() => {
                set_error(true)
                set_loading(false)
            })
    }, [featured])

    const get_description = (repo_name: string, api_desc: string | null) => {
        const override = featured.find(f => f.repo === repo_name)?.description_override
        return override || api_desc || 'No description available.'
    }

    const get_tags = (repo_name: string, lang: string | null, topics: string[]) => {
        const override_tags = featured.find(f => f.repo === repo_name)?.tags || []
        return override_tags.length > 0 ? override_tags : [...topics, lang].filter(Boolean) as string[]
    }

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

                {error && (
                    <div className="projects-error">
                        <span>Could not reach GitHub API. Try refreshing.</span>
                    </div>
                )}

                {!loading && !error && (
                    <div className="projects-grid">
                        {repos.map((repo, i) => (
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
                                    </div>
                                </article>
                            </ScrollReveal>
                        ))}
                    </div>
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
