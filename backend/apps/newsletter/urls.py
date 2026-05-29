from django.urls import path

from .views import ConfirmView, SubscribeView, SubscriberListView, UnsubscribeView

urlpatterns = [
    path("newsletter/subscribe/",          SubscribeView.as_view(),    name="newsletter-subscribe"),
    path("newsletter/confirm/<str:token>/", ConfirmView.as_view(),     name="newsletter-confirm"),
    path("newsletter/unsubscribe/<str:token>/", UnsubscribeView.as_view(), name="newsletter-unsubscribe"),
    path("newsletter/subscribers/",        SubscriberListView.as_view(), name="newsletter-subscribers"),
]
