# 🏥 MedNeed — 24x7 Express Healthcare & Medicine Delivery Platform

MedNeed is a full-stack, enterprise-ready digital pharmacy and healthcare platform built with **Next.js 15 (App Router)**, **React 19**, **Prisma ORM**, **Supabase (PostgreSQL)**, **Tailwind CSS**, and **Three.js**.

The platform provides express 24x7 medicine delivery, digital prescription verification, diagnostic blood test bookings, franchise inquiry management, Razorpay payments, and GST-compliant pharmaceutical invoice generation.

---

## ✨ Features

- **⚡ 24x7 Express Delivery**: Instant medicine ordering with pin-code based availability and OTP-verified delivery tracking.
- **💊 Comprehensive Medicine Catalogue**: Search and filter thousands of Indian pharmaceutical products with composition, manufacturer, and usage info.
- **📄 Digital Prescription Verification**: Secure prescription uploads (with Supabase Storage) and pharmacist verification workflows.
- **🎨 3D Interactive UI**: Immersive experience powered by Three.js featuring 3D medicine coverflow, floating pill effects, and smooth Lenis scrolling.
- **💳 Payment Integration**: Full integration with Razorpay (Order creation, signature verification, and secure webhook handling).
- **🔐 Multi-Method Authentication**: Supabase SSR Auth with email/password and Google OAuth 2.0.
- **🧾 Regulatory Compliance & Invoicing**: Automated GST computation (CGST/SGST/IGST), HSN 3004 coding, and Drug License (Form 20B/21B) & FSSAI invoice generation.
- **🛡️ Role-Based Access Control**: Secure Admin dashboard for dispatch management, inventory management, discount codes, and audit logs.
- **🧪 Diagnostic Blood Tests**: Health checkup packages and diagnostic test bookings.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) |
| **Frontend** | [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/) |
| **3D & Animation** | [Three.js](https://threejs.org/), [Lenis](https://lenis.darkroom.engineering/) |
| **Database & ORM** | [PostgreSQL (Supabase)](https://supabase.com/), [Prisma ORM 6](https://www.prisma.io/) |
| **Authentication** | [Supabase SSR](https://supabase.com/docs/guides/auth), Google OAuth 2.0, JWT, bcryptjs |
| **Payments** | [Razorpay](https://razorpay.com/) Payment Gateway & Webhooks |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |

---

## 📁 Project Structure

```text
MedNeed/
├── prisma/
│   ├── migrations/             # Database migration history
│   ├── schema.prisma           # Prisma data models & schema
│   └── seed.ts                 # Initial database seeding script
├── public/
│   ├── images/hero/            # 3D assets and visual graphics
│   └── landing/                # WebP landing backgrounds
├── scripts/
│   ├── data/                   # Dataset directory (README & CSVs)
│   ├── download-full-dataset.ts# Downloads 45MB Indian Medicine dataset
│   ├── import-all-medicines.ts # Imports medicine catalogue to PostgreSQL
│   └── check-supabase.ts       # Database connectivity check script
├── src/
│   ├── app/                    # Next.js 15 App Router pages & API routes
│   │   ├── admin/              # Admin dashboard
│   │   ├── api/                # REST endpoints (auth, orders, cart, etc.)
│   │   ├── auth/               # Sign-in & sign-up pages
│   │   ├── checkout/           # Checkout & payment processing
│   │   ├── medicines/          # Medicine catalogue & search
│   │   └── track-delivery/     # Real-time order tracking
│   ├── components/             # Reusable UI & 3D Three.js components
│   ├── context/                # React Context (Cart, Auth, Location)
│   ├── lib/                    # Supabase client, Prisma client, GST utils
│   └── types/                  # TypeScript interfaces and types
├── supabase/
│   └── migrations/             # Supabase SQL policies & RLS rules
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.18 or higher (v20+ recommended)
- **npm** or **pnpm**
- A **Supabase** project (PostgreSQL database)
- *(Optional)* Razorpay and Google Cloud credentials for payments and OAuth

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/MedNeed.git
cd MedNeed
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your credentials in `.env.local`:

```env
# Supabase Database URLs
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase API
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Authentication & Security
JWT_SECRET="generate-a-secure-random-secret-key-at-least-32-chars"

# Razorpay (Payment Gateway)
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."

# Google OAuth
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
NEXT_PUBLIC_GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
```

### 4. Database Setup & Migrations

Push the Prisma schema to your Supabase database:

```bash
npx prisma db push
```

Run seed data (admin accounts, base categories, and initial medicines):

```bash
npx prisma db seed
```

*(Optional)* Download the full Indian medicine catalog (~45 MB) and import all medicines:

```bash
npx tsx scripts/download-full-dataset.ts
npx tsx scripts/import-all-medicines.ts
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts local Next.js development server at `localhost:3000` |
| `npm run build` | Compiles and builds the production application |
| `npm run start` | Starts the production Next.js server |
| `npx prisma studio` | Opens Prisma visual database explorer |
| `npx prisma db seed` | Seeds initial admin user and baseline data |

---

## 🔒 Security & Environment Variables

- `.env` and `.env.local` are automatically ignored in `.gitignore`.
- **Never commit `.env` or sensitive API keys/passwords to GitHub.**
- Use `.env.example` as a template for team members and CI/CD pipelines.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
