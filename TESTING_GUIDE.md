# HubSpot Multi-Region Dashboard - 測試與導覽指南

## 🚀 快速開始

### 啟動開發伺服器

```bash
cd "/Users/terrelyeh/Documents/Hubspot Dashboard/hubspot-dashboard"
npm run dev
```

伺服器將運行在: **http://localhost:3000** (或 3001 如果 3000 被佔用)

---

## 📱 介面導覽

### 1️⃣ 首頁 `/`

**功能**: 專案總覽和導航中心

**包含內容**:
- 🎯 4 個功能卡片（Dashboard、API Test、Targets、Regions）
- ✅ 已完成功能清單
- 📊 專案進度指示器

**操作建議**:
```
1. 點擊「View Dashboard」進入全域儀表板
2. 點擊「Manage Targets」進入目標管理
3. 點擊「Open Test Page」查看 API 測試頁面
```

---

### 2️⃣ 全域儀表板 `/dashboard`

**功能**: 五個區域的整體效能總覽

**顯示內容**:
- 📊 4 個全域關鍵指標
  - Total Pipeline: $82.3M (320 筆交易)
  - Weighted Forecast: $62.5M
  - Q3 2024 Target: $12.7M
  - Achievement Rate: 493% 🟢

- 🌍 5 個區域效能卡片
  - 每個卡片顯示：Pipeline、Deals、Forecast、Target、Achievement Rate
  - 顏色指示器：綠色(超越)、黃色(接近)、紅色(落後)
  - 進度條視覺化

**操作建議**:
```
1. 查看全域 Achievement Rate（493% 表示大幅超越目標）
2. 比較各區域表現
3. 點擊任一區域卡片進入詳細頁面
```

**測試案例**:
```bash
# 訪問儀表板
open http://localhost:3001/dashboard

# 預期看到：
✓ 5 個區域卡片全部顯示
✓ 全部區域達成率 > 100%（超越目標）
✓ 卡片可點擊進入詳細頁
```

---

### 3️⃣ 區域詳細儀表板 `/dashboard/[region]`

**功能**: 單一區域的深入分析

**範例路徑**:
- `/dashboard/us` - 美國區域
- `/dashboard/apac` - 亞太區域
- `/dashboard/in` - 印度區域
- `/dashboard/jp` - 日本區域
- `/dashboard/eu` - 歐洲區域

**顯示內容**:
- 📊 4 個區域關鍵指標（Pipeline、Forecast、Target、Achievement）
- 📈 互動式圖表：
  1. **Pipeline by Stage** (長條圖)
     - Simple vs Weighted forecast
     - 各階段的管道分佈

  2. **Forecast by Month** (長條圖)
     - Q3 三個月的分佈
     - Jul、Aug、Sep 加權預測

  3. **Deal Distribution by Stage** (圓餅圖)
     - 各階段交易數量佔比
     - 彩色標記

  4. **Stage Breakdown** (表格)
     - 詳細的階段統計
     - Count + Weighted forecast

- 📋 Recent Deals 列表
  - 顯示前 50 筆交易
  - 包含：Deal Name、Amount、Stage、Probability、Owner、Close Date

**操作建議**:
```
1. 點擊「← Back to Global Dashboard」返回
2. 將滑鼠移到圖表上查看詳細數據
3. 查看 Stage Breakdown 了解各階段貢獻
4. 滾動查看最新的 50 筆交易
```

**測試案例**:
```bash
# 訪問 US 區域詳細頁
open http://localhost:3001/dashboard/us

# 預期看到：
✓ Achievement Rate: 340.9%
✓ 4 個圖表正常顯示
✓ 交易列表顯示 60 筆（US Q3 2024）
✓ Tooltip 互動正常

# 測試不同區域
open http://localhost:3001/dashboard/in
# 預期：Achievement Rate: 658.5%（最高）
```

---

### 4️⃣ 目標管理 `/targets`

**功能**: CRUD 操作和批量處理

**顯示內容**:
- 🔍 期間篩選器（Year + Quarter）
- 📊 目標列表表格
- 💰 總目標金額
- 📋 批量操作按鈕
- 🗑️ 刪除功能

**操作建議**:

#### A. 查看現有目標
```
1. 選擇 Year: 2024, Quarter: Q3
2. 查看 5 個區域的目標（總計 $12.70M）
3. 檢視各區域的備註和更新時間
```

