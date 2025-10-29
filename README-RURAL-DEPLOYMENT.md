# AfriDiag - Rural Hospital Deployment Guide

## Overview
AfriDiag Rural Hospital Edition is a complete offline-capable medical diagnosis system designed specifically for rural hospitals with limited internet connectivity and basic IT infrastructure.

## System Requirements

### Minimum Hardware Requirements
- **CPU**: Dual-core processor (2.0 GHz or higher)
- **RAM**: 4 GB (8 GB recommended)
- **Storage**: 10 GB free disk space
- **Network**: No internet required for operation (optional for updates/sync)

### Software Requirements
- **Operating System**: Windows 10/11, Ubuntu 18.04+, or macOS 10.14+
- **Docker**: Automatically installed by the installer
- **Browser**: Chrome, Firefox, Safari, or Edge (for accessing the application)

## Installation

### Option 1: Automated Installation (Recommended)
1. Download the `install-afridiag.ps1` script
2. Right-click and select "Run with PowerShell" as Administrator
3. Follow the on-screen instructions
4. The installer will:
   - Install Docker Desktop if needed
   - Download and configure AfriDiag
   - Create desktop shortcuts
   - Set up automatic startup

### Option 2: Manual Installation
1. Install Docker Desktop from https://docker.com/products/docker-desktop
2. Download the AfriDiag package
3. Extract to `C:\AfriDiag`
4. Open PowerShell as Administrator
5. Navigate to the AfriDiag directory
6. Run: `docker-compose up -d`

## First-Time Setup

### 1. Access the Application
- Open your web browser
- Navigate to: `http://localhost:8080`
- You should see the AfriDiag login screen

### 2. Initial Login
- **Username**: `admin`
- **Password**: `admin123`
- **IMPORTANT**: Change this password immediately after first login!

### 3. Configure Hospital Information
1. Go to Settings → Hospital Information
2. Update:
   - Hospital Name
   - Location
   - Contact Information
   - Emergency Contacts

## Daily Operations

### Starting AfriDiag
- **Method 1**: Double-click the "AfriDiag" desktop shortcut
- **Method 2**: Run `C:\AfriDiag\start-afridiag.bat`
- **Method 3**: Open PowerShell, navigate to AfriDiag folder, run `docker-compose up -d`

### Stopping AfriDiag
- **Method 1**: Run `C:\AfriDiag\stop-afridiag.bat`
- **Method 2**: Open PowerShell, navigate to AfriDiag folder, run `docker-compose down`

### Accessing the Application
- Open any web browser
- Go to: `http://localhost:8080`
- Login with your credentials

## Key Features for Rural Hospitals

### 🔄 Offline Operation
- Works completely without internet
- All patient data stored locally
- AI diagnosis models run locally
- No dependency on external services

### 💾 Data Management
- **Local Storage**: All data stored in SQLite database
- **Automatic Backups**: Every 6 hours
- **Data Export**: Export patient data for transfer
- **Data Import**: Import data from other systems

### 🔄 Synchronization (When Internet Available)
- Automatic sync when internet connection detected
- Manual sync option in Settings
- Conflict resolution for data changes
- Secure encrypted data transfer

### 🛡️ Security Features
- Local user authentication
- Role-based access control
- Audit logging of all actions
- Encrypted data storage

## User Management

### Creating New Users
1. Login as admin
2. Go to Settings → User Management
3. Click "Add New User"
4. Fill in user details:
   - Username
   - Full Name
   - Email
   - Role (Doctor, Nurse, Admin)
   - Password

### User Roles
- **Admin**: Full system access, user management, settings
- **Doctor**: Patient management, diagnosis, treatment
- **Nurse**: Patient registration, basic data entry

## Patient Management

### Registering New Patients
1. Click "New Patient" on the dashboard
2. Fill in patient information:
   - Personal details
   - Contact information
   - Medical history
   - Allergies
3. Save patient record

