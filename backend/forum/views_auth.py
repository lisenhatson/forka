# backend/forum/views_auth.py
"""
Secure Authentication Views with:
- Rate limiting
- Email verification
- XSS protection
- CSRF exempt for API endpoints (using JWT)
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt  # ✅ IMPORT INI
import bleach
import logging

from .models import User, EmailVerification, PasswordReset
from .serializers import UserRegistrationSerializer, UserSerializer
from .email_utils import send_verification_email, send_password_reset_email


logger = logging.getLogger(__name__)


# ============================================
# CUSTOM THROTTLE CLASSES
# ============================================

class LoginRateThrottle(AnonRateThrottle):
    """5 login attempts per minute"""
    rate = '5/minute'


class RegisterRateThrottle(AnonRateThrottle):
    """3 registrations per hour per IP"""
    rate = '3/hour'


class VerifyEmailRateThrottle(AnonRateThrottle):
    """10 verification attempts per hour"""
    rate = '10/hour'


# ============================================
# HELPER FUNCTIONS
# ============================================

def sanitize_input(text):
    """
    Remove any HTML/JavaScript from user input
    Protection against XSS attacks
    """
    if not text:
        return text
    
    # Strip all HTML tags and attributes
    clean_text = bleach.clean(
        text,
        tags=[],  # No HTML tags allowed
        attributes={},  # No attributes allowed
        strip=True
    )
    
    return clean_text.strip()


def validate_email_format(email):
    """Validate email format"""
    from django.core.validators import validate_email as django_validate_email
    try:
        django_validate_email(email)
        return True
    except ValidationError:
        return False


# ============================================
# REGISTRATION (with Email Verification)
# ============================================

@csrf_exempt  # ✅ TAMBAH INI
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([RegisterRateThrottle])
def register_user(request):
    """
    Register new user with email verification
    
    Security:
    - Rate limited (3/hour per IP)
    - Input sanitization
    - Strong password validation
    - Email verification required
    - CSRF exempt (using JWT)
    """
    try:
        # Sanitize inputs
        data = request.data.copy()
        data['username'] = sanitize_input(data.get('username', ''))
        data['email'] = sanitize_input(data.get('email', ''))
        data['bio'] = sanitize_input(data.get('bio', ''))
        
        # Validate email format
        if not validate_email_format(data.get('email')):
            return Response({
                'error': 'Invalid email format'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if email already exists
        if User.objects.filter(email=data.get('email')).exists():
            return Response({
                'error': 'Email already registered'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if username already exists
        if User.objects.filter(username=data.get('username')).exists():
            return Response({
                'error': 'Username already taken'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate password strength
        password = data.get('password')
        try:
            validate_password(password)
        except ValidationError as e:
            return Response({
                'error': list(e.messages)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user (atomic transaction)
        with transaction.atomic():
            serializer = UserRegistrationSerializer(data=data)
            
            if not serializer.is_valid():
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user = serializer.save()
            user.email_verified = False  # Require email verification
            user.save()
            
            # Generate and send verification code
            verification = EmailVerification.objects.create(user=user)
            
            if send_verification_email(user, verification.code):
                logger.info(f"User registered: {user.username} - Email verification sent")
                
                return Response({
                    'message': 'Registration successful! Please check your email for verification code.',
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                    },
                    'email_verification_required': True
                }, status=status.HTTP_201_CREATED)
            else:
                # If email fails, delete user
                user.delete()
                return Response({
                    'error': 'Failed to send verification email. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return Response({
            'error': 'Registration failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# EMAIL VERIFICATION
# ============================================

@csrf_exempt  # ✅ TAMBAH INI
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([VerifyEmailRateThrottle])
def verify_email(request):
    """
    Verify email with code sent to user
    
    Security:
    - Rate limited
    - Code expires in 10 minutes
    - One-time use only
    - CSRF exempt (using JWT)
    """
    email = sanitize_input(request.data.get('email', ''))
    code = sanitize_input(request.data.get('code', ''))
    
    if not email or not code:
        return Response({
            'error': 'Email and code are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        
        if user.email_verified:
            return Response({
                'error': 'Email already verified'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find valid verification code
        verification = EmailVerification.objects.filter(
            user=user,
            code=code,
            is_used=False
        ).order_by('-created_at').first()
        
        if not verification:
            return Response({
                'error': 'Invalid verification code'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not verification.is_valid():
            return Response({
                'error': 'Verification code has expired'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark as verified
        with transaction.atomic():
            user.email_verified = True
            user.save()
            
            verification.is_used = True
            verification.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        logger.info(f"Email verified for user: {user.username}")
        
        return Response({
            'message': 'Email verified successfully!',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)
    
    except User.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        return Response({
            'error': 'Verification failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# RESEND VERIFICATION CODE
# ============================================

@csrf_exempt  # ✅ TAMBAH INI
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([VerifyEmailRateThrottle])
def resend_verification_code(request):
    """
    Resend verification code
    
    Security:
    - Rate limited
    - Max 10 attempts per hour
    - CSRF exempt (using JWT)
    """
    email = sanitize_input(request.data.get('email', ''))
    
    if not email:
        return Response({
            'error': 'Email is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        
        if user.email_verified:
            return Response({
                'error': 'Email already verified'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Invalidate old codes
        EmailVerification.objects.filter(
            user=user,
            is_used=False
        ).update(is_used=True)
        
        # Generate new code
        verification = EmailVerification.objects.create(user=user)
        
        if send_verification_email(user, verification.code):
            return Response({
                'message': 'Verification code sent to your email'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to send email'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except User.DoesNotExist:
        # Don't reveal if email exists (security)
        return Response({
            'message': 'If the email exists, verification code has been sent'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Resend verification error: {str(e)}")
        return Response({
            'error': 'Failed to resend code'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# SECURE LOGIN
# ============================================

@csrf_exempt  # ✅ TAMBAH INI
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def login_user(request):
    """
    Secure login with:
    - Rate limiting (5 attempts/minute)
    - Account lockout (5 failed attempts = 15 min lock)
    - Email verification check
    - CSRF exempt (using JWT)
    """
    username = sanitize_input(request.data.get('username', ''))
    password = request.data.get('password', '')  # Don't sanitize password
    
    if not username or not password:
        return Response({
            'error': 'Username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(username=username)
        
        # Check if account is locked
        if user.is_account_locked():
            lock_time_remaining = (user.account_locked_until - timezone.now()).seconds // 60
            return Response({
                'error': f'Account locked. Try again in {lock_time_remaining} minutes.',
                'locked_until': user.account_locked_until.isoformat()
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Verify password
        if not user.check_password(password):
            user.increment_failed_login()
            logger.warning(f"Failed login attempt for user: {username}")
            
            return Response({
                'error': 'Invalid credentials',
                'attempts_remaining': 5 - user.failed_login_attempts
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check email verification
        if not user.email_verified:
            return Response({
                'error': 'Email not verified',
                'email_verification_required': True,
                'email': user.email
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Successful login
        user.reset_failed_login()
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        logger.info(f"Successful login: {username}")
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)
    
    except User.DoesNotExist:
        # Don't reveal if user exists (security)
        logger.warning(f"Login attempt for non-existent user: {username}")
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return Response({
            'error': 'Login failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# FORGOT PASSWORD
# ============================================

@csrf_exempt  # ✅ TAMBAH INI
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([VerifyEmailRateThrottle])
def forgot_password(request):
    """
    Request password reset code
    
    Security:
    - Rate limited (10/hour)
    - Code expires in 15 minutes
    - One-time use only
    - Don't reveal if email exists
    - CSRF exempt (using JWT)
    """
    email = sanitize_input(request.data.get('email', ''))
    
    if not email:
        return Response({
            'error': 'Email is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate email format
    if not validate_email_format(email):
        return Response({
            'error': 'Invalid email format'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        
        # Invalidate old reset codes
        PasswordReset.objects.filter(
            user=user,
            is_used=False
        ).update(is_used=True)
        
        # Generate new reset code
        reset_code = PasswordReset.objects.create(user=user)
        
        if send_password_reset_email(user, reset_code.code):
            logger.info(f"Password reset code sent to {email}")
            return Response({
                'message': 'If this email is registered, a reset code has been sent'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to send reset code'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except User.DoesNotExist:
        # Don't reveal if email exists (security best practice)
        logger.warning(f"Password reset requested for non-existent email: {email}")
        return Response({
            'message': 'If this email is registered, a reset code has been sent'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Forgot password error: {str(e)}")
        return Response({
            'error': 'Failed to process request'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# VERIFY RESET CODE
# ============================================

@csrf_exempt  # ✅ TAMBAH INI
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([VerifyEmailRateThrottle])
def verify_reset_code(request):
    """
    Verify password reset code
    
    Returns a temporary token if code is valid
    CSRF exempt (using JWT)
    """
    email = sanitize_input(request.data.get('email', ''))
    code = sanitize_input(request.data.get('code', ''))
    
    if not email or not code:
        return Response({
            'error': 'Email and code are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        
        # Find valid reset code
        reset_code = PasswordReset.objects.filter(
            user=user,
            code=code,
            is_used=False
        ).order_by('-created_at').first()
        
        if not reset_code:
            return Response({
                'error': 'Invalid reset code'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not reset_code.is_valid():
            return Response({
                'error': 'Reset code has expired'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Code is valid, return success (don't mark as used yet)
        logger.info(f"Reset code verified for user: {user.username}")
        
        return Response({
            'message': 'Code verified successfully',
            'email': email,
            'code': code  # Send back for reset password step
        }, status=status.HTTP_200_OK)
    
    except User.DoesNotExist:
        return Response({
            'error': 'Invalid reset code'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Verify reset code error: {str(e)}")
        return Response({
            'error': 'Verification failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# RESET PASSWORD
# ============================================

@csrf_exempt  # ✅ TAMBAH INI
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([VerifyEmailRateThrottle])
def reset_password(request):
    """
    Reset password with verified code
    
    Security:
    - Requires valid reset code
    - Strong password validation
    - Code is marked as used after reset
    - CSRF exempt (using JWT)
    """
    email = sanitize_input(request.data.get('email', ''))
    code = sanitize_input(request.data.get('code', ''))
    new_password = request.data.get('new_password', '')
    new_password2 = request.data.get('new_password2', '')
    
    if not email or not code or not new_password or not new_password2:
        return Response({
            'error': 'All fields are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if new_password != new_password2:
        return Response({
            'error': 'Passwords do not match'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        
        # Validate password strength
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response({
                'error': list(e.messages)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find valid reset code
        reset_code = PasswordReset.objects.filter(
            user=user,
            code=code,
            is_used=False
        ).order_by('-created_at').first()
        
        if not reset_code:
            return Response({
                'error': 'Invalid or expired reset code'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not reset_code.is_valid():
            return Response({
                'error': 'Reset code has expired'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Reset password (atomic transaction)
        with transaction.atomic():
            user.set_password(new_password)
            user.save()
            
            # Mark code as used
            reset_code.is_used = True
            reset_code.save()
            
            # Reset failed login attempts
            user.reset_failed_login()
        
        logger.info(f"Password reset successful for user: {user.username}")
        
        return Response({
            'message': 'Password reset successfully! You can now login with your new password.'
        }, status=status.HTTP_200_OK)
    
    except User.DoesNotExist:
        return Response({
            'error': 'Invalid reset code'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Reset password error: {str(e)}")
        return Response({
            'error': 'Password reset failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)