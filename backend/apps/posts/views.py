import html
import logging
import textwrap
from email.utils import format_datetime

from django.conf import settings
from django.core.cache import cache
from django.core.mail import EmailMultiAlternatives
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

from .models import BlogPost, Category, Comment, Reaction, Series, Tag, _ip_hash
from .serializers import (
    CategorySerializer,
    CommentAdminSerializer,
    CommentCreateSerializer,
    CommentSerializer,
    PostAdminSerializer,
    PostDetailSerializer,
    PostListSerializer,
    SeriesAdminSerializer,
    SeriesDetailSerializer,
    SeriesSerializer,
    TagSerializer,
)

logger = logging.getLogger(__name__)


# ── Public blog posts ──────────────────────────────────────────────────────────

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
            .select_related("featured_image", "series")
            .prefetch_related("categories", "tags", "reactions")
        )

    def get_object(self):
        if self.request.query_params.get("preview") == "1":
            if not (self.request.user and self.request.user.is_staff):
                raise PermissionDenied("Önizleme için admin girişi gereklidir.")
            qs = (
                BlogPost.objects.all()
                .select_related("featured_image", "series")
                .prefetch_related("categories", "tags", "reactions")
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


# ── View count ─────────────────────────────────────────────────────────────────

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
        cache.set(cache_key, True, timeout=86400)
        return Response({"detail": "Sayıldı."}, status=status.HTTP_200_OK)


# ── Comments ───────────────────────────────────────────────────────────────────

def _notify_new_comment(comment: Comment):
    """Yeni yorum gelince site sahibine e-posta gönder."""
    admin_email = getattr(settings, "CONTACT_EMAIL", "")
    if not admin_email:
        return
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "onboarding@resend.dev")
    post_url = f"{getattr(settings, 'FRONTEND_URL', '').rstrip('/')}/tr/blog/{comment.post.slug}"

    plain = (
        f"Yeni yorum: {comment.post.title}\n\n"
        f"Ad: {comment.name}\nE-posta: {comment.email}\n\n"
        f"{comment.body}\n\nYazı: {post_url}"
    )
    name_esc = html.escape(comment.name)
    body_esc = html.escape(comment.body)
    title_esc = html.escape(comment.post.title)
    html_body = f"""<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8"/></head>
<body style="background:#0a0d14;color:#e2e8f0;font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;">
    <h2 style="color:#e2e8f0;font-size:18px;margin-bottom:8px;">Yeni Yorum: {title_esc}</h2>
    <p style="color:#94a3b8;font-size:13px;margin-bottom:16px;">
      <strong style="color:#e2e8f0;">{name_esc}</strong> ({html.escape(comment.email)})
    </p>
    <blockquote style="border-left:3px solid #00d4ff;margin:0;padding:12px 16px;
                       background:#111622;border-radius:0 8px 8px 0;font-size:14px;
                       color:#e2e8f0;line-height:1.7;">
      {body_esc}
    </blockquote>
    <div style="margin-top:20px;">
      <a href="{html.escape(post_url)}" style="color:#00d4ff;font-size:13px;">Yazıya git →</a>
    </div>
    <p style="margin-top:24px;font-size:11px;color:#64748b;">
      Yorumu onaylamak için Django Admin'i kullanın.
    </p>
  </div>
</body></html>"""

    try:
        msg = EmailMultiAlternatives(
            subject=f"[Yorum] {comment.post.title} — {comment.name}",
            body=plain,
            from_email=from_email,
            to=[admin_email],
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=True)
    except Exception as exc:
        logger.error("Yorum bildirimi gönderilemedi: %s", exc)


