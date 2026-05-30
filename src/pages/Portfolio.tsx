import content_data from '../data/content.json'
import type { SiteContent } from '../types/content'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Hero from '../components/sections/Hero'
import About from '../components/sections/About'
import TechStack from '../components/sections/TechStack'
import Projects from '../components/sections/Projects'
import Experience from '../components/sections/Experience'
import Competitions from '../components/sections/Competitions'
import TargetRoles from '../components/sections/TargetRoles'
import FutureVision from '../components/sections/FutureVision'
import Blog from '../components/sections/Blog'
import Contact from '../components/sections/Contact'

// Premium interactive assets
import DevOpsTerminal from '../components/ui/DevOpsTerminal'
import ScrollToTop from '../components/ui/ScrollToTop'
import AccentCustomizer from '../components/ui/AccentCustomizer'

const content = content_data as SiteContent

export default function Portfolio() {
    return (
        <>
            <Navbar />
            <main>
                <Hero data={content.hero} />

                <div className="section-divider" />
                
                {/* Interactive DevOps Console Section */}
                <section className="section" id="terminal" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                    <div className="container">
                        <DevOpsTerminal />
                    </div>
                </section>

                <div className="section-divider" />
                <About data={content.about} />

                <div className="section-divider" />
                <TechStack data={content.skills} />

                <div className="section-divider" />
                <Projects featured={content.featured_projects} />

                <div className="section-divider" />
                <Experience
                    experience={content.experience}
                    education={content.education}
                    certifications={content.certifications}
                />

                <div className="section-divider" />
                <Competitions data={content.competitions} />

                <div className="section-divider" />
                <TargetRoles data={content.target_roles} />

                <div className="section-divider" />
                <FutureVision data={content.future_vision} />

                <Blog data={content.blog_posts} />

                <div className="section-divider" />
                <Contact data={content.social_links} />
            </main>
            <Footer />

            {/* Floating Premium Controls */}
            <AccentCustomizer />
            <ScrollToTop />
        </>
    )
}

