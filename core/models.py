from django.conf import settings
from django.db import models


class TimeStampedModel(models.Model):
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		abstract = True


class OwnedModel(TimeStampedModel):
	created_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="%(app_label)s_%(class)s_created",
	)

	class Meta:
		abstract = True


class NotificationType(models.TextChoices):
	CATEGORY_WARNING = "category_warning", "Category Budget Warning"
	CATEGORY_EXCEEDED = "category_exceeded", "Category Budget Exceeded"
	BUDGET_WARNING = "budget_warning", "Total Budget Warning"
	BUDGET_EXCEEDED = "budget_exceeded", "Total Budget Exceeded"
	TREND_ALERT = "trend_alert", "Spending Trend Alert"
	MONTH_END_SUMMARY = "month_end_summary", "Month End Summary"


class Notification(TimeStampedModel):
	"""User notifications for budget alerts and reports"""
	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="notifications",
	)
	notification_type = models.CharField(
		max_length=32,
		choices=NotificationType.choices,
	)
	title = models.CharField(max_length=200)
	message = models.TextField()
	data = models.JSONField(default=dict, blank=True, help_text="Additional context data")
	is_read = models.BooleanField(default=False)
	month = models.DateField(null=True, blank=True, help_text="Related month if applicable")

	class Meta:
		ordering = ["-created_at"]
		indexes = [
			models.Index(fields=["user", "is_read"]),
			models.Index(fields=["user", "notification_type"]),
		]

	def __str__(self) -> str:
		return f"{self.user} - {self.title}"
