import {test,expect} from '@playwright/test';
test('deployed BusTimer uses new branding and PWA assets',async({page})=>{
 const origin='https://tupolev.github.io/bustimer/';
 await page.goto(origin,{waitUntil:'networkidle',timeout:45000});
 await expect(page.locator('.logo img.logo-icon')).toBeVisible();
 await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content','#092A52');
 const appearance=await page.evaluate(async()=>{
  const root=getComputedStyle(document.documentElement);
  const icon=await fetch('./icon.svg',{cache:'no-store'});
  return {primary:root.getPropertyValue('--primary').trim(),accent:root.getPropertyValue('--accent').trim(),
    iconStatus:icon.status,iconSVG:await icon.text(),title:document.title};
 });
 expect(appearance.primary).toBe('#092A52');
 expect(appearance.accent).toBe('#FFC629');
 expect(appearance.iconStatus).toBe(200);
 expect(appearance.iconSVG).toContain('#FFC629');
 await page.screenshot({path:'brand-live.png',fullPage:true});
});