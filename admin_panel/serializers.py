"""
Admin Panel Serializers
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import serializers

from budgets.models import IncomeSource
from categories.models import Category
from expenses.models import Expense

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for user list in admin"""
    roles = serializers.SerializerMethodField()
    expense_count = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "is_active", "is_superuser", "is_staff", "date_joined",
            "last_login", "roles", "expense_count", "total_spent"
        ]
        read_only_fields = ["id", "date_joined", "last_login"]
    
    def get_roles(self, obj):
        return list(obj.groups.values_list("name", flat=True))
    
    def get_expense_count(self, obj):
        return Expense.objects.filter(created_by=obj).count()
    
    def get_total_spent(self, obj):
        from django.db.models import Sum
        result = Expense.objects.filter(created_by=obj).aggregate(total=Sum("amount"))
        return result["total"] or 0


class AdminUserDetailSerializer(AdminUserSerializer):
    """Detailed user serializer for admin"""
    groups = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Group.objects.all(),
        required=False
    )
    
    class Meta(AdminUserSerializer.Meta):
        fields = AdminUserSerializer.Meta.fields + ["groups"]
    
    def create(self, validated_data):
        groups = validated_data.pop("groups", [])
        password = validated_data.pop("password", None)
        
        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        
        if groups:
            user.groups.set(groups)
        
        return user
    
    def update(self, instance, validated_data):
        groups = validated_data.pop("groups", None)
        password = validated_data.pop("password", None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        
        if groups is not None:
            instance.groups.set(groups)
        
        return instance


class AdminDashboardStatsSerializer(serializers.Serializer):
    """Dashboard statistics serializer"""
    total_users = serializers.IntegerField()
    total_expenses = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_categories = serializers.IntegerField()
    active_budgets = serializers.IntegerField()


class SystemCategorySerializer(serializers.ModelSerializer):
    """Serializer for system categories"""
    usage_count = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            "id", "name", "icon", "color_token", "is_system",
            "created_at", "updated_at", "usage_count", "total_amount"
        ]
        read_only_fields = ["id", "is_system", "created_at", "updated_at"]
    
    def get_usage_count(self, obj):
        return obj.expenses.count()
    
    def get_total_amount(self, obj):
        from django.db.models import Sum
        result = obj.expenses.aggregate(total=Sum("amount"))
        return result["total"] or 0


class SystemIncomeSourceSerializer(serializers.ModelSerializer):
    """Serializer for system income sources"""
    usage_count = serializers.SerializerMethodField()
    
    class Meta:
        model = IncomeSource
        fields = ["id", "name", "is_system", "created_at", "updated_at", "usage_count"]
        read_only_fields = ["id", "is_system", "created_at", "updated_at"]
    
    def get_usage_count(self, obj):
        return obj.incomes.count()


class SystemSettingsSerializer(serializers.Serializer):
    """System settings serializer"""
    default_currency = serializers.CharField(max_length=8)
    max_expense_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    budget_warning_threshold = serializers.DecimalField(max_digits=4, decimal_places=3)


class UserActivitySerializer(serializers.Serializer):
    """User activity summary serializer"""
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    total_expenses = serializers.DecimalField(max_digits=14, decimal_places=2)
    expense_count = serializers.IntegerField()
    last_expense_date = serializers.DateField()


class BroadcastNotificationSerializer(serializers.Serializer):
    """Broadcast notification serializer"""
    title = serializers.CharField(max_length=200)
    message = serializers.CharField()
    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True
    )


class AdminExpenseSerializer(serializers.ModelSerializer):
    """Expense serializer for admin view"""
    category_name = serializers.CharField(source="category.name", read_only=True)
    user_username = serializers.CharField(source="created_by.username", read_only=True)
    user_email = serializers.CharField(source="created_by.email", read_only=True)
    
    class Meta:
        model = Expense
        fields = [
            "id", "date", "amount", "currency", "description",
            "category", "category_name", "payment_method", "merchant",
            "notes", "created_by", "user_username", "user_email",
            "created_at", "updated_at"
        ]
