#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=aidecreds1c'), 'aidecreds1c marker');
assert.ok(html.includes('data-aidecreds1c="v=aidecreds1c"'), 'aidecreds1c string marker');
assert.ok(html.includes('admin-build 2026-09-25-aidecreds1c'), 'aidecreds1c build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-aidecreds1c">'), 'aidecreds1c meta');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('content="2026-09-25-aidecreds1c"'), 'aidecreds1c is the first admin-build meta');
assert.ok(html.includes('data-aidecreds1b="v=aidecreds1b"'), 'aidecreds1b marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-aidecreds1b">'), 'aidecreds1b meta stays');
assert.ok(html.includes('data-aidecreds="v=aidecreds1"'), 'aidecreds1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-aidecreds1">'), 'aidecreds1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remidate1">'), 'remidate1 meta stays');
assert.ok(html.indexOf('content="2026-09-25-aidecreds1c"') < html.indexOf('content="2026-09-25-aidecreds1b"'), 'aidecreds1b stays after aidecreds1c');
assert.ok(html.indexOf('content="2026-09-25-aidecreds1b"') < html.indexOf('content="2026-09-25-aidecreds1"'), 'aidecreds1 stays after aidecreds1b');
assert.ok(html.indexOf('content="2026-09-25-aidecreds1"') < html.indexOf('content="2026-09-25-remidate1"'), 'remidate1 stays after aidecreds1');
assert.ok(html.includes('v=aidecreds1b') && html.includes('v=aidecreds1') && html.includes('v=remidate1'), 'prior markers stay');

const note = html.slice(html.indexOf('v=aidecreds1c'), html.indexOf('<!-- aide credentials empty add'));
assert.ok(/admin_aide_credentials_rollup/.test(note), 'note names the rollup');
assert.ok(/admin_list_aide_credentials/.test(note), 'note names the per-aide list');
assert.ok(/All current/.test(note), 'note names the All current chip');
assert.ok(/attention_count/.test(note), 'banner follows Ace attention_count');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|auth\.updateUser|rotate password/.test(note), 'aidecreds1c note does not reseal Auth');
assert.ok(html.includes('function aideCredHydrateBare('), 'missing rollup rows are filled in');
assert.ok(html.includes('function aideCredBack()'), 'back still returns to the list');
assert.ok(html.includes("sbRestRpc('admin_aide_credentials_rollup'"), 'rollup still uses the Ace callable');
assert.ok(html.includes("sbRestRpc('admin_upsert_aide_credential'"), 'save still uses the Ace upsert');
assert.ok(html.includes("sbRestRpc('admin_soft_delete_aide_credential'"), 'remove still uses the Ace soft delete');
assert.ok(html.includes('id="copilotFab"') && html.includes('class="remi-chip-pill">Remi</span>'), 'Remi chip stays corner-only');
assert.ok(html.includes('onclick="renderAides(true)"'), 'Aides Refresh still reloads the list');
assert.ok(html.includes('onclick="showAddAideModal()"'), 'Add aide stays');

function loadPuppeteer(){
  try{return require('puppeteer-core');}
  catch(e){
    try{return require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){return null;}
  }
}

