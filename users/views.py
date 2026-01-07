from django.contrib.auth import get_user_model
from rest_framework import generics, viewsets

from core.permissions import IsUserOrAdminRole, IsAdminRole
from users.serializers import MeSerializer, UserListSerializer, UserCreateUpdateSerializer

User = get_user_model()


class MeView(generics.RetrieveAPIView):
	permission_classes = [IsUserOrAdminRole]
	serializer_class = MeSerializer

	def get_object(self):
		return self.request.user


class UserManagementViewSet(viewsets.ModelViewSet):
	"""Admin-only user management"""
	permission_classes = [IsUserOrAdminRole, IsAdminRole]
	queryset = User.objects.all().order_by("-date_joined")

	def get_serializer_class(self):
		if self.action in ["create", "update", "partial_update"]:
			return UserCreateUpdateSerializer
		return UserListSerializer
