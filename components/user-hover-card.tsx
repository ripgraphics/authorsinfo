import React from "react";
import { useRouter } from "next/navigation";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserHoverCardProps {
  user: { id: string; name: string; email?: string; created_at?: string };
  children: React.ReactNode;
}

export function UserHoverCard({ user, children }: UserHoverCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/profile/${user.id}`);
  };

  return (
    <HoverCard openOnClick>
      <HoverCardTrigger asChild>
        <span 
          className="hover:underline cursor-pointer text-muted-foreground"
          onClick={handleClick}
        >
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={`/api/avatar/${user.id}`} alt={user.name} />
            <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{user.name}</h4>
            {user.created_at && (
              <p className="text-sm text-muted-foreground">
                Joined {new Date(user.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
} 