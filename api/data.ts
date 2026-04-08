// self-contained static data to ensure Vercel deployment works without server/ dependencies
export const MOCK_USER = {
  id: "guest-user",
  openId: "guest",
  name: "Guest User",
  email: "guest@finedge.local",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export const MOCK_PORTFOLIO = [
  {
    id: "p1",
    userId: "guest-user",
    name: "Growth Portfolio",
    description: "Technology and AI focused equities",
    type: "EQUITY",
    totalValue: 125000,
    performance: 12.5,
    createdAt: new Date(),
  },
  {
    id: "p2",
    userId: "guest-user",
    name: "Safe Haven",
    description: "Stable assets and bonds",
    type: "FIXED_INCOME",
    totalValue: 45000,
    performance: 4.2,
    createdAt: new Date(),
  }
];

export const MOCK_MARKET_SUMMARY = {
  insight: "The market is showing strong resilience in the tech sector, particularly following the recent earnings reports from major AI players. Investors are increasingly optimistic about defensive positions as macroeconomic indicators stabilize.",
  sentiment: "Bullish",
  topGainers: [
    { symbol: "NVDA", price: 825.40, change: 4.2 },
    { symbol: "MSFT", price: 415.10, change: 1.8 }
  ],
  topLosers: [
    { symbol: "TSLA", price: 175.20, change: -3.5 },
  ],
  recommendations: [
    "Increase exposure to semiconductor leaders.",
    "Maintain cash reserves for mid-cycle dips."
  ]
};

export const MOCK_MARKET_DATA = [
  { symbol: "BTC/USD", price: 67200, change: 2.1, volume: "32B" },
  { symbol: "ETH/USD", price: 3450, change: 1.8, volume: "15B" },
  { symbol: "SPY", price: 512.4, change: 0.5, volume: "80M" },
  { symbol: "QQQ", price: 442.1, change: 0.8, volume: "50M" },
];
