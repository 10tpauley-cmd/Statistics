import { test, expect } from '@playwright/test';
import { setup } from './helpers';

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
