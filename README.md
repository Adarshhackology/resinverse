# ResinVerse 🌸✨
## *Crafted Memories, Preserved Forever*

> A production-ready, Gen Z-targeted **full-stack e-commerce platform** for handmade resin art products.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS, Framer Motion |
| **State** | Zustand + React Query |
| **Backend** | Express.js, TypeScript, Prisma ORM |
| **Database** | PostgreSQL (Supabase / Neon) |
| **Auth** | JWT + Google OAuth |
| **Payments** | Razorpay |
| **Storage** | Cloudinary |
| **AI** | Google Gemini 1.5 Flash |
| **Deploy** | Vercel (frontend) + Railway/Render (backend) |

---

## 📁 Project Structure

```
resinverse/
├── frontend/         # Next.js 15 App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # 🏠 Home (Hero, Categories, Best Sellers)
│   │   │   ├── products/page.tsx     # 🛍️ Product Listing (filters, search, infinite scroll)
│   │   │   ├── products/[slug]/      # 📦 Product Detail (gallery, reviews, add to cart)
│   │   │   ├── custom-builder/       # ✨ Custom Product Builder (canvas preview)
│   │   │   ├── checkout/             # 💳 Multi-step Checkout (Razorpay)
│   │   │   ├── dashboard/            # 👤 User Dashboard (orders, wishlist, profile)
│   │   │   ├── admin/                # 🔧 Admin Dashboard (analytics, products, orders)
│   │   │   ├── login/                # 🔐 Login Page
│   │   │   └── register/             # 📝 Register Page
│   │   ├── components/
│   │   │   ├── layout/               # Navbar, Footer (glass effect, animations)
│   │   │   ├── products/             # ProductCard (hover effects, quick add)
│   │   │   ├── cart/                 # CartDrawer (slide-out, coupon, totals)
│   │   │   └── ai/                   # AIChatWidget (Gemini-powered Resina)
│   │   └── lib/
│   │       ├── api.ts                # Axios API client (all endpoints)
│   │       └── store.ts              # Zustand (auth + cart + UI)
└── backend/          # Express.js REST API
    ├── src/
    │   ├── index.ts                  # Server entry (middleware, routes)
    │   ├── middleware/auth.ts        # JWT auth + admin guard
    │   ├── routes/
    │   │   ├── auth.ts               # Register, Login, Google OAuth, Profile
    │   │   ├── products.ts           # CRUD, search, filter, sort, paginate
    │   │   ├── orders.ts             # Create, cancel, admin management
    │   │   ├── payments.ts           # Razorpay: create, verify, webhook
    │   │   ├── ai.ts                 # Gemini: recommend, design, chat
    │   │   ├── admin.ts              # Analytics, user mgmt, coupons
    │   │   ├── wishlist.ts           # Add, remove, check
    │   │   ├── reviews.ts            # CRUD + helpful votes + verified purchase
    │   │   ├── cart.ts               # Validate + coupon apply
    │   │   ├── addresses.ts          # CRUD with default management
    │   │   ├── customOrders.ts       # Custom product order submission
    │   │   ├── notifications.ts      # List, mark read
    │   │   └── upload.ts             # Cloudinary single/multi upload
    │   └── seed.ts                   # DB seed (categories, products, users, coupons)
    └── prisma/
        └── schema.prisma             # 12 models: User, Product, Order, Payment...
```

---

## ⚡ Quick Start

### 1. Clone & Setup

```bash
# Frontend
cd resinverse/frontend
npm install

# Backend
cd resinverse/backend
npm install
```

### 2. Environment Variables

**Backend** — copy `.env.example` to `.env` and fill in:
```bash
cp backend/.env.example backend/.env
```

Required:
```env
DATABASE_URL="postgresql://..."          # Supabase/Neon connection string
JWT_SECRET="your_secret_here"
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
GEMINI_API_KEY="..."
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

**Frontend** — edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
```

### 3. Database Setup

```bash
cd backend

# Push schema to your PostgreSQL database
npx prisma db push

# Seed with categories, products, test users
npm run db:seed
```

### 4. Run Development Servers

```bash
# Backend (port 5000)
cd backend && npm run dev

# Frontend (port 3000)
cd frontend && npm run dev
```

### 5. Visit

- **Store**: http://localhost:3000
- **Admin**: http://localhost:3000/admin
- **API**: http://localhost:5000/health

---

## 👤 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@resinverse.in | Admin@123 |
| User | test@resinverse.in | User@123 |

---

## 🎨 Features

### Customer-Facing
- ✅ **Home Page** — Hero with floating particles, animated word rotation, categories grid
- ✅ **Product Listing** — Infinite scroll, filters (price/color/rating/category), sort, search
- ✅ **Product Detail** — Image gallery, reviews, add to cart, wishlist, social share
- ✅ **Custom Builder** — 5-step wizard with canvas preview, color picker, AI suggestions
- ✅ **Cart Drawer** — Slide-out cart with coupon codes, shipping calculator
- ✅ **Checkout** — Multi-step: cart review → address → Razorpay payment → confirmation
- ✅ **User Dashboard** — Orders, wishlist, notifications, profile settings
- ✅ **AI Chat** — Resina AI assistant (Gemini-powered)

### Admin
- ✅ **Analytics** — Revenue, orders, customer stats, top products
- ✅ **Order Management** — Status updates, tracking
- ✅ **Product Management** — CRUD table with search
- ✅ **Customer Management** — User list with loyalty points
- ✅ **Coupon Management** — View active coupons

### AI Features
- ✅ **Gift Recommender** — Age/gender/occasion/budget → Gemini → product matches
- ✅ **Design Generator** — Name/theme/colors → Gemini → 3 design concepts
- ✅ **Chat Assistant** — Floating widget with conversation history

---

## 💳 Payment Flow (Razorpay)

1. `POST /api/orders` — Create order in DB (status: PENDING)
2. `POST /api/payments/razorpay/create` — Create Razorpay order
3. Razorpay modal opens in browser
4. `POST /api/payments/razorpay/verify` — Verify signature, confirm order
5. Order status → CONFIRMED, loyalty points awarded

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npx vercel --prod
# Set env vars in Vercel dashboard
```

### Backend (Railway)
1. Push backend to GitHub
2. Connect to Railway → "Deploy from GitHub"
3. Set environment variables in Railway dashboard
4. Run: `npx prisma migrate deploy`

### Database (Supabase)
1. Create project at supabase.com
2. Copy connection string from Settings → Database
3. Add to backend `.env` as `DATABASE_URL`

---

## 🎁 Default Coupons

| Code | Discount |
|------|----------|
| `WELCOME20` | 20% off (max ₹500, min order ₹299) |
| `RESIN50` | ₹50 off (min order ₹499) |
| `LOVE15` | 15% off couple gifts (min ₹699) |

---

## 📱 Product Categories

Keychains · Lockets · Rings · Bracelets · Earrings · Name Tags · Bookmarks · Phone Charms · Couple Gifts · Custom Gifts

---

## 🔒 Security

- JWT tokens with 7-day expiry
- bcrypt password hashing (12 rounds)
- Rate limiting (200 req/15min global, 10 req/15min auth)
- Helmet.js security headers
- Input validation with express-validator + Zod
- Razorpay signature verification

---

Built with 💜 for the aesthetic Gen Z generation.
