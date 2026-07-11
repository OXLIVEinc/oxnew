# OX WhatsApp Bot

A WhatsApp-driven state machine (no LLM) for event ticketing and hotel
bookings. Redis holds live conversation state; Postgres (via Drizzle) holds
everything durable — events, tiers, ticket orders, tickets, hotels, room
types, hotel orders, and ticket transfers.

## What changed in this rebuild

- **Redis owns session state.** There is no `whatsapp_sessions`,
  `session_messages`, or `agent_runs` table in Postgres anymore. Session
  state is ephemeral by nature (current step + a handful of context fields)
  and belongs in something with a TTL, not a durable table. `agent_runs`
  existed for an LLM-agent loop; this bot has no LLM in the loop, so it's
  gone entirely.
- **Renamed for clarity:** `orders` → `ticketOrders`, `hotelBookings` →
  `hotelOrders`. Both now follow the same shape (reference, status enum,
  Paystack fields, `expiresAt`/`paidAt`/`cancelledAt`).
- **Event flow drops the in-chat attendee-name step.** As soon as event +
  tier + quantity are picked, a `ticketOrders` row is created and the buyer
  gets a checkout link (`/checkout/:orderId`). That's where each seat's
  name + email is collected and payment is triggered — not in the chat.
  Payment confirmation (via the Paystack webhook) delivers tickets straight
  to the buyer's phone, independent of whatever their chat session is doing
  at that moment (so it still works even if their session has since reset).
- **Ticket transfers require the recipient to confirm.** The sender only
  picks a ticket + types the recipient's number. The recipient gets a
  WhatsApp message with a claim link (`/transfer/claim/:code`); nothing
  moves until they open it and submit their own full name + email. Declining
  is also supported and leaves the ticket with the sender.
- **CANCEL now pauses instead of wiping.** Typing `cancel` mid-flow saves
  exactly where you were (state + context + the last prompt you were shown)
  and drops you at the main menu, which now shows a `RESUME` option.
  Typing `resume` restores the flow and re-asks the same question.
- **Hotel booking now has room type selection.** After picking a hotel, you
  pick a room type (with its own price/night and capacity) before dates and
  guests.

## Architecture

```
src/
  db/
    schema.ts     Drizzle schema (Postgres)
    client.ts     Postgres client
    redis.ts      Redis client
    seed.ts       Demo events/hotels/room types
  data/
    db.ts         All queries — the only file that talks to Postgres directly
  lib/
    ids.ts        Reference/code generators
    paystack.ts   Paystack client (falls back to a working mock link if no key set)
  bot/
    session.ts    Redis-backed session store (get/set/pause/resume)
    messenger.ts  Pluggable outbound WhatsApp sender (wired to WhatsApp Cloud API in server.ts)
    router.ts     Single entry point: handleMessage(phone, text)
    payments.ts   Webhook-triggered payment completion (decoupled from session state)
    flows/        One file per conversation flow
  server.ts       Express app: WhatsApp Cloud API webhook, Paystack webhook, checkout API, transfer-claim API
  test/simulate.ts  Terminal chat simulator
```

## Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL / REDIS_URL at minimum
npm run db:push        # create tables from schema.ts
npm run db:seed        # demo events + hotels + room types
```

Leave `PAYSTACK_SECRET_KEY` blank for local dev — `initializeTransaction`
returns a working mock `https://paystack.com/pay/...` link instead of
calling the real API, so the whole flow (including the webhook step) is
testable without live credentials.

## Running

```bash
npm run dev         # starts the Express server (WhatsApp Cloud API + Paystack webhooks, checkout API)
npm run simulate    # chat with the bot in your terminal
```

### Simulator commands

```
Hi
OX-AFROBEATS-NIGHT-2025
1                      # pick a tier
2                      # pick quantity -> creates order, sends checkout link
SUBMIT Emeka Okafor/emeka@example.com;Ada Lovelace/ada@example.com
PAY_CONFIRM            # simulates the Paystack webhook -> delivers tickets
cancel                 # pause a flow
resume                 # pick it back up
CLAIM <code> <full name> <email>   # simulate a transfer recipient confirming
DECLINE <code>                     # simulate a transfer recipient declining
```

## Wiring up for real

1. **WhatsApp Cloud API** — set `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`,
   and `WHATSAPP_VERIFY_TOKEN` in `.env`. In the Meta App Dashboard, point
   your WhatsApp product's webhook at `POST /webhook/whatsapp` (Meta will
   call `GET /webhook/whatsapp` once first, with your verify token, to
   confirm the endpoint) and subscribe to the `messages` field.
2. **Paystack** — set `PAYSTACK_SECRET_KEY`; point your Paystack webhook at
   `POST /webhook/paystack`.
3. **Checkout view** — build the actual web/WhatsApp-Flow front end that
   calls `GET /checkout/:orderId` to render the order, and
   `POST /checkout/:orderId/submit` with `{ items: [{ attendeeName, attendeeEmail }, ...] }`
   once the buyer fills the form. The response includes `authorizationUrl`
   to redirect them to Paystack.
4. **Transfer claim view** — same pattern:
   `GET /transfer/claim/:code` to render, `POST /transfer/claim/:code/confirm`
   with `{ fullName, email }`, or `POST /transfer/claim/:code/decline`.

## Notes on what I verified

`npm install` + `npm run typecheck` (`tsc --noEmit`) pass clean with no
errors. I do **not** have a live Postgres or Redis instance in this
environment, so I have not run the flows end-to-end against a real
database — only traced the logic by hand (order creation → checkout
submission → payment webhook → ticket delivery; transfer create → claim;
cancel → resume). Please run `npm run db:push && npm run db:seed` against
your own Postgres, point `REDIS_URL` at a real Redis, and run
`npm run simulate` before treating this as production-ready — there's a
reasonable chance small issues (a typo in a query, an edge case in date
parsing) turn up on first real run, as with any fresh codebase this size.
