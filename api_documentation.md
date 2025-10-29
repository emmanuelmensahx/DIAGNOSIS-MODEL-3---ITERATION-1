# AfriDiag API Documentation

## Overview

The AfriDiag API is a RESTful service built with FastAPI that provides endpoints for patient management, AI-powered diagnosis, and user authentication. The API supports both online and offline operations with automatic synchronization.

**Base URL:** `http://localhost:8000/api/v1`

**Authentication:** Bearer Token (JWT)

## Response Format

All responses follow a standard format:

```json
{
  "status": "success" | "error",
  "data": { ... } | null,
  "message": "Success message" | "Error message",
  "errors": [ ... ] | null
}
```

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Server Error

## Endpoints

### Authentication

#### Register User

```
POST /auth/register
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "frontline_worker" | "specialist",
  "specialization": "Pulmonology",  // Required if role is specialist
  "license_number": "MED12345"     // Required if role is specialist
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "frontline_worker"
  },
  "message": "User registered successfully"
}
```

#### Login

```
POST /auth/login
```

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "access_token": "jwt_token",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "frontline_worker"
    }
  },
  "message": "Login successful"
}
```

#### Refresh Token

```
POST /auth/refresh
```

**Request Headers:**

```
Authorization: Bearer {token}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "access_token": "new_jwt_token",
    "token_type": "bearer",
    "expires_in": 3600
  },
  "message": "Token refreshed successfully"
}
```

#### Logout

```
POST /auth/logout
```

**Request Headers:**

```
Authorization: Bearer {token}
```

**Response:**

```json
{
  "status": "success",
  "data": null,
  "message": "Logged out successfully"
}
```

### Patients

#### Get All Patients

```
GET /patients
```

**Query Parameters:**

```
page: integer (default: 1)
per_page: integer (default: 20)
search: string (optional)
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "patients": [
      {
        "id": "uuid",
        "name": "Patient Name",
        "age": 45,
        "gender": "Male",
        "contact_number": "+1234567890",
        "address": "123 Main St",
        "created_at": "2023-01-01T00:00:00Z"
      },
      // More patients...
    ],
    "total": 100,
    "page": 1,
    "per_page": 20,
    "total_pages": 5
  },
  "message": "Patients retrieved successfully"
}
```

#### Get Patient by ID

```
GET /patients/{patient_id}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "name": "Patient Name",
    "age": 45,
    "gender": "Male",
    "contact_number": "+1234567890",
    "address": "123 Main St",
    "medical_history": ["Hypertension", "Type 2 Diabetes"],
    "allergies": ["Penicillin"],
    "blood_type": "O+",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  },
  "message": "Patient retrieved successfully"
}
```

#### Create Patient

```
POST /patients
```

**Request Body:**

```json
{
  "name": "Patient Name",
  "age": 45,
  "gender": "Male",
  "contact_number": "+1234567890",
  "address": "123 Main St",
  "medical_history": ["Hypertension", "Type 2 Diabetes"],
  "allergies": ["Penicillin"],
  "blood_type": "O+"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "name": "Patient Name",
    "age": 45,
    "gender": "Male",
    "contact_number": "+1234567890",
    "address": "123 Main St",
    "medical_history": ["Hypertension", "Type 2 Diabetes"],
    "allergies": ["Penicillin"],
    "blood_type": "O+",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  },
  "message": "Patient created successfully"
}
```

#### Update Patient

```
PUT /patients/{patient_id}
```

**Request Body:**

```json
{
  "name": "Updated Patient Name",
  "age": 46,
  "gender": "Male",
  "contact_number": "+1234567890",
  "address": "123 Main St",
  "medical_history": ["Hypertension", "Type 2 Diabetes", "Asthma"],
  "allergies": ["Penicillin"],
  "blood_type": "O+"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "name": "Updated Patient Name",
    "age": 46,
    "gender": "Male",
    "contact_number": "+1234567890",
    "address": "123 Main St",
    "medical_history": ["Hypertension", "Type 2 Diabetes", "Asthma"],
    "allergies": ["Penicillin"],
    "blood_type": "O+",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-02T00:00:00Z"
  },
  "message": "Patient updated successfully"
}
```

#### Delete Patient

```
DELETE /patients/{patient_id}
```

**Response:**

```json
{
  "status": "success",
  "data": null,
  "message": "Patient deleted successfully"
}
```

### Diagnoses

#### Get All Diagnoses

```
GET /diagnoses
```

**Query Parameters:**

```
page: integer (default: 1)
per_page: integer (default: 20)
status: string (pending, confirmed, rejected, all) (default: all)
urgency: string (high, medium, low, all) (default: all)
search: string (optional)
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "diagnoses": [
      {
        "id": "uuid",
        "patient_id": "uuid",
        "patient_name": "Patient Name",
        "disease_type": "tuberculosis",
        "ai_diagnosis": "Tuberculosis",
        "confidence": 85.5,
        "status": "pending",
        "urgency": "high",
        "created_at": "2023-01-01T00:00:00Z"
      },
      // More diagnoses...
    ],
    "total": 50,
    "page": 1,
    "per_page": 20,
    "total_pages": 3
  },
  "message": "Diagnoses retrieved successfully"
}
```

#### Get Diagnosis by ID

```
GET /diagnoses/{diagnosis_id}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "patient_id": "uuid",
    "patient_name": "Patient Name",
    "patient_age": 45,
    "patient_gender": "Male",
    "frontline_worker_id": "uuid",
    "frontline_worker": "Dr. Smith",
    "specialist_id": "uuid",
    "specialist": "Dr. Johnson",
    "disease_type": "tuberculosis",
    "symptoms": ["Persistent cough", "Chest pain", "Weight loss"],
    "ai_diagnosis": "Tuberculosis",
    "ai_diagnosis_details": "Based on symptoms and image analysis, patterns consistent with tuberculosis detected.",
    "ai_treatment_plan": "Six-month regimen of isoniazid, rifampin, ethambutol, and pyrazinamide.",
    "confidence": 85.5,
    "status": "confirmed",
    "urgency": "high",
    "specialist_feedback": "AI diagnosis confirmed based on X-ray findings.",
    "treatment_plan": "Six-month regimen of isoniazid, rifampin, ethambutol, and pyrazinamide. Monitor liver function. Follow-up chest X-ray in 2 months.",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-02T00:00:00Z",
    "medical_images": [
      {
        "id": "uuid",
        "url": "https://example.com/image1.jpg",
        "type": "x-ray",
        "created_at": "2023-01-01T00:00:00Z"
      }
    ]
  },
  "message": "Diagnosis retrieved successfully"
}
```

#### Create Diagnosis

```
POST /diagnoses
```

**Request Body:**

```json
{
  "patient_id": "uuid",
  "disease_type": "tuberculosis",
  "symptoms": ["Persistent cough", "Chest pain", "Weight loss"],
  "frontline_worker_notes": "Patient has been experiencing symptoms for 3 weeks.",
  "urgency": "high"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "patient_id": "uuid",
    "disease_type": "tuberculosis",
    "symptoms": ["Persistent cough", "Chest pain", "Weight loss"],
    "ai_diagnosis": "Tuberculosis",
    "ai_diagnosis_details": "Based on symptoms and image analysis, patterns consistent with tuberculosis detected.",
    "ai_treatment_plan": "Six-month regimen of isoniazid, rifampin, ethambutol, and pyrazinamide.",
    "confidence": 85.5,
    "status": "pending",
    "urgency": "high",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z",
    "upload_url": "https://example.com/upload/uuid"
  },
  "message": "Diagnosis created successfully"
}
```

#### Upload Medical Image

```
POST /diagnoses/{diagnosis_id}/images
```

**Request Body:**

Multipart form data with:
- `image`: File
- `type`: String (x-ray, microscopy, photo, etc.)

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "diagnosis_id": "uuid",
    "url": "https://example.com/image.jpg",
    "type": "x-ray",
    "created_at": "2023-01-01T00:00:00Z"
  },
  "message": "Image uploaded successfully"
}
```

