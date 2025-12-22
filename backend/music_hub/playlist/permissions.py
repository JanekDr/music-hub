from rest_framework import permissions


class IsOwnerOrCollaboratorOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if request.method == "DELETE":
            return obj.owner == request.user

        if request.method in ["PATCH", "PUT", "POST"]:
            return obj.owner == request.user or request.user in obj.collaborators.all()

        return False


class IsOwnerOrStaffOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user or request.user.is_staff
