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
      <p className="mt-1 text-text-secondary text-sm">Manage your account and preferences.</p>
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
