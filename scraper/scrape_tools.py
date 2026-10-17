"""
Scrape the public tool/feature listing off PDF-tool websites (iLovePDF, PDF2Go,
Sejda, ...) to build a feature backlog for a competing site.

Scope and limits, read before extending:
- This pulls short tool names + one-line descriptions from public marketing pages
  (not account-gated content, not full article/blog text).
- It does NOT bypass logins, paywalls, CAPTCHAs, or rate limits, and does not
  reuse any site's copy, images, or code verbatim in a product.
- Check each site's /robots.txt and Terms of Service before scraping it; several
  of these sites restrict automated access in their ToS even though the data is
  just a feature list. Treat this as a research aid run a handful of times, not
  something to run against many pages or on a schedule.
- Smallpdf's homepage renders its tool grid client-side (React app, empty in the
  raw HTML), so it's left out here; scraping it would need a headless browser
  (Playwright/Selenium) instead of plain requests.

Each site has its own markup, so each gets its own small parser below rather
than one "generic" selector config -- a shared config looked neat but produced
wrong results once checked against the real HTML.

Usage:
    pip install requests beautifulsoup4
    python scrape_tools.py                 # scrapes every site below
    python scrape_tools.py sejda           # scrapes just one, by key
"""

import json
import sys
import time
from dataclasses import dataclass, asdict

import requests
from bs4 import BeautifulSoup

USER_AGENT = "Mozilla/5.0 (research script; contact: hamzahanifsqae@gmail.com)"
REQUEST_DELAY_SECONDS = 2  # be polite, don't hammer the server


@dataclass
class Tool:
    site: str
    name: str
    description: str
    category: str


def fetch(url: str) -> BeautifulSoup:
    resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=15)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, "html.parser")


def scrape_ilovepdf() -> list[Tool]:
    """Tool grid is static HTML: div.tools__item[data-category] > a > h3 + .tools__item__content p"""
    soup = fetch("https://www.ilovepdf.com/")
    tools = []
    for item in soup.select("div.tools__item"):
        category = item.get("data-category", "uncategorized")
        name_el = item.select_one("h3")
        desc_el = item.select_one(".tools__item__content p")
        if not name_el:
            continue
        tools.append(Tool(
            site="ilovepdf",
            name=name_el.get_text(strip=True),
            description=desc_el.get_text(strip=True) if desc_el else "",
            category=category,
        ))
    return tools


def scrape_sejda() -> list[Tool]:
    """Full tool list (not just the homepage's 'popular' shortcuts) is under
    a[href] > div.caption|div.title + div.description, grouped in parent
    elements classed cat-<name>. Dedup by href since the same tool link
    appears in multiple homepage sections."""
    soup = fetch("https://www.sejda.com/")
    tools = []
    seen = set()
    for desc_el in soup.select("div.description"):
        link = desc_el.parent
        if link.name != "a":
            continue
        name_el = link.select_one("div.caption, div.title")
        href = link.get("href", "")
        if not name_el or not href or href in seen:
            continue
        seen.add(href)
        cat_parent = link.find_parent(class_=lambda c: c and c.startswith("cat-"))
        category = next((c for c in (cat_parent.get("class") if cat_parent else []) if c.startswith("cat-")), "uncategorized")
        tools.append(Tool(
            site="sejda",
            name=name_el.get_text(strip=True),
            description=desc_el.get_text(strip=True),
            category=category,
        ))
    return tools


def scrape_pdf2go() -> list[Tool]:
    """No dedicated tool-card markup; the header's app menu has one link per
    tool, keyed by a stable `data-bat-app` id. Only ~4 "featured" links carry
    a `title` attribute with a real description -- the other ~46 only have
    their name as the link text, so description is left blank for those."""
    soup = fetch("https://www.pdf2go.com/")
    tools = []
    seen = set()
    for link in soup.select("a[data-bat-app]"):
        app_id = link.get("data-bat-app")
        if not app_id or app_id in seen:
            continue
        name = link.get_text(strip=True)
        if not name:
            continue
        seen.add(app_id)
        tools.append(Tool(
            site="pdf2go",
            name=name,
            description=link.get("title", "").strip(),
            category="uncategorized",
        ))
    return tools


SITES = {
    "ilovepdf": scrape_ilovepdf,
    "sejda": scrape_sejda,
    "pdf2go": scrape_pdf2go,
}


def main():
    targets = sys.argv[1:] or list(SITES.keys())
    all_tools: list[Tool] = []

    for key in targets:
        scraper = SITES.get(key)
        if not scraper:
            print(f"Unknown site key: {key} (known: {list(SITES.keys())})", file=sys.stderr)
            continue

        print(f"Scraping {key} ...", file=sys.stderr)
        try:
            tools = scraper()
            print(f"  found {len(tools)} tool entries", file=sys.stderr)
            all_tools.extend(tools)
        except requests.RequestException as e:
            print(f"  failed: {e}", file=sys.stderr)

        time.sleep(REQUEST_DELAY_SECONDS)

    print(json.dumps([asdict(t) for t in all_tools], indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
