import LivePriceChart from "@/components/LivePriceChart";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, Loader2 } from "lucide-react";

export default function Analytics() {
  const overview = trpc.portfolio.overview.useQuery();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Key metrics + real-time signals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-elegant p-5">
          <div className="text-xs text-muted-foreground">Portfolios</div>
          <div className="text-2xl font-semibold mt-2">
            {overview.isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              overview.data?.portfolioCount ?? 0
            )}
          </div>
        </Card>
        <Card className="card-elegant p-5">
          <div className="text-xs text-muted-foreground">Live</div>
          <div className="text-2xl font-semibold mt-2">
            {overview.data?.liveCount ?? 0}
          </div>
        </Card>
        <Card className="card-elegant p-5">
          <div className="text-xs text-muted-foreground">Practice</div>
          <div className="text-2xl font-semibold mt-2">
            {overview.data?.practiceCount ?? 0}
          </div>
        </Card>
        <Card className="card-elegant p-5">
          <div className="text-xs text-muted-foreground">Transactions</div>
          <div className="text-2xl font-semibold mt-2">
            {overview.data?.transactionCount ?? 0}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="card-elegant p-5">
          <div className="font-medium">AAPL (live)</div>
          <div className="text-sm text-muted-foreground mt-1">
            Streaming chart (client-side history)
          </div>
          <div className="pt-3">
            <LivePriceChart symbol="AAPL" />
          </div>
        </Card>
        <Card className="card-elegant p-5">
          <div className="font-medium">BTC (live)</div>
          <div className="text-sm text-muted-foreground mt-1">
            Streaming chart (client-side history)
          </div>
          <div className="pt-3">
            <LivePriceChart symbol="BTC" />
          </div>
        </Card>
      </div>
    </div>
  );
}

