const {response,idFromToken,db,onError,score}=require('./_records');
module.exports=async function handler(req,res){
 if(req.method!=='GET'&&req.method!=='POST'&&req.method!=='DELETE')return response(res,405,{error:'Method not allowed'});
 const playerId=idFromToken(req);if(!playerId)return response(res,401,{error:'Anonymous player token required'});
 try{
  const q='player_id=eq.'+playerId;
  if(req.method==='GET'){
   const [history,best]=await Promise.all([
    db('challenges?'+q+'&select=id,attempts,successful_time_seconds,score,completed_at&order=completed_at.desc&limit=30'),
    db('challenges?'+q+'&select=score&order=score.desc&limit=1')
   ]);
   return response(res,200,{history,bestScore:best&&best.length?best[0].score:0});
  }
  if(req.method==='DELETE'){
   await db('challenges?'+q,{method:'DELETE',prefer:'return=minimal'});
   return response(res,200,{deleted:true});
  }
  const b=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
  const a=b.attempts,t=b.successfulTimeSeconds,id=b.challengeId;
  if(typeof a!=='number'||!Number.isInteger(a)||a<1||a>10000||typeof t!=='number'||!Number.isFinite(t)||t<12||t>3600||typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)){
   return response(res,400,{error:'Invalid challenge record'});
  }
  const item={id,player_id:playerId,attempts:a,successful_time_seconds:t,score:score(t,a)};
  const saved=await db('challenges?on_conflict=id',{method:'POST',body:item,prefer:'resolution=ignore-duplicates,return=representation'});
  // Do not report success for a UUID owned by another token. UUIDs must be unpredictable.
  if(!saved?.length){
   const rows=await db('challenges?id=eq.'+encodeURIComponent(id)+'&player_id=eq.'+playerId+'&select=id,score');
   if(!rows?.length)return response(res,409,{error:'Challenge already exists'});
  }
  return response(res,200,{challengeId:id,score:item.score,saved:true});
 }catch(e){return onError(res,e);}
};
