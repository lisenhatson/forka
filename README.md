# ForKa (Test Bed)
WebApp Forum Kampus untuk mahasiswa, dosen, dan staff kampus.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Development Setup

#### 1. Backend Setup (Django)
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env file with your database credentials

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

#### 2. Frontend Setup (React)
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

#### 3. Database Setup
```bash
# Create PostgreSQL database
createdb forka

# Or using Docker
docker run --name forka-db -e POSTGRES_DB=forka -e POSTGRES_USER=forka -e POSTGRES_PASSWORD=forka123 -p 5432:5432 -d postgres:15-alpine
```

### Using Docker Compose
```bash
# Start all services
cd infra/docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📁 Project Structure

```
forka/
├── backend/                 # Django REST API
│   ├── apps/               # Django applications
│   │   ├── account/        # User management
│   │   ├── forums/         # Forum discussions
│   │   ├── issues/         # Issue tracking
│   │   └── ...
│   └── forka/              # Django project settings
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── features/       # Redux slices
│   │   └── services/       # API services
├── infra/                  # Infrastructure & deployment
│   ├── docker/             # Docker configurations
│   └── apache/             # Apache configurations
└── docs/                   # Documentation
```

## 🌟 Features

- **Forum Discussions**: Create topics and engage in discussions
- **Issue Tracking**: Report and track campus issues
- **Role-based Access**: Different permissions for students, lecturers, staff
- **Real-time Updates**: Live notifications and updates
- **Responsive Design**: Works on desktop and mobile
- **API Documentation**: Auto-generated API docs with Swagger

## 🔧 Tech Stack

**Backend:**
- Django 5.0 + Django REST Framework
- PostgreSQL
- JWT Authentication
- Celery (for background tasks)

**Frontend:**
- React 18
- Redux Toolkit
- Tailwind CSS
- React Router

**Infrastructure:**
- Docker & Docker Compose
- Apache HTTP Server
- Prometheus & Grafana (monitoring)

## 📚 API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/api/docs/
- API Schema: http://localhost:8000/api/schema/

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
