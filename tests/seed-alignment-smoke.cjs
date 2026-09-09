const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1800,height:950}});
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:8000/tumor-intseg.html');
    const frame = await (await page.locator('#viewer').elementHandle()).contentFrame();
    await frame.locator('#status').filter({hasText:'Case 1 (1/134)'}).waitFor({timeout:60000});
    // Test-only instrumentation captures the actual viewer, without modifying served code.
    await frame.evaluate(async () => {
      const {Niivue}=await import('https://cdn.jsdelivr.net/npm/@niivue/niivue@0.50.0/+esm');
      const draw=Niivue.prototype.drawScene;
      Niivue.prototype.drawScene=function(...args){window.testNV=this;return draw.apply(this,args);};
    });
    await frame.locator('canvas').click({position:{x:300,y:250}});
    for(const point of [[65,102,84],[35,140,100]]) {
      const expectedMM=await frame.evaluate(point=>{
        const nv=window.testNV; nv.scene.crosshairPos=nv.vox2frac(point); nv.drawScene();
        return Array.from(nv.frac2mm(nv.scene.crosshairPos,0,true)).slice(0,3);
      },point);
      await frame.click('#btn-place-seed');
      assert.equal(await frame.locator('#seed-state').innerText(),`Seed: (${point.join(', ')})`);
      const marker=await frame.evaluate(()=>{
        const nv=window.testNV,d=nv.back.dims,p=[];
        nv.drawBitmap.forEach((v,i)=>{if(v)p.push([i%d[1],Math.floor(i/d[1])%d[2],Math.floor(i/(d[1]*d[2]))]);});
        return {count:p.length,center:[0,1,2].map(a=>p.reduce((sum,v)=>sum+v[a],0)/p.length)};
      });
      assert.deepEqual(marker.center,point); assert.equal(marker.count,33);
      const pending=page.waitForResponse(r=>r.url().endsWith('/segment-world')&&r.request().method()==='POST');
      await frame.click('#btn-run-interactive'); const response=await pending;
      assert.equal(response.status(),200);
      const sent=response.request().postDataJSON().seed_mm;
      sent.forEach((v,i)=>assert.ok(Math.abs(v-expectedMM[i])<0.001));
      await frame.locator('#run-state').filter({hasText:'Seeded seg loaded'}).waitFor();
      await frame.evaluate(()=>{window.testNV.moveCrosshairInVox(5,0,0);});
      assert.equal(await frame.locator('#seed-state').innerText(),`Seed: (${point.join(', ')})`);
      console.log(JSON.stringify({point,marker,seed_mm:sent}));
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: immediate placement, centered spherical marker, matching world request, fixed seed after crosshair moves');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
