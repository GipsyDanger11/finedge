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
import { Bell, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

export default function Alerts() {
  const utils = trpc.useUtils();
  const alerts = trpc.alerts.list.useQuery();
  const notifications = trpc.notifications.list.useQuery({ limit: 50 });

  const create = trpc.alerts.create.useMutation({
    onSuccess: async () => {
      await alerts.refetch();
    },
  });
  const del = trpc.alerts.delete.useMutation({
    onSuccess: async () => {
      await alerts.refetch();
    },
  });
  const deactivate = trpc.alerts.deactivate.useMutation({
    onSuccess: async () => {
      await alerts.refetch();
    },
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: async () => {
      await notifications.refetch();
    },
  });

  const [symbol, setSymbol] = useState("AAPL");
  const [type, setType] = useState<"above" | "below">("above");
  const [target, setTarget] = useState("120");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Price alerts trigger in-app notifications when refreshed market data crosses your target.
        </p>
      </div>

      <Card className="card-elegant p-5">
        <div className="font-medium">Create price alert</div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4 items-end">
          <div className="md:col-span-2">
            <div className="text-xs text-muted-foreground mb-1">Symbol</div>
            <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Condition</div>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="above">Above</SelectItem>
                <SelectItem value="below">Below</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Target price</div>
            <Input value={target} onChange={(e) => setTarget(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <Button
              className="w-full"
              disabled={create.isPending || symbol.trim().length === 0 || !(Number(target) > 0)}
              onClick={() =>
                create.mutate({
                  symbol: symbol.trim(),
                  alertType: type,
                  targetPrice: Number(target),
                })
              }
            >
              {create.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="card-elegant p-5">
        <div className="flex items-center justify-between">
          <div className="font-medium">My alerts</div>
          {alerts.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : null}
        </div>

        {(alerts.data ?? []).length === 0 && !alerts.isLoading ? (
          <div className="mt-4 text-sm text-muted-foreground">No alerts yet.</div>
        ) : null}

        {(alerts.data ?? []).length > 0 ? (
          <div className="mt-4 space-y-2">
            {(alerts.data ?? []).map((a: any) => (
              <div
                key={String(a._id)}
                className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2 bg-background/60"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {String(a.symbol).toUpperCase()} {a.alertType}{" "}
                    {Number(a.targetPrice).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {a.isActive ? "Active" : "Inactive"}{" "}
                    {a.triggeredAt ? `• Triggered ${new Date(a.triggeredAt).toLocaleString()}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.isActive ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={deactivate.isPending}
                      onClick={() => deactivate.mutate({ alertId: String(a._id) })}
                    >
                      Deactivate
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={del.isPending}
                    onClick={() => del.mutate({ alertId: String(a._id) })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      <Card className="card-elegant p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="font-medium">Notifications</div>
          <Button
            size="sm"
            variant="outline"
            disabled={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            Mark all read
          </Button>
        </div>

        {notifications.isLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : null}

        {(notifications.data ?? []).length === 0 && !notifications.isLoading ? (
          <div className="mt-4 text-sm text-muted-foreground">No notifications yet.</div>
        ) : null}

        {(notifications.data ?? []).length > 0 ? (
          <div className="mt-4 space-y-2">
            {(notifications.data ?? []).map((n: any) => (
              <div
                key={String(n._id)}
                className={`border rounded-lg px-3 py-2 bg-background/60 ${
                  n.isRead ? "opacity-70" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{n.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{n.type}</div>
                </div>
                <div className="text-sm mt-2">{n.message}</div>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
}

