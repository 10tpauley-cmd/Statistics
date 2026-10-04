import { expect, type Page } from '@playwright/test';

/** Web fonts are optional; block them so tests don't depend on the network. */
export async function setup(page: Page) {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
}

/** Fresh learner who skipped the welcome screen. */
export async function freshLearner(page: Page, name = 'Sam') {
  await setup(page);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/#/');
  await page.getByLabel('What should we call you? (optional)').fill(name);
  await page.getByRole('button', { name: 'Start from lesson 1' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Population');
}

/** Answer whatever question card is on screen (any answer — tests check the flow, not the math). */
export async function answerQuestion(page: Page) {
  const card = page.locator('.q-card').first();
  await expect(card).toBeVisible();
  // Guided multi-step parts
  for (let i = 0; i < 8; i++) {
    const check = card.getByRole('button', { name: 'Check step' });
    if (!(await check.count())) break;
    const part = card.locator('.part').filter({ has: page.getByRole('button', { name: 'Check step' }) });
    const opt = part.locator('.option:not([disabled])');
    if (await opt.count()) await opt.first().click();
    else await part.getByLabel('Numeric answer').fill('1');
    await check.click();
  }
  const opts = card.locator('.q-body > .options .option:not([disabled])');
  const num = card.locator('.q-body > .numeric-row').getByLabel('Numeric answer');
  const text = card.getByLabel('Written answer');
  if (await opts.count()) await opts.first().click();
  else if (await num.count()) await num.fill('1');
  else if (await text.count()) await text.fill('The mean is the balance point of the data and it is pulled toward outliers in the tail.');
  const submit = card.getByRole('button', { name: /^(Check answer|Submit answer)$/ });
  if (await submit.count()) await submit.click();
  // Interpretation follow-up appears after a correct calculation
  const interp = card.getByRole('button', { name: 'Check interpretation' });
  if (await interp.count()) {
    await card.locator('.part .option').first().click();
    await interp.click();
  }
}

/** Click through a lesson, answering every interaction. */
export async function runLesson(page: Page) {
  for (let i = 0; i < 30; i++) {
    if (await page.getByRole('heading', { name: /^Lesson complete/ }).count()) return;
    const step = page.locator('.step-card');
    const opt = step.locator('.option:not([disabled])');
    const reveal = step.getByRole('button', { name: 'Reveal answer' });
    const lock = step.getByRole('button', { name: 'Lock it in' });
    const num = step.getByLabel('Your answer');
    if (await reveal.count()) {
      await reveal.click();
      await step.getByRole('button', { name: 'Nailed it' }).click();
    } else if (await lock.count()) {
      await lock.click();
    } else if (await opt.count() && !(await step.locator('.feedback').count())) {
      await opt.first().click();
    } else if ((await num.count()) && (await num.isEnabled()) && (await step.getByRole('button', { name: 'Check' }).count())) {
      await num.fill('1');
      await step.getByRole('button', { name: 'Check' }).first().click();
    }
    const next = page.getByRole('button', { name: /^(Continue|Complete lesson)$/ });
    await expect(next).toBeEnabled();
    await next.click();
  }
  throw new Error('Lesson did not finish');
}

/** Play whatever Pathway level/review/encounter is on screen until its completion card. */
export async function runPathwayLevel(page: Page) {
  for (let i = 0; i < 60; i++) {
    if (await page.getByRole('heading', { name: /^(Level complete!|Review complete!|Encounter cleared!)$/ }).count()) return;
    const seg = page.locator('.pw-seg');
    await expect(seg).toBeVisible();
    const card = seg.locator('.q-card');
    if (await card.count()) {
      await answerQuestion(page);
      await card.getByRole('button', { name: /^(Continue|Finish level)/ }).click();
      continue;
    }
    const lets = seg.getByRole('button', { name: "Let's go" });
    if (await lets.count()) { await lets.click(); continue; }
    const reveal = seg.getByRole('button', { name: 'Reveal answer' });
    const nailed = seg.getByRole('button', { name: 'Nailed it' });
    const lock = seg.getByRole('button', { name: 'Lock it in' });
    const teach = seg.getByLabel('Your explanation');
    const restore = seg.getByRole('button', { name: 'Restore the formula' });
    const opt = seg.locator('.option:not([disabled])');
    const num = seg.getByLabel('Your answer');
    if (await reveal.count()) await reveal.click();
    if (await nailed.count()) await nailed.click();
    else if (await lock.count()) await lock.click();
    else if (await teach.count() && (await teach.isEnabled())) {
      await teach.fill('The idea is that we describe the data by its typical value and spread; for example the mean is the balance point, outliers pull it toward the tail, and a common mistake is to ignore the context of the data.');
      await seg.getByRole('button', { name: 'Get feedback' }).click();
      await expect(seg.locator('.feedback')).toBeVisible();
    } else if (await restore.count()) {
      const selects = seg.locator('select');
      for (let k = 0; k < (await selects.count()); k++) await selects.nth(k).selectOption({ index: 1 });
      await restore.click();
    } else if ((await opt.count()) && !(await seg.locator('.feedback').count())) {
      await opt.first().click();
    } else if ((await num.count()) && (await num.isEnabled()) && (await seg.getByRole('button', { name: 'Check' }).count())) {
      await num.fill('1');
      await seg.getByRole('button', { name: 'Check' }).first().click();
    }
    const next = page.getByRole('button', { name: /^(Continue|Let's go)$/ });
    await expect(next.first()).toBeEnabled();
    await next.first().click();
  }
  throw new Error('Pathway level did not finish');
}

/** Seed learner state before the app boots (the app flushes its own state on unload, so writes after load don't stick). */
export async function seedState(context: import('@playwright/test').BrowserContext, state: object) {
  await context.addInitScript((json) => {
    if (!sessionStorage.getItem('e2e-seeded')) {
      sessionStorage.setItem('e2e-seeded', '1');
      localStorage.setItem('statlab.learner.v1', json);
    }
  }, JSON.stringify(state));
}
