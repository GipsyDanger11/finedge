/**
 * Mistral AI Service for Financial Insights
 * Handles all AI-powered financial analysis and recommendations
 */

import { invokeLLM } from "../_core/llm";

export interface PortfolioData {
  symbol: string;
  quantity: number;
  currentPrice: number;
  averageCost: number;
  gainLoss: number;
  gainLossPercentage: number;
}

export interface AIInsightResponse {
  riskLevel: "low" | "medium" | "high";
  advice: string;
  diversificationScore: number;
  alerts: string[];
  recommendations: string[];
}

export interface RiskAnalysisResponse {
  overallRisk: "low" | "medium" | "high";
  riskFactors: string[];
  concentration: number;
  volatilityEstimate: string;
  suggestions: string[];
}

export interface MarketSummaryResponse {
  summary: string;
  topMovers: Array<{ symbol: string; change: string }>;
  marketSentiment: "bullish" | "neutral" | "bearish";
  keyInsights: string[];
}

/**
 * Get AI-powered portfolio insights and recommendations
 */
export async function getAIInsights(
  portfolio: PortfolioData[],
  totalValue: number,
  totalGain: number
): Promise<AIInsightResponse> {
  const portfolioSummary = portfolio
    .map((p) => `${p.symbol}: ${p.quantity} units @ $${p.currentPrice} (Gain: ${p.gainLossPercentage}%)`)
    .join("\n");

  const prompt = `Act as a financial advisor for investors. Analyze the following portfolio:

Portfolio Holdings:
${portfolioSummary}

Total Portfolio Value: $${totalValue}
Total Gain/Loss: $${totalGain}

Provide a detailed analysis including:
1. Overall risk level (Low/Medium/High)
2. Key investment advice
3. Diversification score (0-100)
4. Critical alerts or warnings
5. Specific recommendations for improvement

Return your response as a valid JSON object with these exact fields:
{
  "riskLevel": "low|medium|high",
  "advice": "string",
  "diversificationScore": number,
  "alerts": ["string"],
  "recommendations": ["string"]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert financial advisor. Always respond with valid JSON only, no additional text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "portfolio_insights",
          strict: true,
          schema: {
            type: "object",
            properties: {
              riskLevel: {
                type: "string",
                enum: ["low", "medium", "high"],
              },
              advice: { type: "string" },
              diversificationScore: { type: "number" },
              alerts: { type: "array", items: { type: "string" } },
              recommendations: { type: "array", items: { type: "string" } },
            },
            required: ["riskLevel", "advice", "diversificationScore", "alerts", "recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content) throw new Error("No response from Mistral API");
    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr) as AIInsightResponse;
    return parsed;
  } catch (error) {
    console.error("[Mistral] Error getting portfolio insights:", error);
    throw new Error("Failed to generate AI insights");
  }
}

/**
 * Get detailed risk analysis for a portfolio
 */
export async function getRiskAnalysis(portfolio: PortfolioData[]): Promise<RiskAnalysisResponse> {
  const portfolioSummary = portfolio
    .map((p) => `${p.symbol}: ${p.quantity} units (${((p.quantity * p.currentPrice) / 10000) * 100}% of portfolio)`)
    .join("\n");

  const prompt = `As a financial risk analyst, evaluate the following portfolio for risk factors:

Holdings:
${portfolioSummary}

Analyze:
1. Overall risk level
2. Specific risk factors present
3. Concentration risk (0-100 scale)
4. Estimated volatility
5. Risk mitigation suggestions

Return as JSON:
{
  "overallRisk": "low|medium|high",
  "riskFactors": ["string"],
  "concentration": number,
  "volatilityEstimate": "string",
  "suggestions": ["string"]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a financial risk analyst. Respond only with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "risk_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              overallRisk: {
                type: "string",
                enum: ["low", "medium", "high"],
              },
              riskFactors: { type: "array", items: { type: "string" } },
              concentration: { type: "number" },
              volatilityEstimate: { type: "string" },
              suggestions: { type: "array", items: { type: "string" } },
            },
            required: ["overallRisk", "riskFactors", "concentration", "volatilityEstimate", "suggestions"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content) throw new Error("No response from Mistral API");
    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr) as RiskAnalysisResponse;
    return parsed;
  } catch (error) {
    console.error("[Mistral] Error analyzing risk:", error);
    throw new Error("Failed to analyze portfolio risk");
  }
}

/**
 * Get general market summary and insights
 */
export async function getMarketSummary(): Promise<MarketSummaryResponse> {
  const prompt = `Provide a brief market summary for today including:
1. Overall market sentiment
2. Top 3 moving assets/sectors
3. Key economic factors affecting markets
4. Brief outlook

Return as JSON:
{
  "summary": "string",
  "topMovers": [{"symbol": "string", "change": "string"}],
  "marketSentiment": "bullish|neutral|bearish",
  "keyInsights": ["string"]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a market analyst. Provide current market insights. Respond only with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "market_summary",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              topMovers: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    symbol: { type: "string" },
                    change: { type: "string" },
                  },
                  required: ["symbol", "change"],
                  additionalProperties: false,
                },
              },
              marketSentiment: {
                type: "string",
                enum: ["bullish", "neutral", "bearish"],
              },
              keyInsights: { type: "array", items: { type: "string" } },
            },
            required: ["summary", "topMovers", "marketSentiment", "keyInsights"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content) throw new Error("No response from Mistral API");
    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr) as MarketSummaryResponse;
    return parsed;
  } catch (error) {
    console.error("[Mistral] Error getting market summary:", error);
    throw new Error("Failed to get market summary");
  }
}

/**
 * Get personalized investment recommendations
 */
export async function getPersonalizedRecommendations(
  portfolio: PortfolioData[],
  riskTolerance: "low" | "medium" | "high"
): Promise<string[]> {
  const portfolioSummary = portfolio.map((p) => `${p.symbol}: ${p.quantity} units`).join(", ");

  const prompt = `Based on this portfolio (${portfolioSummary}) and a ${riskTolerance} risk tolerance, provide 3-5 specific investment recommendations.

Return as JSON:
{
  "recommendations": ["string"]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an investment advisor. Provide personalized recommendations. Respond only with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "recommendations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendations: { type: "array", items: { type: "string" } },
            },
            required: ["recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content) throw new Error("No response from Mistral API");
    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr) as { recommendations: string[] };
    return parsed.recommendations;
  } catch (error) {
    console.error("[Mistral] Error getting recommendations:", error);
    throw new Error("Failed to get recommendations");
  }
}
