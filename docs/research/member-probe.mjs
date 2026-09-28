import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch();
const results=[];
for(const width of [375,768,1440]){
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
 const page=await context.newPage();
 for(const path of ['/desk','/lessons','/practice','/me']){
  await page.goto('http://localhost:5177'+path,{waitUntil:'networkidle'});
  results.push({width,path,...await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,h1:document.querySelector('h1')?.textContent}))});
  if(path==='/desk'||path==='/lessons')await page.screenshot({path:`shots/chartward-${path.slice(1)}-${width}.png`,fullPage:true});
 }
 if(width===375){
  await page.goto('http://localhost:5177/lessons');
  await page.getByRole('searchbox').fill('RSI');
  await page.getByRole('button',{name:'Clear filters'}).click();
  if(await page.getByRole('searchbox').inputValue()!=='')throw new Error('Clear filters failed');
  await page.evaluate(()=>localStorage.setItem('sika:practice',JSON.stringify([{kind:'missed',key:'m1:00000001',lesson:'m1',at:Date.now()-3600000}])));
  await page.route('**/api/questions?**',route=>route.fulfill({status:503,body:'Unavailable'}));
  await page.goto('http://localhost:5177/practice/round',{waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'Your questions could not load'}).waitFor();
  await page.getByRole('button',{name:'Try again'}).click();
  await page.getByRole('heading',{name:'Your questions could not load'}).waitFor();
  await page.screenshot({path:'shots/chartward-practice-error.png'});
  results.push({test:'practice 503 and retry',passed:true},{test:'library clear filters',passed:true});
 }
 await context.close();
}
await browser.close();writeFileSync('docs/research/2026-09-27-member-checks.json',JSON.stringify(results,null,2));console.log(results);
