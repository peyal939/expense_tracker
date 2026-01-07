from django.db.models import Q
from rest_framework import serializers, viewsets

from categories.models import Category
from categories.serializers import CategorySerializer
from core.permissions import IsUserOrAdminRole
from core.rbac import is_admin


class CategoryViewSet(viewsets.ModelViewSet):
	serializer_class = CategorySerializer
	permission_classes = [IsUserOrAdminRole]
	queryset = Category.objects.all()
	search_fields = ["name"]
	ordering_fields = ["name", "created_at"]

	def get_queryset(self):
		qs = super().get_queryset()
		user = self.request.user
		if is_admin(user):
			return qs
		return qs.filter(Q(is_system=True) | Q(created_by=user))

	def perform_destroy(self, instance: Category):
		if instance.is_system:
			raise serializers.ValidationError("System categories cannot be deleted")
		if instance.expenses.exists():
			raise serializers.ValidationError("Category is in use by expenses")
		return super().perform_destroy(instance)

	def perform_update(self, serializer):
		instance: Category = self.get_object()
		if instance.is_system and not is_admin(self.request.user):
			raise serializers.ValidationError("System categories are read-only")
		return super().perform_update(serializer)
