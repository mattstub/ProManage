# ProManage Development Roadmap

This document outlines the development phases, module priorities, and feature breakdown for the ProManage construction management platform. Each phase builds on the previous one, establishing the infrastructure and core entities before layering on domain-specific modules.

> **Reference**: Module definitions and relationships are documented in detail in `notes/ProManage Suite.canvas`

---

## Phase Overview

| Phase | Focus | Depends On |
| ----- | ----- | ---------- |
| 1 | Foundation & Core Infrastructure | — |
| 2 | Dashboard & Hub | Phase 1 |
| 3 | Contacts & Company Setup | Phase 2 |
| 4 | Project Management Core | Phase 3 |
| 5 | Pre-Construction & Estimation | Phase 4 |
| 6 | Contract Administration | Phase 4 |
| 7 | Field Operations | Phase 4 |
| 8 | Financial & Billing | Phase 6 |
| 9 | Scheduling & Equipment | Phase 4 |
| 10 | Optimizations & AI | All prior phases |

> Phases 5-9 can be developed in parallel by separate teams once Phase 4 is complete. Each module is designed to be independently deliverable.

---

## Phase 1: Foundation & Core Infrastructure

Establish the monorepo, database, authentication, and API framework that everything else builds on.

### 1.1 Monorepo & Tooling

- [x] pnpm workspace + Turborepo configuration
- [x] Shared TypeScript configs
- [x] ESLint + Prettier + EditorConfig
- [x] Git hooks (Husky + lint-staged)
- [x] CI/CD pipeline templates
- [x] Documentation foundation (42 files)

### 1.2 Database & ORM ✅ COMPLETE

- [x] PostgreSQL setup (Docker Compose for local dev)
- [x] Prisma schema — 8 models (Organization, User, Role, Permission, RolePermission, UserRole, RefreshToken, Project)
- [x] Prisma db push workflow (dev)
- [x] Seed scripts (64 permissions, 6 roles, demo org, 3 users, 2 projects)

### 1.3 Authentication & Authorization ✅ COMPLETE

- [x] JWT access tokens (15min, short-lived)
- [x] Refresh token rotation (httpOnly cookie, 7d)
- [x] Login / Logout / Register endpoints
- [x] Password hashing (bcrypt)
- [x] RBAC middleware (Admin, ProjectManager, Superintendent, Foreman, FieldUser, OfficeAdmin)
- [x] Organization-scoped data isolation (organizationId on all models)

### 1.4 API Framework ✅ COMPLETE

- [x] Fastify server setup with TypeScript
- [x] Route structure and plugin architecture (Prisma plugin, Swagger plugin)
- [x] Zod request/response validation
- [x] Error handling middleware (AppError hierarchy)
- [x] CORS, Helmet, rate limiting
- [x] OpenAPI/Swagger documentation generation (at /docs)
- [x] Health check endpoint

### 1.5 Web Application Shell ✅ COMPLETE

- [x] Next.js 14+ with App Router
- [x] TailwindCSS + Radix UI setup
- [x] Layout system (sidebar navigation, top bar, content area)
- [x] Auth pages (login, register)
- [x] Protected route middleware
- [x] TanStack Query provider
- [x] Zustand store setup

### 1.6 Shared Packages ✅ COMPLETE

- [x] `packages/core` — shared types, Zod schemas, constants, utils (24 files)
- [x] `packages/ui-components` — Radix + Tailwind component library (26 components, 30 files)
- [x] `packages/api-client` — typed fetch wrapper with auto-refresh on 401 (10 files)

---

## Phase 2: Dashboard & Hub

The central landing page where managers access all tools, view reports, and communicate with teams.

### 2.1 Dashboard Layout

- [x] Main dashboard page with widget/card grid
- [x] Module navigation sidebar (dynamic based on enabled modules)
- [x] Settings to toggle modules on/off per organization
- [x] User profile and preferences

### 2.2 Notifications

- [x] Notification system (in-app)
- [x] Notification preferences per user
- [x] Real-time notification delivery (WebSocket)
- [x] Task-generated notifications (new assignments, approvals needed, deadlines)

