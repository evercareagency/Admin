#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function extractFn(src, sig){
  const start = src.indexOf(sig);
  assert.ok(start >= 0, 'missing ' + sig);
  let i = src.indexOf('{', start);
  let depth = 0;
  for(; i < src.length; i++){
    if(src[i] === '{')depth++;
    else if(src[i] === '}'){
      depth--;
      if(depth === 0)return src.slice(start, i + 1);
    }
  }
  assert.fail('unclosed ' + sig);
}

assert.ok(html.includes('v=aidecreds1'), 'aidecreds1 marker');
assert.ok(html.includes('data-aidecreds="v=aidecreds1"'), 'aidecreds1 string marker');
assert.ok(html.includes('GHOST-AIDECREDS1-CONTRACT-v1'), 'contract id');
assert.ok(html.includes('admin-build 2026-09-25-aidecreds1'), 'aidecreds1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-aidecreds1">'), 'aidecreds1 meta');
assert.ok(html.includes('<!-- aide credentials 2026-09-25 v=aidecreds1 admin-build 2026-09-25-aidecreds1'), 'aidecreds1 comment');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-25-payready1c'), 'payready1c is the first admin-build meta');
assert.ok(html.indexOf('content="2026-09-25-payready1"') < html.indexOf('content="2026-09-25-aidecreds1"'), 'aidecreds1 stays after payready1');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remidate1">'), 'remidate1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-ncipdf1">'), 'ncipdf1 meta stays');
assert.ok(html.indexOf('content="2026-09-25-aidecreds1"') < html.indexOf('content="2026-09-25-remidate1"'), 'remidate1 stays after aidecreds1');
assert.ok(html.indexOf('content="2026-09-25-remidate1"') < html.indexOf('content="2026-09-25-ncipdf1"'), 'ncipdf1 stays after remidate1');
assert.ok(html.includes('v=remidate1') && html.includes('v=ncipdf1'), 'prior markers stay');

const note = html.slice(html.indexOf('v=aidecreds1'), html.indexOf('<!-- admin us dates'));
assert.ok(/Admin only/.test(note), 'credentials are Admin only');
assert.ok(/admin_list_aide_credentials/.test(note) && /admin_upsert_aide_credential/.test(note) && /admin_soft_delete_aide_credential/.test(note) && /admin_aide_credentials_rollup/.test(note), 'note names the four Ace callables');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|auth\.updateUser|rotate password/.test(note), 'aidecreds1 note does not reseal Auth');
assert.ok(!html.includes('Maya Brooks') && !html.includes('function payReadyNameList'), 'product HTML does not bake a pay-readiness mock roster');

const sheet = html.slice(html.indexOf('id="aideCredSheet"'), html.indexOf('id="tab_broadcast"'));
assert.ok(sheet.includes('>Cancel<') && sheet.includes('>Save<'), 'sheet has Cancel and Save');
assert.ok(sheet.includes('placeholder="MM/DD/YYYY"'), 'expiry field is MM/DD/YYYY');
assert.ok(sheet.includes('Status preview'), 'status preview label');
assert.ok(!/type="date"/.test(sheet), 'expiry is not a native date input');
assert.ok(!/copilotFab|remi-chip/.test(sheet), 'Remi chip stays out of the credential sheet');
assert.ok(html.includes('id="copilotFab"') && html.includes('class="remi-chip-pill">Remi</span>'), 'Remi chip stays corner-only');

