#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');

assert.ok(html.includes('v=admin-sched-chat-push1'), 'admin-sched-chat-push1 marker');
assert.ok(html.includes('admin-sched-chat-push1'), 'bare marker');
assert.ok(html.includes('data-admin-sched-chat-push1="v=admin-sched-chat-push1"'), 'data attr');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-admin-sched-chat-push1">'), 'build meta');
assert.ok(html.includes('<!-- admin sched chat push 2026-09-29 v=admin-sched-chat-push1 admin-build 2026-09-29-admin-sched-chat-push1'), 'comment');
assert.ok(html.includes("var ADMIN_SCHED_CHAT_PUSH1_MARKER='v=admin-sched-chat-push1'"), 'script marker');
assert.ok(html.includes('GHOST-ADMIN-SCHED-CHAT-PUSH1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('MERGE HOLD'), 'merge hold');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim live');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build is remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1b"') < html.indexOf('content="2026-09-29-admin-sched-chat-push1"'), 'new meta stays after the first');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-vapid1">'), 'vapid1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-clienthrs1d">'), 'clienthrs1d meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-28-aide-profile-link-fix">'), 'aide-profile-link-fix meta stays');
['v=vapid1','v=clienthrs1d','v=aide-notif-search1','v=aidechat1','v=aide-office-vis1','v=care-msg-safe1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});

const cardStart = html.indexOf('id="staffPushPrefs"');
const cardEnd = html.indexOf('id="chatNamesCard"');
assert.ok(cardStart > 0 && cardEnd > cardStart, 'settings card before chat names');
const card = html.slice(cardStart, cardEnd);
assert.ok(card.includes('data-layout-roles="Admin Scheduler"'), 'Admin and Scheduler share the toggle');
assert.ok(card.includes('Aide + Remi messages'), 'toggle label');
assert.ok(card.includes('Phone ping when an aide or Remi writes'), 'toggle hint');
assert.ok(card.includes('Just the toggle. Flip ON asks Allow automatically.'), 'flip ON copy');
assert.ok(card.includes('Open the app from your Home Screen, then tap Allow.'), 'home screen hint');
assert.ok(card.includes('Phone pings on'), 'on state copy');
assert.ok(card.includes('id="staffPushAideRemi"'), 'toggle control');
assert.ok(card.includes('adminSchedChatPush1Toggle()'), 'toggle handler');
assert.ok(!/<button\b/i.test(card), 'no separate Allow button');
assert.ok(!/id="staffPushAllow"|Allow nag|gate card/i.test(card), 'no Allow gate card');
assert.ok(!/vapid|service worker|pushmanager|lock[- ]screen/i.test(card), 'no worker jargon in the settings card');

const notifStart = html.indexOf('id="tab_notifications"');
const notifEnd = html.indexOf('id="tab_aidechat"');
assert.ok(notifStart > 0 && notifEnd > notifStart, 'aide roster still present');
const roster = html.slice(notifStart, notifEnd);
assert.ok(!roster.includes('staffPushAideRemi'), 'toggle is not on the aide notifications roster');
assert.ok(!roster.includes('Aide + Remi messages'), 'staff toggle label is not on the aide roster');
assert.ok(roster.includes('Aide notifications'), 'aide roster title stays');
assert.ok(html.includes('id="nav_notifications"'), 'More notifications row stays');
assert.ok(html.includes('admin_list_aide_notification_roster'), 'aide roster rpc stays');
assert.ok(html.includes('get_vapid_public_key'), 'public key rpc');
assert.ok(html.includes('admin_subscribe_office_staff_push'), 'subscribe hook');
assert.ok(html.includes('admin_unsubscribe_office_staff_push'), 'unsubscribe hook');
assert.ok(html.includes('admin_set_office_staff_push_prefs'), 'prefs hook');
assert.ok(!/VAPID_PRIVATE|BEGIN (?:EC )?PRIVATE|private_key\s*[:=]/i.test(html), 'no private key material');

const start = html.indexOf('// admin sched chat push1 v=admin-sched-chat-push1');
const end = html.indexOf('// end admin sched chat push1 v=admin-sched-chat-push1');
assert.ok(start > 0 && end > start, 'script block');
const src = html.slice(start, end);
assert.ok(src.includes("register('sw.js')"), 'worker register has no version query');
assert.ok(!/register\(['"]sw\.js\?/.test(src), 'register does not force a query');
assert.ok(!/location\.(search|href)\s*=/.test(src), 'script does not rewrite the address bar');
assert.ok(!/history\.(replaceState|pushState)/.test(src), 'script does not push a version into history');
assert.ok(!/\bQuo\b|twilio|send_sms/.test(src), 'no Quo or SMS sender');
assert.ok(!/admin_deliver_office|deliver_push/.test(src), 'deliver stays with Ace');
assert.ok(sw.includes('#aidechat'), 'tap opens Messages hash');
assert.ok(!sw.includes('?v='), 'worker does not force ?v=');
assert.ok(!/caches\.open|cache\.put/.test(sw), 'worker does not cache the app');
assert.ok(!/vapid|service worker|pushmanager|lock[- ]screen/i.test(sw), 'worker file has no staff jargon');

const JARGON = /vapid|service worker|pushmanager|lock[- ]screen/i;
const MOE = '33333333-3333-4333-8333-333333333333';

function memoryStorage(){
  const map = new Map();
  return {
    getItem: function(k){return map.has(k) ? map.get(k) : null;},
    setItem: function(k, v){map.set(String(k), String(v));},
    removeItem: function(k){map.delete(k);},
    clear: function(){map.clear();}
  };
}
function fakeDocument(){
  const els = {};
  function make(id){
    return {
      id: id,
      textContent: '',
      checked: false,
      hidden: false,
      classList: {add: function(){}, remove: function(){}, contains: function(){return false;}},
      setAttribute: function(){this.hidden = true;},
      removeAttribute: function(){this.hidden = false;}
    };
  }
  return {
    readyState: 'complete',
    addEventListener: function(){},
    getElementById: function(id){
      if(!els[id]) els[id] = make(id);
      return els[id];
    },
    els: els
  };
}

function loadSandbox(){
  const calls = [];
  const subs = {n: 0};
  const unsubs = {n: 0};
  const asks = {n: 0};
  const tabs = [];
  const threads = [];
  const opened = [];
  const document = fakeDocument();
  const Notification = {
    permission: 'default',
    requestPermission: function(){
      asks.n += 1;
      Notification.permission = 'granted';
      return Promise.resolve('granted');
    }
  };
  const pushManager = {
    subscribe: function(){
      subs.n += 1;
      return Promise.resolve({
        endpoint: 'https://push.example/sub',
        toJSON: function(){return {endpoint: 'https://push.example/sub', keys: {p256dh: 'aa', auth: 'bb'}};},
        unsubscribe: function(){unsubs.n += 1; return Promise.resolve(true);}
      });
    },
    getSubscription: function(){return Promise.resolve(null);}
  };
  const sandbox = {
    console: console,
    Promise: Promise,
    Uint8Array: Uint8Array,
    atob: atob,
    btoa: btoa,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    currentAdminRole: 'Admin',
    currentAdminUsername: 'moe',
    localStorage: memoryStorage(),
    document: document,
    Notification: Notification,
    location: {hash: '', search: '', pathname: '/index.html'},
    navigator: {
      serviceWorker: {
        register: function(url){
          sandbox.registered = url;
          return Promise.resolve({pushManager: pushManager});
        },
        ready: Promise.resolve({pushManager: pushManager}),
        getRegistration: function(){return Promise.resolve({pushManager: pushManager});},
        addEventListener: function(){}
      }
    },
    calls: calls,
    subs: subs,
    unsubs: unsubs,
    asks: asks,
    tabs: tabs,
    threads: threads,
    opened: opened,
    aidechatThreads: [],
    aidechatFindByAide: function(){return null;},
    aidechatFind: function(){return null;},
    aidechatOpenThread: function(id){opened.push(id); return Promise.resolve();},
    showTab: function(tab){
      tabs.push(tab);
      if(tab === 'aidechat') sandbox.adminSchedChatPush1AfterMessages();
    },
    readSbSession: function(){return {access_token: 'office-jwt'};},
    sbRestRpc: async function(name, body){
      calls.push({name: name, body: body || {}});
      if(name === 'get_vapid_public_key'){
        if(sandbox.vapidOn) return {ok: true, data: {success: true, configured: true, vapidPublicKey: sandbox.publicKey}};
        return {ok: true, data: {success: true, configured: false, vapidPublicKey: null}};
      }
      return {ok: false, status: 404, error: 'Could not find the function'};
    },
    vapidOn: false,
    publicKey: Buffer.alloc(65, 7).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
    registered: ''
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(src + '\nthis.ADMIN_SCHED_CHAT_PUSH1_MARKER=ADMIN_SCHED_CHAT_PUSH1_MARKER;\nthis.ADMIN_SCHED_CHAT_PUSH1_COPY=ADMIN_SCHED_CHAT_PUSH1_COPY;', sandbox);
  return sandbox;
}

function staffText(copy){
  return Object.keys(copy).map(function(key){return String(copy[key]);}).join('\n');
}

(async function(){
  const box = loadSandbox();
  assert.strictEqual(box.ADMIN_SCHED_CHAT_PUSH1_MARKER, 'v=admin-sched-chat-push1');
  assert.ok(!JARGON.test(staffText(box.ADMIN_SCHED_CHAT_PUSH1_COPY)), staffText(box.ADMIN_SCHED_CHAT_PUSH1_COPY));
  assert.strictEqual(box.adminSchedChatPush1RoleOk(), true);
  box.currentAdminRole = 'Scheduler';
  assert.strictEqual(box.adminSchedChatPush1RoleOk(), true);
  box.currentAdminRole = 'Nurse';
  assert.strictEqual(box.adminSchedChatPush1RoleOk(), false);
  const nurse = await box.adminSchedChatPush1Enable();
  assert.strictEqual(nurse.ok, false);
  assert.strictEqual(nurse.asked, false);
  assert.strictEqual(box.asks.n, 0);
  assert.strictEqual(box.subs.n, 0);

  box.currentAdminRole = 'Admin';
  box.currentAdminUsername = 'moe';
  const offKey = await box.adminSchedChatPush1Enable();
  assert.strictEqual(offKey.ok, true);
  assert.strictEqual(offKey.asked, true);
  assert.strictEqual(offKey.skippedSubscribe, true);
  assert.strictEqual(offKey.subscribed, false);
  assert.strictEqual(box.asks.n, 1, 'flip ON asks Allow');
  assert.strictEqual(box.subs.n, 0, 'no real subscribe when the public key is not configured');
  assert.ok(!box.calls.some(function(c){return c.name.indexOf('subscribe_office') >= 0;}), 'no subscribe RPC without a key');
  const prefOn = box.calls.filter(function(c){return c.name === 'admin_set_office_staff_push_prefs';}).pop();
  assert.ok(prefOn && prefOn.body.p_aide_remi_messages === true, JSON.stringify(prefOn));
  const status = box.document.els.staffPushStatus.textContent;
  assert.strictEqual(status, box.ADMIN_SCHED_CHAT_PUSH1_COPY.waiting);
  assert.ok(!JARGON.test(status), status);
  assert.ok(status.indexOf(box.publicKey) < 0, 'public key stays off the screen');

  box.Notification.permission = 'default';
  box.vapidOn = true;
  const onKey = await box.adminSchedChatPush1Enable();
  assert.strictEqual(onKey.subscribed, true);
  assert.strictEqual(box.subs.n, 1, 'flip ON subscribes when a public key is configured');
  assert.strictEqual(box.registered, 'sw.js');
  const subCall = box.calls.filter(function(c){return c.name === 'admin_subscribe_office_staff_push';}).pop();
  assert.ok(subCall && subCall.body.p_topic === 'aide_remi_messages' && subCall.body.p_subscription.endpoint, JSON.stringify(subCall));
  assert.strictEqual(box.document.els.staffPushStatus.textContent, box.ADMIN_SCHED_CHAT_PUSH1_COPY.on);
  assert.strictEqual(box.document.els.staffPushOnNote.hidden, false);

  box.currentAdminRole = 'Scheduler';
  box.currentAdminUsername = 'jaz';
  box.Notification.permission = 'default';
  const before = box.asks.n;
  box.document.els.staffPushAideRemi.checked = true;
  const toggled = await box.adminSchedChatPush1Toggle();
  assert.strictEqual(toggled.asked, true);
  assert.ok(box.asks.n > before, 'Scheduler flip ON uses the same Allow path');
  assert.strictEqual(box.document.els.staffPushAideRemiState.textContent, 'ON');

  const dropped = await box.adminSchedChatPush1Disable();
  assert.strictEqual(dropped.ok, true);
  const prefOff = box.calls.filter(function(c){return c.name === 'admin_set_office_staff_push_prefs';}).pop();
  assert.ok(prefOff && prefOff.body.p_aide_remi_messages === false);
  const unsub = box.calls.filter(function(c){return c.name === 'admin_unsubscribe_office_staff_push';}).pop();
  assert.ok(unsub, 'flip OFF posts unsubscribe');
  assert.strictEqual(box.document.els.staffPushStatus.textContent, box.ADMIN_SCHED_CHAT_PUSH1_COPY.off);
  assert.ok(!JARGON.test(box.document.els.staffPushStatus.textContent));

  const aidePayload = box.adminSchedChatPush1NotificationPayload({
    from: 'aide',
    aide_id: MOE,
    aide_name: 'moe',
    body: 'Can I cover Ada AM tomorrow?',
    deep_link: 'admin/messages?aide_id=' + MOE
  });
  assert.strictEqual(aidePayload.kind, 'aide_remi_message');
  assert.strictEqual(aidePayload.deep_link, 'admin/messages?aide_id=' + MOE);
  const aideRoute = box.adminSchedChatPush1OpenFromPayload({
    notification: {title: 'EverCare', data: aidePayload}
  });
  assert.strictEqual(aideRoute.tab, 'aidechat');
  assert.strictEqual(aideRoute.surface, 'thread');
  assert.strictEqual(aideRoute.from, 'aide');
  assert.strictEqual(aideRoute.aideId, MOE);
  assert.ok(box.tabs.indexOf('aidechat') >= 0);
  assert.ok(box.tabs.indexOf('more') < 0 && box.tabs.indexOf('notifications') < 0, box.tabs.join(','));
  assert.ok(box.opened.length >= 1, 'aide ping opens the aide thread');
  assert.strictEqual(box.location.search, '');

  const remiPayload = box.adminSchedChatPush1NotificationPayload({
    from: 'remi',
    body: 'Coverage draft ready — Ada AM open.',
    deep_link: 'admin/messages?from=remi'
  });
  const remiOpened = box.opened.length;
  const remiRoute = box.adminSchedChatPush1OpenFromPayload(JSON.stringify(remiPayload));
  assert.strictEqual(remiRoute.tab, 'aidechat');
  assert.strictEqual(remiRoute.surface, 'messages');
  assert.strictEqual(remiRoute.from, 'remi');
  assert.strictEqual(remiRoute.aideId, '');
  assert.strictEqual(box.opened.length, remiOpened, 'Remi ping with no aide opens Messages, not a new thread');
  assert.strictEqual(box.location.search, '');

  const linked = box.adminSchedChatPush1Route({deep_link: 'admin/messages?aide_id=' + MOE + '&from=remi'});
  assert.strictEqual(linked.surface, 'thread');
  assert.strictEqual(linked.from, 'remi');
  assert.strictEqual(linked.aideId, MOE);
  console.log('admin-sched-chat-push1 unit ok');
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

async function shotEl(page, sel, file){
  const el = await page.$(sel);
  if(!el) return;
  await el.screenshot({path: file});
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-sched-chat-push1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  if(!fs.existsSync(chrome)){
    console.log('admin-sched-chat-push1 browser skipped (no chrome)');
    return;
  }
  const shotDir = process.env.PUSH1_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive: true});
  const root = __dirname;
  const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png'};
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const file = path.normalize(path.join(root, rel));
    if(!file.startsWith(root)){res.writeHead(403); res.end(); return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404); res.end('missing'); return;}
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, {'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': 'no-store'});
      res.end(buf);
    });
  });
  await new Promise(function(resolve){server.listen(0, '127.0.0.1', resolve);});
  const port = server.address().port;
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const errors = [];
  const publicKey = Buffer.alloc(65, 9).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  try{
    const page = await browser.newPage();
    page.on('pageerror', function(err){errors.push(String(err && err.message || err));});
    await page.setViewport({width: 390, height: 844, deviceScaleFactor: 1});
    await page.goto('http://127.0.0.1:' + port + '/index.html', {waitUntil: 'domcontentloaded', timeout: 20000});
    await page.evaluate(function(key){
      localStorage.clear();
      sessionStorage.clear();
      window.__asks = 0;
      window.__subs = 0;
      window.__calls = [];
      window.__vapidOn = false;
      window.__key = key;
      window.__perm = 'default';
      try{
        Object.defineProperty(Notification, 'permission', {configurable: true, get: function(){return window.__perm;}});
      }catch(e){}
      Notification.requestPermission = function(){
        window.__asks += 1;
        window.__perm = 'granted';
        return Promise.resolve('granted');
      };
      var pm = {
        subscribe: function(){
          window.__subs += 1;
          return Promise.resolve({
            endpoint: 'https://push.example/sub',
            toJSON: function(){return {endpoint: 'https://push.example/sub', keys: {p256dh: 'aa', auth: 'bb'}};},
            unsubscribe: function(){return Promise.resolve(true);}
          });
        },
        getSubscription: function(){return Promise.resolve(null);}
      };
      navigator.serviceWorker.register = function(){return Promise.resolve({pushManager: pm});};
      try{
        Object.defineProperty(navigator.serviceWorker, 'ready', {configurable: true, get: function(){return Promise.resolve({pushManager: pm});}});
      }catch(e2){}
      navigator.serviceWorker.getRegistration = function(){return Promise.resolve({pushManager: pm});};
      readSbSession = function(){return {access_token: 'office-jwt'};};
      sbRestRpc = async function(name, body){
        window.__calls.push({name: name, body: body || {}});
        if(name === 'get_vapid_public_key'){
          if(window.__vapidOn) return {ok: true, data: {success: true, configured: true, vapidPublicKey: window.__key}};
          return {ok: true, data: {success: true, configured: false, vapidPublicKey: null}};
        }
        return {ok: false, status: 404, error: 'Could not find the function'};
      };
      currentAdminRole = 'Admin';
      currentAdminUsername = 'moe';
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
      showTab('settings');
    }, publicKey);
    const admin = await page.evaluate(function(){
      var card = document.getElementById('staffPushPrefs');
      var roster = document.getElementById('tab_notifications');
      return {
        hidden: !!(card && card.hasAttribute('hidden')),
        label: document.getElementById('staffPushTitle').textContent,
        hint: document.getElementById('staffPushHint').textContent,
        roles: card.getAttribute('data-layout-roles'),
        search: location.search,
        href: location.href,
        rosterHasToggle: !!(roster && roster.querySelector('#staffPushAideRemi')),
        text: card.innerText
      };
    });
    assert.strictEqual(admin.hidden, false);
    assert.strictEqual(admin.label, 'Aide + Remi messages');
    assert.strictEqual(admin.hint, 'Phone ping when an aide or Remi writes');
    assert.ok(admin.roles.indexOf('Admin') >= 0 && admin.roles.indexOf('Scheduler') >= 0);
    assert.strictEqual(admin.search, '');
    assert.ok(admin.href.indexOf('v=admin-sched-chat-push1') < 0, admin.href);
    assert.strictEqual(admin.rosterHasToggle, false);
    assert.ok(!/vapid|service worker|pushmanager|lock[- ]screen/i.test(admin.text), admin.text);
    await shotEl(page, '#staffPushPrefs', path.join(shotDir, 'admin-sched-chat-push1-settings-admin.png'));

    await page.click('#staffPushAideRemi');
    await page.waitForFunction(function(){return window.__asks >= 1 && document.getElementById('staffPushStatus').textContent.length > 0;});
    const flipped = await page.evaluate(function(){
      return {
        asks: window.__asks,
        subs: window.__subs,
        status: document.getElementById('staffPushStatus').textContent,
        on: document.getElementById('staffPushAideRemi').checked,
        search: location.search,
        subscribeCalls: window.__calls.filter(function(c){return String(c.name).indexOf('subscribe_office') >= 0;}).length
      };
    });
    assert.ok(flipped.asks >= 1, 'browser flip ON asks Allow');
    assert.strictEqual(flipped.subs, 0);
    assert.strictEqual(flipped.subscribeCalls, 0);
    assert.strictEqual(flipped.on, true);
    assert.ok(!/vapid|service worker|pushmanager|lock[- ]screen/i.test(flipped.status), flipped.status);
    assert.strictEqual(flipped.search, '');

    await page.evaluate(function(){
      window.__vapidOn = true;
      window.__perm = 'default';
      document.getElementById('staffPushAideRemi').checked = false;
    });
    await page.evaluate(function(){return adminSchedChatPush1Disable();});
    const asksBefore = flipped.asks;
    await page.click('#staffPushAideRemi');
    await page.waitForFunction(function(n){return window.__subs >= 1 && window.__asks > n;}, {}, asksBefore);
    const live = await page.evaluate(function(key){
      var note = document.getElementById('staffPushOnNote');
      return {
        subs: window.__subs,
        note: note.textContent,
        noteHidden: note.hidden,
        status: document.getElementById('staffPushStatus').textContent,
        leaked: document.getElementById('staffPushPrefs').innerText.indexOf(key) >= 0,
        search: location.search
      };
    }, publicKey);
    assert.ok(live.subs >= 1);
    assert.strictEqual(live.note, 'Phone pings on');
    assert.strictEqual(live.noteHidden, false);
    assert.strictEqual(live.leaked, false);
    assert.strictEqual(live.search, '');
    await shotEl(page, '#staffPushPrefs', path.join(shotDir, 'admin-sched-chat-push1-settings-on.png'));

    await page.evaluate(function(){
      currentAdminRole = 'Scheduler';
      currentAdminUsername = 'jaz';
      layoutA1ApplyRoles();
      showTab('settings');
    });
    const scheduler = await page.evaluate(function(){
      var card = document.getElementById('staffPushPrefs');
      var note = document.getElementById('staffPushOnNote');
      return {
        hidden: card.hasAttribute('hidden'),
        label: document.getElementById('staffPushTitle').textContent,
        hint: document.getElementById('staffPushHint').textContent,
        state: document.getElementById('staffPushAideRemiState').textContent,
        on: document.getElementById('staffPushAideRemi').checked,
        noteHidden: note.hidden,
        text: card.innerText
      };
    });
    assert.strictEqual(scheduler.hidden, false);
    assert.strictEqual(scheduler.label, 'Aide + Remi messages');
    assert.strictEqual(scheduler.hint, 'Phone ping when an aide or Remi writes');
    assert.strictEqual(scheduler.state, 'OFF');
    assert.strictEqual(scheduler.on, false);
    assert.strictEqual(scheduler.noteHidden, true);
    assert.ok(!/vapid|service worker|pushmanager|lock[- ]screen/i.test(scheduler.text), scheduler.text);
    await shotEl(page, '#staffPushPrefs', path.join(shotDir, 'admin-sched-chat-push1-settings-scheduler.png'));

    await page.evaluate(function(){
      currentAdminRole = 'Nurse';
      layoutA1ApplyRoles();
      showTab('settings');
    });
    const nurseHidden = await page.evaluate(function(){
      var card = document.getElementById('staffPushPrefs');
      return card.hasAttribute('hidden') || card.hidden;
    });
    assert.strictEqual(nurseHidden, true);

    await page.evaluate(function(){
      currentAdminRole = 'Admin';
      currentAdminUsername = 'moe';
      layoutA1ApplyRoles();
    });
    const opened = await page.evaluate(function(id){
      var before = location.search;
      adminSchedChatPush1OpenFromPayload({
        kind: 'aide_remi_message',
        from: 'aide',
        aide_id: id,
        aide_name: 'moe',
        body: 'Can I cover Ada AM tomorrow?',
        deep_link: 'admin/messages?aide_id=' + id
      });
      return {search: location.search, before: before, tab: document.getElementById('tab_aidechat').classList.contains('active')};
    }, '33333333-3333-4333-8333-333333333333');
    assert.strictEqual(opened.search, '');
    assert.strictEqual(opened.before, '');
    assert.strictEqual(opened.tab, true);
    assert.deepStrictEqual(errors, []);
    console.log('admin-sched-chat-push1 browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}
