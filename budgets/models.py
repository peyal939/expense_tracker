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


class IncomeSource(OwnedModel):
	"""Preset or custom income sources (Salary, Freelance, etc.)"""
	name = models.CharField(max_length=100)
	is_system = models.BooleanField(default=False)

	class Meta:
		constraints = [
			models.UniqueConstraint(
				fields=["name"],
				condition=models.Q(is_system=True),
				name="uniq_system_income_source_name",
			),
			models.UniqueConstraint(
				fields=["created_by", "name"],
				condition=models.Q(is_system=False),
				name="uniq_user_income_source_name",
			),
		]
		ordering = ["name"]

	def __str__(self) -> str:
		return self.name


class Income(OwnedModel):
	"""Monthly income entries from various sources"""
	month = models.DateField(help_text="First day of month, e.g. 2026-01-01")
	source = models.ForeignKey(
		IncomeSource,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="incomes",
	)
	source_name = models.CharField(max_length=100, blank=True, help_text="Fallback if source deleted")
	amount = models.DecimalField(max_digits=12, decimal_places=2)
	notes = models.TextField(blank=True)

	class Meta:
		ordering = ["-month", "-created_at"]

	def clean(self):
		super().clean()
		if self.month:
			self.month = normalize_month(self.month)
		if self.amount is None or self.amount <= Decimal("0"):
			raise ValidationError({"amount": "Must be > 0"})
		# Store source name for reference
		if self.source and not self.source_name:
			self.source_name = self.source.name

	def save(self, *args, **kwargs):
		if self.month:
			self.month = normalize_month(self.month)
		if self.source and not self.source_name:
			self.source_name = self.source.name
		return super().save(*args, **kwargs)

	def __str__(self) -> str:
		return f"{self.month} - {self.source_name or 'Income'}: {self.amount}"


class MonthlyBudget(OwnedModel):
	"""
	User's total budget for a month (may differ from total income).
	Defaults to sum of incomes but can be adjusted.
	"""
	month = models.DateField(help_text="First day of month, e.g. 2026-01-01")
	total_budget = models.DecimalField(max_digits=12, decimal_places=2)
	notes = models.TextField(blank=True)

	class Meta:
		constraints = [
			models.UniqueConstraint(
				fields=["created_by", "month"],
				name="uniq_monthly_budget_per_user",
			)
		]
		ordering = ["-month"]

	def clean(self):
		super().clean()
		if self.month:
			self.month = normalize_month(self.month)
		if self.total_budget is not None and self.total_budget < Decimal("0"):
			raise ValidationError({"total_budget": "Cannot be negative"})

	def save(self, *args, **kwargs):
		if self.month:
			self.month = normalize_month(self.month)
		return super().save(*args, **kwargs)

	def __str__(self) -> str:
		return f"{self.month} Budget: {self.total_budget}"


class Budget(OwnedModel):
	"""Category budget allocation (linked to MonthlyBudget)"""
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
	allocation_percentage = models.DecimalField(
		max_digits=5, decimal_places=2, null=True, blank=True,
		help_text="Percentage of monthly budget allocated to this category"
	)
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
