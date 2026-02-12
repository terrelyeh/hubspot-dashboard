# Deployment Checklist

## 📋 部署前檢查清單

### 1. 環境變數設定

- [ ] 複製 `.env.example` 到 `.env.production`
- [ ] 設定正確的 HubSpot API Keys（每個區域一個）
- [ ] 設定正確的 `DATABASE_URL`（PostgreSQL 連線字串）
- [ ] 設定正確的 `AUTH_SECRET`（NextAuth.js JWT 加密金鑰）
- [ ] 確認所有環境變數都沒有遺漏

```bash
# .env.production 範例

# HubSpot API Keys（命名規則：HUBSPOT_API_KEY_{區域代碼}）
HUBSPOT_API_KEY_JP=pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
HUBSPOT_API_KEY_APAC=pat-na1-yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
# 新增更多區域只需加入對應的環境變數
# HUBSPOT_API_KEY_LATAM=pat-na1-zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication (NextAuth.js v5)
AUTH_SECRET=your-random-secret-string  # 使用 openssl rand -base64 32 產生

# Optional: Enable real HubSpot sync (default: false for mock data)
ENABLE_REAL_HUBSPOT_SYNC=true
```

### 2. 資料庫準備

- [ ] 已將資料庫從 SQLite 切換到 PostgreSQL（推薦）
- [ ] 執行資料庫 migration：`npx prisma migrate deploy`
- [ ] 生成 Prisma Client：`npx prisma generate`
- [ ] 執行種子資料（如需要）：`npx prisma db seed`
- [ ] 驗證資料庫連線正常

### 3. 依賴套件檢查

- [ ] 執行 `npm install` 確保所有依賴已安裝
- [ ] 檢查 `package.json` 中沒有不必要的 dev dependencies
- [ ] 執行 `npm audit` 檢查安全性問題
- [ ] 如有漏洞，執行 `npm audit fix`

### 4. 建置測試

- [ ] 執行 `npm run build` 確認建置成功
- [ ] 檢查建置輸出沒有錯誤或警告
- [ ] 執行 `npm start` 測試生產版本
- [ ] 在本地測試所有主要功能正常運作

### 5. 程式碼品質

- [ ] 移除所有 console.log（或改用適當的 logging）
- [ ] 移除所有註解掉的程式碼
- [ ] 確認沒有 TODO 或 FIXME 留在關鍵位置
- [ ] 檢查 TypeScript 沒有錯誤：`npx tsc --noEmit`

### 6. Git 版本控管

- [ ] 確認 `.gitignore` 已更新，包含所有敏感檔案
- [ ] 檢查沒有 `.env` 或敏感資料被提交到 git
- [ ] 移除所有備份檔案（.backup, .bak, .old）
- [ ] Commit 所有變更

```bash
git status
git add .
git commit -m "feat: Complete HubSpot Dashboard with Line Items and Deal Details"
```

### 7. 文件完整性

- [ ] README.md 已更新最新資訊
- [ ] FEATURES.md 已建立並完整記錄功能
- [ ] HUBSPOT_SETUP.md 包含完整的 HubSpot 設定步驟
- [ ] API 文件已更新（如有）

### 8. Pipeline 資料遷移（v1.1）

- [ ] 對每個區域執行 HubSpot Sync，確保 Pipeline 資料已同步到資料庫
- [ ] 執行 `/api/migrate-pipeline`（POST）將 `pipelineId = null` 的舊資料遷移到各區域的預設 Pipeline
- [ ] 驗證 Dashboard 的 Pipeline 選單正確顯示
- [ ] 驗證 Target Management 的 Pipeline 選單正確顯示
- [ ] 確認各 Pipeline 的 deals、targets 資料正確隔離

```bash
# 在瀏覽器 DevTools Console 中執行遷移：
fetch('/api/migrate-pipeline', { method: 'POST' })
  .then(r => r.json())
  .then(d => console.log(d));
```

### 9. 認證系統設定（v1.1）

- [ ] 設定 `AUTH_SECRET` 環境變數（使用 `openssl rand -base64 32` 產生）
- [ ] 建立初始 ADMIN 使用者帳號（透過 Prisma seed 或直接 SQL）
- [ ] 驗證登入頁面 (`/login`) 正常運作
- [ ] 驗證 ADMIN 可訪問 `/admin/users` 管理介面
- [ ] 驗證 MANAGER 無法訪問 `/admin` 路由（應被重導至 `/dashboard`）
- [ ] 驗證 VIEWER 只能檢視 Dashboard，無法編輯 Targets
- [ ] 驗證 Region Access 限制正確（非 ADMIN 使用者只能看到被指派的區域）
- [ ] 確認 JWT cookie 在 production 使用 `__Secure-` 前綴

```bash
# 建立初始 ADMIN 使用者（透過 Prisma Studio 或 seed script）
npx prisma studio
# 在 User table 新增：
# email: admin@example.com
# password: (bcryptjs hashed)
# role: ADMIN
# isActive: true
```

### 10. 安全性檢查

- [ ] API 端點有適當的錯誤處理
- [ ] 沒有敏感資訊暴露在前端
- [ ] HubSpot API Key 只在後端使用
- [ ] 資料庫查詢有適當的驗證
- [ ] NextAuth.js `AUTH_SECRET` 已設定且不在版本控制中
- [ ] 密碼使用 bcryptjs 加密儲存
- [ ] 中介軟體（middleware）正確阻擋未認證的請求

### 11. 效能優化

- [ ] 圖片已優化（如有）
- [ ] 靜態資源已壓縮
- [ ] 考慮啟用 ISR（Incremental Static Regeneration）
- [ ] 考慮加入快取機制（Redis 等）

