# Project Vision

> **Note**: This file requires domain knowledge. Please fill in the sections below with your insights about the construction industry and project goals.

## Overview

ProManage is an open-source construction management platform designed for contractors to streamline project workflows between office and field teams.

## Problem Statement

### Current Pain Points

Small to mid-sized construction contractors are forced to cobble together many different disconnected software systems to manage their projects, creating information silos that lead to lost documents, miscommunication, and wasted time. Many of these affordable solutions feel like they're designed by people without real field experience and require technical expertise that field crews don't always have. While enterprise-level construction management solutions exist that have some better intuition into day to day workflow built in, become crippling due to rising costs of this current SAAS model that has been developed.

The result is a fragmented workflow where critical project documents are scattered across time tracking apps, ancient accounting systems, varying databases or complex spreadsheets, and email threads. Project managers spend excessive time manually exporting, converting, and re-entering data between systems instead of managing projects. Field teams lack a centralized communication hub for even basic updates like weather cancellations, and document access is inconsistent across roles and different project locations.

This broken workflow doesn't just waste time—it creates compliance risks, scheduling delays, budget overruns, and team frustration. Contractors need an open source, intuitive, field-worker-friendly platform that centralizes document management and communication without requiring a computer science degree or enterprise-level budget to implement.

### Who We're Solving For

Small to mid sized construction contractors that need to dissiminate materials to multiple crews in many locations. While office personnel like Project Managers, Office Administrators and Accounting staff will likely handle a lot of the data entry and analysis. This solution needs to be developed with the field users in mind who already have the difficult task of actually doing the physical construction tasks in order for the project to be completed in time and under budget. So a solution that helps anyone from a common laborer all the way up to a Company President have an easy package to analyze the project wholistically as it pertains to their role in the company

## Vision Statement

"To revolutionize construction project management for the companies that build our communities by creating software that's built by contractors, for contractors; open source, practical, and designed around real workflows, not corporate IT departments."

## Goals & Success Metrics

### Short-term Goals (6-12 months)
<!-- TODO: What do you want to achieve in the first year? -->

- [ ] Document Management UI w/ Database & Blob Storage
- [ ] Primary Module Creation (identified in canva)
- [ ] Workflows of modules working correctly (identified in canva)

### Long-term Goals (1-3 years)
<!-- TODO: Where do you see the project in 3 years? -->

- [ ] Mobile Communication Platform
- [ ] Mobile Time Tracking
- [ ] Accounting Export Capability
- [ ] optimizations of core modules being implemented

### Success Metrics
<!-- TODO: How will you measure success? -->

## Core Principles

1. Desktop-First Approach: 90% of work happens in the office, so the web application is the primary interface with full functionality.
2. Mobile Companion: 10% field usage focused on critical mobile scenarios: time tracking, photo uploads, daily reports, and real-time updates.
3. Real-Time Sync: Bidirectional updates between field and office using WebSockets/SSE ensure everyone has the latest information.
4. Open Source Commitment: AGPL-3.0 license ensures all SaaS improvements remain open source and benefit the community.

## Target Market

### Primary Market
<!-- Who are your ideal first users? -->

- Company size: 1-50 employees
- Project types: commercial construction
- Geographic focus: north america
- Technical sophistication: entry level

### Future Expansion
<!-- Where might you expand later? -->

- Adjacent markets: specialized construction industries

## Competitive Landscape

### Existing Solutions
<!-- What tools exist today? What are their limitations? -->
<!-- TODO: Existing solutions -->

1. **Procore:**
    - Strengths: Good version control, document management and creation in one place, offers an API marketplace with loads of 3rd party add-in's
    - Weaknesses: Not intuitive for navigation, silos between different stages of construction, internal communication is difficult, pricey
2. **Knowify:**
    - Strengths: AIA billing capability, some document control and creation
    - Weaknesses: Designed for service contractors or residential contractors in mind

### Our Differentiators
<!-- What makes ProManage unique? -->

1. **Open Source**: AGPL-3.0 licensed, community-driven
2. **Desktop-First**: Optimized for office workflows
3. **Real-Time**: Instant field-office synchronization
4. **Modern Stack**: Built with latest web technologies
5. **Complete Solution**: An attempt to bring all tools under 1 software suite

## Risks & Challenges

1. Technical Risks
    - Complexity of construction workflows
    - Real-time sync at scale
    - Mobile offline capabilities
2. Market Risks
    - Competition from established players
    - User adoption and training
    - Feature scope creep
3. Mitigation Strategies
    <!-- TODO: How will you address these risks? -->
4. Timeline & Milestones
    <!-- TODO: High-level timeline - details go in ROADMAP.md -->
    - **Phase 1: Foundation** (Months 1-3)
        - Core infrastructure
        - Basic project management
        - User authentication
    - **Phase 2: Essential Features** (Months 4-6)
        - Time tracking
        - Daily reports
        - Photo management
    - **Phase 3: Advanced Features** (Months 7-12)
        - Budgeting and cost tracking
        - Scheduling
        - Document management

## Community & Contribution

1. Open Source Philosophy (Why we're open source):
    - Transparency and trust
    - Community contributions
    - Faster innovation
    - Industry-wide benefit
2. Contribution Areas (Where we need help):
    - Construction industry expertise
    - Feature development
    - Testing and QA
    - Documentation

---

**Last Updated**: 2026-03-19
