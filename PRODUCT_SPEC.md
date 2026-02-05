# HubSpot Dashboard - Product Specification

**Version**: 1.0.0
**Document Owner**: Terrel Yeh
**Last Updated**: 2026-02-05
**Status**: ✅ Implemented

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Objectives](#business-objectives)
3. [User Personas](#user-personas)
4. [User Stories & Use Cases](#user-stories--use-cases)
5. [Feature Requirements](#feature-requirements)
6. [Success Metrics](#success-metrics)
7. [User Experience Flow](#user-experience-flow)
8. [Acceptance Criteria](#acceptance-criteria)
9. [Out of Scope](#out-of-scope)
10. [Future Roadmap](#future-roadmap)

---

## Executive Summary

### Problem Statement

Sales teams operating across multiple regions (US, APAC, Japan, India, Europe) face significant challenges:

- **Data Fragmentation**: Each region uses separate HubSpot accounts, making consolidated reporting difficult
- **Limited Visibility**: Sales managers cannot quickly assess pipeline health across regions
- **Manual Forecasting**: Weighted forecasts require manual calculation and Excel spreadsheets
- **Delayed Insights**: Real-time deal status and product details are not readily accessible
- **Target Tracking Complexity**: Managing quarterly targets across owners and regions is time-consuming

### Solution

HubSpot Dashboard is a centralized web application that:

✅ **Consolidates** data from 5 independent HubSpot accounts into a unified view
✅ **Enables** instant region switching without losing context
✅ **Automates** weighted forecasting based on configurable stage probabilities
✅ **Provides** rich deal details including line items and contacts on-demand
✅ **Simplifies** target management with multi-currency support

### Business Impact

- **80% reduction** in time spent on manual forecast calculations
- **Instant visibility** into $1.5M+ pipeline across 5 regions
- **Single source of truth** for sales performance tracking
- **Improved decision-making** through real-time data access

---

## Business Objectives

### Primary Objectives

1. **Increase Sales Visibility** (Q1 2026)
   - Enable sales managers to view pipeline health across all regions within 3 clicks
   - Provide real-time visibility into top deals and key activities
   - **Success Metric**: 100% of sales managers use dashboard daily within 1 month

2. **Improve Forecast Accuracy** (Q1-Q2 2026)
   - Implement weighted forecasting based on stage probabilities
   - Automate forecast calculations to reduce human error
   - **Success Metric**: Forecast accuracy improves from 65% to 80%

3. **Reduce Reporting Time** (Q1 2026)
   - Eliminate manual Excel-based reporting
   - Automate data synchronization from HubSpot
   - **Success Metric**: Reduce weekly reporting time from 4 hours to 15 minutes

4. **Enable Data-Driven Decisions** (Q2 2026)
   - Surface key activities (new deals, stale deals, large deals)
   - Provide detailed deal information including products and contacts
   - **Success Metric**: 90% of deal decisions reference dashboard data

### Secondary Objectives

- Support multi-currency operations (USD, JPY, EUR, etc.)
- Enable per-region target setting and tracking
- Provide flexible Pipeline Stage configuration
- Maintain data security and access control

---

## User Personas

### Persona 1: Regional Sales Director

**Name**: Sarah Chen
**Role**: VP of Sales, APAC
**Location**: Singapore
**Experience**: 15 years in sales leadership

**Goals**:
- Monitor pipeline health across APAC region
- Identify at-risk deals early
- Forecast quarterly revenue accurately
- Track team performance against targets

**Pain Points**:
- Manually compiling reports from HubSpot takes 4+ hours weekly
- Cannot quickly identify which deals need attention
- Forecasting requires complex Excel formulas
- Difficult to compare performance across quarters

**Needs**:
- Real-time dashboard accessible from any device
- One-click region switching
- Automated weighted forecasts
- Visual indicators for deal health

**Success Scenario**: "I can check my dashboard Monday morning and immediately know which deals my team should focus on this week."

---

### Persona 2: Sales Manager

**Name**: Michael Rodriguez
**Role**: Sales Manager, US
**Location**: San Francisco
**Experience**: 8 years in B2B sales

**Goals**:
- Close deals efficiently
- Understand product details for each opportunity
- Connect with decision-makers
- Hit quarterly targets

**Pain Points**:
- Switching between HubSpot tabs to see deal details is slow
- Product line items are buried in HubSpot UI
- Cannot quickly find contact information for deals
- Unclear on current pipeline value vs. target

**Needs**:
- Quick access to deal details (products, contacts, amounts)
- Single view of all relevant deal information
- Easy navigation between deals
- Clear target progress visibility

**Success Scenario**: "When a prospect calls, I can pull up the deal in 5 seconds and see all products, pricing, and contact history without navigating away."

---

### Persona 3: Executive Leadership

**Name**: David Park
**Role**: Chief Revenue Officer
**Location**: New York
**Experience**: 20 years in executive leadership

**Goals**:
- Understand company-wide pipeline health
- Make strategic decisions based on regional performance
- Identify growth opportunities and risks
- Report to board on revenue forecasts

**Pain Points**:
- No unified view across all regional HubSpot accounts
- Manual consolidation of regional reports
- Cannot quickly switch context between regions
- Delayed insights due to manual reporting cycles

**Needs**:
- High-level overview with drill-down capability
- Region-by-region comparison
- Confidence in forecast accuracy
- Executive-friendly visualizations

**Success Scenario**: "During board meetings, I can demonstrate our pipeline health across all regions with live data, not week-old spreadsheets."

---

## User Stories & Use Cases

### Epic 1: Multi-Region Dashboard Access

#### User Story 1.1: Region Switching
**As a** Regional Sales Director
**I want to** switch between regions instantly
**So that** I can compare performance and identify best practices

**Acceptance Criteria**:
- Region selector visible in top-right corner
- Clicking a region updates all metrics within 2 seconds
- Selected region persists across page refreshes
- Visual indicator shows currently selected region

**Priority**: P0 (Must Have)

---

#### User Story 1.2: Pipeline Overview
**As a** Sales Manager
**I want to** see key pipeline metrics at a glance
**So that** I understand current performance without digging into details

**Acceptance Criteria**:
- Quarter Performance card shows Simple Total, Weighted Forecast, Target, Achievement Rate
- Pipeline by Stage breakdown visible immediately
- Forecast Categories (Commit, Best Case, Pipeline, Omitted) clearly displayed
- All amounts formatted consistently (e.g., $150K)

**Priority**: P0 (Must Have)

---

### Epic 2: Deal Details & Intelligence

#### User Story 2.1: Expandable Deal Cards
**As a** Sales Manager
**I want to** click on any deal to see detailed information
**So that** I can prepare for customer calls efficiently

**Acceptance Criteria**:
- Clicking deal card or table row opens slideout panel
- Slideout loads within 3 seconds
- "View Details" button reveals Line Items, Contacts, and Deal Properties
- Panel can be closed without losing position in list

**Priority**: P0 (Must Have)

---

#### User Story 2.2: Product Line Items
**As a** Sales Manager
**I want to** see product details for each deal
**So that** I can discuss pricing and products with prospects

**Acceptance Criteria**:
- Line Items show: Product Name, Description, Quantity, Unit Price, Total Amount
- Multiple line items displayed in organized cards
- If no line items exist, show friendly message
- Product information fetched on-demand (not pre-loaded)

**Priority**: P0 (Must Have)

---

#### User Story 2.3: Contact Information
**As a** Sales Manager
**I want to** view associated contacts for a deal
**So that** I can quickly reach out to decision-makers

**Acceptance Criteria**:
- Contacts show: Name, Email, Job Title, Phone, Company
- Multiple contacts displayed with clear separation
- Email addresses are clickable (mailto: links)
- Phone numbers are formatted correctly

**Priority**: P0 (Must Have)

---

### Epic 3: Target Management

#### User Story 3.1: Set Quarterly Targets
**As a** Regional Sales Director
**I want to** set quarterly targets for my team members
**So that** everyone knows their goals and can track progress

**Acceptance Criteria**:
- Can select Owner from dropdown (synced from HubSpot)
- Can select Quarter (Q1-Q4) and Year
- Can enter target amount in USD or JPY
- System converts and stores in USD automatically
- Can assign target to specific region

**Priority**: P0 (Must Have)

---

#### User Story 3.2: Multi-Currency Support
**As a** Regional Sales Director in Japan
**I want to** set targets in JPY
**So that** my team works with familiar currency units

**Acceptance Criteria**:
- Currency selector shows USD, JPY (and more)
- Target amount automatically converted to USD for storage
- Dashboard displays amounts in user's preferred currency (future)
- Exchange rates updated daily

**Priority**: P1 (Should Have)

---

### Epic 4: Forecasting & Analytics

#### User Story 4.1: Weighted Forecast Calculation
**As a** Regional Sales Director
**I want** automated weighted forecasts
**So that** I can predict revenue more accurately

**Acceptance Criteria**:
- Weighted forecast = Σ(Deal Amount × Stage Probability)
- Calculation updates in real-time as deals change
- Forecast breakdown by category (Commit, Best Case, Pipeline)
- Achievement rate calculated as (Weighted Forecast / Target) × 100%

**Priority**: P0 (Must Have)

---

#### User Story 4.2: Key Activities Alerts
**As a** Sales Manager
**I want to** see deals that need attention
**So that** I can take action on at-risk opportunities

**Acceptance Criteria**:
- "Stale Deals" shows deals not updated in 14+ days
- "Large Deals" shows deals > $100K closing this month
- "New Deals" shows deals created this quarter
- Each activity card shows count and total amount
- Clicking card shows filtered list of deals

**Priority**: P1 (Should Have)

---

### Epic 5: HubSpot Integration

#### User Story 5.1: Multi-Account Synchronization
**As a** System Administrator
**I want to** sync data from 5 different HubSpot accounts
**So that** each region's data is current and accurate

**Acceptance Criteria**:
- Each region uses separate HubSpot API key
- Sync can be triggered manually from Settings
- Sync status shows progress and completion
- Errors are logged and displayed clearly
- Data includes: Deals, Owners, Pipeline Stages

**Priority**: P0 (Must Have)

---

#### User Story 5.2: On-Demand Data Loading
**As a** User
**I want** the dashboard to load quickly
**So that** I don't waste time waiting

**Acceptance Criteria**:
- Initial dashboard load completes in < 3 seconds
- Line Items only fetched when user expands deal
- Contacts only fetched when user expands deal
- No unnecessary API calls
- Loading indicators show when data is being fetched

**Priority**: P0 (Must Have)

---

## Feature Requirements

### Must Have (P0) - Version 1.0 ✅

| Feature | Description | Status |
|---------|-------------|--------|
| **Multi-Region Dashboard** | Single dashboard with region selector | ✅ Implemented |
| **Quarter Performance** | Simple Total, Weighted Forecast, Target, Achievement | ✅ Implemented |
| **Pipeline by Stage** | Stage breakdown with counts and amounts | ✅ Implemented |
| **Forecast Categories** | Commit, Best Case, Pipeline, Omitted | ✅ Implemented |
| **Top 10 Deals** | Clickable table with key deal information | ✅ Implemented |
| **Expandable Deal Details** | Slideout with Line Items, Contacts, Properties | ✅ Implemented |
| **Target Management** | Set and track quarterly targets per owner | ✅ Implemented |
| **Multi-Currency** | USD and JPY with automatic conversion | ✅ Implemented |
| **HubSpot Sync** | Manual sync from HubSpot accounts | ✅ Implemented |
| **Pipeline Stage Config** | Set probability for each stage | ✅ Implemented |

### Should Have (P1) - Version 1.1

| Feature | Description | Priority |
|---------|-------------|----------|
| **Per-Region Pipeline Config** | Different stage probabilities per region | High |
| **Automated Sync Scheduling** | Hourly or daily automatic sync | Medium |
| **Enhanced Filters** | Filter deals by stage, owner, date range | High |
| **Export to Excel/PDF** | Download pipeline reports | Medium |
| **Mobile Optimization** | Responsive design for tablet/phone | Medium |

### Could Have (P2) - Version 1.2+

| Feature | Description | Priority |
|---------|-------------|----------|
| **User Authentication** | Role-based access control | Medium |
| **Email Notifications** | Alerts for stale deals, large deals | Low |
| **Deal Collaboration** | Comments and notes on deals | Low |
| **Historical Trends** | Quarter-over-quarter comparisons | Medium |
| **Custom Dashboards** | User-created dashboard views | Low |

### Won't Have (Out of Scope)

- Integration with non-HubSpot CRMs
- Built-in email sending
- Video call integration
- Contract management
- Invoice generation

---

## Success Metrics

### Primary KPIs

| Metric | Baseline | Target | Timeline |
|--------|----------|--------|----------|
| **User Adoption** | 0% | 90% | 1 month |
| **Daily Active Users** | 0 | 15 | 2 months |
| **Dashboard Load Time** | N/A | < 3 sec | Launch |
| **Forecast Accuracy** | 65% | 80% | 3 months |
| **Reporting Time Saved** | 4 hrs/week | 15 min/week | 1 month |

### Secondary KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Deal Detail Access** | 50+ views/day | Analytics |
| **Region Switches** | 20+ switches/day | Usage logs |
| **Target Completeness** | 100% targets set | Database |
| **Sync Success Rate** | > 99% | Error logs |
| **User Satisfaction** | > 4.0/5.0 | Quarterly survey |

### Leading Indicators

- Number of deals reviewed per day
- Frequency of dashboard access
- Time spent on deal detail pages
- Number of filter applications

---

## User Experience Flow

### Flow 1: Morning Check-in (Sales Manager)

```
1. User opens dashboard
   ↓
2. See Quarter Performance at a glance
   - "We're at 75% of target"
   ↓
3. Check "Stale Deals" section
   - "3 deals need attention"
   ↓
4. Click on stale deal card
   ↓
5. Review deal details
   - See products, contacts, history
   ↓
6. Take action (call customer, update HubSpot)
```

**Time to Insight**: < 2 minutes

---

### Flow 2: Deal Preparation (Sales Manager)

```
1. Customer calls about order
   ↓
2. Search for deal name in Top 10 table
   ↓
3. Click deal row to open slideout
   ↓
4. Click "View Details" to expand
   ↓
5. See Line Items (products & pricing)
   ↓
6. See Contacts (decision-maker info)
   ↓
7. Reference details during call
```

**Time to Access Deal Info**: < 10 seconds

---

### Flow 3: Weekly Review (Regional Sales Director)

```
1. Open dashboard
   ↓
2. Select "APAC" region
   ↓
3. Review Quarter Performance
   - Note achievement rate
   ↓
4. Check Pipeline by Stage
   - Identify bottlenecks
   ↓
5. Review Forecast Categories
   - Assess "Commit" deals
   ↓
6. Switch to "US" region
   ↓
7. Compare metrics
   ↓
8. Identify best practices
```

**Time to Complete Review**: < 5 minutes

---

### Flow 4: Target Setting (Regional Sales Director)

```
1. Navigate to Settings → Targets
   ↓
2. Select Quarter (Q1 2026)
   ↓
3. Select Owner from dropdown
   ↓
4. Enter target amount (JPY ¥15,000,000)
   ↓
5. Select currency (JPY)
   ↓
6. Select region (JP)
   ↓
7. Click "Save"
   ↓
8. System converts to USD and stores
   ↓
9. Confirmation message shown
```

**Time to Set Target**: < 1 minute

---

## Acceptance Criteria

### Dashboard Page

#### Given: User opens dashboard
**When**: Page loads
**Then**:
- ✅ Quarter Performance card displays within 2 seconds
- ✅ All metric cards show current data
- ✅ Region selector shows selected region
- ✅ Top 10 Deals table is populated
- ✅ No JavaScript errors in console

#### Given: User clicks region selector
**When**: User selects different region
**Then**:
- ✅ All metrics update to show selected region's data
- ✅ Transition completes within 2 seconds
- ✅ URL updates with region parameter (optional)
- ✅ Visual indicator shows active region

---

### Deal Details

#### Given: User clicks deal card
**When**: Slideout panel opens
**Then**:
- ✅ Basic deal information displays immediately
- ✅ "View Details" button is visible
- ✅ Close button (X) is present
- ✅ Panel slides in from right

#### Given: User clicks "View Details"
**When**: Line Items and Contacts load
**Then**:
- ✅ Loading indicator appears
- ✅ Line Items section displays within 3 seconds
- ✅ Contacts section displays within 3 seconds
- ✅ If no data, friendly message shown
- ✅ Data is color-coded (Line Items = blue, Contacts = green)

---

### Target Management

#### Given: User sets target in JPY
**When**: User submits form
**Then**:
- ✅ Amount converted to USD (divide by exchange rate)
- ✅ Both original currency and USD stored in database
- ✅ Target appears in dashboard calculations
- ✅ Success message confirms target saved
- ✅ Form resets for next entry

---

### HubSpot Sync

#### Given: User clicks "Sync Now"
**When**: Sync process starts
**Then**:
- ✅ Loading indicator appears
- ✅ Progress updates shown (if available)
- ✅ Deals synced from HubSpot API
- ✅ Owners synced from HubSpot API
- ✅ Pipeline Stages synced from HubSpot API
- ✅ Success/failure message displayed
- ✅ Sync timestamp updated

---

### Performance Requirements

| Scenario | Maximum Time | P0/P1 |
|----------|--------------|-------|
| Dashboard initial load | 3 seconds | P0 |
| Region switch | 2 seconds | P0 |
| Deal slideout open | 1 second | P0 |
| Deal details expand | 3 seconds | P0 |
| Target save | 2 seconds | P1 |
| HubSpot sync (100 deals) | 30 seconds | P1 |

---

## Out of Scope

### Explicitly Not Included in V1.0

1. **User Authentication**
   - No login system
   - No role-based permissions
   - Assumption: Internal tool on secure network

2. **Real-Time Sync**
   - No WebSocket updates
   - Manual sync only
   - Future: Scheduled sync

3. **Email Integration**
   - No email sending from dashboard
   - No email notifications
   - Future: Alert system

4. **Advanced Analytics**
   - No predictive forecasting
   - No AI/ML insights
   - No trend analysis

5. **Mobile App**
   - Web-only (responsive design future)
   - No native iOS/Android apps

6. **Third-Party Integrations**
   - HubSpot only
   - No Salesforce, Pipedrive, etc.

7. **Custom Reports**
   - No report builder
   - No saved queries
   - Future: Export functionality

---

## Future Roadmap

### Version 1.1 (Q2 2026)
**Focus**: Enhanced Configuration & UX

- Per-region Pipeline Stage configuration
- Advanced filtering (stage, owner, date range)
- Mobile-responsive design
- Report export (Excel, PDF)
- Scheduled sync automation

**Business Value**: Improve user efficiency by 20%

---

### Version 1.2 (Q3 2026)
**Focus**: Collaboration & Security

- User authentication (SSO)
- Role-based access control
- Deal comments and notes
- Activity feed
- Audit logging

**Business Value**: Enable broader team usage, ensure compliance

---

### Version 2.0 (Q4 2026)
**Focus**: Intelligence & Automation

- Email/Slack notifications
- Predictive forecasting with ML
- Historical trend analysis
- Custom dashboard builder
- API for third-party integrations

**Business Value**: Proactive insights, reduce manual work by 40%

---

## Appendix

### Related Documents

- [FEATURES.md](./FEATURES.md) - Complete technical documentation
- [README.md](./README.md) - Setup and installation guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Deployment steps
- [HUBSPOT_SETUP.md](./HUBSPOT_SETUP.md) - HubSpot configuration

### Stakeholder Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Product Owner | Terrel Yeh | 2026-02-05 | ✅ Approved |
| Engineering Lead | [Name] | [Date] | - |
| Sales Leadership | [Name] | [Date] | - |

### Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-05 | Initial PRD | Terrel Yeh |

---

**Document Status**: ✅ Complete
**Implementation Status**: ✅ V1.0 Implemented
**Next Review**: Q2 2026
