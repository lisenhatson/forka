# ForKa - Campus Forum Application

**ForKa** (Forum Kampus) is a comprehensive web-based forum application designed for students, lecturers, and staff at Politeknik Negeri Batam. Built with Django REST Framework and React, ForKa provides a modern, secure platform for academic discussions and knowledge sharing.


## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Security Features](#security-features)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### User Features
- **User Authentication & Authorization**
  - Secure JWT-based authentication
  - Email verification with OTP
  - Password strength validation
  - Account lockout after failed attempts
  
- **Post Management**
  - Create, read, update, and delete posts
  - Rich text content support
  - Category-based organization
  - Post search and filtering
  - View count tracking
  
- **Commenting System**
  - Comment on posts
  - Reply to comments (nested replies)
  - Like posts and comments
  
- **User Profiles**
  - Profile picture upload
  - Bio and personal information
  - View user's posts and activity
  - Edit profile functionality

### Admin & Moderator Features
- **Admin Dashboard**
  - User management (add, edit, delete, role assignment)
  - Post moderation
  - System statistics and analytics
  
- **Moderator Dashboard**
  - Pin important posts
  - Close resolved discussions
  - Delete inappropriate content
  - Monitor recent activity

### Security Features
- ✅ JWT Token Authentication
- ✅ Email Verification (OTP)
- ✅ Rate Limiting (5 login attempts/minute)
- ✅ Account Lockout (15 minutes after 5 failed attempts)
- ✅ XSS Protection (input sanitization with bleach)
- ✅ CSRF Protection
- ✅ SQL Injection Prevention (Django ORM)
- ✅ Secure Password Requirements
- ✅ HTTPS Ready

## 🛠 Tech Stack

### Backend
- **Framework:** Django 5.2.7
- **API:** Django REST Framework 3.16.1
- **Authentication:** JWT (djangorestframework-simplejwt)
- **Database:** PostgreSQL 2.9.10
- **Security:** django-ratelimit, bleach
- **Image Processing:** Pillow 11.3.0

### Frontend
- **Framework:** React 19.1.1
- **Routing:** React Router DOM 7.9.4
- **State Management:** Zustand 5.0.8
- **HTTP Client:** Axios 1.12.2
- **UI Styling:** Tailwind CSS 3.4.18
- **Icons:** Lucide React 0.545.0
- **Forms:** React Hook Form 7.64.0
- **Notifications:** React Hot Toast 2.6.0
- **Data Fetching:** TanStack React Query 5.90.2

## 📦 System Requirements

- **Python:** 3.9 or higher
- **Node.js:** 18.x or higher
- **PostgreSQL:** 12.x or higher
- **npm:** 9.x or higher

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/forka.git
cd forka
```

### 2. Backend Setup

#### Create Virtual Environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

#### Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# .env Example
# Django Settings
SECRET_KEY=your-super-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DB_ENGINE=django.db.backends.postgresql
DB_NAME=forka_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
DEFAULT_FROM_EMAIL=noreply@forka.com

# Security
EMAIL_VERIFICATION_REQUIRED=True
```

#### Setup Database

```bash
# Create PostgreSQL database
createdb forka_db

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

#### Run Backend Server

```bash
python manage.py runserver
```

Backend will run at: `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

#### Configure Frontend Environment

The API base URL is configured in `src/config/api.js`:

```javascript
export const API_BASE_URL = 'http://localhost:8000/api';
```

#### Run Frontend Development Server

```bash
npm run dev
```

Frontend will run at: `http://localhost:5173`

## ⚙️ Configuration

### Backend Configuration

Key settings in `backend/forka_backend/settings.py`:

```python
# JWT Token Expiry
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

# Rate Limiting
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'login': '5/minute',
        'register': '3/hour',
    }
}
```

### Frontend Configuration

Tailwind colors in `frontend/tailwind.config.js`:

```javascript
colors: {
  primary: {
    500: '#0ea5e9',
    600: '#0284c7',
    // ...
  }
}
```

## 📱 Usage

### For Users

1. **Register Account**
   - Visit `http://localhost:5173/register`
   - Fill in username, email, and password
   - Verify email with OTP code sent to your email

2. **Login**
   - Visit `http://localhost:5173/login`
   - Enter credentials
   - Get redirected to home page

3. **Create Post**
   - Click "Ask a question" button
   - Choose category (optional)
   - Write title and content
   - Publish post

4. **Interact**
   - View posts
   - Comment and reply
   - Like posts and comments
   - View user profiles

### For Admins

1. **Access Admin Panel**
   - Login with admin account
   - Navigate to `/admin` route
   - Manage users, posts, and categories

2. **User Management**
   - Create, edit, or delete users
   - Assign roles (user, moderator, admin)
   - View user statistics

### For Moderators

1. **Access Moderator Panel**
   - Login with moderator account
   - Navigate to `/moderator` route
   - Manage content

2. **Content Moderation**
   - Pin important posts
   - Close resolved discussions
   - Delete inappropriate content

