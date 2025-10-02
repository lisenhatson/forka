from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.db.models import Q
from django.utils.text import slugify

from .models import User, Category, Post, Comment, Notification
from .serializers import (
    UserSerializer, UserDetailSerializer,
    CategorySerializer,
    PostSerializer, PostCreateSerializer,
    CommentSerializer,
    NotificationSerializer
)
from .permissions import (
    PostPermission,
    CommentPermission,
    IsAdminOnly,
    IsModeratorOrAdmin
)


# ============================================
# USER VIEWSET
# ============================================

class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint untuk Users
    GET /api/users/ - List users
    GET /api/users/{id}/ - User detail
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        """Pakai serializer berbeda untuk detail"""
        if self.action == 'retrieve':
            return UserDetailSerializer
        return UserSerializer
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Get current user info
        GET /api/users/me/
        """
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_posts(self, request):
        """
        Get posts dari current user
        GET /api/users/my_posts/
        """
        posts = Post.objects.filter(author=request.user)
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)


# ============================================
# CATEGORY VIEWSET
# ============================================

class CategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint untuk Categories
    GET /api/categories/ - List categories
    POST /api/categories/ - Create (admin only)
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    
    def get_permissions(self):
        """Admin only untuk create/update/delete"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOnly()]
        return [IsAuthenticatedOrReadOnly()]
    
    @action(detail=True, methods=['get'])
    def posts(self, request, slug=None):
        """
        Get posts dari category ini
        GET /api/categories/{slug}/posts/
        """
        category = self.get_object()
        posts = Post.objects.filter(category=category)
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)


# ============================================
# POST VIEWSET
# ============================================

class PostViewSet(viewsets.ModelViewSet):
    """
    API endpoint untuk Posts
    GET /api/posts/ - List posts
    POST /api/posts/ - Create post
    GET /api/posts/{id}/ - Post detail
    PUT /api/posts/{id}/ - Update post
    DELETE /api/posts/{id}/ - Delete post
    """
    queryset = Post.objects.all().select_related('author', 'category').order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [PostPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'views_count', 'likes']
    
    def get_serializer_class(self):
        """Pakai serializer berbeda untuk create"""
        if self.action == 'create':
            return PostCreateSerializer
        return PostSerializer
    
    def get_queryset(self):
        """Filter posts berdasarkan query params"""
        queryset = super().get_queryset()
        
        # Filter by category
        category_slug = self.request.query_params.get('category', None)
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        
        # Filter by author
        author_id = self.request.query_params.get('author', None)
        if author_id:
            queryset = queryset.filter(author__id=author_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Auto set author & generate slug"""
        title = serializer.validated_data.get('title')
        slug = slugify(title)
        serializer.save(author=self.request.user, slug=slug)
    
    def retrieve(self, request, *args, **kwargs):
        """Increment views saat post dibuka"""
        instance = self.get_object()
        instance.views_count += 1
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """
        Like/Unlike post
        POST /api/posts/{id}/like/
        """
        post = self.get_object()
        
        if request.user in post.likes.all():
            post.likes.remove(request.user)
            return Response({
                'status': 'unliked',
                'likes_count': post.likes.count()
            })
        else:
            post.likes.add(request.user)
            return Response({
                'status': 'liked',
                'likes_count': post.likes.count()
            })
    
    @action(detail=True, methods=['post'], permission_classes=[IsModeratorOrAdmin])
    def pin(self, request, pk=None):
        """
        Pin/Unpin post (moderator/admin only)
        POST /api/posts/{id}/pin/
        """
        post = self.get_object()
        post.is_pinned = not post.is_pinned
        post.save()
        return Response({
            'status': 'pinned' if post.is_pinned else 'unpinned'
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsModeratorOrAdmin])
    def close(self, request, pk=None):
        """
        Close/Open post (moderator/admin only)
        POST /api/posts/{id}/close/
        """
        post = self.get_object()
        post.is_closed = not post.is_closed
        post.save()
        return Response({
            'status': 'closed' if post.is_closed else 'opened'
        })


# ============================================
# COMMENT VIEWSET
# ============================================

class CommentViewSet(viewsets.ModelViewSet):
    """
    API endpoint untuk Comments
    GET /api/comments/ - List comments
    POST /api/comments/ - Create comment
    """
    queryset = Comment.objects.all().select_related('author', 'post')
    serializer_class = CommentSerializer
    permission_classes = [CommentPermission]
    
    def get_queryset(self):
        """Filter comments by post"""
        queryset = super().get_queryset()
        
        # Filter by post
        post_id = self.request.query_params.get('post', None)
        if post_id:
            queryset = queryset.filter(post__id=post_id)
        
        # Only top-level comments (no parent)
        if self.request.query_params.get('top_level', None):
            queryset = queryset.filter(parent__isnull=True)
        
        return queryset
    
    def perform_create(self, serializer):
        """Auto set author"""
        serializer.save(author=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """
        Like/Unlike comment
        POST /api/comments/{id}/like/
        """
        comment = self.get_object()
        
        if request.user in comment.likes.all():
            comment.likes.remove(request.user)
            return Response({
                'status': 'unliked',
                'likes_count': comment.likes.count()
            })
        else:
            comment.likes.add(request.user)
            return Response({
                'status': 'liked',
                'likes_count': comment.likes.count()
            })
    
    @action(detail=True, methods=['get'])
    def replies(self, request, pk=None):
        """
        Get replies untuk comment ini
        GET /api/comments/{id}/replies/
        """
        comment = self.get_object()
        replies = Comment.objects.filter(parent=comment)
        serializer = CommentSerializer(replies, many=True)
        return Response(serializer.data)


# ============================================
# NOTIFICATION VIEWSET
# ============================================

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint untuk Notifications (read-only)
    GET /api/notifications/ - List notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Only show notifications untuk current user"""
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        Mark notification as read
        POST /api/notifications/{id}/mark_read/
        """
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """
        Mark all notifications as read
        POST /api/notifications/mark_all_read/
        """
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all marked as read'})