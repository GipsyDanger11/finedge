import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: Awaited<ReturnType<typeof sdk.authenticateRequest>> | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: TrpcContext["user"] = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // If authentication fails in production, don't crash the whole app.
    // This allows guest access to work via the trpc middleware.
    console.warn("[Context] Authentication failed, continuing as guest:", (error as any)?.message);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
