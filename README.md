# HubSpot Multi-Region Pipeline Dashboard

A comprehensive web dashboard that integrates 5 independent HubSpot accounts (US, APAC, IN, JP, EU) with target management and forecast calculation capabilities.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Deployment**: Zeabur

## Features

- ✅ Multi-region HubSpot integration (5 accounts)
- ✅ Target management (quarter × region matrix)
- ✅ Forecast engine (Simple & Weighted)
- ✅ Two-level dashboard (Global overview + Regional detail)
- ✅ Currency conversion (USD, JPY, INR)
- ✅ Pipeline health monitoring
- ✅ Deal-level visibility

## Project Structure

```
hubspot-dashboard/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React components
│   ├── lib/              # Business logic
│   ├── types/            # TypeScript types
│   └── hooks/            # React hooks
├── regions/              # Regional office config (MD files)
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── migrations/      # Migration history
│   └── seed.ts          # Seed script
└── scripts/             # Utility scripts
```

## Getting Started

### Prerequisites

- Node.js 18+ (currently using v22.19.0)
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
cd "/path/to/hubspot-dashboard"
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

4. Set up the database:
```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed with mock data
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database (no migration)
- `npm run db:migrate` - Create and run migration
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with mock data

## Database

### Setup PostgreSQL

You can use a local PostgreSQL instance or a cloud provider (e.g., Neon, Supabase, Railway).

Update `DATABASE_URL` in `.env.local`:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/hubspot_dashboard"
```

### View Data

```bash
npx prisma studio
```

This opens a web UI at http://localhost:5555 to browse your data.

## Development Workflow

### Phase 0: Environment Setup ✅
- [x] Initialize Next.js project
- [x] Install dependencies
- [x] Create Prisma schema
- [x] Create regional MD files
- [x] Set up environment variables

### Phase 1: Multi-Account Integration (In Progress)
- [ ] Mock data generator
- [ ] HubSpot API client
- [ ] Sync orchestration
- [ ] Currency conversion
- [ ] API endpoints

### Phase 2: Target Management
- [ ] Target CRUD operations
- [ ] Target matrix UI
- [ ] Batch operations

### Phase 3: Forecast Engine
- [ ] Forecast calculation
- [ ] Stage probability logic
- [ ] Gap analysis

### Phase 4-5: Dashboard UI
- [ ] Global overview (Level 1)
- [ ] Regional detail (Level 2)
- [ ] KPI cards and charts

## Regional Configuration

Each region has a dedicated Markdown file in the `regions/` folder with YAML frontmatter:

- `US.md` - United States
- `APAC.md` - Asia Pacific
- `IN.md` - India
- `JP.md` - Japan
- `EU.md` - Europe

These files contain:
- Region metadata (code, name, currency, timezone)
- HubSpot configuration
- Team structure
- Default stage probabilities

## API Endpoints

### Sync
- `POST /api/sync` - Trigger sync for all regions
- `GET /api/sync/status` - Get sync status
- `POST /api/sync/[region]` - Sync specific region

### Targets
- `GET /api/targets` - List targets
- `POST /api/targets` - Create target
- `PUT /api/targets/[id]` - Update target
- `DELETE /api/targets/[id]` - Delete target
- `POST /api/targets/batch` - Batch operations

### Forecast
- `GET /api/forecast` - Calculate forecast
- `GET /api/forecast/gap-analysis` - Gap analysis

### Dashboard
- `GET /api/dashboard/global` - Global overview data
- `GET /api/dashboard/region/[code]` - Regional detail data

## Deployment

### Zeabur

1. Connect your Git repository to Zeabur
2. Set environment variables in Zeabur dashboard
3. Deploy

Zeabur will automatically:
- Build your Next.js app
- Run database migrations
- Start the server

### Environment Variables for Production

Make sure to set these in your deployment environment:
- `DATABASE_URL` - PostgreSQL connection string
- `HUBSPOT_API_KEY_*` - HubSpot API keys for each region
- `ENABLE_MOCK_DATA=false` - Disable mock data in production
- `CRON_SECRET` - Secret for cron job authentication

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
npx prisma db pull

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### TypeScript Errors

```bash
# Check for type errors
npm run type-check

# Regenerate Prisma types
npm run db:generate
```

### Development Server Issues

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install
```

## Contributing

This is an internal project. For questions or issues, contact the development team.

## License

Proprietary - Internal Use Only
