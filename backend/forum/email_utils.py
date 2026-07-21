# backend/forum/email_utils.py
from django.core.mail import send_mail
from django.conf import settings
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


# ✨ NEW: Password Reset Email
def send_password_reset_email(user, code):
    """
    Send password reset code to user's email

    Security: Code expires in 15 minutes
    """
    subject = 'ForKa - Password Reset Code'

    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
            .code-box {{ background-color: white; border: 2px solid #dc2626; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 10px; }}
            .warning {{ color: #dc2626; font-size: 14px; margin-top: 20px; background-color: #fee2e2; padding: 15px; border-radius: 8px; }}
            .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
                <p>Hello <strong>{user.username}</strong>,</p>
                <p>We received a request to reset your password for your ForKa account.</p>
                <p>Your password reset code is:</p>
                <div class="code-box">{code}</div>
                <p>This code will expire in <strong>15 minutes</strong>.</p>
                <p>If you didn't request a password reset, you can safely ignore this email.</p>
                <div class="warning">
                    <strong>⚠️ Security Alert:</strong> Never share this code with anyone. If you didn't request this reset, your account may be at risk. Please change your password immediately.
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

    Your password reset code is: {code}

    This code will expire in 15 minutes.

    If you didn't request this, please ignore this email.

    Security Alert: If you didn't request this, your account may be at risk.

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

# Add this function to backend/forum/email_utils.py
# (reuses the send_mail / settings / logger already imported at the top of that file)


def send_login_mfa_email(user, code):
    """
    Send a login MFA code, sent after username/password check passes
    but before tokens are issued.

    Security: Code expires in 10 minutes, single use, max 5 attempts.
    """
    subject = 'ForKa - Your Login Verification Code'

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
            .warning {{ color: #dc2626; font-size: 14px; margin-top: 20px; background-color: #fee2e2; padding: 15px; border-radius: 8px; }}
            .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Login Verification</h1>
            </div>
            <div class="content">
                <p>Hello <strong>{user.username}</strong>,</p>
                <p>Someone just entered the correct password for your ForKa account. Enter this code to finish signing in:</p>
                <div class="code-box">{code}</div>
                <p>This code will expire in <strong>10 minutes</strong>.</p>
                <div class="warning">
                    <strong>⚠️ Didn't try to log in?</strong> Someone else may have your password. Change it as soon as possible and never share this code with anyone.
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
    ForKa Login Verification

    Hello {user.username},

    Someone entered the correct password for your account. Your login code is: {code}

    This code will expire in 10 minutes.

    If this wasn't you, change your password immediately and never share this code.

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
        logger.info(f"Login MFA code sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send login MFA code to {user.email}: {str(e)}")
        return False
