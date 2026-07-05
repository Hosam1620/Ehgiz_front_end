# Ehgiz Frontend

Ehgiz is a peer-to-peer tool rental marketplace: list your tools, browse what your neighbors are renting out, book, pay, chat, review. This repo is the Angular frontend. The backend is a separate ASP.NET Core Web API project that handles auth, data, payments and the SignalR hubs.

## Stack

Frontend:

- Angular 21, standalone components only, signals for state, `inject()` everywhere
- Bootstrap 5.3 with a custom theme layer (light/dark via ThemeService)
- @microsoft/signalr for chat and notifications
- @stripe/stripe-js for wallet top-ups
- Chart.js for dashboard/admin charts
- Vitest + jsdom for unit tests
- TypeScript 5.9, Prettier

Backend (separate repo):

- ASP.NET Core Web API on `http://localhost:5257` in dev
- JWT access tokens + HttpOnly refresh cookie
- SignalR hubs at `/hubs/chat` and `/hubs/notifications`
- Stripe server-side (payment intents), SMTP for OTP emails

## Running locally

You need Node 20+ and the backend running first.

Backend (from its repo):

```bash
dotnet restore
dotnet ef database update
dotnet run        # listens on http://localhost:5257
```

Make sure the API has CORS enabled with credentials for `http://localhost:4200`, a JWT signing key, Stripe test secret key, and SMTP configured (registration sends an OTP email, you can't log in without verifying).

Frontend:

```bash
npm install
npm start         # http://localhost:4200
```

There's no dev proxy. The app calls the API origin from `src/environments/environment.development.ts` directly, so if the backend isn't up you'll still get the public pages (landing, browse, tool details) but nothing that needs a session.

Other scripts: `npm run build` (prod build to `dist/`), `npm run watch`, `npm test`.

## Environments

- `environment.development.ts` - used by `ng serve`. Local API URL + Stripe test publishable key.
- `environment.ts` - production. Swapped in by `fileReplacements` in angular.json.

Before deploying, set `apiUrl` in `environment.ts` to the real API origin and replace the Stripe key with the live publishable key. It currently still points at localhost. Only the publishable key lives here; secrets stay on the backend.

## How the app is organized

```
src/app/
  core/            singletons and cross-cutting stuff
    guards/        authGuard, guestGuard, adminGuard
    interceptors/  auth (bearer header), error (global handling)
    models/        typed API contracts
    services/      one service per API domain + the two hub services
  features/        lazy-loaded pages, one folder per domain
                   (auth, tools, bookings, wallet, messages, reviews,
                    notifications, saved-searches, dashboard, admin, ai, pages)
  shared/          navbar, footer, toast, confirm-dialog, tool-card,
                   pagination, avatar, spinner, ai-chat-widget,
                   time-ago pipe, focus-trap directive
```

Rules I've tried to stick to:

- Every route is lazy (`loadComponent`), nothing feature-specific in the main bundle.
- Components never touch `HttpClient`. All HTTP goes through the services in `core/services`, which own the state as signals.
- Route access is handled by guards. `guestGuard` bounces logged-in users from public-only pages (landing, login, register) to `/dashboard`. `adminGuard` sits on top of `authGuard` for `/admin`.
- Route titles come from a custom `TitleStrategy` so every page gets a proper tab title.
- The router runs with `withComponentInputBinding()` and `withViewTransitions()`.

## Auth

No tokens in localStorage, deliberately:

- Login returns a short-lived JWT that lives in memory (a signal in AuthService) plus an HttpOnly refresh cookie set by the server. All auth calls use `withCredentials: true`.
- The auth interceptor adds the bearer header; the error interceptor deals with 401s globally.
- On startup an app initializer checks a "session hint" flag (just a marker that you've logged in before on this browser, never a token). If present it silently calls `/api/auth/refresh` and then `/api/auth/me`. Anonymous visitors on public pages never hit the refresh endpoint.
- Registration is multipart (profile image and national ID image are optional uploads) and requires OTP email verification before login works.

## API surface

Everything comes back wrapped in the same envelope:

```json
{ "succeeded": true, "message": "...", "data": {} }
```

Endpoints the frontend uses:

| Base path | What's there |
|---|---|
| `/api/auth` | login, register, verify-email, resend-verification, forgot/reset-password, refresh, logout, me, me/profile-image |
| `/api/Tools` | public list + detail, owner CRUD, images |
| `/api/categories` | tool categories (frontend falls back to a static list if this fails) |
| `/api/bookings` | create, list, detail, status changes |
| `/api/wallet` | balance, transactions, Stripe top-up intents |
| `/api/reviews` | per-tool reviews, create |
| `/api/messages` | conversation history (delivery is via SignalR) |
| `/api/notifications` | list, mark read |
| `/api/saved-searches` | CRUD for saved browse filters |
| `/api/settings/platform-fee` | platform fee percentage |
| `/api/admin` | users, moderation, analytics |
| `/api/ai/assistant` | assistant chat; image search lives under the ai feature |

A couple of contract details worth knowing:

- Tool condition is a numeric enum, 1 to 5 (1 = New ... 5 = Poor).
- Booking rollback exists on the API but is intentionally not exposed in the UI.

## Real-time

Two hub connections, both authenticated with the access token and set up to auto-reconnect:

- `/hubs/chat` - live messages for the chat pages
- `/hubs/notifications` - pushes into the navbar dropdown and the notifications page

The hub services (`chat-hub.service.ts`, `notification-hub.service.ts`) wrap the connections and expose events to components, same pattern as the HTTP services.

## Tests

```bash
npm test
```

Vitest with jsdom. Coverage is concentrated where the API contract matters: the auth/booking/tools/wallet/notification/saved-search services, all three guards, and both interceptors, using `HttpTestingController` to pin down exact request shapes.

## Deploying

`npm run build` produces a static SPA in `dist/`. Host it anywhere static (nginx, S3+CloudFront, Azure Static Web Apps), but:

- rewrite all routes to `index.html`, it's client-side routed
- the API needs CORS with credentials for the deployed origin, since auth depends on the refresh cookie
- don't forget the environment.ts changes mentioned above
