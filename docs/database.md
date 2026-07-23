# Database

PostgreSQL via Prisma (`packages/db/prisma/schema.prisma`). Generate + migrate + seed:

```bash
pnpm db:generate && pnpm db:migrate && pnpm db:seed
```

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
