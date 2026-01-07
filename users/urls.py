from django.urls import path, include
from rest_framework.routers import DefaultRouter

from users.views import MeView, UserManagementViewSet

router = DefaultRouter()
router.register(r"manage", UserManagementViewSet, basename="user-management")

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
