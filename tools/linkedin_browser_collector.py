from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


DEFAULT_API_BASE = "http://localhost:8000"
DEFAULT_PROFILE_DIR = Path(".local/linkedin-playwright-profile")
DEFAULT_INTENT_TERMS = {"hiring", "contratando", "contratamos", "vaga", "vagas", "job", "jobs"}


@dataclass(frozen=True)
class CollectedPost:
    query: str
    text: str
    source_url: str
    post_url: str | None = None
    author: str | None = None
    index: int = 0

    @property
    def label(self) -> str:
        label = f"{self.query} #{self.index}"
        return label[:255]


def build_search_url(query: str, sort_by: str = '"date_posted"', sid: str = "VRT") -> str:
    params = {
        "keywords": query,
        "origin": "FACETED_SEARCH",
        "sid": sid,
        "sortBy": sort_by,
    }
    return f"https://www.linkedin.com/search/results/content/?{urllib.parse.urlencode(params)}"


def derive_requested_keywords(queries: list[str], explicit_keywords: list[str] | None = None) -> list[str]:
    if explicit_keywords:
        return explicit_keywords
    keywords: list[str] = []
    seen = set()
    for query in queries:
        for token in query.replace("/", " ").replace(",", " ").split():
            normalized = token.strip().lower()
            if not normalized or normalized in DEFAULT_INTENT_TERMS or normalized in seen:
                continue
            seen.add(normalized)
            keywords.append(normalized)
    return keywords or [queries[0]]


def is_login_page_text(text: str) -> bool:
    normalized = text.lower()
    return "linkedin" in normalized and any(
        marker in normalized
        for marker in [
            "sign in with apple",
            "sign in with a passkey",
            "new to linkedin? join now",
            "email or phone password",
        ]
    )


def body_text(page: Any) -> str:
    try:
        return page.inner_text("body", timeout=5000)
    except Exception:
        return ""


def safe_goto(page: Any, url: str, *, attempts: int = 3) -> None:
    last_error: Exception | None = None
    for _ in range(attempts):
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            return
        except Exception as exc:
            last_error = exc
            message = str(exc)
            if "interrupted by another navigation" not in message and "net::ERR_ABORTED" not in message:
                raise
            try:
                page.wait_for_load_state("domcontentloaded", timeout=30000)
            except Exception:
                pass
            time.sleep(2)
    if last_error is not None:
        raise last_error


def wait_for_linkedin_login(page: Any, login_wait_seconds: int = 0) -> None:
    print("LinkedIn login is required in the opened browser.")
    if login_wait_seconds > 0:
        print(
            "Finish login/magic link/2FA in that browser window. "
            f"The collector will wait up to {login_wait_seconds} seconds."
        )
        deadline = time.monotonic() + login_wait_seconds
        while time.monotonic() < deadline:
            if not is_login_page_text(body_text(page)):
                break
            time.sleep(2)
    else:
        print("Finish login/magic link/2FA in that browser window, wait until LinkedIn loads, then press Enter here.")
        input()
    try:
        page.wait_for_load_state("domcontentloaded", timeout=30000)
    except Exception:
        pass
    time.sleep(2)


def load_playwright() -> Any:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print(
            "Playwright is not installed. Run:\n"
            "  python -m pip install playwright\n"
            "  python -m playwright install chromium",
            file=sys.stderr,
        )
        raise SystemExit(2)
    return sync_playwright


def extract_posts_from_page(page: Any, query: str, source_url: str, max_posts: int) -> list[CollectedPost]:
    rows = page.evaluate(
        """
        ({ maxPosts }) => {
          const selectors = [
            'div[data-urn*="activity"]',
            'div.feed-shared-update-v2',
            'li.reusable-search__result-container',
            'div[role="article"]'
          ];
          const nodes = [];
          for (const selector of selectors) {
            document.querySelectorAll(selector).forEach((node) => nodes.push(node));
          }
          const seen = new Set();
          const posts = [];
          for (const node of nodes) {
            const text = (node.innerText || '').replace(/\\s+/g, ' ').trim();
            if (text.length < 80 || seen.has(text)) {
              continue;
            }
            seen.add(text);
            const links = Array.from(node.querySelectorAll('a[href]'))
              .map((link) => link.href)
              .filter((href) => href && href.includes('linkedin.com'));
            const authorNode = node.querySelector('[data-test-app-aware-link], .update-components-actor__name, .feed-shared-actor__name');
            posts.push({
              text,
              post_url: links.find((href) => href.includes('/feed/update/') || href.includes('/posts/')) || links[0] || null,
              author: authorNode ? (authorNode.innerText || '').replace(/\\s+/g, ' ').trim() : null
            });
            if (posts.length >= maxPosts) {
              break;
            }
          }
          return posts;
        }
        """,
        {"maxPosts": max_posts},
    )
    collected: list[CollectedPost] = []
    for index, row in enumerate(rows, start=1):
        collected.append(
            CollectedPost(
                query=query,
                text=str(row.get("text") or ""),
                source_url=source_url,
                post_url=row.get("post_url"),
                author=row.get("author"),
                index=index,
            )
        )
    return collected


