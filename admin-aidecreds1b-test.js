#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=aidecreds1b'), 'aidecreds1b marker');
assert.ok(html.includes('data-aidecreds1b="v=aidecreds1b"'), 'aidecreds1b string marker');
assert.ok(html.includes('admin-build 2026-09-25-aidecreds1b'), 'aidecreds1b build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-aidecreds1b">'), 'aidecreds1b meta');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-25-remiask1'), 'remiask1 is the first admin-build meta');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-payready1d">'), 'payready1d meta stays');
assert.ok(html.indexOf('content="2026-09-25-remisec1"') < html.indexOf('content="2026-09-25-payready1d"'), 'payready1d stays after remisec1');
assert.ok(html.indexOf('content="2026-09-25-payready1"') < html.indexOf('content="2026-09-25-aidecreds1b"'), 'aidecreds1b stays after payready1');
assert.ok(html.includes('data-aidecreds="v=aidecreds1"'), 'aidecreds1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-aidecreds1">'), 'aidecreds1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remidate1">'), 'remidate1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-ncipdf1">'), 'ncipdf1 meta stays');
assert.ok(html.indexOf('content="2026-09-25-aidecreds1b"') < html.indexOf('content="2026-09-25-aidecreds1"'), 'aidecreds1 stays after aidecreds1b');
assert.ok(html.indexOf('content="2026-09-25-aidecreds1"') < html.indexOf('content="2026-09-25-remidate1"'), 'remidate1 stays after aidecreds1');
assert.ok(html.includes('v=remidate1') && html.includes('v=ncipdf1') && html.includes('v=aidecreds1'), 'prior markers stay');

const note = html.slice(html.indexOf('v=aidecreds1b'), html.indexOf('<!-- aide credentials 2026-09-25 v=aidecreds1'));
assert.ok(/Add credential/.test(note), 'note names Add credential');
assert.ok(/admin_upsert_aide_credential/.test(note), 'note keeps the upsert callable');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|auth\.updateUser|rotate password/.test(note), 'aidecreds1b note does not reseal Auth');
assert.ok(html.includes('id="aideCredAide"'), 'add sheet can choose an aide');
assert.ok(html.includes('function aideCredEmptyAddHtml()'), 'empty rollup paints Add');
assert.ok(html.includes('function aideCredAddFromEmpty()'), 'empty Add opens the sheet');
assert.ok(html.includes("sbRestRpc('admin_upsert_aide_credential'"), 'save still uses the Ace upsert');
assert.ok(html.includes('id="copilotFab"') && html.includes('class="remi-chip-pill">Remi</span>'), 'Remi chip stays corner-only');

function loadPuppeteer(){
  try{return require('puppeteer-core');}
  catch(e){
    try{return require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){return null;}
  }
}

function syncRollup(store){
  store.aides.forEach(function(aide){
    const rows = store.creds[aide.aide_id] || [];
    aide.expired_count = rows.filter(function(r){return r.status === 'expired';}).length;
    aide.expiring_soon_count = rows.filter(function(r){return r.status === 'expiring_soon';}).length;
    const cpr = rows.filter(function(r){return r.credential_type === 'cpr';})[0];
    aide.cpr_status = cpr ? cpr.status : '';
  });
  store.attention = store.aides.reduce(function(sum, aide){
    return sum + (aide.expired_count || 0) + (aide.expiring_soon_count || 0);
  }, 0);
}