const saveSrc = extractFn(html, 'async function aideCredSave()');
const upsertSrc = extractFn(html, 'async function sbAdminUpsertAideCredential(fields)');
const listSrc = extractFn(html, 'async function sbAdminListAideCredentials(aideId)');
const rollSrc = extractFn(html, 'async function sbAdminAideCredentialsRollup(aideId)');
const delSrc = extractFn(html, 'async function sbAdminSoftDeleteAideCredential(id)');
assert.ok(saveSrc.includes('sbAdminUpsertAideCredential'), 'Save hits upsert');
assert.ok(!/localStorage|aideCredDemo|demoRoster/.test(saveSrc + upsertSrc), 'Save is not a demo-only write');
assert.ok(!/sbRestMutate\(\s*'POST'\s*,\s*'aide_credentials'/.test(saveSrc + upsertSrc + listSrc + rollSrc + delSrc), 'no direct table INSERT');
assert.ok(upsertSrc.includes("sbRestRpc('admin_upsert_aide_credential'"), 'upsert uses sbRestRpc');
assert.ok(upsertSrc.includes('p_aide_id') && upsertSrc.includes('p_credential_type') && upsertSrc.includes('p_expiry_date') && upsertSrc.includes('p_label') && upsertSrc.includes('p_notes') && upsertSrc.includes('p_id'), 'upsert body matches the callable');
assert.ok(listSrc.includes("sbRestRpc('admin_list_aide_credentials', {p_aide_id:id})"), 'card list is admin_list_aide_credentials');
assert.ok(rollSrc.includes("sbRestRpc('admin_aide_credentials_rollup'"), 'banner and chips load from rollup');
assert.ok(delSrc.includes("sbRestRpc('admin_soft_delete_aide_credential', {p_id:credId})"), 'remove is soft delete by id');

const names = [
  'function escapeHtml(str)',
  'function escapeAttr(str)',
  'function formatAdminDate(val)',
  'function aideCredsIsAdmin()',
  'function aideCredTodayIso(now)',
  'function aideCredIsoUtc(iso)',
  'function aideCredPreviewStatus(iso, todayIso)',
  'function aideCredStatusCopy(status)',
  'function aideCredTypeKey(text)',
  'function aideCredTypeLabel(type, label)',
  'function aideCredMdyToIso(text)',
  'function aideCredWhenLine(status, iso)',
  'function aideCredCount(v)',
  'function aideCredNormalizeChip(chip)',
  'function aideCredChipKind(label)',
  'function aideCredChipsFromRollup(row)',
  'function aideCredBannerText(n)',
  'function aideCredRpcNode(got)',
  'function aideCredRpcFailed(got)',
  'function aideCredMapCredential(row)',
  'function aideCredMapList(data)',
  'function aideCredMapRollup(data)',
  'function aideCredRowHtml(cred)',
  'async function sbAdminListAideCredentials(aideId)',
  'async function sbAdminUpsertAideCredential(fields)',
  'async function sbAdminSoftDeleteAideCredential(id)',
  'async function sbAdminAideCredentialsRollup(aideId)'
];
const src = names.map(function(sig){return extractFn(html, sig);}).join('\n');
const calls = [];
const box = {
  currentAdminRole: 'Admin',
  sbRestRpc: async function(name, body){
    calls.push({name: name, body: JSON.parse(JSON.stringify(body))});
    if(box.mode === 'fail')return {ok: false, status: 404, error: 'Could not find the function'};
    if(name === 'admin_list_aide_credentials'){
      return {ok: true, data: {success: true, credentials: [
        {id: 'c-cpr', credential_type: 'cpr', expiry_date: '2026-08-01', status: 'expired', days_until_expiry: -55}
      ]}};
    }
    if(name === 'admin_aide_credentials_rollup'){
      return {ok: true, data: {success: true, attention_count: 3, aides: [
        {aide_id: 'a-maya', name: 'Maya Brooks', expired_count: 1, expiring_soon_count: 1, cpr_status: 'expired'}
      ]}};
    }
    return {ok: true, data: {success: true, id: 'c-cpr'}};
  },
  mode: 'ok'
};
vm.createContext(box);
vm.runInContext(src, box);

assert.strictEqual(box.aideCredsIsAdmin(), true);
box.currentAdminRole = 'Scheduler';
assert.strictEqual(box.aideCredsIsAdmin(), false, 'Scheduler does not get credentials');
box.currentAdminRole = 'Admin';

assert.strictEqual(box.aideCredStatusCopy('expired'), 'Expired');
assert.strictEqual(box.aideCredStatusCopy('expiring_soon'), 'Expiring soon');
assert.strictEqual(box.aideCredStatusCopy('ok'), 'Current');
assert.strictEqual(box.aideCredTypeKey("Driver\u2019s license"), 'drivers_license');
assert.strictEqual(box.aideCredTypeKey('CPR'), 'cpr');
assert.strictEqual(box.aideCredTypeKey('Food handler'), 'custom');
assert.strictEqual(box.aideCredTypeLabel('drivers_license', ''), 'Driver\u2019s license');
assert.strictEqual(box.aideCredTypeLabel('hha', ''), 'HHA');
assert.strictEqual(box.aideCredTypeLabel('tb', ''), 'TB');
assert.strictEqual(box.aideCredTypeLabel('custom', 'Food handler'), 'Food handler');

const today = '2026-09-25';
assert.strictEqual(box.aideCredPreviewStatus('2026-08-01', today), 'expired');
assert.strictEqual(box.aideCredPreviewStatus('2026-09-25', today), 'expiring_soon');
assert.strictEqual(box.aideCredPreviewStatus('2026-10-03', today), 'expiring_soon');
assert.strictEqual(box.aideCredPreviewStatus('2026-10-25', today), 'expiring_soon');
assert.strictEqual(box.aideCredPreviewStatus('2026-10-26', today), 'ok');
assert.strictEqual(box.aideCredPreviewStatus('2027-03-12', today), 'ok');
assert.strictEqual(box.aideCredMdyToIso('10/03/2026'), '2026-10-03');
assert.strictEqual(box.aideCredMdyToIso('09/25/2027'), '2027-09-25');
assert.strictEqual(box.aideCredMdyToIso('2026-10-03'), '');
assert.strictEqual(box.formatAdminDate('2026-10-03'), '10/03/2026');
assert.strictEqual(box.aideCredWhenLine('expiring_soon', '2026-10-03'), 'expires 10/03/2026');
assert.strictEqual(box.aideCredWhenLine('expired', '2026-08-01'), 'expired 08/01/2026');
assert.strictEqual(box.aideCredBannerText(3), '3 credentials need attention');
assert.strictEqual(box.aideCredBannerText(1), '1 credential needs attention');
assert.strictEqual(box.aideCredBannerText(0), '');

function chipLabels(row){
  return box.aideCredChipsFromRollup(row).map(function(c){return c.label;}).join('|');
}
assert.strictEqual(chipLabels({expired_count: 1, expiring_soon_count: 1, cpr_status: 'expired'}), 'Expiring|1 overdue');
assert.strictEqual(chipLabels({expired_count: 0, expiring_soon_count: 1, cpr_status: 'expiring_soon'}), 'CPR soon');
assert.strictEqual(chipLabels({expired_count: 0, expiring_soon_count: 0, cpr_status: 'ok'}), 'All current');
assert.strictEqual(chipLabels({chips: ['All current']}), 'All current', 'rollup chips win when Ace sends them');

const roll = box.aideCredMapRollup({success: true, attention_count: 3, aides: [
  {aide_id: 'a-maya', name: 'Maya Brooks', expired_count: 1, expiring_soon_count: 1, cpr_status: 'expired'}
]});
assert.strictEqual(roll.attention, 3);
assert.strictEqual(roll.aides[0].id, 'a-maya');
assert.strictEqual(roll.aides[0].name, 'Maya Brooks');

const rowHtml = box.aideCredRowHtml({id: 'c-dl', type: 'drivers_license', expiry: '2026-10-03', status: 'expiring_soon'});
assert.ok(rowHtml.includes('Driver\u2019s license'), rowHtml);
assert.ok(rowHtml.includes('expires 10/03/2026'), rowHtml);
assert.ok(rowHtml.includes('Expiring soon'), rowHtml);
assert.ok(rowHtml.includes('data-expiry="2026-10-03"'), 'ISO stays on the data attribute');
assert.ok(!/>[^<]*\d{4}-\d{2}-\d{2}/.test(rowHtml.replace(/data-expiry="[^"]*"/g, '').replace(/data-credential-type="[^"]*"/g, '')), 'visible row is not YYYY-MM-DD');
const expiredRow = box.aideCredRowHtml({id: 'c-cpr', type: 'cpr', expiry: '2026-08-01', status: 'expired'});
assert.ok(expiredRow.includes('expired 08/01/2026') && expiredRow.includes('>Expired<'), expiredRow);

const cred = box.aideCredMapCredential({id: 'c-cpr', credential_type: 'cpr', expiry_date: '2026-08-01', status: 'expired', days_until_expiry: -55});
assert.strictEqual(cred.type, 'cpr');
assert.strictEqual(cred.expiry, '2026-08-01');
assert.strictEqual(cred.status, 'expired');
assert.strictEqual(cred.days, -55);

(async function(){
  const listed = await box.sbAdminListAideCredentials('a-maya');
  assert.strictEqual(listed.success, true);
  assert.strictEqual(listed.credentials[0].status, 'expired');
  assert.strictEqual(calls[0].name, 'admin_list_aide_credentials');
  assert.deepStrictEqual(calls[0].body, {p_aide_id: 'a-maya'});

  const saved = await box.sbAdminUpsertAideCredential({
    aideId: 'a-maya',
    type: 'cpr',
    expiry: '2027-09-25',
    id: 'c-cpr'
  });
  assert.strictEqual(saved.success, true);
  assert.strictEqual(calls[1].name, 'admin_upsert_aide_credential');
  assert.deepStrictEqual(calls[1].body, {
    p_aide_id: 'a-maya',
    p_credential_type: 'cpr',
    p_expiry_date: '2027-09-25',
    p_id: 'c-cpr'
  });
  assert.ok(!('p_label' in calls[1].body), 'known types omit p_label');

  const custom = await box.sbAdminUpsertAideCredential({
    aideId: 'a-maya',
    type: 'custom',
    expiry: '2027-01-20',
    label: 'Food handler'
  });
  assert.strictEqual(custom.success, true);
  assert.strictEqual(calls[2].body.p_credential_type, 'custom');
  assert.strictEqual(calls[2].body.p_label, 'Food handler');
  assert.ok(!('p_id' in calls[2].body), 'add omits p_id');

  const rolled = await box.sbAdminAideCredentialsRollup(null);
  assert.strictEqual(rolled.success, true);
  assert.strictEqual(rolled.attention, 3);
  assert.deepStrictEqual(calls[3].body, {p_aide_id: null});

  const removed = await box.sbAdminSoftDeleteAideCredential('c-cpr');
  assert.strictEqual(removed.success, true);
  assert.deepStrictEqual(calls[4].body, {p_id: 'c-cpr'});

  box.mode = 'fail';
  const missed = await box.sbAdminUpsertAideCredential({aideId: 'a-maya', type: 'cpr', expiry: '2027-09-25', id: 'c-cpr'});
  assert.strictEqual(missed.success, false);
  assert.ok(/Could not find the function/.test(missed.error));
  console.log('admin-aidecreds1-test: rules ok');
})().then(function(){
  return runBrowser();
}).catch(function(err){
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
    console.log('admin-aidecreds1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.AIDECREDS_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive: true});
  const store = {
    attention: 3,
    aides: [
      {aide_id: 'a-maya', name: 'Maya Brooks', username: 'mbrooks', role: 'Home Health Aide', expired_count: 1, expiring_soon_count: 1, cpr_status: 'expired'},
      {aide_id: 'a-jordan', name: 'Jordan Lee', username: 'jlee', role: 'Home Health Aide', expired_count: 0, expiring_soon_count: 1, cpr_status: 'expiring_soon'},
      {aide_id: 'a-sam', name: 'Sam Rivera', username: 'srivera', role: 'Home Health Aide', expired_count: 0, expiring_soon_count: 0, cpr_status: 'ok'},
      {aide_id: 'a-alex', name: 'Alex Nguyen', username: 'anguyen', role: 'Home Health Aide', expired_count: 0, expiring_soon_count: 0, cpr_status: 'ok'}
    ],
    creds: {
      'a-maya': [
        {id: 'c-dl', credential_type: 'drivers_license', expiry_date: '2026-10-03', status: 'expiring_soon', days_until_expiry: 8},
        {id: 'c-hha', credential_type: 'hha', expiry_date: '2027-03-12', status: 'ok', days_until_expiry: 168},
        {id: 'c-cpr', credential_type: 'cpr', expiry_date: '2026-08-01', status: 'expired', days_until_expiry: -55},
        {id: 'c-tb', credential_type: 'tb', expiry_date: '2027-01-20', status: 'ok', days_until_expiry: 117}
      ],
      'a-jordan': [
        {id: 'j-cpr', credential_type: 'cpr', expiry_date: '2026-10-20', status: 'expiring_soon', days_until_expiry: 25}
      ]
    },
    upserts: []
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
  try{
    const page = await browser.newPage();
    await page.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await page.evaluateOnNewDocument(function(){
      localStorage.setItem('evercare_sb_session', JSON.stringify({
        access_token: 'aidecreds-test',
        refresh_token: 'aidecreds-refresh',
        profile: {org_id: '4f97f4d3-6635-4544-904c-6b06aa02d40b', role: 'Admin'}
      }));
    });
    await page.setRequestInterception(true);
    page.on('request', function(req){
      const u = req.url();
      if(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare|gstatic\.com/.test(u)){req.abort();return;}
      if(u.indexOf('127.0.0.1') >= 0 || u.indexOf('localhost') >= 0){req.continue();return;}
      const cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': req.headers()['access-control-request-headers'] || 'apikey,authorization,content-type,accept,prefer'
      };
      if(req.method() === 'OPTIONS'){
        req.respond({status: 204, headers: cors});
        return;
      }
      let rpc = '';
      const m = u.match(/\/rpc\/([a-z0-9_]+)/i);
      if(m)rpc = m[1];
      let body = {};
      try{body = JSON.parse(req.postData() || '{}');}catch(e){}
      let payload = {success: true, data: []};
      if(rpc === 'admin_aide_credentials_rollup'){
        payload = {success: true, attention_count: store.attention, aides: store.aides};
      }else if(rpc === 'admin_list_aide_credentials'){
        payload = {success: true, credentials: store.creds[body.p_aide_id] || []};
      }else if(rpc === 'admin_upsert_aide_credential'){
        store.upserts.push(body);
        const rows = store.creds[body.p_aide_id] || [];
        const hit = rows.filter(function(r){return r.id === body.p_id || r.credential_type === body.p_credential_type;})[0];
        const nextStatus = body.p_expiry_date < '2026-09-25' ? 'expired' : (body.p_expiry_date <= '2026-10-25' ? 'expiring_soon' : 'ok');
        if(hit){
          hit.expiry_date = body.p_expiry_date;
          hit.status = nextStatus;
        }else{
          rows.push({id: body.p_id || ('new-' + rows.length), credential_type: body.p_credential_type, label: body.p_label || '', expiry_date: body.p_expiry_date, status: nextStatus, days_until_expiry: 0});
          store.creds[body.p_aide_id] = rows;
        }
        const maya = store.aides[0];
        const mayaRows = store.creds['a-maya'] || [];
        maya.expired_count = mayaRows.filter(function(r){return r.status === 'expired';}).length;
        maya.expiring_soon_count = mayaRows.filter(function(r){return r.status === 'expiring_soon';}).length;
        const cpr = mayaRows.filter(function(r){return r.credential_type === 'cpr';})[0];
        maya.cpr_status = cpr ? cpr.status : 'ok';
        store.attention = store.aides.reduce(function(sum, a){
          return sum + (a.expired_count || 0) + (a.expiring_soon_count || 0);
        }, 0);
        payload = {success: true, id: body.p_id || 'c-cpr'};
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
    await page.goto('http://127.0.0.1:' + port + '/index.html', {waitUntil: 'domcontentloaded', timeout: 20000});
    await page.evaluate(function(){
      currentAdminRole = 'Admin';
      document.getElementById('loginScreen').classList.remove('active');
      document.getElementById('adminScreen').classList.add('active');
      if(typeof layoutA1ApplyRoles === 'function')layoutA1ApplyRoles();
      showTab('aides');
    });
    await page.waitForFunction(function(){
      return /3 credentials need attention/.test(document.getElementById('aideCredBanner') && document.getElementById('aideCredBanner').textContent || '');
    }, {timeout: 8000});
    const list = await page.evaluate(function(){
      var root = document.getElementById('aideCredsRoot');
      var fab = document.getElementById('copilotFab');
      var sheet = document.getElementById('aideCredSheet');
      var text = document.getElementById('aideCredList').innerText;
      return {
        hidden: root.hidden,
        banner: document.getElementById('aideCredBanner').textContent.replace(/\s+/g, ' ').trim(),
        text: text,
        sheetHasRemi: !!(sheet && sheet.querySelector('.remi-chip-face, .remi-chip-pill')),
        fabInSheet: !!(sheet && fab && sheet.contains(fab)),
        fabVisible: !!(fab && !fab.hidden && getComputedStyle(fab).display !== 'none'),
        aidesTab: document.getElementById('nav_aides').classList.contains('active')
      };
    });
    assert.strictEqual(list.hidden, false, 'Admin sees the credentials list');
    assert.strictEqual(list.banner, '⚠ 3 credentials need attention');
    assert.ok(list.text.includes('Maya Brooks') && list.text.includes('Expiring') && list.text.includes('1 overdue'), list.text);
    assert.ok(list.text.includes('Jordan Lee') && list.text.includes('CPR soon'), list.text);
    assert.ok(list.text.includes('Sam Rivera') && list.text.includes('All current'), list.text);
    assert.ok(list.text.includes('Alex Nguyen') && list.text.includes('All current'), list.text);
    assert.strictEqual(list.sheetHasRemi, false);
    assert.strictEqual(list.fabInSheet, false);
    assert.strictEqual(list.fabVisible, true, 'Remi chip stays on the corner');
    assert.strictEqual(list.aidesTab, true, 'Aides tab is the active phone tab');
    await page.screenshot({path: path.join(shotDir, 'aidecreds1-phone-list.png')});

    await page.click('[data-aide-cred-open="a-maya"]');
    await page.waitForFunction(function(){
      return /Driver.s license/.test(document.getElementById('aideCredDetail').innerText || '') && /10\/03\/2026/.test(document.getElementById('aideCredDetail').innerText || '');
    }, {timeout: 8000});
    const card = await page.evaluate(function(){
      var text = document.getElementById('aideCredDetail').innerText;
      return {text: text, isoVisible: /\d{4}-\d{2}-\d{2}/.test(text)};
    });
    assert.ok(card.text.includes('Credentials'), card.text);
    assert.ok(card.text.includes('10/03/2026') && card.text.includes('Expiring soon'), card.text);
    assert.ok(card.text.includes('03/12/2027') && card.text.includes('Current'), card.text);
    assert.ok(card.text.includes('08/01/2026') && card.text.includes('Expired'), card.text);
    assert.ok(card.text.includes('01/20/2027'), card.text);
    assert.ok(card.text.includes('Add credential'), card.text);
    assert.strictEqual(card.isoVisible, false, 'detail dates are MM/DD/YYYY');
    await page.screenshot({path: path.join(shotDir, 'aidecreds1-phone-card.png')});

    await page.click('[data-aide-cred-edit="c-cpr"]');
    await page.waitForSelector('#aideCredSheet:not([hidden])');
    await page.click('#aideCredExpiry', {clickCount: 3});
    await page.keyboard.press('Backspace');
    await page.type('#aideCredExpiry', '09252027', {delay: 15});
    const preview = await page.evaluate(function(){
      return {
        title: document.getElementById('aideCredSheetTitle').textContent,
        expiry: document.getElementById('aideCredExpiry').value,
        preview: document.getElementById('aideCredPreview').innerText.replace(/\s+/g, ' ').trim(),
        type: document.getElementById('aideCredType').value
      };
    });
    assert.strictEqual(preview.title, 'Edit credential');
    assert.strictEqual(preview.type, 'CPR');
    assert.strictEqual(preview.expiry, '09/25/2027');
    assert.ok(preview.preview.includes('Expired') && preview.preview.includes('Current'), preview.preview);
    await page.screenshot({path: path.join(shotDir, 'aidecreds1-phone-edit.png')});

    await page.click('#aideCredSave');
    await page.waitForFunction(function(){
      var sheet = document.getElementById('aideCredSheet');
      var text = document.getElementById('aideCredDetail').innerText || '';
      return sheet.hidden && /09\/25\/2027/.test(text) && /Current/.test(text);
    }, {timeout: 8000});
    const flipped = await page.evaluate(function(){
      var text = document.getElementById('aideCredDetail').innerText;
      var cpr = '';
      document.querySelectorAll('.aide-cred-row').forEach(function(row){
        if((row.getAttribute('data-credential-type') || '') === 'cpr')cpr = row.innerText;
      });
      return {cpr: cpr, iso: document.querySelector('[data-credential-type="cpr"]').getAttribute('data-expiry')};
    });
    assert.ok(/Current/.test(flipped.cpr) && /09\/25\/2027/.test(flipped.cpr), flipped.cpr);
    assert.ok(!/Expired/.test(flipped.cpr), flipped.cpr);
    assert.strictEqual(flipped.iso, '2027-09-25');
    assert.strictEqual(store.upserts.length, 1);
    assert.strictEqual(store.upserts[0].p_credential_type, 'cpr');
    assert.strictEqual(store.upserts[0].p_expiry_date, '2027-09-25');
    assert.strictEqual(store.upserts[0].p_aide_id, 'a-maya');
    assert.strictEqual(store.upserts[0].p_id, 'c-cpr');
    await page.screenshot({path: path.join(shotDir, 'aidecreds1-phone-saved.png')});
    await page.evaluate(function(){aideCredBack();});
    await page.waitForFunction(function(){
      return /Maya Brooks/.test(document.getElementById('aideCredList').innerText || '');
    }, {timeout: 8000});
    const after = await page.evaluate(function(){
      return {
        banner: document.getElementById('aideCredBanner').textContent.replace(/\s+/g, ' ').trim(),
        list: document.getElementById('aideCredList').innerText
      };
    });
    assert.strictEqual(after.banner, '⚠ 2 credentials need attention');
    assert.ok(after.list.includes('Maya Brooks') && after.list.includes('Expiring'), after.list);
    assert.ok(!/1 overdue/.test(after.list), after.list);

    await page.evaluate(function(){
      currentAdminRole = 'Scheduler';
      aideCredsAfterAides();
    });
    const sched = await page.evaluate(function(){
      return document.getElementById('aideCredsRoot').hidden === true;
    });
    assert.strictEqual(sched, true, 'Scheduler does not see the credentials block');

    const desk = await browser.newPage();
    await desk.setViewport({width: 1280, height: 800});
    await desk.evaluateOnNewDocument(function(){
      localStorage.setItem('evercare_sb_session', JSON.stringify({
        access_token: 'aidecreds-test',
        refresh_token: 'aidecreds-refresh',
        profile: {org_id: '4f97f4d3-6635-4544-904c-6b06aa02d40b', role: 'Admin'}
      }));
    });
    await desk.setRequestInterception(true);
    desk.on('request', function(req){
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
      const payload = rpc === 'admin_aide_credentials_rollup'
        ? {success: true, attention_count: store.attention, aides: store.aides}
        : {success: true, data: []};
      req.respond({status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(payload)});
    });
    await desk.goto('http://127.0.0.1:' + port + '/index.html', {waitUntil: 'domcontentloaded', timeout: 20000});
    await desk.evaluate(function(){
      currentAdminRole = 'Admin';
      document.getElementById('loginScreen').classList.remove('active');
      document.getElementById('adminScreen').classList.add('active');
      if(typeof layoutA1ApplyRoles === 'function')layoutA1ApplyRoles();
      showTab('aides');
    });
    await desk.waitForFunction(function(){
      return /credential/.test((document.getElementById('aideCredBanner') && document.getElementById('aideCredBanner').textContent) || '');
    }, {timeout: 8000});
    const deskBox = await desk.evaluate(function(){
      var root = document.getElementById('aideCredsRoot');
      var box = root.getBoundingClientRect();
      var manage = document.getElementById('aidesContainer');
      var shown = manage && getComputedStyle(manage).display !== 'none';
      return {width: box.width, manage: shown};
    });
    assert.ok(deskBox.width > 280 && deskBox.width < 700, 'desktop credentials column stays readable ' + deskBox.width);
    assert.strictEqual(deskBox.manage, true, 'desktop still shows aide management');
    await desk.screenshot({path: path.join(shotDir, 'aidecreds1-desktop-list.png')});
    console.log('admin-aidecreds1-test: phone ok');
  }finally{
    await browser.close();
    server.close();
  }
}
