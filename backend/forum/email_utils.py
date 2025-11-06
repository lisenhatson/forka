# backend/forum/email_utils.py
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)


def send_verification_email(user, code):
    """
    Send verification code to user's email
    
    Security measures:
    - Rate limited in views
    - Code expires in 10 minutes
    - One-time use only
    """
    subject = 'ForKa - Email Verification Code'
    
    # HTML email template
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #0ea5e9; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
            .code-box {{ background-color: white; border: 2px solid #0ea5e9; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 10px; }}
            .warning {{ color: #dc2626; font-size: 14px; margin-top: 20px; }}
            .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>ForKa Email Verification</h1>
            </div>
            <div class="content">
                <p>Hello <strong>{user.username}</strong>,</p>
                <p>Your verification code is:</p>
                <div class="code-box">{code}</div>
                <p>This code will expire in <strong>10 minutes</strong>.</p>
                <p>If you didn't request this code, please ignore this email.</p>
                <div class="warning">
                    ⚠️ <strong>Security Notice:</strong> Never share this code with anyone. ForKa staff will never ask for your verification code.
                </div>
            </div>
            <div class="footer">
                <p>© 2025 ForKa - Politeknik Negeri Batam</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text fallback
    plain_message = f"""
    ForKa Email Verification
    
    Hello {user.username},
    
    Your verification code is: {code}
    
    This code will expire in 10 minutes.
    
    If you didn't request this code, please ignore this email.
    
    Security Notice: Never share this code with anyone.
    
    © 2025 ForKa - Politeknik Negeri Batam
    """
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Verification email sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send verification email to {user.email}: {str(e)}")
        return False


def send_password_reset_email(user, reset_link):
    """
    Send password reset link to user's email
    
    Security: Link includes secure token and expires in 1 hour
    """
    subject = 'ForKa - Password Reset Request'
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #0ea5e9; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background-color: #0ea5e9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .warning {{ color: #dc2626; font-size: 14px; margin-top: 20px; }}
            .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>
            <div class="content">
                <p>Hello <strong>{user.username}</strong>,</p>
                <p>We received a request to reset your password for your ForKa account.</p>
                <p>Click the button below to reset your password:</p>
                <a href="{reset_link}" class="button">Reset Password</a>
                <p>This link will expire in <strong>1 hour</strong>.</p>
                <p>If you didn't request a password reset, you can safely ignore this email.</p>
                <div class="warning">
                    ⚠️ <strong>Security Notice:</strong> Never share this link with anyone. If you didn't request this, your account may be at risk.
                </div>
            </div>
            <div class="footer">
                <p>© 2025 ForKa - Politeknik Negeri Batam</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_message = f"""
    ForKa Password Reset Request
    
    Hello {user.username},
    
    We received a request to reset your password.
    
    Click this link to reset your password:
    {reset_link}
    
    This link will expire in 1 hour.
    
    If you didn't request this, please ignore this email.
    
    © 2025 ForKa - Politeknik Negeri Batam
    """
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Password reset email sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")
        return False