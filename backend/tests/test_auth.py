"""
JWT kimlik doğrulama akışı testleri.
Kapsam: login, token refresh, logout (blacklist), yetkisiz erişim.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

TOKEN_URL     = "/api/token/"
REFRESH_URL   = "/api/token/refresh/"
BLACKLIST_URL = "/api/token/blacklist/"
ADMIN_POSTS   = "/api/admin/posts/"


# ── Fixture'lar ────────────────────────────────────────────────────────────

@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username="testadmin",
        password="securepass99!",
        email="admin@test.com",
    )


@pytest.fixture
def regular_user(db):
    return User.objects.create_user(
        username="regularuser",
        password="userpass123",
    )


@pytest.fixture
def token_pair(client, admin_user):
    """Admin için geçerli access + refresh token çifti döner."""
    resp = client.post(TOKEN_URL, {"username": "testadmin", "password": "securepass99!"}, format="json")
    assert resp.status_code == 200
    return resp.data


# ── Login testleri ─────────────────────────────────────────────────────────

class TestLogin:
    def test_valid_credentials_returns_tokens(self, client, admin_user):
        resp = client.post(TOKEN_URL, {"username": "testadmin", "password": "securepass99!"}, format="json")
        assert resp.status_code == 200
        assert "access" in resp.data
        assert "refresh" in resp.data

    def test_wrong_password_returns_401(self, client, admin_user):
        resp = client.post(TOKEN_URL, {"username": "testadmin", "password": "wrongpass"}, format="json")
        assert resp.status_code == 401

    def test_nonexistent_user_returns_401(self, client, db):
        resp = client.post(TOKEN_URL, {"username": "ghost", "password": "anything"}, format="json")
        assert resp.status_code == 401

    def test_missing_fields_returns_400(self, client, db):
        resp = client.post(TOKEN_URL, {"username": "testadmin"}, format="json")
        assert resp.status_code == 400

    def test_access_token_grants_admin_access(self, client, token_pair):
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_pair['access']}")
        resp = client.get(ADMIN_POSTS)
        assert resp.status_code == 200

    def test_no_token_returns_401_on_admin_endpoint(self, client, db):
        resp = client.get(ADMIN_POSTS)
        assert resp.status_code == 401

    def test_regular_user_cannot_access_admin(self, client, regular_user):
        resp = client.post(TOKEN_URL, {"username": "regularuser", "password": "userpass123"}, format="json")
        assert resp.status_code == 200
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")
        # Admin endpoint'i sadece is_staff=True kullanıcılara açık
        admin_resp = client.get(ADMIN_POSTS)
        assert admin_resp.status_code == 403


# ── Refresh token testleri ─────────────────────────────────────────────────

class TestRefreshToken:
    def test_valid_refresh_returns_new_access(self, client, token_pair):
        resp = client.post(REFRESH_URL, {"refresh": token_pair["refresh"]}, format="json")
        assert resp.status_code == 200
        assert "access" in resp.data

    def test_new_access_token_works(self, client, token_pair):
        refresh_resp = client.post(REFRESH_URL, {"refresh": token_pair["refresh"]}, format="json")
        new_access = refresh_resp.data["access"]
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {new_access}")
        resp = client.get(ADMIN_POSTS)
        assert resp.status_code == 200

    def test_invalid_refresh_returns_401(self, client, db):
        resp = client.post(REFRESH_URL, {"refresh": "invalid.token.here"}, format="json")
        assert resp.status_code == 401

    def test_missing_refresh_returns_400(self, client, db):
        resp = client.post(REFRESH_URL, {}, format="json")
        assert resp.status_code == 400


# ── Logout / Blacklist testleri ────────────────────────────────────────────

class TestLogout:
    def test_blacklist_refresh_token(self, client, token_pair):
        """Refresh token blacklist'e eklenince tekrar kullanılamaz."""
        # Blacklist et
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_pair['access']}")
        resp = client.post(BLACKLIST_URL, {"refresh": token_pair["refresh"]}, format="json")
        assert resp.status_code == 200

        # Aynı refresh ile yeni access almaya çalış → başarısız olmalı
        client.credentials()  # credentials temizle
        reuse = client.post(REFRESH_URL, {"refresh": token_pair["refresh"]}, format="json")
        assert reuse.status_code == 401

    def test_blacklist_invalid_token_returns_error(self, client, db):
        """Geçersiz token blacklist endpoint'inde hata döndürür."""
        resp = client.post(BLACKLIST_URL, {"refresh": "invalid.refresh.token"}, format="json")
        # SimpleJWT 400 veya 401 döndürür
        assert resp.status_code in (400, 401)
