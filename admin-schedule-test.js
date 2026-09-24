#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('<!-- admin schedule 2026-09-24 v=sched1'), 'schedule tip marker');
assert.ok(html.includes('<!-- admin schedule mobile scroll 2026-09-24 v=sched1m'), 'sched1m mobile scroll comment');
assert.ok(html.includes('<!-- STANDING Mo rule v=sched1m'), 'standing Mo rule ships on this tip');
assert.ok(html.includes('Probe FAILS Ready if phone scroll/swipe misses on wide UI'), 'desktop-only pass is not Ready');
assert.ok(html.includes('Schedule week = Mon–Sun'), 'standing rule names the week grid');
assert.ok(html.includes('v=sched1m'), 'sched1m marker');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-24-sched1m">'), 'admin-build meta');
assert.ok(/\.sched-scroll\{[^}]*overflow-x:auto[^}]*-webkit-overflow-scrolling:touch[^}]*touch-action:pan-x pan-y/.test(html), 'week grid scroller pans on touch');
assert.ok(html.includes('min-width:max(100%,52rem)'), 'day columns stay wider than a phone');
assert.ok(html.includes('#tab_schedule .sched-scroll{max-width:calc(100vw - 28px'), 'phone caps the week scroller to the viewport');
assert.ok(html.includes('#schedEmpty .btn{max-width:100%;white-space:normal'), 'No patterns notice wraps instead of covering the grid');
const emptyAt = html.indexOf('id="schedEmpty"');
const scrollAt = html.indexOf('class="sched-scroll" id="schedScroll"');
assert.ok(emptyAt > 0 && scrollAt > emptyAt, 'No patterns notice sits above the week scroller');
assert.ok(html.indexOf('<table class="sched-grid">', scrollAt) > scrollAt, 'grid table is inside the week scroller');
assert.ok(html.includes('<!-- admin-role-password 2026-09-24 v=adminpw1 Ace admin_set_role_password -->'), 'adminpw1 marker stays');
assert.ok(html.includes('No patterns yet — Add usual pattern'), 'empty-state copy');

const nurseAt = html.indexOf('id="nav_nurse"');
const schedAt = html.indexOf('id="nav_schedule"');
assert.ok(nurseAt > 0 && schedAt > nurseAt, 'Schedule nav follows Nurse');
assert.ok(html.slice(nurseAt, schedAt).indexOf('id="nav_completes"') < 0, 'Schedule sits before Completed intakes');
assert.ok(html.includes('onclick="showTab(\'schedule\')"'), 'nav uses showTab(schedule)');
assert.ok(html.includes("if(tab==='schedule')loadAdminSchedule();"), 'showTab loads the schedule');
assert.ok(html.includes('id="tab_schedule"') && html.includes('id="tab_nurse"'), 'schedule is its own tab');
assert.ok(html.indexOf('id="tab_timesheets"') < html.indexOf('id="tab_schedule"'), 'timesheets desk stays');

const start = html.indexOf('// admin schedule v=sched1');
const end = html.indexOf('// end admin schedule v=sched1');
assert.ok(start > 0 && end > start, 'schedule script block');
const src = html.slice(start, end);
assert.ok(!/SHEETS_URL/.test(src), 'schedule does not call Sheets');
assert.ok(!/\/exec/.test(src), 'schedule does not post /exec');
assert.ok(!/evercare_sched_v1/.test(src), 'browser stub key is gone');
assert.ok(!/localStorage/.test(src), 'schedule does not touch localStorage');
assert.ok(!/Ace will replace/.test(src), 'stub copy is gone');
assert.ok(!/sandata|evv|contera/i.test(src), 'no EVV chips in schedule script');
assert.ok(!/p_kind:\s*'open'/.test(src) && !/p_kind:\s*'exception'/.test(src), 'writes do not send stub kinds');
assert.ok(src.includes("sbRestRpc('list_schedule_week'") && src.includes('p_week_start'), 'week RPC');
assert.ok(src.includes("sbRestRpc('upsert_schedule_pattern'") && src.includes('p_usual_aide_id'), 'pattern RPC');
assert.ok(src.includes("sbRestRpc('upsert_schedule_exception'") && src.includes('p_on_date') && src.includes('p_kind'), 'exception RPC');
assert.ok(src.includes("sbRestRpc('delete_schedule_pattern'") && src.includes('p_weekday'), 'delete pattern RPC');
assert.ok(src.includes('call_off') && src.includes('cover') && src.includes('hours_override') && src.includes('aide_override') && src.includes("'clear'"), 'exception kinds');

