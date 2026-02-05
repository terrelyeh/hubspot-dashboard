# Currency Support Documentation

## 概述

系統現在支援多幣別交易，會自動從 HubSpot 抓取每筆交易的貨幣代碼，並自動轉換為美金（USD）進行統計和分析。

## 功能特色

### 1. 自動貨幣偵測
- 從 HubSpot API 讀取 `deal_currency_code` 屬性
- 支援所有 HubSpot 支援的貨幣（USD, JPY, EUR, GBP, CNY, KRW, SGD, HKD, AUD, CAD 等）

### 2. 即時匯率轉換
- 使用 exchangerate-api.com 提供的即時匯率
- 自動將所有交易金額轉換為美金（USD）進行統一計算
- 匯率快取 24 小時，減少 API 呼叫次數

### 3. 資料庫儲存
每筆交易儲存以下資訊：
- `amount`: 原始金額
- `currency`: 原始貨幣代碼（例如：JPY, USD）
- `amountUsd`: 轉換後的美金金額
- `exchangeRate`: 使用的匯率

### 4. 容錯機制
- 如果匯率 API 失敗，使用內建的備用匯率
- 如果交易沒有貨幣代碼，預設為 USD

## 目前資料狀態

根據最新同步結果，您的 HubSpot 資料：

```
Deal 1: abc company
- 原始金額: $1,946.9 USD
- 轉換後: $1,946.9 USD
- 匯率: 1.0

Deal 2: xxxxxx
- 原始金額: $33,989.9 USD
- 轉換後: $33,989.9 USD
- 匯率: 1.0
```

## 支援的貨幣範例

### 日圓 (JPY)
```
原始金額: ¥5,000,000 JPY
目前匯率: 1 JPY = $0.00642 USD (約 156 JPY = 1 USD)
轉換後: $32,100 USD
```

### 歐元 (EUR)
```
原始金額: €10,000 EUR
匯率: 1 EUR ≈ $1.08 USD
轉換後: $10,800 USD
```

### 英鎊 (GBP)
```
原始金額: £8,000 GBP
匯率: 1 GBP ≈ $1.27 USD
轉換後: $10,160 USD
```

### 人民幣 (CNY)
```
原始金額: ¥50,000 CNY
匯率: 1 CNY ≈ $0.14 USD
轉換後: $7,000 USD
```

### 韓元 (KRW)
```
原始金額: ₩10,000,000 KRW
匯率: 1 KRW ≈ $0.00075 USD (約 1,330 KRW = 1 USD)
轉換後: $7,500 USD
```

## 技術實作

### 1. HubSpot Client 更新
```typescript
// 新增 deal_currency_code 屬性
interface HubSpotDeal {
  properties: {
    amount: string;
    deal_currency_code?: string; // 新增
    // ... 其他屬性
  };
}
```

### 2. Currency Conversion Service
```typescript
// 自動匯率轉換
import { convertCurrency } from '@/lib/currency';

const conversion = await convertCurrency(amount, 'JPY', 'USD');
// Returns: { amount: 32100, rate: 0.00642 }
```

### 3. 匯率快取機制
- 匯率儲存在 `ExchangeRate` 資料表
- 每日自動更新
- 減少外部 API 呼叫，提升效能

## 未來擴充

### 可能的增強功能：
1. **多幣別儀表板**: 顯示原始貨幣和美金等值
2. **匯率歷史追蹤**: 記錄匯率變化趨勢
3. **手動匯率設定**: 允許使用固定匯率
4. **多基準貨幣**: 支援以日圓或歐元為基準
5. **貨幣風險分析**: 分析匯率波動對管線的影響

## 測試方式

### 1. 查看當前交易的貨幣資訊
```bash
sqlite3 prisma/dev.db "SELECT name, amount, currency, amountUsd, exchangeRate FROM Deal WHERE hubspotId NOT LIKE 'mock-%';"
```

### 2. 查看匯率快取
```bash
sqlite3 prisma/dev.db "SELECT fromCurrency, toCurrency, rate, date FROM ExchangeRate ORDER BY createdAt DESC LIMIT 10;"
```

### 3. 手動觸發同步
```bash
curl -X POST "http://localhost:3000/api/hubspot/sync"
```

## 匯率 API 資訊

- **提供商**: exchangerate-api.com
- **免費額度**: 1,500 requests/月
- **更新頻率**: 每日
- **可靠性**: 有備用匯率機制

## 注意事項

1. **匯率時效性**: 匯率每 24 小時更新一次
2. **API 額度**: 免費方案有月度限制，建議監控使用量
3. **歷史交易**: 使用交易當日的匯率快照
4. **四捨五入**: 金額保留到小數點後 2 位

## 相關檔案

- `/src/lib/currency.ts` - 貨幣轉換服務
- `/src/lib/hubspot/client.ts` - HubSpot API 客戶端
- `/src/lib/hubspot/sync.ts` - 同步服務
- `/prisma/schema.prisma` - 資料庫結構定義

## 常見問題

**Q: 如果 HubSpot 中的交易沒有設定貨幣會怎樣？**
A: 系統會預設為 USD，匯率為 1.0。

**Q: 匯率多久更新一次？**
A: 系統會快取匯率 24 小時，每天自動更新。

**Q: 可以手動設定固定匯率嗎？**
A: 目前使用即時匯率，未來可以新增手動設定功能。

**Q: 支援哪些貨幣？**
A: 支援 exchangerate-api.com 提供的所有貨幣，包括主要的 160+ 種國際貨幣。

**Q: 如果匯率 API 失敗會怎樣？**
A: 系統會使用內建的備用匯率，確保同步不會中斷。
