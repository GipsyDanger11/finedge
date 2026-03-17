import LivePriceChart from "@/components/LivePriceChart";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Share2, Sparkles } from "lucide-react";

export default function SharedPortfolio({
  params,
}: {
  params: { portfolioId: string };
}) {
  const portfolioId = params.portfolioId;
  const portfolio = trpc.portfolio.getPublicWithAssets.useQuery({ portfolioId });
  const insights = trpc.ai.getPublicInsights.useQuery(
    { portfolioId },
    { enabled: portfolio.isSuccess }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40">
      <main className="mx-auto max-w-5xl px-4 py-12 space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Share2 className="h-4 w-4" />
            Shared portfolio
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {(portfolio.data as any)?.name ?? "Portfolio"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Public snapshot + AI insights (read-only).
          </p>
        </div>

        <Card className="card-elegant p-5">
          <div className="font-medium">Assets</div>
          {portfolio.isLoading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : null}
          {portfolio.error ? (
            <div className="mt-4 text-sm text-destructive">
              This portfolio is not available.
            </div>
          ) : null}
          {portfolio.data ? (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {((portfolio.data as any).assets ?? []).map((a: any) => (
                <Card key={String(a._id)} className="p-4 border bg-background/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium">{a.symbol}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Qty: {Number(a.quantity ?? 0)}
                      </div>
                    </div>
                  </div>
                  <div className="pt-3">
                    <LivePriceChart symbol={String(a.symbol)} maxPoints={40} />
                  </div>
                </Card>
              ))}
            </div>
          ) : null}
        </Card>

        <Card className="card-elegant p-5">
          <div className="flex items-center justify-between">
            <div className="font-medium inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI insights
            </div>
            {insights.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : null}
          </div>

          {insights.error ? (
            <div className="mt-4 text-sm text-muted-foreground">
              No insights available yet.
            </div>
          ) : null}

          {insights.data ? (
            <pre className="mt-4 text-sm whitespace-pre-wrap break-words">
              {typeof insights.data === "string"
                ? insights.data
                : JSON.stringify(insights.data, null, 2)}
            </pre>
          ) : null}
        </Card>
      </main>
    </div>
  );
}

