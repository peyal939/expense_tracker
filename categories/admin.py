from django.contrib import admin

from categories.models import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
	list_display = ("name", "is_system", "created_by", "created_at")
	search_fields = ("name",)
	list_filter = ("is_system",)
