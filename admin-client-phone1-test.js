#!/usr/bin/env node
'use strict';
require('./test-block-apps-script.js');

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

assert.ok(html.includes('v=client-phone1'), 'client-phone1 marker');
assert.ok(html.includes('data-client-phone1="v=client-phone1"'), 'client-phone1 field marker');
assert.ok(html.includes('admin-build 2026-09-28-client-phone1'), 'client-phone1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-28-client-phone1">'), 'client-phone1 meta');
assert.ok(html.includes('<!-- client phone 2026-09-28 v=client-phone1 admin-build 2026-09-28-client-phone1') || html.includes('<!-- client phone 2026-09-28 v=client-phone1 ?v=client-phone1 admin-build 2026-09-28-client-phone1'), 'top comment');
assert.ok(html.includes('<!-- v=client-phone1 admin-build 2026-09-28-client-phone1. Client Phone is clients.phone / p_phone after Home Address. Case manager is name + email only. -->'), 'modal comment');
assert.ok(html.includes("var CLIENT_PHONE1_MARKER='v=client-phone1'"), 'script marker');
assert.ok(html.includes('GHOST-CLIENT-PHONE1-CONTRACT-v1'), 'contract');
assert.ok(html.includes('Ace CALLABLE'), 'Ace CALLABLE');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');

const modal = html.slice(html.indexOf('id="clientModal"'), html.indexOf('id="locationMapModal"'));
assert.ok(modal.includes('>Client Phone<'), 'Client Phone label');
assert.ok(modal.includes('placeholder="(216) 555-0100"'), 'phone placeholder');
assert.ok(modal.includes('id="clientPhone"'), 'clientPhone stays');
assert.ok(!/>Phone</.test(modal), 'bare Phone label is gone from this modal');
assert.ok(!/case manager phone/i.test(modal), 'no Case Manager Phone label');
assert.ok(!/id="clientCmPhone"|case_manager_phone/.test(modal), 'no CM phone field');
assert.ok(modal.includes('Case manager · name + email only'), 'CM stays name + email only');
assert.ok(modal.includes('id="clientCmName"') && modal.includes('id="clientCmEmail"'), 'CM name and email stay');
assert.ok(modal.includes('id="clientInsChips"'), 'insurance chips stay');
assert.ok(modal.includes('Weekly authorized hours (hrs/week)'), 'weekly hours stay');
assert.ok(modal.includes('id="clientCoverPrefs"'), 'cover prefs stay');
assert.ok(modal.includes('Verify Address & Get GPS Coordinates'), 'verify address stays');
assert.ok(modal.includes('Assigned Aides'), 'assigned aides stay');
assert.ok(modal.includes('Cancel') && modal.includes('Save Client'), 'cancel and save stay');

const order = ['clientFirstName','clientLastName','clientAddress','clientPhone','clientCmName','clientCmEmail','clientInsChips','Verify Address','clientWeeklyHours','clientCoverPrefs','assignAidesList','Cancel','Save Client'];
let at = -1;
order.forEach(function(token){
  const next = modal.indexOf(token);
  assert.ok(next > at, 'order '+token+' after previous');
  at = next;
});

const select = (html.match(/var SB_CLIENT_SELECT='([^']+)'/) || [])[1];
assert.ok(select.includes(',phone,'), 'client list selects phone');
assert.ok(select.includes('weekly_authorized_hours') && select.includes('insurance_plan'), 'hours and insurance stay on the select');
assert.ok(select.indexOf(',phone,') < select.indexOf(',lat,'), 'phone sits with the client columns');

