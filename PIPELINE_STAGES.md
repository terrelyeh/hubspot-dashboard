# Pipeline Stages Configuration

## Overview

The Pipeline Stages system provides centralized configuration for managing the standard sales pipeline stages used throughout the HubSpot Multi-Region Dashboard.

## Standard Pipeline Stages

| Order | Stage Name | Code | Probability | Type | Color |
|-------|------------|------|-------------|------|-------|
| 1 | Initial Contact | `initial_contact` | 10% | Active | Slate-400 |
| 2 | Qualified Opp. | `qualified_opp` | 20% | Active | Slate-500 |
| 3 | Recommended Prod. | `recommended_prod` | 30% | Active | Blue-500 |
| 4 | Product Evaluation | `product_evaluation` | 40% | Active | Blue-600 |
| 5 | Quote Sent | `quote_sent` | 60% | Active | Violet-500 |
| 6 | On-Hold | `on_hold` | 70% | Active | Amber-500 |
| 7 | PO Pending | `po_pending` | 90% | Active | Emerald-500 |
| 8 | Closed Won | `closed_won` | 100% | Final (Won) | Emerald-600 |
| 9 | Closed Lost | `closed_lost` | 0% | Final (Lost) | Red-600 |

## Database Schema

### PipelineStage Model

```prisma
model PipelineStage {
  id              String   @id @default(cuid())
  name            String   @unique
  code            String   @unique
  probability     Float
  displayOrder    Int
  isActive        Boolean  @default(true)
  isFinal         Boolean  @default(false)
  isWon           Boolean  @default(false)
  color           String?
  description     String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([displayOrder])
  @@index([isActive])
}
```

### Fields Explanation

- **name**: Human-readable stage name (e.g., "Initial Contact")
- **code**: Machine-readable identifier (e.g., "initial_contact")
- **probability**: Win probability percentage (0-100)
- **displayOrder**: Order in pipeline (1-9)
- **isActive**: Whether stage is currently in use
- **isFinal**: True for Closed Won/Lost stages
- **isWon**: True only for Closed Won
- **color**: Hex color code for UI display
- **description**: Optional description of the stage

## API Endpoint

### GET /api/pipeline-stages

Fetches all active pipeline stages ordered by displayOrder.

**Response:**
```json
{
  "success": true,
  "stages": [
    {
      "id": "cuid...",
      "name": "Initial Contact",
      "code": "initial_contact",
      "probability": 10,
      "displayOrder": 1,
      "isFinal": false,
      "isWon": false,
      "color": "#94A3B8",
      "description": "First contact made with prospect"
    },
    ...
  ],
  "total": 9
}
```

## UI Pages

### /pipeline-stages

Admin page for viewing and managing pipeline stages.

**Features:**
- Pipeline flow visualization
- Comprehensive stages table
- Color-coded indicators
- Probability progress bars
- Stage type badges (Active/Won/Lost)

## Seeding Data

To initialize or reset pipeline stages:

```bash
npx tsx prisma/seed-stages.ts
```

This script:
1. Clears existing pipeline stages
2. Creates all 9 standard stages
3. Outputs creation status

## Usage in Application

### Calculating Weighted Forecasts

The probability values are used to calculate weighted forecasts:

```typescript
weightedAmount = dealAmount * (stageProbability / 100)
```

### Stage Progression

Deals progress through the pipeline in order:

```
Initial Contact (10%)
  → Qualified Opp. (20%)
  → Recommended Prod. (30%)
  → Product Evaluation (40%)
  → Quote Sent (60%)
  → On-Hold (70%) [optional]
  → PO Pending (90%)
  → Closed Won (100%) OR Closed Lost (0%)
```

## Color Coding

Stages are color-coded for visual distinction:

- **Early Stages** (10-20%): Slate colors
- **Mid Stages** (30-60%): Blue/Violet colors
- **Late Stages** (70-90%): Amber/Emerald colors
- **Closed Won**: Emerald-600 (green)
- **Closed Lost**: Red-600 (red)

## Pipeline Scope (v1.1)

As of v1.1, the system supports **multiple pipelines per region**. Each pipeline from HubSpot is synced as a `Pipeline` record in the database. Stages are resolved per pipeline during sync to avoid cross-pipeline collisions (e.g., two pipelines may have different stages with the same internal ID).

```
Region (JP)
  ├── Sales Pipeline (default)
  │     ├── Initial Contact (10%)
  │     ├── Qualified Opp. (20%)
  │     └── ...
  └── Deal Registration
        ├── New Registration (10%)
        ├── Under Review (30%)
        └── ...
```

Deals and targets are associated with their respective pipeline, enabling fully isolated metrics per pipeline.

## Future Enhancements

Potential improvements:

1. **Stage Editing**: UI for modifying stages
2. **Custom Stages**: Allow users to create custom stages
3. **Stage Analytics**: Track deal velocity by stage
4. **Stage History**: Maintain audit log of stage changes
5. **Per-Pipeline Stage Probabilities**: Different probability values per pipeline (partially implemented via pipeline-scoped stage resolution)
6. **Stage Templates**: Pre-configured pipeline templates

## Integration Points

The pipeline stages system integrates with:

- **Deals**: Each deal has a `stage` field
- **Forecasts**: Probability used for weighted calculations
- **Dashboard**: Visual indicators based on stage colors
- **Reports**: Stage-based analytics and breakdowns

## Maintenance

### Adding a New Stage

1. Update the seed script (`prisma/seed-stages.ts`)
2. Add the new stage with appropriate:
   - name, code, probability
   - displayOrder (reorder others if needed)
   - color and description
3. Run seed script: `npx tsx prisma/seed-stages.ts`
4. Update UI components that depend on stages

### Modifying Probabilities

To adjust win probabilities:
1. Update values in `prisma/seed-stages.ts`
2. Re-run seed script
3. Recalculate existing weighted forecasts if needed

## Notes

- All probabilities sum to more than 100% because stages are not mutually exclusive
- The "On-Hold" stage (70%) is higher than "Quote Sent" (60%) to reflect that on-hold deals often return to active negotiation
- Final stages (Closed Won/Lost) use `isFinal` flag for filtering
- Only Closed Won has `isWon=true` for reporting purposes

---

**Last Updated:** 2026-02-12
**Version:** 1.1.0
