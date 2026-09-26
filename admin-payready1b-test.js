#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function extractFn(src, sig){
  const start = src.indexOf(sig);
  assert.ok(start >= 0, 'missing ' + sig);
  let i = src.indexOf('{', start);
  let depth = 0;
  for(; i < src.length; i++){
    if(src[i] === '{')depth++;
    else if(src[i] === '}'){
      depth--;
      if(depth === 0)return src.slice(start, i + 1);
    }
  }
  assert.fail('unclosed ' + sig);
}

assert.ok(html.includes('v=payready1b'), 'payready1b marker');
assert.ok(html.includes('data-payready1b="v=payready1b"'), 'payready1b string marker');
assert.ok(html.includes('admin-build 2026-09-25-payready1b'), 'payready1b build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-payready1b">'), 'payready1b meta');
assert.ok(html.includes('<!-- admin pay readiness export 2026-09-25 v=payready1b admin-build 2026-09-25-payready1b'), 'payready1b comment');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-25-remiask1'), 'remiask1 is the first admin-build meta');
assert.ok(html.indexOf('content="2026-09-25-remisec1"') < html.indexOf('content="2026-09-25-payready1d"'), 'payready1d stays after remisec1');
assert.ok(html.indexOf('content="2026-09-25-payready1b"') < html.indexOf('content="2026-09-25-coverunlock1"'), 'coverunlock1 stays after payready1b');
assert.ok(html.indexOf('content="2026-09-25-coverunlock1"') < html.indexOf('content="2026-09-25-payready1"'), 'payready1 stays after coverunlock1');
assert.ok(html.indexOf('content="2026-09-25-payready1"') < html.indexOf('content="2026-09-25-aidecreds1c"'), 'aidecreds1c stays after payready1');
['v=payready1','v=coverunlock1','v=aidecreds1c','v=aidecreds1b','v=aidecreds1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
['2026-09-25-coverunlock1','2026-09-25-payready1','2026-09-25-aidecreds1c','2026-09-25-aidecreds1b','2026-09-25-aidecreds1'].forEach(function(build){
  assert.ok(html.includes('<meta name="admin-build" content="' + build + '">'), 'prior meta stays ' + build);
});

const note = html.slice(html.indexOf('v=payready1b'), html.indexOf('<meta name="admin-build" content="2026-09-25-payready1b">'));
assert.ok(/ready_count is at least 1/.test(note), 'note shows export when ready');
assert.ok(/held_count is greater than 0/.test(note), 'note keeps export when held');
assert.ok(/admin_timesheet_pay_export/.test(note), 'note keeps the export callable');
assert.ok(/Remi stays the corner chip/.test(note), 'Remi stays corner-only');
assert.ok(/No Auth reseal/.test(note), 'no Auth reseal');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|auth\.updateUser|rotate password/.test(note), 'payready1b note does not reseal Auth');
assert.ok(html.includes('data-payready="v=payready1"'), 'payready1 marker stays on the screen');
assert.ok(html.includes('id="copilotFab"') && html.includes('class="remi-chip-pill">Remi</span>'), 'Remi chip stays corner-only');

const list = html.slice(html.indexOf('id="payReadyListView"'), html.indexOf('id="payReadyDetail"'));
const empty = html.slice(html.indexOf('id="payReadyEmpty"'), html.indexOf('id="payReadyExport"'));
assert.ok(list.includes('id="payReadyExport"'), 'export stays on the list');
assert.ok(list.includes('>Export ready list<'), 'export label');
assert.ok(!empty.includes('id="payReadyExport"'), 'export is not trapped in the all-ready empty state');
assert.ok(list.includes('Nothing held this pay period'), 'all-ready copy stays');
assert.ok(html.includes('data-ts-desk="active"') && html.includes('>Archived<') && html.includes('>Recently deleted<'), 'timesheet desk stays');
assert.ok(html.includes('id="exportAllPdfsBtn"'), 'Export all as PDFs stays');

