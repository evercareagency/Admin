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

assert.ok(html.includes('v=payready1d'), 'payready1d marker');
assert.ok(html.includes('data-payready1d="v=payready1d"'), 'payready1d string marker');
assert.ok(html.includes('admin-build 2026-09-25-payready1d'), 'payready1d build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-payready1d">'), 'payready1d meta');
assert.ok(html.includes('<!-- admin pay readiness export ready-list defense 2026-09-25 v=payready1d admin-build 2026-09-25-payready1d'), 'payready1d comment');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-25-coverpick1'), 'coverpick1 is the first admin-build meta');
assert.ok(html.indexOf('content="2026-09-25-remisec1"') < html.indexOf('content="2026-09-25-payready1d"'), 'payready1d stays after remisec1');
assert.ok(html.indexOf('content="2026-09-25-payready1d"') < html.indexOf('content="2026-09-25-payready1c"'), 'payready1c stays after payready1d');
assert.ok(html.indexOf('content="2026-09-25-payready1c"') < html.indexOf('content="2026-09-25-payready1b"'), 'payready1b stays after payready1c');
assert.ok(html.indexOf('content="2026-09-25-payready1b"') < html.indexOf('content="2026-09-25-coverunlock1"'), 'coverunlock1 stays after payready1b');
assert.ok(html.indexOf('content="2026-09-25-coverunlock1"') < html.indexOf('content="2026-09-25-payready1"'), 'payready1 stays after coverunlock1');
assert.ok(html.indexOf('content="2026-09-25-payready1"') < html.indexOf('content="2026-09-25-aidecreds1c"'), 'aidecreds1c stays after payready1');
['v=payready1c','v=payready1b','v=payready1','v=coverunlock1','v=aidecreds1c','v=aidecreds1b','v=aidecreds1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
['2026-09-25-payready1c','2026-09-25-payready1b','2026-09-25-coverunlock1','2026-09-25-payready1','2026-09-25-aidecreds1c'].forEach(function(build){
  assert.ok(html.includes('<meta name="admin-build" content="' + build + '">'), 'prior meta stays ' + build);
});

const note = html.slice(html.indexOf('v=payready1d'), html.indexOf('<meta name="admin-build" content="2026-09-25-payready1d">'));
assert.ok(/Held rows/.test(note), 'note strips held rows');
assert.ok(/not ready/.test(note), 'note drops anything that is not ready');
assert.ok(/prebuilt csv/.test(note), 'note covers the prebuilt csv path');
assert.ok(/admin_timesheet_pay_export/.test(note), 'note keeps the export callable');
assert.ok(/\{p_week_start\}/.test(note), 'note keeps the export args');
assert.ok(/no ready timesheets to export/.test(note), 'note keeps the empty export message');
assert.ok(/ready_count is at least 1/.test(note) && /held_count is greater than 0/.test(note), 'export visibility stays when held');
assert.ok(/Remi stays the corner chip/.test(note), 'Remi stays corner-only');
assert.ok(/No Auth reseal/.test(note), 'no Auth reseal');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|auth\.updateUser|rotate password/.test(note), 'payready1d note does not reseal Auth');
assert.ok(html.includes('id="copilotFab"') && html.includes('class="remi-chip-pill">Remi</span>'), 'Remi chip stays corner-only');

const csvStart = html.indexOf('function payReadyTableToCsv(data)');
const csvEnd = html.indexOf('function payReadyBlank', csvStart);
assert.ok(csvStart >= 0 && csvEnd > csvStart, 'payReadyTableToCsv is present');
const csvFn = html.slice(csvStart, csvEnd);
assert.ok(!/return node\.csv/.test(csvFn), 'prebuilt csv is not returned unchanged');
assert.ok(!/else return node/.test(csvFn), 'a raw csv string is not returned unchanged');
const exportFn = extractFn(html, 'async function payReadyExport()');
assert.ok(exportFn.includes('sbRestRpc(PAYREADY_EXPORT_RPC, body)'), 'export still calls admin_timesheet_pay_export');
assert.ok(exportFn.includes('body.p_week_start=week') || exportFn.includes('p_week_start'), 'export still posts p_week_start');
assert.ok(exportFn.includes('No ready timesheets to export.'), 'empty export keeps the same message');
assert.ok(extractFn(html, 'function payReadyExportList()').includes('return payReadyExport()'), 'list tap still reaches export');

