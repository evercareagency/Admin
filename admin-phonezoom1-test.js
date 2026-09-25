#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=phonezoom1'), 'phonezoom1 marker');
assert.ok(html.includes('admin-build 2026-09-25-phonezoom1'), 'phonezoom1 admin-build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-phonezoom1">'), 'phonezoom1 meta');
assert.ok(html.includes('v=remi1'), 'remi1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remi1">'), 'remi1 admin-build stays');
assert.ok(html.includes('<!-- phone zoom 2026-09-25 v=phonezoom1 admin-build 2026-09-25-phonezoom1'), 'phonezoom1 comment');
['v=eca-copilot1','v=navedit1','v=coveraide1b','v=layoutA1','v=admintheme1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(!/reset_aide_temp_password|auth\.updateUser|rotate password/i.test(html.slice(html.indexOf('v=phonezoom1'), html.indexOf('v=navedit1'))), 'phonezoom1 note does not reseal Auth');

function extractFn(src, sig){
  const start = src.indexOf(sig);
  assert.ok(start > 0, sig);
  let i = src.indexOf('{', start);
  let depth = 0;
  for(; i < src.length; i++){
    if(src[i] === '{')depth++;
    else if(src[i] === '}'){
      depth--;
      if(depth === 0)return src.slice(start, i + 1);
    }
  }
  throw new Error('unclosed ' + sig);
}

const catalog = extractFn(html, 'function navEditCatalog()');
assert.ok(catalog.includes('coverage'), 'Coverage is in the Edit tabs catalog');
assert.ok(html.includes("coverage:{label:'Coverage'"), 'Coverage has a picker label');
const defaults = extractFn(html, 'function navEditDefaults()');
assert.ok(!defaults.includes('coverage'), 'Coverage is not forced onto the default bar');
assert.ok(html.includes('flex-wrap:wrap') && html.includes('.nav-edit-bottom{display:flex;flex-wrap:wrap'), 'edit picker wraps');
assert.ok(html.includes('.nav-edit-bottom{') && html.includes('overflow-x:auto'), 'edit picker can scroll sideways');

const paint = extractFn(html, 'function copilotPaintQuiet(host)');
assert.ok(paint.includes('id="copilotQuietOn"'), 'quiet hours On control stays');
assert.ok(paint.includes('>On<') || paint.includes('>On</span>'), 'On label is painted');
assert.ok(paint.includes('copilot-quiet-on'), 'On control has its own row slot');
assert.ok(html.includes('#copilotSheet input:not([type="checkbox"])'), 'checkbox is not stretched to full width');
assert.ok(html.includes('#copilotSheet .copilot-quiet-on input'), 'On control size is explicit');
assert.ok(!paint.includes('copilotOpenRadar()'), 'quiet hours paint does not open the sheet');

const admin = html.slice(html.indexOf('id="adminScreen"'), html.indexOf('id="nurseScreen"'));
const navStart = admin.indexOf('class="bottom-nav"');
const nav = admin.slice(navStart, admin.indexOf('</nav>', navStart));
assert.ok(!nav.includes('nav_coverage'), 'default bottom bar still omits Coverage');
const more = admin.slice(admin.indexOf('id="moreList"'), admin.indexOf('class="more-account"'));
assert.ok(more.includes('id="nav_coverage"'), 'Coverage still starts under More');

const roles = {nav_coverage:'Admin Scheduler', nav_timesheets:'Admin Scheduler', nav_schedule:'Admin Scheduler', nav_aides:'Admin Scheduler', nav_backups:'Admin Scheduler', nav_clients:'Admin Scheduler', nav_nurse:'Admin Scheduler', nav_inservices:'Admin Scheduler', nav_broadcast:'Admin Scheduler', nav_links:'Admin Scheduler', nav_activity:'Admin Scheduler'};
const ctx = {
  currentAdminRole:'Admin',
  currentAdminUsername:'mo@evercare.test',
  localStorage:{getItem:function(){return null;}, setItem:function(){}, removeItem:function(){}},
  document:{getElementById:function(id){
    if(!roles[id])return null;
    return {getAttribute:function(name){return name==='data-layout-roles'?roles[id]:null;}};
  }},
  readSbSession:function(){return null;},
  readAdminSession:function(){return null;}
};
vm.createContext(ctx);
['function navEditDefaults()','function navEditCatalog()','function navEditRoleOk(tab)','function navEditSanitize(slots)','function navEditPool(slots)','function navEditParse(raw)','function navEditStorageKeyFor(id, email)','function navEditIdentity()','function navEditStorageKey()','function navEditRead()','function navEditSwapIds(slots, a, b)'].forEach(function(sig){
  vm.runInContext(extractFn(html, sig), ctx);
});
function plain(expr){
  return JSON.parse(JSON.stringify(vm.runInContext(expr, ctx)));
}
assert.ok(plain('navEditPool(navEditRead())').indexOf('coverage') >= 0, 'Coverage is in the picker pool');
assert.deepStrictEqual(plain("navEditSwapIds(['timesheets','schedule','aides','backups'],'backups','coverage')"), ['timesheets','schedule','aides','coverage'], 'Coverage can replace Backup on the bar');
assert.deepStrictEqual(plain('navEditRead()'), ['timesheets','schedule','aides','backups'], 'empty storage stays the layoutA1 set');

function loadPuppeteer(){
  try{return require('puppeteer-core');}
  catch(e){
    try{return require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){return null;}
  }
}

function inside(inner, outer, pad){
  pad = pad || 1;
  return inner.left >= outer.left - pad && inner.right <= outer.right + pad && inner.top >= outer.top - pad && inner.bottom <= outer.bottom + pad && inner.width > 8 && inner.height > 8;
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-phonezoom1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.PHONEZOOM_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive:true});
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const file = path.normalize(path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath));
    if(!file.startsWith(__dirname)){res.writeHead(403);res.end();return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404);res.end('missing');return;}
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store'});
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
    await page.goto('http://127.0.0.1:'+port+'/index.html', {waitUntil:'domcontentloaded', timeout:20000});
    const boot = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      return {hidden: !!(sheet && sheet.hidden), htmlHidden: sheet ? sheet.hasAttribute('hidden') : false};
    });
    assert.strictEqual(boot.hidden, true, 'Co-pilot sheet stays closed until Mo opens it');
    await page.evaluate(function(){
      localStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
      showTab('more');
    });
    const closed = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      return !sheet || sheet.hidden === true;
    });
    assert.strictEqual(closed, true, 'Admin home does not leave the Co-pilot sheet open');
    await page.click('#navEditOpen');
    await page.waitForSelector('#navEditPool [data-nav-id="coverage"]', {visible:true});
    const edit = await page.evaluate(function(){
      function box(el){
        var r = el.getBoundingClientRect();
        return {left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height};
      }
      var choice = document.querySelector('#navEditPool [data-nav-id="coverage"]');
      var panel = document.getElementById('navEditPanel');
      var ids = Array.prototype.map.call(document.querySelectorAll('#navEditPool [data-nav-id], #navEditBottom [data-nav-id]'), function(el){
        return el.getAttribute('data-nav-id');
      });
      return {choice:box(choice), panel:box(panel), text:choice.textContent, ids:ids, viewW:window.innerWidth};
    });
    assert.ok(edit.viewW <= 400, 'phone width');
    assert.ok(/Coverage/.test(edit.text), edit.text);
    assert.ok(edit.ids.indexOf('coverage') >= 0, 'Coverage is in the open picker');
    assert.ok(inside(edit.choice, {left:0, top:0, right:edit.viewW, bottom:844}), 'Coverage is fully on screen');
    assert.ok(inside(edit.choice, edit.panel), 'Coverage is inside the edit panel');
    await page.screenshot({path: path.join(shotDir, 'phonezoom1-edit-tabs-coverage.png')});

    await page.click('#navEditBottom [data-nav-id="backups"]');
    await page.click('#navEditPool [data-nav-id="coverage"]');
    const pinned = await page.evaluate(function(){
      function box(el){
        var r = el.getBoundingClientRect();
        return {left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height};
      }
      var slot = document.querySelector('#navEditBottom [data-nav-id="coverage"]');
      var panel = document.getElementById('navEditPanel');
      return {slot:slot?box(slot):null, panel:box(panel), viewW:window.innerWidth};
    });
    assert.ok(pinned.slot, 'Coverage can be pinned into a bottom slot');
    assert.ok(inside(pinned.slot, {left:0, top:0, right:pinned.viewW, bottom:844}), 'pinned Coverage stays on screen');
    assert.ok(inside(pinned.slot, pinned.panel), 'pinned Coverage stays inside the picker');
    await page.screenshot({path: path.join(shotDir, 'phonezoom1-edit-tabs-coverage-pinned.png')});

    await page.evaluate(function(){navEditCancel(); copilotOpenRadar();});
    await page.waitForSelector('#copilotQuietOn', {visible:true});
    const quiet = await page.evaluate(function(){
      function box(el){
        var r = el.getBoundingClientRect();
        return {left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height};
      }
      var card = document.getElementById('copilotQuiet');
      var on = document.getElementById('copilotQuietOn');
      var label = document.querySelector('.copilot-quiet-on');
      var title = document.getElementById('copilotQuietLabel');
      return {card:box(card), on:box(on), label:box(label), title:box(title), viewW:window.innerWidth, text:label.textContent};
    });
    assert.ok(/On/.test(quiet.text), quiet.text);
    assert.ok(quiet.on.width >= 18 && quiet.on.height >= 18, 'On control has a real hit size');
    assert.ok(inside(quiet.on, quiet.card), 'On control is inside the Quiet hours card');
    assert.ok(inside(quiet.label, quiet.card), 'On label is inside the Quiet hours card');
    assert.ok(inside(quiet.title, quiet.card), 'Quiet hours label is inside the card');
    assert.ok(quiet.card.right <= quiet.viewW + 1, 'card stays in the phone width');
    await page.screenshot({path: path.join(shotDir, 'phonezoom1-quiet-hours-on.png')});
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-phonezoom1-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
