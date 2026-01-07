from users.roles import ROLE_ADMIN


def is_admin(user) -> bool:
    if not user or not getattr(user, "is_authenticated", False):
        return False
    return bool(user.is_superuser or user.groups.filter(name=ROLE_ADMIN).exists())
