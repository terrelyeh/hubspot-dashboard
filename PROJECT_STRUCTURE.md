# Project Structure

## 📁 目錄結構說明

```
hubspot-dashboard/
├── prisma/                         # 資料庫相關
│   ├── migrations/                 # 資料庫 migration 檔案
│   │   ├── 20260204000000_add_owner_to_targets/
│   │   ├── 20260204131951_add_pipeline_stage/
│   │   ├── 20260204152805_add_line_items_contacts_and_deal_properties/
│   │   └── 20260205012742_add_distributor_to_deals/
│   ├── schema.prisma               # Prisma 資料庫 schema 定義
│   ├── seed.ts                     # 種子資料腳本
│   └── dev.db                      # SQLite 開發資料庫
│
├── regions/                        # 區域設定檔案
│   ├── APAC.md                     # 亞太地區
│   ├── EU.md                       # 歐洲地區
│   ├── IN.md                       # 印度地區
│   ├── JP.md                       # 日本地區
│   └── US.md                       # 美國地區
│
├── src/                            # 原始碼
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # API Routes
│   │   │   ├── dashboard/          # Dashboard API
│   │   │   │   └── route.ts        # GET Dashboard 資料
│   │   │   ├── deals/              # Deals API
│   │   │   │   ├── [id]/           # 單一 Deal 詳細資訊
│   │   │   │   │   └── route.ts    # GET Deal details (Line Items, Contacts)
│   │   │   │   └── route.ts        # GET 所有 Deals
│   │   │   ├── forecast/           # 預測 API
│   │   │   │   └── route.ts        # GET 預測資料
│   │   │   ├── hubspot/            # HubSpot 整合 API
│   │   │   │   ├── sync/
│   │   │   │   │   └── route.ts    # POST 同步 HubSpot 資料
│   │   │   │   └── test/
│   │   │   │       └── route.ts    # GET 測試 HubSpot 連線
│   │   │   ├── pipeline-stages/    # Pipeline Stages API
│   │   │   │   └── route.ts        # GET/POST Pipeline Stages
│   │   │   ├── regions/            # 區域 API
│   │   │   │   └── route.ts        # GET 所有區域
│   │   │   └── targets/            # 目標管理 API
│   │   │       ├── bulk/
│   │   │       │   └── route.ts    # POST 批量建立/更新 Targets
│   │   │       └── route.ts        # GET/POST Targets
│   │   │
│   │   ├── dashboard/              # Dashboard 頁面
│   │   │   ├── [region]/           # 單一區域 Dashboard
│   │   │   │   └── page.tsx        # Region Dashboard 頁面
│   │   │   └── page.tsx            # 主 Dashboard 頁面（包含 Slideout）
│   │   │
│   │   ├── pipeline-stages/        # Pipeline Stages 設定頁面
│   │   │   └── page.tsx            # Pipeline Stages 配置
│   │   │
│   │   ├── settings/               # 設定頁面
│   │   │   ├── hubspot/            # HubSpot 設定
│   │   │   │   └── page.tsx        # HubSpot 同步設定
│   │   │   └── targets/            # Targets 設定
│   │   │       └── page.tsx        # Target 管理頁面
│   │   │
│   │   ├── targets/                # Targets 頁面
│   │   │   └── page.tsx            # Targets 總覽
│   │   │
│   │   ├── layout.tsx              # 全域 Layout
│   │   └── page.tsx                # 首頁（公司總覽）
│   │
│   ├── components/                 # React 元件
│   │   └── dashboard/
│   │       ├── MetricCard.tsx      # 指標卡片元件
│   │       └── RegionCard.tsx      # 區域卡片元件
│   │
│   ├── lib/                        # 工具函式與客戶端
│   │   ├── currency/               # 幣別相關
│   │   │   └── converter.ts        # 幣別轉換工具
│   │   ├── hubspot/                # HubSpot 整合
│   │   │   ├── client.ts           # HubSpot API Client
│   │   │   └── sync.ts             # HubSpot 同步邏輯
│   │   ├── regions/                # 區域相關
│   │   │   └── loader.ts           # 區域資料載入器
│   │   ├── constants.ts            # 常數定義
│   │   ├── currency.ts             # 幣別工具（主檔）
│   │   └── db.ts                   # Prisma Client 單例
│   │
│   └── types/                      # TypeScript 型別定義
│       ├── hubspot.ts              # HubSpot 相關型別
│       └── index.ts                # 通用型別
│
├── .env.example                    # 環境變數範例檔
├── .gitignore                      # Git 忽略檔案清單
├── CURRENCY_SUPPORT.md             # 多幣別支援文件
├── DEPLOYMENT_CHECKLIST.md         # 部署檢查清單
├── FEATURES.md                     # 功能文件
├── HUBSPOT_INTEGRATION.txt         # HubSpot 整合說明（簡短版）
├── HUBSPOT_SETUP.md                # HubSpot 設定步驟
├── PIPELINE_STAGES.md              # Pipeline Stages 說明
├── PROJECT_STRUCTURE.md            # 本檔案
├── README.md                       # 專案說明
├── TESTING_GUIDE.md                # 測試指南
├── UI_OPTIMIZATION_SUMMARY.md      # UI 優化摘要
├── UI_UX_OPTIMIZATION.md           # UI/UX 優化詳細說明
├── next.config.ts                  # Next.js 配置
├── package.json                    # NPM 套件定義
├── postcss.config.mjs              # PostCSS 配置
├── tailwind.config.ts              # Tailwind CSS 配置
└── tsconfig.json                   # TypeScript 配置
```

