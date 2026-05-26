import io

import pytest
from django.contrib.auth import get_user_model
from PIL import Image
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username="admin2", password="testpass123", email="admin2@test.com"
    )


@pytest.fixture
def auth_client(api_client, admin_user):
    response = api_client.post(
        "/api/token/",
        {"username": "admin2", "password": "testpass123"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
    return api_client


def make_image_file(width=100, height=100, fmt="JPEG", size_kb=None):
    img = Image.new("RGB", (width, height), color=(255, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    if size_kb:
        buf = io.BytesIO(buf.getvalue() * (size_kb * 1024 // len(buf.getvalue()) + 1))
    buf.seek(0)
    buf.name = f"test.{fmt.lower()}"
    return buf


@pytest.mark.django_db
def test_upload_valid_image(auth_client):
    img_file = make_image_file()
    response = auth_client.post(
        "/api/admin/media/",
        {"file": img_file},
        format="multipart",
    )
    assert response.status_code == 201
    assert response.data["mime_type"] == "image/webp"


@pytest.mark.django_db
def test_upload_without_auth(api_client):
    img_file = make_image_file()
    response = api_client.post(
        "/api/admin/media/",
        {"file": img_file},
        format="multipart",
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_upload_invalid_mime_type(auth_client):
    buf = io.BytesIO(b"fake pdf content")
    buf.name = "test.pdf"
    response = auth_client.post(
        "/api/admin/media/",
        {"file": buf},
        format="multipart",
    )
    assert response.status_code == 400
    assert "Desteklenmeyen" in response.data["detail"]


@pytest.mark.django_db
def test_upload_no_file(auth_client):
    response = auth_client.post("/api/admin/media/", {}, format="multipart")
    assert response.status_code == 400
