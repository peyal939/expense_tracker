from __future__ import annotations

import calendar
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from typing import List, Dict, Any

from django.db.models import Sum, Avg

from budgets.models import Budget, BudgetScope, Income, MonthlyBudget, normalize_month
from expenses.models import Expense


@dataclass(frozen=True)
class BudgetUsage:
    budget_amount: Decimal | None
    spent: Decimal
    remaining: Decimal | None
    percent_used: Decimal | None
    status: str


@dataclass(frozen=True)
class BudgetWarning:
    warning_type: str  # category_warning, category_exceeded, budget_warning, budget_exceeded
    title: str
    message: str
    category_id: int | None
    category_name: str | None
    percent_used: Decimal | None
    amount_spent: Decimal
    budget_amount: Decimal


def month_bounds(month: date) -> tuple[date, date]:
    month = normalize_month(month)
    last_day = calendar.monthrange(month.year, month.month)[1]
    return month, date(month.year, month.month, last_day)


def _status(*, spent: Decimal, budget_amount: Decimal | None, warn_threshold: Decimal | None) -> BudgetUsage:
    if budget_amount is None:
        return BudgetUsage(
            budget_amount=None,
            spent=spent,
            remaining=None,
            percent_used=None,
            status="no_budget",
        )

    remaining = budget_amount - spent
    percent_used = (spent / budget_amount) if budget_amount > 0 else None

    if percent_used is None:
        status = "ok"
    elif percent_used >= 1:
        status = "exceeded"
    elif warn_threshold is not None and percent_used >= warn_threshold:
        status = "warn"
    else:
        status = "ok"

    return BudgetUsage(
        budget_amount=budget_amount,
        spent=spent,
        remaining=remaining,
        percent_used=percent_used,
        status=status,
    )


def compute_budget_status_for_month(*, owner, month: date):
    start, end = month_bounds(month)

    totals = (
        Expense.objects.filter(created_by=owner, date__gte=start, date__lte=end)
        .values("category_id")
        .annotate(total=Sum("amount"))
    )

    spent_by_category: dict[int | None, Decimal] = {}
    for row in totals:
        spent_by_category[row["category_id"]] = row["total"] or Decimal("0")

    overall_spent = sum(spent_by_category.values(), Decimal("0"))

    overall_budget = Budget.objects.filter(
        created_by=owner, month=start, scope=BudgetScope.OVERALL
    ).first()

    category_budgets = list(
        Budget.objects.filter(created_by=owner, month=start, scope=BudgetScope.CATEGORY).select_related(
            "category"
        )
    )

    overall_usage = _status(
        spent=overall_spent,
        budget_amount=(overall_budget.amount if overall_budget else None),
        warn_threshold=(overall_budget.warn_threshold if overall_budget else None),
    )

    category_usages = []
    for budget in category_budgets:
        spent = spent_by_category.get(budget.category_id, Decimal("0"))
        usage = _status(spent=spent, budget_amount=budget.amount, warn_threshold=budget.warn_threshold)
        category_usages.append(
            {
                "budget_id": budget.id,
                "category_id": budget.category_id,
                "category_name": getattr(budget.category, "name", None),
                "budget_amount": usage.budget_amount,
                "spent": usage.spent,
                "remaining": usage.remaining,
                "percent_used": usage.percent_used,
                "status": usage.status,
            }
        )

    return {
        "month": start,
        "overall": {
            "budget_id": overall_budget.id if overall_budget else None,
            "budget_amount": overall_usage.budget_amount,
            "spent": overall_usage.spent,
            "remaining": overall_usage.remaining,
            "percent_used": overall_usage.percent_used,
            "status": overall_usage.status,
        },
        "categories": category_usages,
    }


