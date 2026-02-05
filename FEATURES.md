# HubSpot Dashboard - Feature Documentation

## 📋 目錄

1. [專案概述](#專案概述)
2. [核心功能](#核心功能)
3. [技術架構](#技術架構)
4. [資料庫架構](#資料庫架構)
5. [API 端點](#api-端點)
6. [HubSpot 整合](#hubspot-整合)
7. [多幣別支援](#多幣別支援)
8. [部署準備](#部署準備)

---

## 專案概述

**HubSpot Dashboard** 是一個專為銷售團隊設計的即時業績追蹤與預測系統，整合 HubSpot CRM 資料，提供多區域、多幣別的業績分析與目標管理功能。

### 主要特點

- 🎯 **即時業績追蹤**: 與 HubSpot CRM 即時同步，顯示最新的交易狀態
- 🌍 **多區域管理**: 支援北美、歐洲、亞太等多個地區的獨立追蹤
- 💱 **多幣別支援**: USD、JPY 等多種貨幣，自動轉換與顯示
- 📊 **銷售漏斗分析**: 依據 Pipeline Stage 分析交易進度
- 🎲 **加權預測**: 基於成交機率的智能業績預測
- 👥 **Owner 級別目標**: 個人與團隊目標設定與追蹤
- 📈 **Deal 詳細資訊**: Line Items、Contacts、Deal Properties 完整顯示

---

## 核心功能

### 1. Dashboard 首頁 (/)

**檔案位置**: `src/app/page.tsx`

#### 功能概述
- 顯示全公司總覽資料
- Pipeline Stages 配置卡片
- Region 快速切換
- 季度業績摘要

#### 關鍵元素
```typescript
// 主要區塊
- Header: 公司 Logo、導航選單、Demo Mode 切換
- Pipeline Stages Card: Stage 配置與機率設定
- Region Cards: 各區域業績總覽與快速連結
- Metrics Overview: 關鍵指標摘要
```

#### 特殊功能
- **Demo Mode**: 切換真實 HubSpot 資料與模擬資料
- **Quick Actions**: 快速導航到 Targets、Settings
- **Region Flags**: 視覺化顯示各區域國旗圖示

---

### 2. Region Dashboard (/dashboard/[region])

**檔案位置**: `src/app/dashboard/[region]/page.tsx`

#### 功能概述
單一區域的詳細業績儀表板，顯示該區域所有相關指標與交易資訊。

#### 主要指標卡片

##### Quarter Performance (季度業績)
- **Simple Total**: 所有交易金額總和
- **Weighted Forecast**: 加權預測金額（金額 × 成交機率）
- **Target**: 季度目標
- **Achievement Rate**: 達成率百分比

##### Pipeline by Stage (階段分布)
- 各個 Pipeline Stage 的交易數量
- Simple 與 Weighted 金額
- 視覺化分布圖

##### Forecast Categories (預測分類)
- **Commit**: 確定成交
- **Best Case**: 最佳情況
- **Pipeline**: 一般管道
- **Omitted**: 排除項目

##### Key Activities (關鍵活動)
- **New Deals**: 本季新建交易
- **Closed Won**: 已成交
- **Closed Lost**: 已流失
- **Stale Deals**: 超過 14 天未更新
- **Large Deals**: 超過 $100K 的大額交易

#### 互動功能
- **Slideout Panel**: 點擊任何指標卡片，右側展開詳細資料
- **Deal Cards**: 顯示每筆交易的詳細資訊
- **Expandable Details**: 點擊 "View Details" 展開 Line Items、Contacts 等資訊

---

### 3. Deal 資訊卡片系統

#### Deal Card 基本資訊

**顯示欄位**:
```typescript
{
  name: string              // 交易名稱
  amount: number           // 金額（USD）
  amountFormatted: string  // 格式化顯示（如：$150K）
  currency: string         // 幣別（USD/JPY）
  stage: string           // Pipeline Stage
  probability: number     // 成交機率 (%)
  forecastCategory: string // Commit/Best Case/Pipeline/Omitted
  createdAt: Date         // 建立日期
  owner: string           // 負責業務
  daysSinceUpdate: number // 最後更新距今天數
}
```

#### 視覺元素
- **Forecast Badge**: 依據分類顯示不同顏色
  - Commit: 綠色
  - Best Case: 藍色
  - Pipeline: 灰色
  - Omitted: 紅色

- **Update Status Indicator**:
  - 綠點: 近期更新 (< 7 天)
  - 黃點: 需注意 (7-14 天)
  - 紅點: 過期 (> 14 天)

#### Expandable Details (展開資訊)

點擊 "View Details" 後展開三個區塊：

##### 1. Deal Information (交易資訊)
```typescript
{
  closeDate: Date          // Expected Close Date (預計成交日期)
  distributor: string?     // Distributor (經銷商) - 紫色 badge
  priority: 'high' | 'medium' | 'low'  // 優先級
  description: string?     // 描述
  numContacts: number      // 關聯聯絡人數量
}
```

##### 2. Line Items (產品明細)
```typescript
{
  name: string            // 產品名稱
  description: string?    // 產品描述
  quantity: number        // 數量
  price: number          // 單價
  amount: number         // 總額 (quantity × price)
}
```

顯示格式：
- 藍色背景區塊
- 每個產品顯示為獨立卡片
- 顯示產品圖示與完整資訊

##### 3. Contacts (聯絡人)
```typescript
{
  firstName: string
  lastName: string
  email: string?
  jobTitle: string?
  phone: string?
  company: string?
}
```

顯示格式：
- 綠色背景區塊
- 聯絡人卡片包含頭像與詳細資訊

---

### 4. Top 10 Deals 互動功能

**功能**: 點擊 Top 10 Deals 表格中的任何一列，會開啟右側 Slideout 顯示該 Deal 的完整資訊。

**檔案位置**: `src/app/dashboard/page.tsx`

**實作方式**:
```typescript
<tr
  onClick={() => openSlideout(deal.name, [deal])}
  className="hover:bg-blue-50/50 transition-colors duration-150 cursor-pointer"
>
  ...
</tr>
```

---

### 5. Target Management (目標管理)

**檔案位置**: `src/app/settings/targets/page.tsx`

#### 功能概述
設定與管理 Owner 級別的季度業績目標。

#### 功能特點
- **Owner Selection**: 選擇業務員
- **Quarter Selection**: 選擇目標季度
- **Currency Selection**: 選擇目標幣別 (USD/JPY)
- **Region Assignment**: 指定所屬區域
- **Auto-conversion**: 自動轉換為 USD 儲存

#### 批量管理
- 支援一次設定多個 Owner 的目標
- 自動檢查重複目標
- 更新現有目標或建立新目標

---

### 6. Pipeline Stages Configuration

**檔案位置**: `src/app/pipeline-stages/page.tsx`

#### 功能概述
設定每個 Pipeline Stage 的機率值，用於計算加權預測。

#### 資料結構
```typescript
{
  id: string
  stageName: string      // Stage 名稱
  probability: number    // 成交機率 (0-100)
  stageOrder: number    // 排序
}
```

#### 使用場景
1. 從 HubSpot 同步 Pipeline Stages
2. 為每個 Stage 設定機率值
3. 用於計算 Weighted Forecast

---

### 7. HubSpot 同步系統

**檔案位置**:
- `src/lib/hubspot/client.ts`
- `src/lib/hubspot/sync.ts`
- `src/app/api/hubspot/sync/route.ts`

#### 同步資料類型
1. **Deals**: 交易基本資料
2. **Owners**: 業務員資訊
3. **Pipeline Stages**: 銷售階段
4. **Line Items**: 產品明細 (on-demand)
5. **Contacts**: 聯絡人資訊 (on-demand)

#### 同步方式
- **Full Sync**: 完整同步所有資料
- **Incremental Sync**: 僅同步更新的資料
- **On-Demand Fetch**: 展開 Deal Details 時才抓取

#### HubSpot API 權限要求
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

---

### 8. Currency Support (多幣別系統)

**檔案位置**:
- `src/lib/currency.ts`
- `src/lib/currency/converter.ts`

#### 支援幣別
- USD (美元) - 基準貨幣
- JPY (日圓)
- 可擴充其他幣別

#### 轉換邏輯
```typescript
// 所有資料以 USD 儲存在資料庫
deal.amountUsd = originalAmount / exchangeRate

// 顯示時依據用戶選擇的幣別轉換
displayAmount = deal.amountUsd * exchangeRate
```

#### Exchange Rate
- 可從 API 取得即時匯率
- 目前使用固定匯率：1 USD = 150 JPY

---

## 技術架構

### 前端技術棧
- **Framework**: Next.js 15.5.11 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.1
- **UI Components**: 自訂元件

### 後端技術棧
- **API**: Next.js API Routes
- **Database ORM**: Prisma 6.2.0
- **Database**: SQLite (開發) / PostgreSQL (生產推薦)
- **Runtime**: Node.js

### 整合服務
- **CRM**: HubSpot Private App API
- **Currency**: Exchange Rate API (optional)

---

## 資料庫架構

### Prisma Schema

**檔案位置**: `prisma/schema.prisma`

#### 主要資料表

##### 1. Region (區域)
```prisma
model Region {
  id          String   @id @default(cuid())
  code        String   @unique  // NA, EU, APAC
  name        String              // North America, Europe, Asia Pacific
  flag        String?             // 國旗 emoji
  deals       Deal[]
  targets     Target[]
}
```

##### 2. Deal (交易)
```prisma
model Deal {
  id                String   @id @default(cuid())
  hubspotId         String   @unique
  name              String
  amountUsd         Float              // 統一以 USD 儲存
  currency          String   @default("USD")
  stage             String
  stageProbability  Float
  forecastCategory  String?            // Commit, Best Case, Pipeline, Omitted
  closeDate         DateTime
  createdAt         DateTime
  lastModifiedAt    DateTime
  ownerEmail        String?
  ownerName         String?
  priority          String?            // high, medium, low
  description       String?
  distributor       String?            // 經銷商
  numContacts       Int      @default(0)
  hubspotUrl        String?
  regionId          String
  region            Region   @relation(fields: [regionId], references: [id])
  lineItems         LineItem[]
  contacts          DealContact[]
}
```

##### 3. LineItem (產品明細)
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

##### 4. DealContact (交易聯絡人)
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

##### 5. Target (目標)
```prisma
model Target {
  id         String   @id @default(cuid())
  ownerEmail String
  ownerName  String?
  quarter    String   // Q1 2024, Q2 2024, etc.
  targetUsd  Float    // 統一以 USD 儲存
  currency   String   @default("USD")
  regionId   String
  region     Region   @relation(fields: [regionId], references: [id])
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([ownerEmail, quarter, regionId])
}
```

##### 6. PipelineStage (銷售階段)
```prisma
model PipelineStage {
  id          String   @id @default(cuid())
  stageName   String   @unique
  probability Float              // 成交機率 0-100
  stageOrder  Int                // 排序
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 資料庫遷移紀錄

所有 migration 檔案位於 `prisma/migrations/`:
- `20260204000000_add_owner_to_targets`: 新增 Owner 資訊到 Target
- `20260204131951_add_pipeline_stage`: 新增 PipelineStage 表
- `20260204152805_add_line_items_contacts_and_deal_properties`: 新增 LineItem、DealContact、Deal 額外欄位
- `20260205012742_add_distributor_to_deals`: 新增 Distributor 欄位到 Deal

---

## API 端點

### Dashboard APIs

#### 1. GET /api/dashboard
**功能**: 取得 Dashboard 總覽資料

**Query Parameters**:
- `region`: Region code (NA, EU, APAC, etc.)

**Response**:
```typescript
{
  quarterPerformance: {
    simple: number
    weighted: number
    target: number
    achievementRate: number
    currency: string
  },
  pipelineByStage: Array<{
    stage: string
    count: number
    simple: number
    weighted: number
    probability: number
  }>,
  forecastByCategory: {
    commit: number
    bestCase: number
    pipeline: number
    omitted: number
  },
  keyActivities: {
    newDeals: { count, amount }
    closedWon: { count, amount }
    closedLost: { count, amount }
    staleDeals: { count, amount }
    largeDeals: { count, amount }
  },
  topDeals: Array<Deal>,
  detailedDeals: {
    newDeals, closedWonDeals, closedLostDeals,
    staleDeals, largeDeals, commitDeals,
    bestCaseDeals, pipelineDeals
  },
  region: { code, name }
}
```

#### 2. GET /api/deals/[id]
**功能**: 取得單一 Deal 的詳細資訊，包含 Line Items 和 Contacts

**Response**:
```typescript
{
  success: boolean
  deal: {
    id: string
    hubspotId: string
    name: string
    amount: number
    currency: string
    stage: string
    probability: number
    forecastCategory: string
    closeDate: string
    createdAt: string
    owner: string
    ownerEmail: string
    priority: string
    description: string
    distributor: string
    numContacts: number
    lineItems: Array<LineItem>
    contacts: Array<Contact>
    region: { code, name }
  }
}
```

### HubSpot Integration APIs

#### 3. POST /api/hubspot/sync
**功能**: 從 HubSpot 同步資料到本地資料庫

**Body**:
```typescript
{
  syncDeals?: boolean
  syncOwners?: boolean
  syncStages?: boolean
}
```

#### 4. GET /api/hubspot/test
**功能**: 測試 HubSpot API 連線

### Target Management APIs

#### 5. GET /api/targets
**功能**: 取得所有 Target 設定

#### 6. POST /api/targets
**功能**: 建立或更新 Target

**Body**:
```typescript
{
  ownerEmail: string
  ownerName: string
  quarter: string
  targetAmount: number
  currency: string
  regionId: string
}
```

#### 7. POST /api/targets/bulk
**功能**: 批量建立或更新多個 Targets

### Other APIs

#### 8. GET /api/regions
**功能**: 取得所有 Region 資訊

#### 9. GET /api/pipeline-stages
**功能**: 取得所有 Pipeline Stage 配置

#### 10. POST /api/pipeline-stages
**功能**: 更新 Pipeline Stage 機率設定

---

## HubSpot 整合

### 設定步驟

1. **建立 HubSpot Private App**
   - 登入 HubSpot Account
   - Settings → Integrations → Private Apps
   - 建立新的 Private App
   - 設定所需權限（見上方權限清單）

2. **設定環境變數**

   在 `.env` 或 `.env.local` 檔案中：
   ```bash
   HUBSPOT_API_KEY=your-private-app-token
   ```

3. **初始同步**

   執行同步指令或呼叫 API：
   ```bash
   # 或透過 UI 在 Settings → HubSpot Integration 點擊 "Sync Now"
   ```

### 資料同步策略

#### 完整同步 (Full Sync)
- 適用場景: 初次設定、資料不一致
- 執行時間: 較長（依資料量而定）
- 操作: 刪除現有資料，重新匯入

#### 增量同步 (Incremental Sync)
- 適用場景: 定期更新
- 執行時間: 較短
- 操作: 僅更新有變動的資料

#### 按需抓取 (On-Demand Fetch)
- 適用場景: Line Items、Contacts
- 執行時間: 即時
- 操作: 使用者點擊時才從 HubSpot API 抓取

### HubSpot Client 實作

**檔案**: `src/lib/hubspot/client.ts`

主要方法:
```typescript
class HubSpotClient {
  // 基本 Deal 查詢
  async fetchDeals(): Promise<HubSpotDeal[]>

  // 批量抓取 Line Items
  async fetchLineItems(lineItemIds: string[]): Promise<HubSpotLineItem[]>

  // 批量抓取 Contacts
  async fetchContacts(contactIds: string[]): Promise<HubSpotContact[]>

  // 抓取 Deal 及其關聯資料
  async fetchDealWithAssociations(dealId: string): Promise<{
    deal: HubSpotDeal
    lineItems: HubSpotLineItem[]
    contacts: HubSpotContact[]
  }>

  // 抓取 Owners
  async fetchOwners(): Promise<HubSpotOwner[]>

  // 抓取 Pipeline Stages
  async fetchPipelineStages(): Promise<HubSpotPipelineStage[]>
}
```

---

## 多幣別支援

### 實作架構

#### 儲存策略
- **資料庫**: 所有金額以 USD 儲存（`amountUsd`, `targetUsd`）
- **紀錄原幣別**: 保留原始幣別資訊（`currency`）
- **轉換時機**:
  - 寫入時: 其他幣別 → USD
  - 讀取時: USD → 使用者選擇的幣別

#### 匯率管理

**檔案**: `src/lib/currency/converter.ts`

```typescript
// 支援的幣別
const SUPPORTED_CURRENCIES = ['USD', 'JPY']

// 匯率設定（相對於 USD）
const EXCHANGE_RATES = {
  USD: 1,
  JPY: 150,  // 1 USD = 150 JPY
}

// 轉換函數
function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number
```

#### 前端顯示

使用者可在 Target 設定時選擇幣別：
```tsx
<select value={currency} onChange={(e) => setCurrency(e.target.value)}>
  <option value="USD">USD ($)</option>
  <option value="JPY">JPY (¥)</option>
</select>
```

### 擴充新幣別

1. 更新 `SUPPORTED_CURRENCIES`
2. 新增 `EXCHANGE_RATES` 匯率
3. 可選: 串接即時匯率 API

---

## 部署準備

### 環境變數檢查清單

建立 `.env.production` 檔案：

```bash
# HubSpot Integration
HUBSPOT_API_KEY=your-production-hubspot-token

# Database
DATABASE_URL=your-production-database-url

# Optional: Currency API
EXCHANGE_RATE_API_KEY=your-api-key
```

### 資料庫遷移

#### 開發環境 (SQLite)
```bash
npx prisma migrate dev
```

#### 生產環境 (PostgreSQL 推薦)
```bash
# 1. 更新 DATABASE_URL 為 PostgreSQL 連線字串
# 2. 執行 migration
npx prisma migrate deploy

# 3. 生成 Prisma Client
npx prisma generate
```

### 建置步驟

```bash
# 1. 安裝依賴
npm install

# 2. 執行 Prisma 生成
npx prisma generate

# 3. 建置生產版本
npm run build

# 4. 啟動生產伺服器
npm start
```

### 需要移除的檔案

部署前建議移除以下檔案：

#### 備份檔案
- `src/app/targets/page.tsx.backup`
- `src/app/dashboard/[region]/page.tsx.backup`
- `src/app/dashboard/page.tsx.backup`
- `src/app/page.tsx.backup`
- `src/components/dashboard/RegionCard.tsx.backup`
- `src/components/dashboard/MetricCard.tsx.backup`

#### 優化版本檔案（如果不使用）
- `src/app/dashboard/[region]/page-optimized.tsx`
- `src/app/dashboard/page-optimized.tsx`
- `src/app/page-optimized.tsx`
- `src/app/targets/page-optimized.tsx`
- `src/components/dashboard/MetricCardOptimized.tsx`
- `src/components/dashboard/RegionCardOptimized.tsx`

#### 測試檔案
- `src/app/test/page.tsx`

#### 種子檔案（生產環境不需要）
- `prisma/seed-realistic.ts` (如果不使用)
- `prisma/seed-stages.ts` (如果不使用)

#### 開發資料庫
- `dev.db` (根目錄的空檔案)
- `prisma/dev.db` (保留，或在生產環境使用 PostgreSQL 後刪除)

#### 文件檔案可保留（供團隊參考）
- `CURRENCY_SUPPORT.md`
- `HUBSPOT_INTEGRATION.txt`
- `HUBSPOT_SETUP.md`
- `PIPELINE_STAGES.md`
- `README.md`
- `TESTING_GUIDE.md`
- `UI_OPTIMIZATION_SUMMARY.md`
- `UI_UX_OPTIMIZATION.md`
- `FEATURES.md` (本檔案)

### Vercel 部署建議

1. **連接 GitHub Repository**
2. **設定環境變數**:
   - `HUBSPOT_API_KEY`
   - `DATABASE_URL` (使用 Vercel Postgres 或其他資料庫服務)
3. **Build 設定**:
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. **部署後執行**:
   ```bash
   # SSH 到伺服器或使用 Vercel CLI
   npx prisma migrate deploy
   npx prisma db seed  # 如果需要初始資料
   ```

### 效能優化建議

1. **啟用 ISR (Incremental Static Regeneration)**
   ```typescript
   export const revalidate = 60 // 60 秒後重新生成
   ```

2. **使用 Redis 快取**
   - 快取 Dashboard 資料
   - 快取 HubSpot API 回應

3. **資料庫索引**
   ```prisma
   @@index([regionId])
   @@index([ownerEmail])
   @@index([closeDate])
   ```

4. **圖片優化**
   - 使用 Next.js Image 元件
   - 國旗 emoji 改用 SVG 圖示

---

## 版本控管

### .gitignore 重點

確認以下檔案被忽略：

```gitignore
# 環境變數
.env
.env*.local
.env.production

# 資料庫
*.db
*.db-journal

# 依賴
node_modules/

# Next.js
.next/
out/

# 備份檔案
*.backup
*.bak
*.old
*~

# 系統檔案
.DS_Store
```

### Git 提交前檢查

```bash
# 檢查未追蹤檔案
git status

# 確認沒有敏感資訊
git diff

# 檢查 .env 檔案未被加入
git ls-files | grep .env
```

---

## 總結

### 專案優勢

✅ **完整的 HubSpot CRM 整合**
✅ **多區域、多幣別支援**
✅ **詳細的 Deal 資訊展示（Line Items、Contacts）**
✅ **Owner 級別目標管理**
✅ **加權預測與多維度分析**
✅ **響應式 UI 與互動式 Slideout**
✅ **型別安全的 TypeScript 實作**
✅ **清晰的資料庫架構與 migration 管理**

### 後續擴充方向

🔜 **權限管理**: User authentication & authorization
🔜 **通知系統**: Email/Slack 提醒
🔜 **報表匯出**: PDF/Excel 報表生成
🔜 **行動版優化**: Mobile-first design
🔜 **即時更新**: WebSocket 或 Server-Sent Events
🔜 **進階分析**: 預測模型、趨勢分析

---

**最後更新**: 2026-02-05
**版本**: 1.0.0
**維護者**: Terrel Yeh
