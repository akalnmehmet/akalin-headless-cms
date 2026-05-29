from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminCommentViewSet,
    CategoryViewSet,
    PostAdminViewSet,
    PostCommentListView,
    PostPublicViewSet,
    PostReactionView,
    PostViewCountView,
    RssFeedView,
    SeriesViewSet,
    TagViewSet,
)

router = DefaultRouter()
router.register(r"posts",           PostPublicViewSet,   basename="post-public")
router.register(r"admin/posts",     PostAdminViewSet,    basename="post-admin")
router.register(r"admin/comments",  AdminCommentViewSet, basename="comment-admin")
router.register(r"categories",      CategoryViewSet,     basename="category")
router.register(r"tags",            TagViewSet,          basename="tag")
router.register(r"series",          SeriesViewSet,       basename="series")

urlpatterns = [
    path("", include(router.urls)),
    path("posts/<slug:slug>/view/",     PostViewCountView.as_view(),   name="post-view-count"),
    path("posts/<slug:slug>/comments/", PostCommentListView.as_view(), name="post-comments"),
    path("posts/<slug:slug>/react/",    PostReactionView.as_view(),    name="post-react"),
]
