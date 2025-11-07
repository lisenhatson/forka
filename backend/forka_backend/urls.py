"""
Main URL Configuration untuk ForKa Backend
File: forka_backend/urls.py
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

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),
    
    # JWT Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Forum API
    path('api/', include('forum.urls')),

    # React App - catch all other routes
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html'), name='react_app'),
]

# Media files (untuk development)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # ✅ Add static files serving
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

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
