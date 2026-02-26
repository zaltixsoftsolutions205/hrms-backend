# Finance Module - Structure & Integration Plan

## Overview
Finance module for tracking income and expenses. Admin-only access. Auto-syncs CRM deal revenue.

---

## 1. DATABASE SCHEMA

### Income Model (`backend/models/Income.js`)
```
{
  _id: ObjectId
  type: enum ['deal', 'manual'] // 'deal' = auto-sync from CRM, 'manual' = manual entry
  amount: Number (required)
  date: Date (required)
  description: String
  dealId: ObjectId (ref: Deal, required if type='deal', null if type='manual')
  serviceType: String // populated from deal.serviceType when type='deal'
  syncedAt: Date // timestamp when synced from deal
  createdBy: ObjectId (ref: User)
  notes: String
  createdAt: Timestamp
  updatedAt: Timestamp
}

Indexes:
- { date: -1 }
- { type: 1 }
- { dealId: 1, unique: true } // each deal synced only once
- { serviceType: 1 }
```

### Expense Model (`backend/models/Expense.js`)
```
{
  _id: ObjectId
  category: enum ['salary', 'commission', 'rent', 'software', 'marketing', 'operational', 'custom']
  amount: Number (required)
  date: Date (required)
  description: String (required)
  customCategory: String // used when category='custom'
  receiptPath: String // optional file path to uploaded receipt
  receiptFileName: String // original filename
  createdBy: ObjectId (ref: User)
  notes: String
  status: enum ['pending', 'approved', 'rejected'] (default: 'pending')
  approvedBy: ObjectId (ref: User) // which admin approved it
  createdAt: Timestamp
  updatedAt: Timestamp
}

Indexes:
- { date: -1 }
- { category: 1 }
- { status: 1 }
- { createdBy: 1 }
```

### ExpenseCategory Model (`backend/models/ExpenseCategory.js`)
```
{
  _id: ObjectId
  name: String (enum: 'salary', 'commission', 'rent', 'software', 'marketing', 'operational', 'custom')
  label: String // display name
  description: String
  isDefault: Boolean // predefined vs custom
  color: String // hex color for charts
  createdAt: Timestamp
}

Pre-seeded Categories:
- Salary (red)
- Commission (orange)
- Rent (blue)
- Software (purple)
- Marketing (green)
- Operational (gray)
- Custom (neutral)
```

---

## 2. BACKEND STRUCTURE

### Routes (`backend/routes/finance.js`)

**Income Endpoints:**
```
GET    /api/finance/income                    // list income with filters
GET    /api/finance/income/stats              // stats for dashboard
GET    /api/finance/income/:id                // single income
POST   /api/finance/income                    // create manual income
DELETE /api/finance/income/:id                // delete income (admin only)
POST   /api/finance/income/sync-deals         // manual trigger to sync CRM deals

Filters: ?month=2&year=2026&type=deal&serviceType=web-mobile-apps
```

**Expense Endpoints:**
```
GET    /api/finance/expenses                  // list expenses with filters
GET    /api/finance/expenses/stats            // stats for dashboard
GET    /api/finance/expenses/:id              // single expense
POST   /api/finance/expenses                  // create expense (multipart for receipt)
PUT    /api/finance/expenses/:id              // update expense
DELETE /api/finance/expenses/:id              // delete expense
PUT    /api/finance/expenses/:id/approve      // approve expense (admin only)
PUT    /api/finance/expenses/:id/reject       // reject expense

Filters: ?month=2&year=2026&category=salary&status=pending
```

**Dashboard Endpoints:**
```
GET    /api/finance/dashboard                 // all dashboard data
GET    /api/finance/reports/yearly            // yearly summary
GET    /api/finance/reports/by-category       // expense breakdown
GET    /api/finance/reports/by-service        // revenue by service type
GET    /api/finance/reports/profit-by-service // profit margin by service
```

### Controller (`backend/controllers/financeController.js`)

**Key Functions:**

