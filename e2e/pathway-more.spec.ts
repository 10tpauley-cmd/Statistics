import { test, expect } from '@playwright/test';
import { setup, runPathwayLevel, seedState } from './helpers';

test('quick review from the map runs through the real engine and returns to the Pathway', async ({ page }) => {
  await setup(page);
  await page.goto('/#/pathway/review/std-dev');
  await runPathwayLevel(page);
  await expect(page.getByRole('heading', { name: 'Review complete!' })).toBeVisible();
  // Answers were recorded by the shared engine: the Progress page now has data.
  await page.goto('/#/progress');
  await expect(page.getByRole('heading', { name: 'Progress' })).toBeVisible();
  await expect(page.getByText('🗺️ The Pathway')).toBeVisible();
});

test('returning the next day shows a welcome-back card that continues the journey', async ({ page, context }) => {
  const first = await firstLevelId(page);
  await page.close(); // its in-memory state would be flushed over the seed when hidden
  await seedState(context, {
    placement: 'skipped', name: 'Ana',
    pathway: { levels: { [first]: { stars: 3, best: 1, plays: 1, completedAt: Date.now() - 86400000 } }, battles: {}, encounters: {}, introsSeen: ['r1'], ceremonies: [], lastVisit: '2020-01-01', quickReviews: {} },
  });
  const p2 = await context.newPage();
  await setup(p2);
  await p2.goto('/#/pathway');
  await expect(p2.getByRole('dialog', { name: /Welcome back/ })).toBeVisible();
  await expect(p2.getByText(/Your journey continues at/)).toBeVisible();
  await p2.getByRole('button', { name: /Continue Pathway/ }).click();
  await expect(p2).toHaveURL(/#\/pathway\/play\//);
});

async function firstLevelId(page: import('@playwright/test').Page) {
  await setup(page);
  await page.goto('/#/pathway');
  const id = await page.locator('.pw-node-wrap.kind-level').first().getAttribute('data-node');
  return id!;
}