### Managing Patient Records
- **Search**: Use the search bar to find patients
- **View**: Click on patient name to view full record
- **Edit**: Update patient information as needed
- **History**: View complete medical history

## Diagnosis Workflow

### Creating a Diagnosis
1. Select patient from patient list
2. Click "New Diagnosis"
3. Enter symptoms:
   - Primary symptoms
   - Secondary symptoms
   - Duration and severity
4. Click "Analyze" for AI-powered diagnosis
5. Review AI recommendations
6. Add your clinical assessment
7. Prescribe treatment if needed

### AI Diagnosis Features
- **Symptom Analysis**: AI analyzes symptom patterns
- **Confidence Scoring**: Shows confidence level of diagnosis
- **Differential Diagnosis**: Lists possible conditions
- **Treatment Recommendations**: Suggests appropriate treatments
- **Emergency Detection**: Flags potential emergencies

## Data Backup and Recovery

### Automatic Backups
- Backups created every 6 hours
- Stored in: `C:\AfriDiag\data\backups`
- Last 10 backups retained automatically

### Manual Backup
1. Go to Settings → Data Management
2. Click "Create Backup Now"
3. Backup file will be created with timestamp

### Restoring from Backup
1. Stop AfriDiag application
2. Go to Settings → Data Management
3. Select backup file to restore
4. Confirm restoration
5. Restart application

## Troubleshooting

### Common Issues

#### Application Won't Start
1. Check if Docker is running
2. Restart Docker Desktop
3. Run: `docker-compose down` then `docker-compose up -d`

#### Can't Access Application
1. Verify URL: `http://localhost:8080`
2. Check if port 8080 is blocked by firewall
3. Try: `http://127.0.0.1:8080`

#### Slow Performance
1. Close unnecessary applications
2. Restart the computer
3. Check available disk space (need 2GB free minimum)

#### Database Issues
1. Check database file exists: `C:\AfriDiag\data\afridiag.db`
2. Run database repair: Settings → Data Management → Repair Database

### Getting Help
1. Check the built-in help system (Help → User Guide)
2. Contact your IT administrator
3. For technical support: [support contact information]

## Maintenance

### Regular Maintenance Tasks
- **Weekly**: Check backup status
- **Monthly**: Review user accounts and permissions
- **Quarterly**: Update application if internet available

### System Updates
1. When internet is available, go to Settings → System Updates
2. Click "Check for Updates"
3. Follow prompts to download and install updates
4. Restart application after updates

### Data Cleanup
1. Go to Settings → Data Management
2. Use "Data Cleanup" to remove old logs and temporary files
3. Archive old patient records if needed

## Security Best Practices

### Password Management
- Change default admin password immediately
- Use strong passwords (8+ characters, mixed case, numbers, symbols)
- Change passwords every 90 days
- Don't share user accounts

### Access Control
- Create individual accounts for each user
- Assign appropriate roles based on job function
- Regularly review user access
- Disable accounts for users who leave

### Data Protection
- Keep the computer physically secure
- Use screen locks when away
- Regular backups to external storage
- Encrypt backup files when transferring

## Emergency Procedures

### System Failure
1. Try restarting the application
2. If that fails, restart the computer
3. If still not working, restore from latest backup
4. Contact technical support

### Data Loss
1. Stop using the system immediately
2. Restore from most recent backup
3. Document what data may have been lost
4. Contact technical support

### Power Outage
- System automatically saves data continuously
- Use UPS (Uninterruptible Power Supply) if available
- After power restoration, check system status

## Contact Information

### Technical Support
- **Local IT**: [Your hospital IT contact]
- **AfriDiag Support**: [Support contact information]
- **Emergency**: [Emergency technical contact]

### Training and Support
- **User Training**: Available on request
- **Documentation**: Built-in help system
- **Video Tutorials**: [Link to training videos]

---

**Version**: 1.0.0-rural  
**Last Updated**: [Current Date]  
**Document**: Rural Hospital Deployment Guide