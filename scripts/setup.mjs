#!/usr/bin/env node
/**
 * Cross-platform first-run setup (Windows / macOS / Linux) — no Docker, no bash.
 *   1. Create .env from .env.example if missing
 *   2. Generate the Prisma client
 *   3. Create/sync the SQLite database (prisma db push)
 *   4. Seed plans, presets, models, and a demo user
 *
 * Usage:  pnpm setup   (run once after `pnpm install`)
 */
import { execSync } from 'node:child_process';
import { existsSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd) => {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: root, shell: true });
};

// 1. .env
const envPath = join(root, '.env');
if (!existsSync(envPath)) {
  copyFileSync(join(root, '.env.example'), envPath);
  console.log('✓ created .env from .env.example');
} else {
  console.log('• .env already exists — leaving it as is');
}

// 2-4. Database
run('pnpm db:generate');
run('pnpm db:push');
run('pnpm db:seed');

console.log('\n✅ Setup complete. Start everything with:  pnpm dev');
console.log('   Web  → http://localhost:3000');
console.log('   API  → http://localhost:4000/api/docs');
console.log('   Demo → demo@clipforge.local / password123\n');
