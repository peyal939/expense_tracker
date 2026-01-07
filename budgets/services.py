from __future__ import annotations

import calendar
from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from django.db.models import Sum

from budgets.models import Budget, BudgetScope, normalize_month
from expenses.models import Expense


@dataclass(frozen=True)
class BudgetUsage:
    budget_amount: Decimal | None
    spent: Decimal
    remaining: Decimal | None
    percent_used: Decimal | None
    status: str


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