def collect_query_posts(
    page: Any,
    query: str,
    *,
    max_posts: int,
    max_scrolls: int,
    scroll_delay_seconds: float,
    sort_by: str,
    sid: str,
    login_wait_seconds: int = 0,
) -> list[CollectedPost]:
    source_url = build_search_url(query, sort_by=sort_by, sid=sid)
    safe_goto(page, source_url)
    time.sleep(scroll_delay_seconds)

    if is_login_page_text(body_text(page)):
        wait_for_linkedin_login(page, login_wait_seconds=login_wait_seconds)
        safe_goto(page, source_url)
        time.sleep(scroll_delay_seconds)
        if is_login_page_text(body_text(page)):
            raise SystemExit("LinkedIn still shows the login page. Finish login in the browser and run the collector again.")

    posts: list[CollectedPost] = []
    seen_texts = set()
    for _ in range(max_scrolls + 1):
        for post in extract_posts_from_page(page, query, source_url, max_posts):
            if post.text in seen_texts:
                continue
            seen_texts.add(post.text)
            posts.append(CollectedPost(**{**post.__dict__, "index": len(posts) + 1}))
            if len(posts) >= max_posts:
                return posts
        page.mouse.wheel(0, 2500)
        time.sleep(scroll_delay_seconds)
    return posts


def create_job_search_run(
    api_base: str,
    posts: list[CollectedPost],
    requested_keywords: list[str],
    auth_token: str | None = None,
) -> dict[str, Any]:
    payload = {
        "keywords": requested_keywords,
        "collection_source_types": ["authenticated_browser_search"],
        "collection_inputs": [
            {
                "source_type": "authenticated_browser_search",
                "label": post.label,
                "source_url": post.post_url or post.source_url,
                "provided_text": post.text,
            }
            for post in posts
        ],
        "candidate_limit": None,
    }
    request = urllib.request.Request(
        f"{api_base.rstrip('/')}/job-search-runs",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {auth_token}"} if auth_token else {}),
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return json.load(response)
    except urllib.error.URLError as exc:
        raise SystemExit(f"Could not create job search run at {api_base}: {exc}") from exc


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Collect LinkedIn posts from a local authenticated browser session.")
    parser.add_argument("--keywords", nargs="+", required=True, help="LinkedIn search query strings, e.g. 'hiring typescript'.")
    parser.add_argument("--requested-keywords", nargs="+", help="Keywords used by the API/worker for matching and scoring.")
    parser.add_argument("--api-base", default=DEFAULT_API_BASE)
    parser.add_argument("--profile-dir", default=str(DEFAULT_PROFILE_DIR))
    parser.add_argument("--max-posts", type=int, default=20)
    parser.add_argument("--max-scrolls", type=int, default=5)
    parser.add_argument("--scroll-delay-seconds", type=float, default=1.5)
    parser.add_argument("--sort-by", default='"date_posted"')
    parser.add_argument("--sid", default="VRT")
    parser.add_argument("--login-wait-seconds", type=int, default=0)
    parser.add_argument("--headless", action="store_true", help="Run headless. Not recommended for first login.")
    parser.add_argument("--dry-run", action="store_true", help="Collect and print posts without creating an API run.")
    parser.add_argument("--auth-token", help="Bearer token for creating the API job search run.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    max_posts = max(1, min(args.max_posts, 50))
    profile_dir = Path(args.profile_dir)
    profile_dir.mkdir(parents=True, exist_ok=True)

    sync_playwright = load_playwright()
    with sync_playwright() as playwright:
        context = playwright.chromium.launch_persistent_context(
            user_data_dir=str(profile_dir),
            headless=args.headless,
            viewport={"width": 1440, "height": 1000},
        )
        page = context.new_page()
        posts: list[CollectedPost] = []
        try:
            for query in args.keywords:
                remaining = max_posts - len(posts)
                if remaining <= 0:
                    break
                posts.extend(
                    collect_query_posts(
                        page,
                        query,
                        max_posts=remaining,
                        max_scrolls=args.max_scrolls,
                        scroll_delay_seconds=args.scroll_delay_seconds,
                        sort_by=args.sort_by,
                        sid=args.sid,
                        login_wait_seconds=args.login_wait_seconds,
                    )
                )
        finally:
            context.close()

    print(f"Collected {len(posts)} post(s).")
    for post in posts:
        preview = post.text[:180].replace("\n", " ")
        print(f"- {post.label}: {preview}")

    if args.dry_run:
        return
    if not posts:
        raise SystemExit("No posts collected; no API run created.")

    requested_keywords = derive_requested_keywords(args.keywords, args.requested_keywords)
    run = create_job_search_run(args.api_base, posts, requested_keywords, auth_token=args.auth_token)
    print(json.dumps(run, indent=2))


if __name__ == "__main__":
    main()
