from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission: Object owner bisa edit/delete, yang lain cuma baca
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions untuk semua orang (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions cuma untuk owner
        return obj.author == request.user


class IsModeratorOrAdmin(permissions.BasePermission):
    """
    Permission: Cuma Moderator atau Admin yang bisa akses
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['moderator', 'admin']


class IsAdminOnly(permissions.BasePermission):
    """
    Permission: Cuma Admin yang bisa akses
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == 'admin'


class CanModerateContent(permissions.BasePermission):
    """
    Permission: Moderator/Admin bisa moderate content (delete/edit post/comment orang lain)
    User biasa cuma bisa edit/delete milik sendiri
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions untuk semua
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Moderator dan Admin bisa edit/delete semua
        if request.user.role in ['moderator', 'admin']:
            return True
        
        # User biasa cuma bisa edit/delete punya sendiri
        return obj.author == request.user


class CanPinOrClosePost(permissions.BasePermission):
    """
    Permission: Cuma Moderator/Admin yang bisa pin atau close post
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Cek apakah request mau pin/close post
        if 'is_pinned' in request.data or 'is_closed' in request.data:
            return request.user.role in ['moderator', 'admin']
        
        return True


class CanManageUsers(permissions.BasePermission):
    """
    Permission: Cuma Admin yang bisa manage users (ban, promote, etc)
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == 'admin'


class CanDeleteAnyComment(permissions.BasePermission):
    """
    Permission: Moderator/Admin bisa delete comment siapa aja
    User biasa cuma bisa delete comment sendiri
    """
    def has_object_permission(self, request, view, obj):
        if request.method != 'DELETE':
            return True
        
        # Moderator/Admin bisa delete semua comment
        if request.user.role in ['moderator', 'admin']:
            return True
        
        # User biasa cuma bisa delete comment sendiri
        return obj.author == request.user


# ============================================
# COMPOSITE PERMISSIONS (Kombinasi multiple permissions)
# ============================================

class PostPermission(permissions.BasePermission):
    """
    Combined permission untuk Post:
    - Semua orang bisa baca (GET) - TERMASUK ADMIN
    - Authenticated user bisa buat post (POST)
    - Owner bisa edit/delete post sendiri (PUT/PATCH/DELETE)
    - Moderator/Admin bisa edit/delete post siapa aja
    - Moderator/Admin bisa pin/close post
    """
    def has_permission(self, request, view):
        # ✅ PENTING: Read permission untuk SEMUA authenticated users (termasuk admin)
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated  # Hanya perlu login
        
        # Create post butuh authentication
        if request.method == 'POST':
            return request.user.is_authenticated
        
        return True
    
    def has_object_permission(self, request, view, obj):
        # Read permission untuk semua authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Moderator/Admin bisa edit/delete/pin/close semua post
        if request.user.role in ['moderator', 'admin']:
            return True
        
        # Owner bisa edit/delete post sendiri (tapi ga bisa pin/close)
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            # Cek apakah user coba pin/close (ga boleh kalau bukan moderator/admin)
            if 'is_pinned' in request.data or 'is_closed' in request.data:
                return False
            return obj.author == request.user
        
        return False


class CommentPermission(permissions.BasePermission):
    """
    Combined permission untuk Comment:
    - Semua orang bisa baca - TERMASUK ADMIN
    - Authenticated user bisa comment
    - Owner bisa edit/delete comment sendiri
    - Moderator/Admin bisa delete comment siapa aja
    """
    def has_permission(self, request, view):
        # ✅ Read permission untuk semua authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        if request.method == 'POST':
            return request.user.is_authenticated
        
        return True
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Moderator/Admin bisa edit/delete semua comment
        if request.user.role in ['moderator', 'admin']:
            return True
        
        # Owner bisa edit/delete comment sendiri
        return obj.author == request.user