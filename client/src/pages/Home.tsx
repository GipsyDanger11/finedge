import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart3, Bot, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * All content in this page are only for example, replace with your own feature implementation
 * When building pages, remember your instructions in Frontend Workflow, Frontend Best Practices, Design Guide and Common Pitfalls
 */
export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) return;
    setLocation("/dashboard");
  }, [isAuthenticated, setLocation]);

  // If theme is switchable in App.tsx, we can implement theme toggling like this:
  // const { theme, toggleTheme } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40">
      <main className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-5">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              AI-powered finance, built for clarity
            </div>

            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
              FINEDGE
              <span className="block text-muted-foreground text-2xl md:text-3xl font-normal mt-3">
                Track portfolios, paper trade, and get market insights.
              </span>
            </h1>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => {
                  setLocation("/login");
                }}
              >
                Sign in
              </Button>
              <Button size="lg" variant="outline" onClick={() => setLocation("/dashboard")}>
                Open dashboard
              </Button>
            </div>

            {user ? (
              <p className="text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{user.name || user.email}</span>
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 card-elegant">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="font-medium">Portfolio overview</div>
                  <div className="text-sm text-muted-foreground">
                    Track portfolios, assets, and transactions in one place.
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5 card-elegant">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="font-medium">AI insights</div>
                  <div className="text-sm text-muted-foreground">
                    Market summaries and portfolio-specific guidance.
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5 card-elegant">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="font-medium">Secure sessions</div>
                  <div className="text-sm text-muted-foreground">
                    OAuth + session cookies for a clean sign-in experience.
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
