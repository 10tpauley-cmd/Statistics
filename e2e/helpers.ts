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
