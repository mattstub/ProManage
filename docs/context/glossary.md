# ProManage Glossary

> **Note**: This file needs construction industry terminology. Please add industry-specific terms and acronyms as you encounter them.

## General Construction Terms

<!-- Add construction industry terms here -->

**General Contractor (GC)**
<!-- Definition needed -->

**Subcontractor**
<!-- Definition needed -->

**Superintendent**
<!-- Definition needed -->

**Foreman**
<!-- Definition needed -->

**Change Order**
<!-- Definition needed -->

**RFI (Request for Information)**
<!-- Definition needed -->

**Submittal**
<!-- Definition needed -->

**Punch List**
<!-- Definition needed -->

**As-Built**
<!-- Definition needed -->

**Shop Drawings**
<!-- Definition needed -->

## Cost & Budgeting Terms

**Cost Code**
<!-- Definition needed -->

**Budget Line Item**
<!-- Definition needed -->

**Cost-Plus Contract**
<!-- Definition needed -->

**Lump Sum Contract**
<!-- Definition needed -->

**Unit Price**
<!-- Definition needed -->

**Contingency**
<!-- Definition needed -->

**Retention (or Retainage)**
<!-- Definition needed -->

## Scheduling Terms

**Critical Path**
<!-- Definition needed -->

**Milestone**
<!-- Definition needed -->

**Lead Time**
<!-- Definition needed -->

**Float (or Slack)**
<!-- Definition needed -->

**Baseline Schedule**
<!-- Definition needed -->

## Safety & Compliance

**OSHA**
<!-- Definition needed -->

**Safety Data Sheet (SDS)**
<!-- Definition needed -->

**Toolbox Talk**
<!-- Definition needed -->

**Job Hazard Analysis (JHA)**
<!-- Definition needed -->

**PPE (Personal Protective Equipment)**
<!-- Definition needed -->

## Documentation

**Daily Report (or Daily Log)**
<!-- Definition needed -->

**Progress Photos**
<!-- Definition needed -->

**Certified Payroll**
<!-- Definition needed -->

**AIA Billing (Application for Payment)**
<!-- Definition needed -->

## ProManage-Specific Terms

### User Roles

**Project Manager**
Office-based user who oversees projects, reviews reports, approves time entries, and manages budgets.

**Superintendent**
Field-based user who manages daily site operations, submits daily reports, and tracks crew time.

**Foreman**
Field-based user who manages specific crews and reports work progress.

**Office Administrator**
Office-based user who handles user management, documentation, and coordination.

**Field User**
General term for any mobile app user working on construction sites.

### Application Terms

**Desktop App**
The web-based application accessed via browser, optimized for office workflows (90% use case).

**Mobile App**
The React Native mobile application for iOS and Android, focused on field tasks (10% use case).

**Real-Time Sync**
The WebSocket-based bidirectional communication between field and office applications.

**Offline Mode**
Mobile app capability to function without internet connection, syncing data when connection is restored.

### Features

**Time Tracking**
Feature for clocking in/out, recording hours worked, and associating time with projects and cost codes.

**Daily Report**
End-of-day summary submitted by field teams documenting work performed, crew count, weather, issues, and photos.

**Photo Documentation**
GPS-tagged, timestamped photos uploaded from field to document progress, issues, or as-built conditions.

**Cost Code**
Categorization system for time and expenses (e.g., "Framing - Labor", "Electrical - Materials").

## Technical Terms

### Architecture

**Monorepo**
A single repository containing multiple applications (web, mobile, API) and shared packages.

**Desktop-First**
Design philosophy prioritizing desktop user experience since 90% of usage occurs in the office.

**Mobile Companion**
The mobile app as a focused tool for field tasks rather than a full-featured duplicate of the desktop app.

### Development

**pnpm Workspace**
Package manager configuration for managing dependencies across the monorepo.

**Turborepo**
Build system for orchestrating builds, tests, and caching across monorepo packages.

**Shared Package**
Code shared between applications (e.g., core business logic, UI components, API client).

### Real-Time

**WebSocket**
Bidirectional communication protocol used for real-time updates (via Socket.io).

**SSE (Server-Sent Events)**
Fallback real-time communication method for one-way server-to-client updates.

**Room**
Socket.io concept for grouping connections (e.g., all users on a specific project).

**Optimistic Update**
UI pattern that immediately shows changes before server confirmation for better UX.

### Database

**Prisma**
ORM (Object-Relational Mapping) tool for type-safe database access.

**Migration**
Database schema version control and update mechanism.

**Seeding**
Populating database with initial or test data.

## Acronyms

**AGPL** - Affero General Public License (v3.0)
Open source license requiring SaaS deployments to share source code.

**API** - Application Programming Interface
Backend server providing data and services to web and mobile apps.

**RBAC** - Role-Based Access Control
Permission system based on user roles.

**JWT** - JSON Web Token
Authentication token format used for stateless auth.

**ORM** - Object-Relational Mapping
Tool for database access using object-oriented code (Prisma).

**PWA** - Progressive Web App
Web application with offline capabilities and native-like features.

**CI/CD** - Continuous Integration/Continuous Deployment
Automated testing and deployment pipeline.

**E2E** - End-to-End (testing)
Testing full user workflows from start to finish.

**CRUD** - Create, Read, Update, Delete
Basic database operations.

**REST** - Representational State Transfer
API architecture style using HTTP methods.

**SSR** - Server-Side Rendering
Rendering pages on server before sending to client (Next.js feature).

**CSR** - Client-Side Rendering
Rendering pages in browser with JavaScript.

## Construction Acronyms

<!-- Add construction-specific acronyms here -->

**RFI** - Request for Information

**GC** - General Contractor

**AIA** - American Institute of Architects

**OSHA** - Occupational Safety and Health Administration

**PPE** - Personal Protective Equipment

**SDS** - Safety Data Sheet

**JHA** - Job Hazard Analysis

**CO** - Change Order

**PCO** - Potential Change Order

**SOV** - Schedule of Values

<!-- Add more as needed -->

## Trade-Specific Terms

### Concrete
<!-- Add concrete trade terms -->

### Framing
<!-- Add framing trade terms -->

### Electrical
<!-- Add electrical trade terms -->

### Plumbing
<!-- Add plumbing trade terms -->

### HVAC
<!-- Add HVAC trade terms -->

### Finishing
<!-- Add finishing trade terms -->

## Usage Guidelines

When adding new terms:
1. Place in appropriate section
2. Provide clear, concise definition
3. Include context or usage example if helpful
4. Note if term is industry-standard vs ProManage-specific

---

**Last Updated**: 2026-02-02
**Status**: Draft - Needs User Input for Construction Terms