---

## 📄 核心檔案說明

### 配置檔案

#### `package.json`
專案依賴與腳本定義
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

#### `tsconfig.json`
TypeScript 編譯器配置

#### `tailwind.config.ts`
Tailwind CSS 客製化配置

#### `next.config.ts`
Next.js 框架配置

---

### 資料庫相關

#### `prisma/schema.prisma`
定義資料庫 schema，包含：
- Region: 區域資料
- Deal: 交易資料
- LineItem: 產品明細
- DealContact: 交易聯絡人
- Target: 目標設定
- PipelineStage: 銷售階段配置

#### `prisma/seed.ts`
產生模擬資料的種子腳本，用於開發測試

#### `prisma/migrations/`
資料庫 schema 變更的版本紀錄，由 Prisma Migrate 自動生成

---

### API Routes

#### Dashboard API (`src/app/api/dashboard/route.ts`)
**功能**: 提供 Dashboard 所需的所有指標資料
**端點**: `GET /api/dashboard?region={code}`
**回傳**:
- Quarter Performance
- Pipeline by Stage
- Forecast Categories
- Key Activities
- Top 10 Deals
- Detailed Deal Lists

#### Deal Details API (`src/app/api/deals/[id]/route.ts`)
**功能**: 提供單一 Deal 的詳細資訊
**端點**: `GET /api/deals/{id}`
**回傳**:
- Deal 基本資訊
- Line Items（產品明細）
- Contacts（聯絡人）
- Deal Properties（額外屬性）

#### HubSpot Sync API (`src/app/api/hubspot/sync/route.ts`)
**功能**: 從 HubSpot 同步資料到本地資料庫
**端點**: `POST /api/hubspot/sync`
**參數**:
- `syncDeals`: 是否同步 Deals
- `syncOwners`: 是否同步 Owners
- `syncStages`: 是否同步 Pipeline Stages

#### Targets API (`src/app/api/targets/route.ts`)
**功能**: 目標管理 CRUD
**端點**:
- `GET /api/targets`: 取得所有 Targets
- `POST /api/targets`: 建立或更新 Target

---

### 前端頁面

#### Home Page (`src/app/page.tsx`)
**路由**: `/`
**功能**:
- 顯示公司總覽
- Pipeline Stages 配置卡片
- Region Cards（各區域快速連結）
- Demo Mode 切換

#### Dashboard Page (`src/app/dashboard/page.tsx`)
**路由**: `/dashboard`
**功能**:
- 全公司或特定區域的業績儀表板
- 互動式 Slideout Panel
- Deal Cards with Expandable Details
- Top 10 Deals 表格（可點擊）
- Line Items 與 Contacts 顯示

#### Region Dashboard (`src/app/dashboard/[region]/page.tsx`)
**路由**: `/dashboard/{region}`
**功能**:
- 單一區域的詳細 Dashboard
- 與主 Dashboard 類似，但僅顯示該區域資料

#### Pipeline Stages Page (`src/app/pipeline-stages/page.tsx`)
**路由**: `/pipeline-stages`
**功能**:
- 設定每個 Stage 的成交機率
- 用於計算 Weighted Forecast

#### Settings Pages (`src/app/settings/`)
**路由**:
- `/settings/hubspot`: HubSpot 整合設定與同步
- `/settings/targets`: Target 管理與設定

---

### 元件

#### `MetricCard.tsx`
**用途**: 顯示單一指標的卡片元件
**特點**:
- 支援點擊展開 Slideout
- 顯示金額、數量、達成率等
- 視覺化 icon 與 badge

#### `RegionCard.tsx`
**用途**: 顯示區域摘要的卡片元件
**特點**:
- 顯示區域國旗
- 顯示關鍵指標
- 快速連結到區域 Dashboard

