from django.urls import path
from rest_framework.routers import SimpleRouter

from budgets.views import BudgetStatusView, BudgetViewSet

router = SimpleRouter()
router.register(r"", BudgetViewSet, basename="budget")

urlpatterns = [
    path("status/", BudgetStatusView.as_view(), name="budget-status"),
]

urlpatterns += router.urls
