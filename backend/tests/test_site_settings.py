"""
SiteSettings singleton API testleri.
GET /api/site-settings/        → herkese açık
GET|PATCH /api/admin/site-settings/ → sadece admin
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.site_settings.models import SiteSettings

User = get_user_model()

PUBLIC_URL = "/api/site-settings/"
ADMIN_URL  = "/api/admin/site-settings/"


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username="settingsadmin", password="pass123!", email="s@test.com"
    )


@pytest.fixture
def auth_client(client, admin_user):
    resp = client.post("/api/token/", {"username": "settingsadmin", "password": "pass123!"}, format="json")
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")
    return client


@pytest.fixture
def settings_obj(db):
    return SiteSettings.load()


# ── Public endpoint ─────────────────────────────────────────────────────────

class TestPublicSiteSettings:
    def test_get_returns_200(self, client, settings_obj):
        resp = client.get(PUBLIC_URL)
        assert resp.status_code == 200

    def test_response_contains_expected_fields(self, client, settings_obj):
        resp = client.get(PUBLIC_URL)
        for field in ("owner_name", "owner_title", "owner_bio", "status_text", "status_active", "skills"):
            assert field in resp.data

    def test_singleton_created_on_first_access(self, db, client):
        assert SiteSettings.objects.count() == 0
        client.get(PUBLIC_URL)
        assert SiteSettings.objects.count() == 1

    def test_skills_is_list(self, client, settings_obj):
        resp = client.get(PUBLIC_URL)
        assert isinstance(resp.data["skills"], list)


# ── Admin endpoint ──────────────────────────────────────────────────────────

class TestAdminSiteSettings:
    def test_unauthenticated_get_returns_401(self, client, settings_obj):
        resp = client.get(ADMIN_URL)
        assert resp.status_code == 401

    def test_admin_can_get(self, auth_client, settings_obj):
        resp = auth_client.get(ADMIN_URL)
        assert resp.status_code == 200

    def test_admin_can_patch_owner_name(self, auth_client, settings_obj):
        resp = auth_client.patch(ADMIN_URL, {"owner_name": "Yeni İsim"}, format="json")
        assert resp.status_code == 200
        assert resp.data["owner_name"] == "Yeni İsim"

    def test_patch_persists_to_db(self, auth_client, settings_obj):
        auth_client.patch(ADMIN_URL, {"owner_title": "DevOps Mühendisi"}, format="json")
        updated = SiteSettings.objects.get(pk=1)
        assert updated.owner_title == "DevOps Mühendisi"

    def test_admin_can_patch_skills(self, auth_client, settings_obj):
        new_skills = ["Go", "Rust", "WebAssembly"]
        resp = auth_client.patch(ADMIN_URL, {"skills": new_skills}, format="json")
        assert resp.status_code == 200
        assert resp.data["skills"] == new_skills

    def test_admin_can_patch_status_active(self, auth_client, settings_obj):
        resp = auth_client.patch(ADMIN_URL, {"status_active": False}, format="json")
        assert resp.status_code == 200
        assert resp.data["status_active"] is False

    def test_put_also_works(self, auth_client, settings_obj):
        resp = auth_client.put(ADMIN_URL, {"owner_name": "PUT Test"}, format="json")
        assert resp.status_code == 200
        assert resp.data["owner_name"] == "PUT Test"

    def test_singleton_only_one_row(self, auth_client, settings_obj):
        auth_client.patch(ADMIN_URL, {"owner_name": "A"}, format="json")
        auth_client.patch(ADMIN_URL, {"owner_name": "B"}, format="json")
        assert SiteSettings.objects.count() == 1
