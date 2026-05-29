from django.urls import path
from .views import AdminLoginView, TOTPDisableView, TOTPSetupView, TOTPStatusView, TOTPVerifyView

urlpatterns = [
    path("auth/login/",        AdminLoginView.as_view(),  name="admin-login"),
    path("auth/totp-verify/",  TOTPVerifyView.as_view(),  name="totp-verify"),
    path("auth/totp-setup/",   TOTPSetupView.as_view(),   name="totp-setup"),
    path("auth/totp-disable/", TOTPDisableView.as_view(), name="totp-disable"),
    path("auth/totp-status/",  TOTPStatusView.as_view(),  name="totp-status"),
]
