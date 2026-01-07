from datetime import date
from decimal import Decimal

import django_filters
from django.db.models import Q, Sum
from django.utils.dateparse import parse_date
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from budgets.models import Budget, BudgetScope, Income, IncomeSource, MonthlyBudget, normalize_month
from budgets.serializers import (
    BudgetSerializer,
    IncomeSerializer,
    IncomeSourceSerializer,
    MonthlyBudgetSerializer,
)
from budgets.services import compute_budget_status_for_month, get_budget_warnings
from core.permissions import IsUserOrAdminRole
from core.rbac import is_admin


class IncomeSourceViewSet(viewsets.ModelViewSet):
    """CRUD for income sources"""
    serializer_class = IncomeSourceSerializer
    permission_classes = [IsUserOrAdminRole]

    def get_queryset(self):
        user = self.request.user
        # Return system sources + user's own sources
        return IncomeSource.objects.filter(
            Q(is_system=True) | Q(created_by=user)
        ).order_by("name")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_system:
            return Response(
                {"detail": "Cannot delete system income sources"},
                status=status.HTTP_403_FORBIDDEN
            )
        if instance.created_by != request.user:
            return Response(
                {"detail": "Cannot delete other user's income sources"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class IncomeFilter(django_filters.FilterSet):
    class Meta:
        model = Income
        fields = ["month", "source"]


class IncomeViewSet(viewsets.ModelViewSet):
    """CRUD for monthly income entries"""
    serializer_class = IncomeSerializer
    permission_classes = [IsUserOrAdminRole]
    filterset_class = IncomeFilter
    ordering_fields = ["month", "amount", "created_at"]
    ordering = ["-month", "-created_at"]

    def get_queryset(self):
        user = self.request.user
        qs = Income.objects.select_related("source").filter(created_by=user)
        return qs

    @action(detail=False, methods=["get"])
    def total(self, request):
        """Get total income for a specific month"""
        month_param = request.query_params.get("month")
        if not month_param:
            return Response({"detail": "month query param required"}, status=400)
        
        parsed = parse_date(month_param)
        if not parsed:
            return Response({"detail": "Invalid month format (YYYY-MM-DD)"}, status=400)
        
        month = normalize_month(parsed)
        total = Income.objects.filter(
            created_by=request.user,
            month=month
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0")
        
        incomes = Income.objects.filter(
            created_by=request.user,
            month=month
        ).select_related("source")
        
        return Response({
            "month": month,
            "total": total,
            "incomes": IncomeSerializer(incomes, many=True).data
        })


class MonthlyBudgetViewSet(viewsets.ModelViewSet):
    """CRUD for monthly budget (adjustable total)"""
    serializer_class = MonthlyBudgetSerializer
    permission_classes = [IsUserOrAdminRole]
    ordering = ["-month"]

    def get_queryset(self):
        return MonthlyBudget.objects.filter(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        """Create or update monthly budget (upsert by month)"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        month = normalize_month(data["month"])
        
        obj, created = MonthlyBudget.objects.update_or_create(
            created_by=request.user,
            month=month,
            defaults={
                "total_budget": data["total_budget"],
                "notes": data.get("notes", ""),
            }
        )
        
        # Calculate computed fields
        total_income = Income.objects.filter(
            created_by=request.user,
            month=month
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0")
        
        allocated = Budget.objects.filter(
            created_by=request.user,
            month=month,
            scope=BudgetScope.CATEGORY
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0")
        
        out_data = MonthlyBudgetSerializer(obj).data
        out_data["total_income"] = total_income
        out_data["allocated_amount"] = allocated
        out_data["unallocated_amount"] = obj.total_budget - allocated
        
        return Response(out_data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def current(self, request):
        """Get monthly budget with computed fields for a specific month"""
        month_param = request.query_params.get("month")
        if not month_param:
            return Response({"detail": "month query param required"}, status=400)
        
        parsed = parse_date(month_param)
        if not parsed:
            return Response({"detail": "Invalid month format"}, status=400)
        
        month = normalize_month(parsed)
        
        monthly_budget = MonthlyBudget.objects.filter(
            created_by=request.user,
            month=month
        ).first()
        
        total_income = Income.objects.filter(
            created_by=request.user,
            month=month
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0")
        
        allocated = Budget.objects.filter(
            created_by=request.user,
            month=month,
            scope=BudgetScope.CATEGORY
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0")
        
        total_budget = monthly_budget.total_budget if monthly_budget else total_income
        
        return Response({
            "month": month,
            "id": monthly_budget.id if monthly_budget else None,
            "total_budget": total_budget,
            "total_income": total_income,
            "allocated_amount": allocated,
            "unallocated_amount": total_budget - allocated,
            "notes": monthly_budget.notes if monthly_budget else "",
        })


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
		
		# Get monthly budget for percentage calculation
		monthly_budget = MonthlyBudget.objects.filter(
			created_by=request.user,
			month=month
		).first()
		
		amount = data["amount"]
		allocation_percentage = data.get("allocation_percentage")
		
		# If percentage provided but not amount, calculate amount from budget
		if allocation_percentage and monthly_budget and scope == BudgetScope.CATEGORY:
			calculated_amount = (monthly_budget.total_budget * allocation_percentage) / Decimal("100")
			if not amount or amount == Decimal("0"):
				amount = calculated_amount
		
		# If amount provided, calculate percentage from budget
		if amount and monthly_budget and monthly_budget.total_budget > 0 and scope == BudgetScope.CATEGORY:
			allocation_percentage = (amount / monthly_budget.total_budget) * Decimal("100")
		
		defaults = {
			"amount": amount,
			"allocation_percentage": allocation_percentage if scope == BudgetScope.CATEGORY else None,
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

	@action(detail=False, methods=["get"])
	def allocated_categories(self, request):
		"""Get categories that have budget allocations for a month (for expense filtering)"""
		month_param = request.query_params.get("month")
		if not month_param:
			return Response({"detail": "month query param required"}, status=400)
		
		parsed = parse_date(month_param)
		if not parsed:
			return Response({"detail": "Invalid month format"}, status=400)
		
		month = normalize_month(parsed)
		
		allocations = Budget.objects.filter(
			created_by=request.user,
			month=month,
			scope=BudgetScope.CATEGORY,
			category__isnull=False
		).select_related("category").values_list("category_id", flat=True)
		
		return Response({"category_ids": list(allocations)})


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


class BudgetWarningsView(generics.GenericAPIView):
	"""Get budget warnings for login notifications"""
	permission_classes = [IsUserOrAdminRole]

	def get(self, request, *args, **kwargs):
		month_param = request.query_params.get("month")
		parsed = parse_date(month_param) if month_param else None
		if not parsed:
			return Response({"detail": "month query param required (YYYY-MM-01)"}, status=400)

		owner = request.user
		warnings = get_budget_warnings(owner=owner, month=parsed)
		return Response({"warnings": warnings})
