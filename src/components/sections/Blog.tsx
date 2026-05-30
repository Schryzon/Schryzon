import type { BlogPost } from '../../types/content'
import ScrollReveal from '../ui/ScrollReveal'

interface BlogProps {
    data: BlogPost[]
}

export default function Blog({ data }: BlogProps) {
    // Hidden when no posts exist
    if (data.length === 0) return null

    return (
        <section className="section" id="blog">
            <div className="container">
                <ScrollReveal>
                    <h2 className="section-title">Writing</h2>
                    <p className="section-subtitle">Thoughts, notes, and occasional rants</p>
                </ScrollReveal>

                <div className="blog-grid">
                    {data.map((post, i) => (
                        <ScrollReveal key={post.id} delay={i * 0.08}>
                            <article className="glass-card blog-card">
                                <div className="blog-date">
                                    {new Date(post.date).toLocaleDateString('en-GB', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </div>
                                <h3 className="blog-title">{post.title}</h3>
                                <p className="blog-excerpt">{post.excerpt}</p>
                                <div className="blog-tags">
                                    {post.tags.map(tag => (
                                        <span key={tag} className="tag">{tag}</span>
                                    ))}
                                </div>
                            </article>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    )
}
