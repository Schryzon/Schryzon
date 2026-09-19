import os
import re
import sys
import json
import argparse
import urllib.parse
from typing import Dict, Any, List, Optional
from bs4 import BeautifulSoup
import requests

DEFAULT_USERNAME = "schryzon"
DEFAULT_OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "linkedin-data")
VOYAGER_BASE_URL = "https://www.linkedin.com/voyager/api"

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "application/vnd.linkedin.normalized+json+2.1",
    "x-restli-protocol-version": "2.0.0",
    "x-li-lang": "en_US",
    "Accept-Language": "en-US,en;q=0.9",
}


class Linkedin_Fetcher:
    def __init__(self, li_at_cookie: str, jsession_id: Optional[str] = None):
        self.li_at_cookie = li_at_cookie.strip()
        self.csrf_token = jsession_id.strip() if jsession_id else "ajax:1083928472918374"
        self.session = requests.Session()
        self._setup_session()

    def _setup_session(self):
        cookies = {
            "li_at": self.li_at_cookie,
            "JSESSIONID": f'"{self.csrf_token}"' if not self.csrf_token.startswith('"') else self.csrf_token,
        }
        for name, val in cookies.items():
            self.session.cookies.set(name, val, domain=".linkedin.com")

        clean_csrf = self.csrf_token.strip('"')
        self.session.headers.update(DEFAULT_HEADERS)
        self.session.headers.update({"csrf-token": clean_csrf})

    def fetch_endpoint(self, endpoint_url: str) -> Optional[Dict[str, Any]]:
        response = self.session.get(endpoint_url, timeout=15)
        if response.status_code == 200:
            return response.json()

        print(f"[WARN] Failed fetching {endpoint_url} (HTTP {response.status_code}): {response.text[:120]}")
        return None

    def fetch_full_profile(self, username: str) -> Dict[str, Any]:
        endpoints = {
            "profile_view": f"{VOYAGER_BASE_URL}/identity/profiles/{username}/profileView",
            "positions": f"{VOYAGER_BASE_URL}/identity/profiles/{username}/positionGroups?count=100",
            "certifications": f"{VOYAGER_BASE_URL}/identity/profiles/{username}/certifications?count=100",
            "educations": f"{VOYAGER_BASE_URL}/identity/profiles/{username}/educations?count=100",
            "skills": f"{VOYAGER_BASE_URL}/identity/profiles/{username}/skills?count=100",
            "projects": f"{VOYAGER_BASE_URL}/identity/profiles/{username}/projects?count=100",
        }

        results: Dict[str, Any] = {}
        for key, url in endpoints.items():
            print(f"[FETCHING] {key} for {username}...")
            data = self.fetch_endpoint(url)
            if data:
                results[key] = data
        return results


