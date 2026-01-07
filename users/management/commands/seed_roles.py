from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand

from users.roles import ALL_ROLES


class Command(BaseCommand):
    help = "Create default RBAC groups (roles). Idempotent."

    def handle(self, *args, **options):
        created = []
        existing = []
        for role_name in ALL_ROLES:
            group, was_created = Group.objects.get_or_create(name=role_name)
            if was_created:
                created.append(group.name)
            else:
                existing.append(group.name)

        if created:
            self.stdout.write(self.style.SUCCESS(f"Created roles: {', '.join(created)}"))
        if existing:
            self.stdout.write(self.style.WARNING(f"Already existed: {', '.join(existing)}"))

        self.stdout.write(
            "Next: assign a user to a role via Admin → Users → <user> → Groups, "
            "or via Django shell."
        )
