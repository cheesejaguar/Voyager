"use client";

import { useState } from "react";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, X, Loader2 } from "lucide-react";
import { inviteMemberAction, removeMemberAction } from "@/app/actions/members";

interface Member {
  memberId: string;
  userId: string;
  email: string;
  name: string | null;
  role: string;
  joinedAt: Date | null;
}

interface MemberListProps {
  tripId: string;
  members: Member[];
  isOwner: boolean;
}

export function MemberList({ tripId, members, isOwner }: MemberListProps) {
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite() {
    if (!email.trim()) return;
    setInviting(true);
    setError(null);
    try {
      const result = await inviteMemberAction(tripId, email.trim());
      if (result.success) { setEmail(""); }
      else { setError(result.error ?? "Failed to invite"); }
    } catch { setError("An error occurred"); }
    finally { setInviting(false); }
  }

  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        <Users className="h-4 w-4 text-accent" />
        Trip Members
      </CardTitle>
      <CardContent className="mt-3 space-y-3">
        {members.map((m) => (
          <div key={m.memberId} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span>{m.name ?? m.email}</span>
              <Badge variant={m.role === "owner" ? "accent" : "default"}>{m.role}</Badge>
              {!m.joinedAt && <Badge variant="warning">Pending</Badge>}
            </div>
            {isOwner && m.role !== "owner" && (
              <button onClick={() => removeMemberAction(tripId, m.memberId)} className="text-text-muted hover:text-error transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}

        {isOwner && (
          <div className="pt-3 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={handleInvite} disabled={inviting || !email.trim()}>
                {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              </Button>
            </div>
            {error && <p className="mt-1 text-xs text-error">{error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
