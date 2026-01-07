from __future__ import annotations

from dataclasses import asdict
from datetime import date

from ai.services import AiService, CategorySuggestion, Insight


class DisabledAiService(AiService):
    def suggest_category(self, *, owner, description: str, merchant: str | None = None) -> CategorySuggestion:
        return CategorySuggestion(category_id=None, confidence=None, rationale="AI disabled")

    def monthly_insights(self, *, owner, month: date) -> list[Insight]:
        return [Insight(title="AI disabled", detail="Enable AI to get insights", severity="info")]


# Placeholder for later:
# - OllamaAiService will live here.
# - It should implement AiService and call Ollama over HTTP with timeouts and fallbacks.
