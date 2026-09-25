#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=navedit1'), 'navedit1 marker');
assert.ok(html.includes('admin-build 2026-09-25-navedit1'), 'navedit1 admin-build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-navedit1">'), 'navedit1 meta');
assert.ok(html.indexOf('content="2026-09-25-navedit1"') < html.indexOf('content="2026-09-25-layoutA1"'), 'navedit1 is the current build meta');
assert.ok(html.includes('v=layoutA1'), 'layoutA1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-layoutA1">'), 'layoutA1 meta stays');
assert.ok(html.includes('v=admintheme1'), 'admintheme1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-admintheme1">'), 'admintheme1 meta stays');
assert.ok(html.includes('--teal:#2a7f7f') && html.includes('--navy:#1a2744'), 'teal/navy tokens stay');

const admin = html.slice(html.indexOf('id="adminScreen"'), html.indexOf('id="nurseScreen"'));
const navStart = admin.indexOf('class="bottom-nav"');
const nav = admin.slice(navStart, admin.indexOf('</nav>', navStart));
assert.strictEqual((nav.match(/bottom-tab/g) || []).length, 5, 'default HTML still has five bottom tabs');
assert.ok(nav.indexOf('id="nav_more"') > nav.indexOf('id="nav_backups"'), 'More stays last in the default bar');
assert.ok(admin.includes('id="navEditOpen"') && admin.includes('>Edit tabs<'), 'More screen has Edit tabs');
const sheet = admin.slice(admin.indexOf('id="navEditPanel"'), admin.indexOf('id="moreList"'));
assert.ok(sheet.includes('id="navEditCancel"') && sheet.includes('>Cancel<'), 'Cancel control');
assert.ok(sheet.includes('id="navEditDone"') && sheet.includes('>Save<'), 'Save control');
assert.ok(!sheet.includes('id="nav_settings"') && !sheet.includes('Sign Out'), 'account actions are not in the editor markup');
assert.ok(admin.includes('id="nav_settings"') && admin.includes('id="moreSignOut"'), 'Settings and Sign Out stay under More');
assert.ok(admin.indexOf('class="more-account"') < admin.indexOf('id="nav_settings"'), 'Settings stays inside Account');

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

const cancelFn = extractFn(html, 'function navEditCancel()');
const saveFn = extractFn(html, 'function navEditSave()');
assert.ok(!cancelFn.includes('setItem') && !cancelFn.includes('navEditApply'), 'Cancel does not write or apply');
assert.ok(saveFn.includes('setItem') && saveFn.includes('navEditApply'), 'Save writes and applies');
assert.ok(extractFn(html, 'function navEditApply()').includes("getElementById('nav_more')"), 'apply keeps More');
assert.ok(extractFn(html, 'function navEditApply()').includes('appendChild(more)'), 'More is pinned at the end');
assert.ok(!extractFn(html, 'function navEditCatalog()').includes('settings'), 'Settings is not a tab candidate');

const roles = {
  nav_timesheets: 'Admin Scheduler',
  nav_schedule: 'Admin Scheduler',
  nav_aides: 'Admin Scheduler',
  nav_backups: 'Admin Scheduler',
  nav_clients: 'Admin Scheduler',
  nav_nurse: 'Admin Scheduler',
  nav_inservices: 'Admin Scheduler',
  nav_broadcast: 'Admin Scheduler',
  nav_links: 'Admin Scheduler',
  nav_activity: 'Admin Scheduler'
};
const mem = {};
const ctx = {
  currentAdminRole: 'Scheduler',
  currentAdminUsername: 'sched@evercare.test',
  localStorage: {
    getItem: function(k){return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;},
    setItem: function(k, v){mem[k] = String(v);},
    removeItem: function(k){delete mem[k];}
  },
  document: {
    getElementById: function(id){
      if(!roles[id])return null;
      return {getAttribute: function(name){return name === 'data-layout-roles' ? roles[id] : null;}};
    }
  },
  readSbSession: function(){return null;},
  readAdminSession: function(){return null;}
};
vm.createContext(ctx);
[
  'function navEditDefaults()',
  'function navEditCatalog()',
  'function navEditRoleOk(tab)',
  'function navEditSanitize(slots)',
  'function navEditPool(slots)',
  'function navEditParse(raw)',
  'function navEditStorageKeyFor(id, email)',
  'function navEditIdentity()',
  'function navEditStorageKey()',
  'function navEditRead()',
  'function navEditCurrent()',
  'function navEditSwapIds(slots, a, b)',
  'function navEditIsBottom(tab)'
].forEach(function(sig){vm.runInContext(extractFn(html, sig), ctx);});

