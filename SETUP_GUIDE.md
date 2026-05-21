# RachamHub - Setup Guide

RachamHub is a production-ready logistics management system for Lagos-based operations. This guide will help you set up the application with Firebase and Google Gemini AI.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Setup](#firebase-setup)
3. [Google Gemini AI Setup](#google-gemini-ai-setup)
4. [Environment Configuration](#environment-configuration)
5. [Firestore Database Setup](#firestore-database-setup)
6. [Running the Application](#running-the-application)
7. [Creating Test Users](#creating-test-users)

---

## Prerequisites

- Node.js 18+ and npm/pnpm installed
- A Google account (for Firebase and Gemini API)
- Basic understanding of Firebase console

---

## Firebase Setup

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a new project"**
3. Enter project name: `RachamHub`
4. Accept the terms and create the project
5. Wait for the project to be created

### Step 2: Enable Authentication

1. In the Firebase console, go to **Authentication** (left sidebar)
2. Click **"Get started"**
3. Select **"Email/Password"** authentication method
4. Enable it by toggling the switch
5. Click **Save**

### Step 3: Create Firestore Database

1. Go to **Firestore Database** in the left sidebar
2. Click **"Create database"**
3. Choose location: **US (us-central1)** or closest to your region
4. Select **"Start in test mode"** (you can configure security rules later)
5. Click **Enable**

### Step 4: Get Your Firebase Credentials

1. Go to **Project Settings** (gear icon at top)
2. Copy your Firebase configuration:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

---

## Google Gemini AI Setup

### Step 1: Enable Gemini API

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API key"**
3. The API key will be generated automatically
4. Copy your Gemini API key

### Step 2: Verify API Access

Make sure the Gemini API is enabled in your Google Cloud Console:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Search for **"Generative Language API"**
3. Click **Enable** if not already enabled

---

## Environment Configuration

### Step 1: Create `.env.local` File

1. In the root directory of the project, create a file named `.env.local`
2. Copy the contents from `.env.local.example`:

```bash
cp .env.local.example .env.local
```

### Step 2: Fill in Your Credentials

Open `.env.local` and update it with your Firebase and Gemini credentials:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Gemini AI API Key
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
```

⚠️ **Important**: Never commit `.env.local` to version control. It contains sensitive credentials.

---

## Firestore Database Setup

### Step 1: Create Collections

Open Firestore in the Firebase console and create the following collections:

#### 1. Users Collection

1. Click **"Start a collection"**
2. Collection ID: `users`
3. Add the first document with these fields:
   - `uid`: Your test user ID (string)
   - `email`: test@example.com (string)
   - `displayName`: Test User (string)
   - `role`: customer_service (string) - choose from: `customer_service`, `warehouse`, `fom1`, `fom2`, `fom3`, `accounting`, `admin`
   - `isActive`: true (boolean)
   - `createdAt`: current timestamp
   - `updatedAt`: current timestamp

#### 2. Orders Collection

1. Create a new collection: `orders`
2. Leave it empty for now (orders will be created through the app)

### Step 2: Configure Security Rules (Optional but Recommended)

Go to **Firestore Database → Rules** and update with proper security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own documents
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId && request.auth != null;
    }
    
    // Orders can be read by authenticated users
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth.uid == resource.data.extractedBy;
    }
  }
}
```

---

## Running the Application

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Start the Development Server

```bash
pnpm dev
```

The application will start on `http://localhost:3000`

### Step 3: Access the Application

1. Navigate to `http://localhost:3000`
2. You'll be redirected to the login page
3. Enter your test user credentials

---

## Creating Test Users

You can create test users in two ways:

### Method 1: Firebase Console (Recommended for Testing)

1. In Firebase Console, go to **Authentication**
2. Click the **Users** tab
3. Click **"Add user"**
4. Enter:
   - Email: `test@example.com`
   - Password: (set a password)
5. Click **Add user**

### Method 2: Through the App (Requires Initial Setup)

Temporarily enable user registration in `app/login/login-form.tsx` and add a sign-up flow.

### Step 2: Create Corresponding Firestore User Document

For each user created in Firebase Auth:

1. Go to Firestore → `users` collection
2. Create a new document with ID = Firebase Auth UID
3. Add fields:
   ```json
   {
     "uid": "firebase_uid",
     "email": "user@example.com",
     "displayName": "User Name",
     "role": "customer_service",
     "isActive": true,
     "createdAt": "2024-01-01T00:00:00Z",
     "updatedAt": "2024-01-01T00:00:00Z"
   }
   ```

---

## User Roles & Permissions

RachamHub has the following roles with specific permissions:

| Role | Description | Features |
|------|-------------|----------|
| **customer_service** | Customer Service Representative | Orders, Order Extraction (AI), Inquiries |
| **warehouse** | Warehouse Manager | Inventory Management, Stock Tracking |
| **fom1** | Fulfillment Operations Manager Level 1 | Order Fulfillment, Status Updates |
| **fom2** | Fulfillment Operations Manager Level 2 | Same as FOM1 |
| **fom3** | Fulfillment Operations Manager Level 3 | Same as FOM1 |
| **accounting** | Accounting Staff | Invoices, Payments, Reports |
| **admin** | System Administrator | User Management, Settings, System Logs |

---

## Features

### 1. AI Order Extraction (Gemini)

- **Route**: `/dashboard/customer_service/extract`
- **Feature**: Extract order details from text using Google Gemini AI
- **Access**: Customer Service role only
- **How it works**:
  1. Paste order information as text
  2. AI automatically extracts: customer name, items, quantities, total amount
  3. Review extracted data
  4. Save to Firestore with one click

### 2. Role-Based Dashboards

Each role has a dedicated dashboard with relevant metrics and quick actions:
- **Customer Service**: Orders, extractions, inquiries
- **Warehouse**: Inventory, stock levels, receiving
- **FOM1/2/3**: Fulfillment operations, status tracking
- **Accounting**: Invoices, payments, reconciliation
- **Admin**: User management, system settings, analytics

### 3. Real-Time Updates

- Firestore listeners automatically sync data across tabs/devices
- User session updates in real-time
- Orders update as status changes

### 4. Firebase Authentication

- Email/password authentication
- Secure session management
- Automatic logout on auth errors

---

## Troubleshooting

### Issue: "Firebase config is missing"

**Solution**: Ensure all `NEXT_PUBLIC_FIREBASE_*` variables are set in `.env.local`

### Issue: "User profile not found"

**Solution**: Make sure you have a document in the `users` collection matching the Firebase Auth UID

### Issue: "Gemini API key not configured"

**Solution**: Set `GOOGLE_GEMINI_API_KEY` in `.env.local`

### Issue: "Order extraction fails"

**Solution**: 
- Check that the Gemini API is enabled in Google Cloud Console
- Verify your API key is valid
- Try with clearer order information

### Issue: "Cannot read properties of undefined (reading 'uid')"

**Solution**: Wait for the auth context to load. Check browser console for more details.

---

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel project settings:
   - All `NEXT_PUBLIC_FIREBASE_*` variables
   - `GOOGLE_GEMINI_API_KEY`
4. Deploy!

### Deploy to Other Platforms

Ensure all environment variables are set before deployment. The application works with any Node.js hosting provider.

---

## Support & Next Steps

### For Issues

1. Check the troubleshooting section above
2. Review browser console for error messages
3. Check Firebase console for authentication/database errors

### To Extend the Application

- Add more dashboard features in `/app/dashboard/[role]`
- Create additional Firestore collections for other data types
- Implement real-time listeners for specific features
- Add more AI capabilities using Gemini API

---

## Security Notes

- 🔐 Never commit `.env.local` to version control
- 🔐 Use environment variables for sensitive data
- 🔐 Implement Firestore security rules in production
- 🔐 Regular security audits recommended
- 🔐 Enable 2FA on Firebase account

---

## Architecture Overview

```
RachamHub/
├── app/
│   ├── login/                    # Login page & form
│   ├── dashboard/                # Dashboard layout & router
│   │   ├── customer_service/     # CS-specific pages
│   │   ├── warehouse/            # Warehouse pages
│   │   ├── fom1/fom2/fom3/       # FOM pages
│   │   ├── accounting/           # Accounting pages
│   │   └── admin/                # Admin pages
│   └── api/
│       └── gemini/               # Gemini API routes
├── lib/
│   ├── firebase.ts               # Firebase config & init
│   ├── auth-context.tsx          # Auth provider & hooks
│   └── types.ts                  # TypeScript types
├── components/
│   └── protected-route.tsx        # Route protection wrapper
└── .env.local.example            # Environment template
```

---

## Contact & Support

For support or issues, please contact the development team or refer to:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Last Updated**: 2024  
**Version**: 1.0.0
