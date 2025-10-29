#!/bin/bash

# AfriDiag Startup Script for Rural Hospital Deployment

echo "Starting AfriDiag Application..."

# Create necessary directories
mkdir -p /var/log/supervisor
mkdir -p /var/log/nginx
mkdir -p /app/data

# Initialize SQLite database if it doesn't exist
if [ ! -f /app/data/afridiag.db ]; then
    echo "Initializing database..."
    cd /app/backend
    python init_database.py
    echo "Database initialized successfully"
fi

# Set proper permissions
chown -R www-data:www-data /app/data
chmod 755 /app/data

# Start supervisor to manage all services
echo "Starting services..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf