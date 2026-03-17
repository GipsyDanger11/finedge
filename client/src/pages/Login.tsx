import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getOAuthLoginUrl, isOAuthConfigured } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) return;
    setLocation("/dashboard");
  }, [isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/40 px-4">
      <Card className="card-elegant p-6 w-full max-w-md">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="text-xl font-semibold tracking-tight">Sign in</div>
            <div className="text-sm text-muted-foreground">
              Continue to the secure login flow to access your dashboard.
            </div>
          </div>
        </div>

        <div className="pt-6">
          <Button
            size="lg"
            className="w-full"
            disabled={!isOAuthConfigured() && !import.meta.env.DEV}
            onClick={() => {
              try {
                if (import.meta.env.DEV && !isOAuthConfigured()) {
                  setLocation("/dashboard");
                  return;
                }
                const url = getOAuthLoginUrl();
                if (!url) {
                  toast.error("OAuth is not configured.");
                  return;
                }
                window.location.href = url;
              } catch (e) {
                toast.error("Invalid OAuth configuration", {
                  description:
                    "Check VITE_OAUTH_PORTAL_URL and VITE_APP_ID in your .env, then restart dev server.",
                });
              }
            }}
          >
            {import.meta.env.DEV && !isOAuthConfigured()
              ? "Continue (dev)"
              : "Continue"}
          </Button>
          {!isOAuthConfigured() ? (
            <p className="mt-4 text-sm text-muted-foreground">
              OAuth is not configured. Add{" "}
              <span className="font-medium text-foreground">
                VITE_OAUTH_PORTAL_URL
              </span>{" "}
              and{" "}
              <span className="font-medium text-foreground">VITE_APP_ID</span>{" "}
              to your <span className="font-medium text-foreground">.env</span>{" "}
              (with real values, not placeholders) and restart the dev server.
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

