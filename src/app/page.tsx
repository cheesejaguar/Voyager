import { redirect } from "next/navigation";

export default async function Home() {
  // If Clerk is configured, check auth and redirect
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (userId) {
      redirect("/dashboard");
    }
    redirect("/sign-in");
  }

  // Landing page when auth isn't configured yet
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-lg">
        <h1 className="text-5xl font-bold tracking-tight text-accent">
          Voyager
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          AI-powered travel planning that turns booking emails into a living itinerary.
        </p>
        <div className="mt-8 rounded-xl bg-card border border-border p-6 text-left">
          <h2 className="text-sm font-medium uppercase tracking-wider text-text-muted mb-3">
            Getting Started
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Configure your environment variables to activate the app.
            See the deployment guide for setup instructions with Clerk, Neon, and Vercel AI Gateway.
          </p>
        </div>
      </div>
    </div>
  );
}
