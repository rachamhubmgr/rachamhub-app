# RachamHub - Lagos Logistics Management System

A modern, production-ready Next.js 15 application for managing logistics operations in Lagos, Nigeria.

## 🚀 Overview

RachamHub is a comprehensive logistics management system designed specifically for Nigerian logistics companies. It features:

- **Role-Based Access Control**: 7 distinct roles with customized dashboards
- **AI-Powered Order Extraction**: Google Gemini AI extracts order details from text
- **Real-Time Updates**: Firestore listeners for live data synchronization
- **Responsive Design**: Mobile-first design optimized for all devices
- **Firebase Authentication**: Secure email/password authentication
- **Lagos Theme**: Green, Yellow, and Black color scheme inspired by Nigeria

## 📋 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Firebase (Auth + Firestore)
- **AI**: Google Gemini 2.5 Flash
- **State Management**: React Context API + Custom Hooks

## 🎯 Key Features

### 1. Role-Based Dashboards

Seven specialized dashboards for different user roles:

| Role                 | Features                                          |
| -------------------- | ------------------------------------------------- |
| **Customer Service** | Order creation, AI extraction, customer inquiries |
| **Warehouse**        | Inventory management, stock tracking, receiving   |
| **FOM Level 1/2/3**  | Order fulfillment, status updates, operations     |
| **Accounting**       | Invoices, payments, reconciliation, reports       |
| **Admin**            | User management, system settings, analytics       |

### 2. AI Order Extraction

- Paste order information as text
- Google Gemini AI automatically extracts:
  - Customer name and ID
  - Items and quantities
  - Total amount
  - Special notes
- Save extracted orders directly to Firestore

### 3. Firestore Integration

- Real-time data synchronization
- Automatic offline support
- Type-safe queries with TypeScript
- Security rules for data protection

### 4. Authentication

- Email/password authentication via Firebase
- Session persistence
- Automatic logout on auth errors
- Secure token management

## 📁 Project Structure

````
rachamhub/
├── app/
│   ├── api/
│   │   └── gemini/
│   │       └── extract-order/       # Gemini API route
│   ├── login/
│   │   ├── page.tsx                 # Login page
│   │   └── login-form.tsx           # Login form component
│   ├── dashboard/
│   │   ├── page.tsx                 # Dashboard router
│   │   ├── layout.tsx               # Dashboard layout
│   │   ├── dashboard-nav.tsx        # Sidebar navigation
│   │   ├── customer_service/        # CS role dashboards
│   │   │   ├── page.tsx
│   │   │   ├── orders/
│   │   │   ├── extract/             # AI extraction page
│   │   │   └── inquiries/
│   │   ├── warehouse/               # Warehouse dashboards
│   │   ├── fom/                     # FOM dashboards
│   │   ├── accounting/              # Accounting dashboards
│   │   └── admin/                   # Admin dashboards
│   ├── globals.css                  # Global styles + theme
│   └── layout.tsx                   # Root layout
├── lib/
│   ├── supabase.ts                 # Supabase client
# RachamHub - Lagos Logistics Management System

Lightweight Next.js app for logistics operations with Supabase and Google Gemini.

Overview
--------
RachamHub provides role-based dashboards, AI-powered order extraction, and real-time updates using Supabase (Postgres + Realtime).

Highlights
----------
- Role-based access for Customer Service, Warehouse, FOM, Accounting, and Admin
- AI order extraction via Google Gemini API
- Real-time data via Supabase Realtime (Postgres logical replication)
- Auth via Supabase Auth and profile rows in `public.users`

Tech Stack
----------
- Next.js (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Postgres, Realtime)
- Google Gemini (AI extraction)

Quick Start
-----------
1. Install dependencies

```bash
pnpm install
````

2. Copy env template and add keys

```bash
cp .env.local.example .env.local
# set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY and GOOGLE_GEMINI_API_KEY
```

3. Run dev server

```bash
pnpm dev
```

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
GOOGLE_GEMINI_API_KEY=your_gemini_key
```

## Database setup

Run `sql/supabase-init.sql` in the Supabase SQL editor to create `users` and `orders` tables, RLS (development-friendly), triggers, and demo data. After creating Auth users in Supabase, ensure profile rows in `public.users` match Auth user `id` values.

## Where to look

- Auth context: `lib/auth-context.tsx` (uses Supabase)
- Supabase client: `lib/supabase.ts`
- Order extraction: `components/order-extraction-form.tsx` and `/api/gemini/extract-order`

## Test Different Roles

Try these role combinations for a complete demo:

| Role             | Test User                | Features              |
| ---------------- | ------------------------ | --------------------- |
| Customer Service | cs@rachamhub.com         | Orders, AI extraction |
| Warehouse        | warehouse@rachamhub.com  | Inventory management  |
| FOM              | fom@rachamhub.com        | Order fulfillment     |
| Accounting       | accounting@rachamhub.com | Invoices, payments    |
| Admin            | admin@rachamhub.com      | User management       |

_user table fields_

| Field       | Type                                                    |
| ----------- | ------------------------------------------------------- |
| uid         | string                                                  |
| email       | string                                                  |
| displayName | string                                                  |
| role        | customer_service / warehouse / fom / accounting / admin |
| isActive    | boolean                                                 |
| createdAt   | timestamp                                               |
| updatedAt   | timestamp                                               |

## Documentation

This repo previously included several markdown guides. Primary docs now are:

- `README.md` (this file)
- `ARCHITECTURE.md` (system architecture)
- `sql/supabase-init.sql` (DB schema + demo data)

If you need the previous detailed setup guides converted into the new Supabase flow, I can add a condensed `SETUP.md`.

## Contributing

Create a branch, add tests where applicable, and open a PR to `main`.

## Support

If something breaks during the migration to Supabase, check:

- `NEXT_PUBLIC_SUPABASE_...` variables
- Supabase Auth users exist for demo emails
- The `public.users` rows match Auth user ids

---

Version: 1.0.0
Last Updated: 2026-05-25

- Dashboard: `/dashboard/admin`
