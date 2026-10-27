from rest_framework import permissions
from .models import CustomUser

class IsDonorUser(permissions.BasePermission):
    """Allows access only to users with the DONOR role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.role == CustomUser.Role.DONOR or request.user.is_superuser
        ))

class IsReceiverUser(permissions.BasePermission):
    """Allows access only to users with the RECEIVER role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.role == CustomUser.Role.RECEIVER or request.user.is_superuser
        ))

class IsAdminUserRole(permissions.BasePermission):
    """Allows access only to admin role or superusers."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.role == CustomUser.Role.ADMIN or request.user.is_staff or request.user.is_superuser
        ))

class IsOwnerOrReadOnly(permissions.BasePermission):
    """Object-level permission to allow only owners of an object to edit it."""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if hasattr(obj, 'donor'):
            return obj.donor == request.user or request.user.is_superuser
        if hasattr(obj, 'user'):
            return obj.user == request.user or request.user.is_superuser
        return obj == request.user or request.user.is_superuser

class IsVerifiedOrganization(permissions.BasePermission):
    """Enforces that an organization has completed verification."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.is_verified or request.user.is_superuser
        ))

