import {settleOffline} from './offline.mjs?v=0.15.0';
self.onmessage=async e=>{try{let result=await settleOffline(e.data.state,e.data.now,value=>self.postMessage({type:'progress',value}));self.postMessage({type:'done',...result});}catch(error){self.postMessage({type:'error',message:error.message});}};
