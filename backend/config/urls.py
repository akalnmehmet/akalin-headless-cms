from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenBlacklistView, TokenObtainPairView, TokenRefreshView

from apps.posts.views import RssFeedView
from config.views import ContactView, SitemapView

urlpatterns = [
    path("admin/", admin.site.urls),
    # Sitemap & RSS
    path("sitemap.xml", SitemapView.as_view(), name="sitemap"),
    path("feed.xml", RssFeedView.as_view(), name="rss-feed"),
    # İletişim formu
    path("api/contact/", ContactView.as_view(), name="contact"),
    # Auth
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/token/blacklist/", TokenBlacklistView.as_view(), name="token_blacklist"),
    # Apps
    path("api/", include("apps.posts.urls")),
    path("api/", include("apps.projects.urls")),
    path("api/", include("apps.media.urls")),
    path("api/", include("apps.site_settings.urls")),
    path("api/", include("apps.career.urls")),
    path("api/", include("apps.newsletter.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