const heldCsv = 'Aide,Client,Week,pay_status,gross\n"Probe QA Test","payready1 Probe Held","09/21/2026\u201309/27/2026",held,180\n"Probe QA Test","payready1 Probe Ready","09/21/2026\u201309/27/2026",Ready,240\n';
const readyOnlyCsv = 'Aide,Client,Week,pay_status,hourly_rate,payroll,Pay $\nMaya Brooks,Ruth Coleman,09/21/2026\u201309/27/2026,ready,18,240,9\nAlex Nguyen,Helen Grant,09/21/2026\u201309/27/2026,READY,19,300,8\n';

function el(id){
  return {id:id, hidden:true, textContent:'', innerHTML:'', attrs:{}, classList:{remove:function(){}, add:function(){}}, style:{setProperty:function(){}}, removeAttribute:function(){this.hidden=false;}, setAttribute:function(k,v){this.attrs[k]=v;}};
}
const ids = ['payReady','payReadyListView','payReadyDetail','payReadyWeek','payReadyCount','payHeldCount','payReadyRows','payReadyEmpty','payReadyTitle','payReadyEmptyTitle','payReadyEmptySub','payReadyMark','payReadyExport'];
const els = {};
ids.forEach(function(id){els[id]=el(id);});
const calls = [];
const box = {
  document:{
    getElementById:function(id){return els[id]||null;},
    createElement:function(){return {href:'', download:'', click:function(){box.downloaded=this.download; box.downloads++;}, remove:function(){}};},
    body:{appendChild:function(){}}
  },
  sbRestRpc: async function(name, body){
    calls.push({name:name, body:JSON.parse(JSON.stringify(body||{}))});
    if(name==='admin_timesheet_pay_export')return {ok:true, data:box.exportData};
    return {ok:false, status:404, error:'Could not find the function'};
  },
  showTempMsg: function(m){box.msgs.push(String(m));},
  exportData:null,
  downloaded:'',
  downloads:0,
  msgs:[],
  URL:URL,
  Blob:Blob
};
const srcStart = html.indexOf('var PAYREADY_MARKER');
const src = html.slice(srcStart, html.indexOf(exportFn) + exportFn.length);
vm.createContext(box);
vm.runInContext(src, box);

function csvOf(data){
  return vm.runInContext('payReadyTableToCsv('+JSON.stringify(data)+')', box);
}
function assertReadyFile(csv, readyBit, heldBit){
  assert.ok(csv && csv.trim(), 'file has ready rows');
  const lines = csv.split('\n').filter(Boolean);
  assert.ok(lines.length >= 2, csv);
  assert.ok(csv.includes(readyBit), csv);
  assert.ok(!csv.includes(heldBit), csv);
  lines.slice(1).forEach(function(line){
    assert.ok(!/(^|,)\s*held\s*(,|$)/i.test(line), line);
  });
  assert.ok(!/gross|payroll|hourly_rate|\$|180|240|300/.test(csv), csv);
}

const filtered = csvOf(heldCsv);
assert.strictEqual(filtered.split('\n').length, 2, filtered);
assert.strictEqual(filtered.split('\n')[0], 'Aide,Client,Week,pay_status');
assertReadyFile(filtered, 'payready1 Probe Ready', 'payready1 Probe Held');
assert.ok(/,Ready$/.test(filtered.split('\n')[1]), 'ready cell casing from the RPC csv is kept');

const preferred = csvOf({
  ready_only:false,
  csv:heldCsv,
  columns:['Aide','Client','pay_status'],
  rows:[['From Columns','Should Not Prefer','ready']]
});
assert.ok(preferred.includes('payready1 Probe Ready'), preferred);
assert.ok(!preferred.includes('From Columns') && !preferred.includes('payready1 Probe Held'), preferred);

const rebuilt = csvOf({
  csv:'Aide,Client,gross\nKept From Rows,Ruth Coleman,240\n',
  columns:['Aide','Client','pay_status','gross'],
  rows:[
    ['Held Aide','payready1 Probe Held','held','180'],
    ['Ready Aide','payready1 Probe Ready','ready','240']
  ]
});
assert.strictEqual(rebuilt.split('\n')[0], 'Aide,Client,pay_status');
assertReadyFile(rebuilt, 'payready1 Probe Ready', 'payready1 Probe Held');
assert.ok(!rebuilt.includes('Kept From Rows'), 'a status-less csv yields to rows that can prove ready-only');

