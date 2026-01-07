from rest_framework import serializers

from categories.models import Category
from core.rbac import is_admin
from expenses.models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    
    class Meta:
        model = Expense
        fields = [
            "id",
            "amount",
            "currency",
            "date",
            "description",
            "category",
            "payment_method",
            "notes",
            "merchant",
            "receipt",
            "created_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "created_by_username"]

    def validate_amount(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError("Must be > 0")
        return value

    def validate_description(self, value: str) -> str:
        if not value or not value.strip():
            raise serializers.ValidationError("Required")
        return value

    def validate_category(self, value: Category | None):
        if value is None:
            return None

        request = self.context.get("request")
        if not request:
            return value

        if is_admin(request.user):
            return value

        if value.is_system:
            return value

        if value.created_by_id != request.user.id:
            raise serializers.ValidationError("Invalid category")

        return value

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["created_by"] = request.user
        return super().create(validated_data)