```javascript
// Income
- getIncome()              // list with pagination + filters
- getIncomeStats()         // total, monthly breakdown, avg
- getIncomeById()          // single record with deal details
- createIncome()           // manual entry only
- deleteIncome()           // only admin, only manual entries

// Expense
- getExpenses()            // list with filters
- getExpenseStats()        // total by category, monthly breakdown
- getExpenseById()         // single with receipt details
- createExpense()          // multipart form support
- updateExpense()          // partial updates
- deleteExpense()          // only admin, only if pending
- approveExpense()         // mark as approved
- rejectExpense()          // mark as rejected with reason

// Dashboard
- getDashboardData()       // combined: income stats, expense stats, profit/loss
- getYearlyReport()        // yearly totals by month
- getByCategory()          // expense breakdown
- getByService()           // revenue by service type from deals
- getProfitByService()     // revenue - related expenses by service

// Sync
- syncDealsToIncome()      // auto-trigger when deal is won
- syncDealsManually()      // admin can manually sync

// Helpers
- calculateMonthlyProfit() // revenue - expenses
- getExpensesByCategory()  // aggregation pipeline
- getServiceTypeRevenue()  // from deals
```

### Integration with Existing Code

**1. Deal Controller (Modify `closeDeal` function):**
```javascript
// When deal.status becomes 'won', trigger:
await financeController.syncDealAsIncome(deal)
  // Creates Income record with type='deal', amount=finalDealAmount
  // Prevents duplicate syncs with unique dealId index
```

**2. Payslip Controller (No Changes Needed):**
```
// Commission logic stays in payslip/deal
// When payslip is generated, commission is deducted from deal
// Finance module only reflects the deal revenue, not commission separately
// (unless we want to track commission as expense - see Optional Enhancement)
```

**3. Authentication:**
```javascript
// Add to roleCheck middleware
router.use(protect)
router.use(roleCheck('admin')) // Finance is admin-only
```

---

## 3. FRONTEND STRUCTURE

### File Organization
```
frontend/src/
├── pages/
│   └── Admin/
│       ├── AdminPage.jsx (main routing)
│       └── Finance/
│           ├── FinancePage.jsx (main container)
│           ├── Dashboard.jsx (KPIs + charts)
│           ├── Income/
│           │   ├── IncomeList.jsx
│           │   └── IncomeForm.jsx
│           ├── Expenses/
│           │   ├── ExpenseList.jsx
│           │   └── ExpenseForm.jsx
│           └── Reports/
│               ├── YearlyReport.jsx
│               ├── CategoryBreakdown.jsx
│               └── ServiceProfitAnalysis.jsx
└── utils/
    └── financeHelpers.js (formatters, calculators)
```

### Routes Integration
```javascript
// In AdminPage.jsx, add Finance tab:
const [activeTab, setActiveTab] = useState('dashboard')
// Tabs: dashboard, income, expenses, reports

// In App.jsx routing:
<Route path="/admin/finance/*" element={<FinancePage />} />
```

### Components Breakdown

**FinancePage.jsx** - Main container
```
State:
- activeTab: 'dashboard' | 'income' | 'expenses' | 'reports'
- month, year (filter)
- refreshKey (to trigger data refetch)

Layout:
- Tab selector (Dashboard, Income, Expenses, Reports)
- Active tab content
```

**Dashboard.jsx** - Overview
```
KPI Cards:
- Total Monthly Income (current month)
- Total Monthly Expenses (current month)
- Net Profit/Loss (income - expenses)
- Avg Income per Deal (this month)

Charts:
- Income vs Expense (bar chart by month, last 12 months)
- Expense Breakdown (pie chart by category)
- Revenue by Service Type (bar chart)
- Profit by Service (grouped bar: revenue vs expenses)

Features:
- Month/year picker to change displayed period
- Drill-down: click category → see expenses for that category
```

