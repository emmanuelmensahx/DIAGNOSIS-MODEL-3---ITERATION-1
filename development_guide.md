# AfriDiag Development Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Development Environment Setup](#development-environment-setup)
4. [Coding Standards](#coding-standards)
5. [Git Workflow](#git-workflow)
6. [Testing](#testing)
7. [Documentation](#documentation)
8. [API Integration](#api-integration)
9. [Mobile Development](#mobile-development)
10. [Machine Learning Model Development](#machine-learning-model-development)
11. [Offline Functionality](#offline-functionality)
12. [Security Guidelines](#security-guidelines)
13. [Performance Optimization](#performance-optimization)
14. [Troubleshooting](#troubleshooting)

## Introduction

This guide is intended for developers who want to contribute to the AfriDiag project. AfriDiag is a mobile application designed to assist healthcare workers in diagnosing and treating diseases in resource-limited settings using artificial intelligence.

## Project Structure

The AfriDiag project is organized into several main components:

```
afridiag/
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── core/          # Core functionality
│   │   ├── db/            # Database models and connections
│   │   ├── ml/            # ML model integration
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   └── main.py        # Application entry point
│   ├── migrations/        # Alembic migrations
│   ├── tests/             # Backend tests
│   └── requirements.txt   # Python dependencies
├── frontend/              # React Native frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React context providers
│   │   ├── navigation/    # Navigation configuration
│   │   ├── screens/       # Screen components
│   │   ├── services/      # API services
│   │   ├── utils/         # Utility functions
│   │   └── App.js         # Application entry point
│   ├── android/           # Android-specific code
│   ├── ios/               # iOS-specific code
│   └── package.json       # Node.js dependencies
├── ml_models/             # Machine learning models
│   ├── tuberculosis/      # Tuberculosis diagnosis model
│   ├── malaria/           # Malaria diagnosis model
│   ├── pneumonia/         # Pneumonia diagnosis model
│   ├── diabetes/          # Diabetes diagnosis model
│   └── utils/             # Shared ML utilities
├── docs/                  # Documentation
├── infrastructure/        # Deployment configuration
│   ├── docker/            # Docker configuration
│   ├── kubernetes/        # Kubernetes manifests
│   └── terraform/         # Terraform scripts
└── README.md              # Project overview
```

## Development Environment Setup

### Prerequisites

- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- MongoDB 5.0+
- Docker and Docker Compose (optional but recommended)

### Backend Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/afridiag.git
cd afridiag
```

2. Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

4. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your local configuration
```

5. Run database migrations:

```bash
alembic upgrade head
```

6. Start the development server:

```bash
uvicorn app.main:app --reload
```

### Frontend Setup

1. Install frontend dependencies:

```bash
cd frontend
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your local configuration
```

3. Start the Metro bundler:

```bash
npm start
```

4. Run on Android or iOS:

```bash
# For Android
npm run android

# For iOS (macOS only)
npm run ios
```

### Docker Setup (Alternative)

1. Build and start all services:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

2. View logs:

```bash
docker-compose -f docker-compose.dev.yml logs -f
```

3. Stop all services:

```bash
docker-compose -f docker-compose.dev.yml down
```

## Coding Standards

### Python (Backend)

- Follow PEP 8 style guide
- Use type hints for function parameters and return values
- Document functions and classes using docstrings
- Use meaningful variable and function names
- Keep functions small and focused on a single responsibility
- Use async/await for I/O-bound operations

Example:

```python
async def get_patient_by_id(patient_id: UUID) -> Optional[Patient]:
    """Retrieve a patient by their ID.

    Args:
        patient_id: The UUID of the patient to retrieve

    Returns:
        The patient object if found, None otherwise
    """
    return await Patient.get_or_none(id=patient_id)
```

### JavaScript/TypeScript (Frontend)

- Use ESLint and Prettier for code formatting
- Use TypeScript for type safety
- Follow React Native best practices
- Use functional components with hooks
- Keep components small and focused
- Use descriptive variable and function names
- Document complex functions and components

Example:

```typescript
/**
 * Component for displaying patient information
 * @param {Object} props - Component props
 * @param {Patient} props.patient - Patient data to display
 * @param {boolean} props.isLoading - Whether data is loading
 * @param {Function} props.onEdit - Callback for edit button
 */
const PatientInfo: React.FC<PatientInfoProps> = ({ patient, isLoading, onEdit }) => {
  if (isLoading) {
    return <LoadingIndicator />;
  }
  
  return (
    <Card>
      <Text>Name: {patient.name}</Text>
      <Text>Age: {patient.age}</Text>
      <Button onPress={onEdit}>Edit</Button>
    </Card>
  );
};
```

## Git Workflow

### Branching Strategy

We use a modified Git Flow workflow:

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Urgent fixes for production
- `release/*`: Release preparation

### Commit Messages

Follow the Conventional Commits specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to the build process or auxiliary tools

Example:

```
feat(diagnosis): add image upload functionality

Implement the ability to upload medical images for diagnosis.
Images are stored in MongoDB and linked to the diagnosis record.

Closes #123
```

### Pull Requests

1. Create a feature branch from `develop`
2. Make your changes
3. Write or update tests
4. Submit a pull request to `develop`
5. Ensure CI passes
6. Request code review
7. Address review comments
8. Merge when approved

## Testing

### Backend Testing

We use pytest for backend testing:

```bash
# Run all tests
pytest

# Run tests with coverage
pytest --cov=app

# Run specific test file
pytest tests/api/test_patients.py
```

Test structure:

```python
@pytest.mark.asyncio
async def test_create_patient():
    # Arrange
    patient_data = {
        "name": "Test Patient",
        "age": 45,
        "gender": "Male"
    }
    
    # Act
    response = await client.post("/api/v1/patients", json=patient_data)
    data = response.json()
    
    # Assert
    assert response.status_code == 201
    assert data["data"]["name"] == patient_data["name"]
    assert data["data"]["age"] == patient_data["age"]
```

### Frontend Testing

We use Jest and React Testing Library for frontend testing:

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- src/components/PatientCard.test.js
```

Test structure:

```javascript
describe('PatientCard', () => {
  it('renders patient information correctly', () => {
    // Arrange
    const patient = {
      id: '123',
      name: 'John Doe',
      age: 45,
      gender: 'Male'
    };
    
    // Act
    const { getByText } = render(<PatientCard patient={patient} />);
    
    // Assert
    expect(getByText('John Doe')).toBeInTheDocument();
    expect(getByText('45')).toBeInTheDocument();
    expect(getByText('Male')).toBeInTheDocument();
  });
});
```

### End-to-End Testing

We use Detox for end-to-end testing of the mobile app:

```bash
# Build the app for E2E testing
detox build

# Run E2E tests
detox test
```

## Documentation

### Code Documentation

- Use docstrings for Python code
- Use JSDoc for JavaScript/TypeScript code
- Document complex algorithms and business logic
- Keep documentation up-to-date with code changes

### API Documentation

The API is documented using OpenAPI (Swagger):

- When running the backend, access the API documentation at `http://localhost:8000/docs`
- Update the API documentation when adding or modifying endpoints

### User Documentation

- User guides are stored in the `docs` directory
- Update user documentation when adding or changing features

## API Integration

### Backend API Structure

The backend API follows RESTful principles and is organized by resource:

- `/api/v1/auth`: Authentication endpoints
- `/api/v1/patients`: Patient management
- `/api/v1/diagnoses`: Diagnosis creation and management
- `/api/v1/treatments`: Treatment plans
- `/api/v1/users`: User management
- `/api/v1/sync`: Data synchronization

### Frontend API Integration

The frontend uses Axios for API calls. API services are organized in the `src/services` directory:

```typescript
// src/services/patientService.ts
import api from './api';
import { Patient } from '../types';

export const getPatients = async () => {
  const response = await api.get('/patients');
  return response.data.data;
};

export const getPatientById = async (id: string) => {
  const response = await api.get(`/patients/${id}`);
  return response.data.data;
};

export const createPatient = async (patientData: Omit<Patient, 'id'>) => {
  const response = await api.post('/patients', patientData);
  return response.data.data;
};
```

## Mobile Development

### React Native Best Practices

1. **Component Structure**:
   - Keep components small and focused
   - Use functional components with hooks
   - Separate UI components from container components

2. **State Management**:
   - Use React Context for global state
   - Use useState for component-level state
   - Consider Redux for complex state management

3. **Navigation**:
   - Use React Navigation for app navigation
   - Organize navigation by user role
   - Implement deep linking where appropriate

4. **Styling**:
   - Use React Native Paper for UI components
   - Maintain a consistent theme
   - Use responsive design for different screen sizes

5. **Performance**:
   - Memoize expensive calculations with useMemo
   - Optimize renders with React.memo
   - Use FlatList for long lists
   - Implement virtualization for large datasets

### Offline Support

1. **Data Persistence**:
   - Use AsyncStorage for simple data
   - Use SQLite for complex data structures
   - Implement data synchronization

2. **Network Detection**:
   - Use NetInfo to detect network status
   - Implement graceful degradation when offline
   - Queue operations for when connectivity is restored

## Machine Learning Model Development

### Model Structure

Each disease model follows a similar structure:

```
ml_models/
├── disease_name/
│   ├── model.py           # Model implementation
│   ├── preprocessing.py   # Data preprocessing
│   ├── training.py        # Training script
│   ├── evaluation.py      # Evaluation script
│   └── weights/           # Trained model weights
```

### Adding a New Model

1. Create a new directory in `ml_models`
2. Implement the model following the standard interface
3. Train and evaluate the model
4. Integrate with the backend API

Example model interface:

```python
class DiseaseModel:
    def __init__(self):
        self.model = self._load_model()
    
    def _load_model(self):
        # Load the trained model
        pass
    
    def preprocess(self, symptoms, images=None):
        # Preprocess input data
        pass
    
    def predict(self, preprocessed_data):
        # Make a prediction
        pass
    
    def get_treatment_recommendation(self, diagnosis, confidence):
        # Generate treatment recommendations
        pass
```

## Offline Functionality

### Data Synchronization

The offline functionality relies on a robust synchronization mechanism:

1. **Local Storage**:
   - Store data locally using AsyncStorage or SQLite
   - Maintain a queue of pending operations

2. **Conflict Resolution**:
   - Implement timestamp-based conflict resolution
   - Provide UI for manual conflict resolution when needed

3. **Sync Process**:
   - Sync when connectivity is restored
   - Implement retry mechanism for failed operations
   - Provide feedback on sync status

Example sync implementation:

```typescript
export const syncOfflineData = async () => {
  try {
    // Get offline data
    const offlineData = await getOfflineData();
    
    // Send to server
    const response = await api.post('/sync', offlineData);
    
    // Process response
    const { synced, conflicts } = response.data.data;
    
    // Update local storage with server IDs
    await updateLocalIds(synced);
    
    // Handle conflicts if any
    if (conflicts.length > 0) {
      await handleConflicts(conflicts);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Sync failed:', error);
    return { success: false, error };
  }
};
```

## Security Guidelines

### Authentication and Authorization

1. **JWT Authentication**:
   - Use JWT for API authentication
   - Implement token refresh
   - Store tokens securely

2. **Role-Based Access Control**:
   - Implement role-based permissions
   - Validate permissions on both client and server

3. **Secure Storage**:
   - Use secure storage for sensitive information
   - Never store plaintext passwords

### Data Protection

1. **Encryption**:
   - Encrypt sensitive data at rest
   - Use HTTPS for all API communication

2. **Input Validation**:
   - Validate all user input
   - Sanitize data to prevent injection attacks

3. **Error Handling**:
   - Use generic error messages for users
   - Log detailed errors for debugging
   - Don't expose sensitive information in errors

## Performance Optimization

### Backend Optimization

1. **Database Optimization**:
   - Use appropriate indexes
   - Optimize queries
   - Implement caching for frequent queries

2. **API Optimization**:
   - Implement pagination for large datasets
   - Use async/await for I/O-bound operations
   - Optimize serialization/deserialization

### Frontend Optimization

1. **Rendering Optimization**:
   - Use React.memo for pure components
   - Implement virtualization for long lists
   - Optimize images and assets

2. **Network Optimization**:
   - Minimize API calls
   - Implement request batching
   - Use caching for frequently accessed data

## Troubleshooting

### Common Development Issues

#### Backend Issues

1. **Database Connection Problems**:
   - Check database credentials
   - Verify database server is running
   - Check network connectivity

2. **Migration Errors**:
   - Run `alembic history` to see migration history
   - Check for conflicting migrations
   - Consider resetting migrations if in development

#### Frontend Issues

1. **Build Errors**:
   - Clear cache: `npm start -- --reset-cache`
   - Rebuild node modules: `rm -rf node_modules && npm install`
   - Check for native module issues: `npx react-native doctor`

2. **React Native Device Issues**:
   - For Android: Check ADB connection
   - For iOS: Check Xcode configuration
   - Verify development environment setup

### Debugging Tools

1. **Backend Debugging**:
   - Use logging with different log levels
   - Use pdb for Python debugging
   - Check API responses with Postman or curl

2. **Frontend Debugging**:
   - Use React Native Debugger
   - Use console.log for simple debugging
   - Use Chrome DevTools for network and performance analysis

3. **Mobile App Debugging**:
   - Use Flipper for React Native debugging
   - Use device logs for native issues
   - Use React Native performance monitor