## 📚 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register/          - Register new user
POST   /api/auth/verify-email/      - Verify email with OTP
POST   /api/auth/resend-code/       - Resend verification code
POST   /api/auth/login/             - Login user
POST   /api/token/refresh/          - Refresh JWT token
```

### User Endpoints

```
GET    /api/users/                  - List users
GET    /api/users/me/               - Get current user
GET    /api/users/{id}/             - Get user detail
PUT    /api/users/update_profile/   - Update profile
POST   /api/users/change_password/  - Change password
```

### Post Endpoints

```
GET    /api/posts/                  - List posts
POST   /api/posts/                  - Create post
GET    /api/posts/{id}/             - Get post detail
PUT    /api/posts/{id}/             - Update post
DELETE /api/posts/{id}/             - Delete post
POST   /api/posts/{id}/like/        - Like/unlike post
POST   /api/posts/{id}/pin/         - Pin post (mod/admin)
POST   /api/posts/{id}/close/       - Close post (mod/admin)
```

### Comment Endpoints

```
GET    /api/comments/               - List comments
POST   /api/comments/               - Create comment
GET    /api/comments/{id}/          - Get comment detail
PUT    /api/comments/{id}/          - Update comment
DELETE /api/comments/{id}/          - Delete comment
POST   /api/comments/{id}/like/     - Like/unlike comment
GET    /api/comments/{id}/replies/  - Get comment replies
```

### Category Endpoints

```
GET    /api/categories/             - List categories
POST   /api/categories/             - Create category (admin)
GET    /api/categories/{slug}/      - Get category detail
PUT    /api/categories/{slug}/      - Update category (admin)
DELETE /api/categories/{slug}/      - Delete category (admin)
```

## 🔒 Security Features

### Authentication Security
- **JWT Tokens**: Secure token-based authentication
- **Email Verification**: Required for account activation
- **Rate Limiting**: Prevents brute force attacks
- **Account Lockout**: 15-minute lockout after 5 failed attempts

### Input Validation
- **XSS Protection**: Input sanitization using bleach
- **SQL Injection**: Prevented by Django ORM
- **CSRF Protection**: Django built-in CSRF middleware
- **Password Validation**: Strong password requirements

### HTTPS Configuration
For production deployment, enable HTTPS in `settings.py`:

```python
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
```

## 📊 Project Structure

```
forka/
├── backend/
│   ├── forka_backend/
│   │   ├── settings.py          # Django settings
│   │   ├── urls.py              # Main URL configuration
│   │   └── wsgi.py              # WSGI configuration
│   ├── forum/
│   │   ├── models.py            # Database models
│   │   ├── serializers.py       # DRF serializers
│   │   ├── views.py             # API views
│   │   ├── views_auth.py        # Authentication views
│   │   ├── permissions.py       # Custom permissions
│   │   ├── urls.py              # API endpoints
│   │   └── email_utils.py       # Email utilities
│   ├── media/                   # User uploads
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   │   └── polibatam-logo.png
│   ├── src/
│   │   ├── config/
│   │   │   └── api.js           # Axios configuration
│   │   ├── stores/
│   │   │   └── authStore.js     # Zustand auth store
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── PostDetailPage.jsx
│   │   │   ├── CreatePostPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── AdminUsers.jsx
│   │   │   │   └── AdminPosts.jsx
│   │   │   └── moderator/
│   │   │       ├── ModeratorDashboard.jsx
│   │   │       └── ModeratorPosts.jsx
│   │   ├── components/
│   │   │   └── EditProfileModal.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── .gitignore
├── LICENSE                       # GPL-3.0
└── README.md
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
python manage.py test
```

### Frontend Tests

```bash
cd frontend
npm run test
```

## 🚢 Deployment

### Backend Deployment (Production)

1. **Set Environment Variables**
   ```bash
   export DEBUG=False
   export ALLOWED_HOSTS=yourdomain.com
   ```

2. **Collect Static Files**
   ```bash
   python manage.py collectstatic
   ```

3. **Run with Gunicorn**
   ```bash
   gunicorn forka_backend.wsgi:application
   ```

### Frontend Deployment

1. **Build Production Bundle**
   ```bash
   npm run build
   ```

2. **Deploy `dist/` folder** to your hosting service

### Recommended Hosting
- **Backend:** Heroku, DigitalOcean, AWS EC2
- **Frontend:** Vercel, Netlify, AWS S3 + CloudFront
- **Database:** AWS RDS, DigitalOcean Managed Database

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards
- Follow PEP 8 for Python code
- Use ESLint for JavaScript/React code
- Write meaningful commit messages
- Add tests for new features

## 📝 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **ASK1E** - *Initial work* - [YourGitHub](https://github.com/ASK1E)
- **LisenHatson** - *Initial work* - [YourGitHub](https://github.com/lisenhatson)

## 🙏 Acknowledgments

- Politeknik Negeri Batam
- Django REST Framework team
- React community
- All contributors

## 📧 Contact

For questions or support, please contact:
- Email: forkapolibatam@gmail.com
- GitHub Issues: https://github.com/lisenhatson/forka/issues

## 🗺️ Roadmap

### Version 1.1 (Planned)
- [ ] Real-time notifications with WebSocket
- [ ] Markdown support for posts
- [ ] Image upload for posts
- [ ] Dark mode
- [ ] Mobile app (React Native)

### Version 1.2 (Future)
- [ ] Advanced search with filters
- [ ] User reputation system
- [ ] Badge achievements
- [ ] Email digest notifications
- [ ] Export data functionality

---

**Made with ❤️ by the ForKa Team**

⭐ Star this repo if you find it helpful!