function statusFor(iso){
  if(iso < '2026-09-25')return 'expired';
  if(iso <= '2026-10-25')return 'expiring_soon';
  return 'ok';
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

function attentionRows(store, aideId){
  return store.aides.filter(function(a){
    if(aideId && a.aide_id !== aideId)return false;
    if(store.forcePerAideRollup && aideId)return true;
    return (a.expired_count || 0) + (a.expiring_soon_count || 0) > 0;
  });
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-aidecreds1c browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : '/usr/local/bin/google-chrome');
  const shotDir = process.env.AIDECREDS_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive: true});
  const roster = [
    {id: 'aide-probe', username: 'qaprobe', full_name: 'Probe QA Test', is_active: true},
    {id: 'aide-moe', username: 'moe', full_name: 'moe', is_active: true},
    {id: 'aide-cover', username: 'coveraide1', full_name: 'QA CoverAide coveraide1', is_active: true}
  ];
  const store = {
    attention: 2,
    forcePerAideRollup: false,
    aides: [{
      aide_id: 'aide-probe',
      name: 'Probe QA Test',
      username: 'qaprobe',
      role: 'Home Health Aide',
      expired_count: 1,
      expiring_soon_count: 1,
      cpr_status: 'expired'
    }],
    creds: {
      'aide-probe': [
        {id: 'c-hha', credential_type: 'hha', expiry_date: '2026-10-10', status: 'expiring_soon', days_until_expiry: 15},
        {id: 'c-cpr-probe', credential_type: 'cpr', expiry_date: '2026-08-01', status: 'expired', days_until_expiry: -55}
      ]
    },
    upserts: [],
    deletes: [],
    calls: [],
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
      if(rpc)store.calls.push({rpc: rpc, body: body});
      let payload = {success: true, data: []};
      if(rpc === 'admin_list_aides'){
        payload = {success: true, aides: store.roster};
      }else if(rpc === 'admin_aide_credentials_rollup'){
        const rows = attentionRows(store, body.p_aide_id || '');
        payload = {success: true, attention_count: store.attention, aides: rows};
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
            days_until_expiry: 400
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
        store.deletes.push(body);
        Object.keys(store.creds).forEach(function(id){
          store.creds[id] = (store.creds[id] || []).filter(function(r){return r.id !== body.p_id;});
          if(!store.creds[id].length)delete store.creds[id];
        });
        store.aides = store.aides.filter(function(a){return (store.creds[a.aide_id] || []).length;});
        syncRollup(store);
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
  async function openAides(page){
    await page.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await page.setRequestInterception(true);
    arm(page);
    await page.evaluateOnNewDocument(function(){
      localStorage.setItem('evercare_sb_session', JSON.stringify({
        access_token: 'aidecreds1c-test',
        refresh_token: 'aidecreds1c-refresh',
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
  async function waitQuiet(){
    let last = -1;
    let stable = 0;
    for(let i = 0; i < 50; i++){
      await new Promise(function(resolve){setTimeout(resolve, 40);});
      if(store.calls.length === last){
        stable++;
        if(stable >= 4)return;
      }else{
        last = store.calls.length;
        stable = 0;
      }
    }
    throw new Error('credential calls did not settle');
  }
  try{
    const page = await browser.newPage();
    await openAides(page);
    await page.waitForFunction(function(){
      var banner = document.getElementById('aideCredBanner');
      var list = document.getElementById('aideCredList');
      var text = list ? list.innerText : '';
      return banner && !banner.hidden && /2 credentials need attention/.test(banner.textContent || '')
        && /Probe QA Test/.test(text) && /Expiring/.test(text) && /1 overdue/.test(text)
        && /QA CoverAide coveraide1/.test(text) && /moe/.test(text);
    }, {timeout: 8000});
    await waitQuiet();
    const before = await page.evaluate(function(){
      function chips(id){
        var btn = document.querySelector('[data-aide-cred-open="' + id + '"]');
        if(!btn)return '';
        return Array.prototype.map.call(btn.querySelectorAll('.aide-cred-chip'), function(el){return el.textContent.replace(/\s+/g, ' ').trim();}).join('|');
      }
      return {
        banner: document.getElementById('aideCredBanner').textContent.replace(/\s+/g, ' ').trim(),
        build: document.querySelector('meta[name="admin-build"]').content,
        probe: chips('aide-probe'),
        cover: chips('aide-cover'),
        moe: chips('aide-moe'),
        fab: !!document.getElementById('copilotFab')
      };
    });
    assert.strictEqual(before.build, '2026-09-25-aidecreds1c');
    assert.strictEqual(before.banner, '⚠ 2 credentials need attention');
    assert.ok(before.probe.indexOf('Expiring') >= 0 && before.probe.indexOf('1 overdue') >= 0, before.probe);
    assert.strictEqual(before.cover, '', 'empty coveraide1 has no chip yet');
    assert.strictEqual(before.moe, '', 'an aide with no credentials stays blank');
    assert.strictEqual(before.fab, true, 'Remi stays the corner chip');

    await page.click('[data-aide-cred-open="aide-cover"]');
    await page.waitForFunction(function(){
      var text = document.getElementById('aideCredDetail').innerText || '';
      return /No credentials on file for this aide/.test(text) && /Add credential/.test(text);
    }, {timeout: 8000});
    await page.screenshot({path: path.join(shotDir, 'aidecreds1c-phone-empty-aide.png')});
    await page.click('#aideCredDetail [data-aide-cred-add]');
    await page.waitForSelector('#aideCredSheet:not([hidden])');
    await page.type('#aideCredType', 'CPR');
    await page.click('#aideCredExpiry', {clickCount: 3});
    await page.keyboard.press('Backspace');
    await page.type('#aideCredExpiry', '12312027', {delay: 15});
    await page.click('#aideCredSave');
    await page.waitForFunction(function(){
      var text = document.getElementById('aideCredDetail').innerText || '';
      return /CPR/.test(text) && /12\/31\/2027/.test(text) && /Current/.test(text) && !/Expiring soon/.test(text);
    }, {timeout: 8000});
    const saved = await page.evaluate(function(){
      var row = document.querySelector('[data-credential-type="cpr"]');
      return {
        text: document.getElementById('aideCredDetail').innerText,
        iso: row ? row.getAttribute('data-expiry') : ''
      };
    });
    assert.ok(saved.text.includes('12/31/2027'), saved.text);
    assert.ok(!/2027-12-31/.test(saved.text.replace(/data-expiry/g, '')), 'card does not show ISO');
    assert.strictEqual(saved.iso, '2027-12-31');
    assert.strictEqual(store.upserts.length, 1);
    assert.strictEqual(store.upserts[0].p_aide_id, 'aide-cover');
    assert.strictEqual(store.upserts[0].p_credential_type, 'cpr');
    assert.strictEqual(store.upserts[0].p_expiry_date, '2027-12-31');
    assert.strictEqual(store.attention, 2, 'a Current credential does not change Ace attention');
    await page.screenshot({path: path.join(shotDir, 'aidecreds1c-phone-card-current.png')});

    await page.evaluate(function(){aideCredBack();});
    await page.waitForFunction(function(){
      var cover = document.querySelector('[data-aide-cred-open="aide-cover"]');
      var chip = cover ? cover.querySelector('.aide-cred-chip.current') : null;
      var banner = document.getElementById('aideCredBanner');
      return chip && /All current/.test(chip.textContent || '') && banner && /2 credentials need attention/.test(banner.textContent || '');
    }, {timeout: 8000});
    await waitQuiet();
    await page.screenshot({path: path.join(shotDir, 'aidecreds1c-phone-list-after-save.png')});
    const listed = store.calls.filter(function(c){
      return c.rpc === 'admin_list_aide_credentials' && c.body && c.body.p_aide_id === 'aide-cover';
    });
    assert.ok(listed.length >= 1, 'all-current aide is read from the per-aide list when the rollup omits them');
    const perAide = store.calls.filter(function(c){
      return c.rpc === 'admin_aide_credentials_rollup' && c.body && c.body.p_aide_id === 'aide-cover';
    });
    assert.ok(perAide.length >= 1, 'missing aides still ask Ace for a per-aide rollup');

    store.creds['aide-probe'].forEach(function(r){
      if(r.status === 'expired')r.status = 'ok';
    });
    syncRollup(store);
    assert.strictEqual(store.attention, 1, 'Ace attention is now 1 before Refresh');
    const mark = store.calls.length;
    await page.click('button[onclick="renderAides(true)"]');
    await page.waitForFunction(function(){
      var banner = document.getElementById('aideCredBanner');
      var cover = document.querySelector('[data-aide-cred-open="aide-cover"]');
      var probe = document.querySelector('[data-aide-cred-open="aide-probe"]');
      var moe = document.querySelector('[data-aide-cred-open="aide-moe"]');
      var coverChip = cover ? cover.querySelector('.aide-cred-chip.current') : null;
      var probeText = probe ? probe.innerText : '';
      var moeChips = moe ? moe.querySelectorAll('.aide-cred-chip').length : 0;
      return banner && /1 credential needs attention/.test(banner.textContent || '')
        && coverChip && /All current/.test(coverChip.textContent || '')
        && /Expiring/.test(probeText) && !/overdue/.test(probeText)
        && moeChips === 0;
    }, {timeout: 8000});
    await waitQuiet();
    const after = await page.evaluate(function(){
      function chips(id){
        var btn = document.querySelector('[data-aide-cred-open="' + id + '"]');
        if(!btn)return '';
        return Array.prototype.map.call(btn.querySelectorAll('.aide-cred-chip'), function(el){return el.textContent.replace(/\s+/g, ' ').trim();}).join('|');
      }
      return {
        banner: document.getElementById('aideCredBanner').textContent.replace(/\s+/g, ' ').trim(),
        probe: chips('aide-probe'),
        cover: chips('aide-cover'),
        moe: chips('aide-moe'),
        list: document.getElementById('aideCredList').innerText
      };
    });
    assert.strictEqual(after.banner, '⚠ 1 credential needs attention');
    assert.strictEqual(after.cover, '✓ All current', after.cover);
    assert.ok(after.probe.indexOf('Expiring') >= 0 && after.probe.indexOf('overdue') < 0, after.probe);
    assert.strictEqual(after.moe, '');
    assert.ok(after.list.includes('QA CoverAide coveraide1'), after.list);
    const fresh = store.calls.slice(mark);
    assert.ok(fresh.some(function(c){return c.rpc === 'admin_aide_credentials_rollup' && (c.body.p_aide_id == null || c.body.p_aide_id === '');}), 'Refresh re-fetches the null rollup');
    await page.screenshot({path: path.join(shotDir, 'aidecreds1c-phone-list-after-refresh.png')});

    await page.click('[data-aide-cred-open="aide-cover"]');
    await page.waitForFunction(function(){
      return /CPR/.test(document.getElementById('aideCredDetail').innerText || '');
    }, {timeout: 8000});
    await page.click('[data-aide-cred-edit]');
    await page.waitForSelector('#aideCredRemove:not([hidden])');
    await page.click('#aideCredRemove');
    await page.waitForSelector('#nciDiscardGoBtn');
    await page.click('#nciDiscardGoBtn');
    await page.waitForFunction(function(){
      return /No credentials on file for this aide/.test(document.getElementById('aideCredDetail').innerText || '');
    }, {timeout: 8000});
    assert.strictEqual(store.deletes.length, 1);
    await page.evaluate(function(){aideCredBack();});
    await page.waitForFunction(function(){
      var cover = document.querySelector('[data-aide-cred-open="aide-cover"]');
      var banner = document.getElementById('aideCredBanner');
      var chips = cover ? cover.querySelectorAll('.aide-cred-chip').length : 99;
      return cover && chips === 0 && banner && /1 credential needs attention/.test(banner.textContent || '');
    }, {timeout: 8000});
    await waitQuiet();
    const removed = await page.evaluate(function(){
      var cover = document.querySelector('[data-aide-cred-open="aide-cover"]');
      var probe = document.querySelector('[data-aide-cred-open="aide-probe"]');
      return {
        cover: cover ? cover.querySelectorAll('.aide-cred-chip').length : -1,
        probe: probe ? probe.innerText : '',
        banner: document.getElementById('aideCredBanner').textContent.replace(/\s+/g, ' ').trim()
      };
    });
    assert.strictEqual(removed.cover, 0, 'deleting the only credential clears the chip');
    assert.strictEqual(removed.banner, '⚠ 1 credential needs attention');
    assert.ok(/Expiring/.test(removed.probe), removed.probe);

    await page.evaluate(function(){
      currentAdminRole = 'Scheduler';
      aideCredsAfterAides();
    });
    const sched = await page.evaluate(function(){
      var root = document.getElementById('aideCredsRoot');
      return root.hidden === true && getComputedStyle(root).display === 'none';
    });
    assert.strictEqual(sched, true, 'Scheduler does not see the credentials block');

    console.log('admin-aidecreds1c-test: phone ok');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-aidecreds1c-test: rules ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
