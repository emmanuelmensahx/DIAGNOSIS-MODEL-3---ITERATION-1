# AfriDiag Database Schema Documentation

AfriDiag uses a hybrid database approach with PostgreSQL for structured data and MongoDB for medical images and unstructured data.

## PostgreSQL Schema

The PostgreSQL database handles all structured data including users, patients, diagnoses, and treatments.

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('frontline_worker', 'specialist', 'admin')),
    specialization VARCHAR(255),
    license_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT chk_specialist_fields CHECK (
        (role != 'specialist') OR 
        (role = 'specialist' AND specialization IS NOT NULL AND license_number IS NOT NULL)
    )
);
```

### Patients Table

```sql
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(50),
    contact_number VARCHAR(100),
    address TEXT,
    medical_history TEXT[] DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    blood_type VARCHAR(10),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);
```

### Diagnoses Table

```sql
CREATE TABLE diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    frontline_worker_id UUID NOT NULL REFERENCES users(id),
    specialist_id UUID REFERENCES users(id),
    disease_type VARCHAR(100),
    symptoms TEXT[] NOT NULL,
    frontline_worker_notes TEXT,
    ai_diagnosis VARCHAR(255),
    ai_diagnosis_details TEXT,
    ai_treatment_plan TEXT,
    confidence DECIMAL(5,2),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    urgency VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
    specialist_feedback TEXT,
    treatment_plan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);
```

### Treatments Table

```sql
CREATE TABLE treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagnosis_id UUID NOT NULL REFERENCES diagnoses(id),
    treatment_plan TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Follow-ups Table

```sql
CREATE TABLE follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_id UUID NOT NULL REFERENCES treatments(id),
    date DATE NOT NULL,
    notes TEXT,
    outcome VARCHAR(100),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Sync Logs Table

```sql
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    sync_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    offline_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Refresh Tokens Table

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE
);
```

## MongoDB Schema

MongoDB is used for storing medical images and other unstructured data.

### Medical Images Collection

```javascript
{
  _id: ObjectId,
  diagnosis_id: UUID,  // References diagnoses.id in PostgreSQL
  patient_id: UUID,    // References patients.id in PostgreSQL
  type: String,        // e.g., "x-ray", "microscopy", "photo"
  filename: String,
  path: String,        // Storage path
  url: String,         // Public URL
  metadata: {
    width: Number,
    height: Number,
    format: String,
    size: Number,      // File size in bytes
    contentType: String
  },
  ai_analysis: {       // Optional AI analysis results
    findings: [String],
    confidence: Number,
    regions_of_interest: [
      {
        x: Number,
        y: Number,
        width: Number,
        height: Number,
        label: String,
        confidence: Number
      }
    ]
  },
  created_by: UUID,    // References users.id in PostgreSQL
  created_at: ISODate,
  updated_at: ISODate
}
```

### Offline Sync Collection

```javascript
{
  _id: ObjectId,
  user_id: UUID,       // References users.id in PostgreSQL
  device_id: String,   // Unique identifier for the device
  entity_type: String, // "patient", "diagnosis", "treatment", "follow_up", "image"
  offline_id: String,  // Local ID generated on the device
  server_id: UUID,     // ID assigned by the server after sync
  data: Object,        // The actual data to be synced
  status: String,      // "pending", "synced", "conflict", "error"
  error_message: String,
  created_at: ISODate,
  updated_at: ISODate,
  synced_at: ISODate
}
```

### Audit Logs Collection

```javascript
{
  _id: ObjectId,
  user_id: UUID,       // References users.id in PostgreSQL
  action: String,      // "create", "read", "update", "delete"
  entity_type: String, // "patient", "diagnosis", "treatment", etc.
  entity_id: UUID,     // ID of the affected entity
  previous_state: Object, // For updates and deletes
  new_state: Object,   // For creates and updates
  ip_address: String,
  user_agent: String,
  timestamp: ISODate
}
```

## Indexes

### PostgreSQL Indexes

```sql
-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Patients table indexes
CREATE INDEX idx_patients_name ON patients(name);
CREATE INDEX idx_patients_created_by ON patients(created_by);

-- Diagnoses table indexes
CREATE INDEX idx_diagnoses_patient_id ON diagnoses(patient_id);
CREATE INDEX idx_diagnoses_frontline_worker_id ON diagnoses(frontline_worker_id);
CREATE INDEX idx_diagnoses_specialist_id ON diagnoses(specialist_id);
CREATE INDEX idx_diagnoses_status ON diagnoses(status);
CREATE INDEX idx_diagnoses_urgency ON diagnoses(urgency);
CREATE INDEX idx_diagnoses_created_at ON diagnoses(created_at);

-- Treatments table indexes
CREATE INDEX idx_treatments_diagnosis_id ON treatments(diagnosis_id);
CREATE INDEX idx_treatments_status ON treatments(status);

-- Follow-ups table indexes
CREATE INDEX idx_follow_ups_treatment_id ON follow_ups(treatment_id);
CREATE INDEX idx_follow_ups_date ON follow_ups(date);
```

### MongoDB Indexes

```javascript
// Medical Images Collection indexes
db.medical_images.createIndex({ "diagnosis_id": 1 });
db.medical_images.createIndex({ "patient_id": 1 });
db.medical_images.createIndex({ "created_by": 1 });
db.medical_images.createIndex({ "created_at": 1 });

// Offline Sync Collection indexes
db.offline_sync.createIndex({ "user_id": 1 });
db.offline_sync.createIndex({ "device_id": 1 });
db.offline_sync.createIndex({ "entity_type": 1 });
db.offline_sync.createIndex({ "offline_id": 1 });
db.offline_sync.createIndex({ "status": 1 });
db.offline_sync.createIndex({ "created_at": 1 });

// Audit Logs Collection indexes
db.audit_logs.createIndex({ "user_id": 1 });
db.audit_logs.createIndex({ "entity_type": 1, "entity_id": 1 });
db.audit_logs.createIndex({ "timestamp": 1 });
```

## Database Relationships

### One-to-Many Relationships

- One user can create many patients
- One patient can have many diagnoses
- One diagnosis can have one treatment
- One treatment can have many follow-ups
- One frontline worker can submit many diagnoses
- One specialist can review many diagnoses

### Many-to-One Relationships

- Many diagnoses belong to one patient
- Many follow-ups belong to one treatment

## Data Migration and Versioning

The database schema is versioned using migration scripts. Each migration script is numbered sequentially and contains both "up" and "down" migrations to allow for rollbacks if needed.

Migration scripts are stored in the `migrations` directory and are executed in order using a migration tool (e.g., Alembic for PostgreSQL).

## Backup and Recovery

Regular backups are performed for both PostgreSQL and MongoDB databases:

- PostgreSQL: Daily full backups and hourly WAL (Write-Ahead Log) archiving
- MongoDB: Daily full backups and continuous oplog tailing

Backups are stored in a secure, off-site location and are tested regularly to ensure recoverability.

## Data Retention and Compliance

Patient data is retained according to local healthcare regulations and GDPR requirements. The system implements the following data protection measures:

- Data encryption at rest and in transit
- Pseudonymization of patient data where possible
- Access controls and audit logging
- Data retention policies with automated purging of expired data

## Performance Considerations

- Connection pooling is used for both PostgreSQL and MongoDB
- Read-heavy tables may be replicated for better performance
- Large result sets are paginated to improve response times
- Slow queries are monitored and optimized regularly