# HubSpot Dashboard - Complete Feature Documentation

**Version**: 1.0.0
**Last Updated**: 2026-02-05
**Maintainer**: Terrel Yeh

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Features](#core-features)
4. [Technical Stack](#technical-stack)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [HubSpot Integration](#hubspot-integration)
8. [Multi-Currency Support](#multi-currency-support)
9. [Deployment](#deployment)

---

## Overview

**HubSpot Dashboard** is a comprehensive sales tracking and forecasting system designed for multi-region teams. It integrates with multiple HubSpot CRM accounts, providing real-time visibility into deal pipelines, target management, and weighted forecasting across different regions.

### Key Capabilities

- 🌍 **Multi-Region, Multi-Account**: Each region (US, APAC, JP, IN, EU) uses its own HubSpot account
- 📊 **Rich Deal Details**: Line Items (products), Contacts, and custom properties
- 🎯 **Target Management**: Owner-level quarterly targets with achievement tracking
- 📈 **Weighted Forecasting**: Intelligent forecast based on stage probabilities
- 💱 **Multi-Currency**: Automatic conversion between USD, JPY, and more
- ⚡ **On-Demand Loading**: Performance-optimized data fetching
- 🎨 **Interactive UI**: Slideout panels, expandable cards, one-click navigation

---

## Architecture

### Single-Layer Design with Region Switching

The dashboard uses a **streamlined single-layer architecture** instead of traditional two-tier designs:

```
┌─────────────────────────────────────────┐
│         Dashboard (/)                    │
│  ┌─────────────────────────────────┐   │
│  │  Region Selector (Top-right)    │   │
│  │  ┌─────┬──────┬─────┬─────┬────┐│   │
│  │  │ US  │ APAC │ JP  │ IN  │ EU ││   │
│  │  └─────┴──────┴─────┴─────┴────┘│   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Quarter Performance]                  │
│  [Pipeline by Stage]                    │
│  [Forecast Categories]                  │
│  [Key Activities]                       │
│  [Top 10 Deals - Clickable]            │
└─────────────────────────────────────────┘
```

### Multi-Account Architecture

**Each region connects to its own HubSpot account:**

| Region | HubSpot Account | API Key | Database Isolation |
|--------|-----------------|---------|-------------------|
| US | Account 1 | `HUBSPOT_API_KEY_US` | `regionId = 'US'` |
| APAC | Account 2 | `HUBSPOT_API_KEY_APAC` | `regionId = 'APAC'` |
| JP | Account 3 | `HUBSPOT_API_KEY_JP` | `regionId = 'JP'` |
| IN | Account 4 | `HUBSPOT_API_KEY_IN` | `regionId = 'IN'` |
| EU | Account 5 | `HUBSPOT_API_KEY_EU` | `regionId = 'EU'` |

**Why this approach?**
- ✅ Each region has unique Pipeline Stage definitions
- ✅ Deal properties vary by region
- ✅ Independent data management per account
- ✅ No extra navigation layers
- ✅ Direct access to relevant information

---

## Core Features

### 1. Dashboard with Region Switching

**Route**: `/dashboard`

The main dashboard displays comprehensive metrics for the selected region. Users can switch regions instantly via the top-right selector.

#### Displayed Metrics

##### A. Performance Overview (8 Interactive Cards)

**First Row:**
1. **Pipeline Value** - Total pipeline opportunity value (clickable)
2. **New Deal Amount** - Value of deals created this quarter (clickable)
3. **Open Deals** - Active deals not yet closed (clickable)
4. **Commit Revenue** - High-confidence deals (clickable)

**Second Row:**
5. **Closed Won Amount** - Successfully closed deals (clickable)
6. **Weighted Forecast** - Risk-adjusted forecast
7. **Target** - Quarterly target
8. **Achievement** - Target achievement percentage

**Interactive Features:**
- ✨ All cards except Weighted Forecast, Target, and Achievement are clickable
- 🔍 Click any card to view detailed deal list in slideout panel
- 📊 Real-time metrics updated from HubSpot data
- 💱 Multi-currency support with automatic conversion

##### B. Pipeline by Stage
Shows distribution across pipeline stages:
- Stage name
- Deal count
- Simple total
- Weighted total
- Average probability

##### C. Forecast Categories (Enhanced Dropdown)

**Available Categories with Tooltips:**
1. **Not forecasted** (不預測) - Early stage or lost deals
   - Gray color | Cases: Too early, Closed Lost, future deals
2. **Pipeline** (低信心度) - Low confidence opportunities
   - Blue color | Cases: Initial contact, early qualification
3. **Best case** (中等信心度) - Moderate confidence
   - Cyan color | Cases: Good progress, some risks remain
4. **Commit** (高信心度) - High confidence, almost certain
   - Green color | Cases: Verbal agreement, final approval pending
5. **Closed won** (100%) - Deal successfully closed
   - Dark green | Cases: Contract signed, payment received

**UI Features:**
- 🎨 Color-coded badges for each category
- ℹ️ Hover info icon to see detailed descriptions
- 📊 Confidence level indicators
- ✅ Multi-select checkbox filtering

##### D. Activity Metrics (Trend Analysis)

**Clickable Activity Cards:**
1. **New Deals** - Deals created this quarter
   - Shows count with trend vs last quarter
   - Click to view all new deals
2. **Closed Won** - Successfully closed deals
   - Shows count with trend percentage
   - Click to view all won deals
3. **Closed Lost** - Lost opportunities
   - Shows count with trend indicator
   - Click to view all lost deals
4. **Win Rate** - Success percentage
   - Calculated from closed deals
   - Shows improvement trend

**Note:** All amounts moved to Performance Overview. Activity Metrics focus on counts and trends for quick insights.

##### E. Top 10 Deals
Sortable table showing:
- Deal name
- Amount
- Stage
- Owner
- Close date
- **Interactive**: Click any row to open detailed slideout

---

### 2. Deal Details with Expandable Information

**Click any deal card or table row** to reveal comprehensive deal information in a slideout panel.

#### Main Deal Information Grid
```
┌─────────────────────────────────────────┐
│ [1] Deal Name              $34K         │
│ Owner • Pipeline                        │
├─────────────────────────────────────────┤
│ Stage: Quote Sent    | Probability: 60% │
│ Close Date: 9/30/24  | Create: 9/11/24  │
│ Last Updated: 188d   | Distributor: MRL │
└─────────────────────────────────────────┘
```

**Information Displayed:**
- Deal name, amount, owner, forecast category badge
- Stage and probability with visual indicators
- Close date and creation date
- Last update with status indicator (green/yellow/red)
- **Distributor** (if set) - synced from HubSpot custom field

#### Line Items (Product Details)
```
┌─────────────────────────────────────────┐
│ Line Items (3 products) [Blue]          │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ ECW260                              │ │
│ │ Description: Product description    │ │
│ │ Qty: 5 × $179.50 = $897.50        │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ ECW536                              │ │
│ │ Qty: 1 × $299.50 = $299.50        │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ ECS1008P                            │ │
│ │ Qty: 10 × $74.99 = $749.90        │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### Contacts (Associated People)
```
┌─────────────────────────────────────────┐
│ Contacts (3 contacts) [Green]           │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 👤 John Smith                       │ │
│ │ 📧 john@example.com                │ │
│ │ 💼 Sales Manager                   │ │
│ │ 📞 +1 234 567 8900                 │ │
│ │ 🏢 ABC Company                     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Implementation**: Data is fetched on-demand when user clicks "View Details" to optimize performance.

---

### 3. Target Management

**Route**: `/settings/targets`

Set and manage quarterly targets for each sales owner by region.

#### Features
- **Owner Selection**: Choose from synced HubSpot owners
- **Quarter Selection**: Q1-Q4 for any year
- **Currency Selection**: USD, JPY (auto-converted to USD for storage)
- **Region Assignment**: Link target to specific region
- **Bulk Operations**: Set multiple targets at once

#### Data Flow
```
User Input (JPY ¥15,000,000)
    ↓
Currency Conversion (150 JPY = 1 USD)
    ↓
Stored as USD ($100,000)
    ↓
Display in any currency
```

---

### 4. Pipeline Stages Configuration

**Route**: `/pipeline-stages`

Configure the probability value for each pipeline stage, used in weighted forecast calculations.

#### Configuration
- **Stage Name**: Synced from HubSpot
- **Probability**: 0-100% (user-defined)
- **Stage Order**: Determines display sequence

#### Example Configuration
```
┌──────────────────────┬──────────────┐
│ Stage                │ Probability  │
├──────────────────────┼──────────────┤
│ Qualification        │ 10%          │
│ Demo Scheduled       │ 20%          │
│ Proposal Sent        │ 40%          │
│ Negotiation          │ 60%          │
│ Verbal Commit        │ 80%          │
│ Closed Won           │ 100%         │
│ Closed Lost          │ 0%           │
└──────────────────────┴──────────────┘
```

**Note**: Future enhancement will support per-region stage configuration.

---

### 5. HubSpot Synchronization

**Route**: `/settings/hubspot`

#### Sync Types

##### Full Sync
- Syncs all deals, owners, and pipeline stages
- Use for initial setup or data refresh
- Longer duration depending on data volume

##### Incremental Sync
- Only updates changed records
- Faster performance
- Recommended for routine updates

##### On-Demand Fetch
- **Line Items**: Fetched when deal is expanded
- **Contacts**: Fetched when deal is expanded
- Reduces initial load time

#### What Gets Synced

**Deals**:
- Deal name, amount, currency
- Stage, probability, forecast category
- Close date, created date
- Owner information
- Custom properties (distributor, priority, description)

**Owners**:
- Name and email
- Used for target assignment

**Pipeline Stages**:
- Stage names and order
- Used for probability configuration

**Not Synced Initially** (fetched on-demand):
- Line Items
- Contacts
- Companies

---

## Technical Stack

### Frontend
- **Framework**: Next.js 15.5.11 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19
- **Styling**: Tailwind CSS 3.4.1
- **State Management**: React hooks (useState, useEffect)

### Backend
- **API**: Next.js API Routes (serverless functions)
- **Database ORM**: Prisma 6.2.0
- **Database**: SQLite (dev) / PostgreSQL (production)
- **Runtime**: Node.js 18+

### Integrations
- **CRM**: HubSpot Private App API
- **Currency**: exchangerate-api.com (optional)

---

## Database Schema

### Core Models

#### Region
```prisma
model Region {
  id       String   @id @default(cuid())
  code     String   @unique  // NA, EU, APAC, JP, IN
  name     String
  flag     String?  // Emoji flag
  deals    Deal[]
  targets  Target[]
}
```

#### Deal
```prisma
model Deal {
  id                String   @id @default(cuid())
  hubspotId         String   @unique
  name              String
  amountUsd         Float    // Stored in USD
  currency          String   @default("USD")
  stage             String
  stageProbability  Float
  forecastCategory  String?
  closeDate         DateTime
  createdAt         DateTime
  lastModifiedAt    DateTime
  ownerEmail        String?
  ownerName         String?
  priority          String?  // high, medium, low
  description       String?
  distributor       String?
  numContacts       Int      @default(0)
  hubspotUrl        String?
  regionId          String
  region            Region   @relation(fields: [regionId], references: [id])
  lineItems         LineItem[]
  contacts          DealContact[]
}
```

#### LineItem
```prisma
model LineItem {
  id                String   @id @default(cuid())
  dealId            String
  hubspotLineItemId String
  name              String
  description       String?
  quantity          Float
  price             Float
  amount            Float
  productId         String?
  deal              Deal     @relation(fields: [dealId], references: [id], onDelete: Cascade)

  @@unique([dealId, hubspotLineItemId])
}
```

#### DealContact
```prisma
model DealContact {
  id               String   @id @default(cuid())
  dealId           String
  hubspotContactId String
  firstName        String?
  lastName         String?
  email            String?
  jobTitle         String?
  phone            String?
  company          String?
  deal             Deal     @relation(fields: [dealId], references: [id], onDelete: Cascade)

  @@unique([dealId, hubspotContactId])
}
```

#### Target
```prisma
model Target {
  id         String   @id @default(cuid())
  ownerEmail String
  ownerName  String?
  quarter    String   // "Q1 2024", "Q2 2024"
  targetUsd  Float    // Stored in USD
  currency   String   @default("USD")
  regionId   String
  region     Region   @relation(fields: [regionId], references: [id])
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([ownerEmail, quarter, regionId])
}
```

#### PipelineStage
```prisma
model PipelineStage {
  id          String   @id @default(cuid())
  stageName   String   @unique
  probability Float    // 0-100
  stageOrder  Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## API Endpoints

### Dashboard API

#### `GET /api/dashboard`
**Query Parameters**:
- `region`: Region code (optional, defaults to first region)

**Response**:
```json
{
  "quarterPerformance": {
    "simple": 1500000,
    "weighted": 750000,
    "target": 1000000,
    "achievementRate": 75,
    "currency": "USD"
  },
  "pipelineByStage": [...],
  "forecastByCategory": {...},
  "keyActivities": {...},
  "topDeals": [...],
  "detailedDeals": {...},
  "region": { "code": "US", "name": "United States" }
}
```

### Deal Details API

#### `GET /api/deals/[id]`
**Response**:
```json
{
  "success": true,
  "deal": {
    "id": "...",
    "name": "Deal Name",
    "amount": 33989.9,
    "currency": "USD",
    "closeDate": "2026-02-15T00:00:00.000Z",
    "distributor": "MRL",
    "priority": "high",
    "lineItems": [
      {
        "id": "...",
        "name": "ECW260",
        "quantity": 5,
        "price": 179.50,
        "amount": 897.50
      }
    ],
    "contacts": [
      {
        "id": "...",
        "fullName": "John Smith",
        "email": "john@example.com",
        "jobTitle": "Sales Manager"
      }
    ]
  }
}
```

### HubSpot Integration APIs

#### `POST /api/hubspot/sync`
Trigger data synchronization from HubSpot.

**Body**:
```json
{
  "syncDeals": true,
  "syncOwners": true,
  "syncStages": true
}
```

#### `GET /api/hubspot/test`
Test HubSpot API connection.

### Target Management APIs

#### `GET /api/targets`
List all targets.

#### `POST /api/targets`
Create or update a target.

**Body**:
```json
{
  "ownerEmail": "john@example.com",
  "ownerName": "John Smith",
  "quarter": "Q1 2026",
  "targetAmount": 100000,
  "currency": "USD",
  "regionId": "us-region-id"
}
```

#### `POST /api/targets/bulk`
Batch create/update multiple targets.

### Other APIs

#### `GET /api/regions`
List all available regions.

#### `GET /api/pipeline-stages`
Get pipeline stage configuration.

#### `POST /api/pipeline-stages`
Update pipeline stage probabilities.

---

## HubSpot Integration

### Required API Scopes

```
crm.objects.deals.read
crm.objects.deals.write
crm.objects.owners.read
crm.objects.line_items.read
crm.objects.contacts.read
crm.objects.companies.read
crm.schemas.deals.read
crm.schemas.line_items.read
crm.schemas.contacts.read
crm.schemas.companies.read
```

### HubSpot Client Implementation

**File**: `src/lib/hubspot/client.ts`

**Key Methods**:
```typescript
class HubSpotClient {
  // Fetch all deals
  async fetchDeals(): Promise<HubSpotDeal[]>

  // Batch fetch line items
  async fetchLineItems(ids: string[]): Promise<HubSpotLineItem[]>

  // Batch fetch contacts
  async fetchContacts(ids: string[]): Promise<HubSpotContact[]>

  // Fetch deal with all associations
  async fetchDealWithAssociations(dealId: string): Promise<{
    deal: HubSpotDeal
    lineItems: HubSpotLineItem[]
    contacts: HubSpotContact[]
  }>

  // Fetch owners
  async fetchOwners(): Promise<HubSpotOwner[]>

  // Fetch pipeline stages
  async fetchPipelineStages(): Promise<HubSpotPipelineStage[]>
}
```

### Multi-Account Support (Future)

**Environment Variables**:
```bash
HUBSPOT_API_KEY_US=token-for-us-account
HUBSPOT_API_KEY_APAC=token-for-apac-account
HUBSPOT_API_KEY_JP=token-for-jp-account
HUBSPOT_API_KEY_IN=token-for-in-account
HUBSPOT_API_KEY_EU=token-for-eu-account
```

**Client Factory**:
```typescript
function createHubSpotClient(region: string): HubSpotClient {
  const apiKey = getApiKeyForRegion(region);
  return new HubSpotClient(apiKey);
}
```

---

## Multi-Currency Support

### Overview

The system supports multiple currencies with automatic conversion. All amounts are stored in USD for consistent calculations and reporting.

### Supported Currencies

- **USD** (US Dollar) - Base currency
- **JPY** (Japanese Yen)
- **EUR** (Euro)
- **GBP** (British Pound)
- **CNY** (Chinese Yuan)
- **KRW** (Korean Won)
- **SGD** (Singapore Dollar)
- **HKD** (Hong Kong Dollar)
- **AUD** (Australian Dollar)
- **CAD** (Canadian Dollar)
- And 150+ more via exchangerate-api.com

### How It Works

#### 1. Data Storage Strategy
```typescript
// All amounts stored in USD
{
  amount: 5000000,        // Original amount
  currency: "JPY",        // Original currency
  amountUsd: 33333.33,    // Converted to USD
  exchangeRate: 150       // Rate used: 150 JPY = 1 USD
}
```

#### 2. Currency Conversion Flow
```
HubSpot Deal (¥5,000,000 JPY)
        ↓
Fetch Exchange Rate (1 USD = 150 JPY)
        ↓
Convert to USD ($33,333.33)
        ↓
Store in Database (amountUsd)
        ↓
Display in Any Currency
```

#### 3. Exchange Rate Management

**File**: `src/lib/currency/converter.ts`

```typescript
// Convert currency
const result = await convertCurrency(5000000, "JPY", "USD");
// Returns: { amount: 33333.33, rate: 150 }

// Supported rates
const EXCHANGE_RATES = {
  USD: 1,
  JPY: 150,
  EUR: 0.92,
  GBP: 0.79,
  // ... more currencies
};
```

#### 4. Rate Caching

- Exchange rates cached for 24 hours
- Reduces API calls
- Fallback to built-in rates if API fails

### Target Management with Currency

Users can set targets in their preferred currency:

```typescript
// User sets target: ¥15,000,000 JPY
const targetAmount = 15000000;
const currency = "JPY";

// System converts and stores
const targetUsd = targetAmount / exchangeRates["JPY"];
// Stored: $100,000 USD

// Can display in any currency later
const displayInJPY = targetUsd * exchangeRates["JPY"];
// Display: ¥15,000,000 JPY
```

### Currency Conversion Examples

#### Japanese Yen (JPY)
```
Original: ¥5,000,000 JPY
Rate: 1 JPY = $0.00667 USD (150 JPY = 1 USD)
Converted: $33,333.33 USD
```

#### Euro (EUR)
```
Original: €10,000 EUR
Rate: 1 EUR ≈ $1.09 USD
Converted: $10,900 USD
```

#### British Pound (GBP)
```
Original: £8,000 GBP
Rate: 1 GBP ≈ $1.27 USD
Converted: $10,160 USD
```

### Future Enhancements

- 🔜 Real-time exchange rate updates
- 🔜 Historical rate tracking
- 🔜 Manual rate overrides
- 🔜 Multi-base currency (EUR, JPY)
- 🔜 Currency risk analysis

---

## Deployment

### Environment Variables

```bash
# HubSpot API Keys
HUBSPOT_API_KEY=your-primary-api-key
HUBSPOT_API_KEY_US=your-us-api-key
HUBSPOT_API_KEY_APAC=your-apac-api-key
HUBSPOT_API_KEY_JP=your-jp-api-key
HUBSPOT_API_KEY_IN=your-in-api-key
HUBSPOT_API_KEY_EU=your-eu-api-key

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Optional
EXCHANGE_RATE_API_KEY=your-exchange-rate-api-key
```

### Build & Deploy

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build application
npm run build

# Start server
npm start
```

### Recommended Platforms

- **Vercel**: Seamless Next.js deployment
- **Railway**: Easy PostgreSQL integration
- **Render**: Full-stack support

For detailed deployment instructions, see [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md).

---

## Performance Optimization

### On-Demand Data Loading

**Line Items & Contacts** are not fetched during initial sync:
- Only loaded when user expands deal details
- Reduces initial data volume by ~70%
- Faster dashboard load times

### Database Indexing

Recommended indexes:
```prisma
@@index([regionId])
@@index([ownerEmail])
@@index([closeDate])
@@index([hubspotId])
```

### Caching Strategy

- Exchange rates: 24-hour cache
- Dashboard data: Consider Redis for production
- HubSpot API responses: Rate-limited caching

---

## Security

✅ **API Keys**: Server-side only, never exposed to frontend
✅ **Environment Variables**: Excluded from git via `.gitignore`
✅ **Database Queries**: Parameterized with Prisma
✅ **Input Validation**: Server-side validation on all endpoints
✅ **HTTPS**: Enforce in production

---

## Future Roadmap

### Version 1.1
- 🔜 Per-region Pipeline Stage configuration
- 🔜 Real-time data updates (WebSocket)
- 🔜 Enhanced mobile UI

### Version 1.2
- 🔜 User authentication & authorization
- 🔜 Role-based access control
- 🔜 Audit logging

### Version 2.0
- 🔜 Email/Slack notifications
- 🔜 Report export (PDF/Excel)
- 🔜 Advanced analytics & predictions
- 🔜 Integration with other CRMs

---

**For complete setup instructions, see [README.md](./README.md)**

**For deployment checklist, see [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)**

**For HubSpot setup, see [HUBSPOT_SETUP.md](./HUBSPOT_SETUP.md)**
