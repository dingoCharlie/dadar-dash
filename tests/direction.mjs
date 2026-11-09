import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const s=readFileSync('index.html','utf8');
const start=s.indexOf('const currentMag=Math.hypot(move.x,move.y)');
const end=s.indexOf('move.y+=(targetMove.y-move.y)*sm;',start);
assert.ok(start>=0&&end>start,'directional response must exist');
const snippet=s.slice(start,end+'move.y+=(targetMove.y-move.y)*sm;'.length);
const step=new Function('move','targetMove','dt',snippet+' return move;');
const tol=1e-8;
for(const hz of [60,90,120]){
  let move={x:1,y:0};const desired={x:-1,y:0};
  let reversalAt=null,fullAt=null;
  for(let i=1;i<=20;i++){
    step(move,desired,1/hz);
    if(reversalAt===null&&move.x<0)reversalAt=i/hz;
    if(fullAt===null&&move.x<=-.8)fullAt=i/hz;
  }
  assert.ok(reversalAt!==null&&reversalAt<=.05,'reversal too slow at '+hz+'Hz: '+reversalAt);
  assert.ok(fullAt!==null&&fullAt<=.16,'near-full reverse too slow at '+hz+'Hz: '+fullAt);
  let neutral={x:0,y:0};
  step(neutral,{x:1,y:0},1/hz);
  assert.ok(neutral.x>0&&neutral.x<.25,'normal acceleration changed at '+hz+'Hz');
}
assert.match(s,/steerVector\(dx,dy,140\)/,'full-speed reach must remain 140px');
assert.match(s,/function steerVector\(dx,dy,maxDist\)\{let dist=Math.hypot\(dx,dy\),dead=10;/,'10px dead zone');
assert.match(s,/player.x\+dx\*260\*dt/,'maximum movement speed unchanged');
console.log('Directional reversal: under 50ms at 60/90/120Hz; normal acceleration and top speed preserved.');
