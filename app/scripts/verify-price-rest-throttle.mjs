import assert from 'node:assert/strict';
import { ProvisionerBitrixClient } from './bitrix24/client.ts';
const original = globalThis.fetch;
const traces = new Map(), active = new Map(), maxActive = new Map();
const reply = (status, data) => new Response(JSON.stringify(data), {status});
const client = (host, retries=3, timeout=3000) => new ProvisionerBitrixClient(`https://${host}.invalid/rest/test`,timeout,retries);
const sleep = ms => new Promise(r=>setTimeout(r,ms));
let count = 0;
function pass(name){count++;console.log('PASS '+name);}
globalThis.fetch = async (url, init) => {
  const u = new URL(url); assert.ok(u.hostname.endsWith('.invalid'));
  assert.equal(init.redirect,'error');
  const host=u.hostname; const method=u.pathname.split('/').pop().replace(/\.json$/,'');
  const params=JSON.parse(init.body); const list=traces.get(host)??[];
  const record={method,params,start:performance.now()}; list.push(record);traces.set(host,list);
  active.set(host,(active.get(host)??0)+1); maxActive.set(host,Math.max(maxActive.get(host)??0,active.get(host)));
  try {
    if(host==='timeout.invalid') await new Promise((_,reject)=>init.signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')),{once:true}));
    await sleep(15);
    if((host==='read-limit.invalid' && list.length===1) || (host==='write-limit.invalid' && method==='catalog.price.update')) return reply(503,{error:'QUERY_LIMIT_EXCEEDED'});
    if(host==='operation.invalid') return reply(429,{error:'OPERATION_TIME_LIMIT'});
    if(host==='unknown.invalid') return reply(500,{error:'FAIL'});
    if(host==='pagination.invalid') return reply(200,params.start===0?{result:{items:[1]},next:50}:{result:{items:[2]}});
    return reply(200,{result:true});
  } finally {record.end=performance.now();active.set(host,active.get(host)-1);}
};
try {
  await Promise.all([
    (async()=>{
      const a=client('shared'), b=client('shared'), c=client('shared');
      await Promise.all([a.call('catalog.product.list'),b.call('catalog.price.list'),c.call('catalog.price.update',{id:1,fields:{price:2}})]);
      const t=traces.get('shared.invalid');assert.equal(t.length,3);assert.equal(maxActive.get('shared.invalid'),1);
      for(let i=1;i<t.length;i++) assert.ok(t[i].start-t[i-1].end>=1099);
      assert.deepEqual(t[2].params,{id:1,fields:{price:2}});pass('shared queue across three clients; >=1100ms gap; unchanged write payload');
    })(),
    (async()=>{
      const c=client('pagination');assert.deepEqual(await c.listAll('catalog.product.list',{},r=>r.items),[1,2]);
      const t=traces.get('pagination.invalid');assert.equal(t.length,2);assert.ok(t[1].start-t[0].end>=1099);pass('pagination uses same throttle');
    })(),
    (async()=>{
      await client('read-limit').call('catalog.price.list');const t=traces.get('read-limit.invalid');assert.equal(t.length,2);assert.ok(t[1].start-t[0].end>=9999);pass('rate-limited read retried after shared cooldown');
    })(),
    (async()=>{
      const c=client('write-limit',3);await assert.rejects(c.call('catalog.price.update'),/QUERY_LIMIT_EXCEEDED/);
      assert.equal(traces.get('write-limit.invalid').length,1);pass('rate-limited write never retried even with retries configured');
      await client('write-limit').call('catalog.price.list');const t=traces.get('write-limit.invalid');assert.equal(t.length,2);assert.ok(t[1].start-t[0].end>=9999);pass('write failure cools down other clients on same portal');
    })(),
    (async()=>{await assert.rejects(client('timeout',3,50).call('catalog.price.update'),/REQUEST_TIMEOUT/);assert.equal(traces.get('timeout.invalid').length,1);pass('write timeout never retried');})(),
    (async()=>{await assert.rejects(client('operation').call('catalog.price.list'),/OPERATION_TIME_LIMIT/);assert.equal(traces.get('operation.invalid').length,1);pass('operation-time limit stops instead of retrying');})(),
    (async()=>{await assert.rejects(client('unknown').call('crm.deal.update'),/FAIL/);assert.equal(traces.get('unknown.invalid').length,1);pass('unlisted method never retried');})(),
  ]);
  console.log(`${count}/8 PASS - mocked fetch, no network or writes.`);
} finally {globalThis.fetch=original;}