### 2.3A Internal Communication — Async Messaging ✅ COMPLETE (Session 12)

- [x] Direct messages between users (thread/conversation model, 1:1)
- [x] Conversation history (paginated, oldest-first thread view)
- [x] Announcements — one-way broadcast to all users or by role (Admin/PM/OfficeAdmin)
- [x] Scheduled announcements (scheduledAt field, draft state)
- [x] Unread count badge (DMs + announcements)
- [x] Inbox UI — split-panel conversations list + thread view + announcements list

### 2.3B Channel Chat — Discord/Slack Style ✅ COMPLETE (Sessions 13-14, 2026-03-11)

- [x] Channels (per project, per topic, general — name/slug/isPrivate/description)
- [x] Channel permission model (per-channel canRead/canWrite/canManage per role, upsert)
- [x] Real-time delivery via Socket.io (JWT auth in handshake, org/user rooms)
- [x] File/image sharing (PDF, photo, video via MinIO presigned PUT/GET URLs)
- [x] Message threading (parentId reply model, thread panel UI)
- [ ] Template projects: standardized channels created with project (deferred to Phase 4.1 — Project Channels tab)

### 2.4 Company Calendar

- [x] Calendar view (month, week, day)
- [x] Event creation with notifications
- [x] Permission-scoped visibility (field users see their relevant items, management sees all)
- [x] Meeting scheduling with attendee notifications
- [x] Export/publish capability (iCal, public link)

### 2.5 Task Management

- [x] Company-wide task list
- [x] Task assignment to users
- [x] Due dates and priority levels
- [x] Task notifications on creation and approaching deadlines
- [x] Task status tracking (open, in progress, complete)

### 2.6 General Procedures

- [x] Section for end users to document their own workflows and requirements
- [x] Rich text editor for procedure creation
- [x] Organizational knowledge base

---

## Phase 3: Contacts & Company Setup

Company-level modules that support all downstream project work.

### 3.1 Contact Management ✅ COMPLETE (Session 15, 2026-03-12)

- [x] Contact CRUD (create, read, update, delete)
- [x] Contact types: Contractors, Customers, Vendors, Subcontractors, Employees, Inspectors, Architects, Engineers
- [x] Organization-level contact directory
- [x] Search and filter by type, company, name, email
- [x] Unified identity across communication modes (phone, mobile, email, etc.)
- [x] Contact association to projects
- [ ] Import/export contacts (CSV) — deferred

### 3.2 Licensing ✅ COMPLETE (Session 17, 2026-03-15)

- [x] License tracking (company and employee level — ORGANIZATION | USER holderType)
- [x] License types (user-defined freeform string)
- [x] Schema: license number, authority, type, start date, renewal date, status
- [x] License document upload (PDF/photo — multiple attachments via MinIO presigned URLs)
- [x] Application instructions storage (documentTag field on LicenseDocument)
- [x] Renewal reminder workflow (configurable days-before thresholds; ≤7d daily, >7d once per cycle; SSE bell notifications)
- [ ] Continuing education tracking — deferred

### 3.3 Safety (Company-Wide) ✅ COMPLETE (Session 20, 2026-03-17)

- [x] Company-wide safety document library (PDF/doc upload via MinIO, categories: Policy/Procedure/Emergency Plan/Training/Compliance)
- [x] SDS catalog management (product/manufacturer/chemical name, optional SDS PDF upload, review date)
- [x] Toolbox talk records (SCHEDULED/COMPLETED/CANCELLED, attendee sign-in roster, project association)
- [x] Safety forms library (INSPECTION/JSA/Hazard Assessment/Permit/Tailgate/Other, active/inactive toggle)
- [x] Incident/accident report forms (6 types: Near Miss through Fatality, OPEN/UNDER_REVIEW/CLOSED status, corrective action)
- [ ] Field communication (email/text notification relay from app)

---

## Phase 4: Project Management Core

The central entity that all construction modules connect to.

### 4.1 Project Entity