def get_budget_warnings(*, owner, month: date) -> List[Dict[str, Any]]:
    """
    Get budget warnings for a user for a specific month.
    Returns warnings for categories near/over limit and overall budget near/over limit.
    """
    start, end = month_bounds(month)
    warnings = []

    # Get overall budget (either MonthlyBudget or Budget with scope=overall)
    monthly_budget = MonthlyBudget.objects.filter(
        created_by=owner, month=start
    ).first()
    
    overall_budget = Budget.objects.filter(
        created_by=owner, month=start, scope=BudgetScope.OVERALL
    ).first()

    total_budget_amount = None
    warn_threshold = Decimal("0.8")
    
    if monthly_budget:
        total_budget_amount = monthly_budget.total_budget
    elif overall_budget:
        total_budget_amount = overall_budget.amount
        warn_threshold = overall_budget.warn_threshold or Decimal("0.8")

    # Calculate total spending
    total_spent = Expense.objects.filter(
        created_by=owner, date__gte=start, date__lte=end
    ).aggregate(total=Sum("amount"))["total"] or Decimal("0")

    # Check overall budget
    if total_budget_amount and total_budget_amount > 0:
        percent_used = total_spent / total_budget_amount
        
        if percent_used >= 1:
            warnings.append({
                "warning_type": "budget_exceeded",
                "title": "Budget Exceeded!",
                "message": f"You've spent ৳{total_spent:,.2f} which exceeds your total budget of ৳{total_budget_amount:,.2f}",
                "category_id": None,
                "category_name": None,
                "percent_used": float(percent_used * 100),
                "amount_spent": float(total_spent),
                "budget_amount": float(total_budget_amount),
            })
        elif percent_used >= warn_threshold:
            warnings.append({
                "warning_type": "budget_warning",
                "title": "Approaching Budget Limit",
                "message": f"You've used {percent_used * 100:.1f}% of your total budget (৳{total_spent:,.2f} of ৳{total_budget_amount:,.2f})",
                "category_id": None,
                "category_name": None,
                "percent_used": float(percent_used * 100),
                "amount_spent": float(total_spent),
                "budget_amount": float(total_budget_amount),
            })

    # Check category budgets
    category_budgets = Budget.objects.filter(
        created_by=owner, month=start, scope=BudgetScope.CATEGORY
    ).select_related("category")

    category_spending = dict(
        Expense.objects.filter(
            created_by=owner, date__gte=start, date__lte=end, category__isnull=False
        ).values("category_id").annotate(total=Sum("amount")).values_list("category_id", "total")
    )

    for budget in category_budgets:
        spent = category_spending.get(budget.category_id, Decimal("0"))
        if budget.amount and budget.amount > 0:
            percent_used = spent / budget.amount
            cat_name = budget.category.name if budget.category else "Unknown"
            
            if percent_used >= 1:
                warnings.append({
                    "warning_type": "category_exceeded",
                    "title": f"{cat_name} Budget Exceeded!",
                    "message": f"You've spent ৳{spent:,.2f} on {cat_name}, exceeding the budget of ৳{budget.amount:,.2f}",
                    "category_id": budget.category_id,
                    "category_name": cat_name,
                    "percent_used": float(percent_used * 100),
                    "amount_spent": float(spent),
                    "budget_amount": float(budget.amount),
                })
            elif percent_used >= (budget.warn_threshold or Decimal("0.8")):
                warnings.append({
                    "warning_type": "category_warning",
                    "title": f"Approaching {cat_name} Limit",
                    "message": f"You've used {percent_used * 100:.1f}% of your {cat_name} budget (৳{spent:,.2f} of ৳{budget.amount:,.2f})",
                    "category_id": budget.category_id,
                    "category_name": cat_name,
                    "percent_used": float(percent_used * 100),
                    "amount_spent": float(spent),
                    "budget_amount": float(budget.amount),
                })

    return warnings


