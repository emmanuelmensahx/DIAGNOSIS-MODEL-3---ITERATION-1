# AfriDiag Rural Hospital Edition - Deployment Package

## Overview
This deployment package contains everything needed to install and run AfriDiag in rural hospitals and clinics with limited internet connectivity. The application is designed to work offline-first with optional synchronization when internet is available.

## Package Contents

### Core Application Files
- `Dockerfile` - Container configuration for the application
- `docker-compose.yml` - Service orchestration configuration
- `backend/` - Python FastAPI backend with SQLite database
- `frontend/` - HTML/CSS/JavaScript frontend (port 8080)
- `docker/` - Docker configuration files (nginx, supervisor)

### Installation & Management Scripts
- `install-afridiag.ps1` - Automated PowerShell installer for Windows
- `scripts/start-afridiag.bat` - Start the application
- `scripts/stop-afridiag.bat` - Stop the application  
- `scripts/backup-data.bat` - Create data backup
- `scripts/restore-data.bat` - Restore from backup
- `scripts/check-status.bat` - System status check

### Configuration Files
- `backend/app/core/config_offline.py` - Offline-specific configuration
- `backend/init_offline_database.py` - Database initialization
- `backend/app/database/offline_sync.py` - Data synchronization logic

### Documentation
- `README-RURAL-DEPLOYMENT.md` - Complete deployment and usage guide
- `DEPLOYMENT-PACKAGE.md` - This file

## System Requirements

### Minimum Requirements
- **Operating System**: Windows 10/11, Windows Server 2019+
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 10GB free space minimum, 50GB recommended
- **CPU**: Dual-core processor, 2.0GHz minimum
- **Network**: Optional (for synchronization only)

### Software Dependencies
- Docker Desktop for Windows (automatically installed by installer)
- PowerShell 5.0+ (included in Windows 10/11)

## Installation Methods

### Method 1: Automated Installation (Recommended)
1. Copy the entire AfriDiag folder to the target system
2. Right-click on `install-afridiag.ps1`
3. Select "Run with PowerShell"
4. Follow the on-screen prompts
5. Use desktop shortcuts to start/stop the application

### Method 2: Manual Installation
1. Install Docker Desktop manually
2. Copy AfriDiag folder to desired location
3. Open PowerShell in the AfriDiag directory
4. Run: `docker-compose up -d`
5. Access application at http://localhost:8080

## First-Time Setup

### Default Credentials
- **Username**: admin
- **Password**: admin123
- **Change these credentials immediately after first login**

### Initial Configuration
1. Start the application using desktop shortcut or `scripts/start-afridiag.bat`
2. Open browser to http://localhost:8080
3. Login with default credentials
4. Change admin password in Settings
5. Configure hospital information
6. Add initial users and departments

## Key Features for Rural Deployment

### Offline Operation
- ✅ Works completely offline
- ✅ SQLite database (no external database required)
- ✅ Local file storage
- ✅ Cached AI models for diagnosis
- ✅ No internet dependency for core functions

### Data Management
- ✅ Automatic daily backups
- ✅ Manual backup/restore tools
- ✅ Data export capabilities
- ✅ Audit logging
- ✅ Data retention policies

### Synchronization (When Internet Available)
- ✅ Automatic sync when connected
- ✅ Manual sync triggers
- ✅ Conflict resolution
- ✅ Incremental updates
- ✅ Sync status monitoring

### Security
- ✅ Local authentication
- ✅ Role-based access control
- ✅ Data encryption at rest
- ✅ Audit trails
- ✅ Session management

## Daily Operations

### Starting the Application
- Double-click "Start AfriDiag" desktop shortcut
- OR run `scripts/start-afridiag.bat`
- Wait for services to start (30-60 seconds)
- Access at http://localhost:8080

### Stopping the Application
- Double-click "Stop AfriDiag" desktop shortcut
- OR run `scripts/stop-afridiag.bat`

