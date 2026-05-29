import pytest
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APIClient
from apps.analytics.models import PageView
from apps.analytics.views import _detect_device, _parse_referrer
from apps.analytics.geo import get_client_ip, get_geo

User = get_user_model()

TRACK_URL = "/api/analytics/track/"
STATS_URL = "/api/analytics/stats/"

@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()

@pytest.fixture
def client():
    return APIClient()

@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username="statsadmin",
        password="securepass99!",
        email="statsadmin@test.com",
    )

def test_detect_device():
    assert _detect_device(None) == "unknown"
    assert _detect_device("Googlebot/2.1 (+http://www.google.com/bot.html)") == "bot"
    assert _detect_device("Mozilla/5.0 (iPad; CPU OS 12_2 like Mac OS X)") == "tablet"
    assert _detect_device("Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X)") == "mobile"
    assert _detect_device("Mozilla/5.0 (Windows NT 10.0; Win64; x64)") == "desktop"

def test_parse_referrer():
    assert _parse_referrer("") == "direct"
    assert _parse_referrer("https://www.google.com/search?q=test") == "google.com"
    assert _parse_referrer("invalid-url-$$") == "direct"

def test_get_client_ip():
    class FakeRequest:
        def __init__(self, meta):
            self.META = meta

    req1 = FakeRequest({"HTTP_X_FORWARDED_FOR": "203.0.113.195, 70.41.3.18, 150.172.238.178"})
    assert get_client_ip(req1) == "203.0.113.195"

    req2 = FakeRequest({"REMOTE_ADDR": "192.168.1.1"})
    assert get_client_ip(req2) == "192.168.1.1"

def test_get_geo_private_ip(db):
    res = get_geo("127.0.0.1")
    assert res["country_code"] == ""

@patch("apps.analytics.geo.requests.get")
def test_get_geo_success(mock_get, db):
    class FakeResponse:
        def json(self):
            return {
                "status": "success",
                "countryCode": "TR",
                "country": "Turkey",
                "city": "Istanbul",
                "lat": 41.0,
                "lon": 29.0
            }
    mock_get.return_value = FakeResponse()
    
    res = get_geo("8.8.8.8")
    assert res["country_code"] == "TR"
    assert res["city"] == "Istanbul"

@patch("apps.analytics.geo.requests.get")
def test_get_geo_fail(mock_get, db):
    class FakeResponse:
        def json(self):
            return {"status": "fail"}
    mock_get.return_value = FakeResponse()
    
    res = get_geo("8.8.8.8")
    assert res["country_code"] == ""

@patch("apps.analytics.views.get_geo")
def test_track_view_success(mock_geo, client, db):
    mock_geo.return_value = {
        "country_code": "TR",
        "country_name": "Turkey",
        "city": "Istanbul",
        "lat": 41.0,
        "lng": 29.0
    }
    resp = client.post(
        TRACK_URL,
        {"path": "/tr/blog/my-post", "referrer": "https://www.google.com"},
        format="json",
        HTTP_USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    )
    assert resp.status_code == 200
    assert PageView.objects.filter(path="/tr/blog/my-post").exists()

def test_track_view_bot_skipped(client, db):
    resp = client.post(
        TRACK_URL,
        {"path": "/tr/blog/my-post", "referrer": "https://www.google.com"},
        format="json",
        HTTP_USER_AGENT="Googlebot"
    )
    assert resp.status_code == 200
    assert not PageView.objects.filter(path="/tr/blog/my-post").exists()

def test_track_view_admin_skipped(client, db):
    resp = client.post(
        TRACK_URL,
        {"path": "/admin/posts", "referrer": ""},
        format="json"
    )
    assert resp.status_code == 200
    assert not PageView.objects.filter(path="/admin/posts").exists()

def test_analytics_stats_unauthorized(client):
    resp = client.get(STATS_URL)
    assert resp.status_code == 401

def test_analytics_stats_success(client, admin_user, db):
    PageView.objects.create(path="/tr", referrer="google.com", country_code="TR")
    PageView.objects.create(path="/cv-download", referrer="direct", country_code="TR")
    
    client.force_authenticate(user=admin_user)
    resp = client.get(STATS_URL, {"days": "10"})
    assert resp.status_code == 200
    assert resp.data["total_views"] == 2
    assert resp.data["cv_downloads"] == 1
    assert len(resp.data["top_pages"]) > 0