#### B. 複製季度（含成長率）
```
1. 點擊「📋 Bulk Operations」按鈕
2. 選擇「📋 Copy Quarter」
3. 設定來源：2024 Q3
4. 設定目標：2024 Q4
5. 輸入成長率：10
6. 點擊「Execute」
7. 切換到 2024 Q4 查看新目標
```

#### C. 套用成長率到現有目標
```
1. 點擊「📋 Bulk Operations」
2. 選擇「📈 Apply Growth」
3. 設定目標期間：2024 Q4
4. 輸入成長率：5
5. 點擊「Execute」
6. 查看目標金額變化（+5%）
```

#### D. 刪除目標
```
1. 在目標列表中找到要刪除的目標
2. 點擊右側「Delete」按鈕
3. 確認刪除
4. 目標從列表中移除
```

**測試案例**:
```bash
# 1. 查看 Q3 2024 目標
curl "http://localhost:3001/api/targets?year=2024&quarter=3" | jq '.targets[] | {region: .region.code, amount: .amountFormatted}'

# 預期輸出：
# US: $3.00M
# APAC: $2.40M
# IN: $1.50M
# JP: $2.10M
# EU: $2.70M

# 2. 建立新目標
curl -X POST http://localhost:3001/api/targets \
  -H "Content-Type: application/json" \
  -d '{"regionCode":"US","year":2024,"quarter":4,"amount":3300000,"notes":"Q4 target with 10% growth"}'

# 3. 批量複製（Q3 → Q1 2025，成長 20%）
curl -X POST http://localhost:3001/api/targets/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "copy",
    "sourceYear": 2024,
    "sourceQuarter": 3,
    "targetYear": 2025,
    "targetQuarter": 2,
    "growthRate": 20
  }'

# 4. 驗證新目標
curl "http://localhost:3001/api/targets?year=2025&quarter=2" | jq '.targets[] | {region: .region.code, amount: .amountFormatted}'

# 預期：所有金額為原來的 120%
```

---

### 5️⃣ API 測試頁面 `/test`

**功能**: 驗證 API 端點正常運作

**顯示內容**:
- 📊 Regions 基本資訊表格
- 📈 Regions 含統計資訊表格
- 💰 Summary 總計（總區域數、總交易數、全域 Pipeline）

**操作建議**:
```
1. 查看表格確認數據正確
2. 對比基本和統計版本的差異
3. 檢查 Summary 數字是否正確
```

---

## 🧪 完整測試流程

### 情境 1: 新季度目標設定

```bash
# 步驟 1: 查看當前目標
訪問 /targets
選擇 2024 Q3
確認：5 個區域，總計 $12.70M

# 步驟 2: 複製到下一季並增加成長率
點擊「Bulk Operations」
選擇「Copy Quarter」
來源：2024 Q3
目標：2024 Q4
成長率：15
執行

# 步驟 3: 驗證新目標
切換到 2024 Q4
確認：5 個區域，總計約 $14.61M（+15%）
檢查備註：應顯示「Copied from Q3 2024 with 15% growth」

# 步驟 4: 在 Dashboard 查看
訪問 /dashboard
（注意：Dashboard 目前顯示 Q3 2024 數據）
```

### 情境 2: 區域效能分析

```bash
# 步驟 1: 全域總覽
訪問 /dashboard
查看全域 Achievement Rate: 493%
識別表現最好的區域（IN: 658.5%）

# 步驟 2: 深入分析印度區域
點擊 India (IN) 卡片
進入 /dashboard/in

# 步驟 3: 分析數據
查看圖表：
- Pipeline by Stage: 哪個階段最多？
- Forecast by Month: 哪個月份最強？
- Deal Distribution: 階段分佈是否健康？

查看 Recent Deals:
- 找到最大的交易
- 檢查負責人分佈
- 查看 Close Date 分佈

# 步驟 4: 對比其他區域
返回全域儀表板
點擊 Japan (JP) 卡片
比較兩個區域的差異
```

### 情境 3: 目標調整

```bash
# 步驟 1: 發現目標設定過低
訪問 /dashboard
發現所有區域都大幅超越目標（493%）

# 步驟 2: 調整下季度目標
訪問 /targets
選擇 2025 Q1（已有目標）
點擊「Bulk Operations」
選擇「Apply Growth」
目標期間：2025 Q1
成長率：50（再增加 50%）
執行

# 步驟 3: 驗證調整
刷新頁面
確認所有金額增加 50%
```

---

## 🔍 數據驗證檢查點

