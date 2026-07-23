# Contributing to ClipForge

Thanks for your interest in improving ClipForge! This guide covers how to get set up,
our conventions, and how to submit changes.

## Code of Conduct

Be respectful and constructive. Harassment or discrimination of any kind is not tolerated.

## Development setup

See the [Quick start](README.md#quick-start) in the README. In short:

```bash
pnpm install
cp .env.example .env
docker compose -f infra/docker-compose.yml up -d postgres redis minio
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm dev
```

Python AI service:

```bash
cd services/ai
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest
```

## Project conventions

- **Interface-first.** Every external dependency (storage, AI model, cache, queue) must be
  wrapped behind an interface in `packages/core` (TS) or `app/ports` (Python). Never call a
  vendor SDK directly from business logic.
- **Plugins over edits.** New AI stages, storage backends, export providers, subtitle
  styles, and thumbnail generators are added as *plugins* — do not modify the core to add one.
- **No `console.log`.** Use the structured logger (Pino / structlog).
- **Feature flags.** Gate optional/experimental functionality behind a flag in
  `packages/core/flags` and document it in `.env.example`.
- **Typed everywhere.** No `any` in new TypeScript; full type hints in new Python.

## Branch & commit conventions

- Branch names: `feat/<slug>`, `fix/<slug>`, `docs/<slug>`, `chore/<slug>`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/):
  `feat(api): add credit wallet top-up endpoint`.

## Tests

- TypeScript: `pnpm test` (Jest + Supertest, Playwright for web e2e).
- Python: `pytest` in `services/ai`.
- CI must be green before a PR is merged.

## Pull requests

1. Fork & branch from `main`.
2. Keep PRs focused and small where possible.
3. Fill out the PR template.
4. Ensure `pnpm lint && pnpm typecheck && pnpm test` pass.
5. Update docs and `CHANGELOG.md` (Unreleased section) for user-facing changes.

## Reporting bugs / requesting features

Use the issue templates under `.github/ISSUE_TEMPLATE`.
