# AfriDiag User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
   - [Installation](#installation)
   - [Registration](#registration)
   - [Login](#login)
3. [Frontline Worker Interface](#frontline-worker-interface)
   - [Dashboard](#frontline-worker-dashboard)
   - [Patient Management](#patient-management)
   - [Creating a New Diagnosis](#creating-a-new-diagnosis)
   - [Viewing Diagnosis History](#viewing-diagnosis-history)
   - [Offline Mode](#offline-mode-for-frontline-workers)
4. [Specialist Interface](#specialist-interface)
   - [Dashboard](#specialist-dashboard)
   - [Reviewing Diagnoses](#reviewing-diagnoses)
   - [Providing Feedback](#providing-feedback)
   - [Treatment Plans](#treatment-plans)
5. [Common Features](#common-features)
   - [Profile Management](#profile-management)
   - [Notifications](#notifications)
   - [Data Synchronization](#data-synchronization)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)
8. [Support](#support)

## Introduction

AfriDiag is a mobile application designed to assist healthcare workers in diagnosing and treating diseases in resource-limited settings. The application uses artificial intelligence to analyze symptoms and medical images, providing diagnostic suggestions and treatment recommendations.

The system has two main user roles:

- **Frontline Workers**: Healthcare providers who interact directly with patients, collect symptoms, capture medical images, and submit cases for AI diagnosis.
- **Specialists**: Medical experts who review AI diagnoses, provide feedback, and confirm treatment plans.

## Getting Started

### Installation

1. **Android Users**:
   - Download AfriDiag from the Google Play Store
   - Open the app after installation completes

2. **iOS Users**:
   - Download AfriDiag from the Apple App Store
   - Open the app after installation completes

### Registration

1. Open the AfriDiag app
2. Tap "Register" on the login screen
3. Fill in your details:
   - Full Name
   - Email Address
   - Password (at least 8 characters with a mix of letters, numbers, and symbols)
   - Select your role (Frontline Worker or Specialist)
   - If registering as a Specialist, provide your specialization and license number
4. Tap "Register"
5. Verify your email address by clicking the link sent to your email

### Login

1. Open the AfriDiag app
2. Enter your registered email address
3. Enter your password
4. Tap "Login"
5. If you've forgotten your password, tap "Forgot Password" and follow the instructions sent to your email

## Frontline Worker Interface

### Frontline Worker Dashboard

The dashboard provides a quick overview of your recent activities and pending tasks:

- **Recent Patients**: Shows the most recently added or updated patients
- **Pending Diagnoses**: Shows diagnoses awaiting specialist review
- **Confirmed Diagnoses**: Shows diagnoses that have been confirmed by specialists
- **Quick Actions**: Buttons for common tasks like adding a new patient or creating a new diagnosis

### Patient Management

#### Adding a New Patient

1. From the dashboard, tap "Add New Patient" or navigate to the Patients tab and tap the "+" button
2. Fill in the patient's details:
   - Name
   - Age
   - Gender
   - Contact Number
   - Address
   - Medical History (select from common conditions or add custom entries)
   - Allergies
   - Blood Type
3. Tap "Save" to add the patient to the system

#### Viewing Patient List

1. Navigate to the Patients tab
2. Browse the list of patients
3. Use the search bar to find specific patients by name
4. Use filters to sort patients by recent activity, alphabetical order, or other criteria

#### Editing Patient Information

1. From the Patients list, tap on a patient's name
2. On the Patient Details screen, tap "Edit"
3. Update the patient's information
4. Tap "Save" to confirm changes

### Creating a New Diagnosis

1. From the Patient Details screen, tap "New Diagnosis" or from the dashboard, tap "Create Diagnosis"
2. If starting from the dashboard, select a patient from the list or add a new patient
3. Select the disease type (optional, but helps narrow down symptom options)
4. Select symptoms from the categorized list:
   - Respiratory symptoms
   - Gastrointestinal symptoms
   - Neurological symptoms
   - General symptoms
   - Other symptoms
5. Add medical images (if available):
   - Tap "Add Image"
   - Choose to take a new photo or select from gallery
   - For X-rays or microscopy images, ensure proper lighting and positioning
   - Add a caption or description for each image
6. Add notes about the patient's condition, history, or other relevant information
7. Set the urgency level (Low, Medium, High)
8. Tap "Submit for Diagnosis"
9. Review the AI diagnosis results:
   - Diagnosis suggestion
   - Confidence level
   - Treatment recommendations
   - Referral advice
10. Tap "Confirm and Send to Specialist" to forward the case for specialist review

### Viewing Diagnosis History

1. From the Patient Details screen, tap "History"
2. View a list of all diagnoses for the patient, sorted by date
3. Each diagnosis shows:
   - Date
   - Disease type
   - AI diagnosis
   - Status (Pending, Confirmed, Rejected)
4. Tap on a diagnosis to view full details, including:
   - Symptoms
   - Medical images
   - AI diagnosis and confidence level
   - Specialist feedback (if available)
   - Treatment plan (if confirmed)

### Offline Mode for Frontline Workers

AfriDiag works in areas with limited or no internet connectivity:

1. **Automatic Offline Detection**: The app automatically detects when you're offline and switches to offline mode
2. **Offline Capabilities**:
   - Add and edit patients
   - Create new diagnoses (stored locally)
   - View previously downloaded patient records and diagnoses
3. **Synchronization**:
   - When internet connectivity is restored, tap "Sync" in the menu
   - The app will upload all offline changes and download updates
   - A sync status indicator shows progress and completion

## Specialist Interface

### Specialist Dashboard

The specialist dashboard provides an overview of cases requiring review:

- **Pending Reviews**: Shows diagnoses awaiting your review, sorted by urgency
- **Recent Activity**: Shows your recently reviewed cases
- **Statistics**: Shows metrics like average response time and number of cases reviewed

### Reviewing Diagnoses

1. From the dashboard, tap on a case in the "Pending Reviews" section or navigate to the Reviews tab
2. View the case details:
   - Patient information
   - Symptoms reported
   - Medical images
   - AI diagnosis and confidence level
   - Frontline worker notes
3. Review the medical images by tapping on them for a full-screen view
4. Consider the AI diagnosis and confidence level

### Providing Feedback

1. After reviewing the case, provide your feedback:
   - Confirm or reject the AI diagnosis
   - If rejecting, provide an alternative diagnosis
   - Add detailed feedback for the frontline worker
2. Specify a treatment plan:
   - Medication details (name, dosage, duration)
   - Follow-up instructions
   - Referral recommendations (if needed)
3. Set the priority for follow-up
4. Tap "Submit Review"

### Treatment Plans

1. Navigate to the Treatments tab to view all active treatment plans
2. Filter treatments by status (Scheduled, In Progress, Completed)
3. Tap on a treatment to view details:
   - Patient information
   - Diagnosis details
   - Current treatment plan
   - Follow-up schedule
4. Add follow-up notes after patient check-ins
5. Update treatment status as needed

## Common Features

### Profile Management

1. Tap on your profile icon in the top-right corner
2. View and edit your profile information:
   - Name
   - Email
   - Contact information
3. Change your password:
   - Enter current password
   - Enter and confirm new password
4. Manage notification settings
5. Set application preferences

### Notifications

AfriDiag sends notifications for important events:

- **For Frontline Workers**:
   - When a specialist reviews a diagnosis
   - When a treatment plan is updated
   - Reminders for patient follow-ups

- **For Specialists**:
   - When new cases are assigned for review
   - High-urgency cases requiring immediate attention
   - Follow-up results from treatments

Manage notification settings in your profile.

### Data Synchronization

1. Manual sync: Tap the sync icon in the menu
2. Automatic sync: Occurs when the app detects an internet connection after being offline
3. Sync status is displayed with a progress indicator
4. Resolve sync conflicts if prompted:
   - View differences between local and server versions
   - Choose which version to keep or merge changes

## Troubleshooting

### Common Issues and Solutions

#### App Crashes or Freezes

1. Close and restart the app
2. Ensure your device has sufficient storage space
3. Update to the latest version of the app
4. If problems persist, reinstall the app

#### Sync Issues

1. Check your internet connection
2. Try manual sync by tapping the sync icon
3. If sync fails repeatedly:
   - Note the error message
   - Try again later
   - Contact support if the issue persists

#### Image Upload Problems

1. Ensure images are not too large (under 10MB)
2. Check your internet connection
3. Try uploading again when in an area with better connectivity
4. If offline, images will be queued for upload when online

#### Login Problems

1. Verify your email and password
2. Reset your password if you've forgotten it
3. Check your internet connection
4. Contact support if you cannot access your account

## FAQ

### General Questions

**Q: Is my data secure?**  
A: Yes, all data is encrypted both in transit and at rest. Patient information is protected according to healthcare privacy standards.

**Q: Can I use AfriDiag on multiple devices?**  
A: Yes, you can log in to your account on multiple devices. Your data will synchronize across all devices.

**Q: How accurate is the AI diagnosis?**  
A: The AI model provides diagnostic suggestions based on symptoms and images with a confidence level. All AI diagnoses are reviewed by specialists before final confirmation.

### Frontline Worker Questions

**Q: Can I use AfriDiag without internet access?**  
A: Yes, AfriDiag has an offline mode that allows you to add patients and create diagnoses. Data will synchronize when internet connectivity is restored.

**Q: How long does it take to get specialist feedback?**  
A: Specialist response times vary based on case urgency. High-urgency cases are prioritized for faster review.

**Q: Can I edit a diagnosis after submitting it?**  
A: You cannot edit a diagnosis after submission, but you can add notes that will be visible to the reviewing specialist.

### Specialist Questions

**Q: How are cases assigned to me?**  
A: Cases are assigned based on your specialization and current workload to ensure balanced distribution.

**Q: Can I discuss a case with the frontline worker?**  
A: Yes, you can add comments to the case that will be visible to the frontline worker, or use the in-app messaging feature for direct communication.

**Q: Can I see my review history?**  
A: Yes, your review history is available in the Activity section of your dashboard.

## Support

### Contact Information

- **Email Support**: support@afridiag.org
- **Phone Support**: +123-456-7890 (Available Monday-Friday, 9 AM - 5 PM EAT)
- **In-App Help**: Tap the "Help" icon in the menu for immediate assistance

### Reporting Issues

1. From the menu, tap "Help" then "Report an Issue"
2. Select the issue category
3. Describe the problem in detail
4. Attach screenshots if relevant
5. Submit the report

### Feedback and Suggestions

We welcome your feedback to improve AfriDiag:

1. From the menu, tap "Help" then "Provide Feedback"
2. Rate your experience
3. Share your suggestions
4. Submit your feedback

### Training and Resources

Additional training materials are available:

- Video tutorials in the "Help" section
- Downloadable PDF guides
- Webinar schedule for live training sessions
- FAQ section for common questions