function statusFor(iso){
  if(iso < '2026-09-25')return 'expired';
  if(iso <= '2026-10-25')return 'expiring_soon';
  return 'ok';
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-aidecreds1b browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : '/usr/local/bin/google-chrome');
  const shotDir = process.env.AIDECREDS_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive: true});
  const roster = [
    {id: 'aide-probe', username: 'qaprobe', full_name: 'Probe QA Test', is_active: true},
    {id: 'aide-cover', username: 'qacover', full_name: 'QA CoverAide', is_active: true}
  ];
  const store = {
    attention: 0,
    aides: [],
    creds: {},
    upserts: [],
    roster: roster
  };
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const file = path.normalize(path.join(__dirname, rel));
    if(!file.startsWith(__dirname)){res.writeHead(403);res.end();return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404);res.end('missing');return;}
      const ext = path.extname(file);
      const type = ext === '.png' ? 'image/png' : 'text/html; charset=utf-8';
      res.writeHead(200, {'Content-Type': type, 'Cache-Control': 'no-store'});
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
  function arm(page){
    page.on('request', function(req){
      const u = req.url();
      if(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare|gstatic\.com/.test(u)){req.abort();return;}
      if(u.indexOf('127.0.0.1') >= 0 || u.indexOf('localhost') >= 0){req.continue();return;}
      const cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': req.headers()['access-control-request-headers'] || 'apikey,authorization,content-type,accept,prefer'
      };
      if(req.method() === 'OPTIONS'){req.respond({status: 204, headers: cors});return;}
      let rpc = '';
      const m = u.match(/\/rpc\/([a-z0-9_]+)/i);
      if(m)rpc = m[1];
      let body = {};
      try{body = JSON.parse(req.postData() || '{}');}catch(e){}
      let payload = {success: true, data: []};
      if(rpc === 'admin_list_aides'){
        payload = {success: true, aides: store.roster};
      }else if(rpc === 'admin_aide_credentials_rollup'){
        payload = {success: true, attention_count: store.attention, aides: store.aides};
      }else if(rpc === 'admin_list_aide_credentials'){
        payload = {success: true, credentials: store.creds[body.p_aide_id] || []};
      }else if(rpc === 'admin_upsert_aide_credential'){
        store.upserts.push(body);
        const rows = store.creds[body.p_aide_id] || [];
        const nextStatus = statusFor(body.p_expiry_date);
        const hit = rows.filter(function(r){return r.id === body.p_id || r.credential_type === body.p_credential_type;})[0];
        if(hit){
          hit.expiry_date = body.p_expiry_date;
          hit.status = nextStatus;
        }else{
          rows.push({
            id: body.p_id || ('new-' + body.p_aide_id + '-' + rows.length),
            credential_type: body.p_credential_type,
            label: body.p_label || '',
            expiry_date: body.p_expiry_date,
            status: nextStatus,
            days_until_expiry: 0
          });
          store.creds[body.p_aide_id] = rows;
        }
        if(!store.aides.some(function(a){return a.aide_id === body.p_aide_id;})){
          const who = store.roster.filter(function(a){return a.id === body.p_aide_id;})[0] || {};
          store.aides.push({
            aide_id: body.p_aide_id,
            name: who.full_name || 'Aide',
            username: who.username || '',
            role: 'Home Health Aide',
            expired_count: 0,
            expiring_soon_count: 0,
            cpr_status: ''
          });
        }
        syncRollup(store);
        payload = {success: true, id: body.p_id || rows[rows.length - 1].id};
      }else if(rpc === 'admin_soft_delete_aide_credential'){
        payload = {success: true};
      }
      req.respond({
        status: 200,
        contentType: 'application/json',
        headers: cors,
        body: JSON.stringify(payload)
      });
    });
  }
  async function openAides(page, width, height){
    await page.setViewport({width: width, height: height, isMobile: width < 900, hasTouch: width < 900, deviceScaleFactor: 2});
    await page.setRequestInterception(true);
    arm(page);
    await page.evaluateOnNewDocument(function(){
      localStorage.setItem('evercare_sb_session', JSON.stringify({
        access_token: 'aidecreds1b-test',
        refresh_token: 'aidecreds1b-refresh',
        profile: {org_id: '4f97f4d3-6635-4544-904c-6b06aa02d40b', role: 'Admin'}
      }));
    });
    await page.goto('http://127.0.0.1:' + port + '/index.html', {waitUntil: 'domcontentloaded', timeout: 20000});
    await page.evaluate(function(){
      currentAdminRole = 'Admin';
      document.getElementById('loginScreen').classList.remove('active');
      document.getElementById('adminScreen').classList.add('active');
      if(typeof layoutA1ApplyRoles === 'function')layoutA1ApplyRoles();
      showTab('aides');
    });
  }
  try{
    const page = await browser.newPage();
    await openAides(page, 390, 844);
    await page.waitForFunction(function(){
      var list = document.getElementById('aideCredList');
      return list && /No credential records yet/.test(list.innerText || '') && /Add credential/.test(list.innerText || '');
    }, {timeout: 8000});
    const empty = await page.evaluate(function(){
      var btn = document.querySelector('#aideCredList [data-aide-cred-add]');
      var box = btn ? btn.getBoundingClientRect() : {width: 0, height: 0, top: 0};
      var style = btn ? getComputedStyle(btn) : {display: 'none'};
      var manage = document.getElementById('aidesContainer');
      var fab = document.getElementById('copilotFab');
      var root = document.getElementById('aideCredsRoot');
      return {
        text: document.getElementById('aideCredList').innerText,
        hidden: root.hidden,
        manageHidden: !manage || getComputedStyle(manage).display === 'none',
        manageText: manage ? manage.innerText : '',
        width: box.width,
        height: box.height,
        top: box.top,
        display: style.display,
        fabVisible: !!(fab && !fab.hidden && getComputedStyle(fab).display !== 'none'),
        build: document.querySelector('meta[name="admin-build"]').content
      };
    });
    assert.strictEqual(empty.hidden, false, 'Admin sees credentials on an empty rollup');
    assert.strictEqual(empty.build, '2026-09-25-remiask1');
    assert.ok(empty.text.includes('No credential records yet'), empty.text);
    assert.ok(empty.text.includes('Add credential'), empty.text);
    assert.ok(empty.text.includes('Probe QA Test') && empty.text.includes('QA CoverAide'), empty.text);
    assert.ok(!/All current|Expiring|CPR soon|overdue/.test(empty.text), empty.text);
    assert.ok(empty.width >= 44 && empty.height >= 44, 'Add is a tappable target ' + empty.width + 'x' + empty.height);
    assert.ok(empty.top >= 0 && empty.top < 700, 'Add is on screen ' + empty.top);
    assert.notStrictEqual(empty.display, 'none');
    assert.strictEqual(empty.manageHidden, true, 'phone credentials view is in front of Manage');
    assert.ok(empty.manageText.includes('Probe QA Test') && empty.manageText.includes('QA CoverAide'), 'Manage list still has the aides');
    assert.strictEqual(empty.fabVisible, true, 'Remi stays the corner chip');
    await page.screenshot({path: path.join(shotDir, 'aidecreds1b-phone-empty-add.png')});

    await page.click('#aideCredList [data-aide-cred-add]');
    await page.waitForSelector('#aideCredSheet:not([hidden])');
    const sheet = await page.evaluate(function(){
      var field = document.getElementById('aideCredAideField');
      var sel = document.getElementById('aideCredAide');
      var names = Array.prototype.map.call(sel.options, function(o){return o.textContent;});
      var sheetEl = document.getElementById('aideCredSheet');
      return {
        title: document.getElementById('aideCredSheetTitle').textContent,
        aideHidden: !field || field.hidden,
        names: names,
        removeHidden: document.getElementById('aideCredRemove').hidden,
        sheetHasRemi: !!(sheetEl && sheetEl.querySelector('.remi-chip-face, .remi-chip-pill'))
      };
    });
    assert.strictEqual(sheet.title, 'Add credential');
    assert.strictEqual(sheet.aideHidden, false, 'empty Add asks which aide');
    assert.ok(sheet.names.indexOf('Probe QA Test') >= 0 && sheet.names.indexOf('QA CoverAide') >= 0, sheet.names.join(','));
    assert.strictEqual(sheet.removeHidden, true);
    assert.strictEqual(sheet.sheetHasRemi, false);
    await page.select('#aideCredAide', 'aide-probe');
    await page.click('#aideCredType', {clickCount: 3});
    await page.type('#aideCredType', 'CPR');
    await page.click('#aideCredExpiry', {clickCount: 3});
    await page.keyboard.press('Backspace');
    await page.type('#aideCredExpiry', '10202026', {delay: 15});
    await page.screenshot({path: path.join(shotDir, 'aidecreds1b-phone-add-sheet.png')});
    await page.click('#aideCredSave');
    await page.waitForFunction(function(){
      var detail = document.getElementById('aideCredDetail');
      var text = detail && !detail.hidden ? detail.innerText : '';
      return /Credentials/.test(text) && /CPR/.test(text) && /10\/20\/2026/.test(text) && /Expiring soon/.test(text);
    }, {timeout: 8000});
    const saved = await page.evaluate(function(){
      var row = document.querySelector('[data-credential-type="cpr"]');
      return {
        text: document.getElementById('aideCredDetail').innerText,
        iso: row ? row.getAttribute('data-expiry') : '',
        sheetHidden: document.getElementById('aideCredSheet').hidden
      };
    });
    assert.ok(saved.text.includes('Credentials'), saved.text);
    assert.ok(saved.text.includes('Expiring soon'), saved.text);
    assert.strictEqual(saved.iso, '2026-10-20');
    assert.strictEqual(saved.sheetHidden, true);
    assert.strictEqual(store.upserts.length, 1);
    assert.strictEqual(store.upserts[0].p_aide_id, 'aide-probe');
    assert.strictEqual(store.upserts[0].p_credential_type, 'cpr');
    assert.strictEqual(store.upserts[0].p_expiry_date, '2026-10-20');
    assert.ok(!('p_id' in store.upserts[0]) && !('p_label' in store.upserts[0]));
    await page.screenshot({path: path.join(shotDir, 'aidecreds1b-phone-card-after-save.png')});

    await page.evaluate(function(){aideCredBack();});
    await page.waitForFunction(function(){
      var banner = document.getElementById('aideCredBanner');
      var list = document.getElementById('aideCredList');
      return banner && !banner.hidden && /1 credential needs attention/.test(banner.textContent || '')
        && list && /CPR soon/.test(list.innerText || '') && /Probe QA Test/.test(list.innerText || '');
    }, {timeout: 8000});
    const roll = await page.evaluate(function(){
      return {
        banner: document.getElementById('aideCredBanner').textContent.replace(/\s+/g, ' ').trim(),
        list: document.getElementById('aideCredList').innerText
      };
    });
    assert.strictEqual(roll.banner, '⚠ 1 credential needs attention');
    assert.ok(roll.list.includes('Probe QA Test') && roll.list.includes('CPR soon'), roll.list);
    assert.ok(roll.list.includes('QA CoverAide'), roll.list);
    assert.ok(!/No credential records yet/.test(roll.list), roll.list);
    await page.screenshot({path: path.join(shotDir, 'aidecreds1b-phone-rollup-after-save.png')});

    await page.click('[data-aide-cred-open="aide-cover"]');
    await page.waitForFunction(function(){
      var text = document.getElementById('aideCredDetail').innerText || '';
      return /No credentials on file for this aide/.test(text) && /Add credential/.test(text) && /Credentials/.test(text);
    }, {timeout: 8000});
    const zero = await page.evaluate(function(){
      var card = document.querySelector('#aideCredDetail .aide-cred-card');
      var btn = card ? card.querySelector('[data-aide-cred-add]') : null;
      var box = btn ? btn.getBoundingClientRect() : {width: 0, height: 0, top: 9999};
      return {
        text: document.getElementById('aideCredDetail').innerText,
        inCard: !!btn,
        width: box.width,
        height: box.height,
        top: box.top
      };
    });
    assert.ok(zero.inCard, 'Add sits on the empty Credentials card');
    assert.ok(zero.text.includes('QA CoverAide'), zero.text);
    assert.ok(!/CPR|Expiring soon|Expired|Current/.test(zero.text), zero.text);
    assert.ok(zero.width >= 44 && zero.height >= 44, 'per-aide Add is tappable');
    assert.ok(zero.top < 844, 'per-aide Add is reachable ' + zero.top);
    await page.screenshot({path: path.join(shotDir, 'aidecreds1b-phone-empty-aide.png')});

    await page.click('#aideCredDetail [data-aide-cred-add]');
    await page.waitForSelector('#aideCredSheet:not([hidden])');
    const detailSheet = await page.evaluate(function(){
      var field = document.getElementById('aideCredAideField');
      return {
        title: document.getElementById('aideCredSheetTitle').textContent,
        aideHidden: !field || field.hidden
      };
    });
    assert.strictEqual(detailSheet.title, 'Add credential');
    assert.strictEqual(detailSheet.aideHidden, true, 'an open aide does not ask again');
    await page.type('#aideCredType', 'TB');
    await page.click('#aideCredExpiry', {clickCount: 3});
    await page.keyboard.press('Backspace');
    await page.type('#aideCredExpiry', '10152026', {delay: 15});
    await page.click('#aideCredSave');
    await page.waitForFunction(function(){
      var text = document.getElementById('aideCredDetail').innerText || '';
      return /TB/.test(text) && /10\/15\/2026/.test(text) && /Expiring soon/.test(text);
    }, {timeout: 8000});
    assert.strictEqual(store.upserts[1].p_aide_id, 'aide-cover');
    assert.strictEqual(store.upserts[1].p_credential_type, 'tb');
    assert.strictEqual(store.upserts[1].p_expiry_date, '2026-10-15');
    await page.evaluate(function(){aideCredBack();});
    await page.waitForFunction(function(){
      var banner = document.getElementById('aideCredBanner');
      var list = document.getElementById('aideCredList').innerText || '';
      return banner && /2 credentials need attention/.test(banner.textContent || '')
        && /QA CoverAide/.test(list) && /Expiring/.test(list) && /CPR soon/.test(list);
    }, {timeout: 8000});

    await page.evaluate(function(){
      currentAdminRole = 'Scheduler';
      aideCredsAfterAides();
    });
    const sched = await page.evaluate(function(){
      var root = document.getElementById('aideCredsRoot');
      return root.hidden === true && getComputedStyle(root).display === 'none';
    });
    assert.strictEqual(sched, true, 'Scheduler does not see the credentials block');

    console.log('admin-aidecreds1b-test: phone ok');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-aidecreds1b-test: rules ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