const mem = {};
const toasts = [];
const rpc = [];
const els = {};
function makeEl(id){
  const el = {
    id:id,
    hidden:false,
    innerHTML:'',
    textContent:'',
    value:'',
    disabled:false,
    checked:false,
    dataset:{},
    style:{},
    setAttribute:function(k,v){this[k]=v;},
    getAttribute:function(k){return this[k];},
    addEventListener:function(){},
    scrollIntoView:function(){this.scrolled=true;},
    focus:function(){}
  };
  els[id]=el;
  return el;
}
['schedWeekLabel','schedSourceNote','schedNoClients','schedEmpty','schedScroll','schedHead','schedBody','schedPanel','schedPanelTitle','schedUsualFields','schedExceptionMeta','schedCalloffWrap','schedClearBtn','schedDeleteUsualBtn','schedSaveBtn','schedClientSel','schedWeekdaySel','schedAideSel','schedHours','schedCalloff','schedNote','schedWhen','schedUsualAide','schedFilterAll','schedFilterOpen','schedFilterCalloff','schedSearch'].forEach(makeEl);

const sandbox = {
  allClients:[],
  loadedAidesList:[],
  allAidesForAssign:[],
  currentAdminRole:'Admin',
  localStorage:{
    getItem:function(k){return Object.prototype.hasOwnProperty.call(mem,k)?mem[k]:null;},
    setItem:function(k,v){mem[k]=String(v);},
    removeItem:function(k){delete mem[k];}
  },
  document:{
    getElementById:function(id){
      if(els[id])return els[id];
      if(els.schedBody&&String(els.schedBody.innerHTML).indexOf('id="'+id+'"')>=0){
        return {scrollIntoView:function(){this.scrolled=true;}};
      }
      return null;
    }
  },
  showTempMsg:function(msg){toasts.push(String(msg));},
  logActivity:function(){},
  sbUuid:function(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''));},
  evercareSbEnabled:function(){return true;},
  readSbSession:function(){return null;},
  sbRestRpc:function(name, body){rpc.push({name:name, body:body}); return Promise.resolve({ok:true, data:{patterns:[], exceptions:[]}});},
  sbRestGet:function(){return Promise.resolve({ok:false, status:404, error:'missing'});},
  apiGetCached:async function(){return {success:false};},
  Intl:Intl,
  Date:Date,
  Number:Number,
  String:String,
  Math:Math,
  JSON:JSON,
  isFinite:isFinite,
  Promise:Promise
};
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

assert.strictEqual(sandbox.schedIsoDate(sandbox.schedMondayOf(new Date(2026,8,24))), '2026-09-21');
assert.strictEqual(sandbox.schedIsoDate(sandbox.schedMondayOf(new Date(2026,8,21))), '2026-09-21');
assert.strictEqual(sandbox.schedIsoDate(sandbox.schedMondayOf(new Date(2026,8,27))), '2026-09-21');
assert.strictEqual(sandbox.schedWeekdayFromIso('2026-09-21'), 1);
assert.strictEqual(sandbox.schedWeekdayFromIso('2026-09-27'), 7);
assert.strictEqual(sandbox.schedAddDays('2026-09-21', 7), '2026-09-28');
assert.strictEqual(sandbox.schedFormatHours(4), '4h');
assert.strictEqual(sandbox.schedFormatHours(4.5), '4.5h');

sandbox.schedApplyWeek({
  week_start:'2026-09-24',
  clients:[{client_id:'ada', client_name:'Ada Client', days:{'1':{source:'empty', hours:null, aide_id:null}}}]
});
assert.strictEqual(sandbox.schedWeekStart, '2026-09-21', 'server week snaps to Monday');
sandbox.schedPaint();
assert.strictEqual(els.schedScroll.hidden, false, 'empty patterns still show the grid');
assert.strictEqual(els.schedEmpty.hidden, false, 'add usual pattern stays available');
assert.ok(els.schedBody.innerHTML.includes('Open'), 'empty day reads Open');

