# Campus Hustle UI — Presentation Prototype

A polished, responsive front-end prototype for the **Campus Hustle** campus marketplace concept.

## What is included

- Explore / marketplace landing page
- Search
- Category browsing
- Listing cards with save/unsave interaction
- Saved items
- Buyer/seller chat
- Bargaining flow + agreed-deal card
- My deals / activity
- Seller Studio dashboard
- Sales overview chart
- Create listing form
- Live listing preview
- Campus verification / trust signals
- Profile and trust score
- Settings / safety-oriented preferences
- Notifications modal
- Responsive mobile layout

## Run it

No Node.js is required for this presentation prototype.

1. Unzip the folder.
2. Open `index.html` in Chrome/Edge.
3. Click around the navigation and interactive controls.

For the best presentation experience, use a desktop browser at around 1440px width.

## Suggested presentation story

1. **Explore** — show how this replaces noisy WhatsApp groups.
2. **Listing** — open Seller Studio / Create a listing.
3. **Trust** — point out campus verification, ratings and transparent pickup details.
4. **Chat** — show the bargaining conversation and agreed deal.
5. **My deals** — show the transaction history.
6. **Seller Studio** — show how a real campus business owner manages the hustle.

## Backend integration

The UI is intentionally static and API-ready. Replace the mock `listings` array in `app.js` with calls to your FastAPI REST/GraphQL endpoints.

Suggested future API groups:

- `GET /api/v1/listings`
- `POST /api/v1/listings`
- `GET /api/v1/listings/{id}`
- `POST /api/v1/listings/{id}/save`
- `GET /api/v1/conversations`
- `POST /api/v1/conversations/{id}/messages`
- WebSocket for live chat
- `POST /api/v1/deals`
- `GET /api/v1/seller/analytics`

## Design direction

Warm white surfaces + deep charcoal + soft violet are used to give the product a premium student-startup feel without making it look like another social media clone.
