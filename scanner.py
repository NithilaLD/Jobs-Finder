import json
import logging
import re
import threading
import time
import webbrowser
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
SETTINGS = ROOT / "settings.json"
JOBS = ROOT / "jobs.json"
PORT = 8765


def read_json(path, fallback):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return fallback


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False), encoding="utf-8")


def text(element, names):
    for name in names:
        found = element.find(name)
        if found is not None and found.text:
            return re.sub(r"\s+", " ", found.text).strip()
    return ""


def infer_type(hay):
    """Infer job type from title + description text."""
    h = hay.lower()
    if re.search(r"\b(internship|intern)\b", h):
        return "Internship"
    if re.search(r"\b(part[\s-]?time)\b", h):
        return "Part-time"
    if re.search(r"\b(contract|contractor|fixed[\s-]?term)\b", h):
        return "Contract"
    if re.search(r"\b(freelance|freelancer)\b", h):
        return "Freelance"
    if re.search(r"\b(full[\s-]?time|permanent)\b", h):
        return "Full-time"
    return ""


def infer_level(hay):
    """Infer experience level from title + description text."""
    h = hay.lower()
    if re.search(r"\b(internship|intern)\b", h):
        return "Internship"
    if re.search(r"\b(lead|principal|head\s+of|director)\b", h):
        return "Lead"
    if re.search(r"\b(manager|management)\b", h):
        return "Manager"
    if re.search(r"\b(senior|sr\.?|experienced)\b", h):
        return "Senior"
    if re.search(r"\b(mid[\s-]?level|intermediate)\b", h):
        return "Mid level"
    if re.search(r"\b(junior|jr\.?)\b", h):
        return "Junior"
    if re.search(r"\b(entry[\s-]?level|graduate|fresh|trainee)\b", h):
        return "Entry level"
    return ""


def infer_location(hay, source=None):
    """Infer job location from text and source metadata."""
    src_name = source.get("name", "") if isinstance(source, dict) else ""
    src_kind = source.get("kind", "") if isinstance(source, dict) else ""
    src_url = source.get("url", "") if isinstance(source, dict) else ""
    h = f"{hay} {src_name} {src_url}".lower()
    if "colombo" in h:
        return "Colombo"
    if "kandy" in h:
        return "Kandy"
    if "galle" in h:
        return "Galle"
    if "western province" in h:
        return "Western Province"
    if any(k in h for k in [".lk", "sri lanka", "srilanka", "top jobs", "topjobs", "lanka"]):
        return "Sri Lanka"
    if src_kind == "Sri Lanka Board":
        return "Sri Lanka"
    if any(k in h for k in [".au", "australia", "sydney", "melbourne", "brisbane", "victoria"]):
        return "Australia"
    if any(k in h for k in [".uk", "london", "united kingdom", "england"]):
        return "United Kingdom"
    if any(k in h for k in [".ae", "dubai", "emirates", "abu dhabi"]):
        return "Dubai, UAE"
    if "singapore" in h:
        return "Singapore"
    if any(k in h for k in ["united states", "usa", ".us/", "new york", "california", "san francisco"]):
        return "United States"
    if re.search(r"\b(remote)\b", h):
        return "Remote"
    return ""


def normalize(item, source):
    title = text(item, ["title", "{http://www.w3.org/2005/Atom}title"])
    link = text(item, ["link", "{http://www.w3.org/2005/Atom}link"])
    if not link:
        atom_link = item.find("{http://www.w3.org/2005/Atom}link")
        link = atom_link.get("href", "") if atom_link is not None else ""
    description = text(item, ["description", "summary", "{http://www.w3.org/2005/Atom}summary"])
    published = text(item, ["pubDate", "published", "updated", "{http://www.w3.org/2005/Atom}published"])
    hay = f"{title} {description}"
    loc_tag = text(item, ["location", "{http://www.w3.org/2005/Atom}location", "job:location"])
    location = loc_tag or infer_location(hay, source)
    return {"title": title, "company": source.get("name", "Feed"), "location": location, "type": infer_type(hay), "level": infer_level(hay), "remote": "onsite", "skills": [], "education": "", "salary": "", "posted": published or datetime.now(timezone.utc).isoformat(), "url": link or source.get("url", "#"), "source": source.get("name", "Feed"), "description": re.sub(r"<[^>]+>", " ", description).strip()}



def looks_like_feed_url(url):
    value = (url or "").lower()
    return any(token in value for token in (".rss", ".xml", "/feed", "feed.", "feeds", "jobs?format=", ".json", "/api/", "/rss"))


class JobPageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []
        self.anchor = None
        self.anchor_text = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "a" and values.get("href"):
            self.anchor = values["href"]
            self.anchor_text = []

    def handle_data(self, data):
        if self.anchor is not None:
            self.anchor_text.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self.anchor is not None:
            label = re.sub(r"\s+", " ", " ".join(self.anchor_text)).strip()
            self.links.append((self.anchor, label))
            self.anchor = None
            self.anchor_text = []


