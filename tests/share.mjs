import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const html=readFileSync('index.html','utf8');
const anchor='loadBest();resetWorld();showBestScoreCard();})();';
assert.ok(html.includes(anchor));
const instrumented=html.replace(anchor, 'window.__testFinish=(time,attempt)=>{attemptTime=time;sessionAttempt=attempt;end()};'+anchor);
const browser=await chromium.launch({headless:true});
try {
 for(const [label,viewport,mobile] of [
   ['desktop',{width:1200,height:800},false],
   ['phone',{width:390,height:844},true],
   ['small phone',{width:360,height:640},true]
 ]){
   const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('about:blank');
   await page.setContent(instrumented);
   assert.equal(await page.locator('#shareWhatsappButton').isVisible(),false,label+': hidden before success');
   await page.evaluate(()=>{window.__shareUrls=[];window.open=url=>{window.__shareUrls.push(url);return {closed:false}};window.__testFinish(60,5)});
   assert.equal(await page.locator('#finalScore').innerText(),'3,378',label+': correct score');
   assert.equal(await page.locator('#shareWhatsappButton').isVisible(),true,label+': visible after success');
   await page.locator('#shareWhatsappButton').click();
   const urls=await page.evaluate(()=>window.__shareUrls);
   assert.equal(urls.length,1,label+': one share');
   const url=new URL(urls[0]),msg=url.searchParams.get('text');
   assert.equal(url.hostname,'wa.me');
   for(const fragment of ['3,378','60.0 seconds','attempt 5','Think you can beat my score?','https://dadar-dash.vercel.app/'])
      assert.ok(msg.includes(fragment),label+' missing '+fragment);
   await page.locator('#playButton').click();
   assert.equal(await page.locator('#shareWhatsappButton').isVisible(),false,label+': hidden after replay');
   assert.deepEqual(errors,[],label+': runtime errors');
   await context.close();
   console.log(label+' WhatsApp share checks passed');
 }
}finally{await browser.close();}
