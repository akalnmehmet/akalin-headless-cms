from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, PostAdminViewSet, PostPublicViewSet, PostViewCountView, RssFeedView, TagViewSet

router = DefaultRouter()
router.register(r"posts", PostPublicViewSet, basename="post-public")
router.register(r"admin/posts", PostAdminViewSet, basename="post-admin")
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"tags", TagViewSet, basename="tag")

urlpatterns = [
    path("", include(router.urls)),
    path("posts/<slug:slug>/view/", PostViewCountView.as_view(), name="post-view-count"),
]
