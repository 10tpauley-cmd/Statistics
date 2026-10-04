import { test, expect } from '@playwright/test';
import { freshLearner, answerQuestion, runLesson, setup } from './helpers';

test.describe('learning flow', () => {
  test('welcome → first lesson → completion → dashboard reflects progress', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await freshLearner(page);
    await expect(page.getByText('Course Source: PDF')).toBeVisible();
    await runLesson(page);
    await expect(page.getByText('Finishing a lesson is not mastery.')).toBeVisible();
    // Progress persists across reloads
    await page.goto('/#/');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Sam');
    await expect(page.getByRole('heading', { name: "Today's plan" })).toBeVisible();
    await page.goto('/#/learn');
    await expect(page.locator('.concept-card').first()).toContainText('Lesson');
    expect(errors).toEqual([]);
  });

  test('quick quiz runs five adaptive questions and shows a session summary', async ({ page }) => {
    await freshLearner(page);
    await page.goto('/#/practice?mode=quick');
    for (let i = 0; i < 5; i++) {
      await answerQuestion(page);
      await page.getByRole('button', { name: /^(Next problem|Finish)/ }).click();
    }
    await expect(page.getByText('Session summary')).toBeVisible();
    await expect(page.locator('.metric').filter({ hasText: 'Problems' })).toContainText('5');
  });

  test('wrong answers land in the mistake bank with a misconception fix', async ({ page }) => {
    await freshLearner(page);
    await page.goto('/#/practice?concept=std-dev');
    for (let i = 0; i < 3; i++) {
      await answerQuestion(page);
      await page.getByRole('button', { name: 'Next problem' }).click();
    }
    await page.goto('/#/mistakes');
    const heading = page.getByRole('heading', { name: 'Mistake bank' });
    await expect(heading).toBeVisible();
    await expect(page.getByText(/open · \d+ resolved/)).toBeVisible();
  });

  test('exam: answer every question, then see an analyzed report', async ({ page }) => {
    await freshLearner(page);
    await page.goto('/#/exam/unit-u1?n=5&timed=0');
    for (let i = 0; i < 5; i++) {
      await expect(page.getByText(`Question ${i + 1} of 5`)).toBeVisible();
      await answerQuestion(page);
    }
    await expect(page.getByText(/Exam report/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'By unit' })).toBeVisible();
    await page.goto('/#/exam');
    await expect(page.locator('.list-item')).toHaveCount(1);
  });

  test('teach it gives rubric feedback offline', async ({ page }) => {
    await freshLearner(page);
    await page.goto('/#/teach?concept=center');
    await page.getByLabel('Your explanation').fill('The mean adds all the values and divides by how many there are, so it is the balance point. The median is the middle value when the data are sorted. Outliers pull the mean toward the tail, but the median is resistant, so use the median for skewed data.');
    await page.getByRole('button', { name: 'Get feedback' }).click();
    await expect(page.getByText('Offline rubric check')).toBeVisible();
    await expect(page.getByText('Your past explanations')).toBeVisible();
  });
});

test.describe('tools', () => {
  test('calculator shows answer, steps, and meaning', async ({ page }) => {
    await setup(page);
    await page.goto('/#/calculator');
    await page.getByLabel('Data values').fill('2, 4, 4, 4, 5, 5, 7, 9');
    await expect(page.locator('.data-table').first()).toContainText('8');
    await page.getByRole('button', { name: 'Mean', exact: true }).click();
    await expect(page.getByText('How we got there').first()).toBeVisible();
    await expect(page.getByText('What this means').first()).toBeVisible();
    await expect(page.locator('.answer-hero').first()).toContainText('5');
  });

  test('global search jumps to a concept', async ({ page }) => {
    await setup(page);
    await page.goto('/#/');
    await page.keyboard.press('Control+k');
    await page.getByRole('combobox', { name: 'Search' }).fill('scatterplots');
    await expect(page.getByRole('option').first()).toContainText('Scatterplots');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/learn\/scatter/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Scatterplots');
  });

  test('Mu answers offline and gives the next hint on a problem', async ({ page }) => {
    await setup(page);
    await page.goto('/#/practice?concept=center');
    await page.locator('body').click({ position: { x: 5, y: 300 } });
    await page.keyboard.press('?');
    const panel = page.getByRole('dialog', { name: 'Mu helper' });
    await expect(panel).toBeVisible();
    await panel.getByLabel('Message Mu').fill('what is the IQR?');
    await panel.getByRole('button', { name: 'Send' }).click();
    await expect(panel.locator('.msg.mu').last()).toContainText(/quartile|middle 50/i);
    await panel.getByRole('button', { name: /Give me a hint/ }).click();
    await expect(page.locator('.hint-box')).toBeVisible();
  });

  test('dark mode toggle and settings persist', async ({ page }) => {
    await setup(page);
    await page.goto('/#/settings');
    await page.getByRole('radio', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('radio', { name: 'System' }).click();
  });

  test('simulation lab: sampling methods draw samples', async ({ page }) => {
    await setup(page);
    await page.goto('/#/lab?w=sampling');
    await page.getByRole('button', { name: 'Repeat 100×' }).click();
    await expect(page.getByText(/estimates from simple random samples/)).toBeVisible();
    await page.getByRole('radio', { name: 'Convenience' }).click();
    await page.getByRole('button', { name: 'Repeat 100×' }).click();
    await expect(page.locator('.data-table')).toContainText('Convenience');
  });
});
