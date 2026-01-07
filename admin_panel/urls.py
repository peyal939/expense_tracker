"""
Admin Panel URLs
"""
from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import (
    admin_dashboard_stats,
    system_health,
    AdminUserViewSet,
    SystemCategoryViewSet,
    SystemIncomeSourceViewSet,
    AdminExpenseViewSet,
    broadcast_notification,
    notification_stats,
    admin_reports_overview,
    export_users_report,
    export_expenses_report,
)

router = SimpleRouter()
router.register(r"users", AdminUserViewSet, basename="admin-users")
router.register(r"categories", SystemCategoryViewSet, basename="admin-categories")
router.register(r"income-sources", SystemIncomeSourceViewSet, basename="admin-income-sources")
router.register(r"expenses", AdminExpenseViewSet, basename="admin-expenses")

urlpatterns = [
    # Dashboard & Analytics
    path("dashboard/", admin_dashboard_stats, name="admin-dashboard"),
    path("health/", system_health, name="system-health"),
    
    # Reports
    path("reports/overview/", admin_reports_overview, name="admin-reports-overview"),
    
    # Notifications
    path("notifications/broadcast/", broadcast_notification, name="broadcast-notification"),
    path("notifications/stats/", notification_stats, name="notification-stats"),
    
    # Exports
    path("export/users/", export_users_report, name="export-users"),
    path("export/expenses/", export_expenses_report, name="export-expenses"),
]

urlpatterns += router.urls
