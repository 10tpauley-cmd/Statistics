import { test, expect } from '@playwright/test';
import { setup, seedState } from './helpers';

test('mobile: bottom nav, slide-out menu, no horizontal scroll', async ({ page }) => {
  await setup(page);
  await page.goto('/#/learn');
  await expect(page.getByRole('navigation', { name: 'Quick navigation' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.getByRole('navigation', { name: 'Quick navigation' }).getByText('More').click();
  await expect(page.locator('.sidebar.open')).toBeVisible();
  await page.locator('.sidebar').getByText('Formula sheet').click();
  await expect(page.getByRole('heading', { name: 'Formula sheet' })).toBeVisible();
});

test('mobile: a mastery wall fits the screen on the map and the dashboard', async ({ page, context }) => {
  await setup(page);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/#/pathway');
  await expect(page.locator('.pw-node-wrap').first()).toBeVisible();
  // Every region-1 node done, but no real mastery behind it → the wall holds.
  const nodes = await page.$$eval('.pw-node-wrap[data-node]', (els) => els.map((e) => ({ id: e.getAttribute('data-node')!, cls: e.className })));
  const theme = /theme-(\S+)/.exec(nodes[0].cls)![1];
  const r1 = nodes.filter((n) => n.cls.includes(`theme-${theme}`) && !/enc/.test(n.id)).map((n) => n.id);
  const st = JSON.parse((await page.evaluate(() => localStorage.getItem('statlab.learner.v1')))!);
  for (const id of r1) {
    if (/mini|boss/.test(id)) st.pathway.battles[id] = { best: 0.9, passed: true, t: Date.now(), plays: 1 };
    else st.pathway.levels[id] = { stars: 2, best: 0.8, plays: 1, completedAt: Date.now() };
  }
  st.pathway.introsSeen = ['r1', 'r2'];
  st.pathway.lastVisit = new Date().toISOString().slice(0, 10);
  st.placement = 'skipped';
  await page.close();
  await seedState(context, st);
  const p2 = await context.newPage();
  await setup(p2);
  await p2.goto('/#/pathway');
  await expect(p2.getByText('MASTERY WALL')).toBeVisible();
  await expect(p2.getByRole('button', { name: /^Targeted review/ }).first()).toBeInViewport();
  expect(await p2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await p2.goto('/#/');
  await expect(p2.getByRole('heading', { name: 'Mastery wall ahead' })).toBeVisible();
  expect(await p2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
});