def get_spending_trends(*, owner, days: int = 30) -> Dict[str, Any]:
    """
    Analyze spending trends over the specified number of days.
    Requires at least 7 days of data for meaningful analysis.
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    
    expenses = Expense.objects.filter(
        created_by=owner,
        date__gte=start_date,
        date__lte=end_date
    ).order_by("date")
    
    if not expenses.exists():
        return {
            "has_data": False,
            "message": "No spending data available for trend analysis",
        }
    
    # Daily totals
    daily_spending = {}
    for expense in expenses:
        day_str = expense.date.isoformat()
        daily_spending[day_str] = daily_spending.get(day_str, Decimal("0")) + expense.amount
    
    days_with_data = len(daily_spending)
    if days_with_data < 7:
        return {
            "has_data": False,
            "days_available": days_with_data,
            "message": f"Need at least 7 days of data for trend analysis. Currently have {days_with_data} days.",
        }
    
    # Calculate statistics
    total_spent = sum(daily_spending.values())
    avg_daily = total_spent / Decimal(days_with_data)
    
    # Weekly breakdown
    weekly_spending = {}
    for expense in expenses:
        week_start = expense.date - timedelta(days=expense.date.weekday())
        week_key = week_start.isoformat()
        weekly_spending[week_key] = weekly_spending.get(week_key, Decimal("0")) + expense.amount
    
    # Spending velocity (recent 7 days vs previous 7 days)
    recent_start = end_date - timedelta(days=6)
    previous_start = end_date - timedelta(days=13)
    previous_end = end_date - timedelta(days=7)
    
    recent_total = Expense.objects.filter(
        created_by=owner,
        date__gte=recent_start,
        date__lte=end_date
    ).aggregate(total=Sum("amount"))["total"] or Decimal("0")
    
    previous_total = Expense.objects.filter(
        created_by=owner,
        date__gte=previous_start,
        date__lte=previous_end
    ).aggregate(total=Sum("amount"))["total"] or Decimal("0")
    
    velocity_change = None
    velocity_trend = "stable"
    if previous_total > 0:
        velocity_change = ((recent_total - previous_total) / previous_total) * 100
        if velocity_change > 10:
            velocity_trend = "increasing"
        elif velocity_change < -10:
            velocity_trend = "decreasing"
    
    # Category trends
    category_trends = list(
        expenses.values("category__name", "category_id")
        .annotate(total=Sum("amount"))
        .order_by("-total")[:5]
    )
    
    # Projection for rest of month
    today = date.today()
    month_start = date(today.year, today.month, 1)
    days_in_month = calendar.monthrange(today.year, today.month)[1]
    days_passed = (today - month_start).days + 1
    days_remaining = days_in_month - days_passed
    
    month_spending = Expense.objects.filter(
        created_by=owner,
        date__gte=month_start,
        date__lte=today
    ).aggregate(total=Sum("amount"))["total"] or Decimal("0")
    
    projected_month_total = month_spending + (avg_daily * days_remaining)
    
    return {
        "has_data": True,
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
            "days": days_with_data,
        },
        "totals": {
            "total_spent": float(total_spent),
            "average_daily": float(avg_daily),
        },
        "velocity": {
            "recent_7_days": float(recent_total),
            "previous_7_days": float(previous_total),
            "change_percent": float(velocity_change) if velocity_change else None,
            "trend": velocity_trend,
        },
        "projection": {
            "month_to_date": float(month_spending),
            "projected_month_total": float(projected_month_total),
            "days_remaining": days_remaining,
        },
        "top_categories": [
            {
                "category_id": t["category_id"],
                "category_name": t["category__name"] or "Uncategorized",
                "total": float(t["total"]),
            }
            for t in category_trends
        ],
        "daily_spending": {k: float(v) for k, v in sorted(daily_spending.items())},
        "weekly_spending": {k: float(v) for k, v in sorted(weekly_spending.items())},
    }


def generate_month_end_summary(*, owner, month: date) -> Dict[str, Any]:
    """Generate comprehensive month-end report"""
    start, end = month_bounds(month)
    
    # Total income
    total_income = Income.objects.filter(
        created_by=owner, month=start
    ).aggregate(total=Sum("amount"))["total"] or Decimal("0")
    
    # Monthly budget
    monthly_budget = MonthlyBudget.objects.filter(
        created_by=owner, month=start
    ).first()
    budget_amount = monthly_budget.total_budget if monthly_budget else total_income
    
    # Total spending
    total_spent = Expense.objects.filter(
        created_by=owner, date__gte=start, date__lte=end
    ).aggregate(total=Sum("amount"))["total"] or Decimal("0")
    
    # Category breakdown
    category_spending = list(
        Expense.objects.filter(
            created_by=owner, date__gte=start, date__lte=end
        ).values("category__name", "category_id")
        .annotate(total=Sum("amount"))
        .order_by("-total")
    )
    
    # Budget compliance per category
    category_budgets = {
        b.category_id: b for b in Budget.objects.filter(
            created_by=owner, month=start, scope=BudgetScope.CATEGORY
        )
    }
    
    category_details = []
    for cs in category_spending:
        cat_id = cs["category_id"]
        spent = cs["total"]
        budget = category_budgets.get(cat_id)
        
        detail = {
            "category_id": cat_id,
            "category_name": cs["category__name"] or "Uncategorized",
            "spent": float(spent),
            "budget": float(budget.amount) if budget else None,
            "percent_used": float((spent / budget.amount) * 100) if budget and budget.amount > 0 else None,
            "status": "no_budget",
        }
        
        if budget and budget.amount > 0:
            percent = spent / budget.amount
            if percent >= 1:
                detail["status"] = "exceeded"
            elif percent >= (budget.warn_threshold or Decimal("0.8")):
                detail["status"] = "warning"
            else:
                detail["status"] = "ok"
        
        category_details.append(detail)
    
    # Savings
    savings = budget_amount - total_spent if budget_amount else Decimal("0")
    savings_rate = (savings / budget_amount * 100) if budget_amount and budget_amount > 0 else None
    
    return {
        "month": start.isoformat(),
        "income": {
            "total": float(total_income),
        },
        "budget": {
            "total": float(budget_amount) if budget_amount else None,
        },
        "spending": {
            "total": float(total_spent),
            "by_category": category_details,
        },
        "savings": {
            "amount": float(savings),
            "rate_percent": float(savings_rate) if savings_rate else None,
        },
        "compliance": {
            "within_budget": total_spent <= budget_amount if budget_amount else None,
            "percent_used": float((total_spent / budget_amount) * 100) if budget_amount and budget_amount > 0 else None,
        },
    }
