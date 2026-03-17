## FINEDGE architecture (current)

### Runtime
- **Client**: Vite + React 19 + Wouter routing (`client/`)
- **Server**: Express + tRPC (`server/`)
- **Shared**: runtime/shared constants + types (`shared/`)

### API shape
- **Gateway**: `/api/trpc` for tRPC (client uses `credentials: "include"`).
- **Routers** (see `server/routers.ts`):
  - `auth.*`: `me`, `logout`
  - `portfolio.*`: portfolios, assets, transactions
  - `ai.*`: Mistral-driven insights + cached summaries
  - `social.*`: profile + follow graph

### Data
- **Primary persistence**: MongoDB via Mongoose (`server/models/index.ts`, `server/db.ts`)
- **Relational schema (planned/optional)**: Drizzle schema lives in `drizzle/schema.ts` and is used for migrations via `drizzle-kit` when `DATABASE_URL` is configured.

### Key frontend conventions
- **Layouts**: `client/src/components/DashboardLayout.tsx` is the global authed shell
- **Pages**: `client/src/pages/*`
- **API calls**: `client/src/lib/trpc.ts` + React Query

