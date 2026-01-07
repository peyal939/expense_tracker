from django.contrib import admin

from budgets.models import Budget


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
	list_display = ("month", "scope", "category", "amount", "created_by", "warn_threshold")
	list_filter = ("scope", "month")
