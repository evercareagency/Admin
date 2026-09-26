#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function extractFn(src, sig){
  const start = src.indexOf(sig);
  if(start < 0)return '';
  let i = src.indexOf('{', start);
  let depth = 0;
  for(; i < src.length; i++){
    if(src[i] === '{')depth++;
    else if(src[i] === '}'){
      depth--;
      if(depth === 0)return src.slice(start, i + 1);
    }
  }
  return '';
}

assert.ok(html.includes('v=clienthrs1a'), 'clienthrs1a marker');
assert.ok(html.includes('data-clienthrs1a="v=clienthrs1a"'), 'clienthrs1a string marker');
assert.ok(html.includes('admin-build 2026-09-26-clienthrs1a'), 'clienthrs1a build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-26-clienthrs1a">'), 'clienthrs1a meta');
assert.ok(html.includes('<!-- weekly authorized hours 2026-09-26 v=clienthrs1a admin-build 2026-09-26-clienthrs1a'), 'clienthrs1a comment');
assert.ok(html.includes('GHOST-CLIENTHRS1A-CONTRACT-v1'), 'clienthrs1a contract');
assert.ok(html.includes('admin_add_client(p_case_manager_email, p_case_manager_name, p_first_name, p_home_address, p_last_name, p_phone, p_weekly_authorized_hours)'), 'live admin_add_client arguments');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-26-clienthrs1b'), 'clienthrs1b is the first admin-build meta');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-aidechat1">'), 'aidechat1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remiask1">'), 'remiask1 meta stays');
assert.ok(html.indexOf('content="2026-09-26-clienthrs1a"') < html.indexOf('content="2026-09-25-aidechat1"'), 'aidechat1 stays below clienthrs1a');
assert.ok(html.indexOf('content="2026-09-25-aidechat1"') < html.indexOf('content="2026-09-25-remiask1"'), 'remiask1 stays after aidechat1');
assert.ok(html.includes("var CLIENTHRS_MARKER='v=clienthrs1a'"), 'clienthrs1a script marker');

const modal = html.slice(html.indexOf('id="clientModal"'), html.indexOf('id="locationMapModal"'));
assert.ok(modal.includes('Weekly authorized hours (hrs/week)'), 'label');
assert.ok(modal.includes('One weekly bucket for this client. All assigned aides fill the same hours.'), 'hint');
assert.ok(modal.includes('id="clientWeeklyHours"'), 'hours input');
assert.ok(/id="clientWeeklyHours"[^>]*type="number"|type="number"[^>]*id="clientWeeklyHours"/.test(modal), 'number input');
assert.ok(modal.includes('min="0"'), 'min 0');
assert.ok(modal.indexOf('clientWeeklyHours') < modal.indexOf('Assigned Aides'), 'hours sit above Assigned Aides');
assert.ok(modal.indexOf('Verify Address') < modal.indexOf('clientWeeklyHours'), 'verify address stays above the hours field');
assert.ok(modal.includes('Save Client'), 'Save Client stays');
assert.ok(modal.includes('Cancel'), 'Cancel stays');
assert.ok(modal.includes('id="assignAidesList"'), 'Assigned Aides list stays');
assert.ok(!/localStorage\.setItem\([^)]*weekly_authorized_hours/.test(html), 'hours are not stored on this phone');

const saveSrc = extractFn(html, 'async function saveClient()');
assert.ok(saveSrc.includes('weekly_authorized_hours'), 'save sends the Ace field name');
assert.ok(saveSrc.includes('payload.weekly_authorized_hours=hours.value'), 'a typed number is sent');
assert.ok(saveSrc.includes('payload.weekly_authorized_hours=null'), 'clearing a known value sends null');
const fillSrc = extractFn(html, 'function clientHoursFill(c)');
assert.ok(fillSrc.includes('weeklyAuthorizedHours'), 'edit accepts camelCase');
assert.ok(fillSrc.includes('weekly_authorized_hours'), 'edit accepts snake_case');

const select = (html.match(/var SB_CLIENT_SELECT='([^']+)'/) || [])[1];
assert.ok(select.includes('weekly_authorized_hours'), 'client read selects the Ace column');
assert.ok(select.includes('assignments:assignments'), 'assignments select stays');

