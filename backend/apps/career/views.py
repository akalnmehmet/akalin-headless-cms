from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAdminUser

from .models import CareerEntry
from .serializers import CareerEntryAdminSerializer, CareerEntrySerializer


class CareerPublicViewSet(viewsets.ReadOnlyModelViewSet):
    """Herkese açık — sadece okuma."""
    queryset = CareerEntry.objects.all().order_by("-start_date", "sort_order")
    serializer_class = CareerEntrySerializer
    permission_classes = [AllowAny]
    pagination_class = None  # Tüm liste tek seferde


class CareerAdminViewSet(viewsets.ModelViewSet):
    """Admin CRUD."""
    queryset = CareerEntry.objects.all().order_by("-start_date", "sort_order")
    serializer_class = CareerEntryAdminSerializer
    permission_classes = [IsAdminUser]
