"""
IP → Coğrafya lookup.

ip-api.com ücretsiz endpointi kullanır (ticari olmayan, 45 istek/dakika).
IP hiçbir zaman veritabanına kaydedilmez.
Sonuç Django cache'inde günlük salt ile hash'lenerek 24 saat saklanır.
"""
import hashlib
import logging
from datetime import date
from typing import TypedDict

import requests
from django.core.cache import cache

logger = logging.getLogger(__name__)

_TIMEOUT = 3  # saniye — yüksek latency durumunda isteği bloklamamak için kısa tut
_CACHE_TTL = 86_400  # 24 saat


class GeoResult(TypedDict):
    country_code: str
    country_name: str
    city:         str
    lat:          float | None
    lng:          float | None


_EMPTY: GeoResult = {
    "country_code": "",
    "country_name": "",
    "city":         "",
    "lat":          None,
    "lng":          None,
}


def _make_cache_key(ip: str) -> str:
    """IP'yi günlük salt ile hash'le — gün geçince kendi kendine sıfırlanır."""
    raw = f"{ip}:{date.today().isoformat()}"
    digest = hashlib.sha256(raw.encode()).hexdigest()[:20]
    return f"ip_geo_{digest}"


def _is_private(ip: str) -> bool:
    """Yerel/loopback IP'leri geo lookup'a gönderme."""
    if not ip:
        return True
    return ip.startswith(("127.", "10.", "172.16.", "172.17.", "172.18.",
                          "172.19.", "172.2", "192.168.", "::1"))


def get_geo(ip: str) -> GeoResult:
    """
    Verilen IP için ülke, şehir ve koordinat döndürür.
    Hata durumunda boş GeoResult döndürür; exception fırlatmaz.
    """
    ip = ip.strip()

    if _is_private(ip):
        return _EMPTY

    cache_key = _make_cache_key(ip)
    cached = cache.get(cache_key)
    if cached is not None:
        return cached  # type: ignore[return-value]

    try:
        resp = requests.get(
            f"http://ip-api.com/json/{ip}",
            params={"fields": "status,country,countryCode,city,lat,lon"},
            timeout=_TIMEOUT,
        )
        data = resp.json()
        if data.get("status") != "success":
            cache.set(cache_key, _EMPTY, _CACHE_TTL)
            return _EMPTY

        result: GeoResult = {
            "country_code": data.get("countryCode", ""),
            "country_name": data.get("country",     ""),
            "city":         data.get("city",         ""),
            "lat":          data.get("lat"),
            "lng":          data.get("lon"),
        }
        cache.set(cache_key, result, _CACHE_TTL)
        return result

    except Exception as exc:
        logger.debug("IP geo lookup başarısız: %s — %s", ip, exc)
        cache.set(cache_key, _EMPTY, 300)  # 5 dk sonra tekrar dene
        return _EMPTY


def get_client_ip(request) -> str:
    """Gerçek istemci IP'sini X-Forwarded-For başlığından al."""
    xff = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")