function harness(route){
  const calls = [];
  const box = {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon',
    SB_CLIENT_SELECT: select,
    fetch: function(url, init){
      calls.push({url:String(url), init:init||{}});
      const res = route(String(url), init||{});
      return Promise.resolve({
        ok: res.ok !== false && (res.status||200) < 400,
        status: res.status||200,
        text: function(){return Promise.resolve(res.raw==null?'':res.raw);}
      });
    },
    JSON: JSON,
    String: String,
    Promise: Promise,
    Date: Date,
    Object: Object,
    Array: Array,
    Number: Number,
    isFinite: isFinite,
    encodeURIComponent: encodeURIComponent
  };
  const names = [
    'function sbClientHoursState()',
    'function sbClientHoursValue(payload)',
    'function sbClientHoursColumnMissing(got)',
    'function sbClientHoursRpcMissing(got)',
    'function sbClientHoursRpcBodies(payload)',
    'function sbClientDeskPayload(payload)',
    'function sbClientDeskBody(payload)',
    'function sbCoord(v)',
    'function sbOrgId()',
    'function sbClientWriteBody(payload, isCreate)',
    'async function sbPatchClientHours(id, hours)',
    'async function sbAdminUpdateClient(payload)',
    'async function sbRestMutate(method, table, pairs, body, prefer, refreshed)',
    'async function sbRestRpc(fnName, body)',
    'function sbFilterQuery(pairs)',
    'function sbAuthErrorMessage(data,status)',
    'function readSbSession()',
    'function sbActiveLinks(rows)',
    'function sbMapClient(row)',
    'function sbFirstRow(data)',
    'function sbRpcNode(data)',
    'function sbRpcError(node)',
    'function sbAsJsonObject(v)',
    'async function sbTrySaveClientDesk(payload)',
    'function sbAssignedNames(payload)'
  ];
  const src = names.map(function(sig){
    const fn = extractFn(html, sig);
    assert.ok(fn, 'missing '+sig);
    return fn;
  }).join('\n');
  vm.createContext(box);
  vm.runInContext(src, box);
  box.readSbSession = function(){return {access_token:'office-jwt'};};
  return {box:box, calls:calls};
}

const hours = harness(function(){return {status:500, raw:'{}'};}).box;
assert.strictEqual(hours.sbClientHoursValue({name:'Ada'}), undefined, 'missing key omits');
assert.strictEqual(hours.sbClientHoursValue({weekly_authorized_hours:null}), null, 'null stays null');
assert.strictEqual(hours.sbClientHoursValue({weekly_authorized_hours:''}), null, 'blank is null');
assert.strictEqual(hours.sbClientHoursValue({weekly_authorized_hours:63}), 63, 'number stays a number');
assert.strictEqual(hours.sbClientHoursValue({weeklyAuthorizedHours:'27'}), 27, 'camelCase string becomes a number');
assert.strictEqual(hours.sbClientHoursValue({weekly_authorized_hours:0}), 0, 'zero is a number');
assert.strictEqual(hours.sbClientHoursValue({weekly_authorized_hours:-1}), undefined, 'negative is not sent');

const plain = hours.sbClientWriteBody({name:'Ada Cole', address:'1 Main', lat:'', lng:''}, false);
assert.ok(!Object.prototype.hasOwnProperty.call(plain, 'weekly_authorized_hours'), 'update without the key omits it');
const numbered = hours.sbClientWriteBody({name:'Ada Cole', address:'1 Main', lat:'1', lng:'2', weekly_authorized_hours:63}, false);
assert.ok(!Object.prototype.hasOwnProperty.call(numbered, 'weekly_authorized_hours'), 'name and address stay on their own body');
assert.strictEqual(numbered.name, 'Ada Cole');
const rpcSrc = extractFn(html, 'function sbClientHoursRpcBodies(payload)');
assert.ok(rpcSrc.includes('p_weekly_authorized_hours'), 'create passes the locked RPC argument');
assert.strictEqual(rpcSrc.split('p_weekly_authorized_hours').join('').indexOf('weekly_authorized_hours'), -1, 'no alternate RPC argument name');
const patchSrc = extractFn(html, 'async function sbPatchClientHours(id, hours)');
assert.ok(patchSrc.includes("sbRestMutate('PATCH','clients'"), 'edit patches clients');
assert.ok(patchSrc.includes("['id','eq.'+id]"), 'edit patches id=eq.<uuid>');
assert.ok(patchSrc.includes('weekly_authorized_hours:hours'), 'edit body is the locked column');