### 資料庫狀態
```bash
# 進入專案目錄
cd "/Users/terrelyeh/Documents/Hubspot Dashboard/hubspot-dashboard"

# 打開 Prisma Studio
npx prisma studio

# 檢查項目：
✓ Region 表：5 筆記錄
✓ Deal 表：320 筆記錄
✓ Target 表：11+ 筆記錄（視測試而定）
✓ StageProbability 表：6 筆記錄
✓ ExchangeRate 表：3 筆記錄（USD, JPY, INR）
```

### API 端點健康檢查
```bash
# 1. Regions API
curl -s http://localhost:3001/api/regions | jq '{success, count: (.regions | length)}'
# 預期：success: true, count: 5

# 2. Deals API
curl -s "http://localhost:3001/api/deals?limit=1" | jq '{success, total}'
# 預期：success: true, total: 320

# 3. Forecast API (所有區域)
for region in US APAC IN JP EU; do
  curl -s "http://localhost:3001/api/forecast?region=$region&year=2024&quarter=3" | \
    jq -r '"\(.region.name): \(.forecast.achievementRateFormatted)"'
done
# 預期：所有區域都顯示達成率

# 4. Targets API
curl -s "http://localhost:3001/api/targets" | jq '.total'
# 預期：數字 >= 5
```

---

## 🎨 UI/UX 檢查清單

### 響應式設計
```
□ 在桌面瀏覽器中正常顯示（> 1024px）
□ 在平板模式下正常顯示（768-1024px）
  - Chrome DevTools → Toggle device toolbar → iPad
□ 在手機模式下正常顯示（< 768px）
  - Chrome DevTools → Toggle device toolbar → iPhone
□ 圖表自動調整大小
□ 表格可橫向滾動
```

### 互動性
```
□ 卡片 hover 效果正常
□ 按鈕 hover 變色
□ 圖表 tooltip 顯示
□ 表格列 hover 高亮
□ 導航連結正常
□ 返回按鈕功能
```

### 載入狀態
```
□ Dashboard 載入時顯示轉圈動畫
□ Targets 載入時顯示轉圈動畫
□ Bulk operation 執行時顯示 "Processing..."
□ 錯誤訊息正確顯示（紅色警告框）
```

---

## 🐛 已知問題和限制

### 目前限制
1. **Dashboard 固定期間**: 目前 Dashboard 只顯示 Q3 2024 數據
   - 未來可增加期間選擇器

2. **Mock 數據**: 所有交易數據都是模擬的
   - Phase 3 將連接真實 HubSpot API

3. **無使用者認證**: 目前無登入功能
   - 所有使用者都能存取所有區域

4. **無審計日誌**: Target 變更沒有記錄歷史
   - 未來可增加 audit log

### 效能注意事項
1. **320 筆交易**: 目前數量較少，查詢速度快
   - 真實環境可能有數千筆，需要考慮分頁

2. **圖表渲染**: Recharts 在大量數據時可能較慢
   - 建議限制顯示數量或使用虛擬化

---

## 📊 測試數據摘要

### 區域統計
| 區域 | 代碼 | 貨幣 | 交易數 | Pipeline | Target | Achievement |
|------|------|------|--------|----------|--------|-------------|
| United States | US | USD | 60 | $15.24M | $3.00M | 340.9% |
| Asia Pacific | APAC | USD | 71 | $19.37M | $2.40M | 321.4% |
| India | IN | INR | 68 | $16.28M | $1.50M | 658.5% |
| Japan | JP | JPY | 66 | $17.98M | $2.10M | 328.7% |
| Europe | EU | USD | 55 | $13.38M | $2.70M | 192.1% |
| **總計** | - | - | **320** | **$82.25M** | **$12.70M** | **493.0%** |

### 階段分佈（全域）
- Lead (10%): ~53 deals
- Qualified (30%): ~54 deals
- Proposal (50%): ~53 deals
- Negotiation (75%): ~53 deals
- Contract (90%): ~53 deals
- Closed Won (100%): ~54 deals

---

## 🚀 下一步測試

1. **效能測試**
   - 增加更多交易數據（1000+ 筆）
   - 測試大量目標的載入時間

2. **壓力測試**
   - 同時開啟多個區域詳細頁
   - 快速切換期間篩選器

3. **邊界測試**
   - 輸入無效的成長率（負數、超大數字）
   - 嘗試建立重複目標
   - 刪除不存在的目標

4. **跨瀏覽器測試**
   - Chrome ✓（開發用）
   - Safari
   - Firefox
   - Edge

---

**測試愉快！** 🎉

如有任何問題或發現 bug，請記錄下來以便後續修正。
