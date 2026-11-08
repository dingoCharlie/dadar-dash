// Server-only Supabase access. Never expose the service-role key to browser code.
const {createHash}=require('node:crypto');
const validToken=/^[0-9a-f]{64}$/;
const CORS_ALLOWED_METHODS='GET, POST, DELETE';
function response(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));}
function idFromToken(req){const t=req.headers['x-player-token'];return typeof t==='string'&&validToken.test(t)?createHash('sha256').update(t).digest('hex'):null;}
function config(){const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return null;return {url:url.replace(/\/$/,''),key};}
async function db(path,{method='GET',body,prefer}={}){
 const c=config();if(!c)throw Object.assign(new Error('Database not configured'),{status:503});
 const headers={'apikey':c.key,'Authorization':'Bearer '+c.key,'Content-Type':'application/json'};
 if(prefer)headers.Prefer=prefer;
 const r=await fetch(c.url+'/rest/v1/'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(8000)});
 if(!r.ok)throw Object.assign(new Error('Database request failed'),{status:502,code:r.status});
 if(r.status===204)return null;
 const t=await r.text();return t?JSON.parse(t):null;
}
function onError(res,e){return response(res,e.status||500,{error:e.status===503?'Records are temporarily unavailable':'Could not access records'});}
function score(seconds,attempts){return Math.round(10000*(60/(60+seconds))/(1+0.12*(attempts-1)));}
module.exports={response,idFromToken,db,onError,score,CORS_ALLOWED_METHODS};
