// Ephemeral policy attached only to a private simulation copy, never serialized.
const policies=new WeakMap();
export const setPlanningPolicy=(s,fn)=>policies.set(s,fn);
export function planningCapacity(s,c,n,normal){return policies.get(s)?.(c,n,normal)??normal;}
export const initPlanning=s=>{s.planning??={version:1,plans:[]};};
export function validatePlanning(s){let a=s.planning;if(a?.version!==1||!Array.isArray(a.plans)||a.plans.length>1)throw Error('경기 계획 저장 오류');for(let p of a.plans){if(!p||typeof p.owner!=='string'||!['hanbit','cheolwon'].includes(p.city)||typeof p.product!=='string'||!Array.isArray(p.phases)||p.phases.length!==4||p.phases.some(v=>!v||!['keep','pause','target'].includes(v.mode)||!Number.isSafeInteger(v.target)||v.target<0||v.target>200)||!Array.isArray(p.nodes)||p.nodes.length>40||p.nodes.some(n=>!n||typeof n.id!=='string'||typeof n.kind!=='string'||typeof n.product!=='string')||!Number.isSafeInteger(p.sinceTick)||p.sinceTick<0||p.sinceTick>s.tick)throw Error('경기 계획 설정 오류');}}
