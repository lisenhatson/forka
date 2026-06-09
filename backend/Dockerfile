FROM python:3.13-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies for Postgres and general tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt
RUN pip install gunicorn

# Copy project code (Note: .dockerignore should exclude venv/)
COPY . .

# Ensure log directory exists for your security.log
RUN mkdir -p logs forka_backend/logs

EXPOSE 8000

CMD ["gunicorn", "forka_backend.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