const mappedSnake = hours.sbMapClient({id:'c1', name:'Ada', address:'1', is_active:true, weekly_authorized_hours:27, assignments:[]});
assert.strictEqual(mappedSnake.weekly_authorized_hours, 27);
assert.strictEqual(mappedSnake.weeklyAuthorizedHours, 27);
const mappedCamel = hours.sbMapClient({id:'c2', name:'Ada', address:'1', is_active:true, weeklyAuthorizedHours:63, assignments:[]});
assert.strictEqual(mappedCamel.weekly_authorized_hours, 63);
const mappedBare = hours.sbMapClient({id:'c3', name:'Ada', address:'1', is_active:true, assignments:[]});
assert.ok(!Object.prototype.hasOwnProperty.call(mappedBare, 'weekly_authorized_hours'), 'a row without the column does not invent hours');

const desk = hours.sbClientDeskBody({firstName:'Ada', lastName:'Cole', address:'1 Main', caseManagerName:'Pat', caseManagerEmail:'pat@example.com', phone:'', weekly_authorized_hours:63});
assert.ok(!Object.prototype.hasOwnProperty.call(desk, 'weekly_authorized_hours'), 'the base desk body stays the existing args');
assert.ok(!Object.prototype.hasOwnProperty.call(desk, 'p_weekly_authorized_hours'));
const bodies = hours.sbClientHoursRpcBodies({firstName:'Ada', lastName:'Cole', address:'1 Main', weekly_authorized_hours:63});
assert.strictEqual(bodies.length, 2, 'optional argument, then the same call without it');
assert.strictEqual(bodies[0].p_weekly_authorized_hours, 63);
assert.strictEqual(bodies[0].p_first_name, 'Ada');
assert.ok(!Object.prototype.hasOwnProperty.call(bodies[0], 'weekly_authorized_hours'), 'RPC body does not use the column name');
assert.ok(!Object.prototype.hasOwnProperty.call(bodies[1], 'p_weekly_authorized_hours'));
assert.ok(!Object.prototype.hasOwnProperty.call(bodies[1], 'weekly_authorized_hours'));
assert.strictEqual(bodies[1].p_last_name, 'Cole');

