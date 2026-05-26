import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.projects.models import Project

User = get_user_model()


# ── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username="admin_proj", password="testpass123", email="admin_proj@test.com"
    )


@pytest.fixture
def auth_client(api_client, admin_user):
    response = api_client.post(
        "/api/token/",
        {"username": "admin_proj", "password": "testpass123"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
    return api_client


@pytest.fixture
def active_project(db):
    return Project.objects.create(
        title="Test Projesi",
        description="Test proje açıklaması.",
        tech_stack=["Django", "React"],
        status=Project.Status.ACTIVE,
        sort_order=0,
    )


@pytest.fixture
def two_projects(db):
    p1 = Project.objects.create(
        title="Proje A", description=".", tech_stack=[], sort_order=0
    )
    p2 = Project.objects.create(
        title="Proje B", description=".", tech_stack=[], sort_order=1
    )
    return p1, p2


# ── Public endpoint testleri ─────────────────────────────────────────────────

@pytest.mark.django_db
def test_public_project_list(api_client, active_project):
    response = api_client.get("/api/projects/")
    assert response.status_code == 200
    assert response.data["count"] == 1


@pytest.mark.django_db
def test_archived_project_not_in_public_list(api_client, db):
    Project.objects.create(
        title="Arşiv Proje",
        description=".",
        tech_stack=[],
        status=Project.Status.ARCHIVED,
    )
    response = api_client.get("/api/projects/")
    assert response.data["count"] == 0


@pytest.mark.django_db
def test_in_progress_project_visible_in_public_list(api_client, db):
    Project.objects.create(
        title="Devam Eden Proje",
        description=".",
        tech_stack=[],
        status=Project.Status.IN_PROGRESS,
    )
    response = api_client.get("/api/projects/")
    assert response.data["count"] == 1


@pytest.mark.django_db
def test_public_project_detail_by_slug(api_client, active_project):
    response = api_client.get(f"/api/projects/{active_project.slug}/")
    assert response.status_code == 200
    assert response.data["title"] == "Test Projesi"


# ── Admin CRUD testleri ───────────────────────────────────────────────────────

@pytest.mark.django_db
def test_admin_can_create_project(auth_client):
    response = auth_client.post(
        "/api/admin/projects/",
        {
            "title": "Yeni Proje",
            "description": "Açıklama.",
            "tech_stack": ["Python", "Docker"],
            "status": "ACTIVE",
            "sort_order": 0,
        },
        format="json",
    )
    assert response.status_code == 201
    assert Project.objects.filter(title="Yeni Proje").exists()


@pytest.mark.django_db
def test_admin_can_update_project(auth_client, active_project):
    response = auth_client.patch(
        f"/api/admin/projects/{active_project.id}/",
        {"title": "Güncellenmiş Proje"},
        format="json",
    )
    assert response.status_code == 200
    active_project.refresh_from_db()
    assert active_project.title == "Güncellenmiş Proje"


@pytest.mark.django_db
def test_delete_sets_archived(auth_client, active_project):
    response = auth_client.delete(f"/api/admin/projects/{active_project.id}/")
    assert response.status_code == 204
    active_project.refresh_from_db()
    assert active_project.status == Project.Status.ARCHIVED


@pytest.mark.django_db
def test_unauthenticated_cannot_create_project(api_client):
    response = api_client.post(
        "/api/admin/projects/",
        {"title": "İzinsiz Proje", "description": ".", "tech_stack": []},
        format="json",
    )
    assert response.status_code == 401


# ── Slug oto-oluşturma ────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_slug_auto_generated(db):
    project = Project.objects.create(
        title="Otomatik Slug",
        description=".",
        tech_stack=[],
    )
    assert project.slug != ""
    assert " " not in project.slug


# ── Reorder endpoint ─────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_reorder_projects(auth_client, two_projects):
    p1, p2 = two_projects
    response = auth_client.patch(
        "/api/admin/projects/reorder/",
        [
            {"id": str(p1.id), "sort_order": 10},
            {"id": str(p2.id), "sort_order": 5},
        ],
        format="json",
    )
    assert response.status_code == 200
    p1.refresh_from_db()
    p2.refresh_from_db()
    assert p1.sort_order == 10
    assert p2.sort_order == 5


@pytest.mark.django_db
def test_reorder_unauthenticated(api_client, two_projects):
    p1, p2 = two_projects
    response = api_client.patch(
        "/api/admin/projects/reorder/",
        [{"id": str(p1.id), "sort_order": 99}],
        format="json",
    )
    assert response.status_code == 401
