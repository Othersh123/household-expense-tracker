# Household Expense Tracker — Setup Guide

## 1. Install Node.js
Download from https://nodejs.org (LTS version). Verify: `node -v && npm -v`

## 2. Install dependencies
```bash
npm install
```

## 3. Google Cloud setup (one-time)

### a) Create a Google Cloud Project
1. Go to https://console.cloud.google.com
2. New Project → enable **Google Sheets API**
3. OAuth Consent Screen → External → add your email as test user
4. Credentials → Create OAuth 2.0 Client ID → Web Application
   - Authorised redirect URIs: `https://your-vercel-app.vercel.app/auth/callback`  
     (for local dev add: `http://localhost:5173/auth/callback`)
5. Copy **Client ID** and **Client Secret**

### b) Create your Google Sheet
1. Create a new Google Sheet at sheets.google.com
2. Rename **Sheet1** tab (keep it as "Sheet1")
3. Add this header row in Row 1:
   `Date | Amount | Merchant | Category | Payment Method | Person | Account/Card | Source | Notes | Logged At`
4. Copy the Sheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/THIS_IS_THE_SHEET_ID/edit`

## 4. Environment variables

### For local dev — create `.env.local`:
```
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
```

### For Vercel — add in Project Settings → Environment Variables (same keys)

## 5. Get a Gemini API key
1. Go to https://aistudio.google.com/app/apikey
2. Create API key → copy it

## 6. Run locally
```bash
npm run dev
```
Open http://localhost:5173 — tap "Connect Google Sheets" to authorize once.

## 7. Deploy to Vercel
```bash
npm install -g vercel
vercel
```
Or push to GitHub and import the repo at vercel.com.
Set all 5 environment variables in Vercel dashboard before deploying.

## 8. PWA icons
Place `icon-192.png` (192×192) and `icon-512.png` (512×512) in `public/icons/`.
Generate free icons at https://favicon.io — use background color `#6366f1`.

## Architecture summary

```
src/
├── pages/          Dashboard, AddExpense, AuthCallback
├── components/
│   ├── AddExpense/ ManualTab, SmsTab, ScreenshotTab, ReviewForm
│   ├── Dashboard/  SummaryCards, CategoryChart, PersonBreakdown, RecentTransactions
│   ├── AuthGate    Protects all routes; shows Connect button if not authorized
│   └── Layout      Bottom nav + header shell
├── context/        AuthContext (OAuth token state)
├── utils/          smsParser.js, formatters.js
└── constants.js    Categories, PaymentMethods, Persons

api/
├── auth/           url.js, callback.js, status.js, revoke.js
├── sheets/         append.js, read.js
├── _lib/           getAccessToken.js (auto-refresh logic)
└── parse-screenshot.js  (Gemini Flash vision)
```