def html_jobs(payload, source):
    parser = JobPageParser()
    parser.feed(payload)
    job_words = re.compile(r"developer|engineer|analyst|manager|intern|assistant|officer|specialist|designer|consultant|coordinator|administrator|technician|sales|marketing|accountant|security|software|data", re.I)
    job_paths = re.compile(r"job|career|vacanc|position|opening|recruit", re.I)
    page_noise = re.compile(r"service|solution|product|industr|about|contact|partner|portfolio|capabilit", re.I)
    generic = {"careers", "career", "jobs", "job openings", "view jobs", "see openings", "apply now", "learn more", "read more", "search jobs"}
    jobs = []
    seen = set()
    for href, label in parser.links:
        url = urljoin(source["url"], href)
        if not url.startswith(("http://", "https://")) or url in seen:
            continue
        if label.lower() in generic or len(label) < 4:
            continue
        if page_noise.search(label) or not (job_paths.search(url) or job_words.search(label)):
            continue
        seen.add(url)
        jobs.append({
            "title": label,
            "company": source.get("name", "Career site"),
            "location": infer_location(f"{label} {url}", source),
            "type": infer_type(label),
            "level": infer_level(label),
            "remote": "onsite",
            "skills": [],
            "education": "",
            "salary": "",
            "posted": datetime.now(timezone.utc).isoformat(),
            "url": url,
            "source": source.get("name", "Career site"),
            "description": "Found on the official career or recruitment page."
        })
    return jobs


def fetch_source(source):
    request = Request(source["url"], headers={"User-Agent": "JobFinder local RSS reader/1.0"})
    with urlopen(request, timeout=10) as response:
        body = response.read()
        content_type = response.headers.get_content_type() if hasattr(response.headers, "get_content_type") else ""

    try:
        payload = body.decode("utf-8")
    except UnicodeDecodeError:
        payload = body.decode("utf-8", errors="replace")

    try:
        data = json.loads(payload)
        entries = data if isinstance(data, list) else data.get("jobs", data.get("items", []))
        return [dict(item, source=source.get("name", "Feed"), location=item.get("location") or infer_location(f"{item.get('title','')} {item.get('description','')}", source)) for item in entries if isinstance(item, dict) and item.get("title")]
    except (TypeError, ValueError):
        pass

    try:
        root = ET.fromstring(body)
        return [normalize(item, source) for item in root.findall(".//item") + root.findall(".//{http://www.w3.org/2005/Atom}entry") if text(item, ["title", "{http://www.w3.org/2005/Atom}title"])]
    except ET.ParseError:
        if "html" in content_type or "<html" in payload.lower():
            jobs = html_jobs(payload, source)
            logging.info("Found %s job links on %s", len(jobs), source.get("url"))
            return jobs
        raise


def scan():
    settings = read_json(SETTINGS, {"sources": [], "profile": {}})
    jobs = read_json(JOBS, [])
    jobs = [job for job in jobs if job.get("description") != "Found on the official career or recruitment page."]
    existing = {f"{j.get('title','').lower()}|{j.get('company','').lower()}|{j.get('url','')}" for j in jobs}
    added = 0
    sources = [source for source in settings.get("sources", []) if source.get("on") and source.get("url")]
    with ThreadPoolExecutor(max_workers=12) as executor:
        pending = {executor.submit(fetch_source, source): source for source in sources}
        for future in as_completed(pending):
            source = pending[future]
            try:
                found = future.result()
            except Exception as error:
                logging.warning("%s: %s", source.get("name", source.get("url")), error)
                continue
            for job in found:
                key = f"{job.get('title','').lower()}|{job.get('company','').lower()}|{job.get('url','')}"
                if key not in existing:
                    jobs.append(job)
                    existing.add(key)
                    added += 1
    write_json(JOBS, jobs)
    return added


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if self.path == "/api/jobs":
            self.send_json(read_json(JOBS, []))
        elif self.path == "/api/settings":
            self.send_json(read_json(SETTINGS, {"sources": [], "profile": {}}))
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == "/api/settings":
            size = int(self.headers.get("Content-Length", "0"))
            write_json(SETTINGS, json.loads(self.rfile.read(size)))
            self.send_json({"ok": True})
        elif self.path == "/api/scan":
            added = scan()
            self.send_json({"ok": True, "message": f"Scan complete: {added} new jobs."})
        else:
            self.send_error(404)

    def send_json(self, value):
        payload = json.dumps(value).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def scheduler():
    last = None
    while True:
        settings = read_json(SETTINGS, {})
        target = settings.get("scan_time", "07:00")
        today = datetime.now().strftime("%Y-%m-%d")
        if datetime.now().strftime("%H:%M") == target and last != today:
            scan()
            last = today
        time.sleep(30)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    threading.Thread(target=scheduler, daemon=True).start()
    try:
        server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
        url = f"http://127.0.0.1:{PORT}/index.html"
        logging.info("Open %s", url)
        webbrowser.open(url)
        server.serve_forever()
    except KeyboardInterrupt:
        logging.info("Scanner stopped.")
