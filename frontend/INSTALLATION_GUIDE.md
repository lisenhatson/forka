# ForKa Frontend - Installation Guide

## 📁 Project Structure

Berikut struktur folder yang perlu dibuat:

```
frontend/
├── public/
│   └── polibatam-logo.png          # Logo Polibatam (yang udah dikasih)
├── src/
│   ├── config/
│   │   └── api.js                   # ✅ Axios configuration & interceptors
│   ├── stores/
│   │   └── authStore.js             # ✅ Zustand auth store
│   ├── pages/
│   │   ├── LandingPage.jsx          # ✅ Landing page
│   │   ├── LoginPage.jsx            # ✅ Login page
│   │   ├── RegisterPage.jsx         # ✅ Register page
│   │   ├── HomePage.jsx             # ✅ Home (list posts)
│   │   ├── PostDetailPage.jsx       # ✅ Post detail with comments
│   │   ├── CreatePostPage.jsx       # ✅ Create new post
│   │   └── ProfilePage.jsx          # ✅ User profile
│   ├── App.jsx                      # ✅ Main app with routing
│   ├── index.css                    # ✅ Tailwind CSS
│   └── main.jsx                     # Entry point
├── tailwind.config.js               # ✅ Tailwind configuration
└── package.json                     # Dependencies
```

## 🚀 Installation Steps

### 1. Copy File Logo

Copy file `polibatam-logo.png` yang sudah dikasih ke folder:
```
frontend/public/polibatam-logo.png
```

### 2. Replace Files

Replace file-file berikut dengan yang sudah saya buat:

**Configuration Files:**
- `frontend/tailwind.config.js` → Update dengan config baru
- `frontend/src/index.css` → Update dengan Tailwind CSS

**Core Files:**
- `frontend/src/App.jsx` → Replace dengan routing
- `frontend/src/config/api.js` → **Create new file**
- `frontend/src/stores/authStore.js` → **Create new file**

**Pages (Create folder `src/pages/` dulu):**
- `frontend/src/pages/LandingPage.jsx`
- `frontend/src/pages/LoginPage.jsx`
- `frontend/src/pages/RegisterPage.jsx`
- `frontend/src/pages/HomePage.jsx`
- `frontend/src/pages/PostDetailPage.jsx`
- `frontend/src/pages/CreatePostPage.jsx`
- `frontend/src/pages/ProfilePage.jsx`

### 3. Install Dependencies

```bash
cd frontend
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

## 🎯 API Configuration

Backend API sudah dikonfigurasi di `src/config/api.js`:
```javascript
export const API_BASE_URL = 'http://localhost:8000/api';
```

Pastikan backend Django sudah running di port 8000.

## 🔑 Authentication Flow

1. **Landing Page** (`/`) - Public page
2. **Register** (`/register`) - Create account → auto login
3. **Login** (`/login`) - Login dengan JWT token
4. **Home** (`/home`) - Protected, list all posts
5. **Post Detail** (`/posts/:id`) - View post & comments
6. **Create Post** (`/ask`) - Create new question
7. **Profile** (`/profile/:username`) - View user profile

## 📝 Features Implemented

### ✅ Authentication
- Login with JWT token
- Register with auto-login
- Token refresh on 401
- Logout functionality
- Protected routes

### ✅ Posts
- List all posts (with filter: New, Top, Hot)
- View post detail
- Create new post
- Like post
- View count increment
- Search posts
- Filter by category

### ✅ Comments
- Add comment to post
- Reply to comment
- Like comment
- View replies

### ✅ Profile
- View user profile
- View user's posts
- Edit profile (for own profile)
- Stats (posts count, comments count)

### ✅ UI/UX
- Responsive design
- Loading states
- Error handling
- Form validation
- Toast notifications
- Smooth transitions

## 🎨 Color Scheme

```javascript
Primary Blue: #0EA5E9 (sky-500)
Dark Blue: #075985 (sky-800)
Gray shades: Tailwind default
```

## 📱 Pages Preview

### Landing Page
- Hero section
- Features showcase
- Stats display
- CTA buttons

### Login/Register
- Split screen design
- Form validation
- Error messages
- Password visibility toggle

### Home Page
- Sidebar navigation
- Post list with filters
- Search functionality
- Right sidebar with featured links

### Post Detail
- Full post content
- Comment section
- Reply functionality
- Author profile sidebar

### Create Post
- Rich text editor
- Category selection
- Draft save functionality
- Upload image support

### Profile
- User info display
- Posts/Comments/Likes tabs
- Social links
- Edit profile button

## 🔧 Troubleshooting

### CORS Error
Pastikan Django backend sudah enable CORS:
```python
# backend/forka_backend/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite default port
]
```

### 401 Unauthorized
Token expired, akan auto refresh atau redirect ke login.

### Can't fetch data
- Check backend running: `python manage.py runserver`
- Check API URL correct: `http://localhost:8000/api`

## 📚 Technologies Used

- **React 19** - UI Framework
- **React Router DOM** - Routing
- **Zustand** - State Management
- **Axios** - HTTP Client
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Hook Form** - Form Handling

## 🎉 Next Steps

Setelah semua jalan, kamu bisa:

1. **Add more features:**
   - Notification system
   - Real-time updates (WebSocket)
   - Image upload to posts
   - Rich text editor
   - Markdown support

2. **Improve UI:**
   - Dark mode
   - Skeleton loading
   - Animation improvements
   - Mobile optimization

3. **Add tests:**
   - Unit tests
   - Integration tests
   - E2E tests

## 📞 Support

Kalau ada error atau pertanyaan, bisa tanya lagi!

Happy Coding! 🚀