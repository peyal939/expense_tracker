import csv
import json
from decimal import Decimal

from django.http import HttpResponse
from django.utils.dateparse import parse_date
from rest_framework import generics
from rest_framework.response import Response

from budgets.models import Budget
from categories.models import Category
from core.permissions import IsUserOrAdminRole
from core.rbac import is_admin
from expenses.models import Expense


class ExpensesCsvExportView(generics.GenericAPIView):
	permission_classes = [IsUserOrAdminRole]

	def get(self, request, *args, **kwargs):
		start_param = request.query_params.get("start")
		end_param = request.query_params.get("end")
		start = parse_date(start_param) if start_param else None
		end = parse_date(end_param) if end_param else None

		qs = Expense.objects.select_related("category").all()
		if not is_admin(request.user):
			qs = qs.filter(created_by=request.user)
		if start:
			qs = qs.filter(date__gte=start)
		if end:
			qs = qs.filter(date__lte=end)
		qs = qs.order_by("date", "id")

		response = HttpResponse(content_type="text/csv")
		response["Content-Disposition"] = "attachment; filename=expenses.csv"

		writer = csv.writer(response)
		writer.writerow(
			[
				"id",
				"date",
				"amount",
				"currency",
				"description",
				"category",
				"payment_method",
				"merchant",
				"notes",
				"created_at",
			]
		)

		for e in qs:
			writer.writerow(
				[
					e.id,
					e.date.isoformat(),
					str(e.amount),
					e.currency,
					e.description,
					getattr(e.category, "name", ""),
					e.payment_method,
					e.merchant,
					e.notes,
					e.created_at.isoformat() if e.created_at else "",
				]
			)

		return response


class BackupJsonExportView(generics.GenericAPIView):
	permission_classes = [IsUserOrAdminRole]

	def get(self, request, *args, **kwargs):
		if is_admin(request.user):
			categories = Category.objects.all()
			expenses = Expense.objects.all()
			budgets = Budget.objects.all()
		else:
			categories = Category.objects.filter(created_by=request.user)
			expenses = Expense.objects.filter(created_by=request.user)
			budgets = Budget.objects.filter(created_by=request.user)

		payload = {
			"categories": [
				{
					"id": c.id,
					"name": c.name,
					"is_system": c.is_system,
					"icon": c.icon,
					"color_token": c.color_token,
					"created_at": c.created_at,
					"updated_at": c.updated_at,
				}
				for c in categories
			],
			"budgets": [
				{
					"id": b.id,
					"month": b.month,
					"scope": b.scope,
					"category_id": b.category_id,
					"amount": b.amount,
					"rollover_enabled": b.rollover_enabled,
					"warn_threshold": b.warn_threshold,
					"created_at": b.created_at,
					"updated_at": b.updated_at,
				}
				for b in budgets
			],
			"expenses": [
				{
					"id": e.id,
					"amount": e.amount,
					"currency": e.currency,
					"date": e.date,
					"description": e.description,
					"category_id": e.category_id,
					"payment_method": e.payment_method,
					"merchant": e.merchant,
					"notes": e.notes,
					"receipt": e.receipt.name if e.receipt else "",
					"created_at": e.created_at,
					"updated_at": e.updated_at,
				}
				for e in expenses
			],
		}

		# Ensure Decimal/Date serialize cleanly
		def default(o):
			if isinstance(o, Decimal):
				return str(o)
			if hasattr(o, "isoformat"):
				return o.isoformat()
			return str(o)

		raw = json.loads(json.dumps(payload, default=default))
		return Response(raw)
