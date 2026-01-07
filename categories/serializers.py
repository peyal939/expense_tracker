from rest_framework import serializers

from categories.models import Category
from core.rbac import is_admin


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "is_system",
            "icon",
            "color_token",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_is_system(self, value: bool) -> bool:
        request = self.context.get("request")
        if value and request and not is_admin(request.user):
            raise serializers.ValidationError("Only Admin can create system categories")
        return value

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["created_by"] = request.user
        return super().create(validated_data)
