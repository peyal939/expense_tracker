from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Protocol


@dataclass(frozen=True)
class CategorySuggestion:
    category_id: int | None
    confidence: float | None
    rationale: str | None


@dataclass(frozen=True)
class Insight:
    title: str
    detail: str
    severity: str  # info|warn


class AiService(Protocol):
    def suggest_category(self, *, owner, description: str, merchant: str | None = None) -> CategorySuggestion:
        raise NotImplementedError

    def monthly_insights(self, *, owner, month: date) -> list[Insight]:
        raise NotImplementedError
