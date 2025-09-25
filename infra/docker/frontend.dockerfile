# Frontend Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY frontend/ ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S reactjs -u 1001
RUN chown -R reactjs:nodejs /app
USER reactjs

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "start"]