---

### 工具函式庫

#### `src/lib/db.ts`
**功能**: Prisma Client 單例
**用途**: 提供全域唯一的資料庫連線

#### `src/lib/hubspot/client.ts`
**功能**: HubSpot API Client
**主要方法**:
- `fetchDeals()`: 抓取所有 Deals
- `fetchLineItems(ids)`: 批量抓取 Line Items
- `fetchContacts(ids)`: 批量抓取 Contacts
- `fetchDealWithAssociations(id)`: 抓取 Deal 及其關聯資料
- `fetchOwners()`: 抓取 Owners
- `fetchPipelineStages()`: 抓取 Pipeline Stages

#### `src/lib/hubspot/sync.ts`
**功能**: HubSpot 同步邏輯
**用途**: 處理從 HubSpot 同步資料到本地資料庫的邏輯

#### `src/lib/currency.ts` & `src/lib/currency/converter.ts`
**功能**: 幣別轉換工具
**支援**: USD ↔ JPY（可擴充）

#### `src/lib/regions/loader.ts`
**功能**: 載入區域設定檔
**用途**: 從 `regions/` 目錄載入 Markdown 檔案

---

### 型別定義

#### `src/types/hubspot.ts`
定義 HubSpot API 回傳的資料結構：
- `HubSpotDeal`
- `HubSpotOwner`
- `HubSpotLineItem`
- `HubSpotContact`
- `HubSpotPipelineStage`

#### `src/types/index.ts`
定義專案通用型別：
- `Region`
- `Deal`
- `Target`
- `Metric`

---

## 🔄 資料流程

### 1. HubSpot 同步流程
```
HubSpot API → client.ts → sync.ts → Prisma → SQLite/PostgreSQL
```

### 2. Dashboard 資料流程
```
User Request → dashboard/route.ts → Prisma Query → formatDeal() → JSON Response → Frontend Render
```

### 3. Deal Details 展開流程
```
User Click → toggleDealDetails() → /api/deals/[id] → fetchDealWithAssociations() → HubSpot API (Line Items, Contacts) → JSON Response → Frontend Render
```

### 4. Target 設定流程
```
User Input → Currency Conversion → /api/targets → Prisma Create/Update → Database
```

---

## 🎯 關鍵設計決策

### 1. 資料儲存策略
- **統一以 USD 儲存**: 所有金額統一轉換為 USD 儲存在資料庫
- **保留原幣別**: 記錄原始幣別資訊
- **顯示時轉換**: 前端顯示時依據用戶選擇轉換

### 2. On-Demand Fetching
- **Line Items & Contacts**: 不在初始同步時抓取，僅在用戶展開 Deal Details 時才從 HubSpot API 抓取
- **原因**: 減少初始同步時間與 API 呼叫次數

### 3. Slideout Pattern
- **右側展開面板**: 點擊任何指標卡片時，從右側展開詳細資訊
- **原因**: 保持主頁面清爽，同時提供詳細資訊

### 4. 區域隔離
- **獨立追蹤**: 每個區域有獨立的 Dashboard 與 Target
- **全域總覽**: 首頁提供全公司總覽
- **原因**: 支援多區域團隊的獨立管理需求

---

## 📦 依賴套件

### 核心框架
- `next`: 15.5.11
- `react`: 19.x
- `typescript`: 5.x

### 資料庫
- `@prisma/client`: 6.2.0
- `prisma`: 6.2.0

### 樣式
- `tailwindcss`: 3.4.1

### 其他
- `@faker-js/faker`: 9.4.0（用於種子資料生成）

---

## 🔐 環境變數

```bash
# HubSpot API
HUBSPOT_API_KEY=your-hubspot-private-app-token

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Optional
EXCHANGE_RATE_API_KEY=your-exchange-rate-api-key
```

---

## 📝 文件檔案說明

- **README.md**: 專案基本說明與快速開始指南
- **FEATURES.md**: 完整功能文件與技術架構說明
- **DEPLOYMENT_CHECKLIST.md**: 部署前檢查清單
- **HUBSPOT_SETUP.md**: HubSpot Private App 設定步驟
- **CURRENCY_SUPPORT.md**: 多幣別支援實作說明
- **PIPELINE_STAGES.md**: Pipeline Stages 配置說明
- **TESTING_GUIDE.md**: 測試指南
- **UI_OPTIMIZATION_SUMMARY.md**: UI 優化摘要
- **UI_UX_OPTIMIZATION.md**: UI/UX 優化詳細說明
- **PROJECT_STRUCTURE.md**: 本檔案，專案結構說明

---

**最後更新**: 2026-02-05
**維護者**: Terrel Yeh
