# Field-Office Workflows

> **Note**: This file requires domain knowledge about construction workflows. Please fill in the sections below with specific scenarios and requirements.

## Overview

This document describes the communication patterns, workflows, and data flows between field teams (construction sites) and office teams (project management, accounting, etc.).

## User Roles

### Office Roles (90% Desktop Usage)

**Project Manager**
- Oversees multiple projects
- Reviews daily reports
- Approves time entries
- Monitors budgets and schedules
- Communicates with clients

**Estimator**
- Creates project budgets
- Tracks costs vs estimates
- Reviews material usage
- Plans resources

**Office Administrator**
- Manages user accounts
- Handles documentation
- Coordinates communication
- Processes invoices

**Accounting Staff**
- Reviews time entries for payroll
- Tracks project costs
- Manages invoicing
- Handles financial reporting

### Field Roles (10% Mobile Usage)

**Superintendent**
- Oversees daily site operations
- Submits daily reports
- Tracks crew time
- Takes progress photos
- Communicates issues to office

**Foreman**
- Manages specific crews
- Reports time entries
- Documents work completed
- Takes photos of work in progress

**Field Engineer**
- Technical oversight
- Quality control documentation
- As-built documentation
- RFI management

## Key Workflows

### Daily Report Workflow

<!-- Please describe your daily reporting process -->

**Current Process:**
[Describe how daily reports are currently created and shared]

**Ideal ProManage Workflow:**
1. **Field (Morning)**
   - Superintendent opens mobile app
   - Reviews crew assignments for the day
   - Notes weather conditions

2. **Field (Throughout Day)**
   - Documents work activities
   - Takes progress photos
   - Notes any issues or delays
   - Tracks equipment usage

3. **Field (End of Day)**
   - Reviews and finalizes daily report
   - Submits to office
   - Real-time sync to desktop

4. **Office (Evening/Next Morning)**
   - Project Manager receives notification
   - Reviews daily report on desktop
   - Adds comments or questions
   - Approves or requests changes

**Data Points:**
- [ ] Weather conditions
- [ ] Work performed
- [ ] Crew count by trade
- [ ] Equipment on site
- [ ] Materials delivered
- [ ] Safety incidents
- [ ] Visitors
- [ ] Issues/delays
- [ ] Photos

### Time Tracking Workflow

<!-- Describe how time should be tracked -->

**Clock In/Out:**
[Describe the process]

**Time Approval:**
[Describe approval workflow]

**Ideal ProManage Workflow:**
1. **Field**
   - Workers clock in via mobile (GPS location captured)
   - Select project and cost code
   - Clock out at end of day
   - Add notes if needed

2. **Office**
   - Superintendent reviews time entries
   - Approves or corrects entries
   - Office Administrator generates payroll report
   - Accounting exports for payroll processing

**Requirements:**
- [ ] GPS verification
- [ ] Project/cost code selection
- [ ] Overtime tracking
- [ ] Break tracking
- [ ] PTO requests
- [ ] Time corrections/adjustments

### Photo Documentation Workflow

<!-- Describe photo requirements and workflow -->

**Types of Photos:**
- Progress photos
- Safety issues
- Quality issues
- As-built conditions
- Material deliveries
- Visitor documentation

**Ideal ProManage Workflow:**
1. **Field**
   - Take photo with mobile app
   - Auto-capture GPS and timestamp
   - Add caption/description
   - Tag to project area or task
   - Upload (sync when connection available)

2. **Office**
   - Real-time notification of new photos
   - Review and organize photos
   - Add to client reports
   - Archive for project records

**Requirements:**
- [ ] Offline photo capture
- [ ] Auto-sync when online
- [ ] GPS tagging
- [ ] Timestamp
- [ ] Photo organization by area/task
- [ ] Search and filter
- [ ] Export for reports

### Issue/RFI Workflow

<!-- Describe issue reporting and RFI process -->

**Issue Reporting:**
[Current process]

**Ideal ProManage Workflow:**
1. **Field**
   - Identifies issue on site
   - Creates issue in mobile app
   - Adds photos
   - Marks urgency level
   - Submits to office

2. **Office**
   - Receives real-time notification
   - Assigns to appropriate person
   - Responds with solution or questions
   - Tracks to resolution