const columnsOnly = csvOf({
  columns:['Aide','Client','Week','Readiness','gross'],
  rows:[
    ['Probe QA Test','payready1 Probe Held','09/21/2026\u201309/27/2026','Held','180'],
    ['Maya Brooks','Ruth Coleman','09/21/2026\u201309/27/2026','ready','240']
  ]
});
assert.strictEqual(columnsOnly.split('\n')[0], 'Aide,Client,Week,Readiness');
assert.strictEqual(columnsOnly.split('\n').length, 2);
assertReadyFile(columnsOnly, 'Maya Brooks', 'payready1 Probe Held');

const quoted = csvOf('Aide,Client,Pay Status,amount\n"Ready, Maya","Coleman, Ruth",ready,"1,240"\n"Held, Jordan","payready1 Probe Held",HELD,99\n');
assert.ok(quoted.includes('"Ready, Maya"') && quoted.includes('"Coleman, Ruth"'), quoted);
assert.ok(!quoted.includes('payready1 Probe Held') && !quoted.includes('Held, Jordan'), quoted);
assert.ok(!/amount|1,240|99/.test(quoted), quoted);

const objects = csvOf({
  rows:[
    {aide_name:'Held Aide', client:'payready1 Probe Held', pay_status:'hold', wage:12},
    {aide_name:'Ready Aide', client:'payready1 Probe Ready', pay_status:'ready', net:40}
  ]
});
assert.ok(objects.includes('Ready Aide') && objects.includes('payready1 Probe Ready'), objects);
assert.ok(!objects.includes('payready1 Probe Held') && !/wage|net|12|40/.test(objects), objects);

assert.strictEqual(csvOf(readyOnlyCsv).split('\n').length, 3);
assertReadyFile(csvOf(readyOnlyCsv), 'Maya Brooks', 'payready1 Probe Held');
assert.ok(csvOf(readyOnlyCsv).includes('Alex Nguyen'), 'all-ready keeps every ready row');
assert.strictEqual(csvOf('Aide,pay_status,payroll\nOnly Held,held,50\n'), '');
assert.strictEqual(csvOf({csv:'Aide,pay_status\nOnly Held,Held\n', columns:['Aide'], rows:[['Do not resurrect']]}), '');
assert.strictEqual(csvOf({columns:['Aide','Readiness','gross'], rows:[['Maya','not_ready','15']]}), '');

const mixed = {
  source:'ace',
  week_start:'2026-09-21',
  week_end:'2026-09-27',
  label:'09/21/2026\u201309/27/2026',
  ready_count:1,
  held_count:1,
  rows:[
    {id:'held-1', name:'Probe QA Test', role:'PT', status:'held', reasonLabel:'missing signature'},
    {id:'ready-1', name:'Probe QA Test', role:'PT', status:'ready', reasonLabel:'All current'}
  ]
};
box.payReadyState = mixed;
box.payReadyView = 'list';
vm.runInContext('payReadyPaint()', box);
assert.strictEqual(els.payReadyCount.textContent, 'Ready 1');
assert.strictEqual(els.payHeldCount.textContent, 'Held 1');
assert.strictEqual(els.payReadyExport.hidden, false, 'export shows when ready and held');

