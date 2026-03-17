## FINEDGE

AI-powered finance dashboard: portfolios, paper trading, social discovery, alerts, and market + analytics views.

### Tech stack
- **Client**: Vite + React + Wouter + TanStack Query + Tailwind
- **Server**: Express + tRPC + Mongoose (MongoDB)
- **AI**: Mistral integration (server-side)

### Prerequisites
- **Node.js**: this repo currently uses tooling that expects a newer Node 20 patch (some packages warn on 20.12.x). If you hit engine warnings, upgrade Node to a newer 20.x or 22.x.
- **MongoDB**: set `MONGODB_URI` (or `DATABASE_URL` if using the Drizzle MySQL schema/migrations)

### Setup
Install dependencies:

```bash
npm install
```

Run dev (server + Vite handled by server gateway):

```bash
npm run dev
```

Typecheck:

```bash
npm run check
```

Tests:

```bash
npm test
```

### Environment variables
Client (`VITE_*`):
- `VITE_OAUTH_PORTAL_URL`
- `VITE_APP_ID`

Server:
- `MONGODB_URI` (or `DATABASE_URL` depending on which DB path you use)
- OAuth/session variables used by `server/_core/env.ts`

### Key routes
- **Landing**: `/`
- **Login/logout**: `/login`, `/logout`
- **App**: `/dashboard`, `/portfolio`, `/transactions`, `/trading`, `/market`, `/analytics`, `/alerts`, `/community`
- **Sharing**: `/share/:portfolioId` (public, read-only)

### Notes
- `postcss.config.js` exists in-repo to prevent Vite/Vitest from accidentally picking up a machine-global PostCSS config from a parent directory.

