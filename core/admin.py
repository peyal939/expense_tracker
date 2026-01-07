from django.contrib import admin

from core.models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
	list_display = ("user", "notification_type", "title", "is_read", "created_at")
	list_filter = ("notification_type", "is_read", "created_at")
	search_fields = ("title", "message")
	readonly_fields = ("created_at", "updated_at")
