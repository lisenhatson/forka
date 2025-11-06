# backend/forum/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet,
    CategoryViewSet,
    PostViewSet,
    CommentViewSet,
    NotificationViewSet,
)
from .views_auth import (
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
    # ✨ Secure Authentication Endpoints
    path('auth/register/', register_user, name='register'),
    path('auth/verify-email/', verify_email, name='verify_email'),
    path('auth/resend-code/', resend_verification_code, name='resend_code'),
    path('auth/login/', login_user, name='login'),
    
    # Router URLs
    path('', include(router.urls)),
]

"""
==============================================
SECURE API ENDPOINTS SUMMARY
==============================================

AUTHENTICATION (Rate Limited):
  POST   /api/auth/register/          - Register (3/hour per IP)
  POST   /api/auth/verify-email/      - Verify email code (10/hour)
  POST   /api/auth/resend-code/       - Resend verification (10/hour)
  POST   /api/auth/login/             - Login (5/minute)
  POST   /api/token/refresh/          - Refresh JWT token

USERS:
  GET    /api/users/                  - List users (paginated)
  GET    /api/users/{id}/             - User detail
  GET    /api/users/me/               - Current user info
  PUT    /api/users/update_profile/   - Update profile
  POST   /api/users/change_password/  - Change password

CATEGORIES:
  GET    /api/categories/             - List categories
  POST   /api/categories/             - Create (admin only)
  GET    /api/categories/{slug}/      - Category detail
  PUT    /api/categories/{slug}/      - Update (admin only)

POSTS (XSS Protected):
  GET    /api/posts/                  - List posts (paginated)
  POST   /api/posts/                  - Create post
  GET    /api/posts/{id}/             - Post detail
  PUT    /api/posts/{id}/             - Update post
  DELETE /api/posts/{id}/             - Delete post
  POST   /api/posts/{id}/like/        - Like post
  POST   /api/posts/{id}/pin/         - Pin (mod/admin)
  POST   /api/posts/{id}/close/       - Close (mod/admin)

COMMENTS (XSS Protected):
  GET    /api/comments/               - List comments
  POST   /api/comments/               - Create comment
  GET    /api/comments/{id}/          - Comment detail
  PUT    /api/comments/{id}/          - Update comment
  DELETE /api/comments/{id}/          - Delete comment
  POST   /api/comments/{id}/like/     - Like comment
  GET    /api/comments/{id}/replies/  - Get replies

NOTIFICATIONS:
  GET    /api/notifications/                - List notifications
  POST   /api/notifications/{id}/mark_read/ - Mark as read
  POST   /api/notifications/mark_all_read/  - Mark all read

SECURITY FEATURES:
✅ Rate Limiting (prevents brute force)
✅ Email Verification (v2l)
✅ Account Lockout (5 failed = 15 min lock)
✅ XSS Protection (input sanitization)
✅ SQL Injection Protection (Django ORM)
✅ CSRF Protection (enabled)
✅ JWT Token Authentication
✅ Secure Password Requirements
✅ HTTPS Ready (production)
✅ Security Headers (XSS, Content-Type, Frame)
"""