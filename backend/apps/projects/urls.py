from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ProjectAdminViewSet, ProjectPublicViewSet

router = DefaultRouter()
router.register(r"projects", ProjectPublicViewSet, basename="project-public")
router.register(r"admin/projects", ProjectAdminViewSet, basename="project-admin")

urlpatterns = [
    path("", include(router.urls)),
]
