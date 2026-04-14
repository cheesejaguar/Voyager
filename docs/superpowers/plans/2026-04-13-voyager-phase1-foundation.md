# Voyager Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the Voyager Next.js application with auth, database, design system, app shell, and trip CRUD — the foundation everything else builds on.

**Architecture:** Single Next.js 15 App Router application deployed on Vercel. Clerk for auth, Neon Postgres with Drizzle ORM for data, Tailwind CSS v4 for styling with a warm amber dark-mode design system. Server Actions for data mutations, Server Components for data fetching.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, Clerk, Neon Postgres, Drizzle ORM, Geist font, Lucide React icons, Vitest

**Spec:** `docs/superpowers/specs/2026-04-13-voyager-mvp-design.md`

---

## File Map

### Project Config
- Create: `package.json` — dependencies and scripts
- Create: `tsconfig.json` — TypeScript config
- Create: `next.config.ts` — Next.js config
- Create: `tailwind.config.ts` — Tailwind with design tokens
- Create: `drizzle.config.ts` — Drizzle migration config
- Create: `.env.example` — required env vars template
- Create: `.gitignore` — standard Next.js ignores
- Create: `vitest.config.ts` — test runner config

### Design System
- Create: `src/app/globals.css` — Tailwind imports + CSS custom properties (warm amber palette)
- Create: `src/app/layout.tsx` — Root layout with Geist font + Clerk provider
- Create: `src/components/ui/button.tsx` — Button component
- Create: `src/components/ui/card.tsx` — Card component
- Create: `src/components/ui/input.tsx` — Input component
- Create: `src/components/ui/badge.tsx` — Badge component
- Create: `src/components/ui/dialog.tsx` — Dialog component
- Create: `src/components/ui/skeleton.tsx` — Skeleton loader

### Auth
- Create: `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` — Clerk sign-in page
- Create: `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` — Clerk sign-up page
- Create: `src/app/(auth)/layout.tsx` — Auth layout (centered, no sidebar)
- Create: `src/middleware.ts` — Clerk auth middleware

### Database
- Create: `src/lib/db/index.ts` — Neon + Drizzle connection
- Create: `src/lib/db/schema.ts` — All Drizzle table definitions
- Create: `src/lib/db/queries/users.ts` — User query functions
- Create: `src/lib/db/queries/trips.ts` — Trip query functions
- Create: `src/app/api/clerk/webhook/route.ts` — Clerk user sync webhook

### App Shell
- Create: `src/app/(app)/layout.tsx` — Authenticated layout with sidebar
- Create: `src/components/app-sidebar.tsx` — Main sidebar navigation
- Create: `src/components/user-button.tsx` — User avatar + dropdown

### Trip CRUD
- Create: `src/app/(app)/dashboard/page.tsx` — Trip list page
- Create: `src/components/trip/trip-card.tsx` — Trip card for dashboard
- Create: `src/components/trip/create-trip-dialog.tsx` — Create trip modal
- Create: `src/app/(app)/trip/[tripId]/layout.tsx` — Trip layout with phase rail
- Create: `src/app/(app)/trip/[tripId]/overview/page.tsx` — Trip overview page
- Create: `src/components/trip/phase-rail.tsx` — Phase navigation rail
- Create: `src/lib/utils/trip-phases.ts` — Phase computation logic
- Create: `src/app/actions/trips.ts` — Server actions for trip mutations

### Types
- Create: `src/types/trip.ts` — Trip-related TypeScript types

### Tests
- Create: `tests/lib/utils/trip-phases.test.ts` — Phase computation tests
- Create: `tests/lib/db/queries/trips.test.ts` — Trip query tests

---

## Task 1: Project Bootstrap

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Initialize Next.js project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --yes
```

Expected: Project files created, `package.json` populated with Next.js 15 dependencies.

- [ ] **Step 2: Install core dependencies**

Run:
```bash
npm install @clerk/nextjs drizzle-orm @neondatabase/serverless lucide-react date-fns zod framer-motion
npm install -D drizzle-kit vitest @vitejs/plugin-react dotenv
```

- [ ] **Step 3: Create .env.example**

```bash
# .env.example
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Neon Postgres
DATABASE_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=

# Foursquare
FOURSQUARE_API_KEY=

# AviationStack
AVIATIONSTACK_API_KEY=
```

- [ ] **Step 4: Create vitest.config.ts**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 5: Add test script to package.json**

Add to `"scripts"` in `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Update .gitignore**

Append to `.gitignore`:
```
.env
.env.local
.superpowers/
```

- [ ] **Step 7: Verify dev server starts**

Run: `npm run dev`
Expected: Server starts on http://localhost:3000, default Next.js page renders.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: bootstrap Next.js 15 project with core dependencies"
```

---

## Task 2: Design System — CSS Tokens & Global Styles

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `tailwind.config.ts` (modify generated one)

- [ ] **Step 1: Replace globals.css with Voyager design tokens**

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  /* Warm Amber palette */
  --color-bg: #0a0a0a;
  --color-surface: #141414;
  --color-card: #1c1c1c;
  --color-card-hover: #242424;
  --color-border: rgba(255, 255, 255, 0.06);

  --color-accent: #d9ab6f;
  --color-accent-muted: rgba(217, 171, 111, 0.12);

  --color-text-primary: #e8e0d4;
  --color-text-secondary: #999999;
  --color-text-muted: #666666;

  /* Category colors */
  --color-cat-sightseeing: #d9ab6f;
  --color-cat-food: #8bb88b;
  --color-cat-culture: #5ea0a0;
  --color-cat-nightlife: #b48cc8;
  --color-cat-shopping: #c88b8b;
  --color-cat-transit: #4a4a4a;

  /* Status colors */
  --color-success: #6b9b6b;
  --color-warning: #c8a86b;
  --color-error: #b86b6b;
  --color-info: #6b8fb8;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
}
```

