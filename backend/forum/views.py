from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.db.models import Q
from django.utils.text import slugify
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

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

class PostViewSet(viewsets.ModelViewSet):
    """
    API endpoint untuk Posts dengan image upload support
    """
    queryset = Post.objects.all().select_related('author', 'category').order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [PostPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'views_count', 'likes']
    
    # Parsers untuk handle multipart/form-data (image upload)
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_class(self):
        """Pakai serializer berbeda untuk create"""
        if self.action == 'create':
            return PostCreateSerializer
        return PostSerializer
    
    def get_serializer_context(self):
        """Pass request context untuk image URL"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_queryset(self):
        """Filter posts berdasarkan query params"""
        queryset = super().get_queryset()
        
        # Filter by category
        category_slug = self.request.query_params.get('category', None)
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        
        # Filter by author ID
        author_id = self.request.query_params.get('author', None)
        if author_id:
            queryset = queryset.filter(author__id=author_id)

        # ✅ Filter by author username (NEW)
        author_username = self.request.query_params.get('author__username', None)
        if author_username:
            queryset = queryset.filter(author__username=author_username)
        
        return queryset
    
    def perform_create(self, serializer):
        """Auto set author & generate slug, handle image"""
        title = serializer.validated_data.get('title')
        slug = slugify(title)
        
        # Generate unique slug
        original_slug = slug
        counter = 1
        while Post.objects.filter(slug=slug).exists():
            slug = f"{original_slug}-{counter}"
            counter += 1
        
        serializer.save(author=self.request.user, slug=slug)
    
    def create(self, request, *args, **kwargs):
        """Override create to return full post data dengan image URL"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Return full post data using PostSerializer
        post = Post.objects.get(id=serializer.instance.id)
        output_serializer = PostSerializer(post, context={'request': request})
        headers = self.get_success_headers(output_serializer.data)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def retrieve(self, request, *args, **kwargs):
        """Increment views saat post dibuka"""
        instance = self.get_object()
        instance.views_count += 1
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
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
        else:
            post.likes.add(request.user)
            return Response({
                'status': 'liked',
                'likes_count': post.likes.count()
            })
    
    @action(detail=True, methods=['post'], permission_classes=[IsModeratorOrAdmin])
    def pin(self, request, pk=None):
        """Pin/Unpin post (moderator/admin only)"""
        post = self.get_object()
        post.is_pinned = not post.is_pinned
        post.save()
        return Response({
            'status': 'pinned' if post.is_pinned else 'unpinned'
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsModeratorOrAdmin])
    def close(self, request, pk=None):
        """Close/Open post (moderator/admin only)"""
        post = self.get_object()
        post.is_closed = not post.is_closed
        post.save()
        return Response({
            'status': 'closed' if post.is_closed else 'opened'
        })


# ============================================
# COMMENT VIEWSET (Updated for Author Filtering)
# ============================================

class CommentViewSet(viewsets.ModelViewSet):
    """
    API endpoint untuk Comments
    """
    queryset = Comment.objects.all().select_related('author', 'post')
    serializer_class = CommentSerializer
    permission_classes = [CommentPermission]
    
    def get_queryset(self):
        """Filter comments by post OR author"""
        queryset = super().get_queryset()
        
        post_id = self.request.query_params.get('post', None)
        if post_id:
            queryset = queryset.filter(post__id=post_id)
        
        # ✅ Filter by author username (NEW - needed for Profile Page)
        author_username = self.request.query_params.get('author__username', None)
        if author_username:
            queryset = queryset.filter(author__username=author_username)
        
        if self.request.query_params.get('top_level', None):
            queryset = queryset.filter(parent__isnull=True)
        
        return queryset
    
    def perform_create(self, serializer):
        """Auto set author"""
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
        """Get replies untuk comment ini"""
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
}