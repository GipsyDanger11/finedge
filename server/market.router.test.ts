import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./services/marketDataService", async () => {
  return {
    getMarketData: async (symbol: string) => ({
      symbol,
      currentPrice: 123.45,
      dayHigh: 130,
      dayLow: 120,
    }),
    updateMultipleMarketPrices: async () => {},
  };
});

describe("market.getPrice", () => {
  it("uppercases symbol and returns a price payload", async () => {
    const ctx: TrpcContext = {
      user: {
        id: "u1",
        openId: "open",
        name: "User",
        email: "u@example.com",
        loginMethod: "email",
        role: "user",
        bio: null,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { headers: {}, protocol: "https" } as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.market.getPrice({ symbol: "aapl" });
    expect(result).toMatchObject({ symbol: "AAPL", currentPrice: 123.45 });
  });
});