### Checking System Status
- Double-click "AfriDiag Status" desktop shortcut
- OR run `scripts/check-status.bat`
- Review all system components

### Creating Backups
- Run `scripts/backup-data.bat` daily
- Backups stored in `data/backups/`
- Automatic cleanup keeps last 10 backups

## Troubleshooting

### Common Issues

#### Application Won't Start
1. Check if Docker is running
2. Run `scripts/check-status.bat`
3. Restart Docker Desktop
4. Try `scripts/stop-afridiag.bat` then `scripts/start-afridiag.bat`

#### Can't Access Application
1. Verify application is running: `scripts/check-status.bat`
2. Check if port 8080 is blocked by firewall
3. Try accessing http://127.0.0.1:8080 instead

#### Database Issues
1. Check if `data/afridiag.db` exists
2. Restore from backup: `scripts/restore-data.bat`
3. Reinitialize database by deleting `data/afridiag.db` and restarting

#### Performance Issues
1. Check available disk space
2. Restart the application
3. Consider increasing system RAM
4. Clean old backups and logs

### Log Files
- Application logs: `data/logs/`
- Docker logs: `docker-compose logs`
- System logs: Windows Event Viewer

## Maintenance

### Daily Tasks
- ✅ Create backup: `scripts/backup-data.bat`
- ✅ Check system status: `scripts/check-status.bat`
- ✅ Monitor disk space
- ✅ Review application logs

### Weekly Tasks
- ✅ Clean old backups (automatic)
- ✅ Update patient records
- ✅ Review user access
- ✅ Test restore procedure

### Monthly Tasks
- ✅ Full system backup to external media
- ✅ Review and update user accounts
- ✅ Check for application updates
- ✅ Performance optimization

## Data Synchronization

### When Internet is Available
1. Application automatically detects connectivity
2. Sync process starts automatically
3. Monitor sync status in application
4. Manual sync: Use sync button in admin panel

### Sync Configuration
- Sync frequency: Every 30 minutes (when connected)
- Retry attempts: 3 times
- Timeout: 5 minutes per operation
- Conflict resolution: Server wins (configurable)

## Security Best Practices

### User Management
- Change default admin password immediately
- Create individual user accounts
- Use strong passwords
- Regular password updates
- Remove inactive users

### Data Protection
- Regular backups to external media
- Encrypt backup files when transferring
- Secure physical access to server
- Monitor user activity logs
- Implement data retention policies

### Network Security
- Use firewall to restrict access
- VPN for remote access
- Secure WiFi configuration
- Regular security updates
- Monitor network traffic

## Support and Updates

### Getting Help
1. Check this documentation first
2. Review troubleshooting section
3. Check log files for errors
4. Contact technical support with:
   - System status output
   - Error messages
   - Steps to reproduce issue

### Updates
- Check for updates monthly
- Test updates on non-production system first
- Backup data before applying updates
- Follow update documentation carefully

## Emergency Procedures

### System Failure
1. Stop application: `scripts/stop-afridiag.bat`
2. Check system status: `scripts/check-status.bat`
3. Restore from backup: `scripts/restore-data.bat`
4. Restart application: `scripts/start-afridiag.bat`

### Data Corruption
1. Stop application immediately
2. Copy current database to safe location
3. Restore from latest good backup
4. Restart application
5. Verify data integrity

### Hardware Failure
1. Ensure regular backups to external media
2. Document system configuration
3. Maintain spare hardware when possible
4. Have recovery procedures documented
5. Test recovery procedures regularly

## Contact Information

For technical support and updates:
- Documentation: README-RURAL-DEPLOYMENT.md
- System Status: scripts/check-status.bat
- Backup/Restore: scripts/backup-data.bat, scripts/restore-data.bat

---

**AfriDiag Rural Hospital Edition**  
*Bringing AI-powered medical diagnosis to underserved communities*

Last Updated: December 2024  
Version: 1.0 Rural Deployment Package