# TERRA Trip Demo — Debug Log

## 2026-04-02

### PayPal vault billing_plan incompatible with UNSCHEDULED_POSTPAID
- **Error:** `INCOMPATIBLE_PARAMETER_VALUE` on `pricing_model` field
- **Root cause:** `billing_plan` with `billing_cycles` and `pricing_model` is not compatible with `UNSCHEDULED_POSTPAID` usage_pattern
- **Fix:** Removed billing_plan entirely, use simple order body with vault attributes only

### Server tsconfig declaration: true
- **Error:** Build failure
- **Fix:** Removed `declaration: true` from server/tsconfig.json (not needed for app server)

## 2026-04-03

### PayPal Invoice ID extraction failure
- **Error:** Invoice auto-creation appeared to succeed but invoiceUrl was always null
- **Root cause:** PayPal Invoicing API v2 POST returns `{ rel: "self", href: "...INV2-XXXX", method: "GET" }` — NOT `{ id }` or `{ links: [...] }`. Code checked `invoiceData.id` and `invoiceData.links` (both undefined).
- **Fix:** Added `invoiceData.href?.split("/").pop()` as the primary extraction path. Fixed in both `trip-requests.ts` and `invoices.ts`.

### Send invoice: customer not receiving email
- **Error:** `send_to_invoicer: true` only sends copy to merchant
- **Fix:** Changed to `send_to_recipient: true`

### Trip request handler missing async
- **Error:** `"await" can only be used inside an "async" function` — server crash on startup
- **Root cause:** Added PayPal API calls (await) to handler that was not async
- **Fix:** Changed `(req, res) =>` to `async (req, res) =>`

### Vault order 500 error — invalid return_url
- **Error:** `Failed to create vault order` when no Origin/Referer header
- **Root cause:** `origin` was empty string, making return_url invalid (`checkout/bali-adventure...`)
- **Fix:** Added fallback `http://localhost:5173/` when no origin header present

### Vault charge amount type coercion
- **Error:** Potential string concatenation on `paid_amount + amount`
- **Fix:** `const amount = Number(req.body.amount)` with `isFinite` validation

### Authorize partial capture orphaned authorization
- **Error:** If partial capture throws, no booking record saved — authorization is orphaned
- **Fix:** Nested try/catch — save booking as DEPOSIT_AUTHORIZED if capture fails
