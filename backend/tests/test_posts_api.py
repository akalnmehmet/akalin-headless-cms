import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.posts.models import BlogPost

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username="admin", password="testpass123", email="admin@test.com"
    )


@pytest.fixture
def auth_client(api_client, admin_user):
    response = api_client.post(
        "/api/token/",
        {"username": "admin", "password": "testpass123"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
    return api_client


@pytest.fixture
def published_post(db):
    return BlogPost.objects.create(
        title="Test Yazısı",
        summary="Özet metin burada.",
        content_html="<p>İçerik</p>",
        status=BlogPost.Status.PUBLISHED,
    )


@pytest.mark.django_db
def test_public_post_list(api_client, published_post):
    response = api_client.get("/api/posts/")
    assert response.status_code == 200
    assert response.data["count"] == 1


@pytest.mark.django_db
def test_public_post_detail_by_slug(api_client, published_post):
    response = api_client.get(f"/api/posts/{published_post.slug}/")
    assert response.status_code == 200
    assert response.data["title"] == "Test Yazısı"


@pytest.mark.django_db
def test_draft_not_visible_to_public(api_client, db):
    BlogPost.objects.create(
        title="Taslak Yazı",
        summary="Özet",
        content_html="<p>İçerik</p>",
        status=BlogPost.Status.DRAFT,
    )
    response = api_client.get("/api/posts/")
    assert response.data["count"] == 0


@pytest.mark.django_db
def test_admin_can_create_post(auth_client):
    response = auth_client.post(
        "/api/admin/posts/",
        {
            "title": "Yeni Yazı",
            "summary": "Özet metin.",
            "content_html": "<p>İçerik buraya.</p>",
            "content_json": {},
            "status": "DRAFT",
        },
        format="json",
    )
    assert response.status_code == 201
    assert BlogPost.objects.filter(title="Yeni Yazı").exists()


@pytest.mark.django_db
def test_unauthenticated_cannot_create_post(api_client):
    response = api_client.post(
        "/api/admin/posts/",
        {"title": "Hacker", "summary": ".", "content_html": "", "content_json": {}},
        format="json",
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_delete_sets_archived_status(auth_client, published_post):
    response = auth_client.delete(f"/api/admin/posts/{published_post.id}/")
    assert response.status_code == 204
    published_post.refresh_from_db()
    assert published_post.status == BlogPost.Status.ARCHIVED


@pytest.mark.django_db
def test_xss_content_sanitized_on_save(db):
    post = BlogPost.objects.create(
        title="XSS Test",
        summary="Özet",
        content_html="<script>alert('xss')</script><p>Güvenli içerik</p>",
    )
    assert "<script>" not in post.content_html
    assert "<p>" in post.content_html


@pytest.mark.django_db
def test_slug_auto_generated(db):
    post = BlogPost.objects.create(
        title="Otomatik Slug Testi",
        summary="Özet",
        content_html="<p>İçerik</p>",
    )
    assert post.slug != ""
    assert " " not in post.slug


@pytest.mark.django_db
def test_jwt_token_obtain(api_client, admin_user):
    response = api_client.post(
        "/api/token/",
        {"username": "admin", "password": "testpass123"},
        format="json",
    )
    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data
