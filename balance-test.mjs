import assert from 'node:assert/strict';
import {createGame,step,connect,build,upgradeEdge,startResearch,validate,migrate,KINDS,TECHS} from './sim.mjs?v=0.14.0';
import {quoteIssue,IPO_MIN_TICKS} from './finance.mjs?v=0.14.0';
const link=(s,a,b)=>assert.equal(connect(s,a.id,b.id),null);
function seed(){let s=createGame();for(let i=0;i<3;i++)link(s,s.player.nodes[i],s.player.nodes[i+1]);assert(upgradeEdge(s,s.player.edges[1].id));for(let t=0;t<1800;t++)step(s);return s;}
let guard=createGame();guard.tick=3599;assert(quoteIssue(guard).error);guard.tick=3600;assert(!quoteIssue(guard).error);assert.equal(IPO_MIN_TICKS,3600);assert.equal(KINDS.lab.fixed,1);assert.equal(KINDS.ad.fixed,2);assert.equal(TECHS.process.cost,3000);assert.equal(TECHS.logistics.cost,3000);
for(let [id,paid]of [['process',4500],['logistics',5500]]){let s=createGame();build(s,'lab','paper',500,300);if(id==='logistics')s.player.research.unlocked=['process'];assert.equal(startResearch(s,id),null);s.player.cash-=paid-s.player.research.active.paid;s.player.ledger.research+=paid-s.player.research.active.paid;s.player.research.active.paid=paid;assert.equal(migrate(s).player.research.active.paid,paid);validate(s);s.player.research.active.paid++;assert.throws(()=>validate(s));}
let summary=[];for(let budget of [10,25,100]){let a=seed(),b=structuredClone(a),n=build(a,'ad','paper',600,300);n.budget=budget;let roi=null;for(let t=1;t<=3600;t++){step(a);step(b);if(roi===null&&a.player.cash>=b.player.cash)roi=t;}summary.push({budget,roi,delta:a.player.cash-b.player.cash});validate(a);if(budget<=25)assert(roi>0&&roi<1800);else assert.equal(roi,null);}
assert(summary[0].roi<summary[1].roi);
console.log('PASS balance0.12:3600IPO/3599blocked,oldpaid research preserved/no-refund/forgeryreject,10/25adROI<30min,10moreefficient-smallmarket,100notautomaticupgrade.',JSON.stringify(summary));
