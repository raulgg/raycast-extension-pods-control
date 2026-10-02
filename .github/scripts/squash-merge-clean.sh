#!/usr/bin/env bash
# Squash-merge a pull request with an explicit title and body so GitHub cannot
# append Co-authored-by trailers. Keeps human co-authors; drops known AI agents.
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: $0 <pull-request-number>" >&2
  exit 2
fi

if [[ ! "$1" =~ ^[0-9]+$ ]]; then
  echo "error: pull request number must be an integer, got: $1" >&2
  exit 2
fi

if [[ -z "${GITHUB_REPOSITORY:-}" ]]; then
  echo "error: GITHUB_REPOSITORY is required" >&2
  exit 2
fi

if [[ -z "${GH_TOKEN:-${GITHUB_TOKEN:-}}" ]]; then
  echo "error: GH_TOKEN or GITHUB_TOKEN is required" >&2
  exit 2
fi

export GH_TOKEN="${GH_TOKEN:-$GITHUB_TOKEN}"

python3 - "$1" <<'PY'
from __future__ import annotations

import json
import os
import re
import subprocess
import sys

PR_NUMBER = sys.argv[1]
REPO = os.environ["GITHUB_REPOSITORY"]
TRAILER_LINE = re.compile(
    r"^Co-authored-by:\s*(.+?)\s*<([^>]+)>\s*$", re.IGNORECASE | re.MULTILINE
)
# Display names from public OSS trailers (Copilot App, Claude, Codex, Gemini, Devin AI, Cursor Agent).
AGENT_NAME = re.compile(
    r"""^(
        cursor(\s+agent)?
        |claude(\s+code)?(\s+(sonnet|opus|haiku).*)?
        |codex
        |chatgpt(\s+codex)?
        |copilot(\s+(app|swe(\s+agent)?|cli|chat))?
        |github\s+copilot
        |gemini(\s+code\s+assist)?
        |devin(\s+ai(\s+integration)?)?
        |jetbrains\s+ai
    )$""",
    re.IGNORECASE | re.VERBOSE,
)
AGENT_EMAILS = {
    "223556219+copilot@users.noreply.github.com",
    "codex@openai.com",
    "cursoragent@cursor.com",
    "gemini-code-assist@google.com",
    "gemini@google.com",
    "noreply@anthropic.com",
    "noreply@openai.com",
}
AGENT_EMAIL_DOMAINS = {
    "anthropic.com",
    "cognition.ai",
    "cursor.com",
}
AGENT_LOGINS = {
    "chatgpt",
    "chatgpt-codex-connector",
    "claude",
    "claude-code",
    "codex",
    "copilot",
    "copilot-swe-agent",
    "cursor",
    "cursoragent",
    "devin",
    "devin-ai",
    "devin-ai-integration",
    "gemini",
    "gemini-code-assist",
    "github-copilot",
    "jetbrains-ai",
}
SKIP_LOGINS = {
    "github-actions",
    "github-actions[bot]",
    *AGENT_LOGINS,
    *{f"{login}[bot]" for login in AGENT_LOGINS},
}


