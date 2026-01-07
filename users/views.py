from django.contrib.auth import get_user_model
from rest_framework import generics, viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from core.permissions import IsUserOrAdminRole, IsAdminRole
from users.serializers import MeSerializer, UserListSerializer, UserCreateUpdateSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
	"""Public user registration"""
	permission_classes = [AllowAny]
	serializer_class = UserCreateUpdateSerializer
	queryset = User.objects.all()

	def create(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		self.perform_create(serializer)
		headers = self.get_success_headers(serializer.data)
		return Response(
			{"message": "User registered successfully", "user": serializer.data},
			status=status.HTTP_201_CREATED,
			headers=headers
		)


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