sandbox.schedApplyWeek({
  week_start:'2026-09-21',
  week_end:'2026-09-27',
  clients:[
    {
      client_id:'ada',
      client_name:'Ada Client',
      days:{
        '1':{hours:4, aide_id:'a1', aide_username:'sara', aide_name:'Sara', source:'pattern', exception_kind:null, note:''},
        '2':{hours:null, aide_id:null, aide_name:null, source:'empty', exception_kind:null, note:''},
        '3':{hours:4, aide_id:'a1', aide_name:'Sara', source:'exception', exception_kind:'call_off', note:'sick'}
      }
    },
    {
      client_id:'bea',
      client_name:'Bea Client',
      days:{
        '2':{hours:3, aide_id:'a1', aide_name:'Sara', source:'exception', exception_kind:'cover', note:''}
      }
    }
  ]
});
assert.strictEqual(sandbox.schedUsual.length, 1);
assert.strictEqual(sandbox.schedExceptions.length, 2);
assert.strictEqual(sandbox.schedExceptions[0].kind, 'call_off');
assert.strictEqual(sandbox.schedExceptions[0].on_date, '2026-09-23');
assert.strictEqual(sandbox.schedExceptions[1].kind, 'cover');
assert.strictEqual(sandbox.schedUseWeekRows, true);
assert.strictEqual(sandbox.schedClients().length, 2, 'grid lists every client from the week RPC');

sandbox.loadedAidesList=[{id:'a1', username:'sara', name:'Sara'}];
sandbox.schedWeekStart='2026-09-21';
sandbox.schedFilterOpen=false;
sandbox.schedFilterCalloff=false;
const allRows=sandbox.schedBuildRows();
assert.strictEqual(allRows.length, 2);
assert.strictEqual(allRows[0].hide, false);
const mon=allRows[0].cells[0];
const tue=allRows[0].cells[1];
const wed=allRows[0].cells[2];
assert.strictEqual(mon.state, 'usual');
assert.strictEqual(sandbox.schedCellText(mon), 'Sara 4h');
assert.strictEqual(tue.state, 'open');
assert.strictEqual(sandbox.schedCellText(tue), '');
assert.strictEqual(wed.state, 'calloff');
assert.strictEqual(sandbox.schedCellText(wed), 'Sara 4h');
assert.strictEqual(allRows[1].cells[1].state, 'exception', 'cover paints as an assigned exception');
assert.strictEqual(sandbox.schedCellText(allRows[1].cells[1]), 'Sara 3h');

sandbox.schedFilterOpen=true;
sandbox.schedFilterCalloff=false;
const openRows=sandbox.schedBuildRows().filter(function(r){return !r.hide;});
assert.ok(openRows.length===2, 'both clients have an open day');
assert.strictEqual(openRows[0].cells[0].shrunk, true, 'staffed Monday shrinks when Open is on');
assert.strictEqual(openRows[0].cells[1].shrunk, false, 'open Tuesday stays');
assert.strictEqual(openRows[0].cells[2].shrunk, true, 'call-off shrinks under the Open filter');

sandbox.schedFilterOpen=false;
sandbox.schedFilterCalloff=true;
const callRows=sandbox.schedBuildRows();
assert.strictEqual(callRows[0].hide, false);
assert.strictEqual(callRows[1].hide, true, 'Bea has no call-off');
assert.strictEqual(callRows[0].cells[2].shrunk, false);
assert.strictEqual(callRows[0].cells[0].shrunk, true);

sandbox.schedFilterOpen=true;
sandbox.schedFilterCalloff=true;
const both=sandbox.schedBuildRows();
assert.strictEqual(both[0].hide, false);
assert.strictEqual(both[1].hide, false, 'Bea stays because Tuesday is open');
assert.strictEqual(both[0].cells[0].shrunk, true);
assert.strictEqual(both[0].cells[1].shrunk, false);
assert.strictEqual(both[0].cells[2].shrunk, false);
assert.strictEqual(both[1].cells[1].shrunk, true, 'reassigned cell shrinks when it is not a problem');

