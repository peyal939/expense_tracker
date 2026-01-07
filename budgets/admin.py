from django.contrib import admin

from budgets.models import Budget, Income, IncomeSource, MonthlyBudget


@admin.register(IncomeSource)
class IncomeSourceAdmin(admin.ModelAdmin):
	list_display = ("name", "is_system", "created_by", "created_at")
	list_filter = ("is_system",)
	search_fields = ("name",)


@admin.register(Income)
class IncomeAdmin(admin.ModelAdmin):
	list_display = ("month", "source_name", "amount", "created_by", "created_at")
	list_filter = ("month", "source")
	search_fields = ("source_name", "notes")


@admin.register(MonthlyBudget)
class MonthlyBudgetAdmin(admin.ModelAdmin):
	list_display = ("month", "total_budget", "created_by", "created_at")
	list_filter = ("month",)


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
	list_display = ("month", "scope", "category", "amount", "allocation_percentage", "created_by", "warn_threshold")
	list_filter = ("scope", "month")
