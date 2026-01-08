# backend/forka_backend/settings.py
"""
JWT-ONLY SECURE Django settings for forka_backend project.
REST API menggunakan JWT, CSRF hanya untuk Django Admin
"""

from pathlib import Path
from decouple import config, Csv
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# ============================================
# SECURITY SETTINGS
# ============================================

SECRET_KEY = config('SECRET_KEY', default='django-insecure-CHANGE-THIS-IN-PRODUCTION')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv())

# ✨ SECURITY HEADERS
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# ✨ HTTPS Settings (production only)
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True


# ============================================
# CSRF CONFIGURATION - JWT-ONLY APPROACH
# ============================================

"""
🔒 SECURITY ARCHITECTURE:
- REST API endpoints: JWT authentication (NO CSRF needed)
- Django Admin: Session + CSRF protection
- Separation of concerns: API vs Admin

Why JWT doesn't need CSRF:
1. JWT stored in localStorage (not cookies)
2. Attacker sites can't access localStorage
3. JWT sent manually via Authorization header
4. Cross-site requests can't steal JWT tokens
"""

# ✅ CSRF Settings (for Django Admin only)
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'
CSRF_COOKIE_SECURE = not DEBUG

# ✅ Session Settings (for Django Admin only)
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_AGE = 1209600  # 2 weeks

# ✅ CSRF Trusted Origins (for Django Admin if needed)
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# ⚠️ NOTE: API endpoints akan menggunakan @csrf_exempt
# Karena JWT sudah provide sufficient security


# ============================================
# APPLICATION DEFINITION
# ============================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'corsheaders',
    'rest_framework_simplejwt',
    
    # Local apps
    'forum',
]

AUTH_USER_MODEL = 'forum.User'

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',  # ✅ Active for Admin only
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'forka_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR.parent / 'frontend' / 'dist'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'forka_backend.wsgi.application'


# ============================================
# DATABASE (Secure Configuration)
# ============================================

DATABASES = {
    'default': {
        'ENGINE': config('DB_ENGINE'),
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT'),
        'CONN_MAX_AGE': 600,
        'OPTIONS': {'connect_timeout': 10},
    }
}


# ============================================
# PASSWORD VALIDATION (Strong Requirements)
# ============================================

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# ============================================
# EMAIL CONFIGURATION (Secure)
# ============================================

EMAIL_BACKEND = config(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.console.EmailBackend'
)

EMAIL_HOST = config('EMAIL_HOST')
EMAIL_PORT = config('EMAIL_PORT', cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL')


# ============================================
# INTERNATIONALIZATION
# ============================================

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Jakarta'
USE_I18N = True
USE_TZ = True


# ============================================
# STATIC FILES
# ============================================

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR.parent / 'frontend' / 'dist',
]


# ============================================
# MEDIA FILES
# ============================================

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
FILE_UPLOAD_PERMISSIONS = 0o644

ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']

def create_media_folders():
    """Automatically create media folders if they don't exist"""
    folders = [
        MEDIA_ROOT / 'profiles',
        MEDIA_ROOT / 'posts',
        BASE_DIR / 'staticfiles',
        BASE_DIR / 'logs',
    ]
    
    for folder in folders:
        if not folder.exists():
            folder.mkdir(parents=True, exist_ok=True)

create_media_folders()


# ============================================
# CORS CONFIGURATION (Development)
# ============================================

# ✅ Development: Allow all (Production: specify domains)
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH', 
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',  # ✅ IMPORTANT: For JWT token
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-requested-with',
]

CORS_EXPOSE_HEADERS = [
    'Content-Length',
    'Content-Type',
    'Content-Disposition',
]


# ============================================
# REST FRAMEWORK - JWT AUTHENTICATION
# ============================================

REST_FRAMEWORK = {
    # ✅ JWT-ONLY Authentication
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    
    # ✅ Rate Limiting (Security Layer)
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'login': '5/minute',
        'register': '3/hour',
        'verify_email': '10/hour',
    },
    
    # ✅ Pagination
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    
    # ✅ JSON Renderer (Disable Browsable API in production)
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ] if not DEBUG else [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
}


# ============================================
# JWT CONFIGURATION - SECURE SETTINGS
# ============================================

SIMPLE_JWT = {
    # ✅ Token Lifetimes
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    
    # ✅ Security Features
    'ROTATE_REFRESH_TOKENS': True,  # New refresh token on refresh
    'BLACKLIST_AFTER_ROTATION': True,  # Blacklist old tokens
    'UPDATE_LAST_LOGIN': True,
    
    # ✅ Algorithm & Key
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    
    # ✅ Header Configuration
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    
    # ✅ Token Claims
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
    
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}


# ============================================
# LOGGING (Security & Debug)
# ============================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'security.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django.security': {
            'handlers': ['file', 'console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'forum': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    },
}


# ============================================
# ADDITIONAL SECURITY SETTINGS
# ============================================

ACCOUNT_LOCKOUT_THRESHOLD = 5
ACCOUNT_LOCKOUT_DURATION = 15  # minutes

EMAIL_VERIFICATION_REQUIRED = config('EMAIL_VERIFICATION_REQUIRED', default=True, cast=bool)
EMAIL_VERIFICATION_CODE_EXPIRY = 10  # minutes

PASSWORD_RESET_TIMEOUT = 3600  # 1 hour in seconds

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'