- [ ] **Step 2: Update root layout with Geist font and dark background**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voyager",
  description: "AI-powered travel planning",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-bg text-text-primary`}
      >
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create placeholder home page**

```tsx
// src/app/page.tsx
export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-accent">
          Voyager
        </h1>
        <p className="mt-2 text-text-secondary">
          AI-powered travel planning
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify dark theme renders**

Run: `npm run dev`
Expected: Dark background (#0a0a0a), amber "Voyager" text, warm white subtitle.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/app/page.tsx
git commit -m "feat: add warm amber design system tokens and global styles"
```

---

## Task 3: Base UI Components

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/skeleton.tsx`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Create utility function**

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Run: `npm install clsx tailwind-merge`

- [ ] **Step 2: Create Button component**

```tsx
// src/components/ui/button.tsx
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-accent text-bg hover:bg-accent/90",
  secondary: "bg-card text-text-primary border border-border hover:bg-card-hover",
  ghost: "text-text-secondary hover:text-text-primary hover:bg-card",
  danger: "bg-error/10 text-error hover:bg-error/20",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
          "disabled:opacity-50 disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
```

- [ ] **Step 3: Create Card component**

```tsx
// src/components/ui/card.tsx
import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl bg-card border border-border p-4",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-3", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />;
}
```

- [ ] **Step 4: Create Input component**

```tsx
// src/components/ui/input.tsx
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label
            htmlFor={id}
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-lg bg-surface border border-border px-3 py-2 text-sm text-text-primary",
            "placeholder:text-text-muted",
            "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/30",
            "transition-colors duration-200",
            error && "border-error focus:ring-error/50",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-error">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
```

- [ ] **Step 5: Create Badge component**

```tsx
// src/components/ui/badge.tsx
import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "error";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface text-text-secondary",
  accent: "bg-accent-muted text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tracking-wide",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 6: Create Dialog component**

```tsx
// src/components/ui/dialog.tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
  className?: string;
}

export function Dialog({ open, onClose, children, title, className }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={cn(
        "rounded-xl bg-card border border-border p-0 backdrop:bg-black/60",
        "max-w-lg w-full",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-primary transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      <div className="px-6 py-4">{children}</div>
    </dialog>
  );
}
```

- [ ] **Step 7: Create Skeleton component**

```tsx
// src/components/ui/skeleton.tsx
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-surface",
        className
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 8: Verify build succeeds**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add src/components/ui/ src/lib/utils.ts
git commit -m "feat: add base UI components (button, card, input, badge, dialog, skeleton)"
```

---

## Task 4: Clerk Auth Integration

**Files:**
- Modify: `src/app/layout.tsx` — wrap with ClerkProvider
- Create: `src/middleware.ts` — Clerk auth middleware
- Create: `src/app/(auth)/layout.tsx` — auth layout
- Create: `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- Create: `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`

- [ ] **Step 1: Wrap root layout with ClerkProvider**

Update `src/app/layout.tsx` — add ClerkProvider around `{children}`:

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voyager",
  description: "AI-powered travel planning",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" className="dark">
        <body
          className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-bg text-text-primary`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 2: Create Clerk middleware**

```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/clerk/webhook(.*)",
  "/api/stripe/webhook(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

- [ ] **Step 3: Create auth layout**

```tsx
// src/app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-accent">
            Voyager
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create sign-in page**

```tsx
// src/app/(auth)/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return <SignIn />;
}
```

- [ ] **Step 5: Create sign-up page**

```tsx
// src/app/(auth)/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return <SignUp />;
}
```

- [ ] **Step 6: Update home page to redirect authenticated users**

```tsx
// src/app/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  redirect("/sign-in");
}
```

- [ ] **Step 7: Verify auth flow works**

Set up Clerk env vars in `.env.local` (from Clerk dashboard or `vercel env pull`).

Run: `npm run dev`
Expected: Visiting `/` redirects to `/sign-in`. After signing in, redirects to `/dashboard` (which will 404 — that's expected, we build it next).

- [ ] **Step 8: Commit**

```bash
git add src/middleware.ts src/app/layout.tsx src/app/page.tsx src/app/\(auth\)/
git commit -m "feat: integrate Clerk auth with sign-in/sign-up pages"
```

---

## Task 5: Database Schema & Connection

**Files:**
- Create: `src/lib/db/index.ts`
- Create: `src/lib/db/schema.ts`
- Create: `drizzle.config.ts`

- [ ] **Step 1: Create Drizzle config**

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 2: Create database connection**

```typescript
// src/lib/db/index.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
```

- [ ] **Step 3: Create full database schema**

```typescript
// src/lib/db/schema.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  jsonb,
  boolean,
  integer,
  real,
  date,
  time,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "premium",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "trialing",
]);

export const tripStatusEnum = pgEnum("trip_status", [
  "planning",
  "active",
  "completed",
  "archived",
]);

export const tripMemberRoleEnum = pgEnum("trip_member_role", [
  "owner",
  "member",
]);

export const importSourceTypeEnum = pgEnum("import_source_type", [
  "flight",
  "hotel",
  "activity",
  "unknown",
]);

