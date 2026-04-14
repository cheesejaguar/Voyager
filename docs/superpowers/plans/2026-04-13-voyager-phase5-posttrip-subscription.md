# Voyager Phase 5: Post-Trip & Subscription Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Build photo upload with Vercel Blob, EXIF extraction, photo-place association, trip recap generation, Stripe subscription with feature gates, and group trip invitations.

**Tech Stack:** Vercel Blob, exifr (EXIF parsing), AI SDK (recap generation), Stripe, Clerk invitations

**Spec:** `docs/superpowers/specs/2026-04-13-voyager-mvp-design.md` sections 10, 11, 12

---

## Task 1: Photo Upload with Vercel Blob + EXIF

**Files:**
- Create: `src/lib/db/queries/photos.ts` — CRUD for photo_assets
- Create: `src/app/api/photos/upload/route.ts` — upload to Vercel Blob + save metadata
- Create: `src/components/photos/upload-dropzone.tsx` — drag-and-drop multi-file upload
- Create: `src/components/photos/photo-grid.tsx` — grid of uploaded photos grouped by day

Install: `npm install @vercel/blob exifr`

Photo upload flow:
1. Client extracts EXIF (timestamp, GPS) via exifr before upload
2. POST to `/api/photos/upload` with file + metadata
3. Server uploads to Vercel Blob (private), saves record to photo_assets table
4. Client shows thumbnail immediately

DB queries: `getPhotosForTrip`, `createPhotoAsset`, `updatePhotoAssociation`, `deletePhoto`

Commit: `feat: add photo upload with Vercel Blob and EXIF extraction`

---

## Task 2: Photo-Place Association + Photos Page

**Files:**
- Create: `src/lib/utils/photo-association.ts` — match photos to itinerary items by GPS/timestamp
- Create: `src/components/photos/day-photo-group.tsx` — photos grouped by day with place labels
- Create: `src/app/(app)/trip/[tripId]/photos/page.tsx` — photos page with upload + grouped display

Association logic:
- Photos with GPS: find nearest itinerary item by haversine distance
- Photos with timestamp only: assign to day, suggest nearest-time activity
- Photos with neither: "Unassigned" group

The photos page shows the upload dropzone at top, then photos grouped by day with place associations. Users can see which activity each photo is linked to.

Commit: `feat: add photo-place association and photos page`

---

## Task 3: Trip Recap Generation

**Files:**
- Create: `src/lib/ai/generate-recap.ts` — LLM recap generation (Sonnet free / Opus premium)
- Create: `src/lib/db/queries/summaries.ts` — CRUD for trip_summaries
- Create: `src/app/actions/recap.ts` — server action to generate recap
- Create: `src/app/(app)/trip/[tripId]/recap/page.tsx` — recap page with style selector + generated content
- Create: `src/components/trip/recap-display.tsx` — renders markdown recap with interspersed photos

Recap styles: concise (bullet points), narrative (journal prose), scrapbook (captions + photos)

Input to LLM: trip metadata, full itinerary, photo associations, optional user highlights.
Output: markdown stored in trip_summaries table.

For MVP, use Sonnet for all users (premium Opus gating comes with Stripe in Task 4).

Commit: `feat: add trip recap generation with multiple styles`

---

## Task 4: Stripe Subscription Integration

**Files:**
- Create: `src/lib/services/stripe.ts` — Stripe client helpers
- Create: `src/app/api/stripe/checkout/route.ts` — create checkout session
- Create: `src/app/api/stripe/webhook/route.ts` — handle subscription events
- Create: `src/app/actions/subscription.ts` — subscription management actions
- Create: `src/components/trip/upgrade-banner.tsx` — premium upgrade CTA
- Modify: `src/app/(app)/settings/page.tsx` — add subscription management

Install: `npm install stripe`

Stripe flow:
1. User clicks "Upgrade to Premium" → POST `/api/stripe/checkout` → redirect to Stripe Checkout
2. After payment → Stripe webhook fires `checkout.session.completed`
3. Webhook handler creates subscription record, updates user.subscription_tier to "premium"
4. `customer.subscription.updated` / `customer.subscription.deleted` events sync status

Feature gates: server-side function `requirePremium(userId)` that checks subscription_tier.

Free tier limits: 3 active trips, 50 photos/trip, static flight status, Sonnet recaps.
Premium: unlimited trips, 500 photos, real-time flights, Opus recaps, shareable recaps.

Commit: `feat: add Stripe subscription with checkout, webhooks, and feature gates`

---

## Task 5: Group Trip Invitations

**Files:**
- Create: `src/lib/db/queries/trip-members.ts` — member CRUD
- Create: `src/app/actions/members.ts` — invite/remove member actions
- Create: `src/components/trip/member-list.tsx` — member list with invite form
- Modify: `src/app/(app)/trip/[tripId]/overview/page.tsx` — add member list for owners

Invitation flow:
1. Owner enters email in invite form
2. Server action checks if email matches a Clerk user (via Clerk API)
3. If found: create trip_member with joined_at=null, Clerk sends email notification
4. If not found: return error "User not found — they need to sign up first" (full Clerk invitation API is complex, simplify for MVP)
5. Invitee sees trip in their dashboard once joined_at is set

For MVP simplification: require the invited user to already have a Voyager account. The invite creates a pending membership that the invitee accepts by visiting the trip.

Commit: `feat: add group trip invitations with member management`
