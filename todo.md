# Ehgiz Frontend TODO — Booking, Wallet, Reviews, Admin

Track implementation progress. See [PLAN.md](./PLAN.md) for full specifications.

## Phase 1 — Foundation

- [x] Write PLAN.md and todo.md
- [x] Align TypeScript models with backend DTOs
  - [x] `core/models/booking.model.ts`
  - [x] `core/models/review.model.ts`
  - [x] `core/models/wallet.model.ts` (new)
  - [x] `core/models/admin.model.ts` (new)
- [x] Create API services
  - [x] `core/services/booking.service.ts`
  - [x] `core/services/wallet.service.ts`
  - [x] `core/services/review.service.ts`
  - [x] `core/services/admin.service.ts`
- [x] Add Stripe dependency and `stripePublishableKey` to environment

## Phase 2 — Bookings

- [x] `booking-list` — My / Received tabs, cards, loading & empty states
- [x] `booking-create` — tool load, dates, submit, error handling
- [x] `booking-detail` — full detail view + all `allowedActions`
- [x] Handover modals (multipart image upload)
- [x] Report issue modal

## Phase 3 — Wallet

- [x] Add routes: `/wallet`, `/wallet/topup/return`
- [x] `wallet` component — balance, transactions, top-up, withdraw, connect
- [x] `wallet-topup-return` component — post-checkout landing
- [x] Navbar link to wallet

## Phase 4 — Reviews

- [x] `review-create` — rating form tied to bookingId
- [x] `review-list` — user's reviews (via bookings + API)
- [x] Wire "Leave review" from booking detail

## Phase 5 — Admin dashboard

- [x] Replace static admin UI with tabbed sections:
  - [x] Disputes (list + detail + resolve actions)
  - [x] Issue reports (list + status update)
  - [x] Platform fee settings
- [x] Remove fake stats (users, listings, categories)

## Phase 6 — Integration polish

- [x] Dashboard: live active bookings count
- [x] Navbar: Bookings link
- [x] `ng build` passes with no errors
- [ ] Manual smoke test against running backend

## Follow-ups (completed)

- [x] Reviews on tool detail + average rating
- [x] Tool-detail pricing aligned with backend (flat insurance, no service fee)
- [x] Availability calendar on tool detail
- [x] Admin dispute detail with handovers, issue descriptions, partial refund modal
- [x] Stripe checkout fix (`createEmbeddedCheckoutPage`)

## Notes

- Backend base URL: `http://localhost:5257`
- Admin test user: `ahmad.hassan@ehgiz.com` (seeded)
- Stripe top-up requires valid keys in backend `appsettings.json` and frontend `environment.ts`
