import test from 'node:test';
import assert from 'node:assert/strict';
import {monitorLiveService} from '../live-status.js';

const ready = {state:'available', ready:true, gpu:{state:'ready', age_seconds:1}, case_ids:['example']};
const response = (body=ready, status=200, extra={}) => new Response(JSON.stringify(body), {status, headers:{'X-API-Version':'1',...extra}});
const flush = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  const window = new EventTarget(), document = new EventTarget(), timers = new Map();
  document.hidden = false;
  let time = 1000, id = 0, calls = 0;
  const env = Object.assign(window, {document, navigator:{onLine:true}, Date:{now:()=>time},
    fetch:async()=>{calls++;return response();},
    setTimeout:(fn,delay)=>{timers.set(++id,{fn,due:time+delay});return id;},
    clearTimeout:id=>timers.delete(id),
    setInterval:(fn,delay)=>{timers.set(++id,{fn,due:time+delay,interval:delay});return id;},
    clearInterval:id=>timers.delete(id)});
  const changes=[], monitor=monitorLiveService('https://api.example',s=>changes.push(s),env);
  return {env,monitor,changes,calls:()=>calls,advance(ms,runTimers=true){
    time+=ms;
    if(runTimers)for(const [key,timer] of [...timers])if(timer.due<=time){
      if(timer.interval)timer.due=time+timer.interval;else timers.delete(key);
      timer.fn();
    }
  }};
}

test('ready expires; polling detects outage and recovers', async t=>{
  const f=fixture();t.after(()=>f.monitor.stop());await flush();
  assert.equal(f.monitor.current().ready,true);
  f.advance(16000,false);assert.equal(f.monitor.current().ready,false);
  f.env.fetch=async()=>response({},503);f.advance(1);await flush();
  assert.equal(f.monitor.current().state,'disconnected');
  f.env.fetch=async()=>response();f.advance(10000);await flush();
  assert.equal(f.monitor.current().ready,true);
});

test('hidden tabs stop polling and immediately recheck when shown', async t=>{
  const f=fixture();t.after(()=>f.monitor.stop());await flush();
  f.env.document.hidden=true;f.env.document.dispatchEvent(new Event('visibilitychange'));
  const count=f.calls();f.advance(600000);await flush();
  assert.equal(f.calls(),count);assert.equal(f.monitor.current().ready,false);
  f.env.document.hidden=false;f.env.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(f.monitor.current().ready,false);await flush();
  assert.equal(f.monitor.current().ready,true);assert.equal(f.calls(),count+1);
});

test('old successful responses cannot overwrite an offline or resumed state', async t=>{
  const f=fixture();t.after(()=>f.monitor.stop());await flush();
  let finish;f.env.fetch=()=>new Promise(resolve=>{finish=resolve;});
  const old=f.monitor.check();
  f.env.navigator.onLine=false;f.env.dispatchEvent(new Event('offline'));
  finish(response());await old;
  assert.equal(f.monitor.current().state,'browser-offline');
  f.env.navigator.onLine=true;f.env.fetch=async()=>response();f.env.dispatchEvent(new Event('pageshow'));
  await flush();assert.equal(f.monitor.current().ready,true);
});

test('wall-clock expiry rejects a response received after sleep', async t=>{
  const f=fixture();t.after(()=>f.monitor.stop());await flush();
  let finish;f.env.fetch=()=>new Promise(resolve=>{finish=resolve;});
  const pending=f.monitor.check();f.advance(300000,false);finish(response());await pending;
  assert.equal(f.monitor.current().state,'disconnected');
});

test('an unresponsive health request times out and drops ready', async t=>{
  const f=fixture();t.after(()=>f.monitor.stop());await flush();
  f.env.fetch=(_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('Timed out'))));
  const pending=f.monitor.check();f.advance(4000);await pending;
  assert.equal(f.monitor.current().state,'disconnected');
});

test('access failures, GPU failure, old health schemas and rate limits are not ready', async t=>{
  const f=fixture();t.after(()=>f.monitor.stop());await flush();
  for(const [body,code,state] of [[{},403,'access-blocked'],[{...ready,ready:false,state:'gpu-unavailable'},200,'gpu-unavailable'],[{state:'available',ready:true},200,'gpu-unavailable']]){
    f.env.fetch=async()=>response(body,code);await f.monitor.check();
    assert.equal(f.monitor.current().ready,false);assert.equal(f.monitor.current().state,state);
  }
  let calls=0;f.env.fetch=async()=>{calls++;return response({},429,{'Retry-After':'60'});};
  await f.monitor.check();f.advance(20000);await flush();await f.monitor.check();
  assert.equal(calls,1);assert.equal(f.monitor.current().state,'limited');
  f.advance(41000);await flush();assert.equal(calls,2);
});
