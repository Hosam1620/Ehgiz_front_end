# Ehgiz Front-End — Development Guide

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21.2 (standalone, zoneless-ready) |
| Language | TypeScript 5.9 (strict mode) |
| Styling | Bootstrap 5.3.8 (utility-first, no component styles) |
| State | Angular Signals (`signal`, `computed`, `model`) |
| HTTP | `HttpClient` with functional interceptors |
| Routing | `@angular/router` with lazy-loaded feature components |
| Testing | Vitest 4 + jsdom |
| Build | `@angular/build` (esbuild) |

---

## Project Structure

```
src/app/
├── core/
│   ├── guards/          # Route guards
│   ├── interceptors/    # HTTP interceptors
│   ├── models/          # TypeScript interfaces & types
│   └── services/        # Injectable services
├── features/            # Lazy-loaded route components
│   ├── ai/
│   ├── auth/
│   ├── bookings/
│   ├── dashboard/
│   ├── messages/
│   ├── not-found/
│   ├── notifications/
│   ├── payments/
│   ├── profile/
│   ├── reviews/
│   └── tools/
└── shared/
    ├── components/      # Reusable UI components
    └── pipes/           # Reusable pipes
```

---

## ✅ What Is Already Built

### App Shell
| File | Description |
|---|---|
| `app.ts` + `app.html` | Root component: navbar → router-outlet → footer layout |
| `app.config.ts` | Registers `provideRouter`, `provideHttpClient`, both interceptors |
| `app.routes.ts` | All routes defined with lazy-loading and `authGuard` |

### Core — Models (11 interfaces)
| Model | Key Types Exported |
|---|---|
| `user.model.ts` | `User`, `LoginRequest`, `RegisterRequest`, `AuthResponse`, `UserRole` |
| `tool.model.ts` | `Tool`, `ToolCreateRequest`, `ToolUpdateRequest`, `ToolSearchParams`, `ToolStatus` |
| `booking.model.ts` | `Booking`, `BookingCreateRequest`, `BookingStatus` |
| `review.model.ts` | `Review`, `ReviewCreateRequest` |
| `message.model.ts` | `Message`, `Conversation`, `SendMessageRequest`, `StartConversationRequest` |
| `notification.model.ts` | `Notification`, `NotificationType` |
| `payment.model.ts` | `Payment`, `PaymentInitiateRequest`, `PaymentStatus` |
| `category.model.ts` | `Category` |
| `ai.model.ts` | `AiClassificationRequest/Result`, `AiImageAnalysisRequest/Result`, `AiSearchResult`, `AiRagSearchRequest` |
| `api-response.model.ts` | `ApiResponse<T>` |
| `paged-result.model.ts` | `PagedResult<T>` |

### Core — Infrastructure
| File | Description |
|---|---|
| `auth.service.ts` | JWT auth with signals: `isLoggedIn`, `currentUser`, `token`; `login()`, `register()`, `logout()` |
| `auth.guard.ts` | Redirects unauthenticated users to `/login` |
| `auth.interceptor.ts` | Attaches `Authorization: Bearer <token>` to all requests |
| `error.interceptor.ts` | Auto-logout on HTTP 401 |

### Shared — Components (6)
| Component | Selector | Key Inputs / Outputs |
|---|---|---|
| `NavbarComponent` | `app-navbar` | `isLoggedIn`, `userName` inputs; `logoutClicked` output |
| `FooterComponent` | `app-footer` | None — static links + auto year |
| `LoadingSpinnerComponent` | `app-loading-spinner` | `message`, `overlay` inputs |
| `ConfirmationModalComponent` | `app-confirmation-modal` | `title`, `message`, `confirmLabel`, `cancelLabel`, `confirmClass`; `confirmed`/`cancelled` outputs; `open()` method |
| `PaginationComponent` | `app-pagination` | `currentPage`, `totalPages`, `totalItems`, `pageSize`; `pageChange` output |
| `StarRatingComponent` | `app-star-rating` | `rating` (two-way `model()`), `maxStars`, `readonly` |

### Shared — Pipes (3)
| Pipe | Usage |
|---|---|
| `dateFormat` | `{{ value \| dateFormat:'short'/'medium'/'long' }}` |
| `currencyFormat` | `{{ amount \| currencyFormat:'USD' }}` → `$1,250.00` |
| `truncate` | `{{ text \| truncate:80 }}` |

