from rest_framework.routers import SimpleRouter

from categories.views import CategoryViewSet

router = SimpleRouter()
router.register(r"", CategoryViewSet, basename="category")

urlpatterns = router.urls
