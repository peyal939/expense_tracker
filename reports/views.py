import calendar
from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Sum
from django.utils.dateparse import parse_date
from rest_framework import generics
from rest_framework.response import Response

from budgets.models import normalize_month
from core.permissions import IsUserOrAdminRole
from core.rbac import is_admin
from expenses.models import Expense


def _require_date(param: str | None, *, field: str) -> date:
	parsed = parse_date(param) if param else None
	if not parsed:
		raise ValueError(f"{field} query param required (YYYY-MM-DD)")
	return parsed


def _month_range(month: date) -> tuple[date, date]:
	month = normalize_month(month)
	last_day = calendar.monthrange(month.year, month.month)[1]
	return month, date(month.year, month.month, last_day)


def _week_start(d: date) -> date:
	return d - timedelta(days=d.weekday())


class SummaryReportView(generics.GenericAPIView):
	permission_classes = [IsUserOrAdminRole]

	def get(self, request, *args, **kwargs):
		try:
			start = _require_date(request.query_params.get("start"), field="start")
			end = _require_date(request.query_params.get("end"), field="end")
		except ValueError as e:
			return Response({"detail": str(e)}, status=400)

		qs = Expense.objects.filter(date__gte=start, date__lte=end)
		if not is_admin(request.user):
			qs = qs.filter(created_by=request.user)

		totals = qs.aggregate(total=Sum("amount"))
		total_amount = totals["total"] or Decimal("0")

		by_category = (
			qs.values("category_id", "category__name")
			.annotate(total=Sum("amount"))
			.order_by("-total")
		)

		days = max((end - start).days + 1, 1)
		avg_per_day = total_amount / Decimal(days)

		result_categories = []
		for row in by_category:
			category_total = row["total"] or Decimal("0")
			pct = (category_total / total_amount) if total_amount > 0 else None
			result_categories.append(
				{
					"category_id": row["category_id"],
					"category_name": row["category__name"],
					"total": category_total,
					"percent": pct,
				}
			)

		return Response(
			{
				"start": start,
				"end": end,
				"total": total_amount,
				"average_per_day": avg_per_day,
				"by_category": result_categories,
			}
		)


class TrendsReportView(generics.GenericAPIView):
	permission_classes = [IsUserOrAdminRole]

	def get(self, request, *args, **kwargs):
		month_param = request.query_params.get("month")
		month = parse_date(month_param) if month_param else None
		if not month:
			return Response({"detail": "month query param required (YYYY-MM-01)"}, status=400)

		current_start, current_end = _month_range(month)
		prev_month_last_day = current_start - timedelta(days=1)
		prev_start, prev_end = _month_range(prev_month_last_day)

		qs = Expense.objects.all()
		if not is_admin(request.user):
			qs = qs.filter(created_by=request.user)

		current_total = (
			qs.filter(date__gte=current_start, date__lte=current_end).aggregate(total=Sum("amount"))["total"]
			or Decimal("0")
		)
		prev_total = (
			qs.filter(date__gte=prev_start, date__lte=prev_end).aggregate(total=Sum("amount"))["total"]
			or Decimal("0")
		)

		delta = current_total - prev_total
		pct_change = (delta / prev_total) if prev_total > 0 else None

		return Response(
			{
				"month": normalize_month(month),
				"current": {"start": current_start, "end": current_end, "total": current_total},
				"previous": {"start": prev_start, "end": prev_end, "total": prev_total},
				"delta": delta,
				"percent_change": pct_change,
			}
		)


class TimeSeriesReportView(generics.GenericAPIView):
	permission_classes = [IsUserOrAdminRole]

	def get(self, request, *args, **kwargs):
		try:
			start = _require_date(request.query_params.get("start"), field="start")
			end = _require_date(request.query_params.get("end"), field="end")
		except ValueError as e:
			return Response({"detail": str(e)}, status=400)

		bucket = (request.query_params.get("bucket") or "daily").lower()
		if bucket not in ("daily", "weekly"):
			return Response({"detail": "bucket must be daily or weekly"}, status=400)

		qs = Expense.objects.filter(date__gte=start, date__lte=end)
		if not is_admin(request.user):
			qs = qs.filter(created_by=request.user)

		rows = qs.values("date").annotate(total=Sum("amount")).order_by("date")

		if bucket == "daily":
			series = [{"date": r["date"], "total": r["total"] or Decimal("0")} for r in rows]
			return Response({"start": start, "end": end, "bucket": bucket, "series": series})

		# weekly bucket (week starts Monday)
		weekly: dict[date, Decimal] = {}
		for r in rows:
			d = r["date"]
			wk = _week_start(d)
			weekly[wk] = weekly.get(wk, Decimal("0")) + (r["total"] or Decimal("0"))

		series = [{"week_start": wk, "total": total} for wk, total in sorted(weekly.items())]
		return Response({"start": start, "end": end, "bucket": bucket, "series": series})


class SpendingTrendsView(generics.GenericAPIView):
	"""Get spending trends and velocity analysis"""
	permission_classes = [IsUserOrAdminRole]

	def get(self, request, *args, **kwargs):
		from budgets.services import get_spending_trends
		
		days = request.query_params.get("days", "30")
		try:
			days = int(days)
		except ValueError:
			days = 30
		
		trends = get_spending_trends(owner=request.user, days=days)
		return Response(trends)


class MonthEndSummaryView(generics.GenericAPIView):
	"""Get comprehensive month-end summary report"""
	permission_classes = [IsUserOrAdminRole]

	def get(self, request, *args, **kwargs):
		from budgets.services import generate_month_end_summary
		
		month_param = request.query_params.get("month")
		if not month_param:
			return Response({"detail": "month query param required (YYYY-MM-01)"}, status=400)
		
		month = parse_date(month_param)
		if not month:
			return Response({"detail": "Invalid month format"}, status=400)
		
		summary = generate_month_end_summary(owner=request.user, month=month)
		return Response(summary)