#### Review Diagnosis (Specialist Only)

```
PUT /diagnoses/{diagnosis_id}/review
```

**Request Body:**

```json
{
  "status": "confirmed" | "rejected",
  "specialist_feedback": "AI diagnosis confirmed based on X-ray findings.",
  "treatment_plan": "Six-month regimen of isoniazid, rifampin, ethambutol, and pyrazinamide. Monitor liver function. Follow-up chest X-ray in 2 months."
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "patient_id": "uuid",
    "disease_type": "tuberculosis",
    "ai_diagnosis": "Tuberculosis",
    "status": "confirmed",
    "specialist_feedback": "AI diagnosis confirmed based on X-ray findings.",
    "treatment_plan": "Six-month regimen of isoniazid, rifampin, ethambutol, and pyrazinamide. Monitor liver function. Follow-up chest X-ray in 2 months.",
    "updated_at": "2023-01-02T00:00:00Z"
  },
  "message": "Diagnosis reviewed successfully"
}
```

#### Get Patient Diagnoses

```
GET /patients/{patient_id}/diagnoses
```

**Query Parameters:**

```
page: integer (default: 1)
per_page: integer (default: 20)
status: string (pending, confirmed, rejected, all) (default: all)
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "diagnoses": [
      {
        "id": "uuid",
        "disease_type": "tuberculosis",
        "ai_diagnosis": "Tuberculosis",
        "confidence": 85.5,
        "status": "confirmed",
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-02T00:00:00Z"
      },
      // More diagnoses...
    ],
    "total": 10,
    "page": 1,
    "per_page": 20,
    "total_pages": 1
  },
  "message": "Patient diagnoses retrieved successfully"
}
```

### Treatments

#### Get Treatment by ID

