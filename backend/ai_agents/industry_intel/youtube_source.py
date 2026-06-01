"""
YouTube data source for the Studio Intelligence agent.

Two concerns, deliberately separated by cost:
- OAuth + subscriptions: needs the user's consent (restricted youtube.readonly
  scope). Used once to learn *which* channels to track. ~1 quota unit.
- New uploads: read each channel's public RSS feed
  (https://www.youtube.com/feeds/videos.xml?channel_id=...). FREE — no API
  quota — so we never burn the 10k/day budget polling for new videos.
"""
import datetime
import xml.etree.ElementTree as ET
from urllib.request import Request, urlopen

import requests

from core import config

OAUTH_SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
]
_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth"
_TOKEN_URL = "https://oauth2.googleapis.com/token"
_RSS = "https://www.youtube.com/feeds/videos.xml?channel_id={cid}"
_YT_NS = {"a": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015"}


# --- OAuth ---------------------------------------------------------------

def build_auth_url(state: str) -> str:
    from urllib.parse import urlencode

    params = {
        "client_id": config.GOOGLE_OAUTH_CLIENT_ID,
        "redirect_uri": config.OAUTH_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(OAUTH_SCOPES),
        "access_type": "offline",
        "include_granted_scopes": "true",
        "prompt": "consent",
        "state": state,
    }
    return f"{_AUTH_BASE}?{urlencode(params)}"


def exchange_code(code: str) -> dict:
    """Exchange an auth code for tokens + the user's identity."""
    resp = requests.post(
        _TOKEN_URL,
        data={
            "code": code,
            "client_id": config.GOOGLE_OAUTH_CLIENT_ID,
            "client_secret": config.GOOGLE_OAUTH_CLIENT_SECRET,
            "redirect_uri": config.OAUTH_REDIRECT_URI,
            "grant_type": "authorization_code",
        },
        timeout=20,
    )
    resp.raise_for_status()
    tokens = resp.json()
    identity = _userinfo(tokens["access_token"])
    expiry = datetime.datetime.utcnow() + datetime.timedelta(seconds=tokens.get("expires_in", 3600))
    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens.get("refresh_token"),
        "token_expiry": expiry,
        "google_sub": identity.get("sub"),
        "email": identity.get("email"),
    }


def refresh_access_token(refresh_token: str) -> dict:
    resp = requests.post(
        _TOKEN_URL,
        data={
            "refresh_token": refresh_token,
            "client_id": config.GOOGLE_OAUTH_CLIENT_ID,
            "client_secret": config.GOOGLE_OAUTH_CLIENT_SECRET,
            "grant_type": "refresh_token",
        },
        timeout=20,
    )
    resp.raise_for_status()
    tokens = resp.json()
    expiry = datetime.datetime.utcnow() + datetime.timedelta(seconds=tokens.get("expires_in", 3600))
    return {"access_token": tokens["access_token"], "token_expiry": expiry}


def _userinfo(access_token: str) -> dict:
    resp = requests.get(
        "https://openidconnect.googleapis.com/v1/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=20,
    )
    resp.raise_for_status()
    return resp.json()


# --- Subscriptions (OAuth, ~1 unit/page) ---------------------------------

def get_subscriptions(access_token: str, max_channels: int = 200) -> list[dict]:
    """Return [{channel_id, title}] for the authenticated user's subscriptions."""
    channels: list[dict] = []
    page_token = None
    while len(channels) < max_channels:
        params = {
            "part": "snippet",
            "mine": "true",
            "maxResults": 50,
            "order": "alphabetical",
        }
        if page_token:
            params["pageToken"] = page_token
        resp = requests.get(
            "https://www.googleapis.com/youtube/v3/subscriptions",
            headers={"Authorization": f"Bearer {access_token}"},
            params=params,
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()
        for item in data.get("items", []):
            sn = item["snippet"]
            channels.append({
                "channel_id": sn["resourceId"]["channelId"],
                "title": sn["title"],
            })
        page_token = data.get("nextPageToken")
        if not page_token:
            break
    return channels[:max_channels]


# --- New uploads (FREE via RSS) ------------------------------------------

def get_recent_uploads(channel_id: str, since_hours: int = 24, limit: int = 5) -> list[dict]:
    """Recent uploads for a channel via its public RSS feed. No API quota."""
    req = Request(_RSS.format(cid=channel_id), headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urlopen(req, timeout=20) as r:
            raw = r.read()
    except Exception as e:
        return [{"error": f"Could not read feed for {channel_id}: {e}"}]

    cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=since_hours)
    videos = []
    root = ET.fromstring(raw)
    channel_title = root.findtext("a:title", default="", namespaces=_YT_NS)
    for entry in root.findall("a:entry", _YT_NS):
        published_str = entry.findtext("a:published", default="", namespaces=_YT_NS)
        try:
            published = datetime.datetime.fromisoformat(published_str)
        except ValueError:
            continue
        if published < cutoff:
            continue
        videos.append({
            "channel_id": channel_id,
            "channel_title": channel_title,
            "video_id": entry.findtext("yt:videoId", default="", namespaces=_YT_NS),
            "title": entry.findtext("a:title", default="", namespaces=_YT_NS),
            "published": published_str,
            "url": f"https://www.youtube.com/watch?v={entry.findtext('yt:videoId', default='', namespaces=_YT_NS)}",
        })
        if len(videos) >= limit:
            break
    return videos
