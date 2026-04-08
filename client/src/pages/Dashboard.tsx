import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";

export default function Dashboard() {
  const { user } = useAuth();
  const portfolios = trpc.portfolio.list.useQuery();
  const marketSummary = trpc.ai.getMarketSummary.useQuery();
  const [, setLocation] = useLocation();
  const [portfolioId, setPortfolioId] = useState<string>("");
  const [riskTolerance, setRiskTolerance] = useState<"low" | "medium" | "high">(
    "medium"
  );

  const selectedPortfolioId = useMemo(() => {
    if (portfolioId) return portfolioId;
    const first = portfolios.data?.[0]?._id;
    return first ? String(first) : "";
  }, [portfolioId, portfolios.data]);

  const aiInsights = trpc.ai.getInsights.useQuery(
    { portfolioId: selectedPortfolioId },
    { enabled: Boolean(selectedPortfolioId) }
  );
  // NOTE: typed as `any` to avoid overly-narrow inference from AppRouter in some TS setups.
  const aiRisk = trpc.ai.getRiskAnalysis.useQuery(
    { portfolioId: selectedPortfolioId },
    { enabled: Boolean(selectedPortfolioId) }
  ) as any;
  const aiRecs = trpc.ai.getRecommendations.useQuery(
    { portfolioId: selectedPortfolioId, riskTolerance },
    { enabled: Boolean(selectedPortfolioId) }
  ) as any;

  const stats = trpc.portfolio.getStats.useQuery(
    { portfolioId: selectedPortfolioId },
    { enabled: Boolean(selectedPortfolioId) }
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - FINEDGE</title>
        <meta name="description" content="View your portfolio overview, market summary, and AI insights." />
      </Helmet>
      <motion.div
      className="space-y-8 animate-fadeInUp"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants}>
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Welcome back, {user?.name || "Investor"}
          </h1>
          <p className="text-muted-foreground">
            Monitor your portfolio and get AI-powered insights
          </p>
        </div>
      </motion.div>

      {/* Portfolio Overview */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Assets */}
          <Card className="card-elegant p-6 animate-slideInRight">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Portfolios</p>
                <p className="text-3xl font-bold">
                  {portfolios.data?.length || 0}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Zap className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          {/* Portfolio Value */}
          <Card className="card-elegant p-6 animate-slideInRight" style={{ animationDelay: "100ms" }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Value</p>
                <p className="text-3xl font-bold">
                  {stats.data ? `$${stats.data.totalValue.toFixed(2)}` : "$0.00"}
                </p>
                <p className="text-xs mt-2" suppressHydrationWarning>
                  <span className={stats.data?.gainPercentage && stats.data.gainPercentage < 0 ? "metric-negative" : "metric-positive"}>
                    {stats.data?.gainPercentage ? `${stats.data.gainPercentage > 0 ? '+' : ''}${stats.data.gainPercentage.toFixed(2)}%` : "0.00%"} return
                  </span>
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          {/* Gain/Loss */}
          <Card className="card-elegant p-6 animate-slideInRight" style={{ animationDelay: "200ms" }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Gain</p>
                <p className="text-3xl font-bold">
                  {stats.data ? `$${stats.data.totalGain.toFixed(2)}` : "$0.00"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  All time
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Market Summary */}
      <motion.div variants={itemVariants}>
        <Card className="card-elegant p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Market Summary</h2>
            {marketSummary.isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {marketSummary.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : marketSummary.data ? (
            <div className="space-y-6">
              <p className="text-foreground text-sm leading-relaxed">
                {typeof marketSummary.data === "string"
                  ? marketSummary.data
                  : (marketSummary.data as any).summary}
              </p>

              {typeof marketSummary.data !== "string" && (marketSummary.data as any).keyInsights && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Key Insights</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mt-2">
                    {((marketSummary.data as any).keyInsights || []).map((insight: string, i: number) => (
                      <li key={i}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 flex-wrap pt-2 border-t border-border">
                {typeof marketSummary.data !== "string" && (
                  <span className="badge-primary capitalize">
                    Sentiment: {(marketSummary.data as any).marketSentiment || "neutral"}
                  </span>
                )}
                {typeof marketSummary.data === "string" && (
                  <span className="badge-primary">Market Sentiment: Bullish</span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No market data available</p>
          )}
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <div className="flex gap-4 flex-wrap">
          <Button size="lg" aria-label="View Portfolio" onClick={() => setLocation("/portfolio")}>
            View Portfolio
          </Button>
          <Button variant="outline" aria-label="Start Trading" size="lg" onClick={() => setLocation("/trading")}>
            Start Trading
          </Button>
          <Button variant="outline" aria-label="Settings" size="lg" onClick={() => setLocation("/settings")}>
            Settings
          </Button>
        </div>
      </motion.div>

      {/* AI Insights */}
      <motion.div variants={itemVariants}>
        <Card className="card-elegant p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-bold">AI insights</h3>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-56">
                <Select
                  value={selectedPortfolioId}
                  onValueChange={(v) => setPortfolioId(v)}
                  disabled={!portfolios.data?.length}
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

              <div className="w-40">
                <Select value={riskTolerance} onValueChange={(v) => setRiskTolerance(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Risk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {!selectedPortfolioId ? (
            <div className="mt-6 text-sm text-muted-foreground">
              Create a portfolio to generate AI insights.
              <div className="mt-3">
                <Button size="sm" aria-label="Create portfolio" onClick={() => setLocation("/portfolio")}>
                  Create portfolio
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="p-4 border bg-background/60">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Insights</div>
                  {aiInsights.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : null}
                </div>
                <pre className="mt-3 text-xs whitespace-pre-wrap break-words max-h-64 overflow-auto">
                  {aiInsights.data
                    ? typeof aiInsights.data === "string"
                      ? aiInsights.data
                      : JSON.stringify(aiInsights.data, null, 2)
                    : "—"}
                </pre>
              </Card>

              <Card className="p-4 border bg-background/60">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Risk analysis</div>
                  {aiRisk.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : null}
                </div>
                <pre className="mt-3 text-xs whitespace-pre-wrap break-words max-h-64 overflow-auto">
                  {aiRisk.data
                    ? typeof aiRisk.data === "string"
                      ? aiRisk.data
                      : JSON.stringify(aiRisk.data, null, 2)
                    : "—"}
                </pre>
              </Card>

              <Card className="p-4 border bg-background/60">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Recommendations</div>
                  {aiRecs.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : null}
                </div>
                <pre className="mt-3 text-xs whitespace-pre-wrap break-words max-h-64 overflow-auto">
                  {aiRecs.data
                    ? typeof aiRecs.data === "string"
                      ? aiRecs.data
                      : JSON.stringify(aiRecs.data, null, 2)
                    : "—"}
                </pre>
              </Card>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
    </>
  );
}
