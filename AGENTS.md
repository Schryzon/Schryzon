# AGENTS.md - System Architecture and Operations Manual

## 1. Overview

This repository (`Schryzon/Schryzon`) serves a dual purpose:
1. Special GitHub Profile Repository: Contains the root `README.md` and static SVG asset cards in `profile/` rendered on the GitHub user profile (`https://github.com/Schryzon`).
2. Portfolio Web Application: Source code for the interactive portfolio deployed to GitHub Pages (`https://schryzon.github.io`). Built with React, TypeScript, and Vite, styled using bespoke Vanilla CSS without TailwindCSS dependencies.

---

## 2. Directory Structure

```
Schryzon/
|-- .github/
|   `-- workflows/
|       |-- deploy.yml           # Deploys Vite portfolio to GitHub Pages
|       `-- grs.yml              # Scheduled card updater workflow (runs every 4 hours)
|-- linkedin-data/               # Raw HTML snapshots and extracted profile JSON dumps
|   |-- linkedin-*.html          # Raw LinkedIn DOM snapshots
|   `-- profile_offline.json     # Parsed structured JSON (certs, education, projects)
|-- profile/                     # Static SVG assets embedded in root README.md
|   |-- pin-*.svg                # Pinned repository showcase cards (yomu, rvdia, etc.)
|   |-- stats.svg                # Account-wide GitHub statistics card
|   |-- streak.svg               # GitHub streak statistics card
|   `-- top-langs.svg            # Account-wide most used languages card
|-- scripts/                     # Operational Python scripts (run with python312)
|   |-- fetch_linkedin.py        # LinkedIn profile extractor (Voyager API + offline parser)
|   `-- generate_cards.py        # Card validation and repository health checker
|-- scratch/                     # Development and data transformation scripts
|-- src/                         # Portfolio application source code (React, TSX, CSS)
|-- README.md                    # GitHub Profile README
`-- package.json                 # Web app configuration and dependencies
```

---

## 3. GitHub Profile Cards Pipeline

### Architecture
The profile README displays SVG cards from the local `./profile/` directory. Rather than relying on external web APIs that suffer from downtime or rate-limits, cards are maintained as static SVGs committed to the repository.

### Card Generation Workflow (`.github/workflows/grs.yml`)
- Trigger: Runs on scheduled cron (`0 */4 * * *`) and on push to `master`.
- Generator Action: `stats-organization/github-readme-stats-action@v2`.
- Streak Generator: `muhammad-fiaz/github-readme-streak-stats@v1.0.1`.
- Token Configuration: Uses `token: ${{ secrets.GH_PAT || secrets.PAT || secrets.GITHUB_TOKEN }}`.
- Failure Prevention:
  - Every card step has `fail_on_error: true`.
  - The commit step runs an automated pre-commit safeguard:
    ```bash
    if grep -rliE "(Something went wrong|Resource not accessible|User Repository Not found)" profile/*.svg; then
        echo "Broken card detected in profile/*.svg! Aborting commit to prevent corrupting profile cards."
        exit 1
    fi
    ```

### GitHub API Token Requirements
- Default `GITHUB_TOKEN` is an installation token scoped strictly to `Schryzon/Schryzon`. It lacks privileges to query external repositories (`yomu`, `RVDiA`, `NetTracer`, `3Dex`, `XFFS`, `mpyCUDA`) or user-level account stats across GitHub via GraphQL.
- To enable unattended updates in GitHub Actions, create a Personal Access Token (Classic) with `read:user` and `repo` scopes, and add it to repository secrets as `GH_PAT`.
- In the absence of `GH_PAT`, the safeguard prevents the workflow from overwriting existing valid cards with error cards.

### Local Verification and Maintenance
Use `scripts/generate_cards.py` to validate all SVGs and test API access locally using the authenticated GitHub CLI (`gh`):
```powershell
python312 scripts/generate_cards.py
```

---

## 4. LinkedIn Profile Fetcher Pipeline

### Script: `scripts/fetch_linkedin.py`
The LinkedIn fetcher extracts complete profile data, supporting both live authenticated Voyager API queries and offline parsing of saved HTML files.

### Execution Modes

1. Offline Parsing Mode (No credentials required):
   Parses all saved HTML files in `linkedin-data/` to extract certifications, education, and projects:
   ```powershell
   python312 scripts/fetch_linkedin.py --offline
   ```
   Outputs structured data to `linkedin-data/profile_offline.json`.

2. Live Authenticated Voyager API Mode:
   Fetches full JSON from LinkedIn internal endpoints (`profileView`, `positionGroups`, `certifications`, `educations`, `skills`, `projects`):
   ```powershell
   python312 scripts/fetch_linkedin.py --cookie "<LI_AT_SESSION_COOKIE>" --username "schryzon"
   ```
   Alternatively, place the cookie in `.env` as `LINKEDIN_LI_AT=<cookie>` and run:
   ```powershell
   python312 scripts/fetch_linkedin.py --username "schryzon"
   ```
   Outputs:
   - `linkedin-data/profile_raw.json`: Complete raw API response dump.
   - `linkedin-data/profile_normalized.json`: Clean normalized dictionary.

---

## 5. Coding and Operational Standards

- Interpreter: Always use `python312` for Python executions.
- Shell: PowerShell 7 on Windows.
- GitHub CLI: `gh` is installed and authenticated as `Schryzon`.
- Naming Conventions:
  - Classes: `Title_Snake_Case`
  - Functions and Variables: `tiny_snake_case`
  - Constants and Enums: `UPPER_SNAKE_CASE`
- Logic Flow: Prefer flat control flow, early returns, minimal indentation, and optimistic error handling.
- Documentation Integrity: Documentation must remain strictly free of emojis.