- [ ] Project CRUD
- [ ] Project types: Commercial, Residential, Industrial, Municipal, Institutional
- [ ] Support for multiple scopes under one contract
- [ ] Support for multiple contracts under one project
- [ ] Project status lifecycle
- [ ] Project team assignment (from Contact Management)
- [ ] Project-level settings and configuration
- [ ] Project dashboard (health overview, key metrics)
- [ ] Project Channels tab — surface project-scoped channels (projectId already on Channel model) within the project detail page; create/manage channels from inside the project file rather than only from global nav (deferred from Phase 2.3B)

### 4.2 Construction Documents ✅ COMPLETE (Session 25, 2026-03-21)

- [x] Drawing log with version control (git-style revision tracking)
  - [x] Append sheet numbers with revision number and name
  - [x] Append new sheets in proper placement
  - [x] Full revision history per sheet
- [x] Specification set management
  - [x] Conformed specification tracking for amended specs
- [x] Document upload and blob storage (S3/MinIO)
- [x] Phase types: Design Development, Bidding Documents, Construction Documents
- [x] Schema: Version ID, user-defined disciplines, creation date, sheet number/title/revision per sheet
- [x] User-defined drawing disciplines (not fixed enum — allows any industry)
- [x] Freeform specification section numbering (no CSI enforcement)
- [ ] Overlay capability — compare conformed set with incoming revisions (deferred to Phase 10 AI/OCR)
  - [ ] Generate report of sheets with changes
  - [ ] Verify against revision narratives
  - [ ] Link narratives to specific sheets for reference

### 4.3 Safety (Job-Specific) ✅ COMPLETE (Session 26, 2026-03-21)

- [x] Job-specific hazard assessments (JHA) — freeform title/description/file upload, DRAFT/ACTIVE/ARCHIVED status
- [x] Job-specific emergency contact information — name/role/phone/address, inline in project Safety tab
- [x] Job-specific SDS binder — PM associates org catalog SDS entries to project; print-ready binder view
- [x] Project-scoped views for SafetyDocuments, ToolboxTalks, IncidentReports (already had projectId in Phase 3.3)
- [ ] Near-miss and hazard reporting from field (mobile companion — deferred to Phase 10)

---

## Phase 5: Pre-Construction & Estimation

Modules that handle everything before construction begins — from bid to award.

### 5.1 Estimation

- [ ] Unit takeoff from construction documents
- [ ] Vendor pricing compilation per project
- [ ] Material lists and scopes of work assembly
- [ ] Proposal generation from takeoff data
- [ ] Reports: compare vendor pricing on specific items (user-defined)
- [ ] Bid results tracking — save competitor pricing and market trends
- [ ] Calendar integration for bid deadlines and pipeline visibility
- [ ] CSV import from external estimation software
- [ ] Price request workflow to vendors

### 5.2 Material Database

- [ ] Centralized pricing database per organization
- [ ] Customizable cost code mapping (aligned to accounting software)
- [ ] Job-specific material pricing records
- [ ] 6-month pricing history with trend data
- [ ] Use in conjunction with Estimation module
- [ ] Import capability from supplier quotes/invoices

### 5.3 Proposal & Bid Management

- [ ] Proposal creation from estimation data
- [ ] Proposal templates (reusable across projects)
- [ ] Bid submission tracking
- [ ] Bid pipeline calendar view

---

## Phase 6: Contract Administration

Managing the contractual and documentation lifecycle during construction.

### 6.1 Contracts

- [ ] Contract CRUD with types: Lump Sum, Cost Plus, Time & Materials, Unit Price
- [ ] Schema: project, contract number/date/status/amount, customer project number, scope (linked proposal), retention rate, wage requirements, tax status, liquidated damages, bonding, billing date
- [ ] Contract-to-bid comparison
- [ ] Sales tax letter request and dissemination automation
- [ ] Insurance and bonding request workflows

### 6.2 Submittals

- [ ] Submittal package creation and tracking
- [ ] Submittal types: shop drawings, product data, samples, mockups, calculations, vendor info, warranties, manuals, as-builts
- [ ] Schema: project, spec section, submittal/version number, dates, status, approver(s), notes, package (PDF blob)
- [ ] Reusable submittal templates across projects
- [ ] Submittal log with status tracking
- [ ] Generate report identifying requirements per project (from plans/specs)

