import fs from 'node:fs';
let output=[];
for(let variant of ['staged']){
 const M=await import(`./sim.mjs?v=0.19.0`),F=await import(`./finance.mjs?v=0.19.0`),T=await import(`./takeover.mjs?v=0.19.0`);
 for(let addSensor of [false,true])for(let [profile,delay,labs,order]of [['guided',120,1,['process','logistics','packaging','cloud']],['fast',0,1,['process','cloud','packaging','logistics']],['threeLabs',0,3,['process','cloud','packaging','logistics']],['lateLearner',600,1,['process','logistics','packaging','cloud']],['stageOrder3labs',0,3,['process','logistics','packaging','cloud']]]){
  let s=M.createGame(),events={},snapshots=[],connected=false;const record=(key)=>{events[key]??=s.tick;},link=(a,b)=>{let e=M.connect(s,a.id,b.id);if(e)throw Error(e);},n=(kind,product='paper',city='hanbit')=>{let x=M.build(s,kind,product,200,300,city);if(typeof x==='string')throw Error(x);return x;};
  function line(p){let ns=['mine','factory','warehouse','store'].map(k=>n(k,p));for(let i=0;i<3;i++)link(ns[i],ns[i+1]);return ns;}
  for(let t=0;t<5400;t++){
   if(t===delay){for(let i=0;i<3;i++)link(s.player.nodes[i],s.player.nodes[i+1]);connected=true;record('connect');}
   if(connected){
    if(events.edge===undefined&&s.player.cash>=6800){if(!M.upgradeEdge(s,s.player.edges[1].id))throw Error('edge');record('edge');}
    if(events.edge!==undefined&&events.furnitureBuild===undefined&&s.player.cash>=18000){line('furniture');record('furnitureBuild');}
    if(events.furnitureBuild!==undefined&&s.player.nodes.filter(n=>n.kind==='lab').length<labs&&s.player.cash>=12000)n('lab');
    if(s.player.nodes.some(n=>n.kind==='lab')&&!s.player.research.active){let id=[...order,...(addSensor?['precision']:[])].find(k=>!s.player.research.unlocked.includes(k));if(id&&!M.startResearch(s,id))record(id+'Start');}
    if(s.player.research.unlocked.includes('cloud')&&!s.player.nodes.some(n=>n.kind==='collector')&&s.player.cash>=28000){let ns=['collector','datacenter','servicehub'].map(k=>n(k));link(ns[0],ns[1]);link(ns[1],ns[2]);record('cloudBuild');}
    if(s.player.research.unlocked.includes('packaging')&&!s.player.nodes.some(n=>n.product==='packaging'&&n.kind==='factory')&&s.player.cash>=22800){let ns=[n('mine'),n('factory'),n('factory','packaging'),n('warehouse','packaging'),n('store','packaging')];for(let i=0;i<4;i++)link(ns[i],ns[i+1]);record('packagingBuild');}
    let portCost=M.CITIES.cheolwon.entry+8500*2+2200+3600+5000;
    if(events.cloudBuild!==undefined&&events.packagingBuild!==undefined&&!s.player.cities.includes('cheolwon')&&s.player.cash>=portCost&&s.tick>=2700){let a=n('port');let err=M.unlockCity(s,'cheolwon');if(err)throw Error(err);let ns=[n('port','paper','cheolwon'),n('warehouse','paper','cheolwon'),n('store','paper','cheolwon')];link(s.player.nodes[1],a);link(a,ns[0]);link(ns[0],ns[1]);link(ns[1],ns[2]);record('portBuild');}
   }
   if(addSensor&&s.player.research.unlocked.includes('precision')&&!s.player.nodes.some(n=>n.kind==='supplier')&&s.player.cash>=35000){let ns=M.SENSOR.map(k=>n(k,'sensor'));link(ns[0],ns[1]);link(ns[1],ns[2]);record('sensorBuild');}
   if(!s.player.equity.listed&&!F.quoteIssue(s).error){let err=F.issueShares(s,40);if(err)throw Error(err);record('IPO');}
   if(events.tenderStart===undefined&&s.tick>=4200){let bids=[s.ai,...s.competitors].filter(c=>c.status==='active'&&!c.controller).map(c=>({c,price:Math.ceil(c.equity.price*2.5),quantity:Math.floor(c.equity.total*.51)+1})).map(v=>({...v,q:T.quoteTender(s,v.c.id,v.price,v.quantity,5)})).filter(v=>!v.q.error&&s.player.cash-v.q.total>=50000).sort((a,b)=>a.q.total-b.q.total);if(bids.length){let b=bids[0],err=T.openTender(s,b.c.id,b.price,b.quantity,5);if(err)throw Error(err);record('tenderStart');events.tenderTarget=b.c.id;events.reserved=b.q.total;}}
   M.step(s);
   if(T.groupCompanies(s).length>1)record('control');
   if(s.tick>=4500&&T.groupCompanies(s).length>1&&T.groupProfit(s)>0)record('groupGoal');
   if(s.tick>=5400&&T.groupCompanies(s).length>1&&T.groupProfit(s)>0&&s.player.equity.listed&&s.player.cities.length>1&&['packaging','cloud'].every(k=>s.player.research.unlocked.includes(k)))record('finishGoal');
   if(s.player.ledger.revenue>0)record('firstSale');
   for(let id of s.player.research.unlocked)record(id+'Done');
   for(let p of ['furniture','packaging','service','sensor'])if(s.player.sales[p]>0)record(p+'Sale');
   if(s.player.regional.cheolwon.sales.paper)record('portSale');
   if(!F.quoteIssue(s).error)record('IPOeligible');
   for(let cash of [50000,100000,250000,500000])if(s.player.cash>=cash)record('cash'+cash);
   if(events.tenderAffordable===undefined){let target=[s.ai,...s.competitors].filter(c=>c.status==='active'&&!c.controller).map(c=>({c,price:Math.ceil(c.equity.price*1.5),quantity:Math.floor(c.equity.total*.51)+1}));if(target.some(({c,price,quantity})=>!T.quoteTender(s,c.id,price,quantity,5).error))record('tenderAffordable');}
   if([600,1200,1800,2700,3600,4500,5400].includes(s.tick))snapshots.push({tick:s.tick,cash:s.player.cash,earned:s.lifetimeProfit,nodes:s.player.nodes.length,tech:[...s.player.research.unlocked],active:s.player.research.active,cities:[...s.player.cities],loss:!!s.finance.loss,stopped:s.player.stopped});
   if(s.finance.loss)break;
  }
  M.validate(s);if(!s.milestones.includes('pace-stable'))throw Error('actual90goal missing '+profile);fs.writeFileSync('/tmp/flow-sensor-'+addSensor+'-'+profile+'.json',JSON.stringify(s));output.push({addSensor,variant,profile,events,snapshots});console.log(addSensor,variant,profile,JSON.stringify(events),'cash90',s.player.cash);
 }
}
if(process.env.SENSOR_AUDIT_RESULTS)fs.writeFileSync(process.env.SENSOR_AUDIT_RESULTS,JSON.stringify(output,null,2));
