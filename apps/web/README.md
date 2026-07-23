# ClipForge Web (Next.js 14)

App Router · TypeScript · TailwindCSS · Framer Motion · Auth.js · next-intl (en/id/ja/zh).

## Run

```bash
pnpm --filter @clipforge/web dev     # http://localhost:3000
```

## Structure

```
src/auth.ts                 Auth.js config (credentials + Google + GitHub)
src/middleware.ts           route protection
src/i18n/                   next-intl config + message catalogs (en/id/ja/zh)
src/lib/                    SDK client + helpers
src/hooks/useJobProgress    WebSocket realtime job progress (replaces polling)
src/components/             Nav, ClipCard (quality score + editable reasoning), InsightTimeline
src/app/                    landing, pricing, login
src/app/(app)/              authenticated shell: dashboard, workspace, upload, billing, admin, settings
```

The **workspace** page showcases the differentiators: the insight timeline, per-clip quality
scores, editable AI reasoning, and side-by-side clip comparison.

## Test

```bash
pnpm --filter @clipforge/web test    # Playwright smoke tests
```