### 6.3 Requests for Information (RFIs)

- [ ] RFI creation and tracking
- [ ] Types: Design Clarification, Material Specification, Site Condition, Schedule & Timing, Regulatory Compliance
- [ ] Schema: project, spec section, request number, originator, creator, receiver, dates, status
- [ ] RFI log with aging dashboard
- [ ] Automated reminder emails for unanswered RFIs

### 6.4 Change Orders

- [ ] Change order creation and tracking
- [ ] Types: Cost, Scope, Time, Access, Design, Value Engineering
- [ ] Schema: CO number, project, contract, dates, status, purpose, supporting docs, cost codes, total cost, schedule impact, OH&P rate
- [ ] Change order log
- [ ] Generation from Submittal, RFI, or Material modules
- [ ] Change package assembly

### 6.5 Purchase Orders

- [ ] PO generation and logging
- [ ] Types: Materials, Services (Labor)
- [ ] Schema: project, description, quantity, cost, payment terms, due dates, delivery method, approver, vendor
- [ ] PO tracking and status management

### 6.6 Permits & Inspections

- [ ] Permit tracking per job with status
- [ ] Permit application creation within software
- [ ] Municipality procedure documentation
- [ ] Link to municipality submission site (if applicable)
- [ ] User-defined permit/work order types
- [ ] Inspections linked to permits
- [ ] User-defined inspection types
- [ ] Pass/fail recording and reporting (per job, employee, contractor, municipality)

---

## Phase 7: Field Operations

Modules that serve field personnel and bridge the office-field communication gap.

### 7.1 Daily Reports

- [ ] Daily report creation (field-submitted)
- [ ] Content: work completed, weather, crew count, issues, materials delivered/used
- [ ] Progress photo attachment (GPS-tagged, timestamped)
- [ ] Report templates
- [ ] Report history and search

### 7.2 Time Tracking

- [ ] Clock in/out per employee
- [ ] Project and cost code association
- [ ] Crew-level time entry
- [ ] CSV export for accounting software upload
- [ ] Reporting: hours per project, per employee, per cost code
- [ ] Mapping feature (directions to job sites)
- [ ] Geo-tracking (deferred — evaluate difficulty and privacy implications)

---

## Phase 8: Financial & Billing

Financial modules that depend on contracts and project data being in place.

### 8.1 Pay Applications

- [ ] Pay application creation
- [ ] Types: Lump Sum Invoice, Cost Plus Invoice, AIA Billing (G702/G703), Progress Billing
- [ ] Schedule of Values (SOV) management
- [ ] Schema: project, pay app number, contacts (owner/architect/contractor), dates, change order details, financials (contract total, work completed to date, amount due, balance, retention)
- [ ] Invoicing status tracking
- [ ] Automated email for open/overdue invoices
- [ ] Export to accounting software

### 8.2 Budget Tracking

- [ ] Budget creation from estimation data
- [ ] Cost code structure (customizable)
- [ ] Budget vs. actual tracking
- [ ] Change order impact on budget
- [ ] Accounting export capability

---

## Phase 9: Scheduling & Equipment

Advanced operational modules.

### 9.1 Scheduling

- [ ] Schedule creation (CPM, LPS, Line of Balance)
- [ ] Task sequencing and dependencies
- [ ] Milestone tracking
- [ ] Resource visualization across projects
- [ ] Internal vs. customer-facing schedule views (control data granularity)
- [ ] Integration with company calendar
- [ ] Conflict forecasting across concurrent projects

### 9.2 Equipment Management

- [ ] Equipment registry: Owned, Rental (short-term), Leased (long-term)
- [ ] User-defined equipment types
- [ ] Equipment assignment to projects
- [ ] Maintenance scheduling and tracking (preventive maintenance programs)
- [ ] Rental tracking linked to Purchase Orders for ROI reporting
- [ ] Location tracking
- [ ] Utilization and cost reporting

---

## Phase 10: Optimizations & Integrations

Enhancements that leverage AI, automation, and third-party integrations across all modules.

