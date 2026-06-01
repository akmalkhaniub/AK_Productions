"""Deliver a Studio Intelligence brief via email and/or Slack.

WhatsApp is intentionally not implemented: it requires the WhatsApp Business
API (Meta) or Twilio with business verification and pre-approved message
templates — out of scope for the MVP. Roadmap only.
"""
import smtplib
from email.mime.text import MIMEText

import requests

from core import config


def _render_html(brief: dict) -> str:
    rows = []
    for s in brief.get("sections", []):
        url = s.get("video_url", "")
        title = s.get("video_title", "Untitled")
        title_html = f'<a href="{url}">{title}</a>' if url else title
        rows.append(
            f'<div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #eee">'
            f'<div style="font-size:12px;color:#888;text-transform:uppercase">{s.get("channel","")}</div>'
            f'<div style="font-weight:600;margin:2px 0">{title_html}</div>'
            f'<div style="color:#333">{s.get("summary","")}</div>'
            f'<div style="color:#555;font-style:italic;margin-top:4px">Why it matters: {s.get("why_it_matters","")}</div>'
            f'</div>'
        )
    body = "".join(rows) or "<p>No notable uploads in the last 24 hours.</p>"
    return (
        f'<div style="font-family:system-ui,sans-serif;max-width:640px;margin:auto">'
        f'<h2 style="margin-bottom:4px">🎬 Studio Intelligence Brief</h2>'
        f'<p style="color:#444;margin-top:0">{brief.get("headline","")}</p>{body}</div>'
    )


def _render_text(brief: dict) -> str:
    lines = [f"Studio Intelligence Brief", brief.get("headline", ""), ""]
    for s in brief.get("sections", []):
        lines += [
            f"[{s.get('channel','')}] {s.get('video_title','')}",
            s.get("video_url", ""),
            s.get("summary", ""),
            f"Why it matters: {s.get('why_it_matters','')}",
            "",
        ]
    return "\n".join(lines)


def send_email(to_addr: str, brief: dict) -> dict:
    if not (config.SMTP_HOST and to_addr):
        return {"ok": False, "detail": "SMTP not configured or no recipient."}
    msg = MIMEText(_render_html(brief), "html")
    msg["Subject"] = f"🎬 {brief.get('headline', 'Studio Intelligence Brief')}"
    msg["From"] = config.SMTP_FROM
    msg["To"] = to_addr
    try:
        with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=20) as server:
            server.starttls()
            if config.SMTP_USER:
                server.login(config.SMTP_USER, config.SMTP_PASSWORD)
            server.sendmail(config.SMTP_FROM, [to_addr], msg.as_string())
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "detail": str(e)}


def send_slack(webhook_url: str, brief: dict) -> dict:
    if not webhook_url:
        return {"ok": False, "detail": "No Slack webhook configured."}
    try:
        resp = requests.post(webhook_url, json={"text": _render_text(brief)}, timeout=20)
        resp.raise_for_status()
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "detail": str(e)}


def deliver(brief: dict, email: str = "", slack_webhook: str = "") -> dict:
    """Send to whichever channels are configured. Falls back to global config."""
    results = {}
    target_email = email or config.SMTP_FROM
    if config.SMTP_HOST and target_email:
        results["email"] = send_email(target_email, brief)
    webhook = slack_webhook or config.SLACK_WEBHOOK_URL
    if webhook:
        results["slack"] = send_slack(webhook, brief)
    return results
