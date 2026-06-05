import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSuspenseQuery } from "@tanstack/react-query";
import { meQueryOptions } from "@/features/profile/hooks/useProfile";

export const ProfilePage = () => {
  const { data: user } = useSuspenseQuery(meQueryOptions);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(user.display_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-8 pb-4 border-b border-border">
        <h1 className="text-2xl font-medium text-foreground">Profile</h1>
      </div>

      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-2 py-8 border-b border-border">
        <div className="w-20 h-20 rounded-full bg-violet-500/10 flex items-center justify-center text-2xl font-medium text-violet-400">
          {user.username.slice(0, 2).toUpperCase()}
        </div>
        <p className="text-lg font-medium text-foreground">{user.username}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      {/* Info */}
      <div className="px-5 py-4 space-y-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
              Display ID
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground font-mono">
              {user.display_id}
            </p>
            <Button size="icon" variant="ghost" onClick={handleCopy}>
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
