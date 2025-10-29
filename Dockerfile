# AfriDiag - Complete Application Deployment Package
# Optimized for Rural Hospitals and Offline Use

# Multi-stage build for optimized size
FROM python:3.9-slim as backend-builder

# Set working directory
WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ .

# Frontend build stage
FROM node:16-alpine as frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
COPY frontend/server.js ./

# Install Node.js dependencies
RUN npm install --production

# Copy frontend source code
COPY frontend/ .

# Final production stage
FROM python:3.9-slim

# Install system dependencies for production
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    sqlite3 \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy backend from builder
COPY --from=backend-builder /app/backend ./backend
COPY --from=backend-builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# Copy frontend from builder
COPY --from=frontend-builder /app/frontend ./frontend

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Copy configuration files
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Create startup script
COPY docker/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose port 8080 for the application
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

# Set environment variables
ENV PYTHONPATH=/app/backend
ENV DATABASE_URL=sqlite:///app/data/afridiag.db
ENV ENVIRONMENT=production
ENV OFFLINE_MODE=true

# Start the application
CMD ["/app/start.sh"]