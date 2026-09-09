// Run with PLAYWRIGHT_MODULE pointing to an existing Playwright installation.
// Requires the viewer on 8000 and configured inference service on 8081.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1200,height:850}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('requestfailed', r => console.error('Request failed:',r.url(),r.failure()));
    page.on('console', m => {if(m.type()==='error') console.error(m.text());});
    await page.goto('http://127.0.0.1:8000/tumor-intseg-local.html');
    await page.waitForFunction(() => typeof document.getElementById('connect').onclick === 'function');
    await page.click('#connect');
    await page.waitForFunction(() => !document.getElementById('connect').disabled);
    assert.match(await page.locator('#status').innerText(), /Place a seed/);
    await page.click('#place');
    await page.locator('canvas').click({position:{x:300,y:250}});
    assert.match(await page.locator('#seed').innerText(), /Seed: \d/);
    const maskResponse = page.waitForResponse(r => r.url().endsWith('/api/v1/segment') && r.request().method()==='POST');
    await page.click('#run');
    await page.waitForFunction(() => !document.getElementById('run').disabled);
    const status = await page.locator('#status').innerText();
    assert.match(status, /Mask displayed:/);
    const response = await maskResponse;
    const result = {foreground:Number(response.headers()['x-mask-voxels']),bytes:Number(response.headers()['content-length'])};
    assert.equal(response.status(),200);
    assert.ok(result.foreground > 0);
    assert.ok(result.bytes > 0);
    assert.deepEqual(errors, []);
    if(process.env.SMOKE_SCREENSHOT) await page.screenshot({path:process.env.SMOKE_SCREENSHOT});
    console.log(JSON.stringify({status,...result}));
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});
