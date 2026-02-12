# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-02-12

### Added
- **Pipeline Scope**: Each region now supports multiple HubSpot pipelines as independent sub-dimensions
  - Deals, targets, stages, and forecasts are fully isolated per pipeline
  - Pipeline selector in dashboard (dropdown for 2+ pipelines, static label for 1)
  - Pipeline selector in target management
  - New `Pipeline` database model with `isDefault`, `isActive`, and `displayOrder` fields

- **New API Endpoints**:
  - `GET /api/pipelines` - List active pipelines for a region
  - `GET /api/owner-targets` - Get owner-specific target data with quarterly breakdown
  - `POST /api/migrate-pipeline` - One-time migration for legacy `pipelineId = null` data

- **SWR Data Fetching**: Replaced raw `fetch` + `useEffect` with SWR (stale-while-revalidate) for:
  - Dashboard data (`/api/dashboard`)
  - Owner target data (`/api/owner-targets`)
  - Target management page (pipelines, targets, and owners data)
  - localStorage cache persistence via custom SWR cache provider

- **Authentication & Authorization**:
  - NextAuth.js v5 with JWT strategy (30-day sessions) and Credentials provider
  - Three roles: ADMIN (full access, all regions), MANAGER (edit targets, assigned regions), VIEWER (read-only, assigned regions)
  - Region access control via `UserRegionAccess` junction table
  - Granular permission system (VIEW_DASHBOARD, EDIT_TARGETS, TRIGGER_SYNC, MANAGE_USERS, etc.)
  - Route protection middleware — unauthenticated users redirected to `/login`
  - `/admin` routes restricted to ADMIN role

- **User Management**:
  - Admin UI at `/admin/users` for creating, editing, and deactivating users
  - Role assignment and region access checkbox configuration
  - Password hashing with bcryptjs
  - Last login tracking

- **New API Endpoints** (Auth):
  - `GET/POST /api/auth/*` — NextAuth.js authentication endpoints
  - `GET/POST/PUT/DELETE /api/admin/users` — User CRUD (ADMIN only)

### Changed
- **Database Schema**:
  - Added `Pipeline` model with `@@unique([regionId, hubspotId])`
  - Added `User` model with `Role` enum (ADMIN, MANAGER, VIEWER), password hash, and `isActive` flag
  - Added `UserRegionAccess` junction table for many-to-many user-region access control
  - Added `Account`, `Session`, `VerificationToken` models for NextAuth.js
  - `Deal` model: added `pipelineId` field linking to Pipeline
  - `Target` model: added `pipelineId` field, changed unique constraint to `@@unique([regionId, pipelineId, ownerName, year, quarter])`
  - `Region` model: added `userAccess` relation to `UserRegionAccess`

- **HubSpot Sync**: Now fetches and upserts pipelines from HubSpot, associates deals with their pipeline records, and resolves stages per pipeline to avoid cross-pipeline collisions

- **Target Management**: Converted from raw `fetch` + `useEffect` to SWR hooks, reducing loading spinners on region/pipeline switching

- **Dashboard**: Pipeline filter applied to all queries (dashboard API, owner-targets API)

### Fixed
- **Pipeline selector not showing**: Changed condition from `> 1` to `>= 1` to show pipeline info for all regions
- **Flash of "Error Loading Dashboard"**: Added `!pipelinesLoaded` to loading state to prevent false error screen during navigation
- **Incorrect target amount on pipeline switch**: Fixed `owner-targets` API missing `pipelineFilter` in `owner=All` query, which caused wrong pipeline's target to be displayed
- **Stale data on pipeline switch**: Removed `keepPreviousData: true` from owner-targets SWR to prevent cross-pipeline data leakage

### Removed
- Temporary debug endpoint (`/api/debug-targets`)
- Unnecessary cache-clearing workarounds (globalMutate, localStorage clearing on pipeline switch)

---

## [1.0.0] - 2026-02-05

### Added
- **Open Deal Amount**: New metric in Quarter Performance showing total value of active deals (excluding Closed Won/Lost)
  - Displays formatted amount (e.g., $1.2M)
  - Shows count of active deals
  - New cyan-themed card between Pipeline Value and Forecast
  
- **New Deal Amount**: Enhanced New Deals activity metric
  - Now shows both count and total amount
  - Format: "15 | $800K" (count | amount)
  - Helps track business growth and new opportunity value

- **PRODUCT_SPEC.md**: Complete Product Requirements Document
  - Executive summary with business objectives
  - 3 detailed user personas
  - 12 user stories with acceptance criteria
  - Feature requirements (P0/P1/P2)
  - Success metrics and KPIs
  - User experience flows
  - Future roadmap

### Changed
- **Documentation Consolidation**: Streamlined from 11 to 5 essential files
  - Updated README.md with single-layer architecture
  - Rewrote FEATURES.md (merged multi-currency content)
  - Removed 7 outdated documentation files
  
- **Architecture Documentation**: Updated to reflect single-layer design
  - Dashboard (/) with region selector instead of two-tier navigation
  - Multi-account architecture clearly documented (5 regions = 5 HubSpot accounts)

### Removed
- CURRENCY_SUPPORT.md (merged into FEATURES.md)
- PROJECT_STRUCTURE.md (consolidated into README.md)
- DEPLOYMENT_READY.md (one-time report)
- HUBSPOT_INTEGRATION.txt (redundant)
- TESTING_GUIDE.md (outdated)
- UI_OPTIMIZATION_SUMMARY.md (development artifact)
- UI_UX_OPTIMIZATION.md (development artifact)

### Technical Changes
- **Backend API** (`src/app/api/dashboard/route.ts`):
  - Added `openDealAmount` calculation
  - Added `openDealCount` to summary response
  - Added `amount` and `amountFormatted` to `activityKpis.newDeals`
  
- **Frontend** (`src/app/dashboard/page.tsx`):
  - Updated TypeScript interfaces for new data fields
  - Added Open Deals card in Quarter Performance section
  - Enhanced New Deals card to show amount alongside count
  - Imported TrendingUp icon for Open Deals card

### Documentation
Current documentation structure:
- README.md (10KB) - Quick start guide
- FEATURES.md (22KB) - Complete technical documentation
- PRODUCT_SPEC.md (18KB) - Product requirements document
- DEPLOYMENT_CHECKLIST.md (5KB) - Deployment guide
- HUBSPOT_SETUP.md (6KB) - HubSpot configuration
- PIPELINE_STAGES.md (5KB) - Pipeline stage configuration

---

## Legend
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements
