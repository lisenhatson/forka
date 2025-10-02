"""
Django Admin Configuration untuk ForKa
File: forum/admin.py
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Category, Post, Comment, Notification


# ============================================
# USER ADMIN
# ============================================

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User Admin"""
    list_display = ['username', 'email', 'role', 'is_staff', 'date_joined']
    list_filter = ['role', 'is_staff', 'is_active']
    search_fields = ['username', 'email']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Custom Fields', {
            'fields': ('role', 'bio', 'profile_picture', 'phone_number')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Custom Fields', {
            'fields': ('role', 'bio')
        }),
    )


# ============================================
# CATEGORY ADMIN
# ============================================

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Category Admin"""
    list_display = ['name', 'slug', 'color', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    list_filter = ['created_at']


# ============================================
# POST ADMIN
# ============================================

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    """Post Admin"""
    list_display = ['title', 'author', 'category', 'is_pinned', 'is_closed', 'created_at']
    list_filter = ['category', 'is_pinned', 'is_closed', 'created_at']
    search_fields = ['title', 'content', 'author__username']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['views_count', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Content', {
            'fields': ('title', 'slug', 'content', 'author', 'category')
        }),
        ('Status', {
            'fields': ('is_pinned', 'is_closed')
        }),
        ('Stats', {
            'fields': ('views_count', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# ============================================
# COMMENT ADMIN
# ============================================

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    """Comment Admin"""
    list_display = ['short_content', 'author', 'post', 'parent', 'created_at']
    list_filter = ['created_at']
    search_fields = ['content', 'author__username', 'post__title']
    readonly_fields = ['created_at', 'updated_at']
    
    def short_content(self, obj):
        """Tampilkan content pendek"""
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    short_content.short_description = 'Content'


# ============================================
# NOTIFICATION ADMIN
# ============================================

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Notification Admin"""
    list_display = ['recipient', 'sender', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['recipient__username', 'sender__username', 'message']
    readonly_fields = ['created_at']
    
    actions = ['mark_as_read', 'mark_as_unread']
    
    def mark_as_read(self, request, queryset):
        """Bulk action: mark as read"""
        queryset.update(is_read=True)
    mark_as_read.short_description = "Mark selected as read"
    
    def mark_as_unread(self, request, queryset):
        """Bulk action: mark as unread"""
        queryset.update(is_read=False)
    mark_as_unread.short_description = "Mark selected as unread"


# Customize Admin Site
admin.site.site_header = "ForKa Admin"
admin.site.site_title = "ForKa Admin Portal"
admin.site.index_title = "Welcome to ForKa Administration"