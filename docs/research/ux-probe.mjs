import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const browser = await chromium.launch();
const routes=['/','/roadmap','/labs','/mindset','/ipo','/community','/pricing','/sign-in','/sign-up','/onboarding','/desk','/lessons','/practice','/practice/round','/me','/lesson/m1','/lesson/p1','/design'];
const results=[];
for(const width of [768,1024,1440]){
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
 const page=await context.newPage();
 for(const route of routes){
  try { const response=await page.goto('http://localhost:5177'+route,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(500);
  const data=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth,missingAnchors:[...document.querySelectorAll('a[href^="#"]')].map(x=>x.getAttribute('href')).filter(x=>x.length>1&&!document.getElementById(x.slice(1))),h1:[...document.querySelectorAll('h1')].map(x=>x.textContent)}));
  results.push({width,route,status:response.status(),...data});
  if(width===1440&&['/','/labs','/desk'].includes(route)) await page.screenshot({path:'shots/audit-desktop-'+(route==='/'?'landing':route.slice(1))+'.png'});
  }catch(e){results.push({width,route,error:String(e)})}
 }
 await context.close();
}
await browser.close();
writeFileSync('docs/research/2026-09-27-responsive-results.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results.filter(x=>x.error||x.scroll>x.viewport||x.missingAnchors?.length),null,2));