3. **Field**
   - Receives notification of response
   - Implements solution
   - Marks as resolved

### Material Tracking Workflow

<!-- Describe material delivery and tracking -->

**Deliveries:**
[Process for receiving materials]

**Usage:**
[How materials are tracked]

**Ideal ProManage Workflow:**
[To be defined based on user input]

## Real-Time Sync Requirements

### Critical Real-Time Updates

**From Field to Office:**
- [ ] Safety incidents (immediate)
- [ ] Project delays (immediate)
- [ ] Time clock in/out (near real-time)
- [ ] Photo uploads (background sync)
- [ ] Daily report submission (immediate)

**From Office to Field:**
- [ ] Schedule changes (immediate)
- [ ] Urgent messages (immediate)
- [ ] Daily report comments (near real-time)
- [ ] Time entry corrections (near real-time)

### Acceptable Delayed Sync

**From Field:**
- [ ] Offline photos (sync when online)
- [ ] Draft daily reports (periodic)

**From Office:**
- [ ] Budget updates (periodic)
- [ ] Document additions (periodic)

## Mobile Usage Scenarios

### Primary Mobile Tasks

1. **Time Tracking** (Daily, Multiple Times)
   - Quick clock in/out
   - Minimal input required
   - Works offline

2. **Daily Reports** (Daily, End of Day)
   - Structured template
   - Photo attachment
   - Voice-to-text option?

3. **Photo Documentation** (Multiple Times Daily)
   - Quick capture
   - Auto-tagging
   - Offline capable

4. **Communication** (As Needed)
   - View office messages
   - Respond to questions
   - Push notifications

### Secondary Mobile Tasks

5. **Schedule Review** (Morning)
   - View daily plan
   - See crew assignments
   - Check deliveries

6. **Issue Reporting** (As Needed)
   - Quick issue creation
   - Photo attachment
   - Urgency levels

## Offline Capabilities

### Field Requirements

**Must Work Offline:**
- [ ] Time clock in/out
- [ ] Photo capture
- [ ] Draft daily reports
- [ ] View schedule

**Can Require Connection:**
- [ ] Submit daily reports
- [ ] View office responses
- [ ] Access project documents

### Sync Strategy

**On Connection:**
1. Upload pending data (priority order)
2. Download updates from office
3. Resolve any conflicts
4. Notify user of sync status

## Communication Patterns

### Notification Priorities

**Immediate (Push Notification):**
- Safety incidents
- Urgent messages from office
- Schedule changes affecting today

**Important (Badge/Email):**
- Daily report comments
- Time entry corrections
- New assignments

**Low Priority (In-App Only):**
- Photo uploads completed
- Background sync status
- General updates

### Response Time Expectations

**Field to Office:**
- Safety issues: Immediate
- Daily reports: End of day
- Questions: Within 24 hours

**Office to Field:**
- Safety issues: Immediate
- Schedule changes: Same day
- General questions: Next business day

## Data Ownership & Access

### Who Can View What?

**Project Manager:**
- All data for assigned projects
- Historical data
- Reports and analytics

**Superintendent:**
- Data for assigned projects
- Own team's time entries
- Project schedule and documents

**Field Workers:**
- Own time entries
- Project schedule
- Safety information

### Who Can Edit What?

**Project Manager:**
- Approve/reject time entries
- Edit daily reports
- Modify schedules

**Superintendent:**
- Submit daily reports
- Clock in/out crew
- Upload photos

## Questions for Refinement

<!-- Answer these questions to improve the workflow design -->

1. **Time Tracking**
   - How do you currently track time?
   - Do you use cost codes?
   - How are corrections handled?

2. **Daily Reports**
   - What information must be in a daily report?
   - Who reviews and approves?
   - How are they currently stored?

3. **Photos**
   - Average number of photos per day per project?
   - Current photo storage solution?
   - How are photos organized?

4. **Communication**
   - What issues require immediate notification?
   - How do field teams currently contact office?
   - What tools are used (phone, text, email)?

5. **Offline Access**
   - How often do field teams have reliable internet?
   - What tasks must work offline?
   - How critical is instant sync?

---

**Last Updated**: 2026-02-02
**Status**: Draft - Needs User Input
