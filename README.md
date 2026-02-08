# HubSpot Multi-Region Dashboard

A powerful web dashboard that integrates multiple HubSpot accounts across different regions, providing comprehensive pipeline visibility, target management, and forecast calculations.

## 🌟 Key Features

- 🌍 **Multi-Region Support**: Seamlessly switch between regions (US, APAC, IN, JP, EU)
- 🔑 **Multi-Account Architecture**: Each region connects to its own HubSpot account with separate API keys
- 📊 **Deal Details**: Expandable deal cards showing Line Items, Contacts, and custom properties
- 🎯 **Target Management**: Set and track quarterly targets by owner and region
- 📈 **Weighted Forecast**: Intelligent forecasting based on pipeline stage probabilities
- 💱 **Multi-Currency**: Support for USD, JPY with automatic conversion
- ⚡ **Real-time Sync**: Live data synchronization from HubSpot CRM
- 🎨 **Interactive UI**: Slideout panels, expandable sections, and intuitive navigation

---

## 🏗️ Architecture

### Single-Layer Dashboard Design

Unlike traditional two-tier dashboards, this system uses a **single-layer architecture** with regional switching:

```
Dashboard (/)
  └─ Region Selector (Top-right corner)
      ├─ US → HubSpot Account 1 (API Key 1)
      ├─ APAC → HubSpot Account 2 (API Key 2)
      ├─ JP → HubSpot Account 3 (API Key 3)
      ├─ IN → HubSpot Account 4 (API Key 4)
      └─ EU → HubSpot Account 5 (API Key 5)
```

**Why this approach?**
- Each region has different Pipeline Stage definitions
- Deal properties vary by region
- Independent HubSpot accounts per region
- Direct access to relevant data without extra navigation

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5+ (App Router), React 19, TypeScript 5
- **Backend**: Next.js API Routes
- **Database**: SQLite (dev) / PostgreSQL (production recommended)
- **ORM**: Prisma 6.2.0
- **Styling**: Tailwind CSS 3.4.1
- **Deployment**: Vercel (recommended) or any Node.js hosting

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- HubSpot Private App API Keys (one per region)

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/terrelyeh/hubspot-dashboard.git
cd hubspot-dashboard
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your HubSpot API keys:
```bash
# Multi-Account Configuration
# Each region uses its own HubSpot account
# Naming convention: HUBSPOT_API_KEY_{REGION_CODE}

HUBSPOT_API_KEY_JP=pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
HUBSPOT_API_KEY_APAC=pat-na1-yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
# Add more regions as needed:
# HUBSPOT_API_KEY_US=your-us-api-key
# HUBSPOT_API_KEY_EU=your-eu-api-key
# HUBSPOT_API_KEY_LATAM=your-latam-api-key

# Enable real HubSpot sync (set to true for production)
ENABLE_REAL_HUBSPOT_SYNC=true

# Database
DATABASE_URL="file:./dev.db"
```

