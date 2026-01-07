from datetime import date

import django_filters
from django.utils.dateparse import parse_date
from rest_framework import generics, status, viewsets
from rest_framework.response import Response

from budgets.models import Budget, BudgetScope, normalize_month
from budgets.serializers import BudgetSerializer
from budgets.services import compute_budget_status_for_month
from core.permissions import IsUserOrAdminRole
from core.rbac import is_admin


class BudgetFilter(django_filters.FilterSet):
	class Meta:
		model = Budget
		fields = ["month", "scope", "category"]


class BudgetViewSet(viewsets.ModelViewSet):
	serializer_class = BudgetSerializer
	permission_classes = [IsUserOrAdminRole]
	queryset = Budget.objects.select_related("category").all()
	filterset_class = BudgetFilter
	ordering_fields = ["month", "amount", "created_at"]
	ordering = ["-month", "-id"]

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

	def create(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		data = serializer.validated_data

		month = normalize_month(data["month"])
		scope = data["scope"]
		category = data.get("category")
		defaults = {
			"amount": data["amount"],
			"rollover_enabled": data.get("rollover_enabled", False),
			"warn_threshold": data.get("warn_threshold"),
		}

		obj, created = Budget.objects.update_or_create(
			created_by=request.user,
			month=month,
			scope=scope,
			category=category if scope == BudgetScope.CATEGORY else None,
			defaults=defaults,
		)

		out = self.get_serializer(obj)
		return Response(out.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class BudgetStatusView(generics.GenericAPIView):
	permission_classes = [IsUserOrAdminRole]

	def get(self, request, *args, **kwargs):
		month_param = request.query_params.get("month")
		parsed = parse_date(month_param) if month_param else None
		if not parsed:
			return Response({"detail": "month query param required (YYYY-MM-01)"}, status=400)

		owner = request.user
		payload = compute_budget_status_for_month(owner=owner, month=parsed)
		return Response(payload)
