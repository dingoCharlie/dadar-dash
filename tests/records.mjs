import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
const require=createRequire(import.meta.url);
process.env.SUPABASE_URL='https://mock.supabase.test';
process.env.SUPABASE_SERVICE_ROLE_KEY='test-key-not-a-secret';
const handler=require('../api/records.js');
const token='abcdef0123456789'.repeat(4);
const rows=[];
global.fetch=async (url,opts)=>{
 const u=new URL(url),q=u.searchParams,method=opts.method||'GET';
 let result=[];
 if(method==='POST'){
  const row=JSON.parse(opts.body);
  if(!rows.find(x=>x.id===row.id)){rows.push({...row,completed_at:new Date().toISOString()});result=[row];}
 }else if(method==='DELETE'){
  for(let i=rows.length-1;i>=0;i--)if(rows[i].player_id===q.get('player_id')?.slice(3))rows.splice(i,1);
 }else{
  result=rows.filter(x=>x.player_id===q.get('player_id')?.slice(3));
  if(q.get('id'))result=result.filter(x=>x.id===q.get('id').slice(3));
  if(q.get('order')?.startsWith('score.'))result.sort((a,b)=>b.score-a.score);
  else result.sort((a,b)=>b.completed_at.localeCompare(a.completed_at));
  result=result.slice(0,Number(q.get('limit')||30));
  if(q.get('select')==='score')result=result.map(x=>({score:x.score}));
 }
 return {ok:true,status:200,text:async()=>JSON.stringify(result)};
};
async function invoke(method,body,valid=true){
 let output;
 const req={method,headers:{'x-player-token':valid?token:'invalid'},body};
 const res={statusCode:200,setHeader(){},end(text){output=JSON.parse(text)}};
 await handler(req,res);
 return {status:res.statusCode,...output};
}
assert.equal((await invoke('GET',undefined,false)).status,401);
assert.equal((await invoke('GET')).bestScore,0);
const id=randomUUID();
assert.equal((await invoke('POST',{challengeId:id,attempts:5,successfulTimeSeconds:60})).score,3378);
assert.equal((await invoke('GET')).bestScore,3378);
assert.equal((await invoke('GET')).history.length,1);
assert.equal((await invoke('POST',{challengeId:id,attempts:5,successfulTimeSeconds:60})).saved,true);
assert.equal((await invoke('GET')).history.length,1);
assert.equal((await invoke('POST',{challengeId:randomUUID(),attempts:1,successfulTimeSeconds:1})).status,400);
assert.equal((await invoke('DELETE')).deleted,true);
assert.equal((await invoke('GET')).history.length,0);
console.log('Passed anonymous API record tests (authorization, score, persistence, idempotence, deletion).');
