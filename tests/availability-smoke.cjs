const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1800,height:950}});
  let state='paused';
  await page.route('**/health',route=>state==='offline'?route.abort():route.fulfill({json:{state,ready:state!=='paused',model_loaded:true,case_ids:['1_001'],queued:1}}));
  await page.route('**/api/v1/segment-world',route=>route.fulfill({status:503,json:{detail:'Live inference paused; saved results remain available.'}}));
  await page.goto('http://127.0.0.1:8000/tumor-intseg.html');
  const f=await (await page.locator('#viewer').elementHandle()).contentFrame();
  await f.locator('#status').filter({hasText:'Case 1 (1/134)'}).waitFor({timeout:60000});
  await f.locator('#live-state').filter({hasText:'paused'}).waitFor();
  assert.equal(await f.locator('#btn-run-interactive').isDisabled(),true);
  await f.click('#btn-prob');await f.locator('#info-overlay').filter({hasText:'Prob map'}).waitFor();
  state='offline';await f.locator('#live-state').filter({hasText:'unavailable'}).waitFor();
  assert.equal(await f.locator('#btn-run-interactive').isDisabled(),true);
  await f.click('#btn-gt');await f.locator('#info-overlay').filter({hasText:'GT'}).waitFor();
  state='busy';await f.locator('#live-state').filter({hasText:'busy'}).waitFor();
  await f.click('#btn-place-seed');await f.click('#btn-run-interactive');
  await f.locator('#run-state').filter({hasText:'saved results remain usable'}).waitFor();
  assert.match(await f.locator('#info-overlay').innerText(),/GT/);
  state='available';await f.locator('#live-state').filter({hasText:'Live GPU available'}).waitFor();
  assert.equal(await f.locator('#btn-run-interactive').isEnabled(),true);
  assert.equal(await page.locator('a[href="https://michaelzenkay.com/tumor-seg-demo.html"]').count(),1);
  console.log('PASS: paused/offline disable inference, saved overlays still work, busy accepts attempt, failure preserves overlay, automatic recovery');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
