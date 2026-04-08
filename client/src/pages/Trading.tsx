import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Trading() {
  const utils = trpc.useUtils();
  const portfolios = trpc.portfolio.list.useQuery();
  const practicePortfolios = useMemo(
    () => (portfolios.data ?? []).filter((p: any) => p.type === "practice"),
    [portfolios.data]
  );

  const [portfolioId, setPortfolioId] = useState("");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [symbol, setSymbol] = useState("AAPL");
  const [qty, setQty] = useState("1");
  const [priceOverride, setPriceOverride] = useState("");

  const selectedId = useMemo(() => {
    if (portfolioId) return portfolioId;
    const first = practicePortfolios[0]?._id;
    return first ? String(first) : "";
  }, [portfolioId, practicePortfolios]);

  const market = trpc.market.getPrice.useQuery(
    { symbol: symbol.trim().toUpperCase() },
    { enabled: symbol.trim().length > 0 }
  );

  const computedPrice = useMemo(() => {
    const override = Number(priceOverride);
    if (Number.isFinite(override) && override > 0) return override;
    const api = market.data?.currentPrice;
    return typeof api === "number" && api > 0 ? api : 0;
  }, [market.data?.currentPrice, priceOverride]);

  const place = trpc.portfolio.addTransaction.useMutation({
    onSuccess: async () => {
      await utils.portfolio.getTransactions.invalidate({
        portfolioId: selectedId,
        limit: 50,
      });
    },
  });

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">Trading</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Practice-mode paper trading. Places simulated buys/sells as transactions.
        </p>
      </div>

      <Card className="card-elegant p-5 animate-slideInRight">
        <div className="flex items-center justify-between">
          <div className="font-medium">Paper trade</div>
          {portfolios.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : null}
        </div>

        {practicePortfolios.length === 0 && !portfolios.isLoading ? (
          <div className="mt-6 space-y-3">
            <div className="text-sm text-muted-foreground">
              Create a <span className="font-medium text-foreground">practice</span>{" "}
              portfolio to start paper trading.
            </div>
          </div>
        ) : null}

        {practicePortfolios.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="md:col-span-2 space-y-2">
              <div className="text-xs text-muted-foreground">Portfolio</div>
              <Select value={selectedId} onValueChange={setPortfolioId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select practice portfolio" />
                </SelectTrigger>
                <SelectContent>
                  {practicePortfolios.map((p: any) => (
                    <SelectItem key={String(p._id)} value={String(p._id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Side</div>
              <Select value={side} onValueChange={(v) => setSide(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Symbol</div>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL"
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Quantity</div>
              <Input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" />
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Price override</div>
              <Input
                value={priceOverride}
                onChange={(e) => setPriceOverride(e.target.value)}
                placeholder={market.data?.currentPrice ? String(market.data.currentPrice) : "—"}
                inputMode="decimal"
              />
            </div>

            <div className="md:col-span-6 mt-2 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                {market.isLoading ? (
                  <span>Fetching price…</span>
                ) : market.data ? (
                  <span>
                    Market:{" "}
                    <span className="font-medium text-foreground">
                      {market.data.currentPrice.toLocaleString(undefined, {
                        style: "currency",
                        currency: "USD",
                      })}
                    </span>
                  </span>
                ) : (
                  <span>No market data yet.</span>
                )}
              </div>

              <Button
                aria-label="Place trade"
                disabled={
                  place.isPending ||
                  !selectedId ||
                  symbol.trim().length === 0 ||
                  !(Number(qty) > 0) ||
                  !(computedPrice > 0)
                }
                onClick={() => {
                  place.mutate({
                    portfolioId: selectedId,
                    symbol: symbol.trim(),
                    type: side,
                    quantity: Number(qty),
                    price: computedPrice,
                    fee: 0,
                    notes: "paper trade",
                  });
                }}
              >
                {place.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Placing…
                  </>
                ) : (
                  "Place trade"
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

