import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

const html=readFileSync('index.html','utf8');
const anchor='loadBest();resetWorld();showBestScoreCard();})();';
assert.ok(html.includes(anchor));
const instrumented=html.replace(anchor,'window.__testFinish=(time,attempt)=>{attemptTime=time;sessionAttempt=attempt;end()};'+anchor);
const browser=await chromium.launch({headless:true});
const fragments=['3,378','60.0 seconds','attempt 5','Think you can beat my score?','https://dadar-dash.vercel.app/'];

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
   await page.evaluate(()=>{window.__shared=[];Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__shared.push(data)}});window.__testFinish(60,5)});
   assert.equal(await page.locator('#finalScore').innerText(),'3,378',label+': correct score');
   assert.equal(await page.locator('#shareWhatsappButton').isVisible(),true,label+': visible after success');
   await page.locator('#shareWhatsappButton').click();
   const shared=await page.evaluate(()=>window.__shared);
   assert.equal(shared.length,1,label+': native OS share invoked');
   for(const part of fragments)assert.ok(shared[0].text.includes(part),label+' missing '+part);
   await page.locator('#playButton').click();
   assert.equal(await page.locator('#shareWhatsappButton').isVisible(),false,label+': hidden after replay');
   assert.deepEqual(errors,[],label+': runtime errors');
   await context.close();
   console.log(label+' native share checks passed');
 }

 // On platforms without native Web Share, fall back to WhatsApp using a
 // same-tab navigation (not a new window subject to popup blocking).
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await ctx.newPage();
 await page.goto('about:blank');await page.setContent(instrumented);
 await page.evaluate(()=>{
   Object.defineProperty(navigator,'share',{configurable:true,value:undefined});
   window.__testFinish(60,5);
 });
 const requestPromise=page.waitForRequest(req=>req.url().startsWith('https://api.whatsapp.com/send?'),{timeout:8000});
 await page.locator('#shareWhatsappButton').click({noWaitAfter:true});
 const req=await requestPromise;
 const msg=new URL(req.url()).searchParams.get('text');
 for(const part of fragments)assert.ok(msg.includes(part),'fallback missing '+part);
 await ctx.close();
 console.log('WhatsApp same-tab fallback passed');
}finally{await browser.close();}
