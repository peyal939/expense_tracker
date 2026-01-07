from rest_framework.routers import SimpleRouter

from expenses.views import ExpenseViewSet

router = SimpleRouter()
router.register(r"", ExpenseViewSet, basename="expense")

urlpatterns = router.urls
