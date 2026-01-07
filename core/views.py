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


# Notification views
from rest_framework import viewsets, status as http_status
from rest_framework.decorators import action
from core.models import Notification
from core.serializers import NotificationSerializer, MarkNotificationsReadSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
	"""Read-only viewset for user notifications"""
	serializer_class = NotificationSerializer
	permission_classes = [IsUserOrAdminRole]
	ordering = ["-created_at"]

	def get_queryset(self):
		return Notification.objects.filter(user=self.request.user)

	@action(detail=False, methods=["get"])
	def unread(self, request):
		"""Get unread notifications"""
		notifications = self.get_queryset().filter(is_read=False)
		serializer = self.get_serializer(notifications, many=True)
		return Response({
			"count": notifications.count(),
			"notifications": serializer.data
		})

	@action(detail=False, methods=["post"])
	def mark_read(self, request):
		"""Mark notifications as read"""
		serializer = MarkNotificationsReadSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		
		notification_ids = serializer.validated_data.get("notification_ids", [])
		
		qs = self.get_queryset().filter(is_read=False)
		if notification_ids:
			qs = qs.filter(id__in=notification_ids)
		
		updated = qs.update(is_read=True)
		return Response({"marked_read": updated})

	@action(detail=True, methods=["post"])
	def read(self, request, pk=None):
		"""Mark a single notification as read"""
		notification = self.get_object()
		notification.is_read = True
		notification.save()
		return Response({"status": "ok"})

	@action(detail=False, methods=["get"])
	def count(self, request):
		"""Get count of unread notifications"""
		count = self.get_queryset().filter(is_read=False).count()
		return Response({"unread_count": count})
