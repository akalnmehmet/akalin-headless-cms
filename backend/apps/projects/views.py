from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response

from .models import Project
from .serializers import (
    ProjectAdminSerializer,
    ProjectDetailSerializer,
    ProjectListSerializer,
    ProjectReorderSerializer,
)


class ProjectPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return (
            Project.objects.exclude(status=Project.Status.ARCHIVED)
            .select_related("thumbnail")
            .prefetch_related("gallery")
            .order_by("sort_order", "-id")
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProjectDetailSerializer
        return ProjectListSerializer


class ProjectAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = ProjectAdminSerializer

    def get_queryset(self):
        return (
            Project.objects.all()
            .select_related("thumbnail")
            .prefetch_related("gallery")
        )

    def perform_destroy(self, instance):
        instance.status = Project.Status.ARCHIVED
        instance.save(update_fields=["status"])

    @action(detail=False, methods=["patch"])
    def reorder(self, request):
        serializer = ProjectReorderSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        for item in serializer.validated_data:
            Project.objects.filter(id=item["id"]).update(sort_order=item["sort_order"])

        return Response({"detail": "Sıralama güncellendi."}, status=status.HTTP_200_OK)