(async function(){
  const clientId = '11111111-1111-4111-8111-111111111111';
  const missingRpc = harness(function(url, init){
    const body = JSON.parse(init.body||'{}');
    if(url.indexOf('/rpc/admin_add_client')>0){
      if(body.p_weekly_authorized_hours!=null||body.weekly_authorized_hours!=null){
        return {status:404, ok:false, raw:JSON.stringify({code:'PGRST202', message:'Could not find the function public.admin_add_client in the schema cache'})};
      }
      return {status:200, raw:JSON.stringify({id:clientId, name:'Ada Cole', address:'1 Main', first_name:'Ada', last_name:'Cole'})};
    }
    if(url.indexOf('/rest/v1/clients')>0 && init.method==='PATCH'){
      if(Object.prototype.hasOwnProperty.call(body, 'weekly_authorized_hours')){
        return {status:400, ok:false, raw:JSON.stringify({code:'PGRST204', message:"Could not find the 'weekly_authorized_hours' column of 'clients' in the schema cache"})};
      }
      return {status:200, raw:JSON.stringify([{id:clientId, name:body.name||'Ada Cole', address:body.address||'1 Main'}])};
    }
    return {status:500, ok:false, raw:JSON.stringify({message:'unexpected '+url})};
  });
  const added = await missingRpc.box.sbTrySaveClientDesk({
    firstName:'Ada', lastName:'Cole', name:'Ada Cole', address:'1 Main', weekly_authorized_hours:63
  });
  assert.strictEqual(added.ok, true, added.error||'rpc retry');
  assert.strictEqual(added.hoursOnWire, false, 'missing hours arg is not left on the wire');
  assert.strictEqual(added.id, clientId);
  const rpcCalls = missingRpc.calls.filter(function(c){return c.url.indexOf('admin_add_client')>0;});
  assert.strictEqual(rpcCalls.length, 2, 'p_weekly_authorized_hours, then the same callable without it');
  assert.strictEqual(JSON.parse(rpcCalls[0].init.body).p_weekly_authorized_hours, 63);
  const lastRpc = JSON.parse(rpcCalls[1].init.body);
  assert.strictEqual(lastRpc.p_first_name, 'Ada');
  assert.strictEqual(lastRpc.p_last_name, 'Cole');
  assert.strictEqual(lastRpc.p_home_address, '1 Main');
  assert.ok(!Object.prototype.hasOwnProperty.call(lastRpc, 'weekly_authorized_hours'));
  assert.ok(!Object.prototype.hasOwnProperty.call(lastRpc, 'p_weekly_authorized_hours'));

  const column = harness(function(url, init){
    const body = JSON.parse(init.body||'{}');
    if(init.method==='PATCH' && Object.prototype.hasOwnProperty.call(body, 'weekly_authorized_hours')){
      return {status:400, ok:false, raw:JSON.stringify({code:'42703', message:'column clients.weekly_authorized_hours does not exist'})};
    }
    if(init.method==='PATCH'){
      return {status:200, raw:JSON.stringify([Object.assign({id:clientId}, body)])};
    }
    return {status:500, ok:false, raw:JSON.stringify({message:'unexpected'})};
  });
  const updated = await column.box.sbAdminUpdateClient({
    id:clientId, name:'Ada Cole', address:'9 Oak', lat:'', lng:'', weekly_authorized_hours:63
  });
  assert.strictEqual(updated.success, true, updated.error||'column miss still saves the client');
  assert.strictEqual(column.calls.length, 2, 'name patch, then the hours column patch');
  const saved = JSON.parse(column.calls[0].init.body);
  assert.strictEqual(saved.name, 'Ada Cole');
  assert.strictEqual(saved.address, '9 Oak');
  assert.ok(!Object.prototype.hasOwnProperty.call(saved, 'weekly_authorized_hours'));
  assert.ok(column.calls[1].url.indexOf('/rest/v1/clients?')>0, column.calls[1].url);
  assert.ok(decodeURIComponent(column.calls[1].url).indexOf('id=eq.'+clientId)>0, column.calls[1].url);
  assert.deepStrictEqual(JSON.parse(column.calls[1].init.body), {weekly_authorized_hours:63});

  const cleared = harness(function(url, init){
    const body = JSON.parse(init.body||'{}');
    if(init.method==='PATCH' && Object.keys(body).length===1 && Object.prototype.hasOwnProperty.call(body, 'weekly_authorized_hours')){
      return {status:200, raw:JSON.stringify([Object.assign({id:clientId, name:'Ada Cole', address:'9 Oak'}, body)])};
    }
    if(init.method==='PATCH')return {status:200, raw:JSON.stringify([{id:clientId, name:'Ada Cole', address:'9 Oak'}])};
    return {status:500, ok:false, raw:JSON.stringify({message:'unexpected'})};
  });
  const nulled = await cleared.box.sbAdminUpdateClient({
    id:clientId, name:'Ada Cole', address:'9 Oak', lat:'', lng:'', weekly_authorized_hours:null
  });
  assert.strictEqual(nulled.success, true);
  assert.strictEqual(nulled.data.weekly_authorized_hours, null);
  const hoursCall = cleared.calls.filter(function(c){return Object.prototype.hasOwnProperty.call(JSON.parse(c.init.body||'{}'), 'weekly_authorized_hours');})[0];
  assert.deepStrictEqual(JSON.parse(hoursCall.init.body), {weekly_authorized_hours:null});

  const live = harness(function(url, init){
    const body = JSON.parse(init.body||'{}');
    if(url.indexOf('admin_add_client')>0 && body.p_weekly_authorized_hours===27){
      return {status:200, raw:JSON.stringify({id:clientId, name:'Ada Cole', address:'1 Main', weekly_authorized_hours:27})};
    }
    return {status:500, ok:false, raw:JSON.stringify({message:'live rpc should accept p_weekly_authorized_hours'})};
  });
  const created = await live.box.sbTrySaveClientDesk({
    firstName:'Ada', lastName:'Cole', name:'Ada Cole', address:'1 Main', weekly_authorized_hours:27
  });
  assert.strictEqual(created.ok, true);
  assert.strictEqual(created.hoursOnWire, true);
  assert.strictEqual(created.mapped.weekly_authorized_hours, 27);
  assert.strictEqual(live.calls.length, 1, 'a live hours argument does not fall through');

  console.log('admin-clienthrs1a-test: ok');
  if(process.env.CLIENTHRS_SKIP_BROWSER==='1')return;
  await runBrowser();
})().catch(function(err){
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
    console.log('admin-clienthrs1a browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.CLIENTHRS_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive:true});
  const root = __dirname;
  const types = {'.html':'text/html; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.js':'text/javascript'};
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url||'/').split('?')[0]);
    const rel = urlPath==='/'?'index.html':urlPath.replace(/^\/+/, '');
    const file = path.normalize(path.join(root, rel));
    if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404);res.end('missing');return;}
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, {'Content-Type':types[ext]||'application/octet-stream', 'Cache-Control':'no-store'});
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
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=clienthrs1a', {waitUntil:'domcontentloaded', timeout:20000});
    const shot = path.join(shotDir, 'clienthrs1a-add-client-phone.png');
    const placed = await page.evaluate(async function(){
      loadAidesForAssignment = async function(){
        var box = document.getElementById('assignAidesList');
        if(!box)return;
        box.innerHTML = ''
          + '<label style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border)"><input type="checkbox" class="assign-aide-cb" checked value="aidex"> <span>Aide X <span style="color:var(--muted)">@aidex</span></span></label>'
          + '<label style="display:flex;align-items:center;gap:8px;padding:7px 0"><input type="checkbox" class="assign-aide-cb" checked value="aidey"> <span>Aide Y <span style="color:var(--muted)">@aidey</span></span></label>';
      };
      showAddClientModal();
      await loadAidesForAssignment(['aidex','aidey']);
      document.getElementById('clientFirstName').value = 'Ada';
      document.getElementById('clientLastName').value = 'Cole';
      document.getElementById('clientAddress').value = '142 Maple St, Brooklyn, NY 11201';
      document.getElementById('clientWeeklyHours').value = '63';
      var bg = document.getElementById('clientModal');
      var hrs = document.querySelector('#clientModal .client-hrs');
      var aides = document.getElementById('assignAidesList');
      bg.scrollTop = Math.max(0, hrs.offsetTop - 56);
      var hrsBox = hrs.getBoundingClientRect();
      var aidesCard = aides.closest('.card').getBoundingClientRect();
      var input = document.getElementById('clientWeeklyHours').getBoundingClientRect();
      return {
        build: document.querySelector('meta[name="admin-build"]').content,
        marker: document.querySelector('[data-clienthrs1a]').getAttribute('data-clienthrs1a'),
        title: document.getElementById('clientModalTitle').textContent,
        label: document.querySelector('label[for="clientWeeklyHours"]').textContent,
        hint: document.querySelector('#clientModal .client-hrs-hint').textContent,
        value: document.getElementById('clientWeeklyHours').value,
        min: document.getElementById('clientWeeklyHours').getAttribute('min'),
        above: hrsBox.bottom <= aidesCard.top + 1,
        inputW: input.width,
        inputH: input.height,
        viewW: window.innerWidth,
        scrollW: document.documentElement.scrollWidth,
        modalW: bg.getBoundingClientRect().width,
        aidesText: (aides && (aides.innerText || aides.textContent)) || ''
      };
    });
    assert.strictEqual(placed.build, '2026-09-26-clienthrs1b');
    assert.strictEqual(placed.marker, 'v=clienthrs1a');
    assert.strictEqual(placed.title, 'Add Client');
    assert.strictEqual(placed.label, 'Weekly authorized hours (hrs/week)');
    assert.strictEqual(placed.hint, 'One weekly bucket for this client. All assigned aides fill the same hours.');
    assert.strictEqual(placed.value, '63');
    assert.strictEqual(placed.min, '0');
    assert.strictEqual(placed.above, true, 'hours card is above Assigned Aides');
    assert.ok(placed.inputH >= 44, 'hours input tap target '+placed.inputH);
    assert.ok(placed.inputW >= 200, 'hours input uses the phone width '+placed.inputW);
    assert.ok(placed.scrollW <= placed.viewW + 1, 'page does not scroll sideways '+placed.scrollW);
    assert.ok(placed.modalW <= 390 + 1, 'modal fits the phone '+placed.modalW);
    assert.ok(/aide x/i.test(placed.aidesText) && /aide y/i.test(placed.aidesText), 'assigned aides still render');
    await page.screenshot({path:shot, type:'png'});
    const editShot = path.join(shotDir, 'clienthrs1a-edit-client-phone.png');
    await page.evaluate(function(){
      document.getElementById('clientModalTitle').textContent = 'Edit Client';
      document.getElementById('clientWeeklyHours').value = '27';
      var bg = document.getElementById('clientModal');
      var hrs = document.querySelector('#clientModal .client-hrs');
      bg.scrollTop = Math.max(0, hrs.offsetTop - 56);
    });
    await page.screenshot({path:editShot, type:'png'});
    console.log('admin-clienthrs1a phone shots', shot, editShot);
  }finally{
    await browser.close();
    server.close();
  }
}