function run(code){
  return JSON.parse(JSON.stringify(vm.runInContext(code, ctx)));
}

assert.deepStrictEqual(run('navEditRead()'), ['timesheets','schedule','aides','backups'], 'empty storage is the layoutA1 set');
assert.strictEqual(run('navEditPool(navEditRead()).indexOf("settings")'), -1, 'settings never enters the pool');
assert.ok(run('navEditPool(navEditRead()).indexOf("nurse")') >= 0, 'Scheduler can pick Nurse');
assert.strictEqual(run("navEditIsBottom('clients')"), 'more', 'Clients highlights More until it is on the bar');
assert.strictEqual(run("navEditIsBottom('settings')"), null);
assert.deepStrictEqual(
  run("navEditSwapIds(['timesheets','schedule','aides','backups'],'backups','clients')"),
  ['timesheets','schedule','aides','clients'],
  'Clients replaces Backup'
);
assert.ok(run("navEditPool(['timesheets','schedule','aides','clients']).indexOf('backups')") >= 0, 'Backup moves into More');
assert.deepStrictEqual(
  run("navEditSwapIds(['timesheets','schedule','aides','clients'],'clients','backups')"),
  ['timesheets','schedule','aides','backups'],
  'swapping back restores Backup'
);
assert.deepStrictEqual(
  run("navEditSanitize(['nope','settings','more','clients','clients'])"),
  ['clients','timesheets','schedule','aides'],
  'junk, settings, and More cannot occupy a slot'
);
assert.strictEqual(run("navEditStorageKeyFor('user-1','Mo@Evercare.test')"), 'evercare_nav_tabs:user-1|mo@evercare.test');
assert.strictEqual(run("navEditStorageKeyFor('','Mo@Evercare.test')"), 'evercare_nav_tabs:mo@evercare.test');
ctx.readSbSession = function(){return {user:{id:'abc'}, profile:{email:'Mo@Evercare.test'}};};
assert.strictEqual(run('navEditStorageKey()'), 'evercare_nav_tabs:abc|mo@evercare.test', 'key uses admin id and email');
ctx.readSbSession = function(){return null;};
assert.strictEqual(run('navEditStorageKey()'), 'evercare_nav_tabs:sched@evercare.test', 'falls back to the signed-in username');
ctx.currentAdminUsername = 'other@evercare.test';
assert.notStrictEqual(run('navEditStorageKey()'), 'evercare_nav_tabs:sched@evercare.test');
ctx.currentAdminUsername = 'sched@evercare.test';
vm.runInContext("localStorage.setItem(navEditStorageKey(), JSON.stringify({v:1,slots:['timesheets','schedule','aides','clients']}))", ctx);
assert.deepStrictEqual(run('navEditRead()'), ['timesheets','schedule','aides','clients']);
assert.strictEqual(run("navEditIsBottom('clients')"), 'clients');
assert.strictEqual(run("navEditIsBottom('backups')"), 'more');
roles.nav_nurse = 'Admin';
assert.strictEqual(run("navEditRoleOk('nurse')"), false, 'Scheduler cannot open an Admin-only Nurse item');
assert.strictEqual(run('navEditPool(navEditRead()).indexOf("nurse")'), -1, 'Nurse is hidden from the picker');
assert.deepStrictEqual(
  run("navEditSanitize(['timesheets','schedule','aides','nurse'])"),
  ['timesheets','schedule','aides','backups'],
  'a blocked Nurse slot falls back to an allowed tab'
);
assert.deepStrictEqual(
  run("navEditSwapIds(['timesheets','schedule','aides','backups'],'backups','nurse')"),
  ['timesheets','schedule','aides','backups'],
  'a blocked Nurse item cannot be swapped onto the bar'
);

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
    console.log('admin-navedit1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.NAVEDIT_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive:true});
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const file = path.normalize(path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath));
    if(!file.startsWith(__dirname)){res.writeHead(403);res.end();return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404);res.end('missing');return;}
      const ext = path.extname(file);
      const type = ext === '.js' ? 'text/javascript' : 'text/html; charset=utf-8';
      res.writeHead(200, {'Content-Type': type, 'Cache-Control': 'no-store'});
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
    await page.evaluate(function(){
      localStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      var side = document.getElementById('sidebarRoleName');
      if(side)side.textContent = 'Admin';
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
      showTab('more');
    });
    await page.waitForSelector('#navEditOpen', {visible:true});
    const before = await page.evaluate(function(){
      return {
        tabs: Array.prototype.map.call(document.querySelectorAll('#adminScreen .bottom-nav .bottom-tab'), function(el){return el.id;}),
        edit: document.getElementById('navEditOpen').textContent,
        nurse: !!document.getElementById('nav_nurse')
      };
    });
    assert.deepStrictEqual(before.tabs, ['nav_timesheets','nav_schedule','nav_aides','nav_backups','nav_more']);
    assert.strictEqual(before.edit.trim(), 'Edit tabs');
    await page.screenshot({path: path.join(shotDir, 'navedit1-more-edit-tabs.png')});

    await page.click('#navEditOpen');
    await page.waitForSelector('#navEditDone', {visible:true});
    const picker = await page.evaluate(function(){
      var pool = Array.prototype.map.call(document.querySelectorAll('#navEditPool [data-nav-id]'), function(el){return el.getAttribute('data-nav-id');});
      var bottom = Array.prototype.map.call(document.querySelectorAll('#navEditBottom [data-nav-id]'), function(el){return el.getAttribute('data-nav-id');});
      var lock = document.querySelector('#navEditBottom .is-lock');
      return {
        pool: pool,
        bottom: bottom,
        pinned: lock ? lock.textContent : '',
        settings: pool.indexOf('settings'),
        save: document.getElementById('navEditDone').textContent.trim(),
        cancel: document.getElementById('navEditCancel').textContent.trim()
      };
    });
    assert.deepStrictEqual(picker.bottom, ['timesheets','schedule','aides','backups']);
    assert.ok(picker.pool.indexOf('clients') >= 0 && picker.pool.indexOf('nurse') >= 0, 'Admin picker includes Clients and Nurse');
    assert.strictEqual(picker.settings, -1);
    assert.ok(/Pinned/.test(picker.pinned), 'More is pinned');
    assert.strictEqual(picker.save, 'Save');
    assert.strictEqual(picker.cancel, 'Cancel');

    await page.click('#navEditBottom [data-nav-id="backups"]');
    await page.click('#navEditPool [data-nav-id="clients"]');
    const swapped = await page.evaluate(function(){
      return {
        hint: document.getElementById('navEditHint').textContent,
        bottom: Array.prototype.map.call(document.querySelectorAll('#navEditBottom [data-nav-id]'), function(el){return el.getAttribute('data-nav-id');}),
        pool: Array.prototype.map.call(document.querySelectorAll('#navEditPool [data-nav-id]'), function(el){return el.getAttribute('data-nav-id');}),
        live: Array.prototype.map.call(document.querySelectorAll('#adminScreen .bottom-nav .bottom-tab'), function(el){return el.id;})
      };
    });
    assert.ok(/Backup/.test(swapped.hint) && /Clients/.test(swapped.hint) && /swapped/.test(swapped.hint), swapped.hint);
    assert.deepStrictEqual(swapped.bottom, ['timesheets','schedule','aides','clients']);
    assert.ok(swapped.pool.indexOf('backups') >= 0 && swapped.pool.indexOf('clients') < 0);
    assert.deepStrictEqual(swapped.live, ['nav_timesheets','nav_schedule','nav_aides','nav_backups','nav_more'], 'live bar waits for Save');
    await page.screenshot({path: path.join(shotDir, 'navedit1-edit-swap-clients-backup.png')});

    await page.click('#navEditCancel');
    const cancelled = await page.evaluate(function(){
      return {
        open: !document.getElementById('navEditPanel') || document.getElementById('navEditPanel').hidden,
        live: Array.prototype.map.call(document.querySelectorAll('#adminScreen .bottom-nav .bottom-tab'), function(el){return el.id;}),
        stored: localStorage.getItem('evercare_nav_tabs:mo@evercare.test')
      };
    });
    assert.strictEqual(cancelled.open, true);
    assert.deepStrictEqual(cancelled.live, ['nav_timesheets','nav_schedule','nav_aides','nav_backups','nav_more']);
    assert.strictEqual(cancelled.stored, null, 'Cancel does not persist');

    await page.click('#navEditOpen');
    await page.click('#navEditBottom [data-nav-id="backups"]');
    await page.click('#navEditPool [data-nav-id="clients"]');
    await page.screenshot({path: path.join(shotDir, 'navedit1-edit-swap-clients-backup.png')});
    await page.click('#navEditDone');
    await page.waitForSelector('#navEditOpen', {visible:true});
    const saved = await page.evaluate(function(){
      var key = navEditStorageKey();
      return {
        key: key,
        raw: localStorage.getItem(key),
        live: Array.prototype.map.call(document.querySelectorAll('#adminScreen .bottom-nav .bottom-tab'), function(el){return el.id;}),
        primary: layoutA1Primary('clients'),
        backupPrimary: layoutA1Primary('backups'),
        settingsPrimary: layoutA1Primary('settings'),
        moreFirst: (function(){
          var rows = document.querySelectorAll('#moreList .more-row');
          for(var i=0;i<rows.length;i++){
            if(rows[i].id === 'nav_completes')continue;
            if(rows[i].hidden)continue;
            return rows[i].id;
          }
          return '';
        })(),
        settingsInAccount: !!document.querySelector('.more-account #nav_settings'),
        count: document.querySelectorAll('#adminScreen .bottom-nav .bottom-tab').length
      };
    });
    assert.strictEqual(saved.key, 'evercare_nav_tabs:mo@evercare.test');
    assert.ok(saved.raw && saved.raw.indexOf('clients') >= 0 && saved.raw.indexOf('backups') < 0);
    assert.deepStrictEqual(saved.live, ['nav_timesheets','nav_schedule','nav_aides','nav_clients','nav_more']);
    assert.strictEqual(saved.count, 5);
    assert.strictEqual(saved.primary, 'clients');
    assert.strictEqual(saved.backupPrimary, 'more');
    assert.strictEqual(saved.settingsPrimary, 'more');
    assert.strictEqual(saved.moreFirst, 'nav_backups');
    assert.strictEqual(saved.settingsInAccount, true);
    await page.screenshot({path: path.join(shotDir, 'navedit1-bottom-clients.png')});

    await page.evaluate(function(){
      var nurse = document.getElementById('nav_nurse');
      nurse.setAttribute('data-layout-roles', 'Admin');
      currentAdminRole = 'Scheduler';
      layoutA1ApplyRoles();
    });
    await page.click('#navEditOpen');
    const hiddenNurse = await page.evaluate(function(){
      var pool = Array.prototype.map.call(document.querySelectorAll('#navEditPool [data-nav-id]'), function(el){return el.getAttribute('data-nav-id');});
      var bottom = Array.prototype.map.call(document.querySelectorAll('#navEditBottom [data-nav-id]'), function(el){return el.getAttribute('data-nav-id');});
      return {pool: pool, bottom: bottom};
    });
    assert.strictEqual(hiddenNurse.pool.indexOf('nurse'), -1, 'Scheduler does not see Admin-only Nurse in the picker');
    assert.strictEqual(hiddenNurse.bottom.indexOf('nurse'), -1);
    await page.evaluate(function(){
      currentAdminRole = 'Admin';
      document.getElementById('nav_nurse').setAttribute('data-layout-roles', 'Admin Scheduler');
      layoutA1ApplyRoles();
    });
    await page.click('#navEditCancel');
    await page.click('#navEditOpen');
    const dragged = await page.evaluate(function(){
      var from = document.querySelector('#navEditPool [data-nav-id="backups"]');
      var to = document.querySelector('#navEditBottom [data-nav-id="aides"]');
      if(!from || !to)return 'missing';
      var fr = from.getBoundingClientRect();
      var tr = to.getBoundingClientRect();
      function fire(type, el, x, y){
        el.dispatchEvent(new PointerEvent(type, {bubbles:true, cancelable:true, clientX:x, clientY:y, pointerId:1, pointerType:'touch'}));
      }
      fire('pointerdown', from, fr.left + fr.width / 2, fr.top + fr.height / 2);
      fire('pointermove', document.getElementById('navEditPanel'), tr.left + tr.width / 2, tr.top + tr.height / 2);
      fire('pointerup', document.getElementById('navEditPanel'), tr.left + tr.width / 2, tr.top + tr.height / 2);
      var sheet = document.getElementById('navEditPanel');
      return {
        bottom: Array.prototype.map.call(document.querySelectorAll('#navEditBottom [data-nav-id]'), function(el){return el.getAttribute('data-nav-id');}).join(','),
        wide: sheet.scrollWidth <= sheet.clientWidth + 1
      };
    });
    assert.ok(dragged.bottom.indexOf('backups') >= 0 && dragged.bottom.indexOf('aides') < 0, 'drag swaps onto a bottom slot: ' + dragged.bottom);
    assert.strictEqual(dragged.wide, true, 'edit sheet does not overflow the phone width');
    await page.click('#navEditCancel');
    const afterDragCancel = await page.evaluate(function(){
      return Array.prototype.map.call(document.querySelectorAll('#adminScreen .bottom-nav .bottom-tab'), function(el){return el.id;}).join(',');
    });
    assert.strictEqual(afterDragCancel, 'nav_timesheets,nav_schedule,nav_aides,nav_clients,nav_more', 'Cancel after a drag restores the saved bar');

    await page.evaluate(function(){
      localStorage.setItem('admin_session', JSON.stringify({
        role: 'Admin',
        username: 'mo@evercare.test',
        name: '',
        loginAt: Date.now()
      }));
    });
    await page.reload({waitUntil:'domcontentloaded', timeout:20000});
    await page.waitForFunction(function(){
      var tabs = document.querySelectorAll('#adminScreen .bottom-nav .bottom-tab');
      return tabs.length === 5 && tabs[3] && tabs[3].id === 'nav_clients' && document.getElementById('adminScreen').classList.contains('active');
    }, {timeout:8000});

    await page.setViewport({width:1280, height:800, isMobile:false, hasTouch:false});
    await page.evaluate(function(){showTab('more');});
    const desk = await page.evaluate(function(){
      var tabs = Array.prototype.map.call(document.querySelectorAll('#adminScreen .bottom-nav .bottom-tab'), function(el){return el.id;});
      var cs = getComputedStyle(document.querySelector('#adminScreen .bottom-tab'));
      return {tabs: tabs, dir: cs.flexDirection, edit: !!document.getElementById('navEditOpen')};
    });
    assert.deepStrictEqual(desk.tabs, ['nav_timesheets','nav_schedule','nav_aides','nav_clients','nav_more']);
    assert.strictEqual(desk.dir, 'row', 'desktop bottom tabs stay in a row');
    assert.strictEqual(desk.edit, true);
    await page.screenshot({path: path.join(shotDir, 'navedit1-desktop-more.png')});
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-navedit1-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
