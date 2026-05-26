from django.urls import path

from .views import MediaDeleteView, MediaListCreateView

urlpatterns = [
    path("admin/media/", MediaListCreateView.as_view(), name="media-list-create"),
    path("admin/media/<uuid:pk>/", MediaDeleteView.as_view(), name="media-delete"),
]
