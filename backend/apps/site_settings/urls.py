from django.urls import path

from .views import CvUploadView, SiteSettingsAdminView, SiteSettingsPublicView

urlpatterns = [
    path("site-settings/",           SiteSettingsPublicView.as_view(), name="site-settings-public"),
    path("admin/site-settings/",     SiteSettingsAdminView.as_view(),  name="site-settings-admin"),
    path("admin/site-settings/cv/",  CvUploadView.as_view(),           name="cv-upload"),
]
