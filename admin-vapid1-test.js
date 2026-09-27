#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=vapid1'), 'vapid1 marker');
assert.ok(html.includes('data-vapid1="v=vapid1"'), 'vapid1 data attr');
assert.ok(html.includes('<!-- web push public key 2026-09-27 v=vapid1 admin-build 2026-09-27-vapid1'), 'vapid1 comment');
assert.ok(html.includes('Ace CALLABLE keys live'), 'Ace CALLABLE keys live');
assert.ok(html.includes("var VAPID1_MARKER='v=vapid1'"), 'vapid1 script marker');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-remi-float-noshow1'), 'first admin-build is vapid1');
assert.ok(html.indexOf('content="2026-09-27-vapid1"') < html.indexOf('content="2026-09-27-clienthrs1d"'), 'clienthrs1d stays after this tip');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-clienthrs1d">'), 'clienthrs1d meta stays');
assert.ok(html.includes('id="notifVapid"'), 'vapid banner');
assert.ok(html.includes('get_vapid_public_key'), 'public key rpc');
assert.ok(html.includes('admin_list_aide_notification_roster'), 'roster rpc stays');
assert.ok(html.includes('admin_nudge_aide_notifications'), 'nudge rpc stays');
assert.ok(html.includes('admin_schedule_aide_message'), 'schedule-send stays');
assert.ok(html.includes('id="chatNamesCard"'), 'chat names stay');
assert.ok(html.includes('turn_on_location') && html.includes('turn_on_chat') && html.includes('turn_on_reminders'), 'nudge kinds stay');
assert.ok(html.includes('needs_attention') && html.includes('location_off') && html.includes('chat_off'), 'roster filters stay');
assert.ok(html.includes('value="sms_later" disabled'), 'SMS later stays disabled');
assert.ok(!/VAPID_PRIVATE|BEGIN (?:EC )?PRIVATE|private_key\s*[:=]/i.test(html), 'no private key material');
assert.ok(!/\bQuo\b|twilio|sms_send|send_sms/.test(html.slice(html.indexOf('var VAPID1_MARKER'), html.indexOf('var CLIENTHRS1D_MARKER') + 40)), 'no Quo or SMS sender on this tip');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
assert.ok(html.includes('id="copilotFab"'), 'corner chip stays');
assert.ok(html.includes('assets/remi-locked.png?v=remiface1'), 'locked Remi face stays');
assert.ok(!/reset_aide_temp_password|admin_set_role_password/.test(html.slice(html.indexOf('var VAPID1_MARKER'), html.indexOf('// v=clienthrs1d'))), 'no auth reseal in this tip');

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
    console.log('admin-vapid1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.VAPID1_SHOTS || '/opt/cursor/artifacts';
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
  const MOE = '33333333-3333-4333-8333-333333333333';
  const LINA = '44444444-4444-4444-8444-444444444444';
  const PUBLIC = 'BElPublicKeyFixtureVapid1UrlSafe';
  try{
    const page = await browser.newPage();
    page.on('pageerror', function(err){errors.push(String(err && err.message || err));});
    await page.setViewport({width:390, height:844, deviceScaleFactor:1});
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=vapid1', {waitUntil:'domcontentloaded', timeout:20000});
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
      return {
        first: document.querySelector('meta[name="admin-build"]').content,
        marker: VAPID1_MARKER,
        prior: CLIENTHRS1D_MARKER
      };
    });
    assert.strictEqual(boot.first, '2026-09-27-remi-proof1');
    assert.strictEqual(boot.marker, 'v=vapid1');
    assert.strictEqual(boot.prior, 'v=clienthrs1d');

    const roster = [
      {aide_id:MOE, aide_username:'mossier', aide_name:'Moe', remi_reminders:true, office_chat_push:true, timesheet_location_permission:'denied', has_active_subscription:false, needs_attention:true, nudge_kinds:['turn_on_location']},
      {aide_id:LINA, aide_username:'lina', aide_name:'Lina', remi_reminders:false, office_chat_push:false, timesheet_location_permission:'never_asked', has_active_subscription:false, needs_attention:true, nudge_kinds:['turn_on_reminders','turn_on_chat','turn_on_location']}
    ];
    await page.evaluate(function(pack){
      window.__vapidOn = true;
      window.__calls = [];
      readSbSession = function(){return {access_token:'office-jwt'};};
      sbRestRpc = async function(name, body){
        window.__calls.push({name:name, body:body||{}});
        if(name === 'get_vapid_public_key'){
          if(window.__vapidOn){
            return {ok:true, data:{success:true, vapidPublicKey:pack.PUBLIC, configured:true, note:'public only'}};
          }
          return {ok:true, data:{success:true, vapidPublicKey:null, configured:false, note:'not set'}};
        }
        if(name === 'admin_list_aide_notification_roster'){
          var filter = (body && body.p_filter) || 'needs_attention';
          return {ok:true, data:{success:true, filter:filter, aides:pack.roster}};
        }
        if(name === 'admin_nudge_aide_notifications'){
          return {ok:true, data:{success:true, nudge_kind:body.p_nudge_kind, aide_id:body.p_aide_id, sms_sent:false, channel:'in_app_messages'}};
        }
        return {ok:false, status:404, error:'Could not find the function'};
      };
    }, {roster:roster, PUBLIC:PUBLIC});

    await page.evaluate(function(){showTab('more');});
    await page.click('#nav_notifications');
    await page.waitForSelector('#notifRows .notif-btn');
    const live = await page.evaluate(function(publicKey){
      var btns = document.querySelectorAll('#notifRows .notif-btn');
      var fab = document.getElementById('copilotFab').getBoundingClientRect();
      var sms = document.querySelector('#clienthrs1dChannel option[value="sms_later"]');
      return {
        vapid: document.getElementById('notifVapid').textContent,
        rows: document.querySelectorAll('#notifRows .notif-row').length,
        buttons: btns.length,
        disabled: Array.prototype.some.call(btns, function(b){return b.disabled;}),
        kinds: Array.prototype.map.call(btns, function(b){return b.getAttribute('data-nudge');}),
        scroll: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        fabW: Math.round(fab.width),
        fabRight: Math.round(fab.right),
        viewW: window.innerWidth,
        smsDisabled: !!(sms && sms.disabled),
        leaked: document.body.innerText.indexOf(publicKey) >= 0,
        fullRemi: !!document.getElementById('tab_remi')
      };
    }, PUBLIC);
    assert.ok(live.vapid.indexOf('can deliver') >= 0, live.vapid);
    assert.ok(live.vapid.indexOf('not configured') < 0, live.vapid);
    assert.ok(live.rows >= 2, 'roster stays');
    assert.ok(live.buttons >= 4, 'nudge buttons stay');
    assert.strictEqual(live.disabled, false);
    assert.ok(live.kinds.indexOf('turn_on_location') >= 0 && live.kinds.indexOf('turn_on_chat') >= 0 && live.kinds.indexOf('turn_on_reminders') >= 0, live.kinds.join(','));
    assert.ok(live.scroll, 'phone roster does not widen the page');
    assert.ok(live.fabW > 0 && live.fabW < 120, 'Remi stays a corner chip');
    assert.ok(live.fabRight > live.viewW - 140, 'chip sits on the right');
    assert.strictEqual(live.smsDisabled, true);
    assert.strictEqual(live.leaked, false);
    assert.strictEqual(live.fullRemi, false);
    await shotEl(page, '#tab_notifications', path.join(shotDir, 'vapid1-roster-phone.png'));

    await page.click('#notifRows .notif-btn');
    const nudged = await page.evaluate(function(){
      return {
        status: document.getElementById('notifStatus').textContent,
        call: window.__calls.filter(function(c){return c.name === 'admin_nudge_aide_notifications';}).pop(),
        vapidCalls: window.__calls.filter(function(c){return c.name === 'get_vapid_public_key';}).length
      };
    });
    assert.ok(nudged.call && nudged.call.body.p_nudge_kind === 'turn_on_location' && nudged.call.body.p_aide_id === MOE, JSON.stringify(nudged));
    assert.ok(/Messages/.test(nudged.status) && /Not SMS/.test(nudged.status), nudged.status);
    assert.ok(nudged.vapidCalls >= 1);

    await page.click('#notifFilterLocation');
    const loc = await page.evaluate(function(){
      return window.__calls.filter(function(c){return c.name === 'admin_list_aide_notification_roster';}).pop().body.p_filter;
    });
    assert.strictEqual(loc, 'location_off');

    await page.evaluate(function(){window.__vapidOn = false;});
    await page.evaluate(function(){return clienthrs1dOpenRoster();});
    await page.waitForFunction(function(){
      return document.getElementById('notifVapid').textContent.indexOf('not configured') >= 0;
    });
    const soft = await page.evaluate(function(){
      var btns = document.querySelectorAll('#notifRows .notif-btn');
      return {
        vapid: document.getElementById('notifVapid').textContent,
        buttons: btns.length,
        disabled: Array.prototype.some.call(btns, function(b){return b.disabled;})
      };
    });
    assert.ok(soft.vapid.indexOf('not configured') >= 0, soft.vapid);
    assert.ok(soft.vapid.indexOf('Messages') >= 0, soft.vapid);
    assert.ok(soft.buttons >= 4, 'soft note does not remove nudges');
    assert.strictEqual(soft.disabled, false);
    await page.click('#notifRows .notif-btn');
    const nudgedOff = await page.evaluate(function(){
      var calls = window.__calls.filter(function(c){return c.name === 'admin_nudge_aide_notifications';});
      return {n: calls.length, status: document.getElementById('notifStatus').textContent};
    });
    assert.ok(nudgedOff.n >= 2, 'nudge still posts when configured is false');
    assert.ok(/Messages/.test(nudgedOff.status), nudgedOff.status);

    await page.setViewport({width:1280, height:900, deviceScaleFactor:1});
    await page.evaluate(function(){
      window.__vapidOn = true;
      return clienthrs1dOpenRoster();
    });
    await page.waitForFunction(function(){
      return document.getElementById('notifVapid').textContent.indexOf('can deliver') >= 0;
    });
    await shotEl(page, '#tab_notifications', path.join(shotDir, 'vapid1-roster-desktop.png'));
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
  console.log('admin-vapid1 ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
