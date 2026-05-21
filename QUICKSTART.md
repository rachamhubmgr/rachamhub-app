# RachamHub Quick Start Guide

Get RachamHub up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Google account
- Terminal/Command prompt access

## Step 1: Install Dependencies (1 minute)

```bash
pnpm install
```

## Step 2: Get Firebase Credentials (2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project named "RachamHub"
3. Go to **Project Settings** → Copy your config:
   ```
   - apiKey
   - authDomain
   - projectId
   - storageBucket
   - messagingSenderId
   - appId
   ```

## Step 3: Get Gemini API Key (1 minute)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API key"**
3. Copy your Gemini API key

## Step 4: Set Up Environment (1 minute)

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
GOOGLE_GEMINI_API_KEY=YOUR_GEMINI_KEY
```

## Step 5: Enable Firebase Features (1 minute)

In Firebase Console:

1. **Authentication** → Enable "Email/Password"
2. **Firestore** → Create database in test mode
3. Create collections: `users` and `orders`

## Step 6: Create a Test User

In Firebase Console → Authentication:

1. Click **Add user**
2. Email: `demo@rachamhub.com`
3. Password: `Demo123!`

Then create a Firestore document in `users` collection:

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

| Role | Test User | Features |
|------|-----------|----------|
| Customer Service | cs@rachamhub.com | Orders, AI extraction |
| Warehouse | warehouse@rachamhub.com | Inventory management |
| FOM1 | fom@rachamhub.com | Order fulfillment |
| Accounting | accounting@rachamhub.com | Invoices, payments |
| Admin | admin@rachamhub.com | User management |

## Common Issues

**Error: "Missing environment variables"**
- ✓ Ensure `.env.local` exists with all Firebase variables

**Error: "User profile not found"**
- ✓ Create matching Firestore document with same UID as Firebase Auth user

**Gemini extraction not working**
- ✓ Verify `GOOGLE_GEMINI_API_KEY` is set and valid

## Architecture

```
RachamHub
├── Login Page
│   └── Firebase Auth (email/password)
├── Dashboard Router
│   └── Role-based redirection
├── Role Dashboards
│   ├── Customer Service (orders, extraction)
│   ├── Warehouse (inventory)
│   ├── FOM1/2/3 (fulfillment)
│   ├── Accounting (invoicing)
│   └── Admin (management)
└── Firestore Database
    ├── users collection
    └── orders collection
```

## Key Features

🔐 **Secure Authentication** - Firebase Auth
📱 **Mobile Responsive** - Works on all devices
⚡ **AI Powered** - Google Gemini extraction
🔄 **Real-time** - Firestore listeners
🎯 **Role-Based** - 7 different roles
🎨 **Lagos Theme** - Green, Yellow, Black

## Support

For detailed setup, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

**Ready to use RachamHub!** 🚀
