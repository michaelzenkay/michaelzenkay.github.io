import {monitorLiveService, renderLiveStatus} from './live-status.js?v=20261013';
const requested=new URLSearchParams(location.search).get('project'),key=Object.hasOwn(PORTFOLIO,requested)?requested:'tumor',p=PORTFOLIO[key],$=id=>document.getElementById(id);
document.title=p.name+' | Michael Z. Liu';
for(const [id,value] of Object.entries({eyebrow:p.eyebrow,title:p.name,description:p.description,try:p.try,summary:p.summary,context:p.context,'methods-title':p.methodsTitle,metric:p.metric,'metric-label':p.metricLabel,'metric-note':p.metricNote,'short-limit':p.shortLimit,'output-type':p.mode,'output-detail':p.modeDetail,'reference-title':p.reference,'reference-detail':p.referenceDetail,'method-text':p.methods,'evidence-text':p.evidence,limits:p.limits,'code-status':p.codeStatus,watch:p.watch,'fallback-summary':p.description}))$(id).textContent=value;
$('viewer').title=p.name+' - interactive viewer';$('source').hidden=!p.code;if(p.code)$('source').href=p.code;$('preview').src=p.image;$('preview').onerror=()=>{$('preview').hidden=true;};
document.querySelector('[data-project="'+key+'"]').setAttribute('aria-current','page');
if(p.materials?.length){$('project-materials').hidden=false;for(const item of p.materials){const link=document.createElement('a');link.className='button';link.href=item.url;link.textContent=item.label+' \u2197';link.title=item.detail;link.target='_blank';link.rel='noopener';$('project-materials').append(link);}}
for(const step of p.pipeline){const li=document.createElement('li');li.textContent=step;$('pipeline').append(li);}
for(const item of p.stack){const li=document.createElement('li');li.textContent=item;$('stack').append(li);}
$('stack').hidden=!p.stack.length;$('short-limit').hidden=!p.shortLimit;$('watch').hidden=!p.watch;
for(const [label,url] of p.references){const li=document.createElement('li'),a=document.createElement('a');a.textContent=label+' \u2197';a.href=url;a.target='_blank';a.rel='noopener';li.append(a);$('references').append(li);}
for(const item of p.methodDetails){const heading=document.createElement('h3');heading.className='small-heading';heading.textContent=item.title;const section=document.createElement('section');section.append(heading);for(const text of item.text.split('\n\n')){const paragraph=document.createElement('p');paragraph.textContent=text;section.append(paragraph);}$('method-details').append(section);}
$('source-note').textContent=p.sourceNote;
for(const [label,url] of p.sourceFiles){const li=document.createElement('li'),a=document.createElement('a');a.textContent=label+' \u2197';a.href=url;a.target='_blank';a.rel='noopener';li.append(a);$('source-files').append(li);}
const order=Object.keys(PORTFOLIO),next=order[(order.indexOf(key)+1)%order.length];$('next-title').textContent=PORTFOLIO[next].name;$('next-link').href='?project='+next;
let connection=0,frameObserver,liveMonitor;
$('demo').dataset.project=key;
function fitKnee(){if(key!=='knee'||document.body.classList.contains('demo-focused'))return;const main=$('viewer').contentDocument?.querySelector('main');if(main)$('viewer').style.height=Math.ceil(main.getBoundingClientRect().height+32)+'px';}
$('viewer').addEventListener('load',()=>{frameObserver?.disconnect();if(key!=='knee')return;try{const main=$('viewer').contentDocument?.querySelector('main');if(main){frameObserver=new ResizeObserver(fitKnee);frameObserver.observe(main);fitKnee();}}catch{/* External deployments retain the full-viewer link. */}});
window.addEventListener('resize',fitKnee);
window.addEventListener('message',event=>{
 const viewer=$('viewer');if(!['heart','knee'].includes(key)||event.source!==viewer.contentWindow||!viewer.getAttribute('src'))return;
 if(event.origin!==new URL(viewer.src).origin||event.data?.type!==key+'-portfolio-size')return;
 const height=event.data.height;if(Number.isFinite(height)&&height>=100&&height<=4000)viewer.style.height=Math.ceil(height)+'px';
});
function focusDemo(value){document.body.classList.toggle('demo-focused',value);$('focus-demo').setAttribute('aria-pressed',String(value));$('focus-demo').textContent=value?'Exit focus':'Focus demo';if(!value){$('focus-demo').focus();fitKnee();}}
$('focus-demo').onclick=()=>focusDemo(!document.body.classList.contains('demo-focused'));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('demo-focused'))focusDemo(false);});
async function connect(){liveMonitor?.stop();const token=++connection;$('service-status').textContent='Checking viewer\u2026';$('retry').disabled=true;try{
 const r=await fetch('runtime.json',{cache:'no-store',signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error('Demo services are not configured.');const runtime=await r.json(),service=runtime[key];if(token!==connection)return;
 if(!service?.ready)throw Error(service?.message||'Viewer service or prepared data is unavailable.');
 $('live-viewer').hidden=!service.liveUrl;if(service.liveUrl){$('live-viewer').href=service.liveUrl;$('live-viewer').textContent=service.authentication==='access'?'Open live segmentation (sign-in) \u2197':'Open live segmentation \u2197';}
 const url=new URL(service.url,location.href);if(!['http:','https:'].includes(url.protocol))throw Error('Viewer address is not supported.');
 if(key==='heart')url.searchParams.set('presentation','portfolio');
 if(key==='tumor'&&service.mode==='saved'){$('output-type').textContent='Saved model outputs';$('output-detail').textContent='Inspect saved predictions and annotations. Live seeded segmentation needs a connected inference service.';$('try').textContent='Start the tour and inspect the saved MRI, masks and measurements. Live seed inference will be connected separately.';}
 $('viewer').src=url.href;$('viewer').hidden=false;$('fallback').hidden=true;$('full-viewer').href=url.href;$('full-viewer').hidden=false;$('focus-demo').hidden=false;
 $('service-status').textContent=key==='tumor'?(service.mode==='saved'?(service.liveUrl?'Saved viewer \u00b7 live segmentation opens separately':'Saved segmentation demo \u00b7 live inference offline'):'Checking live connection...'):key==='heart'?'Saved model outputs \u00b7 interactive review':'Saved V4 scores \u00b7 companion anatomy predictions';$('service-status').classList.add('ready');
 if(key==='tumor'&&service.mode==='live'&&service.api){
  liveMonitor=monitorLiveService(service.api,state=>{if(token===connection)renderLiveStatus($('service-status'),state);});
 }
}catch(error){if(token!==connection)return;if(document.body.classList.contains('demo-focused'))focusDemo(false);$('viewer').hidden=true;$('viewer').removeAttribute('src');$('fallback').hidden=false;$('full-viewer').hidden=true;$('focus-demo').hidden=true;$('live-viewer').hidden=true;$('service-status').classList.remove('ready');$('service-status').textContent='Preview unavailable';$('unavailable').textContent=error.message+' The overview, methods and evidence are still available.';}finally{if(token===connection)$('retry').disabled=false;}}
function renderResearch(){
 $('metric').replaceChildren();$('metric').classList.add('horizon-values');
 for(const row of p.research.rows){const value=document.createElement('span');value.textContent=row.years+'y '+row.historical_auc.toFixed(3);$('metric').append(value);}
 $('demo').hidden=true;
 const tab=document.querySelector('.tabs a[href="#demo"]');tab.href='#results';tab.textContent='Results';
 document.querySelector('.demo-intro .eyebrow').textContent='Internal validation';
 document.querySelector('.demo-intro h2').textContent='Performance by prediction horizon';
 document.querySelector('#methods h2').textContent='Four views to cumulative risk';
 document.querySelector('.claim-key').setAttribute('aria-label','How to read these results');
 const panel=$('results');panel.hidden=false;
 const figure=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');
 img.src=p.image;img.alt='Historical AUC at each prediction horizon; exact values and sample counts are in the adjacent table.';
 caption.textContent='Reported point estimates. Matched predictions are unavailable for confidence intervals.';figure.append(img,caption);
 const detail=document.createElement('div'),table=document.createElement('table');
 table.innerHTML='<caption>Eligible validation exams by horizon</caption><thead><tr><th scope="col">Year</th><th scope="col">Exams</th><th scope="col">Positive</th><th scope="col">Negative</th><th scope="col">AUC</th></tr></thead>';
 const body=document.createElement('tbody');for(const row of p.research.rows){const tr=document.createElement('tr');for(const [i,value] of [row.years,row.eligible_exams,row.positive_exams,row.negative_exams,row.historical_auc.toFixed(3)].entries()){const cell=document.createElement(i===0?'th':'td');if(i===0)cell.scope='row';cell.textContent=value;tr.append(cell);}body.append(tr);}table.append(body);
 const note=document.createElement('p');note.className='subtle';note.textContent='Horizons overlap; these counts are not independent cohorts and should not be summed. Five-year evaluation: 137 positive exams and one negative, not featured because the negative sample is too small.';
 detail.append(table,note);panel.append(figure,detail);
}
$('retry').onclick=connect;if(p.research)renderResearch();else connect();
