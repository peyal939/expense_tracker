import django_filters
from rest_framework import viewsets

from core.permissions import IsUserOrAdminRole
from core.rbac import is_admin
from expenses.models import Expense
from expenses.serializers import ExpenseSerializer
from expenses.services import assert_expense_editable


class ExpenseFilter(django_filters.FilterSet):
	start_date = django_filters.DateFilter(field_name="date", lookup_expr="gte")
	end_date = django_filters.DateFilter(field_name="date", lookup_expr="lte")
	min_amount = django_filters.NumberFilter(field_name="amount", lookup_expr="gte")
	max_amount = django_filters.NumberFilter(field_name="amount", lookup_expr="lte")

	class Meta:
		model = Expense
		fields = ["category"]


class ExpenseViewSet(viewsets.ModelViewSet):
	serializer_class = ExpenseSerializer
	permission_classes = [IsUserOrAdminRole]
	queryset = Expense.objects.select_related("category").all()
	filterset_class = ExpenseFilter
	search_fields = ["description", "merchant", "notes"]
	ordering_fields = ["date", "amount", "created_at"]
	ordering = ["-date", "-id"]

	def get_queryset(self):
		qs = super().get_queryset()
		user = self.request.user
		if is_admin(user):
			# Admin can filter by user
			user_id = self.request.query_params.get("user")
			if user_id:
				qs = qs.filter(created_by_id=user_id)
			return qs
		return qs.filter(created_by=user)

	def perform_update(self, serializer):
		instance = self.get_object()
		assert_expense_editable(expense=instance, actor=self.request.user)
		return super().perform_update(serializer)

	def perform_destroy(self, instance):
		assert_expense_editable(expense=instance, actor=self.request.user)
		return super().perform_destroy(instance)
