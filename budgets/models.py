from datetime import date
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models

from categories.models import Category
from core.models import OwnedModel


class BudgetScope(models.TextChoices):
	OVERALL = "overall", "Overall"
	CATEGORY = "category", "Category"


def normalize_month(value: date) -> date:
	return date(value.year, value.month, 1)


class Budget(OwnedModel):
	month = models.DateField(help_text="Use the first day of the month, e.g. 2026-01-01")
	scope = models.CharField(max_length=16, choices=BudgetScope.choices)
	category = models.ForeignKey(
		Category,
		on_delete=models.CASCADE,
		null=True,
		blank=True,
		related_name="budgets",
	)
	amount = models.DecimalField(max_digits=12, decimal_places=2)
	rollover_enabled = models.BooleanField(default=False)
	warn_threshold = models.DecimalField(max_digits=4, decimal_places=3, default=Decimal("0.800"))

	class Meta:
		constraints = [
			models.UniqueConstraint(
				fields=["created_by", "month", "scope", "category"],
				name="uniq_budget_per_user_month_scope_category",
			)
		]
		ordering = ["-month"]

	def clean(self):
		super().clean()
		if self.month:
			self.month = normalize_month(self.month)

		if self.amount is None or self.amount <= Decimal("0"):
			raise ValidationError({"amount": "Must be > 0"})

		if self.warn_threshold is None or not (Decimal("0") < self.warn_threshold < Decimal("1.01")):
			raise ValidationError({"warn_threshold": "Must be between 0 and 1"})

		if self.scope == BudgetScope.CATEGORY and not self.category_id:
			raise ValidationError({"category": "Required when scope=category"})
		if self.scope == BudgetScope.OVERALL and self.category_id:
			raise ValidationError({"category": "Must be empty when scope=overall"})

	def save(self, *args, **kwargs):
		if self.month:
			self.month = normalize_month(self.month)
		return super().save(*args, **kwargs)

	def __str__(self) -> str:
		return f"{self.month} {self.scope} {self.amount}"
