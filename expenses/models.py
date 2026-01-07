from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models

from categories.models import Category
from core.models import OwnedModel


class Expense(OwnedModel):
	amount = models.DecimalField(max_digits=12, decimal_places=2)
	currency = models.CharField(max_length=8, default="BDT")
	date = models.DateField()
	description = models.TextField()

	category = models.ForeignKey(
		Category,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="expenses",
	)

	payment_method = models.CharField(max_length=32, blank=True)
	notes = models.TextField(blank=True)
	merchant = models.CharField(max_length=120, blank=True)
	receipt = models.FileField(upload_to="receipts/", blank=True)

	class Meta:
		indexes = [
			models.Index(fields=["created_by", "date"], name="idx_expense_user_date"),
			models.Index(fields=["created_by", "category"], name="idx_expense_user_cat"),
		]
		ordering = ["-date", "-id"]

	def clean(self):
		super().clean()
		if self.amount is None or self.amount <= Decimal("0"):
			raise ValidationError({"amount": "Must be > 0"})
		if not self.description or not self.description.strip():
			raise ValidationError({"description": "Required"})

	def __str__(self) -> str:
		return f"{self.date} {self.amount} {self.description[:30]}"
