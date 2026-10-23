import { test, expect } from '@playwright/test';

test('Netherlands: direct Transitous stop to favorite across reload', async ({ page }) => {
  // Enable only in the isolated test fixture; production remains gated after HTTP 403.
  await page.route('**/countries.json', async route => {
    const response = await route.fetch();
    const config = await response.json();
    const nl = config.countries.find(c => c.id === 'netherlands');
    nl.enabled = true; nl.status = 'experimental';
    await route.fulfill({ json: config });
  });
  await page.route('https://api.transitous.org/api/v1/geocode?**', async route => {
    await route.fulfill({ json: { matches: [{
      type: 'STOP',
      place: { stopId: 'nl:fixture:utrecht', name: 'Utrecht Centraal', lat: 52.09, lon: 5.12 }
    }] } });
  });
  await page.route('https://api.transitous.org/api/v6/stoptimes?**', async route => {
    const iso = new Date(Date.now() + 30 * 60000).toISOString();
    await route.fulfill({ json: { stopTimes: [{
      place: { scheduledDeparture: iso, departure: iso },
      mode: 'TRAM',
      routeShortName: '22',
      headsign: 'Science Park',
      realTime: false
    }] } });
  });
  await page.goto('/');
  await page.getByRole('tab', { name: /Add stop/i }).click();
  await expect(page.locator('#city option[value="netherlands"]')).toHaveCount(1);
  await page.locator('#city').selectOption('netherlands');
  await page.locator('#town-query').fill('Utrecht');
  await page.locator('#town-results button').first().click();
  await page.locator('#stop-query').fill('Utrecht Centraal');
  await page.locator('#stop-results button').first().click();
  await page.locator('#transport').selectOption('tram');
  await page.locator('#line').selectOption('22');
  await page.locator('#direction').selectOption('Science Park');
  await page.locator('#save').click();
  await expect(page.locator('.station-card')).toHaveCount(1);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('bustimer:stops')));
  expect(saved[0]).toMatchObject({
    city: 'netherlands', stopId: 'nl:fixture:utrecht',
    type: 'tram', line: '22', direction: 'Science Park'
  });
  await page.reload();
  await expect(page.locator('.station-card')).toContainText('Utrecht Centraal');
});