### Environments
| File | `apiUrl` |
|---|---|
| `environment.ts` | `https://api.ehgiz.com/api/v1` |
| `environment.development.ts` | `http://localhost:3000/api/v1` |

---

## 🔲 What Still Needs to Be Built

### Services (8 remaining — empty files)
All services follow the same pattern: inject `HttpClient`, call `environment.apiUrl`, return `Observable<ApiResponse<T>>` or `Observable<ApiResponse<PagedResult<T>>>`.

| Service | Key Methods Needed |
|---|---|
| `tool.service.ts` | `getAll(params)`, `getById(id)`, `create(data)`, `update(id, data)`, `delete(id)`, `search(params)` |
| `category.service.ts` | `getAll()`, `getById(id)` |
| `booking.service.ts` | `getAll()`, `getById(id)`, `create(data)`, `updateStatus(id, status)`, `cancel(id)` |
| `review.service.ts` | `getByTool(toolId)`, `getMyReviews()`, `create(data)`, `delete(id)` |
| `message.service.ts` | `getConversations()`, `getMessages(conversationId)`, `send(data)`, `startConversation(data)` |
| `notification.service.ts` | `getAll()`, `markRead(id)`, `markAllRead()`, `getUnreadCount()` |
| `payment.service.ts` | `initiate(data)`, `getById(id)`, `getHistory()` |
| `ai.service.ts` | `classify(data)`, `analyzeImage(data)`, `searchByImage(data)`, `ragSearch(data)` |

### Feature Pages (24 components — empty files)

All are lazy-loaded standalone components. Each needs a TypeScript class + HTML template.

| Route | Component File |
|---|---|
| `/login` | `features/auth/login/login.component.ts` |
| `/register` | `features/auth/register/register.component.ts` |
| `/dashboard` | `features/dashboard/dashboard.component.ts` |
| `/profile` | `features/profile/profile.component.ts` |
| `/tools` | `features/tools/tool-list/tool-list.component.ts` |
| `/tools/search` | `features/tools/tool-search/tool-search.component.ts` |
| `/tools/create` | `features/tools/tool-create/tool-create.component.ts` |
| `/tools/:id` | `features/tools/tool-detail/tool-detail.component.ts` |
| `/tools/:id/edit` | `features/tools/tool-edit/tool-edit.component.ts` |
| `/bookings` | `features/bookings/booking-list/booking-list.component.ts` |
| `/bookings/create` | `features/bookings/booking-create/booking-create.component.ts` |
| `/bookings/:id` | `features/bookings/booking-detail/booking-detail.component.ts` |
| `/reviews` | `features/reviews/review-list/review-list.component.ts` |
| `/reviews/create` | `features/reviews/review-create/review-create.component.ts` |
| `/messages` | `features/messages/conversation-list/conversation-list.component.ts` |
| `/messages/:id` | `features/messages/chat/chat.component.ts` |
| `/payments/initiate` | `features/payments/payment-initiate/payment-initiate.component.ts` |
| `/payments/:id` | `features/payments/payment-status/payment-status.component.ts` |
| `/notifications` | `features/notifications/notification-list/notification-list.component.ts` |
| `/ai/classification` | `features/ai/classification/classification.component.ts` |
| `/ai/image-analysis` | `features/ai/image-analysis/image-analysis.component.ts` |
| `/ai/image-search` | `features/ai/image-search/image-search.component.ts` |
| `/ai/rag-search` | `features/ai/rag-search/rag-search.component.ts` |
| `**` | `features/not-found/not-found.component.ts` |

---

## 👥 Developer Split (4 Developers)

### Developer 1 — Auth & User (Foundation)
> Build first — other features depend on a working login flow.

**Services:**  none (AuthService is done)

**Pages:**
- `/login` — Reactive form (`email`, `password`), calls `AuthService.login()`, redirects to `/dashboard`
- `/register` — Reactive form (`name`, `email`, `password`, `role`), calls `AuthService.register()`
- `/dashboard` — Summary cards: booking count, tool count, unread messages, recent activity feed
- `/profile` — Display + edit current user info (name, avatar, bio, phone)

**Shared components to use:** `LoadingSpinnerComponent`

---

### Developer 2 — Tools & Categories
> Core feature of the marketplace.

**Services:** `tool.service.ts`, `category.service.ts`