4. **Set up the database**:
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed with sample data (optional)
npx prisma db seed
```

5. **Start the development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (localhost:3000) |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open Prisma Studio (database GUI) |
| `npx prisma db seed` | Seed database with sample data |

---

## 📂 Project Structure

```
hubspot-dashboard/
├── src/
│   ├── app/
│   │   ├── api/               # API endpoints
│   │   │   ├── dashboard/     # Dashboard data API
│   │   │   ├── deals/[id]/    # Deal details API
│   │   │   ├── hubspot/       # HubSpot sync & test
│   │   │   ├── pipeline-stages/ # Stage configuration
│   │   │   ├── regions/       # Region list
│   │   │   └── targets/       # Target management
│   │   ├── dashboard/
│   │   │   └── page.tsx       # Main dashboard with region selector
│   │   ├── pipeline-stages/   # Pipeline stage config page
│   │   ├── settings/          # Settings pages
│   │   └── layout.tsx         # Global layout
│   ├── components/            # React components
│   ├── lib/                   # Business logic & utilities
│   │   ├── hubspot/          # HubSpot API client & sync
│   │   ├── currency/         # Currency conversion
│   │   └── db.ts             # Prisma client
│   └── types/                # TypeScript type definitions
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── migrations/           # Migration history
│   └── seed.ts               # Seed script
├── regions/                  # Regional configuration files
│   ├── US.md
│   ├── APAC.md
│   ├── JP.md
│   ├── IN.md
│   └── EU.md
└── [documentation files]
```

---

## 🔧 Configuration

### HubSpot API Setup

Each region requires a HubSpot Private App with the following scopes:

**Required Scopes**:
- `crm.objects.deals.read`
- `crm.objects.deals.write`
- `crm.objects.owners.read`
- `crm.objects.line_items.read`
- `crm.objects.contacts.read`
- `crm.objects.companies.read`
- `crm.schemas.deals.read`
- `crm.schemas.line_items.read`
- `crm.schemas.contacts.read`
- `crm.schemas.companies.read`

See [HUBSPOT_SETUP.md](./HUBSPOT_SETUP.md) for detailed setup instructions.

### Region Configuration

Each region has a configuration file in the `regions/` directory containing:
- Region metadata (code, name, currency, timezone)
- HubSpot account details
- Team structure
- Default pipeline stage probabilities

---

## 📊 Key Features Explained

### 1. Dashboard with Region Switching

The main dashboard (`/dashboard`) displays comprehensive metrics for the selected region:

**Metrics Displayed**:
- Quarter Performance (Simple Total, Weighted Forecast, Target, Achievement Rate)
- Pipeline by Stage (breakdown with counts and amounts)
- Forecast Categories (Commit, Best Case, Pipeline, Omitted)
- Key Activities (New Deals, Closed Won/Lost, Stale Deals, Large Deals)
- Top 10 Deals (clickable table rows)

**Region Selector**: Located in the top-right corner, allows instant switching between regions. Each switch loads data from the corresponding HubSpot account.

### 2. Deal Details with Line Items & Contacts

Click any deal card or table row to view:

**Deal Information**:
- Expected Close Date
- Distributor (if any)
- Priority level
- Description
- Number of contacts

**Line Items** (Product Details):
- Product name and description
- Quantity
- Unit price
- Total amount

**Contacts**:
- Full name and email
- Job title
- Phone number
- Company

### 3. Target Management

Set quarterly targets for each owner by region:
- Owner selection
- Quarter selection (Q1-Q4)
- Currency selection (USD/JPY with auto-conversion)
- Region assignment

### 4. Pipeline Stages Configuration

Configure probability values for each pipeline stage:
- Used for weighted forecast calculations
- Customizable per region (future enhancement)
- Synced from HubSpot or manually set

---

## 🔄 HubSpot Synchronization

### Sync Behavior

**Default Sync Range**: YTD (Year To Date)
- Syncs only current year's deals by default
- Prevents timeout issues on Vercel (10s limit)

**Manual Sync**:
1. Set your date range using the dashboard filters
2. Click "Sync" button
3. System syncs deals within the selected date range

**Filter Switching**:
- Uses **client-side filtering** (instant)
- No re-sync when switching between quarters
- Data already in local database is filtered

### What Gets Synced

- **Deals**: Deal records within selected date range (based on closeDate)
- **Owners**: Sales rep information
- **Pipeline Stages**: Stage names and order

### On-Demand Data

For performance optimization, the following data is fetched only when needed:
- **Line Items**: Loaded when deal details are expanded
- **Contacts**: Loaded when deal details are expanded

---

## 🌐 Deployment

### Environment Variables for Production

```bash
# HubSpot API Keys (Multi-Account)
HUBSPOT_API_KEY=your-default-api-key
HUBSPOT_API_KEY_US=your-us-api-key
HUBSPOT_API_KEY_APAC=your-apac-api-key
HUBSPOT_API_KEY_JP=your-jp-api-key
HUBSPOT_API_KEY_IN=your-in-api-key
HUBSPOT_API_KEY_EU=your-eu-api-key

# Database (PostgreSQL recommended for production)
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Deployment Steps

1. **Build the application**:
```bash
npm run build
```

2. **Run database migrations**:
```bash
npx prisma migrate deploy
```

3. **Start the server**:
```bash
npm start
```

For detailed deployment instructions, see [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md).

### Recommended Platforms

- **Vercel** (Recommended): Zero-config deployment with automatic builds
- **Railway**: Easy PostgreSQL integration
- **Render**: Good for full-stack apps

---

## 🔐 Security Notes

- ✅ API keys are only used server-side
- ✅ All sensitive data in `.env` files (excluded from git)
- ✅ Database queries include proper validation
- ✅ No sensitive information exposed in frontend

---

## 📚 Additional Documentation

- [FEATURES.md](./FEATURES.md) - Complete feature documentation and technical architecture
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Pre-deployment checklist
- [HUBSPOT_SETUP.md](./HUBSPOT_SETUP.md) - HubSpot Private App setup guide
- [PIPELINE_STAGES.md](./PIPELINE_STAGES.md) - Pipeline stage configuration

---

## 🐛 Troubleshooting

### Database Issues

```bash
# Test database connection
npx prisma db pull

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# View data in GUI
npx prisma studio
```

### HubSpot Connection Issues

- Verify API key is correct
- Check API key has all required scopes
- Ensure Private App is enabled in HubSpot

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate
```

---

## 🎯 Roadmap

### Current Version: 1.0.0
- ✅ Multi-region dashboard with switching
- ✅ Deal details with Line Items & Contacts
- ✅ Target management
- ✅ Weighted forecasting
- ✅ Multi-currency support

### Future Enhancements
- 🔜 Per-region Pipeline Stage configuration
- 🔜 User authentication & authorization
- 🔜 Email/Slack notifications
- 🔜 Report export (PDF/Excel)
- 🔜 Real-time updates (WebSocket)
- 🔜 Mobile optimization

---

## 📞 Support

For questions or issues, please contact the development team.

---

## 📄 License

Proprietary - Internal Use Only

---

**Last Updated**: 2026-02-08
**Version**: 1.0.0
**Maintainer**: Terrel Yeh
