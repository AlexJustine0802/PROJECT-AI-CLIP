/**
 * ClipForge seed: plans, export presets, AI model registry, and a demo team + user.
 * Idempotent — safe to run multiple times.
 */
import { PrismaClient, PlanTier, Platform, AspectRatio, Resolution, AiModelKind } from '@prisma/client';
import { createHash } from 'node:crypto';

const prisma = new PrismaClient();

async function seedPlans() {
  const plans = [
    { tier: PlanTier.FREE, name: 'Free', priceMonthly: 0, monthlyCredits: 30, maxUploadMb: 300, maxExportRes: Resolution.P1080 },
    { tier: PlanTier.PRO, name: 'Pro', priceMonthly: 1900, monthlyCredits: 500, maxUploadMb: 2000, maxExportRes: Resolution.P1440 },
    { tier: PlanTier.BUSINESS, name: 'Business', priceMonthly: 4900, monthlyCredits: 2000, maxUploadMb: 8000, maxExportRes: Resolution.P2160 },
    { tier: PlanTier.ENTERPRISE, name: 'Enterprise', priceMonthly: 0, monthlyCredits: 100000, maxUploadMb: 50000, maxExportRes: Resolution.P2160 },
  ];
  for (const p of plans) {
    await prisma.plan.upsert({ where: { tier: p.tier }, update: p, create: p });
  }
  console.log(`✓ seeded ${plans.length} plans`);
}

async function seedExportPresets() {
  const presets = [
    { key: 'tiktok', name: 'TikTok', platform: Platform.TIKTOK, aspectRatio: AspectRatio.R_9_16, resolution: Resolution.P1080, fps: 30, maxDuration: 180 },
    { key: 'instagram_reels', name: 'Instagram Reels', platform: Platform.INSTAGRAM, aspectRatio: AspectRatio.R_9_16, resolution: Resolution.P1080, fps: 30, maxDuration: 90 },
    { key: 'youtube_shorts', name: 'YouTube Shorts', platform: Platform.YOUTUBE_SHORTS, aspectRatio: AspectRatio.R_9_16, resolution: Resolution.P1080, fps: 30, maxDuration: 60 },
    { key: 'facebook_reels', name: 'Facebook Reels', platform: Platform.FACEBOOK, aspectRatio: AspectRatio.R_9_16, resolution: Resolution.P1080, fps: 30, maxDuration: 90 },
    { key: 'x_post', name: 'X (Twitter)', platform: Platform.X, aspectRatio: AspectRatio.R_16_9, resolution: Resolution.P1080, fps: 30, maxDuration: 140 },
    { key: 'linkedin', name: 'LinkedIn', platform: Platform.LINKEDIN, aspectRatio: AspectRatio.R_1_1, resolution: Resolution.P1080, fps: 30, maxDuration: 600 },
    { key: 'podcast', name: 'Podcast Clip', platform: Platform.PODCAST, aspectRatio: AspectRatio.R_1_1, resolution: Resolution.P1080, fps: 30, maxDuration: 300 },
    { key: 'custom', name: 'Custom', platform: Platform.CUSTOM, aspectRatio: AspectRatio.R_9_16, resolution: Resolution.P1080, fps: 30 },
  ];
  for (const p of presets) {
    await prisma.exportPreset.upsert({ where: { key: p.key }, update: p, create: p });
  }
  console.log(`✓ seeded ${presets.length} export presets`);
}

async function seedModels() {
  const models = [
    { key: 'whisper-tiny', name: 'Whisper Tiny', kind: AiModelKind.TRANSCRIPTION, provider: 'whisper', costPerMinuteUsd: 0.0 },
    { key: 'whisper-base', name: 'Whisper Base', kind: AiModelKind.TRANSCRIPTION, provider: 'whisper', costPerMinuteUsd: 0.0 },
    { key: 'whisper-small', name: 'Whisper Small', kind: AiModelKind.TRANSCRIPTION, provider: 'whisper', isDefault: true, costPerMinuteUsd: 0.0 },
    { key: 'whisper-medium', name: 'Whisper Medium', kind: AiModelKind.TRANSCRIPTION, provider: 'whisper', costPerMinuteUsd: 0.0 },
    { key: 'whisper-large-v3', name: 'Whisper Large v3', kind: AiModelKind.TRANSCRIPTION, provider: 'whisper', costPerMinuteUsd: 0.0 },
    { key: 'deepgram-nova', name: 'Deepgram Nova', kind: AiModelKind.TRANSCRIPTION, provider: 'deepgram', experimental: true, costPerMinuteUsd: 0.0043 },
    { key: 'assemblyai', name: 'AssemblyAI', kind: AiModelKind.TRANSCRIPTION, provider: 'assemblyai', experimental: true, costPerMinuteUsd: 0.0037 },
    { key: 'gpt-4o-mini', name: 'GPT-4o mini', kind: AiModelKind.LLM, provider: 'openai', costPer1kTokensUsd: 0.00015 },
    { key: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', kind: AiModelKind.LLM, provider: 'anthropic', isDefault: true, costPer1kTokensUsd: 0.0008 },
    { key: 'gemini-1-5-flash', name: 'Gemini 1.5 Flash', kind: AiModelKind.LLM, provider: 'google', costPer1kTokensUsd: 0.00007 },
    { key: 'qwen2-7b', name: 'Qwen2 7B (local)', kind: AiModelKind.LLM, provider: 'local', experimental: true },
  ];
  for (const m of models) {
    await prisma.aiModel.upsert({ where: { key: m.key }, update: m, create: m });
  }
  console.log(`✓ seeded ${models.length} AI models`);
}

async function seedDemo() {
  const email = 'demo@clipforge.local';
  // sha256 of "password123" as a placeholder; the API uses bcrypt in production.
  const passwordHash = createHash('sha256').update('password123').digest('hex');
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: 'Demo Creator', passwordHash, emailVerified: new Date(), locale: 'en' },
  });
  const team = await prisma.team.upsert({
    where: { slug: 'demo-team' },
    update: {},
    create: { name: 'Demo Team', slug: 'demo-team' },
  });
  await prisma.membership.upsert({
    where: { userId_teamId: { userId: user.id, teamId: team.id } },
    update: { role: 'OWNER' },
    create: { userId: user.id, teamId: team.id, role: 'OWNER' },
  });
  const freePlan = await prisma.plan.findUnique({ where: { tier: PlanTier.FREE } });
  if (freePlan) {
    await prisma.subscription.upsert({
      where: { teamId: team.id },
      update: {},
      create: { teamId: team.id, planId: freePlan.id, status: 'ACTIVE' },
    });
  }
  await prisma.creditWallet.upsert({
    where: { teamId: team.id },
    update: {},
    create: { teamId: team.id, balance: 30 },
  });
  await prisma.aiProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, preferredStyle: 'AUTO' },
  });
  console.log(`✓ seeded demo user (${email} / password123) + team`);
}

async function main() {
  await seedPlans();
  await seedExportPresets();
  await seedModels();
  await seedDemo();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
