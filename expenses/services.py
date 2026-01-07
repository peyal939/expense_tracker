from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import serializers

from core.rbac import is_admin
from expenses.models import Expense


def assert_expense_editable(*, expense: Expense, actor) -> None:
    if is_admin(actor):
        return

    window_hours = getattr(settings, "EXPENSE_EDIT_WINDOW_HOURS", 72)
    cutoff = timezone.now() - timedelta(hours=window_hours)
    if expense.created_at < cutoff:
        raise serializers.ValidationError(
            {
                "detail": f"Expense can only be edited/deleted within {window_hours} hours of creation"
            }
        )
