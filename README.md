# HRMS + CRM System

A full-featured **Human Resource Management System** with integrated **Sales CRM**, built with React.js, Node.js, Express, and MongoDB.

---

## Features

### Roles
- **Employee** — Attendance, Leaves, Payslips, Tasks
- **Sales Employee** — All Employee features + CRM Lead Management
- **HR** — Employee Management, Payroll, Leave Approvals, Work/KPI
- **Admin** — Full system access + Reports, Departments, Policies

### Modules
- ✅ JWT Authentication + Role-based Access Control
- ✅ First Login → Force Password Reset
- ✅ Employee Management (CRUD + Offer Letter + Credentials via Email)
- ✅ Daily Check-in / Check-out Attendance
- ✅ Leave Management with Approval Workflow
- ✅ Payslip Generation with PDF Download
- ✅ Work/Task Assignment + KPI Tracking
- ✅ CRM — Lead Pipeline with Activity Timeline
- ✅ Email Notifications (Nodemailer)
- ✅ In-App Notifications
- ✅ Dynamic Reports (Attendance, Leave, Payroll, CRM)
- ✅ Department Management + Leave Policies

---

## Tech Stack

| Layer     | Technology                              |
|-----------|----------------------------------------|
| Frontend  | React.js, Tailwind CSS, Framer Motion  |
| Backend   | Node.js, Express.js                    |
| Database  | MongoDB                                |
| Auth      | JWT                                    |
| Email     | Nodemailer                             |
| PDF       | PDFKit                                 |

---

## Prerequisites

1. [Node.js v18+](https://nodejs.org/)
2. [MongoDB Community Server](https://www.mongodb.com/try/download/community) (running on `localhost:27017`)
3. A Gmail account (for email features) — set up [App Password](https://myaccount.google.com/apppasswords)

---

## Quick Start

### Step 1: Install Dependencies

Run the setup script:
```
setup.bat
```

Or manually:
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### Step 2: Configure Environment

Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hrms_crm
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_gmail_app_password
MAIL_FROM=HRMS System <your_email@gmail.com>

FRONTEND_URL=http://localhost:5173
```

### Step 3: Seed the Database

```bash
cd backend
node seed.js
```
This creates:
- Admin account: `admin@hrms.com` / `Admin@123`
- Default leave policy for the current year

### Step 4: Start MongoDB

Windows (if installed as service): MongoDB starts automatically.
Or run manually: `mongod`

### Step 5: Start the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
Backend runs on http://localhost:5000

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on http://localhost:5173

---

## Default Login

```
Email:    admin@hrms.com
Password: Admin@123
```

---

## Project Structure

```
hrms-crm/
├── backend/
│   ├── config/          # DB + Mail config
│   ├── controllers/     # Route logic
│   ├── middleware/      # Auth + Role check
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── utils/           # Email templates + PDF generator
│   ├── uploads/         # Generated PDF payslips
│   ├── seed.js          # Database seeder
│   └── server.js        # Entry point
└── frontend/
    └── src/
        ├── components/  # Reusable UI + Layout
        ├── contexts/    # Auth context
        ├── pages/       # All page components
        └── utils/       # API client + helpers
```

---

## API Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login | Public |
| GET | `/api/auth/me` | Get current user | All |
| PUT | `/api/auth/change-password` | Change password | All |
| POST | `/api/employees` | Create employee | HR/Admin |
| GET | `/api/employees` | List employees | HR/Admin |
| POST | `/api/attendance/check-in` | Daily check-in | All |
| POST | `/api/attendance/check-out` | Daily check-out | All |
| GET | `/api/attendance/my` | Own attendance | All |
| GET | `/api/attendance` | All attendance | HR/Admin |
| POST | `/api/leaves` | Apply leave | All |
| GET | `/api/leaves/my` | Own leaves | All |
| GET | `/api/leaves` | All leaves | HR/Admin |
| PUT | `/api/leaves/:id/status` | Approve/reject | HR/Admin |
| POST | `/api/payslips` | Generate payslip | HR/Admin |
| GET | `/api/payslips/my` | Own payslips | All |
| GET | `/api/payslips/:id/download` | Download PDF | All |
| POST | `/api/tasks` | Create task | HR/Admin |
| GET | `/api/tasks/my` | Own tasks | All |
| GET | `/api/leads` | CRM leads | Sales/HR/Admin |
| POST | `/api/leads` | Add lead | Sales/HR/Admin |
| GET | `/api/admin/departments` | Departments | HR/Admin |
| GET | `/api/admin/reports/attendance` | Attendance report | HR/Admin |

---

## Email Setup (Gmail)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Generate a password for "Mail" → "Windows Computer"
5. Use that 16-character password as `MAIL_PASS` in `.env`

> **Note:** Email features are optional. The system works fully without email — you'll just see errors in the console for email operations.

---

## Design

- **Background:** White
- **Cards:** Light Violet Glassmorphism
- **Headings:** Dark Violet (`#4C1D95`)
- **Buttons/Highlights:** Golden Yellow (`#D97706`)
- **Animations:** Framer Motion transitions
- **Responsive:** Mobile, Tablet, Desktop
