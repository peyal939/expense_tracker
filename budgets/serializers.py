from datetime import date

from rest_framework import serializers

from budgets.models import Budget, BudgetScope, normalize_month
from categories.models import Category
from core.rbac import is_admin


class BudgetSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    
    class Meta:
        model = Budget
        fields = [
            "id",
            "month",
            "scope",
            "category",
            "amount",
            "rollover_enabled",
            "warn_threshold",
            "created_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "created_by_username"]

    def validate_month(self, value: date):
        return normalize_month(value)

    def validate_category(self, value: Category | None):
        request = self.context.get("request")
        if value is None or not request:
            return value

        if is_admin(request.user) or value.is_system:
            return value

        if value.created_by_id != request.user.id:
            raise serializers.ValidationError("Invalid category")

        return value

    def validate(self, attrs):
        scope = attrs.get("scope")
        category = attrs.get("category")

        if scope == BudgetScope.CATEGORY and not category:
            raise serializers.ValidationError({"category": "Required when scope=category"})
        if scope == BudgetScope.OVERALL and category is not None:
            raise serializers.ValidationError({"category": "Must be empty when scope=overall"})

        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["created_by"] = request.user
        return super().create(validated_data)
