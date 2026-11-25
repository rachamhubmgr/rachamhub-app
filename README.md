# RachamHub - Enterprise Logistics & Last-Mile Fulfillment Platform

A modern, full-stack enterprise logistics and last-mile fulfillment web application built for fast-paced logistics operations in Lagos, Nigeria. RachamHub streamlines order ingestion, warehouse packing, fleet dispatch, accounting settlement, and merchant inventory tracking into a unified, real-time platform powered by **Next.js**, **React 19**, **Supabase (PostgreSQL + Realtime)**, and **Google Gemini AI**.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [End-to-End Order Lifecycle](#-end-to-end-order-lifecycle)
- [Role-Based Modules](#-role-based-modules)
  - [1. Customer Service (CC)](#1-customer-service-cc)
  - [2. Warehouse & Inventory](#2-warehouse--inventory)
  - [3. Fleet Operations Management (FOM)](#3-fleet-operations-management-fom)
  - [4. Accounting & Finance](#4-accounting--finance)
  - [5. Administration & Governance](#5-administration--governance)
  - [6. Merchant Self-Service Portal](#6-merchant-self-service-portal)
- [Key Technical Highlights](#-key-technical-highlights)
- [Tech Stack](#-tech-stack)
- [Database Architecture](#-database-architecture)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Database Setup](#database-setup)
  - [Running the Application](#running-the-application)
- [Document Generation & Reporting](#-document-generation--reporting)
- [License & Confidentiality](#-license--confidentiality)

---

## 🚀 Overview

RachamHub is engineered specifically to address the unique complexities of urban logistics in emerging metropolitan markets like Lagos:
- **Messy Order Sources**: Customers and merchants frequently send orders through WhatsApp, social media DMs, and SMS as unformatted text. RachamHub uses Gemini AI to turn messy chat text into structured, validated orders with a single click.
- **Landmark-Based Routing**: Rather than relying strictly on unreliable street addresses, orders are linked to known Lagos landmarks with predefined dispatch rates and rider fee tiers.
- **Real-Time Visibility**: Supabase Realtime logical replication keeps all department dashboards in sync instantly without manual page refreshes.
- **Strict Role Separation**: Operations follow a zero-trust, department-driven workflow where each department only has authority over its specific operational lifecycle stage.

---

## 🔄 End-to-End Order Lifecycle

Every parcel moving through RachamHub follows a structured 5-stage lifecycle:

```
[ WhatsApp / Social Order ]
          │
          ▼
┌─────────────────────────┐
│ 1. Customer Service     │ ──► AI extraction, validate items, select merchant, submit
└─────────┬───────────────┘
          │ (Status: customer_service ──► warehouse)
          ▼
┌─────────────────────────┐
│ 2. Warehouse            │ ──► Verify stock, print packing slip, assign FOM manager
└─────────┬───────────────┘
          │ (Status: warehouse ──► fom)
          ▼
┌─────────────────────────┐
│ 3. Field Operations     │ ──► Assign rider & landmark fee, dispatch, record outcome
└─────────┬───────────────┘     (Delivered, Failed, Returned, Shelved)
          │ (Status: fom ──► accounting)
          ▼
┌─────────────────────────┐
│ 4. Accounting           │ ──► Verify payments (Cash/Transfer/PBD), audit rider fees,
└─────────┬───────────────┘     generate merchant invoices & close financial records
          │
          ▼
┌─────────────────────────┐
│ 5. Admin Oversight      │ ──► Live telemetries, merchant payouts, user provisioning
└─────────────────────────┘
```

---

## 🎯 Role-Based Modules

### 1. Customer Service (CC)
- **AI-Powered Fast Order Ingestion**: Paste raw, unformatted text messages from WhatsApp or Instagram directly into the intake box; Google Gemini auto-extracts customer names, delivery addresses, alternate phone numbers, product names, and quantities.
- **Merchant Association**: Fast-search dropdown to bind orders to approved merchants.
- **Order Queue & Monitoring**: Live view of ingested orders, extraction history, and real-time status progression.

### 2. Warehouse & Inventory
- **Packing Queue**: View incoming orders requiring physical fulfillment and package preparation.
- **Automated Slip Printing**: One-click generation of compact thermal/A4 dispatch slips with customer details, item breakdowns, landmarks, and handling notes.
- **Out-of-Stock Handling**: Segregate out-of-stock orders into an isolated queue to prevent dispatch bottlenecks, with single-click restoration when restocked.
- **FOM Assignment**: Bulk or individual assignment of packaged parcels to specific Field Operations Managers.

### 3. Fleet Operations Management (FOM)
- **Rider Dispatch & Routing**: Link orders to available dispatch riders and assign standardized delivery landmarks.
- **Dynamic Rider Rate Calculation**: Landmark-based rider pricing with automatic handling of standard, express, and split deliveries (including 50% half-rate calculations on failed deliveries).
- **Delivery Outcome Recording**: Update parcel statuses in real time:
  - `delivered`: Prompts for delivery quantity, payment method (Cash, Transfer, PBD), destination bank (UBA, Moniepoint), and amount collected.
  - `failed`: Flags delivery failure reasons and halves rider reimbursement where applicable.
  - `returned` / `shelved` / `canceled`: Tracks returned stock to ensure inventory accountability.

### 4. Accounting & Finance
- **Invoice Auditing**: Review delivered parcels, reconcile collected amounts against landmark delivery fees, and compute net merchant remittances:
  $$\text{Net Merchant Remittance} = \text{Amount Paid} - \text{Landmark Fee}$$
- **Payment Verification**: Verify and lock bank transfers and cash remittances with bank selection (`UBA`, `Moniepoint`).
- **Settlement Exporting**: Export customer invoices, rider remittance slips, and payment audits to Microsoft Word (`.docx`) and Excel (`.xlsx`).

### 5. Administration & Governance
- **Global Operational Analytics**: Real-time metrics tracking total orders, revenue, delivery success rates, and outstanding merchant debts.
- **User & Access Management**: Secure creation, role assignment (`admin`, `customer_service`, `warehouse`, `fom`, `accounting`), status toggling, and audit tracking.
- **Master Data Configuration**:
  - Merchant database with active/inactive statuses.
  - Product catalog management with baseline pricing.
  - Landmark directory with delivery fee pricing matrices.
  - Dispatch rider roster with active status management.

### 6. Merchant Self-Service Portal (`/merchant`)
- **Isolated Merchant Access**: Secure access portal protected by role-scoped access keys (`admin`, `warehouse`, `customer_service`, `guest`).
- **Inbound Stock Addition**: Merchants or warehouse staff submit incoming shipments with quantities and batch notes.
- **Dual-Control Approval Workflow**: Inbound stock entries require sign-off by Admin and Warehouse managers before being committed to inventory.
- **Live Stock Count Engine**: Real-time mathematical inventory ledger calculated on demand:
  $$\text{Current Stock} = \sum(\text{Approved Inbound Stock}) - \sum(\text{Delivered Order Items})$$

---

## ⚡ Key Technical Highlights

- **High-Performance Virtualized Data Tables**: Custom table engine powered by `@tanstack/react-virtual` capable of smoothly scrolling and searching tens of thousands of orders at 60 FPS with minimal DOM footprint.
- **Intelligent Realtime Sync**: Subscribes to Supabase Postgres changes via WebSocket logical replication; automatically pauses realtime sync during row edits or text searches to eliminate UI flicker.
- **Timezone-Aware Filtering**: Local day-boundary ISO normalization (`getLocalStartOfDayISO` / `getLocalEndOfDayISO`) preventing UTC midnight shifts from cutting off orders in West Africa Time (WAT, UTC+1).
- **Multi-Field Date Filtering**: Dynamic date selectors allowing operational staff to filter tables by the workflow date that matters to them (`fom_assigned_at`, `delivered_at`, `payment_verified_at`, or `created_at`).
- **Document Generation Engine**: Programmatic creation of formatted Microsoft Word (`docx`) documents with custom typography, tabulations, and dynamic accounting summaries.

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) | App Router, Server Actions, API Routes |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Strict type checking, shared domain types |
| **UI Library** | [React 19](https://react.dev/) | React Server Components, Client Components |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Lagos theme (Emerald Green, Gold Yellow, Slate) |
| **Component Kit** | [shadcn/ui](https://ui.shadcn.com/) + Radix UI | Accessible dialogs, selects, dropdowns, tooltips |
| **Database & Auth** | [Supabase](https://supabase.com/) | PostgreSQL, Row-Level Security, Realtime WS |
| **Artificial Intelligence** | [Google Gemini API](https://ai.google.dev/) | `@google/generative-ai` structured order parser |
| **Virtualization** | [TanStack Virtual](https://tanstack.com/virtual) | DOM recycling for large data sets |
| **File Export** | `docx`, `xlsx`, `jspdf` | Client-side Word, Excel, and PDF compilation |
| **Package Manager** | `pnpm` | Fast, deterministic dependency management |

---

## 🗄️ Database Architecture

The Postgres schema in `sql/` manages the following core entities:

- **`users`**: Profiles linked to Supabase Auth (`id`, `email`, `display_name`, `role`, `is_active`, `is_deleted`).
- **`orders`**: Central operational record (`customer_name`, `delivery_address`, `phone_numbers`, `merchant`, `items` JSONB, `total_amount`, `status`, `warehouse_status`, `fom_delivery_status`, `fom_assigned`, `rider_name`, `landmark`, `payment_method`, `bank`, `quantity_delivered`, `amount_paid`, `payment_confirmed`, `created_at`, `delivered_at`).
- **`merchants`**: Registered merchant partners (`id`, `name`, `is_active`, `approval_status`).
- **`products`**: Merchant product catalog (`id`, `merchant_id`, `name`, `price`, `approval_status`).
- **`stock_entries`**: Inbound warehouse shipments (`merchant_id`, `product_id`, `quantity`, `status`, `admin_approved`, `warehouse_approved`, `approved_at`).
- **`landmarks`**: Lagos delivery hubs (`name`, `price`, `is_active`).
- **`riders`**: Registered dispatch couriers (`name`, `phone`, `is_active`).
- **`merchant_access_keys`**: Role-scoped tokens for the merchant portal.

---

## 📂 Project Directory Structure

```text
rachamhub/
├── app/
│   ├── api/
│   │   ├── gemini/extract-order/    # Gemini AI order extraction endpoint
│   │   └── merchant/session/        # Merchant cookie-based session management
│   ├── dashboard/                   # Main operational dashboards
│   │   ├── customer_service/        # Order entry, AI intake & CC orders
│   │   ├── warehouse/               # Packing queue, inventory & out-of-stock
│   │   ├── fom/                     # Fleet dispatch & fulfillment tracking
│   │   ├── accounting/              # Invoices, payments & reconciliations
│   │   └── admin/                   # Operations telemetry, users & settings
│   ├── merchant/                    # Standalone Merchant portal
│   │   ├── stock/                   # Inbound stock entry creation
│   │   ├── stock-count/             # Real-time stock calculation table
│   │   ├── approvals/               # Admin/Warehouse stock approval queue
│   │   ├── merchants/               # Merchant catalog & products
│   │   └── users/                   # Access key management
│   ├── login/                       # Supabase Auth user login
│   ├── layout.tsx                   # Root HTML layout with Sonner toaster
│   └── page.tsx                     # Landing redirect to role dashboard
├── components/
│   ├── auth-context.tsx             # Supabase Auth React context
│   ├── data-table.tsx               # Virtualized data table with debounced search
│   ├── export-button.tsx            # Date-scoped Excel / Word export trigger
│   ├── merchant-breakdown-page.tsx  # Word doc breakdown report generator
│   ├── product-breakdown-page.tsx   # Per-product dispatch breakdown
│   ├── rider-payment-page.tsx       # Rider settlement calculation & Word export
│   └── ui/                          # shadcn/ui primitive component library
├── hooks/
│   ├── use-supabase-realtime.ts     # Resilient Supabase Realtime subscription hook
│   └── use-debounce.ts              # Input debounce hook for search queries
├── lib/
│   ├── merchant-session.ts          # Merchant portal session verification
│   ├── supabase.ts                  # Supabase client instantiation
│   ├── types.ts                     # TypeScript interfaces and enum constants
│   └── utils.ts                     # Currency formatters, date bounds, export helpers
├── docs/                            # Functional requirements and operating manuals
└── sql/                             # SQL migrations, table definitions & RLS policies
```

---

## 🏁 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or `v22.x`
- **pnpm**: `v9.x` or higher
- **Supabase Project**: Active Supabase project with PostgreSQL
- **Google AI Studio Key**: API key for Google Gemini

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-org/rachamhub.git
cd rachamhub
pnpm install
```

### Environment Configuration

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Populate the required environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini AI Configuration
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
```

### Database Setup

1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Run the initialization script found at [`sql/supabase-init.sql`](file:///c:/Users/Daniel/Work/rachamhub/sql/supabase-init.sql) (or [`sql/full-supabase-schema.sql`](file:///c:/Users/Daniel/Work/rachamhub/sql/full-supabase-schema.sql)).
3. Enable Row-Level Security and verify that default landmark and merchant tables are populated.
4. Create your initial Administrator user in **Supabase Auth**, then add a corresponding record in `public.users` matching the Auth UUID with role `admin`.

### Running the Application

Start the local development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To create an optimized production build:

```bash
pnpm build
pnpm start
```

---

## 📄 Document Generation & Reporting

RachamHub provides client-side document generation without requiring external rendering microservices:

- **Microsoft Word (`.docx`)**: Generates structured delivery breakdown documents, complete with company headers, tabular invoice details, payment totals, and signature sections via the `docx` library.
- **Excel Spreadsheets (`.xlsx`)**: Exports multi-column spreadsheets including order timestamps, phone numbers, merchant tags, item lists, and financial figures via `xlsx`.
- **Packing & Dispatch Slips**: Clean printable thermal tickets via browser print stylesheet formatting.

---

## 🔒 License & Confidentiality

Copyright © 2026 **RachamHub Limited**, Lagos, Nigeria.  
All rights reserved. Internal operational software — unauthorized copying, modification, distribution, or deployment is strictly prohibited.