box.exportData = {ready_only:true, csv:heldCsv, columns:['Aide'], rows:[['Ignored','ready']]};
calls.length = 0;
box.downloads = 0;
vm.runInContext('payReadyExport()', box).then(function(csv){
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].name, 'admin_timesheet_pay_export');
  assert.deepStrictEqual(calls[0].body, {p_week_start:'2026-09-21'});
  assertReadyFile(csv, 'payready1 Probe Ready', 'payready1 Probe Held');
  assert.strictEqual(box.downloads, 1);
  assert.ok(box.downloaded.indexOf('EverCare_Ready_List_2026-09-21')===0, box.downloaded);

  box.exportData = {csv:'Aide,Client,pay_status,gross\nHeld Aide,payready1 Probe Held,held,180\n'};
  box.downloads = 0;
  box.downloaded = 'nope';
  box.msgs = [];
  calls.length = 0;
  return vm.runInContext('payReadyExport()', box);
}).then(function(empty){
  assert.strictEqual(empty, '');
  assert.strictEqual(box.downloads, 0, 'held-only export does not download a file');
  assert.strictEqual(box.downloaded, 'nope');
  assert.ok(box.msgs.some(function(m){return m.indexOf('No ready timesheets to export.')>=0;}), box.msgs.join('|'));
  assert.deepStrictEqual(calls[0].body, {p_week_start:'2026-09-21'});

  box.payReadyState = {
    source:'ace', week_start:'2026-09-21', week_end:'2026-09-27',
    label:'09/21/2026\u201309/27/2026', ready_count:2, held_count:0, rows:[]
  };
  vm.runInContext('payReadyPaint()', box);
  assert.strictEqual(els.payHeldCount.textContent, 'Held 0');
  assert.strictEqual(els.payReadyEmptyTitle.textContent, 'All 2 timesheets ready');
  assert.strictEqual(els.payReadyExport.hidden, false, 'Held 0 still shows export');
  box.exportData = readyOnlyCsv;
  calls.length = 0;
  return vm.runInContext('payReadyExport()', box);
}).then(function(clearCsv){
  assert.deepStrictEqual(calls[0].body, {p_week_start:'2026-09-21'});
  assert.strictEqual(clearCsv.split('\n').length, 3);
  assertReadyFile(clearCsv, 'Alex Nguyen', 'payready1 Probe Held');
  return runBrowser();
}).then(function(){
  console.log('admin-payready1d-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});

function loadPuppeteer(){
  try{return require('puppeteer-core');}
  catch(e){
    try{return require('/tmp/pptr/node_modules/puppeteer-core');}
    catch(e2){return null;}
  }
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-payready1d browser skipped (no puppeteer-core)');
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
    const mixedShot = path.join(shotDir, 'payready1d-phone-held-and-ready.png');
    const clearShot = path.join(shotDir, 'payready1d-phone-all-ready.png');
    const phone = await page.evaluate(async function(heldCsv, readyOnlyCsv){
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      layoutA1ApplyRoles();
      showScreen('adminScreen');
      var calls = [];
      window.__payCalls = calls;
      window.__payBlobs = [];
      var origUrl = URL.createObjectURL;
      URL.createObjectURL = function(blob){
        window.__payBlobs.push(blob);
        return origUrl.call(URL, blob);
      };
      window.__payMode = 'mixed';
      window.sbRestRpc = async function(name, body){
        calls.push({name:name, body:body});
        if(name==='admin_timesheet_pay_export'){
          if(window.__payMode==='clear')return {ok:true, data:readyOnlyCsv};
          return {ok:true, data:{ready_only:false, csv:heldCsv, columns:['Aide'], rows:[['Ignored column row','ready']]}};
        }
        return {ok:false, status:404, error:'stub'};
      };
      payReadyState = {
        source:'ace',
        week_start:'2026-09-21',
        week_end:'2026-09-27',
        label:'09/21/2026\u201309/27/2026',
        ready_count:1,
        held_count:1,
        rows:[
          {id:'1cedf9f7', timesheet_id:'1cedf9f7', name:'Probe QA Test', role:'PT', client:'payready1 Probe Held', status:'held', reason:'missing_signature', reasonLabel:'missing signature'},
          {id:'c1965303', timesheet_id:'c1965303', name:'Probe QA Test', role:'PT', client:'payready1 Probe Ready', status:'ready', reasonLabel:'All current'}
        ]
      };
      payReadyView = 'list';
      payReadySelected = '';
      payReadyPaint();
      var btn = document.getElementById('payReadyExport');
      btn.scrollIntoView({block:'center'});
      var box = btn.getBoundingClientRect();
      var fab = document.getElementById('copilotFab');
      var fabBox = fab.getBoundingClientRect();
      return {
        build: document.querySelector('meta[name="admin-build"]').content,
        marker: document.getElementById('payReady').getAttribute('data-payready1d'),
        prior: document.getElementById('payReady').getAttribute('data-payready1c'),
        week: document.getElementById('payReadyWeek').textContent,
        ready: document.getElementById('payReadyCount').textContent,
        held: document.getElementById('payHeldCount').textContent,
        text: btn.textContent.replace(/\s+/g,' ').trim(),
        hidden: btn.hidden,
        off: btn.classList.contains('pay-export-off'),
        display: getComputedStyle(btn).display,
        width: box.width,
        height: box.height,
        viewW: window.innerWidth,
        fabText: fab.innerText.replace(/\s+/g,' ').trim(),
        fabInPay: !!document.getElementById('payReady').querySelector('#copilotFab'),
        fabRight: fabBox.right,
        fabTop: fabBox.top
      };
    }, heldCsv, readyOnlyCsv);
    assert.strictEqual(phone.build, '2026-09-25-coverpick1');
    assert.strictEqual(phone.marker, 'v=payready1d');
    assert.strictEqual(phone.prior, 'v=payready1c');
    assert.ok(phone.viewW >= 380 && phone.viewW <= 400, 'phone width '+phone.viewW);
    assert.strictEqual(phone.ready, 'Ready 1');
    assert.strictEqual(phone.held, 'Held 1');
    assert.strictEqual(phone.text, 'Export ready list');
    assert.strictEqual(phone.hidden, false);
    assert.strictEqual(phone.off, false);
    assert.strictEqual(phone.display, 'flex');
    assert.ok(phone.width >= 300, 'export is full width on a phone '+phone.width);
    assert.ok(phone.height >= 44, 'export is tappable '+phone.height);
    assert.strictEqual(phone.fabInPay, false);
    assert.ok(/Remi/.test(phone.fabText), phone.fabText);
    assert.ok(phone.fabRight > phone.viewW - 90 && phone.fabTop > 400, 'Remi stays the corner chip');
    await page.evaluate(function(){ window.scrollTo(0, 0); });
    await page.screenshot({path: mixedShot});

    await page.click('#payReadyExport');
    await page.waitForFunction(function(){return window.__payBlobs && window.__payBlobs.length>0;});
    const mixedFile = await page.evaluate(async function(){
      return {
        calls: window.__payCalls,
        csv: await window.__payBlobs[0].text()
      };
    });
    assert.strictEqual(mixedFile.calls[0].name, 'admin_timesheet_pay_export');
    assert.deepStrictEqual(mixedFile.calls[0].body, {p_week_start:'2026-09-21'});
    assert.strictEqual(mixedFile.csv.split('\n').filter(Boolean).length, 2, mixedFile.csv);
    assertReadyFile(mixedFile.csv, 'payready1 Probe Ready', 'payready1 Probe Held');
    assert.ok(!/pay_status,held|,held,|held\s*$/i.test(mixedFile.csv), mixedFile.csv);

    const clearPhone = await page.evaluate(async function(){
      window.__payMode = 'clear';
      window.__payBlobs.length = 0;
      window.__payCalls.length = 0;
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
      btn.scrollIntoView({block:'center'});
      var box = btn.getBoundingClientRect();
      var csv = await payReadyExportList();
      var file = window.__payBlobs[0] ? await window.__payBlobs[0].text() : '';
      return {
        held: document.getElementById('payHeldCount').textContent,
        title: document.getElementById('payReadyTitle').textContent,
        emptyTitle: document.getElementById('payReadyEmptyTitle').textContent,
        sub: document.getElementById('payReadyEmptySub').textContent,
        markHidden: document.getElementById('payReadyMark').hidden,
        display: getComputedStyle(btn).display,
        text: btn.textContent.replace(/\s+/g,' ').trim(),
        height: box.height,
        width: box.width,
        csv: csv,
        file: file,
        body: window.__payCalls[0] && window.__payCalls[0].body
      };
    });
    assert.strictEqual(clearPhone.held, 'Held 0');
    assert.strictEqual(clearPhone.title, 'Pay ready');
    assert.strictEqual(clearPhone.emptyTitle, 'All 2 timesheets ready');
    assert.strictEqual(clearPhone.sub, 'Nothing held this pay period');
    assert.strictEqual(clearPhone.markHidden, false);
    assert.strictEqual(clearPhone.display, 'flex');
    assert.strictEqual(clearPhone.text, 'Export ready list');
    assert.ok(clearPhone.height >= 44 && clearPhone.width >= 300, clearPhone.height+'x'+clearPhone.width);
    assert.deepStrictEqual(clearPhone.body, {p_week_start:'2026-09-21'});
    assert.strictEqual(clearPhone.file, clearPhone.csv);
    assert.strictEqual(clearPhone.file.split('\n').length, 3);
    assertReadyFile(clearPhone.file, 'Maya Brooks', 'payready1 Probe Held');
    assert.ok(clearPhone.file.includes('Alex Nguyen'));
    await page.evaluate(function(){ window.scrollTo(0, 0); });
    await page.screenshot({path: clearShot});
  }finally{
    await browser.close();
    server.close();
  }
}
