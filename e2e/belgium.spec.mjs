import { test, expect } from '@playwright/test';

const stop = { id: '1000', name: 'GARE CENTRALE', lat: 50.8451, lon: 4.3596, file: '1000' };
const country = {
  id: 'belgium', iso: 'BE', name: 'België / Belgique', flag: '🇧🇪',
  enabled: true, status: 'experimental', geocode: 'Belgium',
  bounds: [49.48, 51.52, 2.5, 6.42],
  regional: ['belgiumStib', 'belgiumRail', 'belgiumTec', 'belgiumDelijn']
};
function futureSchedule() {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Brussels', hour: '2-digit', minute: '2-digit',
    hourCycle: 'h23'
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date(Date.now() + 25 * 60000))
    .filter(x => x.type !== 'literal').map(x => [x.type, Number(x.value)]));
  return parts.hour * 60 + parts.minute;
}
test('Belgium: country → city → stop → line → direction → favorite survives reload', async ({ page }) => {
  // Mock only external/dataset responses; serve the actual production HTML and JS.
  await page.route('**/countries.json', route => route.fulfill({
    json: { schemaVersion: 1, countries: [
      { id: 'germany', enabled: true, status: 'beta', iso: 'DE', name: 'Deutschland', flag: '🇩🇪', geocode: 'Deutschland', bounds: [47.2,55.1,5.8,15.2], regional: [] },
      { id: 'spain', enabled: true, status: 'beta', iso: 'ES', name: 'España', flag: '🇪🇸', geocode: 'España', bounds: [27.4,43.9,-18.3,4.4], regional: [] },
      country
    ] }
  }));
  await page.route('**/data/towns/be.json', route => route.fulfill({
    json: { country: 'BE', towns: [['Bruxelles', 'Bruxelles-Capitale', 50.845, 4.36, 1000000, ['Brussel']]] }
  }));
  await page.route('**/data/belgium-*/search.json', route => {
    const folder = route.request().url().match(/belgium-([^/]+)\/search\.json/)?.[1];
    route.fulfill({ json: { stops: folder === 'stib' ? [stop] : [] } });
  });
  await page.route('**/data/belgium-*/services.json', route => route.fulfill({
    json: { calendar: { always: { from: '20200101', to: '20351231', days: [true,true,true,true,true,true,true] } }, exceptions: {} }
  }));
  await page.route('**/data/belgium-stib/stops/1000.json', route => route.fulfill({
    json: [[futureSchedule(), 'always', '1', 'Gare du Nord', '0']]
  }));
  await page.goto('/');
  await page.getByRole('tab', { name: /Add stop/i }).click();
  await expect(page.locator('#city option[value="belgium"]')).toHaveCount(1);
  await page.locator('#city').selectOption('belgium');
  await page.locator('#town-query').fill('Brux');
  await page.locator('#town-results button').first().click();
  await expect(page.locator('#stop-query')).toBeEnabled();
  await page.locator('#stop-query').fill('GARE');
  await page.locator('#stop-results button').first().click();
  await expect(page.locator('#transport')).toBeEnabled();
  await page.locator('#transport').selectOption('tram');
  await page.locator('#line').selectOption('1');
  await page.locator('#direction').selectOption('Gare du Nord');
  await page.locator('#save').click();
  await expect(page.locator('.station-card')).toHaveCount(1);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('bustimer:stops')));
  expect(saved[0]).toMatchObject({
    city: 'belgium', stopId: 'belgiumStib:1000', line: '1', direction: 'Gare du Nord'
  });
  await page.reload();
  await expect(page.locator('.station-card')).toHaveCount(1);
  await expect(page.locator('.station-card')).toContainText('GARE CENTRALE');
  // Interface strings localize; sourced station and direction remain literal.
  await page.locator('#nav-settings').click();
  await page.locator('#language').selectOption('es');
  await page.locator('#nav-list').click();
  await expect(page.locator('.station-card')).toContainText('GARE CENTRALE');
  await expect(page.locator('.station-card .status')).toContainText('Gare du Nord');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('.station-card')).toContainText('GARE CENTRALE');
});
