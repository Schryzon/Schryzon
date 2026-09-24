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
        clean_csrf = self.csrf_token.strip("\"' \r\n")
        cookies = {
            "li_at": self.li_at_cookie,
            "JSESSIONID": f'"{clean_csrf}"',
        }
        for name, val in cookies.items():
            self.session.cookies.set(name, val, domain=".linkedin.com")

        self.session.headers.update(DEFAULT_HEADERS)
        self.session.headers.update({"csrf-token": clean_csrf})

    def fetch_endpoint(self, endpoint_url: str) -> Optional[Dict[str, Any]]:
        try:
            response = self.session.get(endpoint_url, allow_redirects=False, timeout=15)
            if response.status_code == 200:
                return response.json()

            if response.status_code in (301, 302, 303, 307):
                print(f"[ERROR] Session expired or invalid 'li_at' cookie (redirected to: {response.headers.get('Location')})")
                return None

            print(f"[WARN] Failed fetching {endpoint_url} (HTTP {response.status_code}): {response.text[:120]}")
            return None
        except Exception as e:
            print(f"[ERROR] Network error fetching {endpoint_url}: {e}")
            return None

    def fetch_full_profile(self, username: str) -> Dict[str, Any]:
        endpoints = {
            "profile": f"{VOYAGER_BASE_URL}/identity/dash/profiles?q=memberIdentity&memberIdentity={username}",
            "positions": f"{VOYAGER_BASE_URL}/identity/profiles/{username}/positionGroups?count=100",
            "volunteering": f"{VOYAGER_BASE_URL}/identity/profiles/{username}/volunteerExperiences?count=100",
            "certifications": f"{VOYAGER_BASE_URL}/identity/profiles/{username}/certifications?count=100",
            "projects": f"{VOYAGER_BASE_URL}/identity/profiles/{username}/projects?count=100",
            "educations": f"{VOYAGER_BASE_URL}/identity/profiles/{username}/educations?count=100",
            "skills": f"{VOYAGER_BASE_URL}/identity/profiles/{username}/skills?count=100",
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


def get_vector_image_url(logo_dict: Optional[Dict[str, Any]]) -> Optional[str]:
    if not logo_dict or not isinstance(logo_dict, dict):
        return None
    root_url = logo_dict.get("rootUrl", "")
    artifacts = logo_dict.get("artifacts", [])
    if not root_url or not artifacts:
        return None
    best_artifact = max(artifacts, key=lambda a: a.get("width", 0), default=None)
    if best_artifact and best_artifact.get("fileIdentifyingUrlPathSegment"):
        return f"{root_url}{best_artifact['fileIdentifyingUrlPathSegment']}"
    return None


class Profile_Normalizer:
    @staticmethod
    def normalize_voyager_data(raw_data: Dict[str, Any], offline_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        offline = offline_data or {}
        normalized = {
            "profile": {},
            "certifications": [],
            "positions": [],
            "volunteering": [],
            "education": offline.get("education", []),
            "skills": offline.get("skills", []),
            "projects": [],
            "honors": offline.get("honors", []),
        }

        # Build MiniCompany lookup map for logos
        company_map: Dict[str, Dict[str, str]] = {}
        for section_key in ("positions", "volunteering", "certifications"):
            for item in raw_data.get(section_key, {}).get("included", []):
                if item.get("$type") == "com.linkedin.voyager.entities.shared.MiniCompany":
                    urn = item.get("entityUrn") or item.get("objectUrn")
                    if urn:
                        company_map[urn] = {
                            "name": item.get("name", ""),
                            "logo_url": get_vector_image_url(item.get("logo")) or "",
                        }

        # 1. Profile header (from dash profiles or legacy profile_view)
        dash_profile = raw_data.get("profile", {})
        if dash_profile:
            for item in dash_profile.get("included", []):
                if "Profile" in item.get("$type", ""):
                    normalized["profile"] = {
                        "first_name": item.get("firstName", ""),
                        "last_name": item.get("lastName", ""),
                        "headline": item.get("headline", ""),
                        "summary": item.get("summary", ""),
                        "location": item.get("locationName", "") or item.get("geoRegion", ""),
                        "urn": item.get("entityUrn", ""),
                    }
                    break

        if not normalized["profile"] and raw_data.get("profile_view"):
            elem = raw_data["profile_view"].get("profile", {})
            normalized["profile"] = {
                "first_name": elem.get("firstName", ""),
                "last_name": elem.get("lastName", ""),
                "headline": elem.get("headline", ""),
                "summary": elem.get("summary", ""),
                "location": elem.get("locationName", ""),
            }

        # 2. Certifications (Voyager normalized included entities)
        certs_included = raw_data.get("certifications", {}).get("included", [])
        if certs_included:
            for item in certs_included:
                if "Certification" in item.get("$type", ""):
                    time_period = item.get("timePeriod", {})
                    start_date = time_period.get("startDate", {}) if isinstance(time_period, dict) else {}
                    date_str = ""
                    if start_date.get("year"):
                        month = start_date.get("month")
                        date_str = f"{month:02d}/{start_date['year']}" if month else str(start_date["year"])

                    comp_urn = item.get("companyUrn") or item.get("*company")
                    logo_url = company_map.get(comp_urn, {}).get("logo_url", "") if comp_urn else ""

                    normalized["certifications"].append({
                        "name": item.get("name", ""),
                        "issuer": item.get("authority", ""),
                        "date": date_str,
                        "url": item.get("url", ""),
                        "license_number": item.get("licenseNumber", ""),
                        "display_source": item.get("displaySource", ""),
                        "logo_url": logo_url,
                    })
        elif "elements" in raw_data.get("certifications", {}):
            for cert in raw_data["certifications"]["elements"]:
                normalized["certifications"].append({
                    "name": cert.get("name", ""),
                    "issuer": cert.get("authority", ""),
                    "date": cert.get("timePeriod", {}).get("startDate", {}),
                    "url": cert.get("url", ""),
                    "license_number": cert.get("licenseNumber", ""),
                    "logo_url": "",
                })
        elif offline.get("certifications"):
            normalized["certifications"] = offline["certifications"]

        # 3. Positions (Voyager normalized included entities)
        pos_included = raw_data.get("positions", {}).get("included", [])
        if pos_included:
            for item in pos_included:
                if "Position" in item.get("$type", "") and "Group" not in item.get("$type", ""):
                    time_period = item.get("timePeriod", {})
                    start_date = time_period.get("startDate", {}) if isinstance(time_period, dict) else {}
                    end_date = time_period.get("endDate", {}) if isinstance(time_period, dict) else {}

                    start_str = f"{start_date.get('month', 1):02d}/{start_date['year']}" if start_date.get("year") else ""
                    end_str = f"{end_date.get('month', 1):02d}/{end_date['year']}" if end_date.get("year") else ("Present" if start_str else "")

                    comp_urn = item.get("companyUrn") or (item.get("company", {}) or {}).get("*miniCompany")
                    logo_url = company_map.get(comp_urn, {}).get("logo_url", "") if comp_urn else ""

                    normalized["positions"].append({
                        "title": item.get("title", ""),
                        "company": item.get("companyName", ""),
                        "location": item.get("locationName", "") or "",
                        "description": item.get("description", "") or "",
                        "date_range": f"{start_str} - {end_str}".strip(" -"),
                        "logo_url": logo_url,
                    })
        elif "elements" in raw_data.get("positions", {}):
            for pos_group in raw_data["positions"]["elements"]:
                for pos in pos_group.get("positions", []):
                    normalized["positions"].append({
                        "title": pos.get("title", ""),
                        "company": pos.get("companyName", ""),
                        "location": pos.get("locationName", ""),
                        "description": pos.get("description", ""),
                        "date_range": "",
                        "logo_url": "",
                    })
        elif offline.get("positions"):
            normalized["positions"] = offline["positions"]

        # 4. Volunteering (Voyager normalized included entities)
        vol_included = raw_data.get("volunteering", {}).get("included", [])
        if vol_included:
            for item in vol_included:
                if "VolunteerExperience" in item.get("$type", ""):
                    time_period = item.get("timePeriod", {})
                    start_date = time_period.get("startDate", {}) if isinstance(time_period, dict) else {}
                    end_date = time_period.get("endDate", {}) if isinstance(time_period, dict) else {}

                    start_str = f"{start_date.get('month', 1):02d}/{start_date['year']}" if start_date.get("year") else ""
                    end_str = f"{end_date.get('month', 1):02d}/{end_date['year']}" if end_date.get("year") else ("Present" if start_str else "")

                    comp_urn = item.get("companyUrn") or (item.get("company", {}) or {}).get("*miniCompany")
                    logo_url = company_map.get(comp_urn, {}).get("logo_url", "") if comp_urn else ""

                    normalized["volunteering"].append({
                        "role": item.get("role", ""),
                        "company": item.get("companyName", ""),
                        "cause": item.get("cause", "") or "",
                        "description": item.get("description", "") or "",
                        "date_range": f"{start_str} - {end_str}".strip(" -"),
                        "logo_url": logo_url,
                    })

        # 5. Projects (Voyager normalized included entities)
        proj_included = raw_data.get("projects", {}).get("included", [])
        if proj_included:
            for item in proj_included:
                if "Project" in item.get("$type", ""):
                    time_period = item.get("timePeriod", {})
                    start_date = time_period.get("startDate", {}) if isinstance(time_period, dict) else {}
                    end_date = time_period.get("endDate", {}) if isinstance(time_period, dict) else {}

                    start_str = f"{start_date.get('month', 1):02d}/{start_date['year']}" if start_date.get("year") else ""
                    end_str = f"{end_date.get('month', 1):02d}/{end_date['year']}" if end_date.get("year") else ""

                    normalized["projects"].append({
                        "title": item.get("title", ""),
                        "description": item.get("description", "") or "",
                        "url": item.get("url", "") or "",
                        "date_range": f"{start_str} - {end_str}".strip(" -"),
                    })
        elif offline.get("projects"):
            normalized["projects"] = offline["projects"]

        # 6. Educations (from live if available, else retain offline)
        edu_included = raw_data.get("educations", {}).get("included", [])
        if edu_included:
            live_edu = []
            for item in edu_included:
                if "Education" in item.get("$type", ""):
                    time_period = item.get("timePeriod", {})
                    start_date = time_period.get("startDate", {}) if isinstance(time_period, dict) else {}
                    end_date = time_period.get("endDate", {}) if isinstance(time_period, dict) else {}
                    start_str = str(start_date.get("year", ""))
                    end_str = str(end_date.get("year", ""))
                    live_edu.append({
                        "school": item.get("schoolName", ""),
                        "degree": item.get("degreeName", ""),
                        "field_of_study": item.get("fieldOfStudy", ""),
                        "time_period": f"{start_str} - {end_str}".strip(" -"),
                    })
            if live_edu:
                normalized["education"] = live_edu

        # 7. Skills (from live if available, else retain offline)
        skills_included = raw_data.get("skills", {}).get("included", [])
        if skills_included:
            live_skills = [x.get("name") for x in skills_included if x.get("name")]
            if live_skills:
                normalized["skills"] = live_skills

        return normalized


def load_env_credentials(env_path: str) -> tuple[Optional[str], Optional[str]]:
    if not os.path.exists(env_path):
        return None, None
    cookie = None
    jsessionid = None
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("LINKEDIN_LI_AT="):
                cookie = line.split("=", 1)[1].strip("\"' ")
            elif line.startswith("LINKEDIN_JSESSIONID="):
                jsessionid = line.split("=", 1)[1].strip("\"' ")
    return cookie, jsessionid


def main():
    parser = argparse.ArgumentParser(description="Fetch and normalize complete LinkedIn profile data.")
    parser.add_argument("--cookie", "-c", help="LinkedIn li_at session cookie value", default=None)
    parser.add_argument("--jsessionid", "-j", help="LinkedIn JSESSIONID cookie / CSRF token", default=None)
    parser.add_argument("--username", "-u", help="LinkedIn username/vanity name", default=DEFAULT_USERNAME)
    parser.add_argument("--env", help="Path to .env file containing LINKEDIN_LI_AT", default=".env")
    parser.add_argument("--offline", "-o", help="Parse saved HTML files in linkedin-data/ offline", action="store_true")
    parser.add_argument("--output-dir", help="Directory to store extracted JSON", default=DEFAULT_OUTPUT_DIR)

    args = parser.parse_args()
    os.makedirs(args.output_dir, exist_ok=True)

    offline_file = os.path.join(args.output_dir, "profile_offline.json")
    offline_data = {}
    if os.path.exists(offline_file):
        try:
            with open(offline_file, "r", encoding="utf-8") as f:
                offline_data = json.load(f)
        except Exception:
            pass

    # 1. Offline Mode
    if args.offline:
        print("[MODE] Running in offline HTML parsing mode...")
        offline_parser = Offline_Html_Parser(args.output_dir)
        parsed_data = offline_parser.parse_all_html_files()
        with open(offline_file, "w", encoding="utf-8") as f:
            json.dump(parsed_data, f, indent=2, ensure_ascii=False)
        print(f"[SUCCESS] Saved offline extracted data to: {offline_file}")
        print(f"Extracted {len(parsed_data.get('certifications', []))} certifications, {len(parsed_data.get('education', []))} education entries, {len(parsed_data.get('projects', []))} projects.")
        return

    # 2. Online Mode with li_at cookie
    cookie, jsessionid = load_env_credentials(args.env)
    if args.cookie:
        cookie = args.cookie
    if args.jsessionid:
        jsessionid = args.jsessionid
    if not cookie:
        cookie = os.getenv("LINKEDIN_LI_AT")
    if not jsessionid:
        jsessionid = os.getenv("LINKEDIN_JSESSIONID")

    if not cookie:
        print("[WARN] No LinkedIn 'li_at' cookie provided via --cookie, LINKEDIN_LI_AT env, or .env file.")
        print("[FALLBACK] Falling back to offline parsing of existing files in linkedin-data/...")
        offline_parser = Offline_Html_Parser(args.output_dir)
        parsed_data = offline_parser.parse_all_html_files()
        with open(offline_file, "w", encoding="utf-8") as f:
            json.dump(parsed_data, f, indent=2, ensure_ascii=False)
        print(f"[SUCCESS] Saved offline parsed profile to: {offline_file}")
        print("\nTo perform a live API fetch, provide your li_at session cookie in .env or via command line:")
        print("  python312 scripts/fetch_linkedin.py --cookie \"AQED...\" --username schryzon")
        return

    print(f"[MODE] Authenticated Voyager API fetch for user: {args.username}")
    fetcher = Linkedin_Fetcher(cookie, jsession_id=jsessionid)
    raw_profile = fetcher.fetch_full_profile(args.username)
    if not raw_profile:
        print("[ERROR] No profile data could be retrieved. Ensure your 'li_at' session cookie is valid and not expired.")
        print("[INFO] Re-normalizing existing profile data with offline cache to ensure content is intact...")
        raw_output_path = os.path.join(args.output_dir, "profile_raw.json")
        if os.path.exists(raw_output_path):
            with open(raw_output_path, "r", encoding="utf-8") as f:
                cached_raw = json.load(f)
            normalized = Profile_Normalizer.normalize_voyager_data(cached_raw, offline_data=offline_data)
            norm_output_path = os.path.join(args.output_dir, "profile_normalized.json")
            with open(norm_output_path, "w", encoding="utf-8") as f:
                json.dump(normalized, f, indent=2, ensure_ascii=False)
            print(f"[SUCCESS] Saved normalized profile from cached data to: {norm_output_path}")
            print(f"Summary: {len(normalized.get('certifications', []))} certifications, {len(normalized.get('positions', []))} positions, {len(normalized.get('projects', []))} projects, {len(normalized.get('education', []))} education entries.")
        return

    raw_output_path = os.path.join(args.output_dir, "profile_raw.json")
    with open(raw_output_path, "w", encoding="utf-8") as f:
        json.dump(raw_profile, f, indent=2, ensure_ascii=False)
    print(f"[SUCCESS] Saved raw profile dump to: {raw_output_path}")

    normalized = Profile_Normalizer.normalize_voyager_data(raw_profile, offline_data=offline_data)
    norm_output_path = os.path.join(args.output_dir, "profile_normalized.json")
    with open(norm_output_path, "w", encoding="utf-8") as f:
        json.dump(normalized, f, indent=2, ensure_ascii=False)
    print(f"[SUCCESS] Saved normalized profile to: {norm_output_path}")
    print(f"Summary: {len(normalized.get('certifications', []))} certifications, {len(normalized.get('positions', []))} positions, {len(normalized.get('projects', []))} projects, {len(normalized.get('education', []))} education entries.")


if __name__ == "__main__":
    main()
