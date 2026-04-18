# 💰 Household Expense Tracker

A mobile-first Progressive Web App that helps couples track shared household expenses — built with React, Google Sheets, and Gemini Flash vision API.

**Live app:** [expense-tracker-six-mu-10.vercel.app](https://expense-tracker-six-mu-10.vercel.app)

---

## The Problem

My wife and I spend across multiple UPI apps, credit cards, and bank accounts. There was no single place to see where our money was going — transactions were scattered across GPay, PhonePe, bank SMSes, and credit card alerts. Every existing app either required too much manual input or cost money we didn't want to spend on a utility tool.

## The Solution

A PWA that makes logging a transaction take under 30 seconds — by letting AI do the parsing. You paste a bank SMS or upload a payment screenshot, review what was extracted, confirm, and it's in your shared Google Sheet. No app store, no subscriptions, no backend to maintain.

---

## What I Built

### Three ways to log a transaction

**SMS paste** — paste any Indian bank or UPI transaction SMS. Regex patterns extract the amount, merchant, date, and account automatically and populate a review form.

**Screenshot upload** — upload a GPay, PhonePe, or Paytm transaction screenshot. Gemini Flash vision API reads the image and extracts the transaction details.

**Manual entry** — a clean form for cases where neither of the above applies.

All three methods show a review step before saving — the user always sees what was parsed and can edit any field before confirming. Nothing is saved silently.

### Dashboard

- Total spent this week and this month
- Spending by category (chart)
- Husband vs wife breakdown with percentage split
- Drill-down filters by payment method and specific card/account
- Recent transactions grouped by date

### Transactions tab

Full transaction history with search, date range filter (7 days to 1 year), and the same payment method drill-down as the dashboard.

---

## AI Stack

| Purpose | Approach |
|---|---|
| Screenshot parsing | Gemini 2.5 Flash vision API |
| SMS parsing | Custom regex — free, no API needed |

The decision to use regex for SMS and AI only for screenshots was deliberate. Indian bank SMSes are structured enough that regex handles them at ~90% accuracy with zero ongoing cost. AI is reserved for screenshots where the layout varies significantly across apps and regex would be brittle.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite PWA |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Screenshot parsing | Google Gemini 2.5 Flash |
| Database | Google Sheets API |
| Auth | Google OAuth 2.0 |
| Backend | Vercel serverless functions |
| Hosting | Vercel |

Google Sheets as the database was an intentional choice over a traditional DB — it's free, both partners can see and edit the raw data directly, and there's no admin interface to build or maintain. At household scale, a Sheet is more than sufficient.

---

## Product Decisions & Tradeoffs

**Gmail sync was cut from scope.**
The original spec included parsing credit card alert emails via Gmail API. This was dropped — OAuth for two Gmail accounts adds significant complexity, and SMS parsing achieves the same outcome for free. The simpler path won.

**No user authentication.**
A person dropdown ("Adar" / "Ramya") is sufficient for a two-person household tool. Adding login flows would have added weeks of complexity for zero user benefit.

**PWA over native app.**
A single React PWA works on both iPhone and Android, deploys instantly, and requires no App Store approval. For a personal household tool this is the right call — the trade-off is slightly less native feel on iOS, which is acceptable.

**Review step is mandatory.**
Every input method — manual, SMS, screenshot — shows the parsed result in an editable form before saving. This was a deliberate product decision to prevent silent parsing errors from polluting the data over time. A wrong transaction is harder to fix than an extra tap to confirm.

**Regex over AI for SMS.**
Gemini API calls cost money and have rate limits. Indian bank SMSes follow consistent enough formats that regex handles them reliably. AI is only invoked for screenshots where variability is genuinely high.

---

## Running This Yourself

You'll need: Node.js 18+, a Google Cloud project with Sheets and Drive APIs enabled, a Gemini API key from [aistudio.google.com](https://aistudio.google.com), and a Vercel account.

Clone the repo, run `npm install`, create a `.env.local` with the five environment variables listed in `.env.example`, and run `vercel dev`.

Full setup instructions are in [SETUP.md](./SETUP.md).

---

## Project Structure

```
household-expense-tracker/
├── api/                        # Vercel serverless functions
│   ├── auth/                   # Google OAuth handlers
│   ├── parse-screenshot.js     # Gemini vision API proxy
│   └── sheets/                 # Google Sheets read/write
├── public/
│   ├── icons/                  # PWA icons
│   └── manifest.json           # PWA manifest
├── src/
│   ├── components/
│   │   ├── AddExpense/         # Manual, SMS, Screenshot input tabs
│   │   └── Dashboard/          # Charts and summary cards
│   ├── context/                # Auth and user context
│   ├── pages/                  # Route-level components
│   └── utils/
│       └── smsParser.js        # Indian bank SMS regex patterns
└── vercel.json
```

---

## Google Sheet Schema

| Column | Type | Notes |
|---|---|---|
| Date | Date | YYYY-MM-DD |
| Amount | Number | Plain number, no ₹ symbol |
| Merchant | String | Business name or UPI ID |
| Category | String | Rent / Groceries / Food & Dining / Transport / Utilities / Shopping / Entertainment / Health / Other |
| Payment Method | String | UPI / Credit Card / Debit Card / Cash |
| Person | String | Set during onboarding |
| Account / Card | String | e.g. HDFC Regalia, GPay |
| Source | String | Manual / SMS / Screenshot |
| Notes | String | Optional |
| Logged At | Timestamp | Auto-generated |

---

## License

MIT
