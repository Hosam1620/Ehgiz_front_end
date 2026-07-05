# Ehgiz — Peer-to-Peer Tool Rental Marketplace (Frontend)

Ehgiz (احجز — "reserve") is a full-stack marketplace where people rent tools from their neighbors. This repository contains the **Angular 21 single-page application**; it talks to an **ASP.NET Core Web API** backend over REST and SignalR.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Backend API Contract](#backend-api-contract)
- [Authentication Flow](#authentication-flow)
- [Real-Time (SignalR)](#real-time-signalr)
- [Testing](#testing)
- [Build & Deployment](#build--deployment)
- [Conventions](#conventions)

---

## Architecture Overview

```
┌─────────────────────────────┐        HTTPS (REST, JSON)        ┌──────────────────────────┐
│   Angular 21 SPA (this repo)│ ───────────────────────────────► │  ASP.NET Core Web API    │
│                             │                                  │  http://localhost:5257   │
│  • Standalone components    │ ◄──────────────────────────────  │                          │
│  • Signals for state        │        WebSockets (SignalR)      │  • JWT auth + refresh    │
│  • Lazy-loaded routes       │        /hubs/chat                │    cookie                │
│  • HTTP interceptors        │        /hubs/notifications       │  • Stripe integration    │
└─────────────────────────────┘                                  └──────────────────────────┘
                                                                             │
                                                                   Stripe API / Database
```

- **REST** — all CRUD operations, wrapped in a uniform `ApiResponse<T>` envelope (`succeeded`, `data`, `message`).
- **SignalR** — live chat and push notifications over persistent hub connections.
- **Stripe** — wallet top-ups via Stripe.js on the client with server-side payment intents.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21 (standalone components, signals, `inject()`) |
| Language | TypeScript 5.9 (strict) |
| Styling | Bootstrap 5.3 + custom CSS, light/dark theme service |
| Real-time | `@microsoft/signalr` 10 |
| Payments | `@stripe/stripe-js` 9 |
| Charts | Chart.js 4 (admin/dashboard analytics) |
| Testing | Vitest 4 + jsdom |
| Tooling | Angular CLI 21, Prettier |
| Backend (separate repo) | ASP.NET Core Web API, JWT auth, SignalR hubs, Stripe |

## Features

- **Authentication** — register (multipart with optional profile & national-ID images), email OTP verification, login, silent token refresh, forgot/reset password, profile management.
- **Tool marketplace** — public browse & tool detail pages, owner CRUD for listings, category filtering, saved searches with re-run support.
- **Bookings** — create, track, and manage rentals end-to-end.
- **Wallet & payments** — balance, transaction history, Stripe-powered top-ups with a dedicated payment-return route.
- **Reviews** — per-tool ratings and review management.
- **Messaging** — real-time 1:1 chat between renters and owners (SignalR).
- **Notifications** — live in-app notifications with read state (SignalR).
- **AI features** — AI assistant chat and search-tools-by-photo (image search).
- **Admin panel** — user/listing moderation, platform-fee settings, analytics (role-gated).
- **Static pages** — how it works, pricing, help, safety, insurance, terms, privacy, cookies.

## Project Structure

```
src/
├── app/
│   ├── core/                    # Singleton, app-wide concerns
│   │   ├── guards/              # authGuard, guestGuard, adminGuard
│   │   ├── interceptors/        # auth (bearer token), error (global handling)
│   │   ├── models/              # Typed API contracts (ApiResponse, Tool, Booking, …)
│   │   ├── services/            # One service per API domain + SignalR hub services
│   │   ├── utils/
│   │   └── ehgiz-title.strategy.ts  # Route titles → "<page> · Ehgiz"
│   ├── features/                # Lazy-loaded feature areas (one folder per domain)
│   │   ├── admin/  ai/  auth/  bookings/  dashboard/  home/  messages/
│   │   ├── notifications/  pages/  profile/  reviews/  saved-searches/
│   │   ├── tools/  wallet/  not-found/
│   ├── shared/                  # Reusable components, directives, pipes
│   ├── app.routes.ts            # All routes, lazy `loadComponent` + guards
│   └── app.config.ts            # Providers: router, http, interceptors
├── environments/                # environment.ts (prod) / environment.development.ts
└── styles.css                   # Global styles & theme variables
```

**Design rules**

- Every route is lazy-loaded via `loadComponent` — no eager feature code in the main bundle.
- State lives in services as **signals** (`signal`/`computed`); components stay thin.
- All HTTP goes through domain services in `core/services` — components never call `HttpClient` directly.
- Route access is enforced by guards: `guestGuard` (public-only pages redirect logged-in users to `/dashboard`), `authGuard`, and `adminGuard`.

## Getting Started

### Prerequisites

- **Node.js** 20+ and **npm** 11+
- **Backend API** running locally on `http://localhost:5257` (see the Ehgiz backend repository — .NET 8 SDK required to run it)
- A **Stripe test** publishable key (already wired for development)

### Run the frontend

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (http://localhost:4200)
npm start
```

The dev server proxies nothing — the app calls the API origin from `environment.development.ts` directly, so the backend must allow CORS from `http://localhost:4200` and be running before login/data pages will work. Public pages (`/`, `/browse`, tool details) render without a session.

### Run the backend (summary)

From the backend repository:

```bash
dotnet restore
dotnet ef database update   # apply migrations
dotnet run                  # serves on http://localhost:5257
```

Ensure the backend is configured with: a JWT signing key, the refresh-token cookie enabled for `http://localhost:4200` (CORS with credentials), Stripe secret key (test mode), and SMTP settings for OTP verification emails.

## Environment Configuration

| File | Used by | Purpose |
|---|---|---|
| `src/environments/environment.development.ts` | `ng serve`, dev builds | Local API origin + Stripe **test** key |
| `src/environments/environment.ts` | Production builds | Deployed API origin + Stripe **live** key |

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5257',
  stripePublishableKey: 'pk_test_…',
};
```

> ⚠️ Before deploying, set `apiUrl` in `environment.ts` to the real API origin (e.g. `https://api.ehgiz.com`) and swap in the `pk_live_…` Stripe key. Only the **publishable** key ever lives in this repo — secret keys stay on the backend.

## Backend API Contract

All endpoints return `ApiResponse<T>`:

```json
{ "succeeded": true, "message": "…", "data": { } }
```

| Domain | Base path | Highlights |
|---|---|---|
| Auth | `/api/auth` | `login`, `register` (multipart), `verify-email`, `forgot-password`, `reset-password`, `resend-verification`, `refresh`, `logout`, `me`, `me/profile-image` |
| Tools | `/api/Tools` | Public list/detail (`AllowAnonymous`), owner CRUD, image upload |
| Categories | `/api/categories` | Tool categories (frontend falls back to a static list if unavailable) |
| Bookings | `/api/bookings` | Create/list/detail, status transitions |
| Wallet | `/api/wallet` | Balance, transactions, Stripe top-up intents |
| Reviews | `/api/reviews` | Per-tool reviews (`/api/reviews/tool/{id}`), create |
| Messages | `/api/messages` | Conversation history (live delivery via SignalR) |
| Notifications | `/api/notifications` | List, mark-as-read |
| Saved searches | `/api/saved-searches` | CRUD for stored browse filters |
| Settings | `/api/settings/platform-fee` | Platform fee percentage (admin-editable) |
| Admin | `/api/admin` | Users, moderation, analytics |
| AI | `/api/ai/assistant` | Assistant chat; image search |

Domain notes the backend must honor:

- **Tool condition** is a numeric enum `1–5` (New → Poor).
- Booking **rollback** exists on the API but is intentionally not exposed in the UI.

## Authentication Flow

Security-first design — no tokens in `localStorage`:

1. **Login** returns a short-lived **JWT access token**, kept **in memory only** (an Angular signal), plus an **HttpOnly refresh cookie** set by the server (`withCredentials: true`).
2. The **auth interceptor** attaches `Authorization: Bearer <token>` to API requests.
3. On app startup, a lightweight session hint (a flag, never a token) decides whether to attempt a **silent refresh** (`POST /api/auth/refresh`) — so public visitors never hit the refresh endpoint.
4. The **error interceptor** handles expiry/401s globally; logout clears the in-memory token and revokes the cookie server-side.
5. New accounts must verify via an **email OTP code** before login succeeds.

## Real-Time (SignalR)

| Hub | URL | Purpose |
|---|---|---|
| Chat | `{apiUrl}/hubs/chat` | Live messages, typing/read state |
| Notifications | `{apiUrl}/hubs/notifications` | Push notifications to the bell/list |

Hub services (`chat-hub.service.ts`, `notification-hub.service.ts`) authenticate with the access token, reconnect automatically, and expose events as observables/signals for components.

## Testing

Unit tests run on **Vitest** with jsdom:

```bash
npm test          # ng test (Vitest)
```

Coverage focuses on the contract-critical core: auth/booking/tools/wallet/notification/saved-search services, all three guards, and both interceptors — using Angular's `HttpTestingController` to assert exact request shapes against the API.

## Build & Deployment

```bash
npm run build     # production build → dist/
npm run watch     # dev build in watch mode
```

- Production builds use `environment.ts` (via `fileReplacements` in [angular.json](angular.json)).
- Output is a static SPA — host on any static host/CDN (nginx, Azure Static Web Apps, S3+CloudFront, …).
- Configure the host to **rewrite all routes to `index.html`** (client-side routing).
- The backend must allow CORS **with credentials** from the deployed frontend origin, since auth relies on the refresh cookie.

## Conventions

- **Formatting:** Prettier (see `.prettierrc`) — run before committing.
- **Components:** standalone, `OnPush`-friendly, signals over mutable fields.
- **Naming:** one feature folder per domain; services end in `.service.ts`, guards in `.guard.ts`, models in `.model.ts`.
- **Commits:** conventional style (`feat:`, `fix:`, `chore:` …) as seen in history.

---

*Ehgiz — rent tools from your neighbors.* 🛠️