class Offline_Html_Parser:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir

    def _clean_text(self, text: Optional[str]) -> str:
        if not text:
            return ""
        return re.sub(r"\s+", " ", text).strip()

    def parse_all_html_files(self) -> Dict[str, Any]:
        html_files = [f for f in os.listdir(self.data_dir) if f.endswith(".html")]
        if not html_files:
            print(f"[ERROR] No HTML files found in {self.data_dir}")
            return {}

        combined_certs = []
        combined_positions = []
        combined_education = []
        combined_projects = []
        combined_honors = []

        seen_certs = set()
        seen_positions = set()
        seen_education = set()
        seen_projects = set()
        seen_honors = set()

        for filename in sorted(html_files):
            file_path = os.path.join(self.data_dir, filename)
            print(f"[PARSING OFFLINE] {filename}...")
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            soup = BeautifulSoup(content, "html.parser")

            # 1. Certifications
            for cert in self._extract_certifications(soup):
                if cert["name"] not in seen_certs:
                    seen_certs.add(cert["name"])
                    combined_certs.append(cert)

            # 2. Education
            for edu in self._extract_education(soup):
                if edu["school"] not in seen_education:
                    seen_education.add(edu["school"])
                    combined_education.append(edu)

            # 3. Positions
            for pos in self._extract_positions(soup):
                key = f"{pos.get('title')}_{pos.get('company')}"
                if key not in seen_positions:
                    seen_positions.add(key)
                    combined_positions.append(pos)

            # 4. Projects
            for proj in self._extract_projects(soup):
                if proj["name"] not in seen_projects:
                    seen_projects.add(proj["name"])
                    combined_projects.append(proj)

            # 5. Honors & Awards
            for honor in self._extract_honors(soup):
                if honor["title"] not in seen_honors:
                    seen_honors.add(honor["title"])
                    combined_honors.append(honor)

        return {
            "source": "offline_html",
            "profile_name": "I Nyoman Widiyasa Jayananda",
            "headline": "Aspiring DevOps & Cloud Engineer | Cloud, ML, DevOps, and Backend Enthusiast",
            "certifications": combined_certs,
            "education": combined_education,
            "positions": combined_positions,
            "projects": combined_projects,
            "honors_and_awards": combined_honors,
        }

    def _extract_certifications(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        certs = []
        seen = set()

        # Extract through aria-label patterns
        for tag in soup.find_all(lambda t: t.has_attr("aria-label")):
            label = tag["aria-label"]
            cert_name = ""

            prefixes = [
                "Edit license or certification ",
                "Edit lisensi atau sertifikasi ",
                "Show credential for ",
                "Tampilkan kredensial ",
            ]

            for prefix in prefixes:
                if label.startswith(prefix):
                    cert_name = label[len(prefix):].strip()
                    break

            if not cert_name or cert_name in seen:
                continue

            # Traverse up to find container with date, issuer, and URL
            curr = tag
            container = tag
            for _ in range(8):
                if curr.parent:
                    curr = curr.parent
                    text = curr.get_text()
                    if "Issued " in text or "Diterbitkan " in text:
                        container = curr
                        break

            lines = [self._clean_text(s) for s in container.stripped_strings if self._clean_text(s)]
            issuer = ""
            date = ""
            credential_id = ""
            url = ""

            for i, line in enumerate(lines):
                if line.startswith("Issued ") or line.startswith("Diterbitkan "):
                    date = re.sub(r"^(Issued|Diterbitkan)\s+", "", line, flags=re.IGNORECASE).strip()
                    if i > 0 and not issuer:
                        issuer = lines[i - 1]
                elif line.startswith("Credential ID ") or line.startswith("ID kredensial "):
                    credential_id = re.sub(r"^(Credential ID|ID kredensial)\s+", "", line, flags=re.IGNORECASE).strip()

            if not issuer and len(lines) > 1:
                issuer = lines[1] if lines[1] != cert_name else (lines[2] if len(lines) > 2 else "")

            # Look for link
            link_tag = container.find("a", href=re.compile(r"url=|credentials|certificate|cert|virtualbadge|skillsboost", re.IGNORECASE))
            if link_tag and link_tag.get("href"):
                raw_href = link_tag["href"]
                if "url=" in raw_href:
                    parsed = urllib.parse.parse_qs(urllib.parse.urlparse(raw_href).query)
                    url = parsed.get("url", [raw_href])[0]
                else:
                    url = raw_href

            seen.add(cert_name)
            certs.append({
                "name": cert_name,
                "issuer": issuer,
                "date": date,
                "credential_id": credential_id,
                "url": url,
            })

        return certs

    def _extract_education(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        education = []
        seen = set()
        for link in soup.find_all("a", href=re.compile(r"/details/education/")):
            lines = [self._clean_text(s) for s in link.stripped_strings if self._clean_text(s)]
            if len(lines) >= 2:
                school = lines[0]
                if school in seen:
                    continue
                degree = lines[1] if len(lines) > 1 else ""
                period = lines[2] if len(lines) > 2 else ""

                # Check sibling or parent for extra details like GPA
                parent = link.find_parent("div")
                extra_text = ""
                if parent:
                    extra_lines = [self._clean_text(s) for s in parent.stripped_strings if self._clean_text(s)]
                    for el in extra_lines:
                        if "IPK" in el or "GPA" in el or "Class" in el or "Engineering" in el:
                            if el not in [school, degree, period]:
                                extra_text = el
                                break

                seen.add(school)
                education.append({
                    "school": school,
                    "degree": degree,
                    "period": period,
                    "details": extra_text,
                })
        return education

    def _extract_positions(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        positions = []
        seen = set()
        for link in soup.find_all("a", href=re.compile(r"/details/experience/")):
            lines = [self._clean_text(s) for s in link.stripped_strings if self._clean_text(s)]
            if len(lines) >= 2:
                title = lines[0]
                company = lines[1] if len(lines) > 1 else ""
                duration = lines[2] if len(lines) > 2 else ""
                key = f"{title}_{company}"
                if key in seen:
                    continue

                seen.add(key)
                positions.append({
                    "title": title,
                    "company": company,
                    "duration": duration,
                })
        return positions

    def _extract_projects(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        projects = []
        seen = set()
        for link in soup.find_all("a", href=re.compile(r"/details/projects/")):
            lines = [self._clean_text(s) for s in link.stripped_strings if self._clean_text(s)]
            if len(lines) >= 1:
                name = lines[0]
                if name in seen:
                    continue
                duration = lines[1] if len(lines) > 1 else ""
                desc = " ".join(lines[2:]) if len(lines) > 2 else ""
                seen.add(name)
                projects.append({
                    "name": name,
                    "duration": duration,
                    "description": desc,
                })

        # Also search known projects across text
        known_projects = ["3Dēx", "3Dex", "XFFS", "NetTracer", "RVDiA", "yōmu!", "yomu", "mpyCUDA", "Kanzeon", "Neuro-CPP"]
        for item in soup.find_all(["div", "li"]):
            text = self._clean_text(item.get_text())
            for proj in known_projects:
                if text.startswith(proj):
                    lines = [self._clean_text(line) for line in item.stripped_strings if self._clean_text(line)]
                    if len(lines) >= 2 and lines[0] not in seen:
                        seen.add(lines[0])
                        projects.append({
                            "name": lines[0],
                            "duration": lines[1] if len(lines) > 1 else "",
                            "description": " ".join(lines[2:5]) if len(lines) > 2 else "",
                        })
                    break
        return projects

    def _extract_honors(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        honors = []
        seen = set()
        for link in soup.find_all("a", href=re.compile(r"/details/honors/")):
            lines = [self._clean_text(s) for s in link.stripped_strings if self._clean_text(s)]
            if len(lines) >= 2:
                title = lines[0]
                if title in seen:
                    continue
                issuer = lines[1] if len(lines) > 1 else ""
                details = " ".join(lines[2:]) if len(lines) > 2 else ""
                seen.add(title)
                honors.append({
                    "title": title,
                    "issuer": issuer,
                    "details": details,
                })
        return honors


class Profile_Normalizer:
    @staticmethod
    def normalize_voyager_data(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        normalized = {
            "profile": {},
            "certifications": [],
            "positions": [],
            "education": [],
            "skills": [],
            "projects": [],
        }

        # Extract profile header
        profile_view = raw_data.get("profile_view", {})
        if profile_view:
            profile_elem = profile_view.get("profile", {})
            normalized["profile"] = {
                "first_name": profile_elem.get("firstName", ""),
                "last_name": profile_elem.get("lastName", ""),
                "headline": profile_elem.get("headline", ""),
                "summary": profile_elem.get("summary", ""),
                "location": profile_elem.get("locationName", ""),
            }

        # Extract certifications
        certs_raw = raw_data.get("certifications", {}).get("elements", [])
        for cert in certs_raw:
            normalized["certifications"].append({
                "name": cert.get("name", ""),
                "issuer": cert.get("authority", ""),
                "date": cert.get("timePeriod", {}).get("startDate", {}),
                "url": cert.get("url", ""),
                "license_number": cert.get("licenseNumber", ""),
            })

        # Extract positions
        positions_raw = raw_data.get("positions", {}).get("elements", [])
        for pos_group in positions_raw:
            sub_positions = pos_group.get("positions", [])
            for pos in sub_positions:
                normalized["positions"].append({
                    "title": pos.get("title", ""),
                    "company": pos.get("companyName", ""),
                    "location": pos.get("locationName", ""),
                    "description": pos.get("description", ""),
                    "time_period": pos.get("timePeriod", {}),
                })

        # Extract educations
        edu_raw = raw_data.get("educations", {}).get("elements", [])
        for edu in edu_raw:
            normalized["education"].append({
                "school": edu.get("schoolName", ""),
                "degree": edu.get("degreeName", ""),
                "field_of_study": edu.get("fieldOfStudy", ""),
                "time_period": edu.get("timePeriod", {}),
            })

        # Extract skills
        skills_raw = raw_data.get("skills", {}).get("elements", [])
        for skill in skills_raw:
            name = skill.get("name")
            if name:
                normalized["skills"].append(name)

        return normalized


def load_env_cookie(env_path: str) -> Optional[str]:
    if not os.path.exists(env_path):
        return None
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("LINKEDIN_LI_AT="):
                return line.split("=", 1)[1].strip("\"' ")
    return None


def main():
    parser = argparse.ArgumentParser(description="Fetch and normalize complete LinkedIn profile data.")
    parser.add_argument("--cookie", "-c", help="LinkedIn li_at session cookie value", default=None)
    parser.add_argument("--username", "-u", help="LinkedIn username/vanity name", default=DEFAULT_USERNAME)
    parser.add_argument("--env", help="Path to .env file containing LINKEDIN_LI_AT", default=".env")
    parser.add_argument("--offline", "-o", help="Parse saved HTML files in linkedin-data/ offline", action="store_true")
    parser.add_argument("--output-dir", help="Directory to store extracted JSON", default=DEFAULT_OUTPUT_DIR)

    args = parser.parse_args()
    os.makedirs(args.output_dir, exist_ok=True)

    # 1. Offline Mode
    if args.offline:
        print("[MODE] Running in offline HTML parsing mode...")
        offline_parser = Offline_Html_Parser(args.output_dir)
        parsed_data = offline_parser.parse_all_html_files()
        output_file = os.path.join(args.output_dir, "profile_offline.json")
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(parsed_data, f, indent=2, ensure_ascii=False)
        print(f"[SUCCESS] Saved offline extracted data to: {output_file}")
        print(f"Extracted {len(parsed_data.get('certifications', []))} certifications, {len(parsed_data.get('education', []))} education entries, {len(parsed_data.get('projects', []))} projects.")
        return

    # 2. Online Mode with li_at cookie
    cookie = args.cookie or os.getenv("LINKEDIN_LI_AT") or load_env_cookie(args.env)
    if not cookie:
        print("[WARN] No LinkedIn 'li_at' cookie provided via --cookie, LINKEDIN_LI_AT env, or .env file.")
        print("[FALLBACK] Falling back to offline parsing of existing files in linkedin-data/...")
        offline_parser = Offline_Html_Parser(args.output_dir)
        parsed_data = offline_parser.parse_all_html_files()
        output_file = os.path.join(args.output_dir, "profile_offline.json")
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(parsed_data, f, indent=2, ensure_ascii=False)
        print(f"[SUCCESS] Saved offline parsed profile to: {output_file}")
        print("\nTo perform a live API fetch, provide your li_at session cookie:")
        print("  python312 scripts/fetch_linkedin.py --cookie \"AQED...\" --username schryzon")
        return

    print(f"[MODE] Authenticated Voyager API fetch for user: {args.username}")
    fetcher = Linkedin_Fetcher(cookie)
    raw_profile = fetcher.fetch_full_profile(args.username)

    raw_output_path = os.path.join(args.output_dir, "profile_raw.json")
    with open(raw_output_path, "w", encoding="utf-8") as f:
        json.dump(raw_profile, f, indent=2, ensure_ascii=False)
    print(f"[SUCCESS] Saved raw profile dump to: {raw_output_path}")

    normalized = Profile_Normalizer.normalize_voyager_data(raw_profile)
    norm_output_path = os.path.join(args.output_dir, "profile_normalized.json")
    with open(norm_output_path, "w", encoding="utf-8") as f:
        json.dump(normalized, f, indent=2, ensure_ascii=False)
    print(f"[SUCCESS] Saved normalized profile to: {norm_output_path}")


if __name__ == "__main__":
    main()