**Income Section**
```
IncomeList.jsx:
- Table: Date, Description, Amount, Type, Service Type, Actions
- Filters: Month, Year, Type (deal/manual)
- Delete button (manual entries only, confirm before delete)
- Add Manual Income button

IncomeForm.jsx:
- Amount (required, number)
- Date (required, date picker)
- Description (optional, text)
- Notes (optional, textarea)
- Submit button
- Disabled fields: Type (always 'manual'), ServiceType (empty for manual)
```

**Expense Section**
```
ExpenseList.jsx:
- Table: Date, Category, Description, Amount, Status, Receipt, Actions
- Filters: Month, Year, Category, Status
- Approve/Reject buttons (if status='pending', for admin)
- Delete button (pending only, confirm)
- Add Expense button

ExpenseForm.jsx:
- Category dropdown (required):
  * Salary, Commission, Rent, Software, Marketing, Operational, Custom
- CustomCategory input (visible only if category='custom')
- Amount (required, number)
- Date (required, date picker)
- Description (required, text)
- Receipt file upload (optional, jpg/png/pdf)
- Notes (optional, textarea)
- Submit button
- File preview if receipt exists
```

**Reports Section**
```
YearlyReport.jsx:
- Summary table: Month, Income, Expenses, Profit/Loss, Margin %
- Export to CSV button
- Year selector

CategoryBreakdown.jsx:
- Table: Category, Count, Total Amount, Avg, % of Total
- Pie chart
- Month/year filter

ServiceProfitAnalysis.jsx:
- Table: Service Type, Revenue (from deals), Related Expenses, Profit, Margin %
- Grouped bar chart: Revenue vs Expenses
- Year/month period selector
```

### State Management
```
API Calls (via axios interceptor):
GET  /api/finance/income?month=2&year=2026
GET  /api/finance/expenses?month=2&year=2026
GET  /api/finance/dashboard
GET  /api/finance/reports/yearly?year=2026
GET  /api/finance/reports/by-category?month=2&year=2026
GET  /api/finance/reports/by-service?year=2026
GET  /api/finance/reports/profit-by-service?year=2026

POST /api/finance/income
POST /api/finance/expenses (multipart)
PUT  /api/finance/expenses/:id
PUT  /api/finance/expenses/:id/approve
DELETE /api/finance/income/:id
DELETE /api/finance/expenses/:id
```

---

## 4. AUTO-SYNC LOGIC (Deal → Income)

**Trigger Point:** `dealController.js` - `closeDeal()` function

```javascript
if (status === 'won') {
  // Existing logic: update lead, create client, notify sales, calculate commission

  // NEW: Sync deal to income
  const incomePayload = {
    type: 'deal',
    amount: deal.finalDealAmount,
    date: new Date(),
    description: `Revenue from deal: ${deal.name}`,
    dealId: deal._id,
    serviceType: deal.serviceType,
    createdBy: req.user._id,
  };

  await Income.create(incomePayload);
  // Unique index on dealId prevents duplicate syncs
}
```

**Manual Sync Option:**
```
Admin can trigger: POST /api/finance/income/sync-deals
- Finds all won deals not yet synced (no Income record with that dealId)
- Creates Income records for each
- Returns: { synced: 5, skipped: 2 }
```

---

## 5. DATA FLOW DIAGRAM

```
CRM Deal (Mark as Won)
    ↓
Deal Status Changed to 'Won'
    ↓
Trigger financeController.syncDealAsIncome()
    ↓
Create Income Record (type='deal', dealId=ref)
    ↓
Finance Dashboard shows:
    ├── Total Income (sum of all income records)
    ├── Income by Service (grouped by serviceType)
    └── Revenue chart

Admin adds Expense
    ↓
Create Expense Record (category, amount, date)
    ↓
Finance Dashboard shows:
    ├── Total Expenses (sum of all expenses)
    ├── Expenses by Category (pie chart)
    └── Expense table

Dashboard Calculation:
Income - Expenses = Net Profit/Loss
```

---

## 6. ROLE-BASED ACCESS

```javascript
// Finance module: Admin only
// In financeController:
router.use(protect)           // must be logged in
router.use(roleCheck('admin')) // must be admin

// Specific restrictions:
- Only admin can approve/reject expenses
- Only admin can delete expenses/income
- Sales users cannot access /admin/finance routes
- HR users cannot access /admin/finance routes
```

