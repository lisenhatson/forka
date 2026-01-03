from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.db.models import Q
from django.utils.text import slugify
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Count
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
# POST VIEWSET (Updated untuk Image Upload & Filtering)
# ============================================

# ============================================
# POST VIEWSET (FIXED & CONSISTENT)
# ============================================

class PostViewSet(viewsets.ModelViewSet):
    """
    API endpoint untuk Posts
    - support image upload
    - filter author & category
    - search
    - ordering
    - comments_count annotation
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
        🔥 SATU-SATUNYA SUMBER QUERYSET
        """

        queryset = (
            Post.objects
            .select_related('author', 'category')
            .annotate(comments_count=Count('comments'))
        )

        # ==========================
        # FILTER PARAMS
        # ==========================

        author_id = self.request.query_params.get('author')
        if author_id:
            queryset = queryset.filter(author_id=author_id)

        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        # ==========================
        # SORT / FILTER TYPE
        # ==========================

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

    # ==========================
    # CREATE
    # ==========================

    def perform_create(self, serializer):
        title = serializer.validated_data.get('title')
        slug = slugify(title)

        original_slug = slug
        counter = 1
        while Post.objects.filter(slug=slug).exists():
            slug = f"{original_slug}-{counter}"
            counter += 1

        serializer.save(author=self.request.user, slug=slug)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        post = Post.objects.get(id=serializer.instance.id)
        output_serializer = PostSerializer(
            post,
            context={'request': request}
        )
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    # ==========================
    # RETRIEVE
    # ==========================

    def retrieve(self, request, *args, **kwargs):
        post = self.get_object()
        post.views_count += 1
        post.save(update_fields=['views_count'])
        serializer = self.get_serializer(post)
        return Response(serializer.data)

    # ==========================
    # ACTIONS
    # ==========================

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
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
        post = self.get_object()
        post.is_pinned = not post.is_pinned
        post.save(update_fields=['is_pinned'])
        return Response({'status': 'pinned' if post.is_pinned else 'unpinned'})

    @action(detail=True, methods=['post'], permission_classes=[IsModeratorOrAdmin])
    def close(self, request, pk=None):
        post = self.get_object()
        post.is_closed = not post.is_closed
        post.save(update_fields=['is_closed'])
        return Response({'status': 'closed' if post.is_closed else 'opened'})



# ============================================
# COMMENT VIEWSET (Updated for Author Filtering)
# ============================================

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().select_related('author', 'post')
    serializer_class = CommentSerializer
    permission_classes = [CommentPermission]
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Comment.objects.select_related('author', 'post')

        # ✅ filter by post
        post_id = self.request.query_params.get('post')
        if post_id:
            queryset = queryset.filter(post_id=post_id)

        # ✅ top level only (comment utama)
        top_level = self.request.query_params.get('top_level')
        if top_level == 'true':
            queryset = queryset.filter(parent__isnull=True)

        # optional filters
        author_id = self.request.query_params.get('author')
        if author_id:
            queryset = queryset.filter(author_id=author_id)

        return queryset




    def perform_create(self, serializer):
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