### 10.1 AI & OCR

- [ ] OCR/AI scraping of construction documents for submittal requirements
- [ ] AI-assisted contract vs. proposal comparison
- [ ] AI-generated email summaries for RFIs
- [ ] AI-assisted report generation from daily reports
- [ ] Invoice/quote reading for Material Database population

### 10.2 Email Automation

- [ ] Automated email workflows for submittal dissemination
- [ ] Vendor price request emails from Estimation and Change Orders
- [ ] RFI reminder emails for aging requests
- [ ] Pay application follow-up for overdue invoices
- [ ] Insurance/bonding request automation from Contracts
- [ ] Email archiving into project files (Outlook integration)

### 10.3 Mobile Companion App

- [ ] React Native/Expo implementation
- [ ] Time tracking (clock in/out)
- [ ] Daily report submission
- [ ] Photo capture and upload (GPS-tagged)
- [ ] Push notifications
- [ ] Safety document access
- [ ] Offline mode with background sync

### 10.4 Advanced Integrations

- [ ] Accounting software export (QuickBooks, Sage, etc.)
- [ ] Calendar app integration (Google Calendar, Outlook)
- [ ] IoT integration for equipment (John Deere Link, etc.)
- [ ] BlueBeam workflow tools for estimation
- [ ] Third-party estimation software import

---

## Module Dependency Map

```bash
                    ┌─────────────┐
                    │  Scheduling │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              v            v            v
     ┌────────────┐ ┌────────────┐ ┌──────────┐
     │ Equipment  │ │  Dashboard │ │ Contacts │
     └────────────┘ └─────┬──────┘ └────┬─────┘
                          │             │
            ┌─────────────┼─────────────┤
            v             v             v
       ┌──────────┐  ┌─────────┐   ┌──────────┐
       │ Licensing│  │  Safety │   │  Project │◄── Central Hub
       └──────────┘  └─────────┘   └────┬─────┘
                                        │
           ┌──────────┬───────┬─────────┼───────────┬────────┬──────────┐
           v          v       v         v           v        v          v
     ┌─────────┐ ┌────────┐ ┌───┐ ┌────────────┐ ┌─────┐ ┌────────┐ ┌───────┐
     │   CDs   │ │Estimate│ │RFI│ │ Submittals │ │ COs │ │  POs   │ │Permits│
     └─────────┘ └───┬────┘ └───┘ └────────────┘ └─────┘ └────────┘ └───┬───┘
                     │                                                  │
                ┌────┴────┐                                        ┌────┴──────┐
                │Materials│                                        │Inspections│
                │   DB    │                                        └───────────┘
                └─────────┘
     ┌──────────────────────────────────────┐
     │ Contracts ──► Pay Apps               │
     │ Daily Reports  │  Time Tracking      │
     └──────────────────────────────────────┘
```

---

## Parallel Development Strategy

Once **Phase 4 (Project Core)** is complete, modules can be assigned to independent teams:

| Team | Modules | Phase |
| ---- | ------- | ----- |
| Team A — Pre-Construction | Estimation, Material Database, Proposals | 5 |
| Team B — Contract Admin | Contracts, Submittals, RFIs, Change Orders, POs | 6 |
| Team C — Field Ops | Daily Reports, Time Tracking, Permits, Inspections | 7 |
| Team D — Financial | Pay Applications, Budget Tracking | 8 |
| Team E — Operations | Scheduling, Equipment Management | 9 |

Each team works against the shared Project entity and uses the shared component library from `packages/ui-components`.

---

## Feature Priority Legend

Each module follows a consistent pattern from the canvas:

- **Definition** — What the module does and why it matters
- **Basic Needs** — MVP features that must ship
- **Types** — Categories or variations within the module
- **Schema** — Data model and identifying information
- **Tasks** — Implementation work items
- **Optimizations** — Future enhancements (AI, automation, integrations)

---

**Last Updated**: 2026-03-21
**Status**: Active — Phase 4 in progress (4.3 Safety Job-Specific complete; 4.4 next)
**Source**: `notes/ProManage Suite.canvas`
