import React from "react";
import Link from "next/link";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserHoverCardProps {
  user: { id: string; name: string; email?: string; created_at?: string };
  children: React.ReactNode;
}

export function UserHoverCard({ user, children }: UserHoverCardProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Link href={`/profile/${user.id}`} className="hover:underline font-medium text-blue-700">{children}</Link>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4">
        <Link href={`/profile/${user.id}`} className="block no-underline">
          <div className="flex items-start space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.name ? `/placeholder.svg?text=${user.name[0]}` : undefined} alt={user.name || "User"} />
              <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <h4 className="text-base font-semibold">{user.name || "Unnamed User"}</h4>
              {user.email && <div className="text-xs text-muted-foreground mt-1">{user.email}</div>}
              {user.created_at && <div className="text-xs text-muted-foreground mt-1">Joined {new Date(user.created_at).toLocaleDateString()}</div>}
            </div>
          </div>
        </Link>
      </HoverCardContent>
    </HoverCard>
  );
} 