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
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-aidecreds1">'), 'aidecreds1 meta stays');
assert.ok(html.indexOf('content="2026-09-25-aidecreds1c"') < html.indexOf('content="2026-09-25-aidecreds1b"'), 'aidecreds1b stays after aidecreds1c');
assert.ok(html.indexOf('content="2026-09-25-aidecreds1b"') < html.indexOf('content="2026-09-25-aidecreds1"'), 'aidecreds1 stays after aidecreds1b');

const note = html.slice(html.indexOf('v=aidecreds1c'), html.indexOf('<!-- aide credentials empty add'));
assert.ok(/All current/.test(note) && /admin_list_aide_credentials/.test(note), 'note names the chip and the per-aide list');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|auth\.updateUser|rotate password/.test(note), 'aidecreds1c note does not reseal Auth');
assert.ok(html.includes('function aideCredFillBareChips('), 'bare aides with rows get chips');
assert.ok(html.includes("sbRestRpc('admin_upsert_aide_credential'"), 'save still uses the Ace upsert');
assert.ok(html.includes('onclick="showAddAideModal()"'), 'Add aide stays');
assert.ok(html.includes('id="copilotFab"') && html.includes('class="remi-chip-pill">Remi</span>'), 'Remi chip stays corner-only');

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
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'});
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
        const rows = store.aides.filter(function(a){
          return (a.expired_count || 0) + (a.expiring_soon_count || 0) > 0;
        });
        payload = {success: true, attention_count: store.attention, aides: rows};
      }else if(rpc === 'admin_list_aide_credentials'){
        payload = {success: true, credentials: (store.creds[body.p_aide_id] || []).slice()};
      }else if(rpc === 'admin_upsert_aide_credential'){
        store.upserts.push(body);
        const rows = store.creds[body.p_aide_id] || [];
        rows.push({
          id: 'new-' + body.p_aide_id,
          credential_type: body.p_credential_type,
          expiry_date: body.p_expiry_date,
          status: statusFor(body.p_expiry_date),
          days_until_expiry: 400
        });
        store.creds[body.p_aide_id] = rows;
        payload = {success: true, id: rows[rows.length - 1].id};
      }
      req.respond({
        status: 200,
        contentType: 'application/json',
        headers: cors,
        body: JSON.stringify(payload)
      });
    });
  }
  try{
    const page = await browser.newPage();
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
    await page.waitForFunction(function(){
      var cover = document.querySelector('[data-aide-cred-open="aide-cover"]');
      var probe = document.querySelector('[data-aide-cred-open="aide-probe"]');
      var banner = document.getElementById('aideCredBanner');
      return cover && probe && banner && /2 credentials need attention/.test(banner.textContent || '')
        && cover.querySelectorAll('.aide-cred-chip').length === 0
        && /1 overdue/.test(probe.innerText || '');
    }, {timeout: 8000});

    await page.click('[data-aide-cred-open="aide-cover"]');
    await page.waitForFunction(function(){
      return /No credentials on file/.test(document.getElementById('aideCredDetail').innerText || '');
    }, {timeout: 8000});
    await page.click('#aideCredDetail [data-aide-cred-add]');
    await page.waitForSelector('#aideCredSheet:not([hidden])');
    await page.type('#aideCredType', 'CPR');
    await page.click('#aideCredExpiry', {clickCount: 3});
    await page.keyboard.press('Backspace');
    await page.type('#aideCredExpiry', '12312027', {delay: 15});
    await page.click('#aideCredSave');
    await page.waitForFunction(function(){
      var text = document.getElementById('aideCredDetail').innerText || '';
      return /CPR/.test(text) && /12\/31\/2027/.test(text) && /Current/.test(text);
    }, {timeout: 8000});
    await page.screenshot({path: path.join(shotDir, 'aidecreds1c-phone-card-current.png')});
    assert.strictEqual(store.upserts.length, 1);
    assert.strictEqual(store.upserts[0].p_expiry_date, '2027-12-31');
    assert.strictEqual(store.upserts[0].p_credential_type, 'cpr');
    assert.strictEqual(store.attention, 2);

    await page.evaluate(function(){aideCredBack();});
    await page.waitForFunction(function(){
      var cover = document.querySelector('[data-aide-cred-open="aide-cover"]');
      var chip = cover && cover.querySelector('.aide-cred-chip.current');
      return chip && /All current/.test(chip.textContent || '');
    }, {timeout: 8000});

    const mark = store.calls.length;
    await page.click('button[onclick="renderAides(true)"]');
    let sawRollup = false;
    for(let i = 0; i < 40; i++){
      await new Promise(function(resolve){setTimeout(resolve, 50);});
      sawRollup = store.calls.slice(mark).some(function(c){
        return c.rpc === 'admin_aide_credentials_rollup' && (c.body.p_aide_id == null || c.body.p_aide_id === '');
      });
      if(sawRollup)break;
    }
    assert.ok(sawRollup, 'Refresh re-fetches the rollup');
    await page.waitForFunction(function(){
      var cover = document.querySelector('[data-aide-cred-open="aide-cover"]');
      var probe = document.querySelector('[data-aide-cred-open="aide-probe"]');
      var moe = document.querySelector('[data-aide-cred-open="aide-moe"]');
      var banner = document.getElementById('aideCredBanner');
      var chip = cover && cover.querySelector('.aide-cred-chip.current');
      return chip && /All current/.test(chip.textContent || '')
        && banner && /2 credentials need attention/.test(banner.textContent || '')
        && probe && /Expiring/.test(probe.innerText || '') && /1 overdue/.test(probe.innerText || '')
        && moe && moe.querySelectorAll('.aide-cred-chip').length === 0;
    }, {timeout: 8000});
    const after = await page.evaluate(function(){
      function chips(id){
        var btn = document.querySelector('[data-aide-cred-open="' + id + '"]');
        return btn ? Array.prototype.map.call(btn.querySelectorAll('.aide-cred-chip'), function(el){
          return el.textContent.replace(/\s+/g, ' ').trim();
        }).join('|') : '';
      }
      return {
        banner: document.getElementById('aideCredBanner').textContent.replace(/\s+/g, ' ').trim(),
        cover: chips('aide-cover'),
        probe: chips('aide-probe'),
        moe: chips('aide-moe'),
        build: document.querySelector('meta[name="admin-build"]').content
      };
    });
    assert.strictEqual(after.build, '2026-09-25-aidecreds1c');
    assert.strictEqual(after.banner, '⚠ 2 credentials need attention');
    assert.strictEqual(after.cover, '✓ All current', after.cover);
    assert.ok(after.probe.indexOf('Expiring') >= 0 && after.probe.indexOf('1 overdue') >= 0, after.probe);
    assert.strictEqual(after.moe, '');
    assert.strictEqual(store.creds['aide-probe'].length, 2, 'Probe credential rows stay');
    assert.strictEqual(store.creds['aide-cover'].length, 1, 'CoverAide CPR row stays');
    assert.strictEqual(store.creds['aide-cover'][0].expiry_date, '2027-12-31');
    await page.screenshot({path: path.join(shotDir, 'aidecreds1c-phone-list-after-refresh.png')});

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
