from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CareerAdminViewSet, CareerPublicViewSet

router = DefaultRouter()
router.register(r"career", CareerPublicViewSet, basename="career-public")
router.register(r"admin/career", CareerAdminViewSet, basename="career-admin")

urlpatterns = [
    path("", include(router.urls)),
]
