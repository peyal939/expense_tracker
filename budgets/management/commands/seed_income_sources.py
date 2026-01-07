from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from budgets.models import IncomeSource

User = get_user_model()

SYSTEM_INCOME_SOURCES = [
    "Salary",
    "Freelance",
    "Side Hustle",
    "Business",
    "Investment",
    "Rental Income",
    "Bonus",
    "Gift",
    "Refund",
    "Other",
]


class Command(BaseCommand):
    help = "Seed system income sources"

    def handle(self, *args, **options):
        # Get or create a system user for system sources
        system_user, _ = User.objects.get_or_create(
            username="system",
            defaults={"email": "system@expense-tracker.local", "is_active": False},
        )

        created_count = 0
        for source_name in SYSTEM_INCOME_SOURCES:
            _, created = IncomeSource.objects.get_or_create(
                name=source_name,
                is_system=True,
                defaults={"created_by": system_user},
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Seeded {created_count} new system income sources")
        )
