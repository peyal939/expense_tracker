from django.contrib import admin

from expenses.models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
	list_display = ("date", "amount", "currency", "category", "created_by", "created_at")
	search_fields = ("description", "merchant", "notes")
	list_filter = ("currency", "category")
