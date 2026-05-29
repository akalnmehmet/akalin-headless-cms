import re
from datetime import timedelta
from urllib.parse import urlparse

from django.db.models import Count
from django.db.models.functions import ExtractHour, TruncDate
from django.utils import timezone
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .geo import get_client_ip, get_geo
from .models import PageView

# Bot UA parçaları — bunları kaydetme
_BOT_RE = re.compile(
    r"bot|crawl|spider|slurp|mediapartners|facebookexternalhit|"
    r"whatsapp|telegrambot|twitterbot|linkedinbot|discordbot",
    re.IGNORECASE,
)

_ADMIN_PATHS = re.compile(r"^/admin")


def _detect_device(ua: str) -> str:
    if not ua:
        return "unknown"
    ua_lower = ua.lower()
    if _BOT_RE.search(ua_lower):
        return "bot"
    if "tablet" in ua_lower or "ipad" in ua_lower:
        return "tablet"
    if "mobile" in ua_lower or "iphone" in ua_lower or "android" in ua_lower:
        return "mobile"
    return "desktop"


def _parse_referrer(raw: str) -> str:
    if not raw:
        return "direct"
    try:
        host = urlparse(raw).netloc.lower()
        host = host.lstrip("www.")
        return host or "direct"
    except Exception:
        return "direct"


class TrackView(APIView):
    """
    POST /api/analytics/track/
    Body: { "path": "/tr/blog/...", "referrer": "https://..." }

    - Admin sayfaları takip edilmez
    - Bot UA'ları takip edilmez
    - IP asla saklanmaz
    """

    permission_classes = [AllowAny]
    throttle_classes = []  # Rate limit yok (frontend her sayfada çağırır)

    def post(self, request):
        path = (request.data.get("path") or "").strip()[:500]
        raw_ref = (request.data.get("referrer") or "").strip()[:500]
        ua = request.META.get("HTTP_USER_AGENT", "")

        # Admin sayfalarını ve boş path'i atla
        if not path or _ADMIN_PATHS.match(path):
            return Response({"ok": True})

        device = _detect_device(ua)
        if device == "bot":
            return Response({"ok": True})

        referrer = _parse_referrer(raw_ref)
        ip = get_client_ip(request)
        geo = get_geo(ip)

        PageView.objects.create(
            path=path,
            referrer=referrer,
            country_code=geo["country_code"],
            country_name=geo["country_name"],
            city=geo["city"],
            lat=geo["lat"],
            lng=geo["lng"],
            device_type=device,
        )
        return Response({"ok": True})


class AnalyticsStatsView(APIView):
    """
    GET /api/analytics/stats/?days=30
    Sadece admin erişebilir.
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            days = max(1, min(int(request.query_params.get("days", 30)), 365))
        except (ValueError, TypeError):
            days = 30

        since = timezone.now() - timedelta(days=days)
        qs = PageView.objects.filter(timestamp__gte=since)

        # ── Özet ──────────────────────────────────────────────────────────────
        total_views = qs.count()

        # ── Günlük görüntüleme (son N gün) ────────────────────────────────────
        views_by_day_qs = (
            qs.annotate(date=TruncDate("timestamp"))
            .values("date")
            .annotate(count=Count("id"))
            .order_by("date")
        )
        views_by_day = [
            {"date": str(r["date"]), "count": r["count"]}
            for r in views_by_day_qs
        ]

        # ── Saatlik dağılım (0–23) ─────────────────────────────────────────────
        views_by_hour_qs = (
            qs.annotate(hour=ExtractHour("timestamp"))
            .values("hour")
            .annotate(count=Count("id"))
            .order_by("hour")
        )
        hour_map = {r["hour"]: r["count"] for r in views_by_hour_qs}
        views_by_hour = [{"hour": h, "count": hour_map.get(h, 0)} for h in range(24)]

        # ── En çok görüntülenen sayfalar ───────────────────────────────────────
        top_pages_qs = (
            qs.values("path")
            .annotate(count=Count("id"))
            .order_by("-count")[:20]
        )
        top_pages = list(top_pages_qs)

        # ── Referrer dağılımı ──────────────────────────────────────────────────
        referrers_qs = (
            qs.values("referrer")
            .annotate(count=Count("id"))
            .order_by("-count")[:15]
        )
        referrers = list(referrers_qs)

        # ── Cihaz dağılımı ─────────────────────────────────────────────────────
        devices_qs = (
            qs.exclude(device_type="bot")
            .values("device_type")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        devices = list(devices_qs)

        # ── Konum verileri (harita için) ───────────────────────────────────────
        # Şehir bazlı grupla; koordinat olarak ilk kaydın lat/lng'sini al
        locations_qs = (
            qs.exclude(country_code="")
            .values("country_code", "country_name", "city", "lat", "lng")
            .annotate(count=Count("id"))
            .order_by("-count")[:200]
        )
        # Aynı ülke+şehir için birden fazla koordinat olabilir — count'ları birleştir
        loc_map: dict[str, dict] = {}
        for r in locations_qs:
            key = f"{r['country_code']}:{r['city']}"
            if key not in loc_map:
                loc_map[key] = {
                    "country_code": r["country_code"],
                    "country_name": r["country_name"],
                    "city":         r["city"],
                    "lat":          r["lat"],
                    "lng":          r["lng"],
                    "count":        r["count"],
                }
            else:
                loc_map[key]["count"] += r["count"]
        locations = sorted(loc_map.values(), key=lambda x: x["count"], reverse=True)

        # Son 20 görüntüleme (live feed)
        recent_qs = qs.values(
            "path", "country_code", "country_name", "city",
            "device_type", "referrer", "timestamp"
        ).order_by("-timestamp")[:20]
        recent = [
            {**r, "timestamp": r["timestamp"].isoformat()}
            for r in recent_qs
        ]

        return Response({
            "period_days":   days,
            "total_views":   total_views,
            "views_by_day":  views_by_day,
            "views_by_hour": views_by_hour,
            "top_pages":     top_pages,
            "referrers":     referrers,
            "devices":       devices,
            "locations":     locations,
            "recent":        recent,
        })
