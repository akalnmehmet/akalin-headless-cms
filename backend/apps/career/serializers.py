from rest_framework import serializers

from apps.utils.serializers import TranslatedSerializerMixin

from .models import CareerEntry


class CareerEntrySerializer(TranslatedSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = CareerEntry
        fields = [
            "id", "company", "position", "location", "entry_type",
            "description", "tech_stack",
            "start_date", "end_date", "is_current",
            "sort_order",
        ]
        translatable_fields = ["company", "position", "location", "description"]


class CareerEntryAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerEntry
        fields = [
            "id", "company", "company_en", "position", "position_en",
            "location", "location_en", "entry_type",
            "description", "description_en", "tech_stack",
            "start_date", "end_date", "is_current",
            "sort_order",
        ]
