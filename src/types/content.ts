export interface Hero {
    name: string;
    handle: string;
    taglines: string[];
    avatar_url: string;
    location: string;
    open_to_work: boolean;
}

export interface Language {
    name: string;
    proficiency: string;
}

export interface About {
    bio: string[];
    quote: string;
    quote_author: string;
    years_experience: number;
    fun_facts: string[];
    languages?: Language[];
}

export interface Skill {
    name: string;
    icon_url: string;
}

export interface SkillGroup {
    category: string;
    skills: Skill[];
}

export interface FeaturedProject {
    repo: string;
    description_override?: string;
    tags: string[];
    featured: boolean;
}

export interface Experience {
    org: string;
    role: string;
    period: string;
    description: string;
    type: "work" | "org";
}

export interface Education {
    university: string;
    degree: string;
    field: string;
    period: string;
    gpa?: string;
}

export interface Competition {
    name: string;
    year: number;
    result?: string;
    organizer?: string;
}

export interface Certification {
    name: string;
    issuer: string;
    date: string;
    url?: string;
}

export interface TargetRole {
    title: string;
    description: string;
}

export interface BlogPost {
    id: string;
    title: string;
    date: string;
    tags: string[];
    excerpt: string;
    content: string;
}

export interface SocialLink {
    platform: string;
    url: string;
    label: string;
}

export interface FutureVision {
    statement: string;
    goals: string[];
}

export interface SiteContent {
    hero: Hero;
    about: About;
    skills: SkillGroup[];
    featured_projects: FeaturedProject[];
    experience: Experience[];
    education: Education[];
    competitions: Competition[];
    certifications: Certification[];
    target_roles: TargetRole[];
    future_vision: FutureVision;
    blog_posts: BlogPost[];
    social_links: SocialLink[];
}
