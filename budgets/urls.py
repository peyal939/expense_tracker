from django.urls import path
from rest_framework.routers import SimpleRouter

from budgets.views import (
    BudgetStatusView,
    BudgetViewSet,
    BudgetWarningsView,
    IncomeSourceViewSet,
    IncomeViewSet,
    MonthlyBudgetViewSet,
)

router = SimpleRouter()
router.register(r"income-sources", IncomeSourceViewSet, basename="income-source")
router.register(r"incomes", IncomeViewSet, basename="income")
router.register(r"monthly", MonthlyBudgetViewSet, basename="monthly-budget")
router.register(r"allocations", BudgetViewSet, basename="budget")

urlpatterns = [
    path("status/", BudgetStatusView.as_view(), name="budget-status"),
    path("warnings/", BudgetWarningsView.as_view(), name="budget-warnings"),
]

urlpatterns += router.urls
