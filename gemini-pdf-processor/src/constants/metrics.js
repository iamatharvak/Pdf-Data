// src/constants/metrics.js
export const FINANCIAL_METRICS = {
  "Business Metrics": [
    "AUM (mn)",
    "Disbursement",
    "Number of Branches",
    "Number of States & UT",
  ],
  "Granular Metrics": [
    "Number of Live Accounts",
    "Average Ticket Size",
    "Number of Employees",
  ],
  "Yield & Spread Metrics": ["Yield", "Cost of Fund", "Spread", "NIM %"],
  "Quality Metrics": ["GNPA", "NNPA"],
  "Profitability Metrics": ["Return on Asset", "Return on Equity", "PAT"],
  // "Liability Profile": ["Floating", "Fixed", "Equity"],
};

// src/constants/config.js
export const API_CONFIG = {
  API_KEY: "6DMS7QNAQ4I7S0B9",
  BASE_URL: "https://www.alphavantage.co/query",
  FILE_API_URL: "http://localhost:5000",
};

export const DEFAULT_SYMBOL = "AAPL";
