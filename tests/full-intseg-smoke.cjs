const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1800,height:950}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:8000/tumor-intseg.html');
    const frame = page.frameLocator('#viewer');
    await frame.locator('#status').filter({hasText:'Case 1 (1/134)'}).waitFor({timeout:60000});
    for (const [axis,value] of [['x','50'],['y','132'],['z','72']]) {
      await frame.locator(`#seed-${axis}`).fill(value);
      await frame.locator(`#seed-${axis}`).dispatchEvent('change');
    }
    const pending = page.waitForResponse(r => r.url().endsWith('/segment-world') && r.request().method()==='POST');
    await frame.locator('#btn-run-interactive').click();
    const response = await pending;
    assert.equal(response.status(),200);
    assert.equal(response.request().postDataJSON().case_id,'1_001');
    assert.ok(Number(response.headers()['x-mask-voxels'])>0);
    await frame.locator('#run-state').filter({hasText:'Seeded seg loaded'}).waitFor();
    console.log(await frame.locator('#run-state').innerText());
    for(const [id,label] of [['btn-prob','Prob map'],['btn-gt','GT'],['btn-pred','Pred'],['btn-seeded','Seeded seg']]) {
      await frame.locator('#'+id).click();
      await frame.locator('#info-overlay').filter({hasText:label}).waitFor();
    }
    await frame.locator('#opacity-slider').fill('0.25');
    await frame.locator('#opacity-slider').dispatchEvent('input');
    await frame.locator('#btn-rgb').click();
    await frame.locator('#info-overlay').filter({hasText:'Base: grayscale | Overlay: Seeded seg'}).waitFor();
    await frame.locator('#status').filter({hasText:'Case 1 (1/134)'}).waitFor();
    assert.equal(await frame.locator('#btn-seeded').isEnabled(),true);
    await frame.locator('#btn-rgb').click();
    await frame.locator('#info-overlay').filter({hasText:'Base: RGB | Overlay: Seeded seg'}).waitFor();
    assert.deepEqual(errors,[]);
    console.log('PASS: world-space seed, real mask, overlays, opacity control, RGB/grayscale preservation');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
