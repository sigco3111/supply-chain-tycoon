// Read-only management view. It never creates an economic node or changes a save.
import {companies,TECHS} from './sim.mjs?v=0.25.0';
import {groupCompanies,groupProfit} from './takeover.mjs?v=0.25.0';
import {paceError,paceGoals} from './pace.mjs?v=0.25.0';
export const HQ_UNLOCK=3600;
export function headquarters(s){
 const firms=companies(s),group=groupCompanies(s),ids=new Set(group.map(c=>c.id));
 const weights=new Map([[s.player.id,1]]);
 function visit(owner){for(const c of group.filter(c=>c.controller===owner.id)){weights.set(c.id,weights.get(owner.id)*(c.equity.holders[owner.id]||0)/c.equity.total);visit(c);}}visit(s.player);
 const tech=[...new Set(group.flatMap(c=>c.research.unlocked))];
 const rows=group.map(c=>({id:c.id,name:c.name,parent:c.controller?firms.find(v=>v.id===c.controller).name:null,cash:c.cash,profit:c.last.profit,weighted:Math.round(c.last.profit*weights.get(c.id)),weight:weights.get(c.id),listed:c.equity.listed,founder:(c.equity.holders['founder:'+c.id]||0)/c.equity.total,direct:c.controller?(c.equity.holders[c.controller]||0)/c.equity.total:1,nodes:c.nodes.length,tech:Object.entries(TECHS).map(([id,t])=>({id,name:t.name,status:c.research.unlocked.includes(id)?'완료':c.research.active?.id===id?'연구 중':tech.includes(id)?paceError(s,c,id)?'해금 대기':'다음 경제틱 공유':'그룹 미보유'})),research:c.research.active?{...c.research.active,name:TECHS[c.research.active.id].name}:null}));
 const alerts=Object.entries(s.finance.alerts).filter(([id])=>ids.has(id)).map(([target,a])=>({target,name:firms.find(c=>c.id===target).name,owner:a.owner,ownerName:firms.find(c=>c.id===a.owner).name,ratio:(firms.find(c=>c.id===target).equity.holders[a.owner]||0)/firms.find(c=>c.id===target).equity.total,level:a.level,remaining:Math.max(0,a.deadline-s.tick)}));
 const tenders=s.finance.tenders.filter(t=>ids.has(t.owner)||ids.has(t.target)).map(t=>({id:t.id,owner:firms.find(c=>c.id===t.owner).name,target:firms.find(c=>c.id===t.target).name,remaining:Math.max(0,t.endsTick-s.tick),reserved:t.reserved,incoming:ids.has(t.target)&&!ids.has(t.owner)}));
 const goals=paceGoals(s).map(([id,name,yes,desc])=>({id,name,done:s.milestones.includes(id)||yes,desc,optional:id==='pace-sensor'}));
 return{unlocked:s.tick>=HQ_UNLOCK,tick:s.tick,rows,profit:groupProfit(s),window:s.pace.groupWindow.length,sum:s.pace.groupWindow.reduce((a,b)=>a+b,0),observed:s.pace.groupObserved,alerts,tenders,deferred:s.finance.deferredLoss,loss:s.finance.loss,goals,next:goals.find(g=>!g.done&&!g.optional)||null};
}
