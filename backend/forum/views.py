# backend/forum/views.py
"""
Complete Forum Views with Mark as Solved Feature
Updated: 2025-01-05
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.db.models import Q, Count
from django.utils.text import slugify
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils.timezone import now
from datetime import timedelta

from .models import User, Category, Post, Comment, Notification
from .serializers import (
    UserSerializer, UserDetailSerializer, UserRegistrationSerializer,
    UserUpdateSerializer,
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
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return UserDetailSerializer
        return UserSerializer
    
    def get_serializer_context(self):
        """Pass request context to serializer"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to ensure context"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user info"""
        serializer = UserDetailSerializer(
            request.user, 
            context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'], permission_classes=[IsAuthenticated], parser_classes=[MultiPartParser, FormParser, JSONParser])
    def update_profile(self, request):
        """Update current user profile (including profile picture)"""
        user = request.user

        serializer = UserUpdateSerializer(
            user,
            data=request.data,
            partial=True,
            context={'request': request}
        )

        if serializer.is_valid():
            updated_user = serializer.save()

            response_serializer = UserDetailSerializer(
                updated_user,
                context={'request': request}
            )

            return Response({
                'message': 'Profile updated successfully',
                'user': response_serializer.data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Change user password"""
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        new_password2 = request.data.get('new_password2')
        
        if not old_password or not new_password or not new_password2:
            return Response(
                {'error': 'All fields are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.check_password(old_password):
            return Response(
                {'error': 'Old password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_password != new_password2:
            return Response(
                {'error': 'New passwords do not match'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response(
                {'error': list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Password changed successfully'
        })


# ============================================
# CATEGORY VIEWSET
# ============================================

class CategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint untuk Categories
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
        """Get posts dari category ini"""
        category = self.get_object()
        posts = Post.objects.filter(category=category)
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)


# ============================================
# POST VIEWSET - WITH MARK AS SOLVED
# ============================================

class PostViewSet(viewsets.ModelViewSet):
    """
    API endpoint untuk Posts
    - support image upload
    - filter author & category
    - search
    - ordering
    - comments_count annotation
    - mark as solved feature
    """
    serializer_class = PostSerializer
    permission_classes = [PostPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'views_count']
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.action == 'create':
            return PostCreateSerializer
        return PostSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        """
        Queryset with filters and annotations
        """
        queryset = (
            Post.objects
            .select_related('author', 'category')
            .annotate(comments_count=Count('comments'))
        )

        # Filter by author
        author_id = self.request.query_params.get('author')
        if author_id:
            queryset = queryset.filter(author_id=author_id)

        # Filter by category
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        # Filter type (new, top, hot)
        filter_type = self.request.query_params.get('filter')

        if filter_type == 'new':
            queryset = queryset.order_by('-created_at')

        elif filter_type == 'top':
            queryset = queryset.order_by('-comments_count', '-created_at')

        elif filter_type == 'hot':
            seven_days_ago = now() - timedelta(days=7)
            queryset = queryset.filter(
                created_at__gte=seven_days_ago
            ).order_by('-views_count')

        else:
            queryset = queryset.order_by('-created_at')

        return queryset

    def perform_create(self, serializer):
        """Create post with auto-generated slug"""
        title = serializer.validated_data.get('title')
        slug = slugify(title)

        # Ensure unique slug
        original_slug = slug
        counter = 1
        while Post.objects.filter(slug=slug).exists():
            slug = f"{original_slug}-{counter}"
            counter += 1

        serializer.save(author=self.request.user, slug=slug)

    def create(self, request, *args, **kwargs):
        """Create post and return full serializer"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        post = Post.objects.get(id=serializer.instance.id)
        output_serializer = PostSerializer(
            post,
            context={'request': request}
        )
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        """Retrieve post and increment view count"""
        post = self.get_object()
        post.views_count += 1
        post.save(update_fields=['views_count'])
        serializer = self.get_serializer(post)
        return Response(serializer.data)

    # ============================================
    # POST ACTIONS
    # ============================================

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """Like/Unlike post"""
        post = self.get_object()

        if request.user in post.likes.all():
            post.likes.remove(request.user)
            return Response({
                'status': 'unliked',
                'likes_count': post.likes.count()
            })

        post.likes.add(request.user)
        return Response({
            'status': 'liked',
            'likes_count': post.likes.count()
        })

    @action(detail=True, methods=['post'], permission_classes=[IsModeratorOrAdmin])
    def pin(self, request, pk=None):
        """Pin/Unpin post (Moderator/Admin only)"""
        post = self.get_object()
        post.is_pinned = not post.is_pinned
        post.save(update_fields=['is_pinned'])
        
        return Response({
            'status': 'pinned' if post.is_pinned else 'unpinned',
            'is_pinned': post.is_pinned
        })

    @action(detail=True, methods=['post'], permission_classes=[IsModeratorOrAdmin])
    def close(self, request, pk=None):
        """Close/Open post (Moderator/Admin only)"""
        post = self.get_object()
        post.is_closed = not post.is_closed
        post.save(update_fields=['is_closed'])
        
        return Response({
            'status': 'closed' if post.is_closed else 'opened',
            'is_closed': post.is_closed
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_solved(self, request, pk=None):
        """
        Mark post as solved/unsolved (only post author can do this)
        
        Security:
        - Only post author can mark as solved
        - Cannot mark closed posts as solved
        - Optional: Set best answer by providing comment_id
        
        Request body (optional):
        {
            "comment_id": 123  // ID of the best answer comment
        }
        """
        post = self.get_object()
        
        # Check if user is the post author
        if post.author != request.user:
            return Response(
                {
                    'error': 'Only the post author can mark this as solved',
                    'detail': 'You do not have permission to perform this action.'
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if post is closed
        if post.is_closed:
            return Response(
                {
                    'error': 'Cannot mark closed posts as solved',
                    'detail': 'This post has been closed by a moderator.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Toggle solved status
        post.is_solved = not post.is_solved
        
        if post.is_solved:
            # Mark as solved
            post.solved_at = now()
            
            # Optional: Set best answer if comment_id provided
            comment_id = request.data.get('comment_id')
            if comment_id:
                try:
                    comment = Comment.objects.get(id=comment_id, post=post)
                    post.best_answer = comment
                except Comment.DoesNotExist:
                    # Invalid comment_id, but still mark as solved
                    pass
        else:
            # Mark as unsolved
            post.solved_at = None
            post.best_answer = None
        
        post.save()
        
        return Response({
            'status': 'success',
            'is_solved': post.is_solved,
            'solved_at': post.solved_at.isoformat() if post.solved_at else None,
            'best_answer': post.best_answer.id if post.best_answer else None,
            'message': 'Post marked as solved' if post.is_solved else 'Post marked as unsolved'
        }, status=status.HTTP_200_OK)


# ============================================
# COMMENT VIEWSET
# ============================================

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().select_related('author', 'post')
    serializer_class = CommentSerializer
    permission_classes = [CommentPermission]
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Comment.objects.select_related('author', 'post')

        # Filter by post
        post_id = self.request.query_params.get('post')
        if post_id:
            queryset = queryset.filter(post_id=post_id)

        # Filter top level comments only
        top_level = self.request.query_params.get('top_level')
        if top_level == 'true':
            queryset = queryset.filter(parent__isnull=True)

        # Filter by author (optional)
        author_id = self.request.query_params.get('author')
        if author_id:
            queryset = queryset.filter(author_id=author_id)

        return queryset

    def perform_create(self, serializer):
        """Create comment with author"""
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """Like/Unlike comment"""
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
        """Get replies for a comment"""
        comment = self.get_object()
        replies = comment.replies.select_related('author')
        serializer = self.get_serializer(replies, many=True)
        return Response(serializer.data)


# ============================================
# NOTIFICATION VIEWSET
# ============================================

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint untuk Notifications (read-only)
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Only show notifications untuk current user"""
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all marked as read'})


# ============================================
# VIEWS SUMMARY
# ============================================
"""
API ENDPOINTS AVAILABLE:

USER ENDPOINTS:
  GET    /api/users/                - List users
  GET    /api/users/{id}/           - User detail
  GET    /api/users/me/             - Current user info
  PUT    /api/users/update_profile/ - Update profile (with image)
  POST   /api/users/change_password/- Change password

CATEGORY ENDPOINTS:
  GET    /api/categories/           - List categories
  POST   /api/categories/           - Create (admin only)
  GET    /api/categories/{slug}/    - Category detail
  GET    /api/categories/{slug}/posts/ - Posts in category

POST ENDPOINTS:
  GET    /api/posts/                - List posts (with filters)
  POST   /api/posts/                - Create post (with image)
  GET    /api/posts/{id}/           - Post detail (increment views)
  PUT    /api/posts/{id}/           - Update post
  DELETE /api/posts/{id}/           - Delete post
  POST   /api/posts/{id}/like/      - Like/Unlike post
  POST   /api/posts/{id}/pin/       - Pin/Unpin (mod/admin)
  POST   /api/posts/{id}/close/     - Close/Open (mod/admin)
  POST   /api/posts/{id}/mark_solved/ - Mark as Solved (author only) ✅ NEW

COMMENT ENDPOINTS:
  GET    /api/comments/             - List comments (filter by post)
  POST   /api/comments/             - Create comment
  GET    /api/comments/{id}/        - Comment detail
  PUT    /api/comments/{id}/        - Update comment
  DELETE /api/comments/{id}/        - Delete comment
  POST   /api/comments/{id}/like/   - Like/Unlike comment
  GET    /api/comments/{id}/replies/- Get comment replies

NOTIFICATION ENDPOINTS:
  GET    /api/notifications/              - List notifications
  POST   /api/notifications/{id}/mark_read/ - Mark as read
  POST   /api/notifications/mark_all_read/  - Mark all read

FILTERS & SEARCH:
  ?author=<id>         - Filter by author
  ?category=<id>       - Filter by category
  ?filter=new          - Sort by newest
  ?filter=top          - Sort by most comments
  ?filter=hot          - Hot posts (last 7 days, high views)
  ?search=<query>      - Search in title/content
  ?top_level=true      - Only top-level comments (no replies)

PERMISSIONS:
  - Public: Can view posts/comments (read-only)
  - Authenticated: Can create posts/comments, like, mark solved
  - Author: Can edit/delete own content, mark own posts as solved
  - Moderator: Can pin/close posts, delete any content
  - Admin: Full access, can manage users and categories
"""