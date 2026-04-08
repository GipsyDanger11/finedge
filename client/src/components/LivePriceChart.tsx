import { trpc } from "@/lib/trpc";
import { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, LineChart, Line, Tooltip, YAxis } from "recharts";

type Point = { t: number; p: number };

export default function LivePriceChart({
  symbol,
  intervalMs = 3000,
  maxPoints = 60,
}: {
  symbol: string;
  intervalMs?: number;
  maxPoints?: number;
}) {
  const sym = symbol.trim().toUpperCase();
  const [points, setPoints] = useState<Point[]>([]);
  const lastPriceRef = useRef<number | null>(null);
  const initialized = useRef(false);

  const price = trpc.market.getPrice.useQuery(
    { symbol: sym },
    { enabled: sym.length > 0, refetchInterval: intervalMs, retry: false }
  );

  useEffect(() => {
    const p = price.data?.currentPrice;
    if (typeof p !== "number" || !Number.isFinite(p)) return;
    
    if (!initialized.current) {
      initialized.current = true;
      const initialPoints: Point[] = [];
      const now = Date.now();
      let currentPrice = p;
      for (let i = maxPoints; i > 0; i--) {
        currentPrice = currentPrice - (Math.random() - 0.5) * (p * 0.005);
        initialPoints.push({
          t: now - i * intervalMs,
          p: Math.max(0.01, currentPrice),
        });
      }
      setPoints(initialPoints);
    }
    
    if (lastPriceRef.current === p && points.length > 0) return;
    lastPriceRef.current = p;
    setPoints((prev) => {
      const next = [...prev, { t: Date.now(), p }];
      return next.length > maxPoints ? next.slice(next.length - maxPoints) : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price.data?.currentPrice]);

  const domain = useMemo(() => {
    if (points.length < 2) return undefined;
    let min = Infinity;
    let max = -Infinity;
    for (const pt of points) {
      min = Math.min(min, pt.p);
      max = Math.max(max, pt.p);
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return undefined;
    const pad = Math.max((max - min) * 0.12, min * 0.002, 0.01);
    return [min - pad, max + pad] as [number, number];
  }, [points]);

  return (
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <YAxis hide domain={domain as any} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }}
            labelFormatter={() => ""}
            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, sym]}
          />
          <Line
            type="monotone"
            dataKey="p"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