class PostCommentListView(APIView):
    """GET /api/posts/{slug}/comments/ · POST /api/posts/{slug}/comments/"""

    permission_classes = [AllowAny]

    def _get_post(self, slug):
        return get_object_or_404(BlogPost, slug=slug, status=BlogPost.Status.PUBLISHED)

    def get(self, request, slug):
        post = self._get_post(slug)
        comments = (
            post.comments
            .filter(is_approved=True, parent__isnull=True)
            .prefetch_related("replies")
            .order_by("created_at")
        )
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    def post(self, request, slug):
        post = self._get_post(slug)

        # IP rate limit: 5 yorum / saat
        client_ip = request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip() \
                    or request.META.get("REMOTE_ADDR", "")
        ratelimit_key = f"comment_ratelimit_{_ip_hash(client_ip)}"
        count = cache.get(ratelimit_key, 0)
        if count >= 5:
            return Response(
                {"detail": "Çok fazla yorum gönderdiniz. Lütfen biraz bekleyin."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        serializer = CommentCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        comment = serializer.save(
            post=post,
            ip_hash=_ip_hash(client_ip),
        )
        cache.set(ratelimit_key, count + 1, timeout=3600)

        _notify_new_comment(comment)

        return Response(
            {"detail": "Yorumunuz alındı. Onaylandıktan sonra yayınlanacak."},
            status=status.HTTP_201_CREATED,
        )


# ── Reactions ─────────────────────────────────────────────────────────────────

_VALID_EMOJIS = {"like", "heart", "fire", "thinking", "clap"}


class PostReactionView(APIView):
    """GET /api/posts/{slug}/react/ → counts · POST /api/posts/{slug}/react/ → toggle"""

    permission_classes = [AllowAny]

    def _get_client_ip(self, request) -> str:
        xff = request.META.get("HTTP_X_FORWARDED_FOR", "")
        return xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR", "")

    def _counts_and_mine(self, post, ip_h: str) -> tuple[dict, set]:
        counts = {e: 0 for e in _VALID_EMOJIS}
        mine: set[str] = set()
        for r in post.reactions.values("emoji", "ip_hash"):
            counts[r["emoji"]] = counts.get(r["emoji"], 0) + 1
            if r["ip_hash"] == ip_h:
                mine.add(r["emoji"])
        return counts, mine

    def get(self, request, slug):
        post = get_object_or_404(BlogPost, slug=slug)
        ip_h = _ip_hash(self._get_client_ip(request))
        counts, mine = self._counts_and_mine(post, ip_h)
        return Response({"counts": counts, "mine": list(mine)})

    def post(self, request, slug):
        post = get_object_or_404(BlogPost, slug=slug)
        emoji = (request.data.get("emoji") or "").strip().lower()
        if emoji not in _VALID_EMOJIS:
            return Response(
                {"detail": f"Geçersiz emoji. Seçenekler: {', '.join(_VALID_EMOJIS)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ip_h = _ip_hash(self._get_client_ip(request))
        obj, created = Reaction.objects.get_or_create(
            post=post, emoji=emoji, ip_hash=ip_h
        )
        if not created:
            obj.delete()  # toggle: zaten tepki vermişse kaldır

        counts, mine = self._counts_and_mine(post, ip_h)
        return Response({"counts": counts, "mine": list(mine)})


# ── Series ─────────────────────────────────────────────────────────────────────

class SeriesViewSet(viewsets.ModelViewSet):
    queryset = Series.objects.all()
    lookup_field = "slug"

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminUser()]
        return [AllowAny()]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return SeriesDetailSerializer
        if self.request.user and self.request.user.is_staff:
            return SeriesAdminSerializer
        return SeriesSerializer


# ── Admin: posts ───────────────────────────────────────────────────────────────

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
            .select_related("featured_image", "series")
            .prefetch_related("categories", "tags")
        )

    def perform_destroy(self, instance):
        instance.status = BlogPost.Status.ARCHIVED
        instance.save(update_fields=["status"])

    @action(detail=False, methods=["post"])
    def publish_scheduled(self, request):
        now = timezone.now()
        updated = BlogPost.objects.filter(
            status=BlogPost.Status.DRAFT,
            publish_at__isnull=False,
            publish_at__lte=now,
        ).update(status=BlogPost.Status.PUBLISHED)
        return Response({"published": updated})


# ── Admin: comments ────────────────────────────────────────────────────────────

class AdminCommentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = CommentAdminSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_approved"]
    search_fields = ["name", "email", "body", "post__slug"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return (
            Comment.objects
            .select_related("post", "parent")
            .order_by("-created_at")
        )

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        comment = self.get_object()
        comment.is_approved = True
        comment.save(update_fields=["is_approved"])
        return Response({"detail": "Yorum onaylandı."})

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        comment = self.get_object()
        comment.is_approved = False
        comment.save(update_fields=["is_approved"])
        return Response({"detail": "Yorum reddedildi."})


# ── Category & Tag ─────────────────────────────────────────────────────────────

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = "slug"

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminUser()]
        return [AllowAny()]


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    lookup_field = "slug"

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminUser()]
        return [AllowAny()]


# ── RSS Feed ───────────────────────────────────────────────────────────────────

class RssFeedView(APIView):
    permission_classes = [AllowAny]
    CACHE_KEY = "rss_feed_xml"
    CACHE_TIMEOUT = 3600

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
            post_url  = f"{site_url}/blog/{post.slug}"
            pub_date  = format_datetime(post.created_at)
            title_esc = html.escape(post.title)
            summary   = html.escape(post.summary or "")
            enclosure = ""
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