const paint = extractFn(html, 'function payReadyPaint()');
const heldAt = paint.indexOf('if(counts.held>0)');
assert.ok(heldAt >= 0, 'held branch stays');
const heldBranch = paint.slice(heldAt, paint.indexOf('if(rowsEl)rowsEl.innerHTML=\'\'', heldAt));
assert.ok(/payReadySyncExport\(counts\.ready>=1\)/.test(heldBranch), 'held weeks still show export when ready');
assert.ok(!/admin_set_role_password|auth\.updateUser/.test(paint), 'paint does not reseal Auth');
const exportFn = extractFn(html, 'async function payReadyExport()');
assert.ok(exportFn.includes('sbRestRpc(PAYREADY_EXPORT_RPC, body)'), 'export still calls admin_timesheet_pay_export');
assert.ok(exportFn.includes('p_week_start') && !/pay_amount|gross|hourly_rate/.test(exportFn), 'export body is the week, not payroll');

function el(id){
  return {id:id, hidden:true, textContent:'', innerHTML:'', attrs:{}, setAttribute:function(k,v){this.attrs[k]=v;}};
}
const ids = ['payReady','payReadyListView','payReadyDetail','payReadyWeek','payReadyCount','payHeldCount','payReadyRows','payReadyEmpty','payReadyTitle','payReadyEmptyTitle','payReadyEmptySub','payReadyMark','payReadyExport'];
const els = {};
ids.forEach(function(id){els[id]=el(id);});
const calls = [];
const box = {
  document:{
    getElementById:function(id){return els[id]||null;},
    createElement:function(){return {href:'', download:'', click:function(){box.downloaded=this.download;}, remove:function(){}};},
    body:{appendChild:function(){}}
  },
  sbRestRpc: async function(name, body){
    calls.push({name:name, body:JSON.parse(JSON.stringify(body||{}))});
    if(name==='admin_timesheet_pay_export')return {ok:true, data:box.exportData};
    return {ok:false, status:404, error:'Could not find the function'};
  },
  exportData:null,
  downloaded:'',
  URL:URL,
  Blob:Blob
};
const srcStart = html.indexOf('var PAYREADY_MARKER');
const src = html.slice(srcStart, html.indexOf(exportFn) + exportFn.length);
vm.createContext(box);
vm.runInContext(src, box);

const mixed = {
  source:'ace',
  week_start:'2026-09-21',
  week_end:'2026-09-27',
  label:'09/21/2026\u201309/27/2026',
  ready_count:1,
  held_count:1,
  rows:[
    {id:'1cedf9f7', name:'Jordan Smith', role:'Home Health Aide', status:'held', reasonLabel:'missing signature'},
    {id:'c1965303', name:'Maya Brooks', role:'Home Health Aide', status:'ready', reasonLabel:'All current'}
  ]
};
box.payReadyState = mixed;
box.payReadyView = 'list';
vm.runInContext('payReadyPaint()', box);
assert.strictEqual(els.payReadyCount.textContent, 'Ready 1');
assert.strictEqual(els.payHeldCount.textContent, 'Held 1');
assert.strictEqual(els.payReadyWeek.textContent, 'Week of 09/21/2026\u201309/27/2026');
assert.strictEqual(els.payReadyEmpty.hidden, true, 'held rows are not the all-ready empty state');
assert.strictEqual(els.payReadyExport.hidden, false, 'export shows when ready and held');
assert.ok(els.payReadyRows.innerHTML.includes('Jordan Smith') && els.payReadyRows.innerHTML.includes('Maya Brooks'));

const heldOnly = Object.assign({}, mixed, {ready_count:0, held_count:1, rows:[mixed.rows[0]]});
box.payReadyState = heldOnly;
vm.runInContext('payReadyPaint()', box);
assert.strictEqual(els.payReadyExport.hidden, true, 'export stays hidden when nothing is ready');
assert.strictEqual(els.payHeldCount.textContent, 'Held 1');

