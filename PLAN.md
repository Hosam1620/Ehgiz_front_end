# Ehgiz Frontend — Booking, Wallet, Reviews & Admin Plan

This plan covers wiring the Angular 21 frontend to the existing ASP.NET Core backend for four feature areas. Reference UI patterns live in `ehgiz-mockup.html`; working API integrations follow `tools.service.ts` and `auth.service.ts`.

## Current state

| Area | Backend | Frontend |
|------|---------|----------|
| Bookings (my / received) | Complete (`/api/bookings/*`) | Routes exist; components are empty stubs |
| Wallet | Complete (`/api/wallet/*`) | No route, service, or components |
| Reviews | Complete (`/api/Reviews/*`) | Routes exist; components are empty stubs |
| Admin dashboard | Disputes, issue reports, platform fee | Static placeholder UI with fake stats |

## Architecture

```
src/app/
├── core/
│   ├── models/          booking, wallet, review, admin models (aligned to backend DTOs)
│   └── services/        booking, wallet, review, admin services
└── features/
    ├── bookings/        list (tabs), create, detail (lifecycle actions)
    ├── wallet/          balance, transactions, top-up, withdraw, connect
    ├── reviews/         create (from booking), list (user's reviews via bookings)
    └── admin/           disputes, issue reports, platform fee settings
```

### API patterns

- Most endpoints: `ApiResponse<T>` with `{ succeeded, message, data, errors }`
- Reviews: raw DTO arrays/objects (no wrapper)
- Admin platform fee GET/PUT: plain `{ feePercent }` / `{ message, feePercent }`
- Auth: JWT in memory + httpOnly refresh cookie (existing interceptors)

## Feature specifications

### 1. Bookings

**List page** (`/bookings`)

- Tabs: **My bookings** (`GET /api/bookings/my`) and **Received** (`GET /api/bookings/received`)
- Card shows: tool, other party, dates, total, status chip, handover summaries
- Primary action: View details → `/bookings/:id`

**Create page** (`/bookings/create?toolId=&startDate=&endDate=`)

- Load tool via `ToolsService.getById`
- Date range picker; show cost preview (rental + flat insurance from tool)
- Submit `POST /api/bookings` → redirect to detail on success
- Handle insufficient wallet balance error with link to `/wallet`

**Detail page** (`/bookings/:id`)

- Load `GET /api/bookings/{id}`
- Render cost breakdown, handovers, escrow/payment status
- Action buttons driven by `allowedActions` from server:

| Action | API |
|--------|-----|
| Accept / Reject | `PUT .../accept`, `PUT .../reject` |
| Cancel | `PUT .../cancel` |
| Submit delivery/return handover | `POST .../handover/delivery|return` (multipart) |
| Respond to handover | `PUT .../handover/*/respond` |
| Report issue | `POST .../report-issue` |
| Message owner/renter | existing messages service |
| Leave review | navigate to `/reviews/create?bookingId=` |

**Statuses:** `Pending`, `Accepted`, `DeliveryHandover`, `Active`, `ReturnHandover`, `Completed`, `Rejected`, `Cancelled`, `Disputed`

### 2. Wallet

**Main page** (`/wallet`)

- Balance cards: available, held (escrow), total — `GET /api/wallet`
- Transaction table — `GET /api/wallet/transactions`
- Top-up form — `POST /api/wallet/topup` → Stripe embedded checkout (`@stripe/stripe-js`)
- Withdraw form — `POST /api/wallet/withdraw` (requires Stripe Connect)
- Connect bank — `GET /api/wallet/connect/onboard` → redirect to onboarding URL

**Return page** (`/wallet/topup/return`)

- Stripe redirect target after embedded checkout
- Show success/pending message; link back to wallet

**Environment:** add `stripePublishableKey` (must match backend `Stripe:PublishableKey`)

### 3. Reviews

**Create** (`/reviews/create?bookingId=`)

- Form: rating 1–5, optional comment
- `POST /api/Reviews` with `{ bookingId, rating, comment }`
- Only renter on completed booking (enforced by backend)

**List** (`/reviews`)

- Show reviews for tools the user rented (load completed bookings without review + existing reviews from tool endpoints)
- Delete own review: `DELETE /api/Reviews/{id}`

**Tool detail (optional follow-up):** display reviews via `GET /api/Reviews/tool/{toolId}`

### 4. Admin dashboard

Replace static mock with real admin API scope:

| Section | API |
|---------|-----|
| Disputes list | `GET /api/admin/disputes` |
| Dispute detail + resolve | `GET /api/admin/disputes/{id}`, PUT favor-owner/renter/partial-refund/force-complete/force-cancel |
| Issue reports | `GET /api/admin/issue-reports`, PUT status |
| Platform fee | `GET/PUT /api/admin/settings/platform-fee` |

Guard: existing `adminGuard` on `/admin` route.

## Shared UI updates

- **Navbar:** add Bookings and Wallet links for logged-in users
- **Dashboard:** replace "Booking API pending" with live active booking count from `/api/bookings/my`
- **Models:** replace string IDs with `number`; match backend field names (camelCase JSON)

## Dependencies

```bash
npm install @stripe/stripe-js
```

Add to `environment.ts`:

```ts
stripePublishableKey: 'pk_test_...' // same as backend appsettings
```

## Testing checklist

1. Login as renter → create booking from tool → appears under My bookings
2. Login as owner → booking appears under Received → Accept → delivery handover flow
3. Wallet shows balance; top-up initiates Stripe (with valid keys)
4. Completed booking → Leave review → review visible
5. Login as admin → view disputes, update issue report status, change platform fee

## Out of scope (backend has no endpoints)

- Admin user management, listings CRUD, categories, platform analytics (mockup only)
