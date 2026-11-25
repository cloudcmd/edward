import {test, expect} from '@playwright/test';

test('edward: global is a function', async ({page}) => {
    await page.goto('/');

    const type = await page.evaluate(() => typeof globalThis.edward);

    expect(type).toBe('function');
});

test('edward: editor is shown without errors', async ({page}) => {
    const errors = [];

    page.on('pageerror', ({message}) => {
        errors.push(message);
    });

    await page.goto('/');
    await expect(page.locator('.ace_editor')).toBeVisible();

    expect(errors).toEqual([]);
});

test('edward: file content is shown', async ({page}) => {
    await page.goto('/');
    await expect(page.locator('.ace_content')).toContainText(/"name":.+"edward"/);
});
