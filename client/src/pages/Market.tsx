import LivePriceChart from "@/components/LivePriceChart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, RefreshCcw, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

export default function Market() {
  const utils = trpc.useUtils();
  const cached = trpc.market.getAllCached.useQuery();
  const refresh = trpc.market.refreshMany.useMutation({
    onSuccess: async () => {
      await cached.refetch();
    },
  });

  const [watch, setWatch] = useState("AAPL,MSFT,TSLA,NVDA,BTC");

  const watchlist = useMemo(() => {
    return Array.from(
      new Set(
        watch
          .split(/[,\s]+/g)
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean)
          .slice(0, 12)
      )
    );
  }, [watch]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">Market</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Live prices (mock feed today) + cached market data.
        </p>
      </div>

      <Card className="card-elegant p-5">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <div className="text-xs text-muted-foreground mb-1">Watchlist</div>
            <Input value={watch} onChange={(e) => setWatch(e.target.value)} />
          </div>
          <Button
            disabled={refresh.isPending || watchlist.length === 0}
            onClick={() => refresh.mutate({ symbols: watchlist })}
          >
            {refresh.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Refreshing…
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {watchlist.map((symbol) => (
          <Card key={symbol} className="card-elegant p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold tracking-tight">{symbol}</div>
                <div className="text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    {cached.isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : null}
                    Cached:{" "}
                    {(() => {
                      const row = (cached.data ?? []).find(
                        (r: any) => String(r.symbol).toUpperCase() === symbol
                      );
                      const p = Number((row as any)?.currentPrice ?? NaN);
                      return Number.isFinite(p)
                        ? p.toLocaleString(undefined, {
                            style: "currency",
                            currency: "USD",
                          })
                        : "—";
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3">
              <LivePriceChart symbol={symbol} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