const clear = {
  source:'ace',
  week_start:'2026-09-21',
  week_end:'2026-09-27',
  label:'09/21/2026\u201309/27/2026',
  ready_count:2,
  held_count:0,
  rows:[]
};
box.payReadyState = clear;
box.payReadyView = 'list';
vm.runInContext('payReadyPaint()', box);
assert.strictEqual(els.payHeldCount.textContent, 'Held 0');
assert.strictEqual(els.payReadyEmpty.hidden, false, 'all-ready empty state stays');
assert.strictEqual(els.payReadyEmptyTitle.textContent, 'All 2 timesheets ready');
assert.strictEqual(els.payReadyEmptySub.textContent, 'Nothing held this pay period');
assert.strictEqual(els.payReadyMark.hidden, false);
assert.strictEqual(els.payReadyExport.hidden, false, 'Held 0 still shows export');

box.exportData = {
  export_row_count:2,
  columns:['Aide','Client','Week','Readiness','gross'],
  rows:[['Maya Brooks','Ruth Coleman','09/21/2026\u201309/27/2026','ready','240']]
};
calls.length = 0;
box.payReadyState = mixed;
const exported = vm.runInContext('payReadyExport()', box);
exported.then(function(csv){
  assert.strictEqual(calls[0].name, 'admin_timesheet_pay_export');
  assert.deepStrictEqual(calls[0].body, {p_week_start:'2026-09-21'});
  assert.strictEqual(csv.split('\n').length, 2, 'header plus the ready row');
  assert.ok(csv.includes('Maya Brooks') && !csv.includes('Jordan Smith'), 'download is the ready list');
  assert.ok(!/240|gross|\$/.test(csv), 'money columns stay dropped');
  assert.ok(box.downloaded.indexOf('EverCare_Ready_List_2026-09-21')===0, box.downloaded);
  return runBrowser();
}).then(function(){
  console.log('admin-payready1b-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});

function loadPuppeteer(){
  try{return require('puppeteer-core');}
  catch(e){
    try{return require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){return null;}
  }
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-payready1b browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : '/usr/bin/chromium');
  const shotDir = process.env.PAYREADY_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive:true});
  const root = __dirname;
  const types = {'.html':'text/html; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.js':'text/javascript'};
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const file = path.normalize(path.join(root, rel));
    if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404);res.end('missing');return;}
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, {'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control':'no-store'});
      res.end(buf);
    });
  });
  await new Promise(function(resolve){server.listen(0, '127.0.0.1', resolve);});
  const port = server.address().port;
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox','--disable-dev-shm-usage']
  });
  try{
    const page = await browser.newPage();
    await page.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:2});
    await page.setRequestInterception(true);
    page.on('request', function(req){
      const u = req.url();
      if(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare|gstatic\.com/.test(u)){req.abort();return;}
      req.continue();
    });
    await page.goto('http://127.0.0.1:'+port+'/index.html', {waitUntil:'domcontentloaded', timeout:20000});
    const mixedShot = path.join(shotDir, 'payready1b-phone-held-and-ready.png');
    const clearShot = path.join(shotDir, 'payready1b-phone-all-ready.png');
    const phone = await page.evaluate(async function(){
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      layoutA1ApplyRoles();
      showScreen('adminScreen');
      var calls = [];
      window.__payCalls = calls;
      window.sbRestRpc = async function(name, body){
        calls.push({name:name, body:body});
        if(name==='admin_timesheet_pay_export'){
          return {ok:true, data:{
            export_row_count:2,
            columns:['Aide','Client','Week','Readiness','gross'],
            rows:[['Maya Brooks','Ruth Coleman','09/21/2026\u201309/27/2026','ready','240']]
          }};
        }
        return {ok:false, status:404, error:'stub'};
      };
      var mixed = {
        source:'ace',
        week_start:'2026-09-21',
        week_end:'2026-09-27',
        label:'09/21/2026\u201309/27/2026',
        ready_count:1,
        held_count:1,
        rows:[
          {id:'1cedf9f7', timesheet_id:'1cedf9f7', name:'Jordan Smith', role:'Home Health Aide', client:'Ruth Coleman', status:'held', reason:'missing_signature', reasonLabel:'missing signature', checks:{submitted:'yes', saveDay:'yes', signature:'missing', officeReview:'clear'}},
          {id:'c1965303', timesheet_id:'c1965303', name:'Maya Brooks', role:'Home Health Aide', client:'Helen Grant', status:'ready', reasonLabel:'All current', checks:{submitted:'yes', saveDay:'yes', signature:'present', officeReview:'clear'}}
        ]
      };
      payReadyState = mixed;
      payReadyView = 'list';
      payReadySelected = '';
      payReadyPaint();
      var btn = document.getElementById('payReadyExport');
      btn.scrollIntoView({block:'center'});
      var box = btn.getBoundingClientRect();
      var nav = document.querySelector('#adminScreen .bottom-nav').getBoundingClientRect();
      var fab = document.getElementById('copilotFab');
      var fabBox = fab.getBoundingClientRect();
      var desks = Array.prototype.map.call(document.querySelectorAll('[data-ts-desk]'), function(el){
        return el.textContent.replace(/\s+/g,' ').trim();
      });
      var orig = payReadyExport;
      window.payReadyExport = async function(){
        var csv = await orig();
        window.__payreadyCsv = csv;
        return csv;
      };
      return {
        build: document.querySelector('meta[name="admin-build"]').content,
        marker: document.getElementById('payReady').getAttribute('data-payready1b'),
        week: document.getElementById('payReadyWeek').textContent,
        ready: document.getElementById('payReadyCount').textContent,
        held: document.getElementById('payHeldCount').textContent,
        text: btn.textContent.replace(/\s+/g,' ').trim(),
        hidden: btn.hidden,
        display: getComputedStyle(btn).display,
        width: box.width,
        height: box.height,
        top: box.top,
        bottom: box.bottom,
        navTop: nav.top,
        parent: btn.parentElement.id,
        emptyHidden: document.getElementById('payReadyEmpty').hidden,
        viewW: window.innerWidth,
        desks: desks,
        fabInPay: !!document.getElementById('payReady').querySelector('#copilotFab'),
        fabText: fab.innerText.replace(/\s+/g,' ').trim(),
        fabTop: fabBox.top,
        fabRight: fabBox.right,
        calls: calls.map(function(c){return c.name;})
      };
    });
    assert.strictEqual(phone.build, '2026-09-25-remiask1');
    assert.strictEqual(phone.marker, 'v=payready1b');
    assert.ok(phone.viewW >= 380 && phone.viewW <= 400, 'phone width '+phone.viewW);
    assert.strictEqual(phone.week, 'Week of 09/21/2026\u201309/27/2026');
    assert.strictEqual(phone.ready, 'Ready 1');
    assert.strictEqual(phone.held, 'Held 1');
    assert.strictEqual(phone.text, 'Export ready list');
    assert.strictEqual(phone.hidden, false);
    assert.notStrictEqual(phone.display, 'none');
    assert.strictEqual(phone.parent, 'payReadyListView');
    assert.strictEqual(phone.emptyHidden, true);
    assert.ok(phone.width >= 300, 'export is full width on a phone '+phone.width);
    assert.ok(phone.height >= 44, 'export is tappable '+phone.height);
    assert.ok(phone.top >= 0 && phone.bottom <= phone.navTop + 1, 'export sits above the bottom nav');
    assert.deepStrictEqual(phone.desks, ['Active','Archived','Recently deleted']);
    assert.strictEqual(phone.fabInPay, false, 'Remi stays out of the pay screen');
    assert.ok(/Remi/.test(phone.fabText), phone.fabText);
    assert.ok(phone.fabRight > phone.viewW - 90 && phone.fabTop > 500, 'Remi stays the corner chip');
    assert.ok(!phone.calls.includes('admin_timesheet_pay_readiness'), 'paint does not invent an Ace call');
    await page.screenshot({path: mixedShot});

    await page.click('#payReadyExport');
    await page.waitForFunction(function(){return typeof window.__payreadyCsv==='string' && window.__payreadyCsv.length>0;});
    const afterClick = await page.evaluate(function(){
      return {csv: window.__payreadyCsv, calls: window.__payCalls};
    });
    assert.ok(afterClick.csv.indexOf('Maya Brooks') >= 0, afterClick.csv);
    assert.ok(afterClick.csv.indexOf('Jordan Smith') < 0, afterClick.csv);
    assert.ok(!/240|gross|\$/.test(afterClick.csv), afterClick.csv);
    assert.strictEqual(afterClick.csv.split('\n').length, 2);
    assert.strictEqual(afterClick.calls.length, 1);
    assert.strictEqual(afterClick.calls[0].name, 'admin_timesheet_pay_export');
    assert.deepStrictEqual(afterClick.calls[0].body, {p_week_start:'2026-09-21'});

    const detail = await page.evaluate(function(){
      payReadyOpenDetail('1cedf9f7');
      return {
        banner: document.getElementById('payDetailBanner').textContent,
        checks: document.getElementById('payDetailChecks').innerText,
        hold: document.getElementById('payHoldBtn').textContent.replace(/\s+/g,' ').trim(),
        week: document.getElementById('payDetailWeek').textContent
      };
    });
    assert.strictEqual(detail.banner, 'Held \u2014 missing signature');
    assert.ok(detail.checks.includes('Submitted') && detail.checks.includes('Save Day complete') && detail.checks.includes('Signature') && detail.checks.includes('Office review'), detail.checks);
    assert.strictEqual(detail.hold, 'Hold pay');
    assert.strictEqual(detail.week, 'Week of 09/21/2026\u201309/27/2026');

    const clearPhone = await page.evaluate(function(){
      payReadyState = {
        source:'ace',
        week_start:'2026-09-21',
        week_end:'2026-09-27',
        label:'09/21/2026\u201309/27/2026',
        ready_count:2,
        held_count:0,
        rows:[]
      };
      payReadyView = 'list';
      payReadySelected = '';
      payReadyPaint();
      var btn = document.getElementById('payReadyExport');
      var empty = document.getElementById('payReadyEmpty');
      btn.scrollIntoView({block:'center'});
      var box = btn.getBoundingClientRect();
      return {
        held: document.getElementById('payHeldCount').textContent,
        title: document.getElementById('payReadyEmptyTitle').textContent,
        sub: document.getElementById('payReadyEmptySub').textContent,
        emptyHidden: empty.hidden,
        markHidden: document.getElementById('payReadyMark').hidden,
        exportHidden: btn.hidden,
        text: btn.textContent.replace(/\s+/g,' ').trim(),
        height: box.height,
        width: box.width,
        week: document.getElementById('payReadyWeek').textContent
      };
    });
    assert.strictEqual(clearPhone.held, 'Held 0');
    assert.strictEqual(clearPhone.emptyHidden, false);
    assert.strictEqual(clearPhone.markHidden, false);
    assert.strictEqual(clearPhone.title, 'All 2 timesheets ready');
    assert.strictEqual(clearPhone.sub, 'Nothing held this pay period');
    assert.strictEqual(clearPhone.exportHidden, false);
    assert.strictEqual(clearPhone.text, 'Export ready list');
    assert.strictEqual(clearPhone.week, 'Week of 09/21/2026\u201309/27/2026');
    assert.ok(clearPhone.height >= 44 && clearPhone.width >= 300, clearPhone.height+'x'+clearPhone.width);
    await page.screenshot({path: clearShot});
  }finally{
    await browser.close();
    server.close();
  }
}
