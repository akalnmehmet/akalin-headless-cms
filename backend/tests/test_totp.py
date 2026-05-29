import pytest
import pyotp
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APIClient
from apps.totp.models import UserTOTP

User = get_user_model()

LOGIN_URL = "/api/auth/login/"
VERIFY_URL = "/api/auth/totp-verify/"
SETUP_URL = "/api/auth/totp-setup/"
DISABLE_URL = "/api/auth/totp-disable/"
STATUS_URL = "/api/auth/totp-status/"

@pytest.fixture
def client():
    return APIClient()

@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username="totpadmin",
        password="securepass99!",
        email="totpadmin@test.com",
    )

def test_login_no_2fa(client, admin_user):
    resp = client.post(LOGIN_URL, {"username": "totpadmin", "password": "securepass99!"}, format="json")
    assert resp.status_code == 200
    assert "access" in resp.data
    assert "refresh" in resp.data

def test_login_invalid_credentials(client, admin_user):
    resp = client.post(LOGIN_URL, {"username": "totpadmin", "password": "wrongpassword"}, format="json")
    assert resp.status_code == 401

def test_setup_unauthenticated(client):
    resp = client.get(SETUP_URL)
    assert resp.status_code == 401

def test_setup_and_verify_flow(client, admin_user):
    # Authenticate client
    client.force_authenticate(user=admin_user)

    # 1. Get status - should be False
    status_resp = client.get(STATUS_URL)
    assert status_resp.status_code == 200
    assert status_resp.data["is_active"] is False

    # 2. Setup GET - generates new secret and qr_image
    setup_resp = client.get(SETUP_URL)
    assert setup_resp.status_code == 200
    assert setup_resp.data["is_active"] is False
    assert "secret" in setup_resp.data
    assert "qr_image" in setup_resp.data

    secret = setup_resp.data["secret"]
    totp = pyotp.TOTP(secret)
    valid_code = totp.now()

    # 3. Setup POST with invalid code
    bad_verify_resp = client.post(SETUP_URL, {"code": "000000"}, format="json")
    assert bad_verify_resp.status_code == 400

    # 4. Setup POST with valid code to activate
    verify_resp = client.post(SETUP_URL, {"code": valid_code}, format="json")
    assert verify_resp.status_code == 200
    assert verify_resp.data["detail"] == "2FA başarıyla etkinleştirildi."

    # 5. Get status - should be True now
    status_resp = client.get(STATUS_URL)
    assert status_resp.status_code == 200
    assert status_resp.data["is_active"] is True

    # 6. Login now requires 2FA
    client.force_authenticate(user=None) # clear auth
    login_resp = client.post(LOGIN_URL, {"username": "totpadmin", "password": "securepass99!"}, format="json")
    assert login_resp.status_code == 200
    assert login_resp.data["requires_2fa"] is True
    assert "session_key" in login_resp.data

    session_key = login_resp.data["session_key"]

    # 7. Verify login with bad code
    verify_login_resp = client.post(VERIFY_URL, {"session_key": session_key, "code": "000000"}, format="json")
    assert verify_login_resp.status_code == 400

    # 8. Verify login with good code
    # Clear verify cache block if any, but since it is standard run, just get the code
    valid_code = totp.now()
    verify_login_resp = client.post(VERIFY_URL, {"session_key": session_key, "code": valid_code}, format="json")
    assert verify_login_resp.status_code == 200
    assert "access" in verify_login_resp.data

    # 9. Test Setup GET when already active
    client.force_authenticate(user=admin_user)
    setup_active_resp = client.get(SETUP_URL)
    assert setup_active_resp.status_code == 200
    assert setup_active_resp.data["is_active"] is True

    # 10. Disable 2FA with bad code
    disable_resp = client.post(DISABLE_URL, {"code": "000000"}, format="json")
    assert disable_resp.status_code == 400

    # 11. Disable 2FA with good code
    valid_code = totp.now()
    disable_resp = client.post(DISABLE_URL, {"code": valid_code}, format="json")
    assert disable_resp.status_code == 200
    assert disable_resp.data["detail"] == "2FA devre dışı bırakıldı."

    # 12. Check status again - should be False
    fresh_user = User.objects.get(pk=admin_user.pk)
    client.force_authenticate(user=fresh_user)
    status_resp = client.get(STATUS_URL)
    assert status_resp.data["is_active"] is False

def test_verify_session_expired(client):
    resp = client.post(VERIFY_URL, {"session_key": "expired_key", "code": "123456"}, format="json")
    assert resp.status_code == 400

def test_disable_not_setup(client, admin_user):
    client.force_authenticate(user=admin_user)
    resp = client.post(DISABLE_URL, {"code": "123456"}, format="json")
    assert resp.status_code == 400
    assert resp.data["detail"] == "2FA zaten devre dışı."

def test_post_setup_no_device(client, admin_user):
    client.force_authenticate(user=admin_user)
    resp = client.post(SETUP_URL, {"code": "123456"}, format="json")
    assert resp.status_code == 400
