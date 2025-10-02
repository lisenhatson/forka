from functools import wraps
from rest_framework.response import Response
from rest_framework import status


# ============================================
# ROLE CHECKER FUNCTIONS
# ============================================

def is_admin(user):
    """
    Cek apakah user adalah Admin
    """
    return user.is_authenticated and user.role == 'admin'


def is_moderator(user):
    """
    Cek apakah user adalah Moderator
    """
    return user.is_authenticated and user.role == 'moderator'


def is_moderator_or_admin(user):
    """
    Cek apakah user adalah Moderator atau Admin
    """
    return user.is_authenticated and user.role in ['moderator', 'admin']


def can_moderate_content(user, obj):
    """
    Cek apakah user bisa moderate content (edit/delete)
    - Admin/Moderator bisa moderate semua content
    - User biasa cuma bisa moderate content sendiri
    
    Args:
        user: User object
        obj: Object yang mau di-moderate (Post/Comment)
    
    Returns:
        bool: True jika user boleh moderate
    """
    if not user.is_authenticated:
        return False
    
    # Moderator/Admin bisa moderate semua
    if user.role in ['moderator', 'admin']:
        return True
    
    # User biasa cuma bisa moderate punya sendiri
    return obj.author == user


def can_pin_post(user):
    """
    Cek apakah user bisa pin post
    Cuma Moderator/Admin
    """
    return user.is_authenticated and user.role in ['moderator', 'admin']


def can_close_post(user):
    """
    Cek apakah user bisa close post
    Cuma Moderator/Admin
    """
    return user.is_authenticated and user.role in ['moderator', 'admin']


def can_manage_users(user):
    """
    Cek apakah user bisa manage users (ban, promote role, etc)
    Cuma Admin
    """
    return user.is_authenticated and user.role == 'admin'


def can_manage_categories(user):
    """
    Cek apakah user bisa manage categories
    Cuma Admin
    """
    return user.is_authenticated and user.role == 'admin'


# ============================================
# DECORATORS untuk Function-Based Views
# ============================================

def admin_required(view_func):
    """
    Decorator: Endpoint cuma bisa diakses Admin
    
    Usage:
        @admin_required
        def my_view(request):
            ...
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not is_admin(request.user):
            return Response(
                {'detail': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        return view_func(request, *args, **kwargs)
    return wrapper


def moderator_required(view_func):
    """
    Decorator: Endpoint cuma bisa diakses Moderator atau Admin
    
    Usage:
        @moderator_required
        def my_view(request):
            ...
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not is_moderator_or_admin(request.user):
            return Response(
                {'detail': 'Moderator or Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        return view_func(request, *args, **kwargs)
    return wrapper


# ============================================
# MIXINS untuk Class-Based Views
# ============================================

class AdminRequiredMixin:
    """
    Mixin: View cuma bisa diakses Admin
    
    Usage:
        class MyView(AdminRequiredMixin, APIView):
            ...
    """
    def dispatch(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response(
                {'detail': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().dispatch(request, *args, **kwargs)


class ModeratorRequiredMixin:
    """
    Mixin: View cuma bisa diakses Moderator atau Admin
    
    Usage:
        class MyView(ModeratorRequiredMixin, APIView):
            ...
    """
    def dispatch(self, request, *args, **kwargs):
        if not is_moderator_or_admin(request.user):
            return Response(
                {'detail': 'Moderator or Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().dispatch(request, *args, **kwargs)


# ============================================
# HELPER FUNCTIONS
# ============================================

def get_role_display(user):
    """
    Get human-readable role name
    
    Returns:
        str: Role display name (e.g., 'Admin', 'Moderator', 'User')
    """
    if not user.is_authenticated:
        return 'Guest'
    
    role_map = {
        'admin': 'Admin',
        'moderator': 'Moderator',
        'user': 'User',
    }
    return role_map.get(user.role, 'User')


def get_user_permissions(user):
    """
    Get list of permissions untuk user berdasarkan role
    
    Returns:
        dict: Dictionary of permissions
    """
    if not user.is_authenticated:
        return {
            'can_create_post': False,
            'can_comment': False,
            'can_moderate': False,
            'can_pin_post': False,
            'can_manage_users': False,
            'can_manage_categories': False,
        }
    
    base_permissions = {
        'can_create_post': True,
        'can_comment': True,
        'can_moderate': False,
        'can_pin_post': False,
        'can_manage_users': False,
        'can_manage_categories': False,
    }
    
    if user.role == 'moderator':
        base_permissions.update({
            'can_moderate': True,
            'can_pin_post': True,
        })
    elif user.role == 'admin':
        base_permissions.update({
            'can_moderate': True,
            'can_pin_post': True,
            'can_manage_users': True,
            'can_manage_categories': True,
        })
    
    return base_permissions