#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=tabbar-8'), 'tabbar-8 marker');
assert.ok(html.includes('admin-build 2026-09-27-tabbar-8'), 'tabbar-8 admin-build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-tabbar-8">'), 'tabbar-8 meta');
assert.ok(html.includes('GHOST-TABBAR-8-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('MERGE HOLD'), 'merge hold');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('var MAX_BAR_TABS=8'), 'cap constant is 8');
assert.ok(html.includes('Up to <strong>8</strong> on the bar'), 'cap copy Up to 8 on the bar');
assert.ok(html.includes('Up to 8 tabs on the bottom bar'), 'helper copy');
assert.ok(html.includes('Bar full ('), 'bar full copy');
assert.ok(html.includes('>Edit tabs<'), 'Edit tabs entry stays');
assert.ok(html.includes('Move to More') && html.includes('Add to bar'), 'move and add actions');
assert.ok(html.includes("return 'evercare_nav_tabs:'+part"), 'prefs key unchanged');
assert.ok(html.includes('No SQL') && html.includes('No new RPC'), 'no SQL and no new RPC in the tip');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-login-toast1'), 'first admin-build is login-toast1');
assert.ok(html.indexOf('content="2026-09-27-login-toast1"') < html.indexOf('content="2026-09-27-aide-office-vis1"'), 'aide-office-vis1 stays after login-toast1');
assert.ok(html.indexOf('content="2026-09-27-aide-office-vis1"') < html.indexOf('content="2026-09-27-hold-clear1"'), 'hold-clear1 stays after aide-office-vis1');
assert.ok(html.indexOf('content="2026-09-27-hold-clear1"') < html.indexOf('content="2026-09-27-sched-time-tap1"'), 'sched-time-tap1 stays after hold-clear1');
assert.ok(html.indexOf('content="2026-09-27-sched-time-tap1"') < html.indexOf('content="2026-09-27-aide-text-chat1"'), 'aide-text-chat1 stays after sched-time-tap1');
assert.ok(html.indexOf('content="2026-09-27-aide-text-chat1"') < html.indexOf('content="2026-09-27-remi-float-hide1"'), 'remi-float-hide1 stays after aide-text-chat1');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1"') < html.indexOf('content="2026-09-27-tabbar-8"'), 'tabbar-8 stays after remi-float-hide1');
assert.ok(html.indexOf('content="2026-09-27-tabbar-8"') < html.indexOf('content="2026-09-27-cover-card-cancel1"'), 'cover-card-cancel1 stays after tabbar-8');
assert.ok(html.indexOf('content="2026-09-27-cover-card-cancel1"') < html.indexOf('content="2026-09-27-nosvc-reason-draft1"'), 'nosvc-reason-draft1 stays after cover-card-cancel1');
assert.ok(html.indexOf('content="2026-09-27-nosvc-reason-draft1"') < html.indexOf('content="2026-09-27-cover-unselect1"'), 'cover-unselect1 stays after nosvc-reason-draft1');
assert.ok(html.indexOf('content="2026-09-27-cover-unselect1"') < html.indexOf('content="2026-09-27-remi-payroll1"'), 'payroll stays after cover-unselect1');
['v=cover-card-cancel1','v=nosvc-reason-draft1','v=cover-unselect1','v=remi-payroll1','v=client-ins1','v=navedit1','v=layoutA1','v=admintheme1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-payroll1">'), 'payroll meta stays');
assert.ok(!html.includes('CREATE TABLE') && !html.includes('MAX_BAR_TABS = 5'), 'no invented SQL and no leftover cap 5');

const admin = html.slice(html.indexOf('id="adminScreen"'), html.indexOf('id="nurseScreen"'));
const navStart = admin.indexOf('class="bottom-nav"');
const nav = admin.slice(navStart, admin.indexOf('</nav>', navStart));
assert.ok(nav.includes('id="nav_more"'), 'More stays on the bar');
assert.ok(admin.includes('id="navEditOpen"'), 'Edit tabs stays on More');

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

const roles = {
  nav_timesheets: 'Admin Scheduler',
  nav_schedule: 'Admin Scheduler',
  nav_aides: 'Admin Scheduler',
  nav_backups: 'Admin Scheduler',
  nav_coverage: 'Admin Scheduler',
  nav_clients: 'Admin Scheduler',
  nav_nurse: 'Admin Scheduler',
  nav_inservices: 'Admin Scheduler',
  nav_broadcast: 'Admin Scheduler',
  nav_links: 'Admin Scheduler',
  nav_activity: 'Admin Scheduler',
  nav_aidechat: 'Admin Scheduler',
  nav_notifications: 'Admin Scheduler'
};
const mem = {};
const ctx = {
  MAX_BAR_TABS: 0,
  currentAdminRole: 'Admin',
  currentAdminUsername: 'mo@evercare.test',
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
  'var MAX_BAR_TABS=8',
  'function navEditDefaults()',
  'function navEditCatalog()',
  'function navEditRoleOk(tab)',
  'function navEditSanitize(slots)',
  'function navEditPool(slots)',
  'function navEditParse(raw)',
  'function navEditStorageKeyFor(id, email)',
  'function navEditIdentity()',
  'function navEditStorageKey()',
  'function navEditRead()'
].forEach(function(sig){
  if(sig.indexOf('var ') === 0){
    vm.runInContext(sig + ';', ctx);
    return;
  }
  vm.runInContext(extractFn(html, sig), ctx);
});

function run(code){
  return JSON.parse(JSON.stringify(vm.runInContext(code, ctx)));
}

assert.strictEqual(run('MAX_BAR_TABS'), 8);
assert.deepStrictEqual(run('navEditRead()'), ['timesheets','schedule','aides','backups'], 'empty storage stays the layoutA1 set');
const eight = ['timesheets','schedule','aides','clients','coverage','aidechat','inservices','backups'];
assert.deepStrictEqual(run('navEditSanitize(' + JSON.stringify(eight) + ')'), eight, 'eight pins stay on the bar');
const nine = eight.concat(['broadcast']);
const capped = run('navEditSanitize(' + JSON.stringify(nine) + ')');
assert.strictEqual(capped.length, 8, 'a ninth pin is blocked');
assert.ok(capped.indexOf('broadcast') < 0, 'the ninth tab stays off the bar');
const seven = eight.slice(0, 7);
assert.deepStrictEqual(run('navEditSanitize(' + JSON.stringify(seven) + ')'), seven, 'moving one off does not backfill to 8');
assert.deepStrictEqual(
  run("navEditSanitize(['nope','settings','more','clients','clients'])"),
  ['clients','timesheets','schedule','aides'],
  'short lists still fill to the layoutA1 set'
);
assert.strictEqual(run('navEditPool(' + JSON.stringify(eight) + ').indexOf("settings")'), -1, 'settings stays out of the picker');
assert.ok(run('navEditPool(' + JSON.stringify(eight) + ').indexOf("broadcast")') >= 0, 'overflow stays in More');
assert.strictEqual(run("navEditStorageKeyFor('user-1','Mo@Evercare.test')"), 'evercare_nav_tabs:user-1|mo@evercare.test');

function loadPuppeteer(){
  try{return require('puppeteer-core');}
  catch(e){
    try{return require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){return null;}
  }
}

async function shot(page, file){
  const shotDir = process.env.TABBAR8_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive:true});
  await page.screenshot({path: path.join(shotDir, file), fullPage: false});
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-tabbar-8 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
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
  const eightIds = ['timesheets','schedule','aides','clients','coverage','aidechat','inservices','backups'];
  try{
    const page = await browser.newPage();
    await page.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:2});
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=tabbar-8', {waitUntil:'domcontentloaded', timeout:20000});
    await page.evaluate(function(ids){
      localStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      localStorage.setItem(navEditStorageKey(), JSON.stringify({v:1, slots:ids}));
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
      showTab('more');
    }, eightIds);
    const bar = await page.evaluate(function(){
      var tabs = Array.prototype.map.call(document.querySelectorAll('#adminScreen .bottom-nav .bottom-tab'), function(el){
        return {id:el.id, text:el.textContent.replace(/\s+/g,' ').trim()};
      });
      var moreRows = Array.prototype.map.call(document.querySelectorAll('#moreList .more-row'), function(el){
        return el.id;
      }).filter(function(id){return id && id !== 'nav_completes' && id !== 'nav_settings';});
      var edit = document.getElementById('navEditOpen');
      return {
        tabs: tabs,
        tight: document.querySelector('#adminScreen .bottom-nav').classList.contains('is-tight'),
        more: moreRows,
        edit: edit ? edit.textContent.trim() : '',
        editVisible: !!(edit && edit.offsetParent)
      };
    });
    assert.strictEqual(bar.tabs.length, 9, '8 primary tabs plus More');
    assert.strictEqual(bar.tabs[8].id, 'nav_more', 'More stays last');
    assert.deepStrictEqual(bar.tabs.slice(0, 8).map(function(t){return t.id;}), eightIds.map(function(id){return 'nav_'+id;}));
    assert.strictEqual(bar.tight, true, 'nine slots use the tight label layout');
    assert.ok(bar.more.indexOf('nav_broadcast') >= 0, 'overflow stays in More');
    assert.strictEqual(bar.edit, 'Edit tabs');
    assert.strictEqual(bar.editVisible, true);
    const boxes = await page.evaluate(function(){
      var nav = document.querySelector('#adminScreen .bottom-nav').getBoundingClientRect();
      var tabs = Array.prototype.map.call(document.querySelectorAll('#adminScreen .bottom-nav .bottom-tab'), function(el){
        var r = el.getBoundingClientRect();
        return {id:el.id, left:r.left, right:r.right, top:r.top, width:r.width};
      });
      return {navWidth: nav.width, view: window.innerWidth, tabs: tabs};
    });
    assert.ok(boxes.tabs[0].left >= -1, 'first tab starts on screen');
    assert.ok(boxes.tabs[8].right <= boxes.view + 1, 'More stays on screen');
    var prev = -1;
    boxes.tabs.forEach(function(t){
      assert.ok(t.left >= prev - 1, 'tabs do not overlap ' + t.id);
      assert.ok(t.width > 24, 'tab has a tap width ' + t.id);
      prev = t.right;
    });
    await shot(page, 'tabbar-8-phone-bar.png');

    await page.click('#navEditOpen');
    await page.waitForSelector('#navEditCapChip', {visible:true});
    const edit = await page.evaluate(function(){
      var bottom = Array.prototype.map.call(document.querySelectorAll('#navEditBottom [data-nav-id]'), function(el){
        return el.getAttribute('data-nav-id');
      });
      var adds = Array.prototype.map.call(document.querySelectorAll('#navEditPool [data-nav-act="add"]'), function(el){
        return {disabled: el.disabled, text: el.textContent.trim()};
      });
      var offs = document.querySelectorAll('#navEditBottom [data-nav-act="off"]');
      return {
        cap: document.getElementById('navEditCap').textContent.replace(/\s+/g,' ').trim(),
        chip: document.getElementById('navEditCapChip').textContent.trim(),
        count: document.getElementById('navEditBottomCount').textContent.trim(),
        bottom: bottom,
        adds: adds,
        offEnabled: Array.prototype.filter.call(offs, function(el){return !el.disabled;}).length,
        more: document.querySelector('#navEditBottom .is-lock').textContent
      };
    });
    assert.strictEqual(edit.bottom.length, 8);
    assert.strictEqual(edit.chip, 'Bar full (8/8)');
    assert.strictEqual(edit.count, '8/8');
    assert.ok(edit.cap.indexOf('Up to 8 on the bar') >= 0, edit.cap);
    assert.ok(edit.cap.indexOf('rest stay in More') >= 0, edit.cap);
    assert.ok(edit.adds.length > 0 && edit.adds.every(function(a){return a.disabled && a.text === 'Add to bar';}), 'Add to bar is disabled at 8/8');
    assert.strictEqual(edit.offEnabled, 8, 'Move to More stays available at 8/8');
    assert.ok(/Pinned/.test(edit.more), 'More stays pinned in the editor');
    await shot(page, 'tabbar-8-phone-edit.png');

    await page.click('#navEditBottom [data-nav-id="backups"] [data-nav-act="off"]');
    const moved = await page.evaluate(function(){
      return {
        chip: document.getElementById('navEditCapChip').textContent.trim(),
        bottom: Array.prototype.map.call(document.querySelectorAll('#navEditBottom [data-nav-id]'), function(el){return el.getAttribute('data-nav-id');}),
        poolHas: !!document.querySelector('#navEditPool [data-nav-id="backups"]'),
        addOn: !document.querySelector('#navEditPool [data-nav-id="broadcast"] [data-nav-act="add"]').disabled
      };
    });
    assert.strictEqual(moved.chip, '7/8');
    assert.ok(moved.bottom.indexOf('backups') < 0, 'Backup left the bar');
    assert.strictEqual(moved.poolHas, true);
    assert.strictEqual(moved.addOn, true, 'Add to bar enables after one moves off');
    await page.click('#navEditPool [data-nav-id="broadcast"] [data-nav-act="add"]');
    const added = await page.evaluate(function(){
      return {
        chip: document.getElementById('navEditCapChip').textContent.trim(),
        last: document.querySelectorAll('#navEditBottom [data-nav-id]')[7].getAttribute('data-nav-id'),
        addOff: document.querySelector('#navEditPool [data-nav-act="add"]').disabled
      };
    });
    assert.strictEqual(added.chip, 'Bar full (8/8)');
    assert.strictEqual(added.last, 'broadcast');
    assert.strictEqual(added.addOff, true);
    await page.click('#navEditDone');
    const saved = await page.evaluate(function(){
      var raw = localStorage.getItem(navEditStorageKey());
      var live = Array.prototype.map.call(document.querySelectorAll('#adminScreen .bottom-nav .bottom-tab'), function(el){return el.id;});
      return {raw: raw, live: live, key: navEditStorageKey()};
    });
    assert.ok(saved.key.indexOf('evercare_nav_tabs:') === 0);
    assert.ok(saved.raw.indexOf('"v":1') >= 0, 'same prefs shape');
    assert.ok(saved.raw.indexOf('broadcast') >= 0 && saved.raw.indexOf('backups') < 0);
    assert.strictEqual(saved.live[saved.live.length - 1], 'nav_more');
    assert.strictEqual(saved.live.length, 9);

    await page.setViewport({width:1280, height:800, isMobile:false, hasTouch:false});
    await page.evaluate(function(){
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
      showTab('coverage');
    });
    const desk = await page.evaluate(function(){
      var tabs = Array.prototype.map.call(document.querySelectorAll('#adminScreen .bottom-nav .bottom-tab'), function(el){return el.id;});
      var r = document.querySelector('#nav_more').getBoundingClientRect();
      return {tabs: tabs, moreRight: r.right, view: window.innerWidth, active: document.getElementById('nav_coverage').classList.contains('active')};
    });
    assert.strictEqual(desk.tabs.length, 9);
    assert.ok(desk.moreRight <= desk.view + 1, 'desktop More stays on screen');
    assert.strictEqual(desk.active, true);
    await shot(page, 'tabbar-8-desktop-bar.png');
    await page.evaluate(function(){showTab('more'); navEditOpen();});
    await page.waitForSelector('#navEditCapChip', {visible:true});
    const deskEdit = await page.evaluate(function(){
      return document.getElementById('navEditCapChip').textContent.trim();
    });
    assert.strictEqual(deskEdit, 'Bar full (8/8)');
    await shot(page, 'tabbar-8-desktop-edit.png');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-tabbar-8-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
