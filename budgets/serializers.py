from datetime import date

from rest_framework import serializers

from budgets.models import Budget, BudgetScope, Income, IncomeSource, MonthlyBudget, normalize_month
from categories.models import Category
from core.rbac import is_admin


class IncomeSourceSerializer(serializers.ModelSerializer):
    """Serializer for income sources (Salary, Freelance, etc.)"""
    
    class Meta:
        model = IncomeSource
        fields = ["id", "name", "is_system", "created_at"]
        read_only_fields = ["id", "is_system", "created_at"]

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["created_by"] = request.user
        validated_data["is_system"] = False
        return super().create(validated_data)


class IncomeSerializer(serializers.ModelSerializer):
    """Serializer for monthly income entries"""
    source_name_display = serializers.CharField(source="source_name", read_only=True)
    source_detail = IncomeSourceSerializer(source="source", read_only=True)
    
    class Meta:
        model = Income
        fields = [
            "id",
            "month",
            "source",
            "source_name",
            "source_name_display",
            "source_detail",
            "amount",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "source_name_display", "source_detail", "created_at", "updated_at"]

    def validate_month(self, value: date):
        return normalize_month(value)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value

    def validate_source(self, value):
        request = self.context.get("request")
        if value is None or not request:
            return value
        # Allow system sources or user's own sources
        if value.is_system or value.created_by_id == request.user.id:
            return value
        raise serializers.ValidationError("Invalid income source")

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["created_by"] = request.user
        # Store source name for reference
        if validated_data.get("source"):
            validated_data["source_name"] = validated_data["source"].name
        return super().create(validated_data)


class MonthlyBudgetSerializer(serializers.ModelSerializer):
    """Serializer for monthly budget (adjustable total budget)"""
    total_income = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    allocated_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    unallocated_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = MonthlyBudget
        fields = [
            "id",
            "month",
            "total_budget",
            "total_income",
            "allocated_amount",
            "unallocated_amount",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "total_income", "allocated_amount", "unallocated_amount", "created_at", "updated_at"]

    def validate_month(self, value: date):
        return normalize_month(value)

    def validate_total_budget(self, value):
        if value < 0:
            raise serializers.ValidationError("Budget cannot be negative")
        return value

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["created_by"] = request.user
        return super().create(validated_data)


class BudgetSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    
    class Meta:
        model = Budget
        fields = [
            "id",
            "month",
            "scope",
            "category",
            "category_name",
            "amount",
            "allocation_percentage",
            "rollover_enabled",
            "warn_threshold",
            "created_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "created_by_username", "category_name"]

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
