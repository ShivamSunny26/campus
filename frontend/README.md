# 🎓 Campus Hustle Frontend

Modern, high-trust peer-to-peer campus marketplace interface for textbooks, student tech, dorm comfort, and campus services.

Crafted with **Plus Jakarta Sans**, **Tailwind CSS**, and **Google Material Symbols**, fully integrated with the FastAPI backend hosted on Render (`https://campus-cdti.onrender.com/`) and pre-configured for instant zero-config deployment on **Vercel**.

---

## 🚀 Live Backend Integration

- **Backend Base URL:** `https://campus-cdti.onrender.com/`
- **FastAPI Endpoints Bound:**
  - `GET /health` — Live server heartbeat and latency check
  - `POST /api/v1/auth/register` — Official student registration (`.edu` validation, 12+ character password enforcement)
  - `POST /api/v1/auth/login` — Student authentication returning JWT access & refresh tokens
  - `POST /api/v1/auth/refresh` — Automatic token renewal on expiration
  - `GET /api/v1/auth/me` / `GET /api/v1/users/me` — Authenticated student profile retrieval
  - `GET /api/v1/listings` — Live active marketplace discovery with category filtering & sorting
  - `GET /api/v1/listings/{id}` — Full listing inspection
  - `POST /api/v1/listings` — Authenticated listing publishing
  - `DELETE /api/v1/listings/{id}` — Listing removal

---

## 🎨 Implemented UI/UX Screens & User Flows

All 20 UI/UX screens from the design specifications in `pictures/` are unified into a fast, smooth, zero-latency Single Page Application (SPA):

1. **Campus Home Feed (`#home`)**
   - Verified student hub status bar with live sync beacon.
   - Hero section with *Explore Deals* and *Sell Fast* quick triggers.
   - Dynamic search bar with instant search clearing.
   - Scrollable category filter pills (*All Items, Tech & Audio, Notes & Books, Dorm Comfort, Bikes & Wheels, Services*).
   - Dynamic product cards featuring .edu badges, star ratings, prices, distance, and wishlist hearts.
   - Persistent mobile & desktop bottom navigation dock.

2. **Marketplace Explore (`#explore`)**
   - Interactive search with live query filtering.
   - Multi-category carousel tabs.
   - Quick sorting: *Newest first, Price: Low to High, Price: High to Low, Highest Rated*.
   - Filter drawer with max price range slider, verified student toggle, and item condition chips.
   - Active filter badges with one-click removal and "Reset all".

3. **Listing Detail View (`#detail`)**
   - Interactive image carousel with progress indicator (`1 / 3`), previous/next arrows, and slide dots.
   - Context tags: `.EDU VERIFIED LISTING`, `Fast Responder`, `Inspected • Excellent`.
   - Clear price block with savings comparison.
   - Verified campus pickup location (*Moffitt Library 3rd Floor Safe Zone*).
   - Seller reputation profile card with star ratings and completed transaction history.
   - Sticky bottom action dock: *Make Offer*, *Chat*, *Lock Deal*, and *Wishlist Save*.

4. **Sell / Create Listing (`#create`)**
   - Step progress indicator (*Step 1 of 2: Details & Pricing*).
   - **Live Marketplace Preview accordion** that updates in real-time as the student types title, category, price, and pickup location!
   - Photo upload dropzone supporting real local image selection, instant thumbnail rendering, cover photo badges, and removal.
   - Category, price, pickup zone, quantity, and detailed description inputs.
   - Direct connection to FastAPI `POST /api/v1/listings` with loading states.

5. **Student Authentication (`#auth`)**
   - Segmented tab switcher: *Sign In* vs *Create Account*.
   - Login form with remember me and live FastAPI JWT issuance.
   - Registration form with legal name, `.edu` email check, 12+ character password validation, and campus selector.
   - ⚡ 1-click test student credentials filler for instant demonstration.

6. **Student Profile & Settings (`#profile`)**
   - Student profile card with official `.edu` verification badge, campus affiliation, and major.
   - Trust score & metrics: Total earned ($525), Deals completed (19), Rating (4.9 ★), Wishlist count.
   - Live backend health inspector displaying real-time latency to Render.
   - Account settings and secure sign out.

