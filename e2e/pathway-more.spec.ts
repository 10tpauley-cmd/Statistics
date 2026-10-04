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

test('leaving a level mid-way resumes at the same step with its score kept', async ({ page }) => {
  await setup(page);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/#/pathway');
  await page.getByRole('button', { name: /Begin journey/ }).click();
  await expect(page).toHaveURL(/#\/pathway\/play\//);
  const playUrl = page.url();
  await runPathwayLevel(page, { questions: 1 });
  const where = await page.locator('.pw-segbar').getAttribute('aria-label');
  await page.getByRole('button', { name: 'Back to the Pathway' }).click();
  await expect(page.locator('.pw-node-wrap.state-in-progress')).toHaveCount(1);
  await page.reload(); // flushes state to storage
  const rec = await page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem('statlab.learner.v1') ?? '{}');
    return Object.values(st.pathway.levels)[0] as { step: number; run?: { graded: number; scored: number[] } };
  });
  expect(rec.step).toBeGreaterThan(0);
  expect(rec.run?.graded).toBeGreaterThanOrEqual(1);
  expect(rec.run?.scored.length).toBeGreaterThanOrEqual(1);
  await page.goto(playUrl);
  await expect(page.locator('.pw-segbar')).toHaveAttribute('aria-label', where!);
  await runPathwayLevel(page);
  await expect(page.locator('.pw-big-stars')).toBeVisible();
});
