export const translations = {
  en: {
    // Header
    dashboard: 'Dashboard',
    globalDashboard: 'Global Dashboard',
    settings: 'Settings',

    // Filters
    filters: 'Filters',
    year: 'Year',
    quarter: 'Quarter',
    dealOwner: 'Deal Owner',
    dealStage: 'Deal Stage',
    forecastCategory: 'Forecast Category',
    allOwners: 'All Owners',
    allStages: 'All Stages',
    allCategories: 'All Categories',

    // Performance Overview
    performanceOverview: 'Performance Overview',
    goalProgress: 'Goal Progress',
    pipelineValue: 'Pipeline Value',
    newDealAmount: 'New Deal Amount',
    openDeals: 'Open Deals',
    commitRevenue: 'Commit Revenue',
    closedWon: 'Closed Won',
    weightedForecast: 'Weighted Forecast',
    target: 'Target',
    achievement: 'Achievement',
    forecastCoverageLabel: 'Forecast Coverage',
    closedWonVsTarget: 'Closed Won vs Target',
    expectedIfForecastCloses: 'expected if forecast closes',
    // Performance Card Subtitles
    totalOpportunityValue: 'total opportunity value',
    xNewDeals: '{count} new deals',
    xActiveDeals: '{count} active deals',
    xHighConfidence: '{count} high confidence',
    xDealsWon: '{count} deals won',
    weightedByProbability: 'weighted by probability',
    quarterGoal: 'Q{quarter} {year} goal',
    exceedingTarget: '✓ Exceeding Target',
    onTrack: '↗ On Track',
    behindTarget: '↘ Behind Target',
    setTargetsToTrack: 'Set targets to track',

    // Loading
    loadingDashboard: 'Loading Dashboard...',
    firstLoadMessage: 'Fetching data from HubSpot API. First load may take 10-15 seconds.',

    // Activity Metrics
    activityMetrics: 'Activity Metrics',
    totalDeals: 'Total Deals',
    newDeals: 'New Deals',
    closedLost: 'Closed Lost',
    winRate: 'Win Rate',
    vsLastQuarter: 'vs last quarter',
    improvement: 'improvement',
    clickToViewAllDeals: 'Click to view all deals →',

    // Slideout Panel Titles
    newDealsCreated: 'New Deals Created This Quarter',
    closedWonDeals: 'Closed Won Deals',
    closedLostDeals: 'Closed Lost Deals',
    allPipelineDeals: 'All Pipeline Deals',
    openDealsNotClosed: 'Open Deals (Not Closed)',
    commitDealsHighConfidence: 'Commit Deals (High Confidence)',

    // Forecast Confidence
    forecastConfidence: 'Forecast Confidence',
    commit: 'Commit',
    bestCase: 'Best Case',
    pipeline: 'Pipeline',
    deals: 'deals',
    clickToViewDeals: 'Click to view deals',

    // Alerts & Risks
    alertsAndRisks: 'Alerts & Risks',
    gapToTarget: 'Gap to Target',
    staleDeals: 'Stale Deals',
    staleDealsFull: 'Stale Deals (>14 days without update)',
    atRisk: 'at risk',
    largeDealsClosing: 'Large Deals Closing',
    largeDealsFull: 'Large Deals Closing Soon (>$100K)',
    inPipeline: 'in pipeline',
    allDealsUpToDate: 'All deals up to date',

    // Top Deals Table
    topDeals: 'Top Deals',
    deal: 'Deal',
    amount: 'Amount',
    owner: 'Owner',
    location: 'Location',
    category: 'Category',
    stage: 'Stage',
    probability: 'Prob',
    updated: 'Updated',
    daysAgo: 'd ago',
    close: 'Close',
    show: 'Show',
    rankBy: 'Rank by',
    deployTime: 'Deploy Date',
    highestAmount: 'Highest Amount',
    closingSoonest: 'Closing Soonest',
    deployingSoonest: 'Deploying Soonest',
    closedRecently: 'Recently Closed',
    deployedRecently: 'Recently Deployed',
    recentlyUpdated: 'Recently Updated',

    // Pipeline by Stage
    pipelineByStage: 'Pipeline by Stage',
    weighted: 'Weighted',

    // Product Summary
    productSummary: 'Product Summary',
    totalQuantity: 'Total Quantity',
    totalValue: 'Total Value',
    product: 'Product',
    qty: 'Qty',
    showing: 'Showing',
    commitQty: 'Commit',
    bestCaseQty: 'Best Case',
    products: 'products',
    of: 'of',
    prev: 'Prev',
    next: 'Next',

    // Forecast by Month
    forecastByMonth: 'Forecast by Month',
    ofTarget: 'of target',
    noTargetSet: 'No target set',
    quarterTotal: 'Quarter Total',
    forecast: 'Forecast',

    // Footer
    poweredBy: 'Powered by HubSpot CRM',

    // Slideout
    total: 'Total',
    viewDetails: 'View Details',
    lineItems: 'Line Items',
    contacts: 'Contacts',
    viewInHubSpot: 'View in HubSpot',
    closeDate: 'Close Date',
    createdDate: 'Created',
    lastUpdated: 'Last Updated',
    dealStageLabel: 'Deal Stage',
    probabilityLabel: 'Probability',
    forecastCategoryLabel: 'Forecast',
    noLineItems: 'No line items',
    noContacts: 'No contacts',

    // Mock Data Warning
    mockDataWarning: 'Showing mock data for demonstration',

    // Sync
    sync: 'Sync',
    syncing: 'Syncing...',
    syncFromHubSpot: 'Sync data from HubSpot',
    syncSuccess: 'Synced! {created} created, {updated} updated',
    syncFailed: 'Sync failed',

    // Language
    language: 'Language',
    english: 'English',
    japanese: '日本語',

    // Time Period
    timePeriod: 'Time Period',
    currentQuarter: 'Current Quarter',
    previousQuarter: 'Previous Quarter',
    yearToDate: 'Year to Date',
    firstHalf: 'H1',
    secondHalf: 'H2',
    fullYear: 'Full Year',
    custom: 'Custom',
    from: 'From',
    to: 'To',

    // Target Coverage
    allQuartersHaveTargets: 'Targets set for all {count} quarters',
    partialTargetCoverage: 'Targets set for {covered}/{total} quarters',
    missingQuarters: 'Missing',
    missingTargetsWarning: 'Some quarters are missing targets. Achievement rate is calculated based on available targets only.',

    // Owner Target Not Set
    targetNotSet: 'Target Not Set',
    ownerTargetNotSetDescription: 'This owner has no personal target set',
    goToSetTarget: 'Go to Settings',
  },

  ja: {
    // Header
    dashboard: 'ダッシュボード',
    globalDashboard: 'グローバルダッシュボード',
    settings: '設定',

    // Filters
    filters: 'フィルター',
    year: '年度',
    quarter: '四半期',
    dealOwner: '担当者',
    dealStage: 'ステージ',
    forecastCategory: '予測カテゴリ',
    allOwners: 'すべての担当者',
    allStages: 'すべてのステージ',
    allCategories: 'すべてのカテゴリ',

    // Performance Overview
    performanceOverview: 'パフォーマンス概要',
    goalProgress: '目標進捗',
    pipelineValue: 'パイプライン金額',
    newDealAmount: '新規案件金額',
    openDeals: '進行中案件',
    commitRevenue: 'コミット収益',
    closedWon: '受注',
    weightedForecast: '加重予測',
    target: '目標',
    achievement: '達成率',
    forecastCoverageLabel: '予測カバー率',
    closedWonVsTarget: '受注額 vs 目標',
    expectedIfForecastCloses: '予測成約時の期待値',
    // Performance Card Subtitles
    totalOpportunityValue: '総案件金額',
    xNewDeals: '{count}件の新規案件',
    xActiveDeals: '{count}件の進行中案件',
    xHighConfidence: '{count}件の高確度案件',
    xDealsWon: '{count}件の受注',
    weightedByProbability: '確率加重済み',
    quarterGoal: '{year}年Q{quarter}の目標',
    exceedingTarget: '✓ 目標超過',
    onTrack: '↗ 順調',
    behindTarget: '↘ 目標未達',
    setTargetsToTrack: '目標を設定して追跡',

    // Loading
    loadingDashboard: 'ダッシュボードを読み込み中...',
    firstLoadMessage: 'HubSpot APIからデータを取得しています。初回読み込みには10〜15秒かかる場合があります。',

    // Activity Metrics
    activityMetrics: 'アクティビティ指標',
    totalDeals: '総案件数',
    newDeals: '新規案件',
    closedLost: '失注',
    winRate: '受注率',
    vsLastQuarter: '前四半期比',
    improvement: '改善',
    clickToViewAllDeals: 'クリックして全案件を表示 →',

    // Slideout Panel Titles
    newDealsCreated: '今四半期の新規案件',
    closedWonDeals: '受注案件',
    closedLostDeals: '失注案件',
    allPipelineDeals: '全パイプライン案件',
    openDealsNotClosed: '進行中案件（未クローズ）',
    commitDealsHighConfidence: 'コミット案件（高確度）',

    // Forecast Confidence
    forecastConfidence: '予測信頼度',
    commit: 'コミット',
    bestCase: 'ベストケース',
    pipeline: 'パイプライン',
    deals: '件',
    clickToViewDeals: 'クリックして案件を表示',

    // Alerts & Risks
    alertsAndRisks: 'アラート・リスク',
    gapToTarget: '目標との差',
    staleDeals: '停滞案件',
    staleDealsFull: '停滞案件（14日以上更新なし）',
    atRisk: 'リスク金額',
    largeDealsClosing: '大型案件クロージング',
    largeDealsFull: 'クロージング間近の大型案件（$100K以上）',
    inPipeline: 'パイプライン内',
    allDealsUpToDate: 'すべての案件は最新です',

    // Top Deals Table
    topDeals: 'トップ案件',
    deal: '案件',
    amount: '金額',
    owner: '担当者',
    location: 'ロケーション',
    category: 'カテゴリ',
    stage: 'ステージ',
    probability: '確率',
    updated: '更新',
    daysAgo: '日前',
    close: 'クローズ',
    show: '表示',
    rankBy: '順位基準',
    deployTime: '部署日期',
    highestAmount: '金額が高い順',
    closingSoonest: 'クローズが近い順',
    deployingSoonest: '部署が近い順',
    closedRecently: '最近クローズ順',
    deployedRecently: '最近部署順',
    recentlyUpdated: '最近更新順',

    // Pipeline by Stage
    pipelineByStage: 'ステージ別パイプライン',
    weighted: '加重',

    // Product Summary
    productSummary: '製品サマリー',
    totalQuantity: '総数量',
    totalValue: '総金額',
    product: '製品',
    qty: '数量',
    showing: '表示中',
    commitQty: 'コミット',
    bestCaseQty: 'ベストケース',
    products: '製品',
    of: '/',
    prev: '前へ',
    next: '次へ',

    // Forecast by Month
    forecastByMonth: '月別予測',
    ofTarget: '目標比',
    noTargetSet: '目標未設定',
    quarterTotal: '四半期合計',
    forecast: '予測',

    // Footer
    poweredBy: 'Powered by HubSpot CRM',

    // Slideout
    total: '合計',
    viewDetails: '詳細を見る',
    lineItems: '商品明細',
    contacts: '連絡先',
    viewInHubSpot: 'HubSpotで見る',
    closeDate: 'クローズ予定日',
    createdDate: '作成日',
    lastUpdated: '最終更新',
    dealStageLabel: 'ステージ',
    probabilityLabel: '確率',
    forecastCategoryLabel: '予測',
    noLineItems: '商品明細なし',
    noContacts: '連絡先なし',

    // Mock Data Warning
    mockDataWarning: 'デモ用のモックデータを表示中',

    // Sync
    sync: '同期',
    syncing: '同期中...',
    syncFromHubSpot: 'HubSpotからデータを同期',
    syncSuccess: '同期完了！ {created}件作成, {updated}件更新',
    syncFailed: '同期失敗',

    // Language
    language: '言語',
    english: 'English',
    japanese: '日本語',

    // Time Period
    timePeriod: '期間',
    currentQuarter: '今四半期',
    previousQuarter: '前四半期',
    yearToDate: '年初来',
    firstHalf: '上半期',
    secondHalf: '下半期',
    fullYear: '通年',
    custom: 'カスタム',
    from: '開始',
    to: '終了',

    // Target Coverage
    allQuartersHaveTargets: '全{count}四半期の目標が設定済み',
    partialTargetCoverage: '{covered}/{total}四半期の目標のみ設定',
    missingQuarters: '未設定',
    missingTargetsWarning: '一部の四半期に目標が設定されていません。達成率は設定済みの目標のみで計算されます。',

    // Owner Target Not Set
    targetNotSet: '目標未設定',
    ownerTargetNotSetDescription: 'この担当者の個人目標が設定されていません',
    goToSetTarget: '設定へ移動',
  }
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;