7. **Seller Studio & $525 Milestone Dashboard (`#seller`)**
   - Celebratory *Level Unlocked: Campus Legend ($500+ Club)* milestone banner.
   - 4-metric grid: Total Revenue ($525), Sold Trades (19), Active Listings, Rating.
   - 7-day SVG sales trend chart.
   - Active seller listings table with quick *-$5 Price Drop* action and *Remove* action.
   - Quick triggers for PDF and CSV tax exports.

8. **Incoming Textbook Offers (`#offers`)**
   - Competing student offers (*Chloe Zhang $40.00*, *Marcus Vance $36.00*).
   - Pinned listing context card with auto-expiration countdown timer.
   - One-click *Accept & Lock Escrow*, *Counter*, and *Decline* buttons.

9. **Student Chat & Bargaining Negotiation (`#chat`)**
   - Real-time bargaining conversation with verified student Sarah Miller.
   - Pinned item snapshot card with agreed offer badge.
   - In-chat bargaining card with counter-offer generation.
   - Quick bargaining suggestion chips (*Can you do $35?*, *Meet at Moffitt Library today?*).
   - Instant response simulator for a responsive conversation feel.

10. **Meetup Handover PIN & QR Code (`#handover-pin`)**
    - Escrow confirmed celebratory alert (*Deal #TX-8493-CAL*).
    - Large 4-digit PIN grid (`8 4 9 2`) with 1-click clipboard copy.
    - Generative SVG QR Code pass.
    - Verified daylight safe zone meetup guidelines.

11. **Handover Confirmation & Review Modal (`#modal-review`)**
    - Two-way inspection checklist (*Item physically inspected*, *PIN exchanged*).
    - Interactive 5-star student review selector and comment input.
    - Submit trigger that seamlessly transitions to payout settlement.

12. **Payout Settled & Settlement Celebration (`#modal-payout-settled`)**
    - Settlement celebration banner confirming $40.00 release with 0% platform take rate.
    - Direct shortcut to official receipt.

13. **Official Digital Transaction Receipt (`#receipt`)**
    - Official receipt `#TX-8104-CAL` with verified seal.
    - Full breakdown: item, seller, buyer, price, campus safe zone, zero fees.
    - Share proof and export triggers.

14. **PDF Receipt Export Preview (`#modal-pdf-preview`)**
    - High-fidelity PDF layout with ASUC seal.
    - Zoom controls and native browser print trigger (`window.print()`).

15. **CSV Tax Summary Export (`#modal-csv-export`)**
    - 2024 Sales & Tax Ledger overview with 1099-K safe threshold gauge (10.5% of cap).
    - Actual CSV file generator that directly downloads `Campus_Hustle_Tax_Ledger_2024.csv` to the device.

16. **Dispute Resolution & Honor Mediation (`#dispute-report`)**
    - Report issue form (defective item, no-show, payment issue) with evidence attachment.
    - Protected under the UC Berkeley Student Marketplace Policy.

---

## 🛠️ Local Development & Testing

1. Open PowerShell / Terminal in the `frontend` directory:
   ```powershell
   cd frontend
   python -m http.server 2501
   ```
2. Open your browser at:
   ```
   http://localhost:2501
   ```
   *(Port `2501` is pre-whitelisted in the Render backend's CORS origin list!)*

---

## 🚢 Deploying to Vercel

The frontend is 100% static, fast, and pre-configured with `vercel.json`:

### Option A: Via Vercel CLI
```bash
npm i -g vercel
vercel
```

### Option B: Via Vercel Web Dashboard (GitHub)
1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Select your repository `campus_hustle`.
4. In the Project Settings:
   - **Root Directory:** `./frontend` (or leave as root, as both have `vercel.json` configured!)
   - **Framework Preset:** Other / None
5. Click **Deploy**!

### Why Vercel Rewrites Prevent All CORS Issues:
In `vercel.json`, we have:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://campus-cdti.onrender.com/api/:path*"
    },
    {
      "source": "/health",
      "destination": "https://campus-cdti.onrender.com/health"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
When deployed on Vercel:
- All requests to `/api/v1/...` are proxied directly by Vercel edge servers to `https://campus-cdti.onrender.com/api/v1/...`.
- The browser sees same-origin requests, completely eliminating CORS restrictions, mixed content warnings, and preflight latencies.
