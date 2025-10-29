# AfriDiag System Architecture

## Overview

AfriDiag is designed as a distributed system with a mobile frontend, a backend API server, and integrated machine learning models. The architecture prioritizes offline capabilities, security, and scalability to meet the needs of healthcare workers in areas with limited connectivity.

## System Components

### 1. Frontend Application (React Native)

The mobile application serves two primary user roles:

- **Frontline Healthcare Workers**: Primary users who collect patient data, submit diagnoses, and implement treatments
- **Medical Specialists**: Review AI diagnoses, provide feedback, and approve treatment plans

#### Key Frontend Components:

- **Authentication Layer**: Manages user sessions, tokens, and role-based access
- **Offline Data Manager**: Handles data persistence and synchronization
- **UI Component Library**: Consistent design system using React Native Paper
- **Navigation System**: Role-based navigation flows
- **Service Layer**: API communication and data transformation

### 2. Backend Server (FastAPI)

The backend provides RESTful API endpoints for the frontend and manages data persistence, authentication, and ML model integration.

#### Key Backend Components:

- **API Layer**: RESTful endpoints for all application features
- **Authentication System**: JWT-based authentication with role-based permissions
- **Database Interfaces**: PostgreSQL for structured data, MongoDB for medical images
- **ML Model Interface**: Standardized interface for disease diagnosis models
- **Sync Manager**: Handles data synchronization for offline clients

### 3. Machine Learning Subsystem

The ML subsystem contains models for diagnosing the four priority diseases, with a modular architecture to allow for future expansion.

#### Key ML Components:

- **Disease-Specific Models**: Specialized models for each target disease
- **Model Interface**: Standardized API for model interaction
- **Image Preprocessing**: Utilities for medical image normalization
- **Confidence Scoring**: Algorithms to determine diagnosis confidence

## Data Flow

### Diagnosis Workflow

1. **Data Collection**:
   - Frontline worker collects patient information, symptoms, and medical images
   - Data is stored locally if offline

2. **AI Diagnosis**:
   - When online, data is sent to the backend
   - Backend routes the request to appropriate ML models
   - Models generate diagnosis with confidence score
   - Results are returned to frontend and stored in database

3. **Specialist Review**:
   - Specialists receive notifications of pending diagnoses
   - Review AI diagnosis, patient data, and images
   - Confirm, modify, or reject diagnosis
   - Add treatment plan if confirmed

4. **Treatment Implementation**:
   - Frontline worker receives notification of completed review
   - Implements approved treatment plan
   - Records follow-up information

### Offline Synchronization

1. **Offline Data Storage**:
   - Patient data stored in AsyncStorage
   - Pending diagnoses queued locally
   - Local database maintains state

2. **Connectivity Detection**:
   - Application monitors network status
   - Notifies user of connectivity changes

3. **Data Synchronization**:
   - When connectivity restored, queued operations executed
   - Conflict resolution for modified records
   - Prioritized sync for urgent diagnoses

## Database Schema

### PostgreSQL (Structured Data)

#### Users Table
```
id: UUID (PK)
name: VARCHAR
email: VARCHAR (unique)
password_hash: VARCHAR
role: ENUM (frontline_worker, specialist)
specialization: VARCHAR (nullable)
license_number: VARCHAR (nullable)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### Patients Table
```
id: UUID (PK)
name: VARCHAR
age: INTEGER
gender: VARCHAR
contact_number: VARCHAR
address: TEXT
medical_history: TEXT[]
allergies: TEXT[]
blood_type: VARCHAR
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### Diagnoses Table
```
id: UUID (PK)
patient_id: UUID (FK)
frontline_worker_id: UUID (FK)
specialist_id: UUID (FK, nullable)
disease_type: ENUM (tuberculosis, pneumonia, malaria, lung_cancer, other)
symptoms: TEXT[]
ai_diagnosis: VARCHAR
ai_diagnosis_details: TEXT
ai_treatment_plan: TEXT
confidence: FLOAT
status: ENUM (pending, confirmed, rejected)
urgency: ENUM (low, medium, high)
specialist_feedback: TEXT (nullable)
treatment_plan: TEXT (nullable)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### Treatments Table
```
id: UUID (PK)
diagnosis_id: UUID (FK)
treatment_plan: TEXT
start_date: DATE
end_date: DATE (nullable)
status: ENUM (scheduled, in_progress, completed, cancelled)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### FollowUps Table
```
id: UUID (PK)
treatment_id: UUID (FK)
date: DATE
notes: TEXT
outcome: TEXT
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### MongoDB (Medical Images)

#### Images Collection
```
_id: ObjectId
diagnosis_id: UUID (reference to PostgreSQL)
image_type: String (x-ray, microscopy, photo, etc.)
filename: String
contentType: String
size: Number
uploadDate: Date
metadata: Object
data: Binary
```

## Authentication and Security

### Authentication Flow

1. **User Registration**:
   - User provides credentials and role information
   - Backend validates and stores user with hashed password
   - Admin approval required for specialist accounts

2. **Login Process**:
   - User submits credentials
   - Backend validates and issues JWT token
   - Token contains user ID and role information
   - Token stored in AsyncStorage on device

3. **Request Authentication**:
   - JWT token included in Authorization header
   - Backend validates token signature and expiration
   - Role-based access control applied to endpoints

### Security Measures

- **Password Security**: Argon2 hashing for passwords
- **Token Management**: Short-lived access tokens with refresh capability
- **API Security**: Rate limiting, input validation, and sanitization
- **Data Encryption**: TLS for data in transit, encryption for sensitive data at rest
- **Audit Logging**: Comprehensive logging of security events

## Offline Capabilities

### Local Storage Strategy

- **Patient Data**: Complete patient records stored locally
- **Pending Diagnoses**: Queued for submission when online
- **Images**: Compressed and stored locally until sync
- **User Data**: Cached for offline authentication

### Synchronization Strategy

- **Incremental Sync**: Only changed data synchronized
- **Conflict Resolution**: Server-side resolution with client notification
- **Background Sync**: Automatic synchronization when connectivity available
- **Priority Queue**: Critical data synchronized first

## Scalability Considerations

### Horizontal Scaling

- **Stateless API**: Backend designed for horizontal scaling
- **Database Sharding**: Prepared for geographic distribution
- **Load Balancing**: API traffic distributed across instances

### Performance Optimization

- **Caching**: Redis cache for frequently accessed data
- **Image Optimization**: Progressive loading and compression
- **Query Optimization**: Indexed database queries
- **Batch Processing**: Grouped operations for efficiency

## Deployment Architecture

### Production Environment

- **API Servers**: Containerized FastAPI instances behind load balancer
- **Databases**: Managed PostgreSQL and MongoDB services
- **ML Services**: Dedicated servers for model inference
- **Storage**: Object storage for medical images
- **CDN**: Content delivery network for static assets

### Development Environment

- **Local Development**: Docker Compose for service orchestration
- **CI/CD Pipeline**: Automated testing and deployment
- **Staging Environment**: Mirrors production for testing

## Monitoring and Logging

- **Application Metrics**: Performance and usage statistics
- **Error Tracking**: Centralized error logging and alerting
- **User Analytics**: Anonymized usage patterns
- **Audit Logs**: Security and compliance tracking

## Future Expansion

### Planned Enhancements

- **Additional Disease Models**: Expanding beyond initial four diseases
- **Telemedicine Integration**: Direct specialist consultations
- **Advanced Analytics**: Population health insights
- **Interoperability**: Integration with existing health information systems
- **Multi-language Support**: Localization for different regions