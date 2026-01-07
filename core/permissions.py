from __future__ import annotations

from typing import Iterable

from rest_framework.permissions import BasePermission

from users.roles import ROLE_ADMIN, ROLE_USER


class HasAnyRole(BasePermission):
    required_roles: Iterable[str] = ()

    def has_permission(self, request, view) -> bool:
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return user.groups.filter(name__in=tuple(self.required_roles)).exists()


class IsAdminRole(HasAnyRole):
    required_roles = (ROLE_ADMIN,)


class IsUserOrAdminRole(HasAnyRole):
    required_roles = (ROLE_USER, ROLE_ADMIN)


class IsOwnerOrAdmin(BasePermission):
    """Object-level permission.

    Expects the object to have one of: `owner_id`, `user_id`, `created_by_id`.
    Admin (or superuser) can access everything.
    """

    def has_object_permission(self, request, view, obj) -> bool:
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.groups.filter(name=ROLE_ADMIN).exists():
            return True

        owner_id = (
            getattr(obj, "owner_id", None)
            or getattr(obj, "user_id", None)
            or getattr(obj, "created_by_id", None)
        )
        return owner_id == user.id
