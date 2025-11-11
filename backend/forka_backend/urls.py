# backend/forka_backend/urls.py
"""
Main URL Configuration untuk ForKa Backend
UPDATED: Added proper media files serving
"""

from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# Import router and views
from rest_framework.routers import DefaultRouter
from forum.views import (
    UserViewSet,
    CategoryViewSet,
    PostViewSet,
    CommentViewSet,
    NotificationViewSet,
)
from forum.views_auth import (
    register_user,
    verify_email,
    resend_verification_code,
    login_user,
)

# Router untuk automatic URL routing
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'posts', PostViewSet, basename='post')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),
    
    # JWT Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # ✨ Secure Authentication Endpoints
    path('api/auth/register/', register_user, name='register'),
    path('api/auth/verify-email/', verify_email, name='verify_email'),
    path('api/auth/resend-code/', resend_verification_code, name='resend_code'),
    path('api/auth/login/', login_user, name='login'),
    
    # Forum API
    path('api/', include(router.urls)),
]

# ✅ CRITICAL: Media & Static files serving (Development only)
if settings.DEBUG:
    # ✅ Serve media files (MUST be before catch-all route)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
    # ✅ Serve static files
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # ✅ Debug info
    print("=" * 60)
    print("✅ MEDIA FILES CONFIGURATION")
    print("=" * 60)
    print(f"Media URL: {settings.MEDIA_URL}")
    print(f"Media Root: {settings.MEDIA_ROOT}")
    print(f"Media files will be served at: http://localhost:8000{settings.MEDIA_URL}")
    print("=" * 60)

# ✅ React App - catch all other routes (MUST be last!)
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html'), name='react_app'),
]


"""
==============================================
API ENDPOINTS SUMMARY
==============================================

AUTHENTICATION (Rate Limited):
  POST   /api/token/                - Login (get access & refresh token)
  POST   /api/token/refresh/        - Refresh access token
  POST   /api/auth/register/        - Register (3/hour per IP)
  POST   /api/auth/verify-email/    - Verify email code (10/hour)
  POST   /api/auth/resend-code/     - Resend verification (10/hour)
  POST   /api/auth/login/           - Login (5/minute)

USERS:
  GET    /api/users/                - List users (paginated)
  GET    /api/users/{id}/           - User detail
  GET    /api/users/me/             - Current user info
  PUT    /api/users/update_profile/ - Update profile (with image)
  POST   /api/users/change_password/- Change password

CATEGORIES:
  GET    /api/categories/           - List categories
  POST   /api/categories/           - Create (admin only)
  GET    /api/categories/{slug}/    - Category detail
  PUT    /api/categories/{slug}/    - Update (admin only)

POSTS:
  GET    /api/posts/                - List posts (paginated)
  POST   /api/posts/                - Create post (with image)
  GET    /api/posts/{id}/           - Post detail
  PUT    /api/posts/{id}/           - Update post
  DELETE /api/posts/{id}/           - Delete post
  POST   /api/posts/{id}/like/      - Like post
  POST   /api/posts/{id}/pin/       - Pin (mod/admin)
  POST   /api/posts/{id}/close/     - Close (mod/admin)

COMMENTS:
  GET    /api/comments/             - List comments
  POST   /api/comments/             - Create comment
  GET    /api/comments/{id}/        - Comment detail
  PUT    /api/comments/{id}/        - Update comment
  DELETE /api/comments/{id}/        - Delete comment
  POST   /api/comments/{id}/like/   - Like comment
  GET    /api/comments/{id}/replies/- Get replies

NOTIFICATIONS:
  GET    /api/notifications/              - List notifications
  POST   /api/notifications/{id}/mark_read/ - Mark as read
  POST   /api/notifications/mark_all_read/  - Mark all read

MEDIA FILES (Development):
  GET    /media/profiles/{filename}  - Profile pictures
  GET    /media/posts/{filename}     - Post images

ADMIN:
  /admin/                            - Django admin panel
"""