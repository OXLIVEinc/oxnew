# What changed in this pass

## WhatsApp provider migration: WATI → WhatsApp Cloud API
- Replaced `src/lib/wati.ts` with `src/lib/whatsapp.ts`, calling Meta's Graph API
  directly (`POST /{WHATSAPP_PHONE_NUMBER_ID}/messages`) instead of WATI's REST API.
  `sendCloudTextMessage` and `sendCloudImageByUrl` mirror the old
  `sendWatiSessionMessage`/`sendWatiSessionFileByUrl` signatures, so
  `src/bot/messenger.ts` and everything upstream of it (router, flows, queues)
  needed zero changes — the messenger abstraction was already provider-agnostic.
- `server.ts`: swapped the inbound webhook from `POST /webhook/wati` (WATI's flat
  `waId`/`text` body) to `GET+POST /webhook/whatsapp`, matching the Cloud API's
  verification handshake (`hub.mode`/`hub.verify_token`/`hub.challenge`) and
  its nested `entry[].changes[].value.messages[]` payload shape. Errors now
  still return HTTP 200 to the POST route (Meta retries/disables webhooks that
  don't 200 quickly, regardless of whether processing succeeded).
- Env vars: `WATI_API_ENDPOINT`/`WATI_ACCESS_TOKEN` replaced with
  `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, and
  `WHATSAPP_API_VERSION` (defaults to `v21.0`).
- Only plain text inbound messages are handled (matching the prior WATI
  integration) — button/list/media inbound messages are ignored since none of
  the bot flows read anything but free text today.

# Previous pass

## Schema (`src/db/schema.ts`)
- Applied your updated schema as-is: `startsAt`/`endsAt` with timezone, `profileId` params renamed to `userId` everywhere (column stays `profile_id` — a profile *is* the user, so no migration-breaking rename of the `profiles` table itself).
- Added the missing `eventRegistrations` table you specified, plus `startTime`/`endTime` (plain 24hr text, kept in sync with `startsAt`/`endsAt`), `approvalStatus` enums for events and hotels (only `approved` rows are ever shown to buyers), and post-purchase tracking columns (`ticketsDeliveredAt`, `hotelUpsellSentAt`, `referralPushSentAt`, `preEventReminderSentAt`) so delayed jobs are idempotent.
- Added full `relations()` definitions and every missing inferred type (`NewEvent`, `NewTicket`, etc).

## IDs (`src/lib/ids.ts`)
- Swapped `crypto.randomBytes` for `uuid` + `nanoid`, using exactly the `generateCheckInCode` / `generateEventCode` implementations you pasted.

## QR + ticket delivery (`src/lib/qr/*`)
- Rewrote every file in this folder — the ones you flagged as "for inspiration" had broken imports (`@/utils/helpers`, `@shared/db/schema`, Supabase) that don't exist in this project. Now: `sign-qr-payload`/`verify-qr` (JWT), `generate-qr` (qrcode), `create-ticket-card` (sharp — branded PNG with QR + event info), `upload-qr` (saves to `/public/tickets`, served statically — swap for S3/Cloudinary later), and `create-ticket-qr` (orchestrates all of the above). `validate-ticket-qr` now points at the real db client/schema for door-scan validation.

## WhatsApp (`src/lib/wati.ts`, `src/bot/messenger.ts`)
- Added a real WATI client (`sendWatiSessionMessage`, `sendWatiSessionFileByUrl`) and extended the messenger abstraction to support image sends, wired up in `server.ts`.

## Post-purchase automation (`src/queues/*`, `src/workers/*`)
- Built on BullMQ (already had `ioredis` as a dependency). One `purchase` queue, four job types, one worker:
  - **ticket-delivery** — fires immediately on payment; sends each attendee their QR ticket image + info.
  - **hotel-upsell** — Step 6, delayed 30–60s, recommends the 3 closest approved hotels using real lat/lng distance.
  - **referral-upsell** — Step 7, delayed 1hr, sends the wa.me referral link.
  - **pre-event-reminder** — Step 8, scheduled for T-24hrs relative to the event's `startsAt` (skipped if the event is already inside that window).
  - Run the worker separately: `npm run worker`.

## Pagination ("more")
- `src/data/db.ts` fetches `limit + 1` rows everywhere (events, hotels, bookings) to cheaply know if there's a next page, without a separate COUNT query. Every list reply says "Reply MORE to see more" when there's another page; `MORE` re-queries with the stored offset.

## Bookings menu
- "My bookings" now asks tickets / hotel bookings / both first (`BOOKING_KIND_SELECT`), then paginates through `ordersFlow.showBookings`.

## Events browsing
- Only `approved` + upcoming (`startsAt > now`) events are ever shown (`db.searchEvents` / `db.listUpcomingEvents`). Type `ALL` to browse everything upcoming, or search/paste a code.

## Dates & times
- `src/lib/datetime.ts`: 24hr clock formatting everywhere ("12:00 to 17:30", no AM/PM), plus `parseFriendlyDate` — strict `d/m/yyyy` parsing (e.g. "7/6/2026") with a friendly re-prompt on anything else. Hotel check-in/out now asks for dates one at a time in that format.

## Hotel recommendations
- `db.recommendHotelsNearEvent` uses real haversine distance (`src/lib/geocode.ts`) between the event's and each hotel's lat/lng, sorted nearest-first.

## Geocoding (frontend/dashboard only)
- `src/lib/geocode.ts` exports `geocodeAddress()` (OpenStreetMap Nominatim, no API key) for use when an organizer/admin creates an event or hotel — not called from the WhatsApp bot itself.

## Default ticket tier
- `db.ensureDefaultTicketTier()` — every event gets a "General Admission" tier automatically if the organizer didn't create one, free or paid per `isPaid`.

## Idempotency
- `db.recordProcessedPaymentIfNew()` inserts into `processed_payments` keyed uniquely on gateway reference; both webhook handlers (`src/bot/payments.ts`) check this before doing anything else, so retried webhooks can never double-fulfil an order.

## Seed data (`src/db/seed.ts`)
- 20 realistic upcoming events (Lagos/Abuja/Port Harcourt, mixed free/paid, one deliberately left without tiers to exercise the default-GA-tier fallback) and 20 hotel partners with 2–3 room types each, all `approvalStatus: "approved"`. Run with `npm run db:seed`.

## Not carried over
- `src/lib/provider.ts` and `src/lib/webhook.ts` (your original agent-built reference files) — per your note these were "for inspiration" only, they imported modules that don't exist in this project (Supabase, `@/config/database`, etc.), and you asked me not to follow that pattern. Their intent (WhatsApp send + webhook handling) is fully covered by `src/lib/wati.ts` + `src/server.ts` instead.

## Verified
- Full `tsc --noEmit` passes with zero errors (`npm run typecheck`, or `tsconfig.typecheck.json` which adds ambient stubs for `uuid`/`nanoid`/`qrcode`/`sharp`/`jsonwebtoken`/`bullmq` so this can be checked before `npm install`).
- `npm install` is required before running for real — `uuid`, `nanoid`, `qrcode`, `sharp`, `jsonwebtoken`, and `bullmq` were added to `package.json` but aren't installed in this sandbox (no network access here).

## New env vars (see `.env.example`, already had placeholders for all of these)
`QR_SECRET`, `WATI_API_ENDPOINT`, `WATI_ACCESS_TOKEN`, `PUBLIC_BASE_URL`, `OX_WHATSAPP_NUMBER`, `CHECKOUT_BASE_URL`
