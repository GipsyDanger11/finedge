import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, ReceiptText, Save, Trash2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo, useState } from "react";

export default function Transactions() {
  const utils = trpc.useUtils();
  const portfolios = trpc.portfolio.list.useQuery();
  const [portfolioId, setPortfolioId] = useState<string>("");
  const [createSymbol, setCreateSymbol] = useState("");
  const [createType, setCreateType] = useState<"buy" | "sell" | "transfer">("buy");
  const [createQty, setCreateQty] = useState("1");
  const [createPrice, setCreatePrice] = useState("100");
  const [createFee, setCreateFee] = useState("0");
  const [createNotes, setCreateNotes] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSymbol, setEditSymbol] = useState("");
  const [editType, setEditType] = useState<"buy" | "sell" | "transfer">("buy");
  const [editQty, setEditQty] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editFee, setEditFee] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const selectedId = useMemo(() => {
    if (portfolioId) return portfolioId;
    const first = portfolios.data?.[0]?._id;
    return first ? String(first) : "";
  }, [portfolioId, portfolios.data]);

  const transactions = trpc.portfolio.getTransactions.useQuery(
    { portfolioId: selectedId, limit: 50 },
    { enabled: Boolean(selectedId) }
  );

  const createTx = trpc.portfolio.addTransaction.useMutation({
    onSuccess: async () => {
      await utils.portfolio.getTransactions.invalidate({ portfolioId: selectedId, limit: 50 });
    },
  });

  const updateTx = trpc.portfolio.updateTransaction.useMutation({
    onSuccess: async () => {
      await utils.portfolio.getTransactions.invalidate({ portfolioId: selectedId, limit: 50 });
    },
  });

  const deleteTx = trpc.portfolio.deleteTransaction.useMutation({
    onSuccess: async () => {
      await utils.portfolio.getTransactions.invalidate({ portfolioId: selectedId, limit: 50 });
    },
  });

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <ReceiptText className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Review recent activity for a portfolio.
        </p>
      </div>

      <Card className="card-elegant p-5 animate-slideInRight">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Portfolio</div>
            <Select
              value={selectedId}
              onValueChange={(v) => setPortfolioId(v)}
              disabled={portfolios.isLoading || !portfolios.data?.length}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select portfolio" />
              </SelectTrigger>
              <SelectContent>
                {(portfolios.data ?? []).map((p: any) => (
                  <SelectItem key={String(p._id)} value={String(p._id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="card-elegant p-5 animate-slideInRight" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="font-medium">Add transaction</div>
          {createTx.isPending ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mt-4">
          <div className="md:col-span-2">
            <div className="text-xs text-muted-foreground mb-1">Symbol</div>
            <Input
              value={createSymbol}
              onChange={(e) => setCreateSymbol(e.target.value.toUpperCase())}
              placeholder="AAPL"
              disabled={!selectedId || createTx.isPending}
            />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Type</div>
            <Select
              value={createType}
              onValueChange={(v) => setCreateType(v as any)}
              disabled={!selectedId || createTx.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Qty</div>
            <Input
              value={createQty}
              onChange={(e) => setCreateQty(e.target.value)}
              inputMode="decimal"
              disabled={!selectedId || createTx.isPending}
            />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Price</div>
            <Input
              value={createPrice}
              onChange={(e) => setCreatePrice(e.target.value)}
              inputMode="decimal"
              disabled={!selectedId || createTx.isPending}
            />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Fee</div>
            <Input
              value={createFee}
              onChange={(e) => setCreateFee(e.target.value)}
              inputMode="decimal"
              disabled={!selectedId || createTx.isPending}
            />
          </div>
          <div className="md:col-span-6">
            <div className="text-xs text-muted-foreground mb-1">Notes</div>
            <Input
              value={createNotes}
              onChange={(e) => setCreateNotes(e.target.value)}
              placeholder="Optional"
              disabled={!selectedId || createTx.isPending}
            />
          </div>
        </div>

        <div className="pt-4">
          <Button
            aria-label="Add transaction"
            disabled={
              !selectedId ||
              createTx.isPending ||
              createSymbol.trim().length === 0 ||
              !(Number(createQty) > 0) ||
              !(Number(createPrice) > 0) ||
              !(Number(createFee) >= 0)
            }
            onClick={() => {
              createTx.mutate({
                portfolioId: selectedId,
                symbol: createSymbol.trim(),
                type: createType,
                quantity: Number(createQty),
                price: Number(createPrice),
                fee: Number(createFee),
                notes: createNotes.trim() || undefined,
              });
              setCreateNotes("");
            }}
          >
            <Save className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </Card>

      <Card className="card-elegant p-5 animate-slideInRight" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center justify-between">
          <div className="font-medium">Recent transactions</div>
          {(transactions.isLoading || portfolios.isLoading) && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {!selectedId && !portfolios.isLoading ? (
          <div className="mt-6 text-sm text-muted-foreground">
            Create a portfolio to start tracking transactions.
          </div>
        ) : null}

        {transactions.error ? (
          <div className="mt-6 text-sm text-destructive">
            Failed to load transactions.
          </div>
        ) : null}

        {transactions.data && transactions.data.length === 0 ? (
          <div className="mt-6 text-sm text-muted-foreground">
            No transactions yet.
          </div>
        ) : null}

        {transactions.data && transactions.data.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Symbol</th>
                  <th className="py-2 pr-4 font-medium">Qty</th>
                  <th className="py-2 pr-4 font-medium">Price</th>
                  <th className="py-2 pr-0 font-medium">Total</th>
                  <th className="py-2 pl-4 pr-0 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.data.map((t: any) => (
                  <tr key={String(t._id)} className="border-b last:border-b-0">
                    <td className="py-2 pr-4">
                      {t.transactionDate
                        ? new Date(t.transactionDate).toLocaleString()
                        : "-"}
                    </td>
                    {editingId === String(t._id) ? (
                      <>
                        <td className="py-2 pr-4">
                          <Select value={editType} onValueChange={(v) => setEditType(v as any)}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="buy">Buy</SelectItem>
                              <SelectItem value="sell">Sell</SelectItem>
                              <SelectItem value="transfer">Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2 pr-4">
                          <Input className="h-8" value={editSymbol} onChange={(e) => setEditSymbol(e.target.value.toUpperCase())} />
                        </td>
                        <td className="py-2 pr-4">
                          <Input className="h-8" value={editQty} onChange={(e) => setEditQty(e.target.value)} />
                        </td>
                        <td className="py-2 pr-4">
                          <Input className="h-8" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                        </td>
                        <td className="py-2 pr-0">
                          <Input className="h-8" value={editFee} onChange={(e) => setEditFee(e.target.value)} />
                        </td>
                        <td className="py-2 pl-4 pr-0 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              size="sm"
                              aria-label="Save transaction"
                              disabled={updateTx.isPending}
                              onClick={() => {
                                updateTx.mutate({
                                  transactionId: String(t._id),
                                  portfolioId: selectedId,
                                  symbol: editSymbol.trim(),
                                  type: editType,
                                  quantity: Number(editQty),
                                  price: Number(editPrice),
                                  fee: Number(editFee),
                                  notes: editNotes.trim() || undefined,
                                });
                                setEditingId(null);
                              }}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label="Cancel editing"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 pr-4 capitalize">{t.type}</td>
                        <td className="py-2 pr-4 font-medium">{t.symbol}</td>
                        <td className="py-2 pr-4">{Number(t.quantity ?? 0)}</td>
                        <td className="py-2 pr-4">
                          {Number(t.price ?? 0).toLocaleString(undefined, {
                            style: "currency",
                            currency: "USD",
                          })}
                        </td>
                        <td className="py-2 pr-0">
                          {Number(t.totalAmount ?? 0).toLocaleString(undefined, {
                            style: "currency",
                            currency: "USD",
                          })}
                        </td>
                        <td className="py-2 pl-4 pr-0 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label="Edit transaction"
                              onClick={() => {
                                setEditingId(String(t._id));
                                setEditSymbol(String(t.symbol ?? ""));
                                setEditType((t.type ?? "buy") as any);
                                setEditQty(String(t.quantity ?? ""));
                                setEditPrice(String(t.price ?? ""));
                                setEditFee(String(t.fee ?? 0));
                                setEditNotes(String(t.notes ?? ""));
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label="Delete transaction"
                              disabled={deleteTx.isPending}
                              onClick={() => {
                                deleteTx.mutate({
                                  portfolioId: selectedId,
                                  transactionId: String(t._id),
                                });
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

