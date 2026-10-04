import { test, expect } from '@playwright/test';
import { setup, runPathwayLevel, answerQuestion, seedState } from './helpers';

test.describe('the pathway', () => {
  test('first visit: region intro → play level 1 → stars → back on the map with level 2 current', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await setup(page);
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/#/pathway');
    await expect(page.getByRole('dialog', { name: /Entering/ })).toBeVisible();
    await page.getByRole('button', { name: /Begin journey/ }).click();
    await expect(page).toHaveURL(/#\/pathway\/play\//);
    await runPathwayLevel(page);
    await expect(page.locator('.pw-big-stars')).toBeVisible();
    await expect(page.getByText(/\+\d+ XP/).first()).toBeVisible();
    const cont = page.getByRole('button', { name: /^(Continue journey|Continue anyway)/ });
    await cont.first().click();
    await expect(page).toHaveURL(/#\/pathway$/);
    await expect(page.locator('.pw-node-wrap.state-completed, .pw-node-wrap.state-mastered').first()).toBeVisible();
    await expect(page.locator('.pw-node-wrap.is-current .pw-flag')).toBeVisible();
    // Persistence across reloads
    await page.reload();
    await expect(page.locator('.pw-node-wrap.state-completed, .pw-node-wrap.state-mastered').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('locked levels are visible but closed; jump controls and region chips work', async ({ page }) => {
    await setup(page);
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/#/pathway');
    await page.getByRole('button', { name: 'Close' }).first().click();
    const locked = page.locator('.pw-node-wrap.state-locked .pw-node').nth(3);
    await locked.scrollIntoViewIfNeeded();
    await locked.click();
    await expect(page.getByText(/Locked\./)).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /^Region 3: / }).click();
    await page.getByRole('button', { name: /Current/ }).first().click();
    await expect(page.locator('.pw-node-wrap.is-current')).toBeInViewport();
    // Keyboard users land on the current node, not just the scroll position.
    await expect(page.locator('.pw-node-wrap.is-current .pw-node')).toBeFocused();
  });

  test('mini-boss battle: phases, damage and a result screen', async ({ page, context }) => {
    await setup(page);
    await page.goto('/#/pathway');
    const ids: string[] = await page.evaluate(() => [...document.querySelectorAll('[data-node]')].map((n) => n.getAttribute('data-node')!));
    const mainIds = ids.filter((id) => !/^r\d-enc|enc-|-encounter/.test(id));
    const miniId = mainIds.find((id) => /-mini-1$/.test(id))!;
    expect(miniId).toBeTruthy();
    const levels = Object.fromEntries(mainIds.slice(0, mainIds.indexOf(miniId)).map((id) => [id, { stars: 2, best: 0.8, plays: 1, completedAt: Date.now() }]));
    await seedState(context, { placement: 'skipped', pathway: { levels, battles: {}, encounters: {}, introsSeen: ['r1'], ceremonies: [], lastVisit: '', quickReviews: {} } });
    const p2 = await context.newPage();
    await setup(p2);
    await p2.goto(`/#/pathway/play/${miniId}`);
    await p2.getByRole('button', { name: /Begin battle/ }).click();
    for (let i = 0; i < 14; i++) {
      if (await p2.getByText(/DEFEATED|withstands the attack/).count()) break;
      const fight = p2.getByRole('button', { name: /^Fight/ });
      if (await fight.count()) { await fight.click(); continue; }
      await answerQuestion(p2);
      await p2.locator('.q-card').getByRole('button', { name: /^(Strike|Final strike)/ }).click();
    }
    await expect(p2.getByText(/DEFEATED|withstands the attack/).first()).toBeVisible();
    await expect(p2.locator('.pw-hp')).toBeVisible();
  });

  test('dashboard shows the journey and links into it', async ({ page, context }) => {
    await seedState(context, { placement: 'skipped', name: 'Ana', lessons: { 'pop-sample': { step: 1, completed: false } } });
    await setup(page);
    await page.goto('/#/');
    await expect(page.locator('.pw-dash-hero')).toBeVisible();
    await page.locator('.pw-dash-hero').getByRole('link', { name: /Pathway/ }).first().click();
    await expect(page).toHaveURL(/#\/pathway/);
  });
});
