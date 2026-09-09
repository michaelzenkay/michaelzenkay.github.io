const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1800,height:950}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8000/tumor-intseg.html');
  const f=await (await page.locator('#viewer').elementHandle()).contentFrame();
  await f.locator('#status').filter({hasText:'Case 1 (1/134)'}).waitFor({timeout:60000});
  await f.evaluate(async()=>{
   const {Niivue}=await import('https://cdn.jsdelivr.net/npm/@niivue/niivue@0.50.0/+esm');
   const draw=Niivue.prototype.drawScene;
   Niivue.prototype.drawScene=function(...args){window.testNV=this;return draw.apply(this,args);};
  });
  await f.locator('canvas').click({position:{x:300,y:250}});
  await f.click('#btn-place-seed');
  await f.locator('#status').filter({hasText:'Crop boundary ready'}).waitFor();
  const check=async()=>f.evaluate(()=>{
   const v=window.testNV.volumes.filter(v=>v.name==='crop-boundary.nii.gz');
   return {count:v.length,foreground:v[0]?Array.from(v[0].img).filter(x=>x>0).length:0};
  });
  assert.equal((await check()).count,0);
  await f.click('#btn-run-interactive');
  await f.locator('#run-state').filter({hasText:'Seeded seg loaded'}).waitFor();
  const first=await check();assert.equal(first.count,1);assert.ok(first.foreground>0);
  for(const [button,label] of [['btn-prob','Prob map'],['btn-gt','GT'],['btn-pred','Pred']]) {
    await f.click('#'+button);await f.locator('#info-overlay').filter({hasText:label}).waitFor();
    assert.equal((await check()).count,0);
    await f.click('#btn-seeded');await f.locator('#info-overlay').filter({hasText:'Seeded seg'}).waitFor();
    assert.deepEqual(await check(),first);
  }
  assert.equal(await f.locator('#metrics-bar .m-label[title="Training label"]').count(),5);
  await f.click('#btn-rgb');await f.locator('#info-overlay').filter({hasText:'Base: grayscale'}).waitFor();
  await f.locator('#status').filter({hasText:'Case 1 (1/134)'}).waitFor();
  assert.deepEqual(await check(),first);
  await f.click('#btn-clear-seed');assert.equal((await check()).count,0);
  assert.deepEqual(errors,[]);
  console.log('PASS: crop visible only on seeded overlay, retained across base changes, cleared with seed; five training-label captions',first);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