**Pages:**
- `/tools` — Grid/list of tools, filter sidebar (category, price, rating), uses `PaginationComponent`
- `/tools/search` — Search bar + results, uses `PaginationComponent`
- `/tools/create` — Form to create a new tool (name, description, category, price, tags, image URL)
- `/tools/:id` — Tool detail: image, description, rating, reviews section, "Book Now" button
- `/tools/:id/edit` — Pre-filled edit form, same fields as create

**Shared components to use:** `StarRatingComponent`, `PaginationComponent`, `ConfirmationModalComponent`, `TruncatePipe`, `CurrencyFormatPipe`

---

### Developer 3 — Bookings, Reviews & Payments
> Transactional flows.

**Services:** `booking.service.ts`, `review.service.ts`, `payment.service.ts`

**Pages:**
- `/bookings` — List of user's bookings with status badges, uses `PaginationComponent`
- `/bookings/create` — Date-range picker + tool selector, price preview
- `/bookings/:id` — Booking detail: tool info, dates, status, cancel button (with `ConfirmationModalComponent`)
- `/reviews` — List of user's reviews
- `/reviews/create` — `StarRatingComponent` + comment textarea, tool selector
- `/payments/initiate` — Payment method selection, amount summary
- `/payments/:id` — Payment status page (success / failed / pending)

**Shared components to use:** `StarRatingComponent`, `PaginationComponent`, `ConfirmationModalComponent`, `DateFormatPipe`, `CurrencyFormatPipe`

---

### Developer 4 — Messages, Notifications & AI
> Real-time-friendly features and AI tooling.

**Services:** `message.service.ts`, `notification.service.ts`, `ai.service.ts`

**Pages:**
- `/messages` — Conversation list with unread badge, last message preview, uses `TruncatePipe`
- `/messages/:id` — Chat view: message thread, send input at bottom
- `/notifications` — Notification list with read/unread states, "Mark all read" button
- `/ai/classification` — Text input → category prediction result
- `/ai/image-analysis` — Image URL input → description + tags output
- `/ai/image-search` — Image URL input → similar results list
- `/ai/rag-search` — Natural language query → ranked results with source citations
- `**` (not-found) — 404 page with "Go Home" link

**Shared components to use:** `LoadingSpinnerComponent`, `TruncatePipe`, `DateFormatPipe`

---

## Component Pattern Reference

Every feature component follows this structure:

```typescript
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { SomeService } from '../../../core/services/some.service';
import { SomeModel } from '../../../core/models/some.model';

@Component({
  selector: 'app-feature-name',
  imports: [/* only what the template uses */],
  templateUrl: './feature-name.component.html',
})
export class FeatureNameComponent implements OnInit {
  private readonly someService = inject(SomeService);

  protected readonly items = signal<SomeModel[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.someService.getAll().subscribe({
      next: res => this.items.set(res.data.items),
      error: err => this.error.set(err.error?.message ?? 'Failed to load'),
      complete: () => this.isLoading.set(false),
    });
  }
}
```

Every service follows this structure:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { PagedResult } from '../models/paged-result.model';
import { SomeModel, SomeCreateRequest } from '../models/some.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SomeService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/some-resource`;

  getAll(): Observable<ApiResponse<PagedResult<SomeModel>>> {
    return this.http.get<ApiResponse<PagedResult<SomeModel>>>(this.base);
  }

  getById(id: string): Observable<ApiResponse<SomeModel>> {
    return this.http.get<ApiResponse<SomeModel>>(`${this.base}/${id}`);
  }

  create(data: SomeCreateRequest): Observable<ApiResponse<SomeModel>> {
    return this.http.post<ApiResponse<SomeModel>>(this.base, data);
  }

  update(id: string, data: Partial<SomeCreateRequest>): Observable<ApiResponse<SomeModel>> {
    return this.http.patch<ApiResponse<SomeModel>>(`${this.base}/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }
}
```

---

## Conventions

- **No `standalone: true`** — default in Angular 21; omit it.
- **Signals over properties** — use `signal()` for mutable state, `computed()` for derived values, `model()` for two-way binding.
- **`inject()` over constructor** — use the `inject()` function, not constructor injection.
- **`@if` / `@for` over `*ngIf` / `*ngFor`** — use the new built-in control flow.
- **Bootstrap utilities only** — no inline styles except `z-index` or pixel-exact sizing. No custom `.css` files (project is set to `"style": "none"`).
- **`private readonly` for injected services** — `protected` only when the template needs it.
- **Error handling** — every `subscribe()` must have an `error` handler that sets an `error` signal.
