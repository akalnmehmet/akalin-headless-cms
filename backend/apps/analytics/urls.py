from django.urls import path

from .views import AnalyticsStatsView, TrackView

urlpatterns = [
    path("analytics/track/", TrackView.as_view(),       name="analytics-track"),
    path("analytics/stats/", AnalyticsStatsView.as_view(), name="analytics-stats"),
]
