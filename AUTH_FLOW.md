## Authentication flow

### 1) Start sign-in (client)
- The client generates an OAuth portal URL using `getLoginUrl()` in `client/src/const.ts`.
- The URL includes:
  - `appId` (from `VITE_APP_ID`)
  - `redirectUri` (computed as `window.location.origin + "/api/oauth/callback"`)
  - `state` (base64 of the redirectUri)

### 2) OAuth callback (server)
- OAuth completes and redirects the user to `/api/oauth/callback`.
- The server exchanges `code` for an access token via the OAuth service and then issues a **session cookie** (`COOKIE_NAME`).

### 3) Session usage (client ↔ server)
- The browser stores the cookie; all tRPC calls include `credentials: "include"`.
- The client reads the current user using `trpc.auth.me`.
- If tRPC returns `UNAUTHED_ERR_MSG`, the client redirects to the login URL (see `client/src/main.tsx`).

### 4) Logout
- The client calls `trpc.auth.logout`.
- The server clears the session cookie.

