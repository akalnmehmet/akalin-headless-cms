class TranslatedSerializerMixin:
    """
    Mixin that dynamically substitutes fields with their '_en' counterpart
    in the serialized output if the active request language is English ('en')
    and the '_en' field is populated in the database.
    """

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        from django.utils.translation import get_language
        lang = get_language()

        if lang and lang.startswith("en"):
            translatable_fields = getattr(self.Meta, "translatable_fields", [])
            for field in translatable_fields:
                en_field = f"{field}_en"
                if hasattr(instance, en_field):
                    en_val = getattr(instance, en_field)
                    if en_val:  # Only replace if English version is populated
                        ret[field] = en_val
        return ret
