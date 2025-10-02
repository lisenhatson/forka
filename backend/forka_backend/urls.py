"""
Main URL Configuration untuk ForKa Backend
File: forka_backend/urls.py
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),
    
    # JWT Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Forum API
    path('api/', include('forum.urls')),
]

# Media files (untuk development)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

"""
API Endpoints Summary:

AUTHENTICATION:
  POST /api/token/           - Login (get access & refresh token)
  POST /api/token/refresh/   - Refresh access token

FORUM API:
  /api/users/               - User endpoints
  /api/categories/          - Category endpoints
  /api/posts/               - Post endpoints
  /api/comments/            - Comment endpoints
  /api/notifications/       - Notification endpoints
  
ADMIN:
  /admin/                   - Django admin panel
"""