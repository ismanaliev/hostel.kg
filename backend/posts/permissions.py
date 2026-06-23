from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission that allows read-only access to everyone,
    but restricts create/update/delete actions to authenticated hostel owners.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'owner'
        )

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.hostel.owner == request.user
