import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import FinedgeDashboardLayout from "@/components/FinedgeDashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, Zap, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user } = useAuth();
  const portfolios = trpc.portfolio.list.useQuery();
  const marketSummary = trpc.ai.getMarketSummary.useQuery();

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
    <FinedgeDashboardLayout>
      <motion.div
        className="space-y-8"
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
            <Card className="card-elegant p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Total Assets</p>
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
            <Card className="card-elegant p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Total Value
                  </p>
                  <p className="text-3xl font-bold">$0.00</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    +2.5% today
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </Card>

            {/* Gain/Loss */}
            <Card className="card-elegant p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Total Gain</p>
                  <p className="text-3xl font-bold">$0.00</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    0% return
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
              <div className="space-y-4">
                <p className="text-foreground">
                  {typeof marketSummary.data === "string"
                    ? marketSummary.data
                    : JSON.stringify(marketSummary.data)}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="badge-primary">
                    Market Sentiment: Bullish
                  </span>
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
            <Button asChild size="lg">
              <a href="/portfolio">View Portfolio</a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="/trading">Start Trading</a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="/alerts">Set Alerts</a>
            </Button>
          </div>
        </motion.div>

        {/* AI Insights Coming Soon */}
        <motion.div variants={itemVariants}>
          <Card className="card-elegant p-6 border-blue-200 dark:border-blue-900">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold mb-2">AI-Powered Insights</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your first portfolio to receive personalized AI insights,
                  risk analysis, and investment recommendations powered by
                  Mistral AI.
                </p>
                <Button asChild size="sm">
                  <a href="/portfolio">Create Portfolio</a>
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </FinedgeDashboardLayout>
  );
}