sandbox.schedFilterOpen=false;
sandbox.schedFilterCalloff=false;
sandbox.schedLoadError='';
sandbox.schedPaint();
assert.ok(els.schedBody.innerHTML.includes('Sara 4h'), 'grid shows aide and hours');
assert.ok(els.schedBody.innerHTML.includes('is-calloff'), 'call-off cell class');
assert.ok(els.schedBody.innerHTML.includes('is-usual'), 'assigned usual cell');
assert.ok(!/sandata|evv|present|no-show|contera/i.test(els.schedBody.innerHTML), 'grid has no EVV chips');
assert.ok(els.schedBody.innerHTML.includes('>Open<')||els.schedBody.innerHTML.includes('sched-open">Open'), 'empty cell reads Open');
assert.ok(els.schedHead.innerHTML.includes('Mon')&&els.schedHead.innerHTML.includes('Sun'), 'day headers');
assert.strictEqual(els.schedWeekLabel.textContent, 'Sep 21 – Sep 27, 2026');
assert.strictEqual(els.schedSourceNote.textContent, '', 'no stub status line');

sandbox.schedFilterCalloff=true;
els.schedSearch.value='Bea';
sandbox.schedJumpClient();
assert.strictEqual(sandbox.schedJumpId, 'bea');
assert.strictEqual(sandbox.schedFilterCalloff, false, 'search reveals a filtered-out row');
assert.ok(els.schedBody.innerHTML.includes('is-jump'), 'matching row is marked');
assert.ok(els.schedBody.innerHTML.indexOf('Bea Client')>=0);

sandbox.schedOpenCell('ada','2026-09-21',1);
assert.strictEqual(els.schedPanel.hidden, false);
assert.strictEqual(els.schedCalloffWrap.hidden, false, 'cell panel can mark a call-off');
assert.strictEqual(els.schedClearBtn.hidden, false);
sandbox.schedEditor={mode:'usual', clientId:'ada', weekday:1, aideId:'a1', hours:4, note:''};
sandbox.schedPaintPanel();
assert.strictEqual(els.schedCalloffWrap.hidden, true, 'usual panel hides call-off');
assert.strictEqual(els.schedClearBtn.hidden, true, 'usual panel hides clear exception');
assert.strictEqual(els.schedDeleteUsualBtn.hidden, false, 'usual panel can remove the pattern');

