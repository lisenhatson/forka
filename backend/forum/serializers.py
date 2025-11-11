# backend/forum/serializers.py
# ✅ COMPLETE FILE - Copy paste ini semua

from rest_framework import serializers
from .models import User, Category, Post, Comment, Notification
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password


# ============================================
# USER SERIALIZERS
# ============================================

class UserSerializer(serializers.ModelSerializer):
    """Basic User Serializer with Profile Picture"""
    profile_picture = serializers.SerializerMethodField()
    
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
    
    def get_profile_picture(self, obj):
        """✅ Return full URL untuk profile picture"""
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                url = request.build_absolute_uri(obj.profile_picture.url)
                print(f"✅ Profile Picture URL: {url}")  # Debug log
                return url
            # Fallback jika no request context
            return f"http://localhost:8000{obj.profile_picture.url}"
        return None


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed User Serializer"""
    posts_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()
    
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
        return obj.posts.count()
    
    def get_comments_count(self, obj):
        return obj.comments.count()
    
    def get_profile_picture(self, obj):
        """✅ Return full URL untuk profile picture"""
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return f"http://localhost:8000{obj.profile_picture.url}"
        return None


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer untuk update user profile"""
    profile_picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['bio', 'phone_number', 'profile_picture']

    def validate_profile_picture(self, value):
        """Validate profile picture"""
        if value:
            # Check file size (max 5MB)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Image size must be less than 5MB")
            
            # Check file extension
            ext = value.name.split('.')[-1].lower()
            allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp']
            if ext not in allowed:
                raise serializers.ValidationError(
                    f"Invalid image format. Allowed: {', '.join(allowed)}"
                )
        
        return value

    def update(self, instance, validated_data):
        """Update user with image handling"""
        instance.bio = validated_data.get('bio', instance.bio)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)

        # Handle profile picture
        if 'profile_picture' in validated_data:
            profile_picture = validated_data.get('profile_picture')

            if profile_picture:
                # Delete old image if exists
                if instance.profile_picture:
                    try:
                        instance.profile_picture.delete(save=False)
                        print("✅ Old profile picture deleted")
                    except Exception as e:
                        print(f"⚠️ Error deleting old image: {e}")

                instance.profile_picture = profile_picture
                print(f"✅ New profile picture saved: {profile_picture.name}")
                
            elif profile_picture is None:
                # Remove profile picture
                if instance.profile_picture:
                    try:
                        instance.profile_picture.delete(save=False)
                        print("✅ Profile picture removed")
                    except Exception as e:
                        print(f"⚠️ Error deleting image: {e}")
                instance.profile_picture = None

        instance.save()
        return instance


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer untuk User Registration"""
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True, label="Confirm Password")
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'bio']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        try:
            validate_password(attrs['password'])
        except ValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        
        return attrs
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value
    
    def create(self, validated_data):
        validated_data.pop('password2')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            bio=validated_data.get('bio', ''),
            role='user'
        )
        
        return user


# ============================================
# CATEGORY SERIALIZER
# ============================================

class CategorySerializer(serializers.ModelSerializer):
    """Serializer untuk Category"""
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
        return obj.posts.count()


# ============================================
# POST SERIALIZERS
# ============================================

class PostSerializer(serializers.ModelSerializer):
    """Serializer untuk Post dengan image support"""
    author = UserSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    image = serializers.SerializerMethodField()
    
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
            'image',
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
    
    def get_image(self, obj):
        """✅ Return full URL untuk post image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                url = request.build_absolute_uri(obj.image.url)
                print(f"✅ Post Image URL: {url}")  # Debug log
                return url
            return f"http://localhost:8000{obj.image.url}"
        return None


class PostCreateSerializer(serializers.ModelSerializer):
    """Serializer khusus untuk create post dengan image upload"""
    image = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'category', 'image']
        read_only_fields = ['id']
    
    def validate_image(self, value):
        """Validate image file"""
        if value:
            # Check file size (max 10MB)
            if value.size > 10 * 1024 * 1024:
                raise serializers.ValidationError("Image size must be less than 10MB")
            
            # Check file extension
            ext = value.name.split('.')[-1].lower()
            allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp']
            if ext not in allowed:
                raise serializers.ValidationError(
                    f"Invalid image format. Allowed: {', '.join(allowed)}"
                )
            
            print(f"✅ Image validation passed: {value.name}")
        
        return value
    
    def create(self, validated_data):
        """Handle image upload saat create post"""
        if 'image' in validated_data and validated_data['image']:
            print(f"✅ Creating post with image: {validated_data['image'].name}")
        return super().create(validated_data)


# ============================================
# COMMENT SERIALIZER
# ============================================

class CommentSerializer(serializers.ModelSerializer):
    """Serializer untuk Comment"""
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
        return obj.replies.count() if hasattr(obj, 'replies') else 0


# ============================================
# NOTIFICATION SERIALIZER
# ============================================

class NotificationSerializer(serializers.ModelSerializer):
    """Serializer untuk Notification"""
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