export const importStatusEnum = pgEnum("import_status", [
  "pending",
  "reviewed",
  "confirmed",
  "rejected",
]);

export const flightDirectionEnum = pgEnum("flight_direction", [
  "outbound",
  "return",
]);

export const itineraryItemTypeEnum = pgEnum("itinerary_item_type", [
  "activity",
  "meal",
  "transit",
  "free_time",
  "custom",
]);

export const itinerarySourceEnum = pgEnum("itinerary_source", [
  "manual",
  "recommendation",
  "import",
]);

export const recommendationStatusEnum = pgEnum("recommendation_status", [
  "suggested",
  "saved",
  "added",
  "dismissed",
]);

export const tripSummaryStyleEnum = pgEnum("trip_summary_style", [
  "concise",
  "narrative",
  "scrapbook",
]);

// Tables
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  subscriptionTier: subscriptionTierEnum("subscription_tier")
    .notNull()
    .default("free"),
  preferences: jsonb("preferences"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: subscriptionTierEnum("plan").notNull().default("free"),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  destinations: text("destinations").array(),
  status: tripStatusEnum("status").notNull().default("planning"),
  preferenceOverrides: jsonb("preference_overrides"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const tripMembers = pgTable("trip_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: tripMemberRoleEnum("role").notNull().default("member"),
  invitedAt: timestamp("invited_at").notNull().defaultNow(),
  joinedAt: timestamp("joined_at"),
});

export const importDocuments = pgTable("import_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  rawText: text("raw_text").notNull(),
  sourceType: importSourceTypeEnum("source_type"),
  parsedJson: jsonb("parsed_json"),
  confidence: real("confidence"),
  status: importStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const flightSegments = pgTable("flight_segments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  importDocumentId: uuid("import_document_id").references(
    () => importDocuments.id
  ),
  airline: text("airline"),
  flightNumber: text("flight_number"),
  confirmationCode: text("confirmation_code"),
  passengerNames: text("passenger_names").array(),
  departureAirport: text("departure_airport"),
  arrivalAirport: text("arrival_airport"),
  departureTime: timestamp("departure_time", { withTimezone: true }),
  arrivalTime: timestamp("arrival_time", { withTimezone: true }),
  terminal: text("terminal"),
  gate: text("gate"),
  cabinClass: text("cabin_class"),
  seat: text("seat"),
  connectionGroup: text("connection_group"),
  direction: flightDirectionEnum("direction"),
  status: text("status").notNull().default("scheduled"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const hotelStays = pgTable("hotel_stays", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  importDocumentId: uuid("import_document_id").references(
    () => importDocuments.id
  ),
  hotelName: text("hotel_name"),
  address: text("address"),
  confirmationNumber: text("confirmation_number"),
  checkIn: timestamp("check_in", { withTimezone: true }),
  checkOut: timestamp("check_out", { withTimezone: true }),
  roomType: text("room_type"),
  guestCount: integer("guest_count"),
  contactInfo: text("contact_info"),
  latitude: real("latitude"),
  longitude: real("longitude"),
});

export const itineraryItems = pgTable("itinerary_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  type: itineraryItemTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  locationName: text("location_name"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  category: text("category"),
  source: itinerarySourceEnum("source").notNull().default("manual"),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
  transitDurationMin: integer("transit_duration_min"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const recommendations = pgTable("recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  targetDate: date("target_date"),
  name: text("name").notNull(),
  category: text("category"),
  description: text("description"),
  rationale: text("rationale"),
  estimatedDurationMin: integer("estimated_duration_min"),
  distanceFromAnchor: text("distance_from_anchor"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  rating: real("rating"),
  priceLevel: integer("price_level"),
  foursquareId: text("foursquare_id"),
  photoUrl: text("photo_url"),
  status: recommendationStatusEnum("status")
    .notNull()
    .default("suggested"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const packingItems = pgTable("packing_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  category: text("category"),
  checked: boolean("checked").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const preTripTasks = pgTable("pre_trip_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  completed: boolean("completed").notNull().default(false),
  dueDescription: text("due_description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const photoAssets = pgTable("photo_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  blobUrl: text("blob_url").notNull(),
  filename: text("filename").notNull(),
  takenAt: timestamp("taken_at", { withTimezone: true }),
  gpsLatitude: real("gps_latitude"),
  gpsLongitude: real("gps_longitude"),
  associatedDate: date("associated_date"),
  associatedItineraryItemId: uuid("associated_itinerary_item_id").references(
    () => itineraryItems.id
  ),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tripSummaries = pgTable("trip_summaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  style: tripSummaryStyleEnum("style").notNull(),
  content: text("content").notNull(),
  isPublic: boolean("is_public").notNull().default(false),
  publicSlug: text("public_slug"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  tripMembers: many(tripMembers),
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
}));

export const tripsRelations = relations(trips, ({ many }) => ({
  members: many(tripMembers),
  importDocuments: many(importDocuments),
  flightSegments: many(flightSegments),
  hotelStays: many(hotelStays),
  itineraryItems: many(itineraryItems),
  recommendations: many(recommendations),
  packingItems: many(packingItems),
  preTripTasks: many(preTripTasks),
  photoAssets: many(photoAssets),
  summaries: many(tripSummaries),
}));

export const tripMembersRelations = relations(tripMembers, ({ one }) => ({
  trip: one(trips, {
    fields: [tripMembers.tripId],
    references: [trips.id],
  }),
  user: one(users, {
    fields: [tripMembers.userId],
    references: [users.id],
  }),
}));
```

- [ ] **Step 4: Generate and run initial migration**

Run:
```bash
npx drizzle-kit generate
npx drizzle-kit push
```

Expected: Migration files created in `drizzle/` directory. Tables created in Neon database.

- [ ] **Step 5: Verify schema by checking migration output**

Run: `npx drizzle-kit studio`
Expected: Drizzle Studio opens in browser showing all tables with correct columns.

- [ ] **Step 6: Commit**

```bash
git add drizzle.config.ts src/lib/db/ drizzle/
git commit -m "feat: add Drizzle ORM schema with all MVP tables"
```

---

## Task 6: User Sync Webhook & User Queries

**Files:**
- Create: `src/app/api/clerk/webhook/route.ts`
- Create: `src/lib/db/queries/users.ts`

- [ ] **Step 1: Create user query functions**

```typescript
// src/lib/db/queries/users.ts
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getUserByClerkId(clerkId: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return result[0] ?? null;
}

export async function createUser(data: {
  clerkId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}) {
  const result = await db.insert(users).values(data).returning();
  return result[0];
}

export async function updateUser(
  clerkId: string,
  data: { email?: string; name?: string; avatarUrl?: string }
) {
  const result = await db
    .update(users)
    .set(data)
    .where(eq(users.clerkId, clerkId))
    .returning();
  return result[0];
}

export async function deleteUserByClerkId(clerkId: string) {
  await db.delete(users).where(eq(users.clerkId, clerkId));
}
```

- [ ] **Step 2: Create Clerk webhook handler**

```typescript
// src/app/api/clerk/webhook/route.ts
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import {
  createUser,
  updateUser,
  deleteUserByClerkId,
} from "@/lib/db/queries/users";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "user.created": {
      const { id, email_addresses, first_name, last_name, image_url } =
        event.data;
      const email = email_addresses[0]?.email_address;
      if (!email) break;

      await createUser({
        clerkId: id,
        email,
        name: [first_name, last_name].filter(Boolean).join(" ") || undefined,
        avatarUrl: image_url || undefined,
      });
      break;
    }
    case "user.updated": {
      const { id, email_addresses, first_name, last_name, image_url } =
        event.data;
      const email = email_addresses[0]?.email_address;

      await updateUser(id, {
        email,
        name: [first_name, last_name].filter(Boolean).join(" ") || undefined,
        avatarUrl: image_url || undefined,
      });
      break;
    }
    case "user.deleted": {
      if (event.data.id) {
        await deleteUserByClerkId(event.data.id);
      }
      break;
    }
  }

  return new Response("OK", { status: 200 });
}
```

Run: `npm install svix`

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/queries/users.ts src/app/api/clerk/webhook/
git commit -m "feat: add Clerk webhook for user sync and user query functions"
```

---

## Task 7: Trip Phase Computation (TDD)

**Files:**
- Create: `src/types/trip.ts`
- Create: `src/lib/utils/trip-phases.ts`
- Create: `tests/lib/utils/trip-phases.test.ts`

- [ ] **Step 1: Create trip types**

```typescript
// src/types/trip.ts
export type TripPhase =
  | "pre_trip"
  | "outbound_flight"
  | "trip"
  | "return_flight"
  | "post_trip";

export type TripStatus = "planning" | "active" | "completed" | "archived";

export type FlightDirection = "outbound" | "return";

export interface FlightSegmentData {
  direction: FlightDirection;
  departureTime: Date;
  arrivalTime: Date;
}

export interface TripWithFlights {
  flights: FlightSegmentData[];
}
```

- [ ] **Step 2: Write failing tests for computePhase**

```typescript
// tests/lib/utils/trip-phases.test.ts
import { describe, it, expect } from "vitest";
import { computePhase } from "@/lib/utils/trip-phases";
import type { TripWithFlights } from "@/types/trip";

describe("computePhase", () => {
  const makeTrip = (flights: TripWithFlights["flights"]): TripWithFlights => ({
    flights,
  });

  const outbound = (dep: string, arr: string) => ({
    direction: "outbound" as const,
    departureTime: new Date(dep),
    arrivalTime: new Date(arr),
  });

  const returnFlight = (dep: string, arr: string) => ({
    direction: "return" as const,
    departureTime: new Date(dep),
    arrivalTime: new Date(arr),
  });

  it("returns pre_trip when no flights exist", () => {
    const trip = makeTrip([]);
    expect(computePhase(trip, new Date())).toBe("pre_trip");
  });

  it("returns pre_trip before outbound departure", () => {
    const trip = makeTrip([
      outbound("2025-06-01T10:00:00Z", "2025-06-01T14:00:00Z"),
      returnFlight("2025-06-08T16:00:00Z", "2025-06-08T20:00:00Z"),
    ]);
    expect(computePhase(trip, new Date("2025-05-28T12:00:00Z"))).toBe(
      "pre_trip"
    );
  });

  it("returns outbound_flight during outbound travel", () => {
    const trip = makeTrip([
      outbound("2025-06-01T10:00:00Z", "2025-06-01T14:00:00Z"),
      returnFlight("2025-06-08T16:00:00Z", "2025-06-08T20:00:00Z"),
    ]);
    expect(computePhase(trip, new Date("2025-06-01T12:00:00Z"))).toBe(
      "outbound_flight"
    );
  });

  it("returns trip after outbound arrival and before return departure", () => {
    const trip = makeTrip([
      outbound("2025-06-01T10:00:00Z", "2025-06-01T14:00:00Z"),
      returnFlight("2025-06-08T16:00:00Z", "2025-06-08T20:00:00Z"),
    ]);
    expect(computePhase(trip, new Date("2025-06-04T12:00:00Z"))).toBe("trip");
  });

  it("returns return_flight during return travel", () => {
    const trip = makeTrip([
      outbound("2025-06-01T10:00:00Z", "2025-06-01T14:00:00Z"),
      returnFlight("2025-06-08T16:00:00Z", "2025-06-08T20:00:00Z"),
    ]);
    expect(computePhase(trip, new Date("2025-06-08T18:00:00Z"))).toBe(
      "return_flight"
    );
  });

  it("returns post_trip after return arrival", () => {
    const trip = makeTrip([
      outbound("2025-06-01T10:00:00Z", "2025-06-01T14:00:00Z"),
      returnFlight("2025-06-08T16:00:00Z", "2025-06-08T20:00:00Z"),
    ]);
    expect(computePhase(trip, new Date("2025-06-09T12:00:00Z"))).toBe(
      "post_trip"
    );
  });

  it("handles multi-segment outbound (uses last arrival)", () => {
    const trip = makeTrip([
      outbound("2025-06-01T08:00:00Z", "2025-06-01T11:00:00Z"),
      outbound("2025-06-01T13:00:00Z", "2025-06-01T18:00:00Z"),
      returnFlight("2025-06-08T16:00:00Z", "2025-06-08T20:00:00Z"),
    ]);
    // Between first arrival and last arrival — still outbound
    expect(computePhase(trip, new Date("2025-06-01T15:00:00Z"))).toBe(
      "outbound_flight"
    );
  });

  it("returns trip when only outbound flights exist (no return)", () => {
    const trip = makeTrip([
      outbound("2025-06-01T10:00:00Z", "2025-06-01T14:00:00Z"),
    ]);
    expect(computePhase(trip, new Date("2025-06-04T12:00:00Z"))).toBe("trip");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/lib/utils/trip-phases.test.ts`
Expected: FAIL — module `@/lib/utils/trip-phases` not found.

- [ ] **Step 4: Implement computePhase**

```typescript
// src/lib/utils/trip-phases.ts
import type { TripPhase, TripWithFlights } from "@/types/trip";

export function computePhase(trip: TripWithFlights, now: Date): TripPhase {
  const outboundFlights = trip.flights.filter(
    (f) => f.direction === "outbound"
  );
  const returnFlights = trip.flights.filter((f) => f.direction === "return");

  const outboundDeparture = outboundFlights
    .map((f) => f.departureTime)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const outboundArrival = outboundFlights
    .map((f) => f.arrivalTime)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const returnDeparture = returnFlights
    .map((f) => f.departureTime)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const returnArrival = returnFlights
    .map((f) => f.arrivalTime)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (!outboundDeparture || now < outboundDeparture) return "pre_trip";
  if (!outboundArrival || now < outboundArrival) return "outbound_flight";
  if (!returnDeparture || now < returnDeparture) return "trip";
  if (!returnArrival || now < returnArrival) return "return_flight";
  return "post_trip";
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/lib/utils/trip-phases.test.ts`
Expected: All 8 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types/trip.ts src/lib/utils/trip-phases.ts tests/lib/utils/trip-phases.test.ts
git commit -m "feat: add trip phase computation with tests"
```

---

## Task 8: Trip Query Functions & Server Actions

**Files:**
- Create: `src/lib/db/queries/trips.ts`
- Create: `src/app/actions/trips.ts`

- [ ] **Step 1: Create trip query functions**

```typescript
// src/lib/db/queries/trips.ts
import { db } from "@/lib/db";
import { trips, tripMembers, flightSegments, hotelStays } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getTripsForUser(userId: string) {
  const results = await db
    .select({
      trip: trips,
      role: tripMembers.role,
    })
    .from(tripMembers)
    .innerJoin(trips, eq(tripMembers.tripId, trips.id))
    .where(
      and(eq(tripMembers.userId, userId), tripMembers.joinedAt.isNotNull())
    )
    .orderBy(desc(trips.updatedAt));

  return results.map((r) => ({ ...r.trip, memberRole: r.role }));
}

export async function getTripById(tripId: string, userId: string) {
  const result = await db
    .select({
      trip: trips,
      role: tripMembers.role,
    })
    .from(tripMembers)
    .innerJoin(trips, eq(tripMembers.tripId, trips.id))
    .where(
      and(
        eq(tripMembers.tripId, tripId),
        eq(tripMembers.userId, userId),
        tripMembers.joinedAt.isNotNull()
      )
    )
    .limit(1);

  if (!result[0]) return null;
  return { ...result[0].trip, memberRole: result[0].role };
}

export async function getTripWithFlights(tripId: string) {
  const [trip] = await db.select().from(trips).where(eq(trips.id, tripId));
  if (!trip) return null;

  const flights = await db
    .select()
    .from(flightSegments)
    .where(eq(flightSegments.tripId, tripId))
    .orderBy(flightSegments.sortOrder);

  const hotels = await db
    .select()
    .from(hotelStays)
    .where(eq(hotelStays.tripId, tripId));

  return { ...trip, flights, hotels };
}

export async function createTrip(
  title: string,
  userId: string
): Promise<string> {
  const [trip] = await db.insert(trips).values({ title }).returning();

  await db.insert(tripMembers).values({
    tripId: trip.id,
    userId,
    role: "owner",
    joinedAt: new Date(),
  });

  return trip.id;
}

export async function updateTrip(
  tripId: string,
  data: { title?: string; status?: "planning" | "active" | "completed" | "archived" }
) {
  const [updated] = await db
    .update(trips)
    .set(data)
    .where(eq(trips.id, tripId))
    .returning();
  return updated;
}

export async function deleteTrip(tripId: string) {
  await db.delete(trips).where(eq(trips.id, tripId));
}

export async function isUserTripOwner(
  tripId: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .select()
    .from(tripMembers)
    .where(
      and(
        eq(tripMembers.tripId, tripId),
        eq(tripMembers.userId, userId),
        eq(tripMembers.role, "owner")
      )
    )
    .limit(1);
  return result.length > 0;
}
```

- [ ] **Step 2: Create server actions for trip mutations**

```typescript
// src/app/actions/trips.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/db/queries/users";
import {
  createTrip,
  updateTrip,
  deleteTrip,
  isUserTripOwner,
} from "@/lib/db/queries/trips";

export async function createTripAction(formData: FormData) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");

  const title = formData.get("title") as string;
  if (!title?.trim()) throw new Error("Title is required");

  const tripId = await createTrip(title.trim(), user.id);
  revalidatePath("/dashboard");
  redirect(`/trip/${tripId}/overview`);
}

export async function updateTripAction(tripId: string, formData: FormData) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");

  const title = formData.get("title") as string;
  if (!title?.trim()) throw new Error("Title is required");

  await updateTrip(tripId, { title: title.trim() });
  revalidatePath("/dashboard");
  revalidatePath(`/trip/${tripId}`);
}

export async function deleteTripAction(tripId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");

  const isOwner = await isUserTripOwner(tripId, user.id);
  if (!isOwner) throw new Error("Only the trip owner can delete a trip");

  await deleteTrip(tripId);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/queries/trips.ts src/app/actions/trips.ts
git commit -m "feat: add trip CRUD queries and server actions"
```

---

## Task 9: App Shell — Sidebar & Authenticated Layout

**Files:**
- Create: `src/app/(app)/layout.tsx`
- Create: `src/components/app-sidebar.tsx`
- Create: `src/components/user-button.tsx`

- [ ] **Step 1: Create user button component**

```tsx
// src/components/user-button.tsx
import { UserButton as ClerkUserButton } from "@clerk/nextjs";

export function UserButton() {
  return (
    <ClerkUserButton
      appearance={{
        elements: {
          avatarBox: "h-8 w-8",
        },
      }}
    />
  );
}
```

- [ ] **Step 2: Create app sidebar**

```tsx
// src/components/app-sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@/components/user-button";

const navItems = [
  { href: "/dashboard", label: "Trips", icon: LayoutDashboard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5">
        <Compass className="h-5 w-5 text-accent" />
        <span className="text-sm font-semibold tracking-widest uppercase text-accent">
          Voyager
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200",
                isActive
                  ? "bg-accent-muted text-accent"
                  : "text-text-secondary hover:text-text-primary hover:bg-card"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-border px-5 py-4">
        <UserButton />
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Create authenticated layout**

```tsx
// src/app/(app)/layout.tsx
import { AppSidebar } from "@/components/app-sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto bg-bg">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Verify sidebar renders on dashboard**

Create a stub dashboard page first:

```tsx
// src/app/(app)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Your Trips</h1>
      <p className="mt-2 text-text-secondary">No trips yet. Create one to get started.</p>
    </div>
  );
}
```

Run: `npm run dev`, sign in, navigate to `/dashboard`.
Expected: Sidebar with Voyager logo, nav items, user button. Main content shows "Your Trips".

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/ src/components/app-sidebar.tsx src/components/user-button.tsx
git commit -m "feat: add authenticated app shell with sidebar navigation"
```

---

## Task 10: Dashboard — Trip List & Create Trip

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`
- Create: `src/components/trip/trip-card.tsx`
- Create: `src/components/trip/create-trip-dialog.tsx`

- [ ] **Step 1: Create trip card component**

```tsx
// src/components/trip/trip-card.tsx
import Link from "next/link";
import { MapPin, Calendar, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";

interface TripCardProps {
  id: string;
  title: string;
  destinations: string[] | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  memberRole: string;
}

export function TripCard({
  id,
  title,
  destinations,
  startDate,
  endDate,
  status,
  memberRole,
}: TripCardProps) {
  return (
    <Link href={`/trip/${id}/overview`}>
      <Card className="transition-colors duration-200 hover:bg-card-hover cursor-pointer">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            {destinations && destinations.length > 0 && (
              <div className="mt-1 flex items-center gap-1 text-text-secondary text-sm">
                <MapPin className="h-3.5 w-3.5" />
                {destinations.join(" → ")}
              </div>
            )}
            {startDate && endDate && (
              <div className="mt-1 flex items-center gap-1 text-text-muted text-xs">
                <Calendar className="h-3 w-3" />
                {format(new Date(startDate), "MMM d")} –{" "}
                {format(new Date(endDate), "MMM d, yyyy")}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {memberRole === "member" && (
              <Badge variant="default">
                <Users className="mr-1 h-3 w-3" />
                Shared
              </Badge>
            )}
            <Badge
              variant={status === "active" ? "accent" : "default"}
            >
              {status}
            </Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Create trip dialog component**

```tsx
// src/components/trip/create-trip-dialog.tsx
"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createTripAction } from "@/app/actions/trips";

interface CreateTripDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateTripDialog({ open, onClose }: CreateTripDialogProps) {
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await createTripAction(formData);
    } catch {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Create Trip">
      <form action={handleSubmit}>
        <Input
          id="title"
          name="title"
          label="Trip Name"
          placeholder="e.g., Florence & Rome 2025"
          required
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create Trip"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
```

- [ ] **Step 3: Build full dashboard page**

```tsx
// src/app/(app)/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { getTripsForUser } from "@/lib/db/queries/trips";
import { TripCard } from "@/components/trip/trip-card";
import { DashboardActions } from "./dashboard-actions";

export default async function DashboardPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  const trips = await getTripsForUser(user.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your Trips</h1>
          <p className="mt-1 text-text-secondary text-sm">
            {trips.length === 0
              ? "No trips yet. Create one to get started."
              : `${trips.length} trip${trips.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <DashboardActions />
      </div>

      {trips.length > 0 && (
        <div className="mt-6 grid gap-3">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              id={trip.id}
              title={trip.title}
              destinations={trip.destinations}
              startDate={trip.startDate}
              endDate={trip.endDate}
              status={trip.status}
              memberRole={trip.memberRole}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create dashboard client actions**

```tsx
// src/app/(app)/dashboard/dashboard-actions.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateTripDialog } from "@/components/trip/create-trip-dialog";

export function DashboardActions() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <Button onClick={() => setShowCreate(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Trip
      </Button>
      <CreateTripDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </>
  );
}
```

- [ ] **Step 5: Verify trip creation flow in browser**

Run: `npm run dev`
1. Sign in, go to `/dashboard`
2. Click "New Trip", enter "Florence 2025", click "Create Trip"
3. Expected: Redirects to `/trip/{id}/overview` (404 for now — that's fine, we build it next)
4. Navigate back to `/dashboard`
5. Expected: Trip card appears in the list

- [ ] **Step 6: Commit**

```bash
git add src/app/\(app\)/dashboard/ src/components/trip/trip-card.tsx src/components/trip/create-trip-dialog.tsx
git commit -m "feat: add dashboard with trip list and create trip dialog"
```

---

## Task 11: Trip Layout with Phase Rail & Overview Page

**Files:**
- Create: `src/app/(app)/trip/[tripId]/layout.tsx`
- Create: `src/app/(app)/trip/[tripId]/overview/page.tsx`
- Create: `src/components/trip/phase-rail.tsx`

- [ ] **Step 1: Create phase rail component**

```tsx
// src/components/trip/phase-rail.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Luggage,
  PlaneTakeoff,
  CalendarDays,
  PlaneLanding,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripPhase } from "@/types/trip";

interface PhaseRailProps {
  tripId: string;
  currentPhase: TripPhase;
}

const phases = [
  { key: "overview", label: "Overview", icon: LayoutGrid, path: "overview" },
  { key: "pre_trip", label: "Pre-Trip", icon: Luggage, path: "pre-trip" },
  {
    key: "outbound_flight",
    label: "Outbound",
    icon: PlaneTakeoff,
    path: "flight/outbound",
  },
  { key: "trip", label: "Trip", icon: CalendarDays, path: "itinerary" },
  {
    key: "return_flight",
    label: "Return",
    icon: PlaneLanding,
    path: "flight/return",
  },
  { key: "post_trip", label: "Post-Trip", icon: Camera, path: "photos" },
] as const;

export function PhaseRail({ tripId, currentPhase }: PhaseRailProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 w-48 py-4 pr-4 border-r border-border">
      {phases.map((phase) => {
        const href = `/trip/${tripId}/${phase.path}`;
        const isActive = pathname.startsWith(href);
        const isCurrent = phase.key === currentPhase;

        return (
          <Link
            key={phase.key}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200",
              isActive
                ? "bg-accent-muted text-accent"
                : "text-text-secondary hover:text-text-primary hover:bg-card",
              isCurrent && !isActive && "text-accent/60"
            )}
          >
            <phase.icon className="h-4 w-4" />
            <span>{phase.label}</span>
            {isCurrent && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Create trip layout**

```tsx
// src/app/(app)/trip/[tripId]/layout.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { getTripById, getTripWithFlights } from "@/lib/db/queries/trips";
import { PhaseRail } from "@/components/trip/phase-rail";
import { computePhase } from "@/lib/utils/trip-phases";

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  const trip = await getTripById(tripId, user.id);
  if (!trip) notFound();

  const tripWithFlights = await getTripWithFlights(tripId);
  const flights = (tripWithFlights?.flights ?? []).map((f) => ({
    direction: f.direction as "outbound" | "return",
    departureTime: f.departureTime!,
    arrivalTime: f.arrivalTime!,
  })).filter((f) => f.departureTime && f.arrivalTime);

  const currentPhase = computePhase({ flights }, new Date());

  return (
    <div className="flex gap-0 -mx-6 -my-8 h-screen">
      <PhaseRail tripId={tripId} currentPhase={currentPhase} />
      <div className="flex-1 overflow-y-auto px-6 py-8">{children}</div>
    </div>
  );
}
```

- [ ] **Step 3: Create trip overview page**

```tsx
// src/app/(app)/trip/[tripId]/overview/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { getTripById, getTripWithFlights } from "@/lib/db/queries/trips";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plane, Building2 } from "lucide-react";
import { format } from "date-fns";

export default async function TripOverviewPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  const trip = await getTripById(tripId, user.id);
  if (!trip) notFound();

  const tripData = await getTripWithFlights(tripId);
  const flights = tripData?.flights ?? [];
  const hotels = tripData?.hotels ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {trip.title}
          </h1>
          {trip.destinations && trip.destinations.length > 0 && (
            <div className="mt-1 flex items-center gap-1 text-text-secondary text-sm">
              <MapPin className="h-3.5 w-3.5" />
              {trip.destinations.join(" → ")}
            </div>
          )}
        </div>
        <Badge variant="accent">{trip.status}</Badge>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {/* Flights */}
        <Card>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-accent" />
            Flights
          </CardTitle>
          <CardContent className="mt-3">
            {flights.length === 0 ? (
              <p className="text-sm text-text-muted">
                No flights added yet. Paste a confirmation email to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {flights.map((f) => (
                  <div key={f.id} className="text-sm">
                    <span className="text-text-primary">
                      {f.departureAirport} → {f.arrivalAirport}
                    </span>
                    {f.departureTime && (
                      <span className="ml-2 text-text-muted">
                        {format(f.departureTime, "MMM d, h:mm a")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hotels */}
        <Card>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-accent" />
            Hotels
          </CardTitle>
          <CardContent className="mt-3">
            {hotels.length === 0 ? (
              <p className="text-sm text-text-muted">
                No hotels added yet. Paste a confirmation email to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {hotels.map((h) => (
                  <div key={h.id} className="text-sm">
                    <span className="text-text-primary">{h.hotelName}</span>
                    {h.checkIn && h.checkOut && (
                      <span className="ml-2 text-text-muted">
                        {format(h.checkIn, "MMM d")} –{" "}
                        {format(h.checkOut, "MMM d")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify trip view in browser**

Run: `npm run dev`
1. Go to `/dashboard`, click on an existing trip
2. Expected: Phase rail on left, overview page with trip title, flights card (empty), hotels card (empty)

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/trip/ src/components/trip/phase-rail.tsx
git commit -m "feat: add trip layout with phase rail and overview page"
```

---

## Task 12: Settings Page (Stub) & Final Verification

**Files:**
- Create: `src/app/(app)/settings/page.tsx`

- [ ] **Step 1: Create settings page stub**

```tsx
// src/app/(app)/settings/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { Card, CardTitle, CardContent } from "@/components/ui/card";

export default async function SettingsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-text-secondary text-sm">
        Manage your account and preferences.
      </p>

      <Card className="mt-6">
        <CardTitle>Account</CardTitle>
        <CardContent className="mt-3">
          <div className="text-sm">
            <span className="text-text-muted">Email: </span>
            <span>{user.email}</span>
          </div>
          <div className="mt-1 text-sm">
            <span className="text-text-muted">Plan: </span>
            <span className="capitalize">{user.subscriptionTier}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Run full build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: All tests pass (trip phase computation tests).

- [ ] **Step 4: Full E2E walkthrough**

Run: `npm run dev`

Verify these flows:
1. Visit `/` — redirects to `/sign-in`
2. Sign in — redirects to `/dashboard`
3. Dashboard shows empty state with "New Trip" button
4. Click "New Trip", enter name, create — redirects to trip overview
5. Trip overview shows phase rail on left, trip details on right
6. Navigate between phases via rail — each shows placeholder/404 (expected, those pages come in Phase 2+)
7. Navigate to Settings — shows account info
8. Sidebar navigation works correctly

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/settings/
git commit -m "feat: add settings page stub - Phase 1 Foundation complete"
```

---

## Phases 2-6: Outline

The following phases will each get their own detailed implementation plan when Phase 1 is complete. Summary of what each covers:

### Phase 2: Email Parsing & Scaffold (6 tasks)
- Email paste textarea component with paste event handling
- AI model router setup (Vercel AI Gateway + AI SDK)
- Email classification pipeline (Haiku 4.5 structured output)
- Flight/hotel extraction pipeline (Sonnet 4.6 structured output, streaming)
- Booking review card with editable low-confidence fields
- Scaffold generation: compute trip bounds, create day containers, insert anchors

### Phase 3: Pre-Trip & Flights (5 tasks)
- Pre-trip dashboard: countdown timer, reservation summary cards
- Weather integration (Open-Meteo client + weather preview cards)
- AI packing list generation (Haiku 4.5) + checklist UI
- Pre-trip task generation + checklist UI
- Flight dashboard: flight cards, segment timeline, connection warnings, leave-by calculator

### Phase 4: Trip Planning Core (8 tasks)
- Itinerary item CRUD with server actions
- Daily agenda view with timeline and activity cards
- Weekly calendar: time grid, day columns, activity blocks
- dnd-kit integration: drag, drop, resize, snap to 15-min grid
- Mapbox integration: directions API client, transit time calculation
- Recalculation engine: update transit blocks on itinerary changes
- Recommendation engine: LLM generation + Foursquare enrichment + cards
- Map view: Mapbox GL dark mode, POI pins, filter sidebar

### Phase 5: Post-Trip & Subscription (7 tasks)
- Photo upload with Vercel Blob + EXIF extraction (exifr)
- Photo-place association: GPS matching, timestamp inference
- Photo management UI: drag between days/places
- Trip recap generation: multiple styles, LLM-generated narrative
- Shareable public recap pages
- Stripe integration: checkout, webhooks, subscription lifecycle
- Feature gates + group trip: invite flow, member permissions

### Phase 6: Polish (5 tasks)
- Framer Motion: page transitions, card animations, micro-interactions
- Loading states: skeleton screens for all async content
- Error boundaries and toast notifications
- Responsive design adjustments for tablet/mobile
- Design system audit: color consistency, spacing, typography review
