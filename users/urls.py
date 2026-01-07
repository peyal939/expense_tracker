from django.urls import path, include
from rest_framework.routers import DefaultRouter

from users.views import MeView, UserManagementViewSet, RegisterView

router = DefaultRouter()
router.register(r"manage", UserManagementViewSet, basename="user-management")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
