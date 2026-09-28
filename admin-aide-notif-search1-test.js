#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=aide-notif-search1'), 'aide-notif-search1 marker');
assert.ok(html.includes('data-aide-notif-search1="v=aide-notif-search1"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-27-aide-notif-search1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-aide-notif-search1">'), 'meta');
assert.ok(html.includes('<!-- aide notif search 2026-09-27 v=aide-notif-search1 admin-build 2026-09-27-aide-notif-search1'), 'comment');
assert.ok(html.includes("var AIDE_NOTIF_SEARCH1_MARKER='v=aide-notif-search1'"), 'script marker');
assert.ok(html.includes('GHOST-AIDE-NOTIF-SEARCH1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace CALLABLE. MERGE HOLD. Do not claim LIVE.'), 'callable and merge hold');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('Pure Admin UI. No SQL. No new RPC.'), 'no SQL and no new RPC');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-aide-notif-search1'), 'first admin-build is aide-notif-search1');
assert.ok(html.indexOf('content="2026-09-27-aide-notif-search1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays under this tip');
assert.ok(html.indexOf('content="2026-09-27-remi-chat1"') < html.indexOf('content="2026-09-27-hold-client1"'), 'hold-client1 stays after remi-chat1');
assert.ok(html.indexOf('content="2026-09-27-hold-client1"') < html.indexOf('content="2026-09-27-aides-info1"'), 'aides-info1 stays after hold-client1');
assert.ok(html.indexOf('content="2026-09-27-aides-info1"') < html.indexOf('content="2026-09-27-login-toast1"'), 'login-toast1 stays after aides-info1');
assert.ok(html.indexOf('content="2026-09-27-login-toast1"') < html.indexOf('content="2026-09-27-aide-office-vis1"'), 'aide-office-vis1 stays under login-toast1');
assert.ok(html.indexOf('content="2026-09-27-aide-office-vis1"') < html.indexOf('content="2026-09-27-remi-langs1"'), 'remi-langs1 stays after aide-office-vis1');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-aide-office-vis1">'), 'aide-office-vis1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-clienthrs1d">'), 'clienthrs1d meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-vapid1">'), 'vapid1 meta stays');
['v=aide-office-vis1','v=clienthrs1d','v=vapid1','v=aidechat1','v=remiface1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('id="copilotFab"'), 'Remi corner chip stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');

const panelAt = html.indexOf('id="tab_notifications"');
const panel = html.slice(panelAt, html.indexOf('id="tab_aidechat"', panelAt));
assert.ok(panel.indexOf('id="notifRosterSearch"') < panel.indexOf('id="notifFilterNeeds"'), 'search sits above Needs attention');
assert.ok(panel.indexOf('id="notifFilterNeeds"') < panel.indexOf('id="notifFilterAll"'), 'Needs attention stays first chip');
assert.ok(panel.includes('id="notifFilterLocation"') && panel.includes('id="notifFilterChat"'), 'location and chat chips stay');
assert.ok(panel.includes('oninput="clienthrs1dPaintRoster()"'), 'search repaints locally');
assert.ok(!panel.includes('p_search'), 'search field does not send p_search');
assert.ok(panel.includes('placeholder="Name or username"'), 'name or username placeholder');

const loadStart = html.indexOf('async function clienthrs1dLoadRoster()');
const loadEnd = html.indexOf('async function clienthrs1dOpenRoster()');
const load = html.slice(loadStart, loadEnd);
assert.ok(load.includes("clienthrs1dRpc('admin_list_aide_notification_roster', {p_filter:clienthrs1dFilter})"), 'roster rpc stays p_filter only');
assert.ok(!load.includes('p_search'), 'load does not add p_search');
assert.ok(html.includes("empty.textContent=q?'No aides match that search.':'No aides in this filter.'"), 'empty match copy');
assert.ok(html.includes('function clienthrs1dRosterMatch(row, query)'), 'local match helper');
assert.ok(html.includes('while(q.charAt(0)===\'@\')q=q.slice(1);'), 'leading @ is stripped');
const setFilter = html.slice(html.indexOf('function clienthrs1dSetFilter(filter)'), html.indexOf('async function clienthrs1dNudge('));
assert.ok(!/notifRosterSearch[\s\S]{0,80}\.value\s*=\s*['"]['"]/.test(setFilter), 'filter change does not clear search');
assert.ok(html.includes('class="notif-btn"'), 'nudge buttons stay');
assert.ok(!/CREATE\s+TABLE|ALTER\s+TABLE/i.test(html.slice(html.indexOf('v=aide-notif-search1'), html.indexOf('v=aide-office-vis1'))), 'no SQL in this tip');

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
    console.log('admin-aide-notif-search1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.AIDE_NOTIF_SEARCH1_SHOTS || '/opt/cursor/artifacts';
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
  const errors = [];
  const SARA = '11111111-1111-4111-8111-111111111111';
  const MOE = '33333333-3333-4333-8333-333333333333';
  const LINA = '44444444-4444-4444-8444-444444444444';
  const DEVON = '55555555-5555-4555-8555-555555555555';
  try{
    const page = await browser.newPage();
    page.on('pageerror', function(err){errors.push(String(err && err.message || err));});
    await page.setViewport({width:390, height:844, deviceScaleFactor:1});
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=aide-notif-search1', {waitUntil:'domcontentloaded', timeout:20000});
    await page.evaluate(function(){
      localStorage.clear();
      sessionStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'moe';
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
    });
    const boot = await page.evaluate(function(){
      var metas = document.querySelectorAll('meta[name="admin-build"]');
      return {
        first: metas[0].content,
        second: metas[1] ? metas[1].content : '',
        marker: AIDE_NOTIF_SEARCH1_MARKER,
        prior: CLIENTHRS1D_MARKER
      };
    });
    assert.strictEqual(boot.first, '2026-09-27-aide-notif-search1');
    assert.strictEqual(boot.second, '2026-09-27-remi-chat1');
    assert.strictEqual(boot.marker, 'v=aide-notif-search1');
    assert.strictEqual(boot.prior, 'v=clienthrs1d');

    const roster = [
      {aide_id:MOE, aide_username:'mossier', aide_name:'Moe', remi_reminders:true, office_chat_push:true, timesheet_location_permission:'denied', has_active_subscription:false, needs_attention:true, nudge_kinds:['turn_on_location']},
      {aide_id:LINA, aide_username:'lina', aide_name:'Lina', remi_reminders:false, office_chat_push:false, timesheet_location_permission:'never_asked', has_active_subscription:false, needs_attention:true, nudge_kinds:['turn_on_reminders','turn_on_chat','turn_on_location']},
      {aide_id:SARA, aide_username:'sara', aide_name:'Sara', remi_reminders:true, office_chat_push:true, timesheet_location_permission:'allowed', has_active_subscription:true, needs_attention:false, nudge_kinds:[]},
      {aide_id:DEVON, aide_username:'devon', aide_name:'Devon', remi_reminders:false, office_chat_push:true, timesheet_location_permission:'allowed', has_active_subscription:true, needs_attention:true, nudge_kinds:['turn_on_reminders']}
    ];
    await page.evaluate(function(pack){
      window.__calls = [];
      readSbSession = function(){return {access_token:'office-jwt'};};
      sbRestRpc = async function(name, body){
        window.__calls.push({name:name, body:body||{}});
        if(name === 'get_vapid_public_key')return {ok:true, data:{success:true, vapidPublicKey:null, configured:false}};
        if(name === 'admin_list_aide_notification_roster'){
          var filter = (body && body.p_filter) || 'needs_attention';
          var aides = pack.roster.filter(function(row){
            if(filter === 'all')return true;
            if(filter === 'location_off')return row.timesheet_location_permission !== 'allowed';
            if(filter === 'chat_off')return !row.office_chat_push;
            return row.needs_attention;
          });
          return {ok:true, data:{success:true, filter:filter, aides:aides}};
        }
        if(name === 'admin_nudge_aide_notifications')return {ok:true, data:{success:true, nudge_kind:body.p_nudge_kind, aide_id:body.p_aide_id, sms_sent:false, channel:'in_app_messages'}};
        return {ok:false, status:404, error:'Could not find the function'};
      };
    }, {roster:roster});

    await page.evaluate(function(){showTab('more');});
    await page.click('#nav_notifications');
    await page.waitForSelector('#notifRows .notif-row');
    const opened = await page.evaluate(function(){
      return {
        rows: document.querySelectorAll('#notifRows .notif-row').length,
        empty: document.getElementById('notifEmpty').hidden,
        emptyText: document.getElementById('notifEmpty').textContent,
        search: document.getElementById('notifRosterSearch').value
      };
    });
    assert.strictEqual(opened.rows, 3, 'needs attention starts with three aides');
    assert.strictEqual(opened.empty, true);
    assert.strictEqual(opened.emptyText, 'No aides in this filter.');
    assert.strictEqual(opened.search, '');
    const phoneBox = await page.evaluate(function(){
      var search = document.getElementById('notifRosterSearch');
      var chip = document.getElementById('notifFilterNeeds');
      var searchBox = search.getBoundingClientRect();
      var chipBox = chip.getBoundingClientRect();
      return {
        above: searchBox.bottom <= chipBox.top + 1,
        font: getComputedStyle(search).fontSize,
        tall: searchBox.height,
        wide: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
      };
    });
    assert.strictEqual(phoneBox.above, true);
    assert.strictEqual(phoneBox.font, '16px');
    assert.ok(phoneBox.tall >= 48, 'search is at least 48px, got '+phoneBox.tall);
    assert.ok(phoneBox.wide, 'phone search does not widen the page');

    async function setSearch(value){
      await page.evaluate(function(v){
        var el = document.getElementById('notifRosterSearch');
        el.value = v;
        el.dispatchEvent(new Event('input', {bubbles:true}));
      }, value);
    }
    function rosterCalls(){
      return page.evaluate(function(){
        return window.__calls.filter(function(c){return c.name === 'admin_list_aide_notification_roster';}).map(function(c){return c.body;});
      });
    }

    const beforeType = (await rosterCalls()).length;
    await setSearch('LINA');
    const byName = await page.evaluate(function(){
      return {
        rows: Array.prototype.map.call(document.querySelectorAll('#notifRows .notif-row'), function(el){return el.innerText.replace(/\s+/g,' ').trim();}),
        empty: document.getElementById('notifEmpty').hidden,
        nudge: document.querySelector('#notifRows .notif-btn') ? document.querySelector('#notifRows .notif-btn').textContent : ''
      };
    });
    assert.strictEqual(byName.rows.length, 1, byName.rows.join('\n'));
    assert.ok(byName.rows[0].indexOf('Lina @lina') >= 0, byName.rows[0]);
    assert.ok(byName.rows[0].indexOf('turn on chat') >= 0, 'nudge buttons stay');
    assert.strictEqual(byName.nudge, 'Remi: turn on reminders');
    assert.strictEqual(byName.empty, true);
    assert.strictEqual((await rosterCalls()).length, beforeType, 'typing does not call the roster rpc');

    await setSearch('@MOSS');
    const byHandle = await page.evaluate(function(){
      return Array.prototype.map.call(document.querySelectorAll('#notifRows .notif-row'), function(el){return el.innerText.replace(/\s+/g,' ').trim();});
    });
    assert.strictEqual(byHandle.length, 1);
    assert.ok(byHandle[0].indexOf('Moe @mossier') >= 0, byHandle[0]);

    await setSearch('nobody-here');
    const miss = await page.evaluate(function(){
      var empty = document.getElementById('notifEmpty');
      return {rows: document.querySelectorAll('#notifRows .notif-row').length, hidden: empty.hidden, text: empty.textContent};
    });
    assert.strictEqual(miss.rows, 0);
    assert.strictEqual(miss.hidden, false);
    assert.strictEqual(miss.text, 'No aides match that search.');
    await shotEl(page, '#tab_notifications', path.join(shotDir, 'aide-notif-search1-empty-phone.png'));

    await setSearch('sara');
    await page.click('#notifFilterAll');
    await page.waitForFunction(function(){return document.querySelectorAll('#notifRows .notif-row').length === 1;});
    const kept = await page.evaluate(function(){
      var calls = window.__calls.filter(function(c){return c.name === 'admin_list_aide_notification_roster';});
      var last = calls[calls.length-1].body;
      return {
        search: document.getElementById('notifRosterSearch').value,
        row: document.querySelector('#notifRows .notif-row').innerText.replace(/\s+/g,' ').trim(),
        filter: last.p_filter,
        keys: Object.keys(last),
        chip: document.getElementById('notifFilterAll').classList.contains('on')
      };
    });
    assert.strictEqual(kept.search, 'sara');
    assert.ok(kept.row.indexOf('Sara @sara') >= 0 && kept.row.indexOf('All set') >= 0, kept.row);
    assert.strictEqual(kept.filter, 'all');
    assert.deepStrictEqual(kept.keys, ['p_filter']);
    assert.strictEqual(kept.chip, true);

    await page.click('#notifFilterLocation');
    await page.waitForFunction(function(){
      var empty = document.getElementById('notifEmpty');
      return empty && !empty.hidden && empty.textContent === 'No aides match that search.';
    });
    const locKept = await page.evaluate(function(){
      var calls = window.__calls.filter(function(c){return c.name === 'admin_list_aide_notification_roster';});
      return {search: document.getElementById('notifRosterSearch').value, filter: calls[calls.length-1].body.p_filter};
    });
    assert.strictEqual(locKept.search, 'sara');
    assert.strictEqual(locKept.filter, 'location_off');

    await setSearch('');
    const restored = await page.evaluate(function(){
      return {
        rows: document.querySelectorAll('#notifRows .notif-row').length,
        text: document.getElementById('notifEmpty').textContent,
        hidden: document.getElementById('notifEmpty').hidden,
        calls: window.__calls.filter(function(c){return c.name === 'admin_list_aide_notification_roster';}).length
      };
    });
    assert.strictEqual(restored.rows, 2, 'empty search shows the location-off roster');
    assert.strictEqual(restored.hidden, true);
    assert.strictEqual(restored.text, 'No aides in this filter.');

    await setSearch('mossier');
    await page.click('#notifRows .notif-btn');
    const nudged = await page.evaluate(function(){
      var call = window.__calls.filter(function(c){return c.name === 'admin_nudge_aide_notifications';}).pop();
      return {call: call, status: document.getElementById('notifStatus').textContent};
    });
    assert.ok(nudged.call && nudged.call.body.p_nudge_kind === 'turn_on_location' && nudged.call.body.p_aide_id === MOE, JSON.stringify(nudged));
    assert.ok(/Not SMS/.test(nudged.status), nudged.status);
    assert.ok(!(await page.evaluate(function(){return window.__calls;})).some(function(c){return /p_search/.test(JSON.stringify(c.body||{})) || /quo|sms_send|send_sms/i.test(c.name);}));

    await page.setViewport({width:1280, height:900, deviceScaleFactor:1});
    await setSearch('dev');
    await page.click('#notifFilterAll');
    await page.waitForFunction(function(){return document.querySelectorAll('#notifRows .notif-row').length === 1;});
    const desk = await page.evaluate(function(){
      var row = document.querySelector('#notifRows .notif-row').innerText.replace(/\s+/g,' ').trim();
      var search = document.getElementById('notifRosterSearch').getBoundingClientRect();
      var chip = document.getElementById('notifFilterNeeds').getBoundingClientRect();
      return {row: row, above: search.bottom <= chip.top + 1, search: document.getElementById('notifRosterSearch').value};
    });
    assert.ok(desk.row.indexOf('Devon @devon') >= 0, desk.row);
    assert.strictEqual(desk.search, 'dev');
    assert.strictEqual(desk.above, true);
    await shotEl(page, '#tab_notifications', path.join(shotDir, 'aide-notif-search1-match-desktop.png'));

    await page.setViewport({width:390, height:844, deviceScaleFactor:1});
    await setSearch('@lina');
    await page.evaluate(function(){document.getElementById('tab_notifications').scrollIntoView({block:'start'});});
    await shotEl(page, '#tab_notifications', path.join(shotDir, 'aide-notif-search1-match-phone.png'));
    const phoneMatch = await page.evaluate(function(){
      return document.querySelector('#notifRows .notif-row').innerText.replace(/\s+/g,' ').trim();
    });
    assert.ok(phoneMatch.indexOf('Lina @lina') >= 0, phoneMatch);
    assert.deepStrictEqual(errors, []);
  }finally{
    await browser.close();
    server.close();
  }
}

async function shotEl(page, sel, file){
  const el = await page.$(sel);
  assert.ok(el, 'missing '+sel);
  await el.evaluate(function(node){node.scrollIntoView({block:'start'});});
  await el.screenshot({path:file});
}

runBrowser().then(function(){
  console.log('admin-aide-notif-search1 ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
