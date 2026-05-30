export default function Footer() {
    const year = new Date().getFullYear()

    return (
        <footer className="footer">
            <div className="footer-content">
                <p className="footer-name">I Nyoman Widiyasa Jayananda &mdash; Schryzon</p>
                <p className="footer-copy">
                    &copy; {year} &middot; Built with Vite + React + TypeScript &middot; Deployed on GitHub Pages
                </p>
            </div>
        </footer>
    )
}
