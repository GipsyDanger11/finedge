import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";

type PortfolioType = "live" | "practice";

export default function Portfolio() {
  const utils = trpc.useUtils();
  const list = trpc.portfolio.list.useQuery();
  const update = trpc.portfolio.update.useMutation({
    onSuccess: async () => {
      await utils.portfolio.list.invalidate();
    },
  });
  const create = trpc.portfolio.create.useMutation({
    onSuccess: async () => {
      await utils.portfolio.list.invalidate();
    },
  });

  const [name, setName] = useState("");
  const [type, setType] = useState<PortfolioType>("practice");
  const [initialBalance, setInitialBalance] = useState("10000");

  const canSubmit = useMemo(() => {
    const balance = Number(initialBalance);
    return name.trim().length > 0 && Number.isFinite(balance) && balance > 0;
  }, [initialBalance, name]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Create and manage live or practice portfolios.
          </p>
        </div>
      </div>

      <Card className="card-elegant p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="font-medium">Create portfolio</div>
          {create.isPending ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating…
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Name</div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My portfolio"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Type</div>
            <Select value={type} onValueChange={(v) => setType(v as PortfolioType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="practice">Practice</SelectItem>
                <SelectItem value="live">Live</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Initial balance</div>
            <Input
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              inputMode="decimal"
              placeholder="10000"
            />
          </div>
        </div>

        <div className="pt-4">
          <Button
            disabled={!canSubmit || create.isPending}
            onClick={() => {
              create.mutate({
                name: name.trim(),
                type,
                initialBalance: Number(initialBalance),
              });
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>
        </div>
      </Card>

      <Card className="card-elegant p-5">
        <div className="flex items-center justify-between">
          <div className="font-medium">Your portfolios</div>
          {list.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : null}
        </div>

        {list.error ? (
          <div className="mt-4 text-sm text-destructive">
            Failed to load portfolios.
          </div>
        ) : null}

        {list.data && list.data.length === 0 ? (
          <div className="mt-6 text-sm text-muted-foreground">
            No portfolios yet. Create your first one above.
          </div>
        ) : null}

        {list.data && list.data.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {list.data.map((p: any) => (
              <Card key={String(p._id)} className="p-4 border bg-background/60">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {String(p.type).toUpperCase()} • Initial:{" "}
                      {Number(p.initialBalance ?? 0).toLocaleString(undefined, {
                        style: "currency",
                        currency: "USD",
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Public</div>
                    <div className="text-xs text-muted-foreground">
                      Shareable link available when enabled
                    </div>
                  </div>
                  <Switch
                    checked={Boolean(p.isPublic)}
                    disabled={update.isPending}
                    onCheckedChange={(checked) => {
                      update.mutate({ portfolioId: String(p._id), isPublic: checked });
                    }}
                  />
                </div>

                {p.isPublic ? (
                  <div className="pt-3 text-xs text-muted-foreground">
                    Share:{" "}
                    <a className="underline" href={`/share/${String(p._id)}`}>
                      {`/share/${String(p._id)}`}
                    </a>
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
}