```
GET /treatments/{treatment_id}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "diagnosis_id": "uuid",
    "patient_id": "uuid",
    "patient_name": "Patient Name",
    "disease": "Tuberculosis",
    "treatment_plan": "Six-month regimen of isoniazid, rifampin, ethambutol, and pyrazinamide. Monitor liver function. Follow-up chest X-ray in 2 months.",
    "start_date": "2023-01-03",
    "end_date": "2023-07-03",
    "status": "in_progress",
    "created_at": "2023-01-02T00:00:00Z",
    "updated_at": "2023-01-03T00:00:00Z",
    "follow_ups": [
      {
        "id": "uuid",
        "date": "2023-02-03",
        "notes": "Patient responding well to treatment.",
        "outcome": "Improving",
        "created_at": "2023-02-03T00:00:00Z"
      }
    ]
  },
  "message": "Treatment retrieved successfully"
}
```

#### Create Treatment

```
POST /treatments
```

**Request Body:**

```json
{
  "diagnosis_id": "uuid",
  "treatment_plan": "Six-month regimen of isoniazid, rifampin, ethambutol, and pyrazinamide. Monitor liver function. Follow-up chest X-ray in 2 months.",
  "start_date": "2023-01-03",
  "end_date": "2023-07-03"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "diagnosis_id": "uuid",
    "treatment_plan": "Six-month regimen of isoniazid, rifampin, ethambutol, and pyrazinamide. Monitor liver function. Follow-up chest X-ray in 2 months.",
    "start_date": "2023-01-03",
    "end_date": "2023-07-03",
    "status": "scheduled",
    "created_at": "2023-01-02T00:00:00Z",
    "updated_at": "2023-01-02T00:00:00Z"
  },
  "message": "Treatment created successfully"
}
```

#### Update Treatment Status

```
PUT /treatments/{treatment_id}/status
```

**Request Body:**

```json
{
  "status": "in_progress" | "completed" | "cancelled"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "status": "in_progress",
    "updated_at": "2023-01-03T00:00:00Z"
  },
  "message": "Treatment status updated successfully"
}
```

#### Add Follow-Up

```
POST /treatments/{treatment_id}/follow-ups
```

**Request Body:**

```json
{
  "date": "2023-02-03",
  "notes": "Patient responding well to treatment.",
  "outcome": "Improving"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "treatment_id": "uuid",
    "date": "2023-02-03",
    "notes": "Patient responding well to treatment.",
    "outcome": "Improving",
    "created_at": "2023-02-03T00:00:00Z",
    "updated_at": "2023-02-03T00:00:00Z"
  },
  "message": "Follow-up added successfully"
}
```

### Users

#### Get Current User

```
GET /users/me
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "frontline_worker",
    "specialization": null,
    "license_number": null,
    "created_at": "2023-01-01T00:00:00Z"
  },
  "message": "User retrieved successfully"
}
```

#### Update User Profile

```
PUT /users/me
```

**Request Body:**

```json
{
  "name": "John Smith",
  "email": "john.smith@example.com"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "name": "John Smith",
    "email": "john.smith@example.com",
    "role": "frontline_worker",
    "updated_at": "2023-01-02T00:00:00Z"
  },
  "message": "Profile updated successfully"
}
```

#### Change Password

```
PUT /users/me/password
```

**Request Body:**

```json
{
  "current_password": "currentpassword",
  "new_password": "newpassword"
}
```

**Response:**

```json
{
  "status": "success",
  "data": null,
  "message": "Password changed successfully"
}
```

### Sync

#### Sync Offline Data

```
POST /sync
```

**Request Body:**

```json
{
  "patients": [
    {
      "offline_id": "local-uuid-1",
      "data": { /* Patient data */ },
      "created_at": "2023-01-01T00:00:00Z"
    }
  ],
  "diagnoses": [
    {
      "offline_id": "local-uuid-2",
      "data": { /* Diagnosis data */ },
      "created_at": "2023-01-01T00:00:00Z"
    }
  ],
  "follow_ups": [
    {
      "offline_id": "local-uuid-3",
      "treatment_id": "uuid",
      "data": { /* Follow-up data */ },
      "created_at": "2023-01-01T00:00:00Z"
    }
  ]
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "synced": {
      "patients": [
        {
          "offline_id": "local-uuid-1",
          "server_id": "uuid"
        }
      ],
      "diagnoses": [
        {
          "offline_id": "local-uuid-2",
          "server_id": "uuid"
        }
      ],
      "follow_ups": [
        {
          "offline_id": "local-uuid-3",
          "server_id": "uuid"
        }
      ]
    },
    "conflicts": [],
    "errors": []
  },
  "message": "Data synchronized successfully"
}
```

#### Get Last Sync Timestamp

```
GET /sync/timestamp
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "last_sync": "2023-01-01T00:00:00Z"
  },
  "message": "Last sync timestamp retrieved successfully"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. The current limits are:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

When a rate limit is exceeded, the API will respond with a 429 Too Many Requests status code.

## Versioning

The API uses versioning in the URL path (e.g., `/api/v1`). When breaking changes are introduced, a new version will be created (e.g., `/api/v2`).