async function schedPhoneScroll(){
  if(process.env.SKIP_BROWSER==='1')return;
  let puppeteer;
  try{puppeteer=require('puppeteer-core');}
  catch(e){
    try{puppeteer=require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){
      console.log('admin-schedule browser skipped (no puppeteer-core)');
      return;
    }
  }
  const chrome=process.env.CHROME_PATH||'/usr/bin/google-chrome';
  const http=require('http');
  const server=http.createServer((req,res)=>{
    const urlPath=decodeURIComponent((req.url||'/').split('?')[0]);
    const file=path.normalize(path.join(__dirname, urlPath==='/'?'index.html':urlPath));
    if(!file.startsWith(__dirname)){res.writeHead(403);res.end();return;}
    fs.readFile(file,(err,buf)=>{
      if(err){res.writeHead(404);res.end('missing');return;}
      const ext=path.extname(file);
      const type=ext==='.js'?'text/javascript':ext==='.css'?'text/css':'text/html; charset=utf-8';
      res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});
      res.end(buf);
    });
  });
  await new Promise(function(r){server.listen(0,'127.0.0.1',r);});
  const port=server.address().port;
  const browser=await puppeteer.launch({
    executablePath:chrome,
    headless:'new',
    args:['--no-sandbox','--disable-dev-shm-usage']
  });
  try{
    async function openSchedule(page){
      await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'domcontentloaded',timeout:20000});
      await page.evaluate(function(){
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('adminScreen').classList.add('active');
        document.querySelectorAll('#adminScreen .tab-panel').forEach(function(p){p.classList.remove('active');});
        document.getElementById('tab_schedule').classList.add('active');
        var days={};
        for(var n=1;n<=7;n++)days[String(n)]={hours:null,aide_id:null,source:'empty',exception_kind:null,note:null};
        schedApplyWeek({
          week_start:'2026-09-21',
          week_end:'2026-09-27',
          clients:[{client_id:'bowlax', client_name:'Bowlax', days:days}]
        });
        schedPaint();
      });
    }
    function readGrid(){
      var sc=document.getElementById('schedScroll');
      var empty=document.getElementById('schedEmpty');
      var sun=sc.querySelector('thead th:last-child');
      var heads=[].map.call(sc.querySelectorAll('thead th'), function(th){return th.textContent.replace(/\s+/g,' ').trim();});
      var scBox=sc.getBoundingClientRect();
      var sunBox=sun.getBoundingClientRect();
      var emptyBtn=empty.querySelector('button');
      var emptyBox=emptyBtn.getBoundingClientRect();
      var bar=document.querySelector('#tab_schedule .sched-toolbar').getBoundingClientRect();
      var cs=getComputedStyle(sc);
      return {
        heads:heads,
        client:sc.clientWidth,
        scroll:sc.scrollWidth,
        scrollLeft:sc.scrollLeft,
        sunText:sun.textContent.replace(/\s+/g,' ').trim(),
        sunLeft:sunBox.left,
        sunRight:sunBox.right,
        scLeft:scBox.left,
        scRight:scBox.right,
        scTop:scBox.top,
        emptyHidden:empty.hidden,
        emptyRight:emptyBox.right,
        emptyBottom:emptyBox.bottom,
        emptyOverlaps:!(emptyBox.bottom<=scBox.top+1||emptyBox.top>=scBox.bottom-1),
        toolbarRight:bar.right,
        toolbarTop:bar.top,
        docScroll:document.documentElement.scrollWidth,
        docClient:document.documentElement.clientWidth,
        overflowX:cs.overflowX,
        touch:cs.touchAction,
        webkit:cs.webkitOverflowScrolling||''
      };
    }
    const phone=await browser.newPage();
    await phone.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2});
    await openSchedule(phone);
    const before=await phone.evaluate(readGrid);
    assert.strictEqual(before.emptyHidden, false, 'No patterns notice stays with an all-open week');
    assert.ok(before.heads.some(function(h){return h.indexOf('Sun')>=0;}), 'Sunday header is in the grid');
    assert.ok(before.scroll>before.client+200, 'phone week grid is wider than the scroller '+JSON.stringify(before));
    assert.ok(before.overflowX==='auto'||before.overflowX==='scroll', 'overflow-x is a horizontal scroller');
    assert.ok(/pan-x/.test(before.touch), 'touch-action allows horizontal pan');
    assert.ok(before.emptyRight<=392, 'No patterns notice stays inside the phone width');
    assert.strictEqual(before.emptyOverlaps, false, 'No patterns notice does not cover the grid');
    assert.ok(before.toolbarRight<=392, 'toolbar stays inside the phone width');
    assert.ok(before.docScroll<=before.docClient+2, 'page itself does not trap horizontal scroll '+before.docScroll+'/'+before.docClient);
    await phone.evaluate(function(){
      document.getElementById('schedScroll').scrollIntoView({block:'center',inline:'nearest'});
    });
    const box=await phone.$('#schedScroll').then(function(el){return el.boundingBox();});
    assert.ok(box && box.y>=0 && box.y<800, 'week grid is on screen before the swipe');
    const startX=box.x+box.width-24;
    const y=box.y+Math.min(36, box.height/2);
    await phone.touchscreen.touchStart(startX, y);
    for(var step=1;step<=12;step++){
      await new Promise(function(r){setTimeout(r,20);});
      await phone.touchscreen.touchMove(startX-step*22, y);
    }
    await phone.touchscreen.touchEnd();
    const swiped=await phone.evaluate(readGrid);
    assert.ok(swiped.scrollLeft>40, 'touch swipe moves the week grid '+JSON.stringify(swiped));
    await phone.evaluate(function(){
      var sc=document.getElementById('schedScroll');
      sc.scrollLeft=sc.scrollWidth;
    });
    const after=await phone.evaluate(readGrid);
    assert.ok(after.scrollLeft>80, 'horizontal scroll reaches the weekend '+JSON.stringify(after));
    assert.ok(after.sunRight<=after.scRight+2 && after.sunLeft<after.scRight, 'Sunday column is inside the phone scroller '+JSON.stringify(after));
    await phone.close();

    const desk=await browser.newPage();
    await desk.setViewport({width:1280,height:800,isMobile:false,hasTouch:false,deviceScaleFactor:1});
    await openSchedule(desk);
    const wide=await desk.evaluate(readGrid);
    assert.ok(wide.sunRight<=wide.scRight+2 && wide.sunLeft>=wide.scLeft, 'desktop shows Sunday without a clipped grid '+JSON.stringify(wide));
    assert.ok(wide.heads[1]&&wide.heads[1].indexOf('Mon')>=0 && wide.heads[7]&&wide.heads[7].indexOf('Sun')>=0, 'desktop headers stay Mon–Sun');
    const layout=await desk.evaluate(function(){
      return getComputedStyle(document.querySelector('#tab_schedule .sched-layout')).flexDirection;
    });
    assert.strictEqual(layout, 'row', 'desktop schedule stays a side-by-side row');
    await desk.close();
    console.log('admin-schedule phone scroll ok');
  }finally{
    await browser.close();
    server.close();
  }
}

