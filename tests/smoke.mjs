import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const html=readFileSync('index.html','utf8');
assert.match(html,/function cameraYTarget\(/,'v21 camera regression');
assert.match(html,/steerVector\(dx,dy,140\)/,'140px joystick threshold');
const browser=await chromium.launch({headless:true});
let checks=0;
try {
  for (const [name,viewport,mobile] of [
    ['desktop',{width:1280,height:800},false],
    ['mobile portrait',{width:390,height:844},true],
    ['small mobile',{width:360,height:640},true],
    ['landscape',{width:844,height:390},true],
  ]) {
    const ctx=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});
    const page=await ctx.newPage();
    const errors=[];
    page.on('pageerror',err=>errors.push(err.message));
    await page.goto(pathToFileURL(resolve('index.html')).href);
    assert.equal(await page.locator('#game').count(),1,name+': game canvas');
    assert.equal(await page.locator('#playButton').count(),1,name+': start button');
    await page.locator('#playButton').click();
    await page.waitForTimeout(350);
    assert.equal(await page.locator('#overlay').evaluate(el=>el.classList.contains('hidden')),true,name+': starts game');
    if(mobile){
      const rect=await page.locator('#game').boundingBox();
      assert.ok(rect&&rect.width>100&&rect.height>100,name+': canvas visible');
      const x=rect.x+rect.width*.65,y=rect.y+rect.height*.55;
      await page.mouse.move(x,y);
      await page.mouse.down();
      await page.waitForTimeout(40);
      assert.equal(await page.locator('#joystick').evaluate(el=>el.classList.contains('active')),true,name+': floating control appears');
      await page.mouse.move(x+50,y,{steps:4});
      await page.mouse.up();
      assert.equal(await page.locator('#joystick').evaluate(el=>el.classList.contains('active')),false,name+': floating control disappears');
    } else {
      await page.keyboard.down('ArrowRight');await page.waitForTimeout(200);await page.keyboard.up('ArrowRight');
    }
    assert.deepEqual(errors,[],name+': no JS exceptions');
    checks+=mobile?6:4;
    await ctx.close();
  }
} finally { await browser.close(); }
console.log('Passed '+checks+' browser checks (startup, controls, errors).');
