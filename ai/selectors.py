from __future__ import annotations

from django.conf import settings

from ai.providers import DisabledAiService


def get_ai_service():
    # Future: switch between DisabledAiService and OllamaAiService based on settings.
    if getattr(settings, "AI_ENABLED", False):
        # When implemented, return OllamaAiService(...)
        return DisabledAiService()
    return DisabledAiService()
