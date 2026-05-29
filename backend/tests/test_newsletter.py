import pytest
from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from rest_framework.test import APIClient
from apps.newsletter.models import Subscriber

User = get_user_model()

SUBSCRIBE_URL = "/api/newsletter/subscribe/"
CONFIRM_URL_PREFIX = "/api/newsletter/confirm/"
UNSUBSCRIBE_URL_PREFIX = "/api/newsletter/unsubscribe/"
LIST_URL = "/api/newsletter/subscribers/"
TEST_SEND_URL = "/api/newsletter/test-send/"

@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()

@pytest.fixture
def client():
    return APIClient()

@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username="newsadmin",
        password="securepass99!",
        email="newsadmin@test.com",
    )

def test_subscribe_success(client, db):
    assert len(mail.outbox) == 0
    resp = client.post(SUBSCRIBE_URL, {"email": "subscriber@example.com"}, format="json")
    assert resp.status_code == 201
    assert Subscriber.objects.filter(email="subscriber@example.com").exists()
    assert len(mail.outbox) == 1
    assert "aboneliğinizi onaylayın" in mail.outbox[0].subject

def test_subscribe_invalid_email(client, db):
    resp = client.post(SUBSCRIBE_URL, {"email": "invalidemail"}, format="json")
    assert resp.status_code == 400

def test_subscribe_already_active(client, db):
    Subscriber.objects.create(email="active@example.com", is_active=True)
    resp = client.post(SUBSCRIBE_URL, {"email": "active@example.com"}, format="json")
    assert resp.status_code == 409

def test_subscribe_inactive_resends_confirmation(client, db):
    sub = Subscriber.objects.create(email="inactive@example.com", is_active=False)
    original_token = sub.token
    
    resp = client.post(SUBSCRIBE_URL, {"email": "inactive@example.com"}, format="json")
    assert resp.status_code == 201
    
    sub.refresh_from_db()
    assert sub.token != original_token
    assert len(mail.outbox) == 1

def test_confirm_subscriber(client, db):
    sub = Subscriber.objects.create(email="verify@example.com", is_active=False)
    confirm_url = f"{CONFIRM_URL_PREFIX}{sub.token}/"
    
    resp = client.get(confirm_url)
    assert resp.status_code == 302
    assert "newsletter=confirmed" in resp.url
    
    sub.refresh_from_db()
    assert sub.is_active is True
    assert any("hoş geldiniz" in m.subject.lower() for m in mail.outbox)

def test_confirm_invalid_token(client, db):
    confirm_url = f"{CONFIRM_URL_PREFIX}invalidtoken/"
    resp = client.get(confirm_url)
    assert resp.status_code == 302
    assert "newsletter=invalid" in resp.url

def test_unsubscribe(client, db):
    sub = Subscriber.objects.create(email="unsub@example.com", is_active=True)
    unsub_url = f"{UNSUBSCRIBE_URL_PREFIX}{sub.token}/"
    
    resp = client.get(unsub_url)
    assert resp.status_code == 302
    assert "newsletter=unsubscribed" in resp.url
    
    sub.refresh_from_db()
    assert sub.is_active is False

def test_admin_subscriber_list(client, admin_user, db):
    Subscriber.objects.create(email="user1@example.com", is_active=True)
    Subscriber.objects.create(email="user2@example.com", is_active=False)
    
    client.force_authenticate(user=admin_user)
    resp = client.get(LIST_URL)
    assert resp.status_code == 200
    assert resp.data["count"] == 2

def test_admin_subscriber_delete(client, admin_user, db):
    sub = Subscriber.objects.create(email="delete@example.com")
    
    client.force_authenticate(user=admin_user)
    delete_url = f"{LIST_URL}{sub.id}/"
    resp = client.delete(delete_url)
    assert resp.status_code == 204
    assert not Subscriber.objects.filter(email="delete@example.com").exists()

def test_admin_test_send_success(client, admin_user, db):
    client.force_authenticate(user=admin_user)
    assert len(mail.outbox) == 0
    resp = client.post(TEST_SEND_URL, {"email": "test-recipient@example.com"}, format="json")
    assert resp.status_code == 200
    assert len(mail.outbox) == 1
    assert "[Test]" in mail.outbox[0].subject

def test_admin_test_send_invalid_email(client, admin_user, db):
    client.force_authenticate(user=admin_user)
    resp = client.post(TEST_SEND_URL, {"email": "bademail"}, format="json")
    assert resp.status_code == 400
