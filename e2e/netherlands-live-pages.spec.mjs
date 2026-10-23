import { test, expect } from '@playwright/test';

test('published BusTimer: Dutch country and real Transitous requests from Pages origin', async ({ page }) => {
  const app = 'https://tupolev.github.io/bustimer/';
  await page.goto(app, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await expect(page.locator('#city option[value="netherlands"]')).toHaveCount(1, {timeout:15000});
  const result = await page.evaluate(async () => {
    const base = 'https://api.transitous.org';
    const geocode = await fetch(base + '/api/v1/geocode?' + new URLSearchParams({
      text: 'Rotterdam Centraal, Rotterdam, Nederland', type: 'STOP'
    }));
    if (!geocode.ok) return {stage:'geocode',status:geocode.status};
    const json = await geocode.json();
    const stops = Array.isArray(json)?json:(json.matches||json.results||[]);
    const ids=stops.map(s=>(s.place||s).stopId||(s.place||s).id||s.id).filter(x=>typeof x==='string');
    const preferred=ids.find(id=>id.startsWith('nl-OpenOV'))||ids[0];
    if (!preferred) return {stage:'missing-stops',count:stops.length};
    const departures = await fetch(base+'/api/v6/stoptimes?'+new URLSearchParams({stopId:preferred,n:20}));
    if (!departures.ok) return {stage:'departures',status:departures.status,stopId:preferred};
    const feed = await departures.json();
    return {stage:'ok',stopId:preferred,count:(feed.stopTimes||[]).length,origin:location.origin};
  });
  expect(result.stage,JSON.stringify(result)).toBe('ok');
  expect(result.count,JSON.stringify(result)).toBeGreaterThan(0);
});