(async function main(){
assert.strictEqual(sandbox.schedCanEdit(), true);
sandbox.currentAdminRole='Scheduler';
assert.strictEqual(sandbox.schedCanEdit(), true);
sandbox.currentAdminRole='Nurse';
assert.strictEqual(sandbox.schedCanEdit(), false);
sandbox.schedOpenCell('ada','2026-09-23',3);
assert.strictEqual(els.schedSaveBtn.hidden, true, 'Nurse panel hides Save');
assert.strictEqual(els.schedClearBtn.hidden, true, 'Nurse panel hides Clear');
sandbox.schedEditor={mode:'usual', clientId:'ada', weekday:1};
const rpcBefore=rpc.length;
await sandbox.schedSavePanel();
assert.ok(toasts.some(function(t){return /Admin and Scheduler/.test(t);}), 'Nurse cannot save');
assert.strictEqual(rpc.length, rpcBefore, 'Nurse save does not call an RPC');
assert.strictEqual(Object.keys(mem).length, 0, 'Nurse save does not write localStorage');

sandbox.currentAdminRole='Scheduler';
sandbox.schedEditor={mode:'usual'};
els.schedClientSel.value='ada';
els.schedWeekdaySel.value='1';
els.schedAideSel.value='a1';
els.schedHours.value='4';
els.schedNote.value='usual week';
await sandbox.schedSaveUsualFromForm();
assert.ok(toasts.some(function(t){return /Sign in to save/.test(t);}), 'unsigned save is refused');
assert.ok(!rpc.some(function(c){return c.name==='upsert_schedule_pattern';}), 'unsigned save does not call Ace');
assert.strictEqual(mem.evercare_sched_v1, undefined);

var officeAide='11111111-1111-4111-8111-111111111111';
var coverAide='22222222-2222-4222-8222-222222222222';
sandbox.loadedAidesList=[
  {id:officeAide, username:'sara', name:'Sara'},
  {id:coverAide, username:'lee', name:'Lee'}
];
sandbox.readSbSession=function(){return {access_token:'office'};};
var patterns={
  'ada|1':{hours:4, aide_id:officeAide, aide_username:'sara', aide_name:'Sara', source:'pattern', exception_kind:null, note:''}
};
var exceptions={};
function renderWeek(){
  var days={};
  for(var n=1;n<=7;n++){
    days[String(n)]={hours:null, aide_id:null, aide_username:null, aide_name:null, source:'empty', exception_kind:null, note:null};
  }
  var clients=[
    {client_id:'ada', client_name:'Ada Client', days:JSON.parse(JSON.stringify(days))},
    {client_id:'bea', client_name:'Bea Client', days:JSON.parse(JSON.stringify(days))}
  ];
  clients.forEach(function(c){
    for(var wd=1;wd<=7;wd++){
      var iso=sandbox.schedAddDays('2026-09-21', wd-1);
      var ex=exceptions[c.client_id+'|'+iso];
      var pat=patterns[c.client_id+'|'+wd];
      if(ex)c.days[String(wd)]=JSON.parse(JSON.stringify(ex));
      else if(pat)c.days[String(wd)]=JSON.parse(JSON.stringify(pat));
    }
  });
  return {week_start:'2026-09-21', week_end:'2026-09-27', clients:clients};
}
sandbox.sbRestRpc=function(name, body){
  rpc.push({name:name, body:body});
  if(name==='list_schedule_week')return Promise.resolve({ok:true, data:renderWeek()});
  if(name==='upsert_schedule_pattern'){
    patterns[body.p_client_id+'|'+body.p_weekday]={
      hours:body.p_hours, aide_id:body.p_usual_aide_id, aide_username:'sara', aide_name:'Sara',
      source:'pattern', exception_kind:null, note:body.p_note
    };
    return Promise.resolve({ok:true, data:{ok:true}});
  }
  if(name==='upsert_schedule_exception'){
    var key=body.p_client_id+'|'+body.p_on_date;
    if(body.p_kind==='clear'){
      delete exceptions[key];
    }else{
      var who=body.p_aide_id===coverAide?'Lee':'Sara';
      exceptions[key]={
        hours:body.p_hours, aide_id:body.p_aide_id, aide_name:who, source:'exception',
        exception_kind:body.p_kind, note:body.p_note
      };
    }
    return Promise.resolve({ok:true, data:{ok:true}});
  }
  if(name==='delete_schedule_pattern'){
    delete patterns[body.p_client_id+'|'+body.p_weekday];
    return Promise.resolve({ok:true, data:{ok:true}});
  }
  return Promise.resolve({ok:false, status:404, error:'missing rpc'});
};
sandbox.schedApplyWeek(renderWeek());
assert.strictEqual(sandbox.schedCellFor('ada','2026-09-21',1).state, 'usual');

sandbox.schedEditor={mode:'usual'};
els.schedClientSel.value='ada';
els.schedWeekdaySel.value='3';
els.schedAideSel.value=officeAide;
els.schedHours.value='6';
els.schedNote.value='';
await sandbox.schedSaveUsualFromForm();
const patternCall=rpc.find(function(c){return c.name==='upsert_schedule_pattern';});
assert.ok(patternCall, 'office save uses upsert_schedule_pattern');
assert.strictEqual(patternCall.body.p_client_id, 'ada');
assert.strictEqual(patternCall.body.p_weekday, 3);
assert.strictEqual(patternCall.body.p_usual_aide_id, officeAide);
assert.strictEqual(patternCall.body.p_hours, 6);
assert.strictEqual(patternCall.body.p_note, null);
assert.strictEqual(mem.evercare_sched_v1, undefined, 'live save does not write a browser stub');
assert.ok(rpc.some(function(c){return c.name==='list_schedule_week'&&c.body.p_week_start==='2026-09-21';}));
assert.strictEqual(sandbox.schedFindUsual('ada',1).hours, 4, 'saving Wednesday does not rebuild Monday');
assert.strictEqual(sandbox.schedFindUsual('ada',3).hours, 6);

sandbox.schedEditor={mode:'exception', clientId:'ada', onDate:'2026-09-23', weekday:3};
els.schedAideSel.value='';
els.schedHours.value='';
els.schedCalloff.checked=false;
els.schedNote.value='uncovered';
const beforeOpen=rpc.length;
await sandbox.schedSaveExceptionFromForm();
assert.strictEqual(rpc.length, beforeOpen, 'blank cell does not send kind open');
assert.ok(toasts.some(function(t){return /Call-off/.test(t);}));

els.schedAideSel.value=officeAide;
els.schedHours.value='8';
els.schedCalloff.checked=false;
els.schedNote.value='';
sandbox.schedEditor={mode:'exception', clientId:'ada', onDate:'2026-09-23', weekday:3};
await sandbox.schedSaveExceptionFromForm();
var hoursCall=rpc.filter(function(c){return c.name==='upsert_schedule_exception';}).pop();
assert.strictEqual(hoursCall.body.p_kind, 'hours_override');
assert.strictEqual(hoursCall.body.p_hours, 8);
sandbox.schedEditor={mode:'exception', clientId:'ada', onDate:'2026-09-23', weekday:3};
await sandbox.schedClearPanel();

els.schedAideSel.value=coverAide;
els.schedHours.value='6';
els.schedCalloff.checked=false;
sandbox.schedEditor={mode:'exception', clientId:'ada', onDate:'2026-09-23', weekday:3};
await sandbox.schedSaveExceptionFromForm();
var aideCall=rpc.filter(function(c){return c.name==='upsert_schedule_exception';}).pop();
assert.strictEqual(aideCall.body.p_kind, 'aide_override');
assert.strictEqual(aideCall.body.p_aide_id, coverAide);
sandbox.schedEditor={mode:'exception', clientId:'ada', onDate:'2026-09-23', weekday:3};
await sandbox.schedClearPanel();

els.schedAideSel.value='';
els.schedHours.value='';
els.schedCalloff.checked=true;
els.schedNote.value='sick';
sandbox.schedEditor={mode:'exception', clientId:'ada', onDate:'2026-09-23', weekday:3};
await sandbox.schedSaveExceptionFromForm();
var call=rpc.filter(function(c){return c.name==='upsert_schedule_exception';}).pop();
assert.strictEqual(call.body.p_kind, 'call_off');
assert.strictEqual(call.body.p_on_date, '2026-09-23');
assert.strictEqual(call.body.p_aide_id, officeAide, 'call-off keeps the usual aide');
assert.strictEqual(call.body.p_hours, 6);
assert.strictEqual(sandbox.schedCellFor('ada','2026-09-23',3).state, 'calloff');
assert.strictEqual(sandbox.schedCellFor('ada','2026-09-21',1).state, 'usual');
sandbox.schedEditor={mode:'exception', clientId:'ada', onDate:'2026-09-23', weekday:3};
await sandbox.schedClearPanel();
var clearCall=rpc.filter(function(c){return c.name==='upsert_schedule_exception'&&c.body.p_kind==='clear';}).pop();
assert.strictEqual(clearCall.body.p_kind, 'clear');
assert.strictEqual(clearCall.body.p_aide_id, null);
assert.strictEqual(clearCall.body.p_hours, null);
assert.strictEqual(sandbox.schedFindException('ada','2026-09-23'), null);
assert.strictEqual(sandbox.schedFindUsual('ada',3).hours, 6, 'clearing an exception leaves the usual pattern');

els.schedAideSel.value=coverAide;
els.schedHours.value='5';
els.schedCalloff.checked=false;
sandbox.schedEditor={mode:'exception', clientId:'ada', onDate:'2026-09-22', weekday:2};
await sandbox.schedSaveExceptionFromForm();
var coverCall=rpc.filter(function(c){return c.name==='upsert_schedule_exception';}).pop();
assert.strictEqual(coverCall.body.p_kind, 'cover');
assert.strictEqual(coverCall.body.p_on_date, '2026-09-22');

sandbox.schedEditor={mode:'usual', clientId:'ada', weekday:3};
els.schedClientSel.value='ada';
els.schedWeekdaySel.value='3';
await sandbox.schedDeleteUsual();
var delCall=rpc.filter(function(c){return c.name==='delete_schedule_pattern';}).pop();
assert.ok(delCall, 'remove usual calls delete_schedule_pattern');
assert.strictEqual(delCall.body.p_client_id, 'ada');
assert.strictEqual(delCall.body.p_weekday, 3);
assert.strictEqual(sandbox.schedFindUsual('ada',3), null);
assert.strictEqual(sandbox.schedFindUsual('ada',1).hours, 4, 'deleting Wednesday leaves Monday');

rpc.length=0;
sandbox.sbRestRpc=function(name, body){
  rpc.push({name:name, body:body});
  return Promise.resolve({ok:false, status:403, error:'forbidden: scheduler office only'});
};
sandbox.schedEditor={mode:'usual'};
els.schedClientSel.value='ada';
els.schedWeekdaySel.value='1';
els.schedAideSel.value=officeAide;
els.schedHours.value='4';
await sandbox.schedSaveUsualFromForm();
assert.ok(toasts.some(function(t){return /forbidden/.test(t);}), '403 is shown and not stored locally');
assert.strictEqual(mem.evercare_sched_v1, undefined);
assert.strictEqual(sandbox.schedFindUsual('ada',1).hours, 4, 'failed save leaves the loaded week');

await schedPhoneScroll();
console.log('admin-schedule-test ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
