from rest_framework.permissions import BasePermission

class IsDoctor(BasePermission):
    """
    Custom permission to only allow doctors (or admins who can act as doctors) to access.
    """
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False

        # Check if user is staff (admin) or has a profile with 'doctor' role
        # IMPORTANT: Use 'profile' because of related_name='profile' on OneToOneField
        return request.user.is_staff or \
               (hasattr(request.user, 'profile') and request.user.profile.role == 'doctor')

class IsPharmacist(BasePermission):
    """
    Custom permission to only allow pharmacists (or admins who can act as pharmacists) to access.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # IMPORTANT: Use 'profile' here too
        return request.user.is_staff or \
               (hasattr(request.user, 'profile') and request.user.profile.role == 'pharmacist')

class IsAdminUserCustom(BasePermission):
    """
    Custom permission to only allow users with is_staff=True to access.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_staff