from django.urls import path

from ai.views import CategorizeView, InsightsView

urlpatterns = [
    path("categorize/", CategorizeView.as_view(), name="ai-categorize"),
    path("insights/", InsightsView.as_view(), name="ai-insights"),
]
