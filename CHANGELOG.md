# Changelog

All notable changes to this project will be documented in this file.

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
