# Database

Prisma (`packages/db/prisma/schema.prisma`). **SQLite by default** for zero-dependency local
dev (a single `dev.db` file — no server, works on Windows with only Node). The schema is
**portable**: it uses `String` fields instead of native enums, and JSON-encoded `String`
fields instead of the `Json` type / scalar lists, so it is valid on **both SQLite and
PostgreSQL**. To use Postgres in production, change the datasource `provider` to `"postgresql"`
and set a `postgresql://` `DATABASE_URL` — no other schema edits are needed.

Generate + create/sync + seed:

```bash
pnpm db:generate && pnpm db:push && pnpm db:seed
# or simply:  pnpm setup
```

String value sets (e.g. `Role`, `PlanTier`, `JobStatus`, `Platform`, `EditingStyle`) are
documented at the top of the schema and typed in `@clipforge/types`. JSON columns
(`Transcript.segments`, `Clip.hashtags`, `*.meta`, …) are stored as JSON strings and
parsed in the app layer.

## Model groups

- **Auth**: `User`, `Account`, `Session`, `VerificationToken`, `ApiKey`.
- **Teams / RBAC**: `Team`, `Membership` (OWNER/ADMIN/MEMBER).
- **Content**: `Project`, `Video` (+ full media metadata), `Clip`, `ClipSeries`,
  `TimelineEvent`, `Transcript`, `Subtitle`, `ExportTarget`, `ExportPreset`.
- **Pipeline**: `Job` (per-stage status + `pipelineVersion`).
- **Billing**: `Plan`, `Subscription`, `Invoice`, `Coupon`.
- **Credits**: `CreditWallet`, `CreditTransaction` (topup/usage/refund/allocation).
- **Analytics**: `UsageRecord` (processing time, cpu/gpu, minutes, words, clips, cost, storage).
- **AI**: `AiModel` (registry), `AiProfile` (learned per-user preferences).
- **Ops**: `Notification`, `AuditLog`.

## ClipForge-specific fields

`Clip.qualityScore`, `Clip.viralityScore`, `Clip.hookScore`, `Clip.reasoning` (+
`reasoningEdited`), `Clip.editingStyle`, `Clip.seriesPart`, and `ClipSeries` implement the
differentiators (quality scoring, editable reasoning, editing styles, clip series). `AiProfile`
stores learned editing preferences; `TimelineEvent` powers the insight timeline.

## Seed data

Plans (Free/Pro/Business/Enterprise), export presets (TikTok/Reels/Shorts/…/Podcast), the AI
model registry, and a demo user (`demo@clipforge.local` / `password123`) with a team + wallet.
