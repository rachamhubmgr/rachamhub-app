# RachamHub Quick Start Guide

Get RachamHub up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Google account
- Terminal/Command prompt access

## Step 1: Install Dependencies (1 minute)

```bash
pnpm install

or

npm install
```

## Step 2: Get Supabase Credentials (2 minutes)

1. Go to [Supabase](https://app.supabase.com)
2. Create a new project named "RachamHub"
3. In Project Settings → API, copy your:
   ```
   - URL
   - anon key
   ```

## Step 3: Get Gemini API Key (1 minute)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API key"**
3. Copy your Gemini API key

## Step 4: Set Up Environment (1 minute)

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_ANON_KEY
GOOGLE_GEMINI_API_KEY=YOUR_GEMINI_KEY
```

## Step 5: Enable Supabase Features (1 minute)

In Supabase Console:

1. **Authentication** → Enable "Email/Password"
2. **Database** → Create tables `users` and `orders`
3. Allow the app to use row-level security later once your tables are ready

## Step 6: Create a Test User

In Supabase Console → Authentication:

1. Click **Users** → **New user**
2. Email: `demo@rachamhub.com`
3. Password: `Demo123!`

Then insert a row into the `users` table with matching profile data:

```json
{
  "uid": "firebase_uid_here",
  "email": "demo@rachamhub.com",
  "displayName": "Demo User",
  "role": "customer_service",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## Step 7: Start Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` and login with:

- Email: `demo@rachamhub.com`
- Password: `Demo123!`

## ✅ You're Done!

You now have a fully functional RachamHub instance!

## Next Steps

- Explore the [Customer Service Dashboard](http://localhost:3000/dashboard/customer_service)
- Try the [AI Order Extraction](http://localhost:3000/dashboard/customer_service/extract)
- Create more test users with different roles
- Read [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed configuration

## Test Different Roles

Try these role combinations for a complete demo:

| Role             | Test User                | Features              |
| ---------------- | ------------------------ | --------------------- |
| Customer Service | cs@rachamhub.com         | Orders, AI extraction |
| Warehouse        | warehouse@rachamhub.com  | Inventory management  |
| FOM1             | fom@rachamhub.com        | Order fulfillment     |
| Accounting       | accounting@rachamhub.com | Invoices, payments    |
| Admin            | admin@rachamhub.com      | User management       |

## Common Issues

**Error: "Missing environment variables"**

- ✓ Ensure `.env.local` exists with Supabase URL and anon key

**Error: "User profile not found"**

- ✓ Create matching row in the `users` table with the Supabase user ID

**Gemini extraction not working**

- ✓ Verify `GOOGLE_GEMINI_API_KEY` is set and valid

## Architecture

```
RachamHub
├── Login Page
│   └── Supabase Auth (email/password)
├── Dashboard Router
│   └── Role-based redirection
├── Role Dashboards
│   ├── Customer Service (orders, extraction)
│   ├── Warehouse (inventory)
│   ├── FOM (fulfillment)
│   ├── Accounting (invoicing)
│   └── Admin (management)
└── Supabase Database
    ├── users table
    └── orders table
```

## Key Features

🔐 **Secure Authentication** - Supabase Auth
📱 **Mobile Responsive** - Works on all devices
⚡ **AI Powered** - Google Gemini extraction
🔄 **Real-time** - PostgreSQL + Supabase Realtime
🎯 **Role-Based** - 7 different roles
🎨 **Lagos Theme** - Green, Yellow, Black

## Support

For detailed setup, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

**Ready to use RachamHub!** 🚀
