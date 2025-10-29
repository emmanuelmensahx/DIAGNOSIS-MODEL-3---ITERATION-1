# AfriDiag Deployment Guide

This guide provides instructions for deploying the AfriDiag application in different environments, from development to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Environment Setup](#development-environment-setup)
3. [Testing Environment Setup](#testing-environment-setup)
4. [Production Environment Setup](#production-environment-setup)
5. [Continuous Integration/Continuous Deployment](#continuous-integrationcontinuous-deployment)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Backup and Recovery](#backup-and-recovery)
8. [Scaling Strategies](#scaling-strategies)
9. [Security Considerations](#security-considerations)

## Prerequisites

### Backend Requirements

- Python 3.9+
- PostgreSQL 13+
- MongoDB 5.0+
- Redis (for caching and session management)
- FastAPI

### Frontend Requirements

- Node.js 16+
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Infrastructure Requirements

- Docker and Docker Compose
- Kubernetes (for production)
- Nginx (for reverse proxy)
- Let's Encrypt (for SSL certificates)
- AWS Account or equivalent cloud provider

## Development Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/afridiag.git
cd afridiag
```

### 2. Backend Setup

```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your local configuration

# Run database migrations
alembic upgrade head

# Start the development server
uvicorn app.main:app --reload
```

### 3. Frontend Setup

```bash
# Install dependencies
cd frontend
npm install

# Start the Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios
```

### 4. Docker Development Environment (Alternative)

```bash
# Build and start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop all services
docker-compose -f docker-compose.dev.yml down
```

## Testing Environment Setup

### 1. Setting Up the Testing Database

```bash
# Create a testing database in PostgreSQL
psql -U postgres -c "CREATE DATABASE afridiag_test;"

# Create a testing database in MongoDB
mongo
> use afridiag_test
```

### 2. Running Backend Tests

```bash
cd backend

# Set test environment variables
export TESTING=True
export DATABASE_URL=postgresql://postgres:password@localhost/afridiag_test
export MONGODB_URL=mongodb://localhost:27017/afridiag_test

# Run tests
pytest

# Run tests with coverage
pytest --cov=app
```

### 3. Running Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

### 4. End-to-End Testing

```bash
# Install Detox CLI
npm install -g detox-cli

# Build the app for E2E testing
detox build

# Run E2E tests
detox test
```

## Production Environment Setup

### 1. Infrastructure Setup with Terraform

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan -out=tfplan

# Apply the plan
terraform apply tfplan
```

### 2. Kubernetes Deployment

```bash
# Set up kubectl to use your cluster
aws eks update-kubeconfig --name afridiag-cluster --region us-west-2

# Apply Kubernetes manifests
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/secrets.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/backend/
kubectl apply -f kubernetes/mongodb/
kubectl apply -f kubernetes/postgresql/
kubectl apply -f kubernetes/redis/
kubectl apply -f kubernetes/ingress.yaml

# Verify deployment
kubectl get pods -n afridiag
```

### 3. Database Migration in Production

```bash
# Run migrations in production
kubectl exec -it $(kubectl get pods -n afridiag -l app=backend -o jsonpath='{.items[0].metadata.name}') -n afridiag -- alembic upgrade head
```

### 4. SSL Certificate Setup

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.8.0/cert-manager.yaml

# Create Let's Encrypt issuer
kubectl apply -f kubernetes/cert-manager/letsencrypt-issuer.yaml

# Apply certificate resource
kubectl apply -f kubernetes/cert-manager/certificate.yaml
```

### 5. Mobile App Deployment

#### Android

```bash
cd frontend

# Build release APK
npm run build:android:release

# Upload to Google Play Store using Fastlane
cd android && fastlane deploy
```

#### iOS

```bash
cd frontend

# Build release IPA
npm run build:ios:release

# Upload to App Store using Fastlane
cd ios && fastlane deploy
```

## Continuous Integration/Continuous Deployment

### GitHub Actions Workflow

The repository includes GitHub Actions workflows for CI/CD:

- `.github/workflows/backend-ci.yml`: Runs tests for the backend code
- `.github/workflows/frontend-ci.yml`: Runs tests for the frontend code
- `.github/workflows/deploy-staging.yml`: Deploys to the staging environment
- `.github/workflows/deploy-production.yml`: Deploys to the production environment

### Setting Up GitHub Secrets

The following secrets need to be set in the GitHub repository:

- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub password
- `KUBECONFIG`: Base64-encoded Kubernetes config
- `GOOGLE_PLAY_JSON_KEY`: Google Play JSON key for Android deployment
- `APPLE_API_KEY`: Apple API key for iOS deployment

## Monitoring and Logging

### Setting Up Prometheus and Grafana

```bash
# Deploy Prometheus and Grafana
kubectl apply -f kubernetes/monitoring/prometheus.yaml
kubectl apply -f kubernetes/monitoring/grafana.yaml

# Access Grafana dashboard
kubectl port-forward svc/grafana 3000:3000 -n monitoring
```

### Setting Up ELK Stack for Logging

```bash
# Deploy ELK stack
kubectl apply -f kubernetes/logging/elasticsearch.yaml
kubectl apply -f kubernetes/logging/logstash.yaml
kubectl apply -f kubernetes/logging/kibana.yaml
kubectl apply -f kubernetes/logging/filebeat.yaml

# Access Kibana dashboard
kubectl port-forward svc/kibana 5601:5601 -n logging
```

### Setting Up Alerts

```bash
# Deploy AlertManager
kubectl apply -f kubernetes/monitoring/alertmanager.yaml

# Configure alert rules
kubectl apply -f kubernetes/monitoring/alert-rules.yaml
```

## Backup and Recovery

### Database Backups

#### PostgreSQL

```bash
# Set up automated backups using Kubernetes CronJob
kubectl apply -f kubernetes/backup/postgres-backup-cronjob.yaml

# Manual backup
kubectl exec -it $(kubectl get pods -n afridiag -l app=postgresql -o jsonpath='{.items[0].metadata.name}') -n afridiag -- pg_dump -U postgres afridiag > backup.sql
```

#### MongoDB

```bash
# Set up automated backups using Kubernetes CronJob
kubectl apply -f kubernetes/backup/mongodb-backup-cronjob.yaml

# Manual backup
kubectl exec -it $(kubectl get pods -n afridiag -l app=mongodb -o jsonpath='{.items[0].metadata.name}') -n afridiag -- mongodump --archive=/tmp/backup.gz --gzip
kubectl cp $(kubectl get pods -n afridiag -l app=mongodb -o jsonpath='{.items[0].metadata.name}'):/tmp/backup.gz backup.gz -n afridiag
```

### Disaster Recovery

1. Maintain regular backups of all databases
2. Store infrastructure as code (Terraform, Kubernetes manifests)
3. Document manual recovery procedures
4. Regularly test recovery procedures
5. Implement multi-region redundancy for critical components

## Scaling Strategies

### Horizontal Scaling

```bash
# Scale backend deployment
kubectl scale deployment backend -n afridiag --replicas=5

# Set up Horizontal Pod Autoscaler
kubectl apply -f kubernetes/autoscaling/backend-hpa.yaml
```

### Database Scaling

#### PostgreSQL

- Implement read replicas for read-heavy workloads
- Consider using connection pooling with PgBouncer
- Implement sharding for very large datasets

#### MongoDB

- Set up a replica set for high availability
- Implement sharding for horizontal scaling
- Use MongoDB Atlas for managed scaling

## Security Considerations

### Network Security

1. Use private subnets for database instances
2. Implement network policies to restrict pod-to-pod communication
3. Use AWS Security Groups or equivalent to restrict access
4. Enable VPC flow logs for network monitoring

### Application Security

1. Regularly update dependencies to patch security vulnerabilities
2. Implement rate limiting to prevent abuse
3. Use Content Security Policy (CSP) headers
4. Implement proper input validation and sanitization

### Data Security

1. Encrypt data at rest and in transit
2. Implement proper access controls
3. Regularly audit database access
4. Implement data masking for sensitive information

### Compliance

1. Ensure GDPR compliance for handling patient data
2. Implement HIPAA compliance measures where applicable
3. Maintain audit logs for all data access
4. Implement data retention policies

## Troubleshooting

### Common Issues

#### Backend Service Not Starting

```bash
# Check logs
kubectl logs -f deployment/backend -n afridiag

# Check events
kubectl describe pod $(kubectl get pods -n afridiag -l app=backend -o jsonpath='{.items[0].metadata.name}') -n afridiag
```

#### Database Connection Issues

```bash
# Check if database pods are running
kubectl get pods -n afridiag -l app=postgresql
kubectl get pods -n afridiag -l app=mongodb

# Check database logs
kubectl logs -f $(kubectl get pods -n afridiag -l app=postgresql -o jsonpath='{.items[0].metadata.name}') -n afridiag
```

#### Mobile App Build Failures

1. Clear cache: `npm start -- --reset-cache`
2. Rebuild node modules: `rm -rf node_modules && npm install`
3. Check for native module issues: `npx react-native doctor`

## Appendix

### Environment Variables

#### Backend Environment Variables

```
DATABASE_URL=postgresql://user:password@host:port/database
MONGODB_URL=mongodb://user:password@host:port/database
REDIS_URL=redis://host:port
SECRET_KEY=your-secret-key
ALLOWED_ORIGINS=https://example.com,https://api.example.com
ENVIRONMENT=production
LOG_LEVEL=info
```

#### Frontend Environment Variables

```
API_URL=https://api.example.com
ENVIRONMENT=production
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### Useful Commands

#### Kubernetes

```bash
# Get all resources in the namespace
kubectl get all -n afridiag

# Get logs from all pods in a deployment
kubectl logs -f deployment/backend -n afridiag --all-containers=true

# Execute a command in a pod
kubectl exec -it pod-name -n afridiag -- /bin/bash

# Port forward to a service
kubectl port-forward svc/service-name port:targetPort -n afridiag
```

#### Docker

```bash
# Build and tag an image
docker build -t yourusername/afridiag-backend:latest .

# Push an image to Docker Hub
docker push yourusername/afridiag-backend:latest

# Run a container locally
docker run -p 8000:8000 -e DATABASE_URL=postgresql://user:password@host:port/database yourusername/afridiag-backend:latest
```

#### Database

```bash
# Connect to PostgreSQL
psql -U username -h hostname -d database

# Connect to MongoDB
mongo mongodb://username:password@hostname:port/database

# Restore PostgreSQL backup
psql -U username -h hostname -d database < backup.sql

# Restore MongoDB backup
mongorestore --archive=backup.gz --gzip
```