const editSrc = extractFn(html, 'function editClient(id)');
assert.ok(editSrc.includes("phoneEl.value=c.phone||c.client_phone||''"), 'edit fills #clientPhone');
const updateSrc = extractFn(html, 'async function sbAdminUpdateClient(payload)');
assert.ok(updateSrc.includes("sbRestMutate('PATCH','clients'"), 'edit patches clients');
assert.ok(updateSrc.includes('{phone:phoneText}'), 'edit body is {phone}');
assert.ok(updateSrc.includes("'id','eq.'+String(row.id||id)"), 'edit patches id=eq.<uuid>');
assert.ok(!/admin_update_client\(/.test(updateSrc), 'edit does not call admin_update_client');
const deskSrc = extractFn(html, 'function sbClientDeskBody(payload)');
assert.ok(deskSrc.includes('p_phone'), 'add passes p_phone');
assert.ok(!deskSrc.includes('case_manager_phone') && !deskSrc.includes('p_case_manager_phone'), 'add does not invent a CM phone arg');

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
    'async function sbRestMutate(method, table, pairs, body, prefer, refreshed, signal)',
    'async function sbRestRpc(fnName, body, signal)',
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

const idle = harness(function(){return {status:500, raw:'{}'};}).box;
const mapped = idle.sbMapClient({id:'c1', name:'Ada Cole', address:'1 Main', is_active:true, phone:'(216) 555-0100', assignments:[]});
assert.strictEqual(mapped.phone, '(216) 555-0100');
const mappedNull = idle.sbMapClient({id:'c2', name:'Ada', address:'1', is_active:true, phone:null, assignments:[]});
assert.strictEqual(mappedNull.phone, '');
const mappedAlt = idle.sbMapClient({id:'c3', name:'Ada', address:'1', is_active:true, client_phone:'2165550199', assignments:[]});
assert.strictEqual(mappedAlt.phone, '2165550199');
const mappedBare = idle.sbMapClient({id:'c4', name:'Ada', address:'1', is_active:true, assignments:[]});
assert.ok(!Object.prototype.hasOwnProperty.call(mappedBare, 'phone'), 'a row without the column does not invent a phone');

const withPhone = idle.sbClientDeskBody({
  firstName:'Ada', lastName:'Cole', address:'1 Main',
  caseManagerName:'Pat Lee', caseManagerEmail:'pat@example.com',
  phone:'(216) 555-0100'
});
assert.strictEqual(withPhone.p_phone, '(216) 555-0100');
assert.strictEqual(withPhone.p_first_name, 'Ada');
assert.strictEqual(withPhone.p_home_address, '1 Main');
assert.strictEqual(withPhone.p_case_manager_name, 'Pat Lee');
assert.strictEqual(withPhone.p_case_manager_email, 'pat@example.com');
assert.ok(!Object.prototype.hasOwnProperty.call(withPhone, 'p_case_manager_phone'));
const emptyPhone = idle.sbClientDeskBody({firstName:'Ada', lastName:'Cole', address:'1 Main', phone:''});
assert.ok(!Object.prototype.hasOwnProperty.call(emptyPhone, 'p_phone'), 'empty add omits p_phone');

(async function(){
  const clientId = '11111111-1111-4111-8111-111111111111';
  const added = harness(function(url, init){
    const body = JSON.parse(init.body||'{}');
    if(url.indexOf('/rpc/admin_add_client')>0){
      assert.strictEqual(body.p_phone, '(216) 555-0100');
      assert.ok(!Object.prototype.hasOwnProperty.call(body, 'p_case_manager_phone'));
      return {status:200, raw:JSON.stringify({id:clientId, name:'Ada Cole', address:'1 Main', phone:'(216) 555-0100', first_name:'Ada', last_name:'Cole'})};
    }
    return {status:500, ok:false, raw:JSON.stringify({message:'unexpected '+url})};
  });
  const created = await added.box.sbTrySaveClientDesk({
    firstName:'Ada', lastName:'Cole', name:'Ada Cole', address:'1 Main',
    caseManagerName:'Pat Lee', caseManagerEmail:'pat@example.com', phone:'(216) 555-0100'
  });
  assert.strictEqual(created.ok, true, created.error||'add');
  assert.strictEqual(created.mapped.phone, '(216) 555-0100');
  assert.strictEqual(added.calls.length, 1, 'one admin_add_client call');

  const edited = harness(function(url, init){
    const body = JSON.parse(init.body||'{}');
    if(init.method==='PATCH' && Object.prototype.hasOwnProperty.call(body, 'phone')){
      assert.strictEqual(Object.keys(body).length, 1, 'phone patch is only phone');
      assert.strictEqual(body.phone, '(216) 555-0100');
      assert.ok(decodeURIComponent(url).indexOf('id=eq.'+clientId)>0, url);
      assert.ok(url.indexOf('/rest/v1/clients?')>0, url);
      assert.ok(url.indexOf('admin_update_client')<0, url);
      return {status:200, raw:JSON.stringify([{id:clientId, name:'Ada Cole', address:'1 Main', phone:body.phone}])};
    }
    if(init.method==='PATCH'){
      assert.ok(!Object.prototype.hasOwnProperty.call(body, 'phone'), 'name patch stays separate');
      return {status:200, raw:JSON.stringify([{id:clientId, name:body.name, address:body.address}])};
    }
    return {status:500, ok:false, raw:JSON.stringify({message:'unexpected '+url})};
  });
  const updated = await edited.box.sbAdminUpdateClient({
    id:clientId, name:'Ada Cole', address:'1 Main', lat:'', lng:'', phone:'(216) 555-0100'
  });
  assert.strictEqual(updated.success, true, updated.error||'edit');
  assert.strictEqual(updated.data.phone, '(216) 555-0100');
  const phoneCalls = edited.calls.filter(function(c){
    return Object.prototype.hasOwnProperty.call(JSON.parse(c.init.body||'{}'), 'phone');
  });
  assert.strictEqual(phoneCalls.length, 1);
  assert.deepStrictEqual(JSON.parse(phoneCalls[0].init.body), {phone:'(216) 555-0100'});

  const cleared = harness(function(url, init){
    const body = JSON.parse(init.body||'{}');
    if(init.method==='PATCH' && Object.prototype.hasOwnProperty.call(body, 'phone')){
      return {status:200, raw:JSON.stringify([{id:clientId, name:'Ada Cole', address:'1 Main', phone:body.phone}])};
    }
    if(init.method==='PATCH')return {status:200, raw:JSON.stringify([{id:clientId, name:'Ada Cole', address:'1 Main'}])};
    return {status:500, ok:false, raw:JSON.stringify({message:'unexpected'})};
  });
  const blanked = await cleared.box.sbAdminUpdateClient({
    id:clientId, name:'Ada Cole', address:'1 Main', lat:'', lng:'', phone:'   '
  });
  assert.strictEqual(blanked.success, true);
  const clearCall = cleared.calls.filter(function(c){
    return Object.prototype.hasOwnProperty.call(JSON.parse(c.init.body||'{}'), 'phone');
  })[0];
  assert.deepStrictEqual(JSON.parse(clearCall.init.body), {phone:''});

  const untouched = harness(function(url, init){
    if(init.method==='PATCH'){
      const body = JSON.parse(init.body||'{}');
      if(Object.prototype.hasOwnProperty.call(body, 'phone')){
        return {status:500, ok:false, raw:JSON.stringify({message:'phone must stay off this patch'})};
      }
      return {status:200, raw:JSON.stringify([{id:clientId, name:body.name||'Ada Cole', address:body.address||'1 Main'}])};
    }
    return {status:500, ok:false, raw:JSON.stringify({message:'unexpected'})};
  });
  const kept = await untouched.box.sbAdminUpdateClient({
    id:clientId, name:'Ada Cole', address:'9 Oak', lat:'', lng:''
  });
  assert.strictEqual(kept.success, true, kept.error||'no phone key');
  assert.strictEqual(untouched.calls.length, 1, 'name patch only when phone is omitted');

  console.log('admin-client-phone1-test: ok');
  if(process.env.CLIENT_PHONE1_SKIP_BROWSER==='1')return;
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
    console.log('admin-client-phone1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  if(!fs.existsSync(chrome)){
    console.log('admin-client-phone1 browser skipped (no chrome)');
    return;
  }
  const shotDir = process.env.CLIENT_PHONE1_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive:true});
  const root = __dirname;
  const types = {'.html':'text/html; charset=utf-8', '.png':'image/png', '.js':'text/javascript'};
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
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=client-phone1', {waitUntil:'domcontentloaded', timeout:30000});
    const placed = await page.evaluate(async function(){
      loadAidesForAssignment = async function(){
        var box = document.getElementById('assignAidesList');
        if(box)box.innerHTML = '<label><input type="checkbox" class="assign-aide-cb" value="pat"> Pat</label>';
      };
      showAddClientModal();
      document.getElementById('clientFirstName').value = 'Ada';
      document.getElementById('clientLastName').value = 'Cole';
      document.getElementById('clientAddress').value = '';
      document.getElementById('clientPhone').value = '';
      document.getElementById('clientCmName').value = '';
      document.getElementById('clientCmEmail').value = '';
      var ids = ['clientAddress','clientPhone','clientCmName','clientCmEmail','clientInsChips','clientWeeklyHours','clientCoverPrefs','assignAidesList'];
      var tops = ids.map(function(id){
        var el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top : -1;
      });
      var phone = document.getElementById('clientPhone');
      var label = document.querySelector('label[for="clientPhone"]');
      return {
        title: document.getElementById('clientModalTitle').textContent,
        label: label ? label.textContent : '',
        placeholder: phone ? phone.getAttribute('placeholder') : '',
        marker: document.querySelector('[data-client-phone1]').getAttribute('data-client-phone1'),
        cmHead: (document.querySelector('#clientModal .client-cm-head')||{}).textContent || '',
        tops: tops,
        phoneH: phone.getBoundingClientRect().height,
        scrollW: document.documentElement.scrollWidth,
        viewW: window.innerWidth
      };
    });
    assert.strictEqual(placed.title, 'Add Client');
    assert.strictEqual(placed.label, 'Client Phone');
    assert.strictEqual(placed.placeholder, '(216) 555-0100');
    assert.strictEqual(placed.marker, 'v=client-phone1');
    assert.ok(/name \+ email only/i.test(placed.cmHead), placed.cmHead);
    for(var i=1;i<placed.tops.length;i++){
      assert.ok(placed.tops[i] > placed.tops[i-1], 'visual order '+i+' '+placed.tops.join(','));
    }
    assert.ok(placed.phoneH >= 44, 'phone tap target '+placed.phoneH);
    assert.ok(placed.scrollW <= placed.viewW + 1, 'no sideways scroll '+placed.scrollW);
    const shot = path.join(shotDir, 'client-phone1-add-client.png');
    await page.screenshot({path:shot, type:'png'});
    const edited = await page.evaluate(function(){
      allClients = [{
        id:'c-ada',
        name:'Ada Cole',
        firstName:'Ada',
        lastName:'Cole',
        address:'142 Maple St, Cleveland, OH 44114',
        phone:'(216) 555-0100',
        caseManagerName:'Pat Lee',
        caseManagerEmail:'pat@example.com',
        assignedAides:[],
        weekly_authorized_hours:27,
        insurance_plan:'caresource'
      }];
      editClient('c-ada');
      var phone = document.getElementById('clientPhone');
      var addr = document.getElementById('clientAddress');
      var cm = document.getElementById('clientCmName');
      return {
        title: document.getElementById('clientModalTitle').textContent,
        phone: phone.value,
        address: addr.value,
        cm: cm.value,
        email: document.getElementById('clientCmEmail').value,
        beforeCm: phone.getBoundingClientRect().top < cm.getBoundingClientRect().top,
        afterAddress: addr.getBoundingClientRect().bottom <= phone.getBoundingClientRect().top + 1
      };
    });
    assert.strictEqual(edited.title, 'Edit Client');
    assert.strictEqual(edited.phone, '(216) 555-0100');
    assert.strictEqual(edited.address, '142 Maple St, Cleveland, OH 44114');
    assert.strictEqual(edited.cm, 'Pat Lee');
    assert.strictEqual(edited.email, 'pat@example.com');
    assert.strictEqual(edited.beforeCm, true);
    assert.strictEqual(edited.afterAddress, true);
    const editShot = path.join(shotDir, 'client-phone1-edit-client.png');
    await page.screenshot({path:editShot, type:'png'});
    console.log('admin-client-phone1 phone shots', shot, editShot);
  }finally{
    await browser.close();
    server.close();
  }
}
