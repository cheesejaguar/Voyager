# Voyager Phase 6: Polish Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Add motion, loading states, error handling, responsive design, and a final design audit to make Voyager feel premium and production-ready.

**Tech Stack:** Framer Motion, Next.js error boundaries, Tailwind responsive utilities

**Spec:** `docs/superpowers/specs/2026-04-13-voyager-mvp-design.md` section 13 (Motion, Key UI Patterns)

---

## Task 1: Framer Motion Page Transitions & Micro-interactions

**Files:**
- Create: `src/components/ui/motion.tsx` — reusable motion wrappers
- Modify: `src/app/(app)/layout.tsx` — add page transition wrapper
- Modify key components to add entrance animations

Motion specs from design system:
- Micro-interactions: 200ms, ease-out
- View transitions: 400ms, ease-in-out  
- No bounce — smooth and deliberate
- Page transitions: fade + subtle vertical slide (20px)

Create motion primitives:
- `FadeIn` — fade + slide up (20px), duration 400ms
- `StaggerChildren` — stagger child animations with 50ms delay
- `AnimatedCard` — card that fades in on mount

Apply to: dashboard trip cards (stagger), trip overview cards (fade in), phase rail items, recommendation cards (stagger), photo grid items.

Commit: `feat: add Framer Motion page transitions and micro-interactions`

---

## Task 2: Loading States & Skeleton Screens

**Files:**
- Create: `src/app/(app)/dashboard/loading.tsx`
- Create: `src/app/(app)/trip/[tripId]/overview/loading.tsx`
- Create: `src/app/(app)/trip/[tripId]/itinerary/loading.tsx`
- Create: `src/app/(app)/trip/[tripId]/pre-trip/loading.tsx`
- Create: `src/app/(app)/trip/[tripId]/flight/[direction]/loading.tsx`
- Create: `src/app/(app)/trip/[tripId]/photos/loading.tsx`
- Create: `src/app/(app)/trip/[tripId]/recommendations/loading.tsx`
- Create: `src/app/(app)/trip/[tripId]/recap/loading.tsx`
- Create: `src/app/(app)/trip/[tripId]/map/loading.tsx`

Each loading.tsx uses the existing Skeleton component from `src/components/ui/skeleton.tsx` to create page-specific skeleton layouts that match the structure of the actual content.

Pattern for each loading file:
```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" /> {/* Title */}
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40" /> {/* Card 1 */}
        <Skeleton className="h-40" /> {/* Card 2 */}
      </div>
    </div>
  );
}
```

Customize each skeleton to match the actual page layout (e.g., dashboard shows trip card skeletons, itinerary shows timeline skeleton, photos shows grid skeleton).

Commit: `feat: add skeleton loading states for all pages`

---

## Task 3: Error Boundaries & Toast Notifications

**Files:**
- Create: `src/app/(app)/error.tsx` — app-level error boundary
- Create: `src/app/(app)/trip/[tripId]/error.tsx` — trip-level error boundary
- Create: `src/app/(app)/not-found.tsx` — custom 404 page
- Create: `src/components/ui/toast.tsx` — simple toast notification component

Error boundaries follow Next.js convention (`error.tsx` with `"use client"` directive). Show styled error messages with retry button, matching the warm amber design system.

Not-found page shows a styled 404 with "Back to Dashboard" link.

Toast component: simple fixed-position notification that auto-dismisses after 3 seconds. Variants: success (green), error (red), info (blue).

Commit: `feat: add error boundaries, 404 page, and toast notifications`

---

## Task 4: Responsive Design

**Files:**
- Modify: `src/components/app-sidebar.tsx` — collapsible on mobile (hamburger menu)
- Modify: `src/app/(app)/layout.tsx` — responsive sidebar behavior
- Modify: `src/components/trip/phase-rail.tsx` — horizontal scroll on mobile
- Audit and fix: all grid layouts to stack on mobile

Key responsive breakpoints:
- Mobile (< 768px): sidebar collapses to hamburger, phase rail becomes horizontal scroll, grids stack to single column
- Tablet (768-1024px): sidebar visible, 2-column grids
- Desktop (> 1024px): full layout as designed

Sidebar on mobile: hidden by default, toggled via hamburger button in a top bar. Uses Framer Motion for slide-in animation.

Phase rail on mobile: horizontal scrollable row at top of trip content instead of vertical sidebar.

Commit: `feat: add responsive design for mobile and tablet`

---

## Task 5: Final Design Audit & Cleanup

**Files:**
- Audit all pages for consistent spacing, typography, and color usage
- Remove any unused imports or dead code
- Ensure all interactive elements have hover/focus states
- Verify dark mode consistency across all components
- Add CLAUDE.md with project setup instructions

Final checks:
1. Run `npm run build` — clean pass
2. Run `npm test` — all tests pass
3. Run `npx tsc --noEmit` — no type errors
4. Review all pages visually (dev server)

Commit: `feat: final design audit and cleanup - MVP complete`
