import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/db/queries/users";
import { getTripsForUser } from "@/lib/db/queries/trips";
import { TripCard } from "@/components/trip/trip-card";
import { DashboardActions } from "./dashboard-actions";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/motion";

export default async function DashboardPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await getUserByClerkId(clerkId);
  if (!user) redirect("/sign-in");

  const trips = await getTripsForUser(user.id);

  return (
    <div>
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your Trips</h1>
            <p className="mt-1 text-text-secondary text-sm">
              {trips.length === 0 ? "No trips yet. Create one to get started." : `${trips.length} trip${trips.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <DashboardActions />
        </div>
      </FadeIn>
      {trips.length > 0 && (
        <StaggerChildren className="mt-6 grid gap-3">
          {trips.map((trip) => (
            <StaggerItem key={trip.id}>
              <TripCard
                id={trip.id}
                title={trip.title}
                destinations={trip.destinations}
                startDate={trip.startDate}
                endDate={trip.endDate}
                status={trip.status}
                memberRole={trip.memberRole}
              />
            </StaggerItem>
          ))}
        </StaggerChildren>
      )}
    </div>
  );
}
