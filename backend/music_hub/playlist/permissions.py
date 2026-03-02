from rest_framework import permissions


class IsOwnerOrCollaboratorOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if obj.owner == request.user:
            return True

        if request.user in obj.collaborators.all():
            if request.method == "DELETE":
                return False
            return True

        if request.method in permissions.SAFE_METHODS:
            if obj.visibility in ["public", "unlisted"]:
                return True
            return False

        return False


class IsOwnerOrStaffOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user or request.user.is_staff
