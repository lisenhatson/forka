"""
Account models for user management
"""
from django.db import models
from django.contrib.auth.models import User
from apps.core.models import BaseModel


class Role(BaseModel):
    """
    User roles (Student, Lecturer, Staff, Admin)
    """
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=list)
    
    def __str__(self):
        return self.name


class UserRole(BaseModel):
    """
    User role assignment
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['user', 'role']
    
    def __str__(self):
        return f"{self.user.username} - {self.role.name}"