# Backend requirements for frontend features

The frontend is built and deployed against these contracts. All responses use the
standard envelope already used by the API:

```json
{ "succeeded": true, "message": "…", "data": null, "errors": [] }
```

---

## 1. Password reset (REQUIRED — frontend is live at `/forgot-password`)

Reuses the existing 6-digit email OTP infrastructure from `verify-email` /
`resend-verification`. Two new endpoints:

### `POST /api/auth/forgot-password`

Request:
```json
{ "email": "user@example.com" }
```

Behavior:
- Generate a 6-digit numeric code, store **only its hash** with a 10–15 minute
  expiry, single-use, tied to the user.
- Send the code by email (same template style as the verification code).
- **Always return `200` with `succeeded: true`**, whether or not the email
  exists. The response message must be identical in both cases (the frontend
  shows "If an account exists, we sent a code"). This prevents account
  enumeration.
- Rate limit: max ~3 requests per email per 15 minutes and per IP. When rate
  limited, still return the same generic 200 (or 429 with the same generic
  message — the frontend treats both the same).
- Issuing a new code invalidates any previous unexpired code.

### `POST /api/auth/reset-password`

Request:
```json
{ "email": "user@example.com", "code": "482913", "newPassword": "…" }
```

Behavior:
- Verify the code against the stored hash: unexpired, unused, correct user.
  Max ~5 verification attempts per code, then invalidate it.
- Enforce the same password policy as registration
  (min 8 chars, ≥1 digit, ≥1 lowercase, ≥1 special character).
- On success:
  - update the password hash,
  - mark the code used,
  - **revoke all refresh tokens / server sessions for the user** (standard
    practice after a credential change),
  - optionally send a "your password was changed" notification email.
- On failure return `400` with `succeeded: false` and a message like
  `"Invalid or expired code."` — do not distinguish "wrong code" from
  "no such account".

Frontend flow (already implemented): step 1 posts the email → generic success →
step 2 collects code + new password → success redirects to `/login` with a toast.
Resend uses the same `forgot-password` endpoint with a 60-second client cooldown.

---

## 2. Nice-to-have (frontend not built yet — build these and I'll wire the UI)

### Saved searches with alerts
- `POST /api/saved-searches` — body mirrors the browse filter params
  (`searchTerm`, `categoryId`, `location`, `minPrice`, `maxPrice`, `condition`).
- `GET /api/saved-searches`, `DELETE /api/saved-searches/{id}`.
- Background job: when a newly listed tool matches a saved search, create a
  notification (existing notification pipeline + SignalR hub can carry it).

### Map view for browse
- Add `latitude` / `longitude` (nullable) to the tool entity, accept them on
  tool create/update, return them in browse/detail responses.
- Optional: `GET /api/tools/browse` accepts `nearLat`, `nearLng`, `radiusKm`
  and returns distance-sorted results.

### Owner earnings dashboard
- `GET /api/wallet/earnings?months=12` → per-month totals:
  `[{ "month": "2026-01", "gross": 1200, "fees": 120, "net": 1080 }, …]`.
