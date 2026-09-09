const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const page=await browser.newPage();
    await page.goto('http://127.0.0.1:8000/tumor-intseg.html');
    const frame=await (await page.locator('#viewer').elementHandle()).contentFrame();
    await frame.locator('#status').filter({hasText:'Case 1 (1/134)'}).waitFor({timeout:60000});
    for(const width of [1920,1366,1024,720]){
      await page.setViewportSize({width,height:900});
      const result=await frame.evaluate(()=>{
        const ids=['toolbar','tool-bar','status','gl'];
        const sizes=()=>ids.map(id=>document.getElementById(id).getBoundingClientRect().height);
        const before=sizes();
        for(const id of ['status','run-state','runner-state'])document.getElementById(id).textContent='Long status message '.repeat(40);
        const after=sizes();
        const el=document.getElementById('seed-x'),style=getComputedStyle(el);
        const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font=style.font;
        return {before,after,fieldWidth:el.clientWidth,textWidth:ctx.measureText('9999').width+parseFloat(style.paddingLeft)+parseFloat(style.paddingRight),wrap:getComputedStyle(document.getElementById('toolbar')).flexWrap};
      });
      assert.deepEqual(result.before,result.after);
      assert.ok(result.fieldWidth>=result.textWidth);
      assert.equal(result.wrap,'nowrap');
      assert.ok(result.after[3]>300);
      console.log(JSON.stringify({width,...result}));
    }
    console.log('PASS: four-digit fields and stable canvas height with long messages at four widths');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
