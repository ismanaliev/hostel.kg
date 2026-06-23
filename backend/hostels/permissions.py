from rest_framework import permissions


class IsHostelOwnerOrReadOnly(permissions.BasePermission):
    """Allow safe methods for all users, but restrict modifications to hostel owner."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user
