import os
import re
import sys
import subprocess
import requests

GITHUB_USERNAME = "Schryzon"
PROFILE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "profile")

PINNED_REPOS = [
    {"owner": "sal063", "repo": "AC6_recomp", "filename": "pin-ac6-recomp.svg", "show_owner": True},
    {"owner": "mlafeldt", "repo": "cb2util", "filename": "pin-cb2util.svg", "show_owner": True},
    {"owner": "Schryzon", "repo": "RVDiA", "filename": "pin-rvdia.svg", "show_owner": False},
    {"owner": "Schryzon", "repo": "NetTracer", "filename": "pin-nettracer.svg", "show_owner": False},
    {"owner": "Schryzon", "repo": "3Dex", "filename": "pin-3dex.svg", "show_owner": False},
    {"owner": "Schryzon", "repo": "pktforge", "filename": "pin-pktforge.svg", "show_owner": False},
]

ERROR_PATTERNS = [
    r"Something went wrong",
    r"Resource not accessible",
    r"User Repository Not found",
    r"Cannot read properties of undefined",
]


class Card_Validator:
    def __init__(self, target_dir: str):
        self.target_dir = target_dir

    def validate_file(self, filename: str) -> bool:
        file_path = os.path.join(self.target_dir, filename)
        if not os.path.exists(file_path):
            print(f"[MISSING] {filename}")
            return False

        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        for pattern in ERROR_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                print(f"[CORRUPTED] {filename} contains error signature: '{pattern}'")
                return False

        print(f"[VALID] {filename} ({len(content)} bytes)")
        return True

    def validate_all(self) -> bool:
        print(f"\n--- VALIDATING SVGS IN: {self.target_dir} ---")
        svg_files = [f for f in os.listdir(self.target_dir) if f.endswith(".svg")]
        if not svg_files:
            print("No SVG files found.")
            return False

        all_valid = True
        for svg in sorted(svg_files):
            if not self.validate_file(svg):
                all_valid = False
        return all_valid


def get_gh_token() -> str:
    token = os.getenv("GITHUB_TOKEN") or os.getenv("GH_PAT") or os.getenv("GH_TOKEN")
    if token:
        return token

    # Fallback to gh auth token CLI command
    try:
        res = subprocess.run(["gh", "auth", "token"], capture_output=True, text=True, check=True)
        return res.stdout.strip()
    except Exception as e:
        print(f"Warning: could not resolve token from gh CLI: {e}")
        return ""


import json
import argparse


class Card_Generator:
    def __init__(self, target_dir: str, token: str):
        self.target_dir = target_dir
        self.token = token

    def generate_all(self) -> bool:
        print(f"\n--- GENERATING PINNED CARDS TO: {self.target_dir} ---")
        if not self.token:
            print("[ERROR] Cannot generate cards without GitHub token.")
            return False

        js_script = """
import { pathToFileURL } from 'node:url';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const corePath = pathToFileURL(process.env.TEMP + '/grs-test/node_modules/@stats-organization/github-readme-stats-core/build/index.js').href;
const { pin } = await import(corePath);

const repos = JSON.parse(process.env.REPOS_JSON || '[]');
const targetDir = process.env.TARGET_DIR;

await mkdir(targetDir, { recursive: true });

for (const r of repos) {
    const opts = {
        username: r.owner,
        repo: r.repo,
        theme: 'tokyonight',
        bg_color: '1E1E2E',
        hide_border: 'true',
        title_color: 'b27ae4',
        icon_color: 'b27ae4',
        text_color: 'CDD6F4'
    };
    if (r.show_owner) {
        opts.show_owner = 'true';
    }
    const res = await pin(opts);
    if (res?.status?.startsWith('error')) {
        console.error(`[ERROR] ${r.owner}/${r.repo}:`, res.error);
        process.exit(1);
    }
    const outPath = path.join(targetDir, r.filename);
    await writeFile(outPath, res.content, 'utf8');
    console.log(`[GENERATED] ${r.filename} (${res.content.length} bytes)`);
}
"""
        env = os.environ.copy()
        env["PAT_1"] = self.token
        env["TARGET_DIR"] = self.target_dir
        env["REPOS_JSON"] = json.dumps(PINNED_REPOS)

        res = subprocess.run(["node", "--input-type=module", "-e", js_script], env=env, capture_output=True, text=True)
        if res.returncode != 0:
            print(f"[FAIL] Card generation failed:\n{res.stderr}")
            return False

        print(res.stdout.strip())
        return True


def check_repos_health(token: str):
    print(f"\n--- CHECKING PINNED REPOSITORIES ACCESSIBILITY ---")
    headers = {"Accept": "application/vnd.github.v3+json"}
    if token:
        headers["Authorization"] = f"token {token}"

    for item in PINNED_REPOS:
        owner = item.get("owner", GITHUB_USERNAME)
        repo_name = item["repo"]
        url = f"https://api.github.com/repos/{owner}/{repo_name}"
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            stars = data.get("stargazers_count", 0)
            lang = data.get("language", "Unknown")
            print(f"[OK] {owner}/{repo_name} | Language: {lang} | Stars: {stars}")
        else:
            print(f"[FAIL] {owner}/{repo_name} -> HTTP {resp.status_code}: {resp.text[:100]}")


def main():
    parser = argparse.ArgumentParser(description="GitHub Profile pinned card manager and validator.")
    parser.add_argument("--generate", action="store_true", help="Generate SVG cards locally using GitHub API token")
    args = parser.parse_args()

    token = get_gh_token()
    if token:
        print(f"\n[INFO] Authenticated GitHub token detected via environment or 'gh' CLI.")
    else:
        print("\n[WARN] No GitHub token found. Set GH_PAT or ensure 'gh' is logged in.")

    if args.generate:
        generator = Card_Generator(PROFILE_DIR, token)
        success = generator.generate_all()
        if not success:
            sys.exit(1)

    validator = Card_Validator(PROFILE_DIR)
    is_healthy = validator.validate_all()

    if token:
        check_repos_health(token)

    if not is_healthy:
        print("\n[ERROR] One or more profile cards are corrupted with error responses!")
        sys.exit(1)

    print("\n[SUCCESS] All profile cards are intact and error-free.")


if __name__ == "__main__":
    main()
