from django.contrib.auth import get_user_model
from django.db.models import Sum, Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from budgets.models import Budget
from categories.models import Category
from core.permissions import IsUserOrAdminRole, IsAdminRole
from expenses.models import Expense

User = get_user_model()


@api_view(["GET"])
@permission_classes([AllowAny])
def health(_request):
	return Response({"status": "ok"})


@api_view(["GET"])
@permission_classes([IsUserOrAdminRole, IsAdminRole])
def admin_dashboard(request):
	"""System-wide stats for admins"""
	
	# Total stats
	total_expenses = Expense.objects.aggregate(
		total=Sum("amount"),
		count=Count("id")
	)
	
	# User stats
	user_stats = User.objects.annotate(
		expense_count=Count("expense"),
		total_spent=Sum("expense__amount")
	).values("id", "username", "expense_count", "total_spent").order_by("-total_spent")[:10]
	
	# Category stats
	category_stats = Expense.objects.values("category__name").annotate(
		total=Sum("amount"),
		count=Count("id")
	).order_by("-total")[:10]
	
	# Budget compliance
	active_budgets = Budget.objects.count()
	
	return Response({
		"total_expenses": total_expenses.get("total") or 0,
		"total_count": total_expenses.get("count") or 0,
		"total_users": User.objects.filter(is_active=True).count(),
		"total_categories": Category.objects.count(),
		"active_budgets": active_budgets,
		"top_spenders": list(user_stats),
		"top_categories": list(category_stats),
	})
