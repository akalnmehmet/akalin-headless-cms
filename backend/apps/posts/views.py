import html
import textwrap
from email.utils import format_datetime

from django.conf import settings
from django.core.cache import cache
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.vary import vary_on_headers
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
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
        now = timezone.now()
        return (
            BlogPost.objects.filter(
                Q(status=BlogPost.Status.PUBLISHED) |
                Q(status=BlogPost.Status.DRAFT, publish_at__isnull=False, publish_at__lte=now)
            )
            .select_related("featured_image")
            .prefetch_related("categories", "tags")
        )

    def get_object(self):
        # Önizleme modu: admin auth gerektirir, status filtresi uygulanmaz
        if self.request.query_params.get("preview") == "1":
            if not (self.request.user and self.request.user.is_staff):
                raise PermissionDenied("Önizleme için admin girişi gereklidir.")
            qs = (
                BlogPost.objects.all()
                .select_related("featured_image")
                .prefetch_related("categories", "tags")
            )
            return get_object_or_404(qs, slug=self.kwargs.get(self.lookup_field))
        return super().get_object()

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

    @action(detail=False, methods=["post"])
    def publish_scheduled(self, request):
        """Zamanı gelmiş tüm taslak yazıları yayınlar."""
        now = timezone.now()
        updated = BlogPost.objects.filter(
            status=BlogPost.Status.DRAFT,
            publish_at__isnull=False,
            publish_at__lte=now,
        ).update(status=BlogPost.Status.PUBLISHED)
        return Response({"published": updated})


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = "slug"

    def get_permissions(self):
        """Okuma herkese açık; oluşturma/güncelleme/silme sadece admin."""
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminUser()]
        return [AllowAny()]


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    lookup_field = "slug"

    def get_permissions(self):
        """Okuma herkese açık; oluşturma/güncelleme/silme sadece admin."""
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminUser()]
        return [AllowAny()]


class RssFeedView(APIView):
    """
    /feed.xml — Yayınlanan blog yazıları için RSS 2.0 feed'i.
    Son 50 yazıyı döndürür; 1 saatlik cache ile hızlandırılmıştır.
    """

    permission_classes = [AllowAny]

    CACHE_KEY = "rss_feed_xml"
    CACHE_TIMEOUT = 3600  # 1 saat

    def get(self, request):
        cached = cache.get(self.CACHE_KEY)
        if cached:
            return HttpResponse(cached, content_type="application/rss+xml; charset=utf-8")

        site_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
        posts = (
            BlogPost.objects.filter(status=BlogPost.Status.PUBLISHED)
            .select_related("featured_image")
            .order_by("-created_at")[:50]
        )

        now_rfc = format_datetime(timezone.now())

        items: list[str] = []
        for post in posts:
            post_url   = f"{site_url}/blog/{post.slug}"
            pub_date   = format_datetime(post.created_at)
            title_esc  = html.escape(post.title)
            summary    = html.escape(post.summary or "")
            enclosure  = ""
            if post.featured_image:
                enclosure = (
                    f'<enclosure url="{html.escape(post.featured_image.file_url)}" '
                    f'length="{post.featured_image.file_size}" '
                    f'type="{html.escape(post.featured_image.mime_type)}" />'
                )

            items.append(textwrap.dedent(f"""\
                <item>
                  <title>{title_esc}</title>
                  <link>{post_url}</link>
                  <guid isPermaLink="true">{post_url}</guid>
                  <pubDate>{pub_date}</pubDate>
                  <description>{summary}</description>
                  {enclosure}
                </item>"""))

        xml_body = textwrap.dedent(f"""\
            <?xml version="1.0" encoding="UTF-8"?>
            <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
              <channel>
                <title>Portföy — Blog</title>
                <link>{site_url}/blog</link>
                <description>Yazılım, robotik ve teknoloji üzerine yazılar.</description>
                <language>tr</language>
                <lastBuildDate>{now_rfc}</lastBuildDate>
                <atom:link href="{site_url}/feed.xml" rel="self" type="application/rss+xml" />
            {"".join(items)}
              </channel>
            </rss>""")

        cache.set(self.CACHE_KEY, xml_body, self.CACHE_TIMEOUT)
        return HttpResponse(xml_body, content_type="application/rss+xml; charset=utf-8")
