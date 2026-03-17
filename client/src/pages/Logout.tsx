import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Logout() {
  const [, setLocation] = useLocation();
  const logout = trpc.auth.logout.useMutation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await logout.mutateAsync();
      } finally {
        if (!cancelled) setLocation("/");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [logout, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Signing out…
      </div>
    </div>
  );
}