def gh_json(args: list[str]):
    result = subprocess.run(
        ["gh", "api", *args],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        sys.stderr.write(result.stderr)
        raise SystemExit(result.returncode)
    if not result.stdout.strip():
        return None
    return json.loads(result.stdout)


def strip_bot_suffix(value: str) -> str:
    value = value.strip().lower()
    if value.endswith("[bot]"):
        return value[: -len("[bot]")].rstrip()
    return value


def noreply_login(email: str) -> str:
    local = email.split("@", 1)[0]
    return strip_bot_suffix(local.rsplit("+", 1)[-1])


def is_ai_agent(name: str, email: str) -> bool:
    name = name.strip()
    email = email.strip().lower()
    if email in AGENT_EMAILS:
        return True
    if email.endswith(tuple(f"@{domain}" for domain in AGENT_EMAIL_DOMAINS)):
        return True
    if "cursoragent" in email:
        return True
    login = noreply_login(email)
    if login in AGENT_LOGINS:
        return True
    name_key = re.sub(r"[\s_-]+", " ", strip_bot_suffix(name)).strip()
    if AGENT_NAME.match(name_key):
        return True
    if name_key.replace(" ", "-") in AGENT_LOGINS:
        return True
    compact_logins = {item.replace("-", "") for item in AGENT_LOGINS}
    if name_key.replace(" ", "") in compact_logins:
        return True
    return False


def strip_ai_trailers(text: str) -> str:
    kept: list[str] = []
    for line in text.splitlines():
        match = TRAILER_LINE.match(line.strip())
        if match and is_ai_agent(match.group(1), match.group(2)):
            continue
        kept.append(line)
    return "\n".join(kept).strip()


def add_author(authors: dict[str, str], name: str, email: str) -> None:
    name = " ".join(name.split())
    email = email.strip()
    if not name or not email or is_ai_agent(name, email):
        return
    local = email.lower().split("@", 1)[0]
    login = local.rsplit("+", 1)[-1]
    if login in SKIP_LOGINS or local.endswith("[bot]") or "github-actions" in local:
        return
    authors.setdefault(email.lower(), f"{name} <{email}>")


def main() -> int:
    pr = gh_json([f"repos/{REPO}/pulls/{PR_NUMBER}"])
    if pr.get("merged"):
        print(f"pull request #{PR_NUMBER} is already merged")
        return 0
    if pr.get("state") != "open":
        print(f"error: pull request #{PR_NUMBER} is {pr.get('state')}", file=sys.stderr)
        return 1
    if pr.get("draft"):
        print(f"error: pull request #{PR_NUMBER} is a draft", file=sys.stderr)
        return 1
    if pr.get("mergeable") is False:
        print(f"error: pull request #{PR_NUMBER} is not mergeable", file=sys.stderr)
        return 1

    authors: dict[str, str] = {}
    commits = gh_json(["--paginate", f"repos/{REPO}/pulls/{PR_NUMBER}/commits"]) or []
    for commit in commits:
        payload = commit.get("commit") or {}
        author = payload.get("author") or {}
        add_author(authors, author.get("name") or "", author.get("email") or "")
        for match in TRAILER_LINE.finditer(payload.get("message") or ""):
            add_author(authors, match.group(1), match.group(2))

    user = pr.get("user") or {}
    login = user.get("login") or ""
    user_id = user.get("id")
    if login.lower() not in SKIP_LOGINS and not any(login.lower() in email for email in authors):
        add_author(
            authors,
            login,
            f"{user_id}+{login}@users.noreply.github.com" if user_id else f"{login}@users.noreply.github.com",
        )

    title = (pr.get("title") or "").strip()
    if not title:
        print("error: pull request title is empty", file=sys.stderr)
        return 1
    if "\n" in title:
        print("error: pull request title contains a newline", file=sys.stderr)
        return 1

    body = strip_ai_trailers((pr.get("body") or "").strip())
    trailers = [f"Co-authored-by: {value}" for value in authors.values()]
    message_parts = [part for part in (body, "\n".join(trailers)) if part]
    commit_message = "\n\n".join(message_parts)

    combined = f"{title}\n\n{commit_message}" if commit_message else title
    leftover = [
        f"{match.group(1).strip()} <{match.group(2).strip()}>"
        for match in TRAILER_LINE.finditer(combined)
        if is_ai_agent(match.group(1), match.group(2))
    ]
    if leftover:
        print("error: squash message would still contain an AI co-author trailer:", file=sys.stderr)
        print("\n".join(leftover), file=sys.stderr)
        print(combined, file=sys.stderr)
        return 1

    payload = {
        "merge_method": "squash",
        "commit_title": title,
        "commit_message": commit_message,
        "sha": pr["head"]["sha"],
    }
    subprocess.run(
        [
            "gh",
            "api",
            "--method",
            "PUT",
            f"repos/{REPO}/pulls/{PR_NUMBER}/merge",
            "--input",
            "-",
        ],
        check=True,
        input=json.dumps(payload),
        text=True,
    )
    print(f"squash-merged #{PR_NUMBER} as {title!r} without an AI co-author")
    subprocess.run(
        ["gh", "api", "--method", "DELETE", f"repos/{REPO}/issues/{PR_NUMBER}/labels/merge"],
        check=False,
        capture_output=True,
        text=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
PY
