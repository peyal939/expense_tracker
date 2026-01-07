"""
Admin Panel Views - Comprehensive admin management endpoints
"""
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db.models import Sum, Count, Avg, F, Q
from django.db.models.functions import TruncMonth, TruncDate
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response

from budgets.models import Budget, Income, IncomeSource, MonthlyBudget
from categories.models import Category
from core.models import Notification, NotificationType
from core.permissions import IsAdminRole, IsUserOrAdminRole
from expenses.models import Expense
from users.roles import ROLE_ADMIN, ROLE_USER

from .serializers import (
    AdminDashboardStatsSerializer,
    AdminUserDetailSerializer,
    AdminUserSerializer,
    SystemCategorySerializer,
    SystemIncomeSourceSerializer,
    SystemSettingsSerializer,
    UserActivitySerializer,
    BroadcastNotificationSerializer,
    AdminExpenseSerializer,
)

User = get_user_model()


# ==================== Dashboard & Analytics ====================

@api_view(["GET"])
@permission_classes([IsUserOrAdminRole, IsAdminRole])
def admin_dashboard_stats(request):
    """Comprehensive admin dashboard statistics"""
    today = date.today()
    month_start = date(today.year, today.month, 1)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)
    
    # User statistics
    total_users = User.objects.filter(is_active=True).count()
    new_users_this_month = User.objects.filter(
        date_joined__gte=month_start
    ).count()
    new_users_last_month = User.objects.filter(
        date_joined__gte=last_month_start,
        date_joined__lt=month_start
    ).count()
    
    # Expense statistics
    total_expenses = Expense.objects.aggregate(
        total=Sum("amount"),
        count=Count("id")
    )
    
    this_month_expenses = Expense.objects.filter(
        date__gte=month_start
    ).aggregate(
        total=Sum("amount"),
        count=Count("id")
    )
    
    last_month_expenses = Expense.objects.filter(
        date__gte=last_month_start,
        date__lt=month_start
    ).aggregate(
        total=Sum("amount"),
        count=Count("id")
    )
    
    # Calculate growth percentages
    expense_growth = 0
    if last_month_expenses["total"] and last_month_expenses["total"] > 0:
        current = this_month_expenses["total"] or 0
        expense_growth = ((current - last_month_expenses["total"]) / last_month_expenses["total"]) * 100
    
    user_growth = 0
    if new_users_last_month > 0:
        user_growth = ((new_users_this_month - new_users_last_month) / new_users_last_month) * 100
    
    # Category statistics
    total_categories = Category.objects.count()
    system_categories = Category.objects.filter(is_system=True).count()
    
    # Top categories by expense amount
    top_categories = Expense.objects.values(
        "category__id", "category__name", "category__icon", "category__color_token"
    ).annotate(
        total=Sum("amount"),
        count=Count("id"),
        avg_amount=Avg("amount")
    ).order_by("-total")[:10]
    
    # Top spenders
    top_spenders = User.objects.annotate(
        expense_count=Count("expenses_expense_created"),
        total_spent=Sum("expenses_expense_created__amount")
    ).filter(
        total_spent__isnull=False
    ).values(
        "id", "username", "email", "expense_count", "total_spent"
    ).order_by("-total_spent")[:10]
    
    # Recent activity - expenses per day for last 30 days
    thirty_days_ago = today - timedelta(days=30)
    daily_expenses = Expense.objects.filter(
        date__gte=thirty_days_ago
    ).annotate(
        day=TruncDate("date")
    ).values("day").annotate(
        total=Sum("amount"),
        count=Count("id")
    ).order_by("day")
    
    # Monthly trends - last 6 months
    six_months_ago = today - timedelta(days=180)
    monthly_trends = Expense.objects.filter(
        date__gte=six_months_ago
    ).annotate(
        month=TruncMonth("date")
    ).values("month").annotate(
        total=Sum("amount"),
        count=Count("id"),
        unique_users=Count("created_by", distinct=True)
    ).order_by("month")
    
    # Income sources stats
    income_sources = IncomeSource.objects.count()
    
    # Active budgets
    active_budgets = Budget.objects.filter(month=month_start).count()
    
    # User role distribution
    role_distribution = []
    for group in Group.objects.all():
        role_distribution.append({
            "role": group.name,
            "count": group.user_set.filter(is_active=True).count()
        })
    
    return Response({
        "overview": {
            "total_users": total_users,
            "new_users_this_month": new_users_this_month,
            "user_growth_percent": round(user_growth, 1),
            "total_expenses_amount": total_expenses["total"] or 0,
            "total_expenses_count": total_expenses["count"] or 0,
            "this_month_expenses": this_month_expenses["total"] or 0,
            "this_month_count": this_month_expenses["count"] or 0,
            "expense_growth_percent": round(expense_growth, 1),
            "total_categories": total_categories,
            "system_categories": system_categories,
            "income_sources": income_sources,
            "active_budgets": active_budgets,
        },
        "top_categories": list(top_categories),
        "top_spenders": list(top_spenders),
        "daily_activity": list(daily_expenses),
        "monthly_trends": list(monthly_trends),
        "role_distribution": role_distribution,
    })


