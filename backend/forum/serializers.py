"""
Django REST Framework Serializers untuk ForKa
File: forum/serializers.py

Version: Simple (nanti bisa di-expand)
"""

from rest_framework import serializers
from .models import User, Category, Post, Comment, Notification


# ============================================
# USER SERIALIZER
# ============================================

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer untuk User model
    Basic info aja dulu
    """
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'role',
            'bio',
            'profile_picture',
            'date_joined',
        ]
        read_only_fields = ['id', 'date_joined']


class UserDetailSerializer(serializers.ModelSerializer):
    """
    Serializer untuk User detail (lebih lengkap)
    Dipakai untuk profile page
    """
    posts_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'role',
            'bio',
            'profile_picture',
            'phone_number',
            'date_joined',
            'posts_count',
            'comments_count',
        ]
        read_only_fields = ['id', 'date_joined']
    
    def get_posts_count(self, obj):
        """Hitung jumlah post user"""
        return obj.posts.count()
    
    def get_comments_count(self, obj):
        """Hitung jumlah comment user"""
        return obj.comments.count()


# ============================================
# CATEGORY SERIALIZER
# ============================================

class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer untuk Category
    Simple aja
    """
    posts_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'icon',
            'color',
            'posts_count',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_posts_count(self, obj):
        """Hitung jumlah post di category ini"""
        return obj.posts.count()


# ============================================
# POST SERIALIZER
# ============================================

class PostSerializer(serializers.ModelSerializer):
    """
    Serializer untuk Post
    Dengan info author & counts
    """
    author = UserSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Post
        fields = [
            'id',
            'title',
            'slug',
            'content',
            'author',
            'category',
            'category_name',
            'likes_count',
            'comments_count',
            'views_count',
            'is_pinned',
            'is_closed',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'author',
            'slug',
            'likes_count',
            'comments_count',
            'views_count',
            'created_at',
            'updated_at',
        ]


class PostCreateSerializer(serializers.ModelSerializer):
    """
    Serializer khusus untuk create post
    Lebih simple, ga perlu nested data
    """
    class Meta:
        model = Post
        fields = ['title', 'content', 'category']


# ============================================
# COMMENT SERIALIZER
# ============================================

class CommentSerializer(serializers.ModelSerializer):
    """
    Serializer untuk Comment
    Dengan info author
    """
    author = UserSerializer(read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    replies_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id',
            'post',
            'author',
            'content',
            'parent',
            'likes_count',
            'replies_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'author',
            'likes_count',
            'created_at',
            'updated_at',
        ]
    
    def get_replies_count(self, obj):
        """Hitung jumlah replies"""
        return obj.replies.count() if hasattr(obj, 'replies') else 0


# ============================================
# NOTIFICATION SERIALIZER
# ============================================

class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer untuk Notification
    Simple dulu
    """
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'sender',
            'notification_type',
            'message',
            'post',
            'comment',
            'is_read',
            'created_at',
        ]
        read_only_fields = ['id', 'sender', 'created_at']