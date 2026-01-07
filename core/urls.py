from django.urls import include, path
from rest_framework.routers import SimpleRouter

from core.views import health, admin_dashboard, NotificationViewSet

router = SimpleRouter()
router.register(r"notifications", NotificationViewSet, basename="notification")

urlpatterns = [
    path("health/", health, name="health"),
    path("admin/dashboard/", admin_dashboard, name="admin_dashboard"),
    path("users/", include("users.urls")),
    path("categories/", include("categories.urls")),
    path("expenses/", include("expenses.urls")),
    path("budgets/", include("budgets.urls")),
    path("reports/", include("reports.urls")),
    path("export/", include("export_api.urls")),
    path("ai/", include("ai.urls")),
]

urlpatterns += router.urls
