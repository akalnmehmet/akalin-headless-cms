from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.vary import vary_on_headers
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BlogPost, Category, Tag
from .serializers import (
    CategorySerializer,
    PostAdminSerializer,
    PostDetailSerializer,
    PostListSerializer,
    TagSerializer,
)


class PostPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {"categories__slug": ["exact"], "tags__slug": ["exact"]}
    search_fields = ["title", "summary"]
    ordering_fields = ["created_at", "view_count"]
    ordering = ["-created_at"]
    lookup_field = "slug"

    def get_queryset(self):
        return (
            BlogPost.objects.filter(status=BlogPost.Status.PUBLISHED)
            .select_related("featured_image")
            .prefetch_related("categories", "tags")
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PostDetailSerializer
        return PostListSerializer

    @action(detail=True, methods=["get"])
    def related(self, request, slug=None):
        post = self.get_object()
        related = (
            BlogPost.objects.filter(
                status=BlogPost.Status.PUBLISHED,
                categories__in=post.categories.all(),
            )
            .exclude(pk=post.pk)
            .distinct()[:3]
        )
        serializer = PostListSerializer(related, many=True, context={"request": request})
        return Response(serializer.data)


class PostViewCountView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, slug):
        ip = request.META.get("REMOTE_ADDR", "unknown")
        cache_key = f"post_view_{slug}_{ip}"

        if cache.get(cache_key):
            return Response({"detail": "Zaten sayıldı."}, status=status.HTTP_200_OK)

        try:
            post = BlogPost.objects.filter(
                slug=slug, status=BlogPost.Status.PUBLISHED
            ).only("view_count").get()
        except BlogPost.DoesNotExist:
            return Response({"detail": "Bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        BlogPost.objects.filter(pk=post.pk).update(view_count=post.view_count + 1)
        cache.set(cache_key, True, timeout=86400)  # 24 saat
        return Response({"detail": "Sayıldı."}, status=status.HTTP_200_OK)


class PostAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = PostAdminSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status"]
    search_fields = ["title", "summary", "slug"]
    ordering_fields = ["created_at", "updated_at", "status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return (
            BlogPost.objects.all()
            .select_related("featured_image")
            .prefetch_related("categories", "tags")
        )

    def perform_destroy(self, instance):
        instance.status = BlogPost.Status.ARCHIVED
        instance.save(update_fields=["status"])


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