@api_view(["GET"])
@permission_classes([IsUserOrAdminRole, IsAdminRole])
def system_health(request):
    """System health and status check"""
    # Database stats
    db_stats = {
        "users": User.objects.count(),
        "expenses": Expense.objects.count(),
        "categories": Category.objects.count(),
        "budgets": Budget.objects.count(),
        "incomes": Income.objects.count(),
        "notifications": Notification.objects.count(),
    }
    
    # Recent activity
    last_hour = timezone.now() - timedelta(hours=1)
    recent_activity = {
        "expenses_last_hour": Expense.objects.filter(created_at__gte=last_hour).count(),
        "logins_today": User.objects.filter(last_login__date=date.today()).count(),
    }
    
    return Response({
        "status": "healthy",
        "timestamp": timezone.now(),
        "database": db_stats,
        "recent_activity": recent_activity,
    })


# ==================== User Management ====================

class AdminUserViewSet(viewsets.ModelViewSet):
    """Complete user management for admins"""
    permission_classes = [IsUserOrAdminRole, IsAdminRole]
    queryset = User.objects.all().order_by("-date_joined")
    
    def get_serializer_class(self):
        if self.action == "retrieve":
            return AdminUserDetailSerializer
        return AdminUserSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        
        # Filtering
        status_filter = self.request.query_params.get("status")
        if status_filter == "active":
            qs = qs.filter(is_active=True)
        elif status_filter == "inactive":
            qs = qs.filter(is_active=False)
        
        role_filter = self.request.query_params.get("role")
        if role_filter:
            qs = qs.filter(groups__name=role_filter)
        
        # Search
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        return qs.distinct()
    
    @action(detail=True, methods=["post"])
    def toggle_status(self, request, pk=None):
        """Toggle user active status"""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({
            "id": user.id,
            "is_active": user.is_active,
            "message": f"User {'activated' if user.is_active else 'deactivated'} successfully"
        })
    
    @action(detail=True, methods=["post"])
    def reset_password(self, request, pk=None):
        """Reset user password"""
        user = self.get_object()
        new_password = request.data.get("new_password")
        
        if not new_password:
            return Response(
                {"detail": "new_password is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        return Response({"message": "Password reset successfully"})
    
    @action(detail=True, methods=["post"])
    def assign_role(self, request, pk=None):
        """Assign role to user"""
        user = self.get_object()
        role_name = request.data.get("role")
        
        try:
            group = Group.objects.get(name=role_name)
        except Group.DoesNotExist:
            return Response(
                {"detail": f"Role '{role_name}' not found"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.groups.add(group)
        return Response({
            "message": f"Role '{role_name}' assigned to user",
            "roles": list(user.groups.values_list("name", flat=True))
        })
    
    @action(detail=True, methods=["post"])
    def remove_role(self, request, pk=None):
        """Remove role from user"""
        user = self.get_object()
        role_name = request.data.get("role")
        
        try:
            group = Group.objects.get(name=role_name)
        except Group.DoesNotExist:
            return Response(
                {"detail": f"Role '{role_name}' not found"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.groups.remove(group)
        return Response({
            "message": f"Role '{role_name}' removed from user",
            "roles": list(user.groups.values_list("name", flat=True))
        })
    
    @action(detail=True, methods=["get"])
    def activity(self, request, pk=None):
        """Get user's activity summary"""
        user = self.get_object()
        today = date.today()
        month_start = date(today.year, today.month, 1)
        
        # User's expenses
        expenses = Expense.objects.filter(created_by=user)
        
        total_expenses = expenses.aggregate(
            total=Sum("amount"),
            count=Count("id")
        )
        
        this_month = expenses.filter(date__gte=month_start).aggregate(
            total=Sum("amount"),
            count=Count("id")
        )
        
        # Category breakdown
        by_category = expenses.values(
            "category__name"
        ).annotate(
            total=Sum("amount"),
            count=Count("id")
        ).order_by("-total")[:5]
        
        # Recent expenses
        recent = expenses.order_by("-date", "-id")[:10].values(
            "id", "date", "amount", "description", "category__name"
        )
        
        return Response({
            "user_id": user.id,
            "username": user.username,
            "total_expenses": total_expenses["total"] or 0,
            "total_count": total_expenses["count"] or 0,
            "this_month_total": this_month["total"] or 0,
            "this_month_count": this_month["count"] or 0,
            "by_category": list(by_category),
            "recent_expenses": list(recent),
            "last_login": user.last_login,
            "date_joined": user.date_joined,
        })


# ==================== Category Management ====================

class SystemCategoryViewSet(viewsets.ModelViewSet):
    """Manage system-wide categories"""
    permission_classes = [IsUserOrAdminRole, IsAdminRole]
    serializer_class = SystemCategorySerializer
    
    def get_queryset(self):
        return Category.objects.filter(is_system=True).order_by("name")
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, is_system=True)
    
    @action(detail=True, methods=["get"])
    def usage_stats(self, request, pk=None):
        """Get category usage statistics"""
        category = self.get_object()
        
        expenses = Expense.objects.filter(category=category)
        stats = expenses.aggregate(
            total_amount=Sum("amount"),
            total_count=Count("id"),
            avg_amount=Avg("amount"),
            unique_users=Count("created_by", distinct=True)
        )
        
        # Monthly usage
        monthly = expenses.annotate(
            month=TruncMonth("date")
        ).values("month").annotate(
            total=Sum("amount"),
            count=Count("id")
        ).order_by("-month")[:6]
        
        return Response({
            "category_id": category.id,
            "category_name": category.name,
            "total_amount": stats["total_amount"] or 0,
            "total_count": stats["total_count"] or 0,
            "avg_amount": stats["avg_amount"] or 0,
            "unique_users": stats["unique_users"] or 0,
            "monthly_usage": list(monthly),
        })
    
    @action(detail=False, methods=["post"])
    def bulk_create(self, request):
        """Create multiple categories at once"""
        categories_data = request.data.get("categories", [])
        created = []
        
        for cat_data in categories_data:
            serializer = self.get_serializer(data=cat_data)
            if serializer.is_valid():
                serializer.save(created_by=request.user, is_system=True)
                created.append(serializer.data)
        
        return Response({
            "created_count": len(created),
            "categories": created
        }, status=status.HTTP_201_CREATED)


# ==================== Income Source Management ====================

class SystemIncomeSourceViewSet(viewsets.ModelViewSet):
    """Manage system-wide income sources"""
    permission_classes = [IsUserOrAdminRole, IsAdminRole]
    serializer_class = SystemIncomeSourceSerializer
    
    def get_queryset(self):
        return IncomeSource.objects.filter(is_system=True).order_by("name")
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, is_system=True)
    
    @action(detail=True, methods=["get"])
    def usage_stats(self, request, pk=None):
        """Get income source usage statistics"""
        source = self.get_object()
        
        incomes = Income.objects.filter(source=source)
        stats = incomes.aggregate(
            total_amount=Sum("amount"),
            total_count=Count("id"),
            avg_amount=Avg("amount"),
            unique_users=Count("created_by", distinct=True)
        )
        
        return Response({
            "source_id": source.id,
            "source_name": source.name,
            "total_amount": stats["total_amount"] or 0,
            "total_count": stats["total_count"] or 0,
            "avg_amount": stats["avg_amount"] or 0,
            "unique_users": stats["unique_users"] or 0,
        })


# ==================== Expense Management (Admin View) ====================

class AdminExpenseViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin view of all expenses across users"""
    permission_classes = [IsUserOrAdminRole, IsAdminRole]
    serializer_class = AdminExpenseSerializer
    
    def get_queryset(self):
        qs = Expense.objects.select_related("created_by", "category").order_by("-date", "-id")
        
        # Filtering
        user_id = self.request.query_params.get("user_id")
        if user_id:
            qs = qs.filter(created_by_id=user_id)
        
        category_id = self.request.query_params.get("category_id")
        if category_id:
            qs = qs.filter(category_id=category_id)
        
        start_date = self.request.query_params.get("start")
        if start_date:
            qs = qs.filter(date__gte=start_date)
        
        end_date = self.request.query_params.get("end")
        if end_date:
            qs = qs.filter(date__lte=end_date)
        
        min_amount = self.request.query_params.get("min_amount")
        if min_amount:
            qs = qs.filter(amount__gte=min_amount)
        
        max_amount = self.request.query_params.get("max_amount")
        if max_amount:
            qs = qs.filter(amount__lte=max_amount)
        
        return qs
    
    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Get expenses summary across all users"""
        qs = self.get_queryset()
        
        summary = qs.aggregate(
            total=Sum("amount"),
            count=Count("id"),
            avg=Avg("amount")
        )
        
        by_user = qs.values(
            "created_by__id", "created_by__username"
        ).annotate(
            total=Sum("amount"),
            count=Count("id")
        ).order_by("-total")[:10]
        
        by_category = qs.values(
            "category__id", "category__name"
        ).annotate(
            total=Sum("amount"),
            count=Count("id")
        ).order_by("-total")[:10]
        
        return Response({
            "total": summary["total"] or 0,
            "count": summary["count"] or 0,
            "average": summary["avg"] or 0,
            "by_user": list(by_user),
            "by_category": list(by_category),
        })


# ==================== Notification Management ====================

@api_view(["POST"])
@permission_classes([IsUserOrAdminRole, IsAdminRole])
def broadcast_notification(request):
    """Send notification to all users or specific users"""
    serializer = BroadcastNotificationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    data = serializer.validated_data
    user_ids = data.get("user_ids", [])
    
    if user_ids:
        users = User.objects.filter(id__in=user_ids, is_active=True)
    else:
        users = User.objects.filter(is_active=True)
    
    notifications = []
    for user in users:
        notifications.append(Notification(
            user=user,
            notification_type=NotificationType.TREND_ALERT,
            title=data["title"],
            message=data["message"],
            data={"admin_broadcast": True, "sent_by": request.user.username},
        ))
    
    Notification.objects.bulk_create(notifications)
    
    return Response({
        "message": f"Notification sent to {len(notifications)} users",
        "users_notified": len(notifications)
    })


@api_view(["GET"])
@permission_classes([IsUserOrAdminRole, IsAdminRole])
def notification_stats(request):
    """Get notification statistics"""
    stats = Notification.objects.aggregate(
        total=Count("id"),
        unread=Count("id", filter=Q(is_read=False)),
        read=Count("id", filter=Q(is_read=True))
    )
    
    by_type = Notification.objects.values(
        "notification_type"
    ).annotate(
        count=Count("id")
    ).order_by("-count")
    
    return Response({
        "total": stats["total"],
        "unread": stats["unread"],
        "read": stats["read"],
        "by_type": list(by_type)
    })


# ==================== Reports & Analytics ====================

@api_view(["GET"])
@permission_classes([IsUserOrAdminRole, IsAdminRole])
def admin_reports_overview(request):
    """Get comprehensive reports overview for admin"""
    today = date.today()
    month_start = date(today.year, today.month, 1)
    year_start = date(today.year, 1, 1)
    
    # This month's stats
    this_month = Expense.objects.filter(date__gte=month_start).aggregate(
        total=Sum("amount"),
        count=Count("id"),
        avg=Avg("amount")
    )
    
    # This year's stats
    this_year = Expense.objects.filter(date__gte=year_start).aggregate(
        total=Sum("amount"),
        count=Count("id"),
        avg=Avg("amount")
    )
    
    # User engagement
    active_users_month = User.objects.filter(
        expenses_expense_created__date__gte=month_start
    ).distinct().count()
    
    # Budget compliance
    budgets_this_month = MonthlyBudget.objects.filter(month=month_start)
    budget_stats = {
        "total_budgets": budgets_this_month.count(),
        "total_budgeted": budgets_this_month.aggregate(total=Sum("total_budget"))["total"] or 0,
    }
    
    return Response({
        "this_month": {
            "total": this_month["total"] or 0,
            "count": this_month["count"] or 0,
            "average": this_month["avg"] or 0,
            "active_users": active_users_month,
        },
        "this_year": {
            "total": this_year["total"] or 0,
            "count": this_year["count"] or 0,
            "average": this_year["avg"] or 0,
        },
        "budgets": budget_stats,
    })


# ==================== Export Functions ====================

@api_view(["GET"])
@permission_classes([IsUserOrAdminRole, IsAdminRole])
def export_users_report(request):
    """Export users report data"""
    users = User.objects.annotate(
        expense_count=Count("expenses_expense_created"),
        total_spent=Sum("expenses_expense_created__amount")
    ).values(
        "id", "username", "email", "is_active", "date_joined",
        "last_login", "expense_count", "total_spent"
    ).order_by("-date_joined")
    
    return Response({
        "users": list(users),
        "total_count": len(users),
        "exported_at": timezone.now()
    })


@api_view(["GET"])
@permission_classes([IsUserOrAdminRole, IsAdminRole])
def export_expenses_report(request):
    """Export all expenses report data"""
    start = request.query_params.get("start")
    end = request.query_params.get("end")
    
    qs = Expense.objects.select_related("created_by", "category")
    
    if start:
        qs = qs.filter(date__gte=start)
    if end:
        qs = qs.filter(date__lte=end)
    
    expenses = qs.values(
        "id", "date", "amount", "description", "category__name",
        "payment_method", "merchant", "created_by__username", "created_at"
    ).order_by("-date")
    
    summary = qs.aggregate(
        total=Sum("amount"),
        count=Count("id")
    )
    
    return Response({
        "expenses": list(expenses),
        "summary": summary,
        "exported_at": timezone.now()
    })
