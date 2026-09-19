import os
import re
import sys
import subprocess
import requests

GITHUB_USERNAME = "Schryzon"
PROFILE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "profile")

PINNED_REPOS = [
    {"repo": "yomu", "filename": "pin-yomu.svg"},
    {"repo": "RVDiA", "filename": "pin-rvdia.svg"},
    {"repo": "NetTracer", "filename": "pin-nettracer.svg"},
    {"repo": "3Dex", "filename": "pin-3dex.svg"},
    {"repo": "XFFS", "filename": "pin-xffs.svg"},
    {"repo": "mpyCUDA", "filename": "pin-mpycuda.svg"},
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


def check_repos_health(token: str):
    print(f"\n--- CHECKING PINNED REPOSITORIES ACCESSIBILITY ---")
    headers = {"Accept": "application/vnd.github.v3+json"}
    if token:
        headers["Authorization"] = f"token {token}"

    for item in PINNED_REPOS:
        repo_name = item["repo"]
        url = f"https://api.github.com/repos/{GITHUB_USERNAME}/{repo_name}"
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            stars = data.get("stargazers_count", 0)
            lang = data.get("language", "Unknown")
            print(f"[OK] {GITHUB_USERNAME}/{repo_name} | Language: {lang} | Stars: {stars}")
        else:
            print(f"[FAIL] {GITHUB_USERNAME}/{repo_name} -> HTTP {resp.status_code}: {resp.text[:100]}")


def main():
    validator = Card_Validator(PROFILE_DIR)
    is_healthy = validator.validate_all()

    token = get_gh_token()
    if token:
        print(f"\n[INFO] Authenticated GitHub token detected via environment or 'gh' CLI.")
        check_repos_health(token)
    else:
        print("\n[WARN] No GitHub token found. Set GH_PAT or ensure 'gh' is logged in.")

    if not is_healthy:
        print("\n[ERROR] One or more profile cards are corrupted with error responses!")
        sys.exit(1)

    print("\n[SUCCESS] All profile cards are intact and error-free.")


if __name__ == "__main__":
    main()