---

## 7. FILE UPLOAD (Receipt)

**Multipart Form Data for Expense Creation:**
```javascript
POST /api/finance/expenses
Headers: Content-Type: multipart/form-data

Form Fields:
- category: 'rent'
- amount: 50000
- date: '2026-02-24'
- description: 'Monthly office rent'
- receipt: <File> (optional, jpg/png/pdf)

Backend:
- Use multer middleware
- Save to: backend/uploads/expenses/
- Store relative path in Expense.receiptPath
- Return file URL for download
```

---

## 8. VALIDATION & BUSINESS RULES

```javascript
// Income
- amount > 0 (required)
- date cannot be in future
- if type='deal': must have valid dealId
- manual income must have description
- cannot sync same deal twice (unique dealId)

// Expense
- amount > 0 (required)
- category must be from enum (or valid custom)
- date cannot be in future (or maybe allow planned expenses?)
- description required
- receipt file: max 5MB, jpg/png/pdf only
- cannot delete if status='approved'
- only pending expenses can be rejected/approved
- auto-approve if created by admin? (or require manual approval?)

// Dashboard
- Only show data for selected month/year
- Calculate profit: sum(income) - sum(expenses)
- Service-based analysis requires deal sync to work
```

---

## 9. INTEGRATION CHECKLIST

- [ ] Modify `dealController.js` → `closeDeal()` to sync income
- [ ] Add `financeController.js` with all CRUD operations
- [ ] Create Finance models: Income, Expense, ExpenseCategory
- [ ] Create Finance routes: `/api/finance/*`
- [ ] Add finance routes to `server.js`
- [ ] Create frontend FinancePage with tabs
- [ ] Create Dashboard with KPI cards and charts
- [ ] Create Income management (list + add modal)
- [ ] Create Expense management (list + add modal + file upload)
- [ ] Create Reports section (yearly, by category, by service)
- [ ] Add Finance menu item to Admin page
- [ ] Add expense approval workflow (if required)
- [ ] Seed expense categories on app startup
- [ ] Test data sync: create deal → mark won → check income appears
- [ ] Test profit calculations

---

## 10. FUTURE ENHANCEMENTS

Optional:
- Expense approval workflow (pending → approved → rejected)
- Budget tracking (set monthly budget, alert if exceeded)
- Tax calculations (sales tax, income tax)
- Invoice generation from expenses
- Profit forecasting based on open deals
- Commission expense tracking (if separating from payroll)
- Recurring expenses (e.g., monthly rent auto-creates entry)
- Multi-period comparison (month-over-month growth %)
- Export to accounting software (QuickBooks, Tally)
- Cost allocation by department/team

---

## 11. ESTIMATED EFFORT

**Backend:**
- 3 models + seed script: ~2 hours
- 2 controllers (income + expense): ~3 hours
- Routes + validation + file upload: ~2 hours
- Deal sync integration: ~30 mins
- Testing endpoints: ~1 hour

**Frontend:**
- Main FinancePage + routing: ~1 hour
- Dashboard with KPIs + charts: ~2 hours
- Income section: ~1.5 hours
- Expense section with file upload: ~2 hours
- Reports section: ~2 hours
- Integration testing: ~1 hour

**Total: ~18 hours**

---

## Key Design Decisions

1. **Income.dealId Unique Index**: Prevents syncing same deal multiple times
2. **Type Field**: Distinguishes auto-synced (deal) vs manual income
3. **Expense Status Field**: Optional but allows approval workflow
4. **Receipt as Optional File**: Finance module can work without receipts
5. **Service Type from Deal**: Allows profit analysis by service type
6. **Admin-Only Access**: Finance data is sensitive, restrict to admins
7. **Automatic Sync on Deal Win**: No manual action needed, keeps data in sync
8. **Separate from Payroll**: Finance income ≠ salary/commission (those handled in payslips)
