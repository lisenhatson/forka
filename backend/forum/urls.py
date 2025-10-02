"""
URL Configuration untuk Forum App
File: forum/urls.py
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet,
    CategoryViewSet,
    PostViewSet,
    CommentViewSet,
    NotificationViewSet
)

# Router untuk automatic URL routing
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'posts', PostViewSet, basename='post')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]

"""
Generated URLs:

USERS:
  GET    /api/users/                - List users
  GET    /api/users/{id}/           - User detail
  GET    /api/users/me/             - Current user info
  GET    /api/users/my_posts/       - Current user's posts

CATEGORIES:
  GET    /api/categories/           - List categories
  POST   /api/categories/           - Create category (admin)
  GET    /api/categories/{slug}/    - Category detail
  PUT    /api/categories/{slug}/    - Update category (admin)
  DELETE /api/categories/{slug}/    - Delete category (admin)
  GET    /api/categories/{slug}/posts/ - Posts in category

POSTS:
  GET    /api/posts/                - List posts
  POST   /api/posts/                - Create post
  GET    /api/posts/{id}/           - Post detail
  PUT    /api/posts/{id}/           - Update post
  DELETE /api/posts/{id}/           - Delete post
  POST   /api/posts/{id}/like/      - Like/unlike post
  POST   /api/posts/{id}/pin/       - Pin/unpin post (mod/admin)
  POST   /api/posts/{id}/close/     - Close/open post (mod/admin)

COMMENTS:
  GET    /api/comments/             - List comments
  POST   /api/comments/             - Create comment
  GET    /api/comments/{id}/        - Comment detail
  PUT    /api/comments/{id}/        - Update comment
  DELETE /api/comments/{id}/        - Delete comment
  POST   /api/comments/{id}/like/   - Like/unlike comment
  GET    /api/comments/{id}/replies/ - Get replies

NOTIFICATIONS:
  GET    /api/notifications/        - List notifications
  GET    /api/notifications/{id}/   - Notification detail
  POST   /api/notifications/{id}/mark_read/ - Mark as read
  POST   /api/notifications/mark_all_read/  - Mark all as read
"""