### 12. Vercel 部署設定

- [ ] 連接 GitHub Repository 到 Vercel
- [ ] 在 Vercel Dashboard 設定環境變數
- [ ] 設定正確的 Build Command: `npm run build`
- [ ] 設定正確的 Output Directory: `.next`
- [ ] 設定 Node.js 版本（如需要）

### 13. 部署後驗證

- [ ] 訪問生產環境 URL 確認網站可訪問
- [ ] 測試登入頁面正常運作（`/login`）
- [ ] 測試 ADMIN 使用者可登入並訪問所有功能
- [ ] 測試 MANAGER/VIEWER 的 Region Access 限制正確
- [ ] 測試 HubSpot 資料同步功能
- [ ] 測試 Dashboard 顯示正確
- [ ] 測試 Deal Details 展開功能
- [ ] 測試 Line Items 顯示
- [ ] 測試 Contacts 顯示
- [ ] 測試 Target 設定功能
- [ ] 測試 Pipeline Stages 配置
- [ ] 測試 Pipeline 選單顯示與切換（多 Pipeline 區域）
- [ ] 測試 Pipeline 切換後 Target、Deals 資料正確隔離
- [ ] 測試 `/admin/users` 使用者管理介面（ADMIN only）
- [ ] 檢查瀏覽器 Console 沒有錯誤
- [ ] 檢查 Vercel Logs 沒有錯誤

### 14. 監控設定

- [ ] 設定錯誤追蹤（Sentry 等）
- [ ] 設定效能監控
- [ ] 設定可用性監控（Uptime Robot 等）
- [ ] 設定 Alert 通知

### 15. 備份與回滾計畫

- [ ] 建立資料庫備份策略
- [ ] 記錄回滾步驟
- [ ] 建立緊急聯絡清單

---

## 🌍 新增區域指南

### 新增區域步驟

以新增 **LATAM（拉丁美洲）** 為例：

1. **Vercel 環境變數**
   ```
   HUBSPOT_API_KEY_LATAM = pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

2. **建立區域配置檔案**
   建立 `/regions/LATAM.md`

3. **更新前端區域列表**
   - `src/app/dashboard/page.tsx` - REGIONS 陣列
   - `src/app/settings/targets/page.tsx` - REGIONS 陣列

4. **資料庫新增區域記錄**
   ```sql
   INSERT INTO "Region" (id, code, name, currency, timezone, "isActive", "createdAt", "updatedAt")
   VALUES ('cuid-latam', 'LATAM', 'Latin America', 'USD', 'America/Sao_Paulo', true, NOW(), NOW());
   ```

5. **執行 HubSpot Sync 同步 Pipeline 資料**（v1.1）
   - Sync 完成後，HubSpot 中的 Pipeline 會自動建立到資料庫
   - 第一個同步的 Pipeline 會設為 `isDefault = true`

### API Key 命名規則

| 區域代碼 | 環境變數名稱 |
|---------|-------------|
| JP | `HUBSPOT_API_KEY_JP` |
| APAC | `HUBSPOT_API_KEY_APAC` |
| LATAM | `HUBSPOT_API_KEY_LATAM` |
| US | `HUBSPOT_API_KEY_US` |
| EU | `HUBSPOT_API_KEY_EU` |

系統自動根據區域代碼組合環境變數名稱：`HUBSPOT_API_KEY_{區域代碼}`

---

## 🚀 快速部署指令

### 本地測試

```bash
# 1. 安裝依賴
npm install

# 2. 設定環境變數
cp .env.example .env
# 編輯 .env 檔案，填入 HUBSPOT_API_KEY

# 3. 資料庫設定
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# 4. 啟動開發伺服器
npm run dev

# 5. 測試建置
npm run build
npm start
```

### Vercel 部署

```bash
# 1. 安裝 Vercel CLI（如果還沒安裝）
npm i -g vercel

# 2. 登入 Vercel
vercel login

# 3. 連結專案（第一次）
vercel link

# 4. 設定環境變數
vercel env add HUBSPOT_API_KEY production
vercel env add DATABASE_URL production
vercel env add AUTH_SECRET production

# 5. 部署
vercel --prod

# 6. 部署後執行 migration（透過 Vercel CLI）
# 先在 package.json 加入 script:
# "postinstall": "prisma generate"
# "vercel-build": "prisma generate && prisma migrate deploy && next build"
```

---

## 🔧 常見問題排解

### Q1: 建置失敗 - Prisma Client 找不到

```bash
# 解決方式
npx prisma generate
npm run build
```

### Q2: 資料庫連線失敗

```bash
# 檢查 DATABASE_URL 格式
# PostgreSQL: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
# 測試連線
npx prisma db pull
```

### Q3: HubSpot API 無法連線

- 檢查 API Key 是否正確
- 檢查 API Key 權限是否足夠
- 檢查 HubSpot Private App 是否啟用

### Q4: Deal Details 無法展開

- 檢查 `/api/deals/[id]` 端點是否正常
- 檢查瀏覽器 Console 是否有錯誤
- 檢查 HubSpot API 權限是否包含 line_items 和 contacts

---

## 📊 部署完成後的監控重點

1. **API 回應時間**
   - Dashboard API: < 2 秒
   - Deal Details API: < 3 秒
   - HubSpot Sync: 視資料量而定

2. **錯誤率**
   - 目標: < 0.1%
   - 重點監控: HubSpot API 呼叫失敗

3. **使用者體驗**
   - 頁面載入時間: < 3 秒
   - 互動回應時間: < 500ms

---

**準備好了嗎？** ✅ 完成所有檢查項目後，就可以進行部署了！

**最後更新**: 2026-02-12
