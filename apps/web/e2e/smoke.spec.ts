import { test, expect } from '@playwright/test';

test('landing page shows the value proposition', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('What makes ClipForge different')).toBeVisible();
  await expect(page.getByText('AI Story Detection')).toBeVisible();
});

test('pricing page lists tiers', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByText('Pro')).toBeVisible();
  await expect(page.getByText('Enterprise')).toBeVisible();
});

test('login page renders providers', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('Welcome back')).toBeVisible();
  await expect(page.getByRole('button', { name: /Google/ })).toBeVisible();
});
