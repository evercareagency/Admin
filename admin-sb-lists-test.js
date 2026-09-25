#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const anonFile = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYWxrcHR3Z2lmbmtia3VhdnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMDExMTAsImV4cCI6MjEwNTc3NzExMH0.b-3Pdb_oVR3L6JM0yd_aQcqtQH8exGV7OPwdtx0b3Xg';

function extractFn(src, sig){
  const start = src.indexOf(sig);
  if(start < 0)return '';
  let i = src.indexOf('{', start);
  let depth = 0;
  for(; i < src.length; i++){
    if(src[i] === '{')depth++;
    else if(src[i] === '}'){
      depth--;
      if(depth === 0)return src.slice(start, i + 1);
    }
  }
  return '';
}

assert.ok(!/service_role/i.test(html), 'service_role must not be embedded');
assert.ok(!html.includes('resolve_username_email'), 'lists must not call the aides rpc');
assert.ok(html.includes(anonFile), 'anon key stays the embedded jwt');
const warm = extractFn(html, 'function warmUpSheets()');
assert.ok(warm && !/supabase/i.test(warm), 'warm path must not touch supabase');

const aideSelect = (html.match(/var SB_AIDE_SELECT='([^']+)'/) || [])[1];
const clientSelect = (html.match(/var SB_CLIENT_SELECT='([^']+)'/) || [])[1];
assert.ok(aideSelect.indexOf('assignments:assignments(id,is_active,client:clients(id,name,legacy_id,is_active))') > 0, aideSelect);
assert.ok(clientSelect.indexOf('assignments:assignments(id,is_active,aide:aides(id,username,full_name))') > 0, clientSelect);

const apiPost = extractFn(html, 'async function apiPost(payload)');
assert.ok(apiPost.indexOf('evercareSbEnabled()') < apiPost.indexOf('SHEETS_URL'), 'flag check precedes the sheets post');
assert.ok(apiPost.includes("action:'admin_login'") === false);
assert.ok(apiPost.includes('sbApiList(payload)'), 'list actions delegate to supabase');
assert.ok(apiPost.includes("fetch(SHEETS_URL"), 'flag off still posts to sheets');

const fns = [
  'function evercareSbEnabled()',
  'function readSbSession()',
  'function writeSbSession(sess)',
  'function clearSbSession()',
  'function sbAuthErrorMessage(data,status)',
  'function sbInvalidateListCaches()',
  'function sbIsListAction(action)',
  'function sbFilterQuery(pairs)',
  'function sbActiveLinks(rows)',
  'function sbMapAide(row)',
  'function sbMapClient(row)',
  'function sbMapTimesheet(row)',
  'function sbTimesheetDesk(view)',
  'function sbTimesheetListPairs(view)',
  'function sbTimesheetOnDesk(row, view)',
  'async function sbRefreshSession(sess)',
  'async function sbRestGet(table, pairs, refreshed)',
  'async function sbApiList(payload)',
  'function _cacheKey(action)',
  'function cacheGet(action)',
  'function cacheSet(action,v)',
  'function cacheInvalidate(action)',
  'async function apiGetCached(action,extra,force)',
  apiPost
].map(function(sig){
  if(sig.indexOf('async function apiPost') === 0 || sig.indexOf('if(') === 0)return sig;
  const fn = extractFn(html, sig);
  assert.ok(fn, 'missing ' + sig);
  return fn;
}).join('\n');

const urlConst = (html.match(/const SUPABASE_URL='([^']+)'/) || [])[1];
const keyConst = (html.match(/const SUPABASE_ANON_KEY='([^']+)'/) || [])[1];
const sheetsUrl = (html.match(/const SHEETS_URL='([^']+)'/) || [])[1];

function harness(opts){
  const calls = [];
  const mem = Object.assign({}, opts.storage || {});
  const queue = (opts.responses || []).slice();
  const box = {
    SUPABASE_URL: urlConst,
    SUPABASE_ANON_KEY: keyConst,
    SHEETS_URL: sheetsUrl,
    GAS_HEADERS: {'Content-Type':'text/plain;charset=utf-8'},
    SB_SESSION_KEY: 'evercare_sb_session',
    SB_AIDE_SELECT: aideSelect,
    SB_CLIENT_SELECT: clientSelect,
    CACHE_TTL_MS: 5 * 60 * 1000,
    _memCache: {},
    _inflight: {},
    location: {search: opts.search || ''},
    localStorage: {
      getItem: function(k){return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;},
      setItem: function(k, v){mem[k] = String(v);},
      removeItem: function(k){delete mem[k];}
    },
    sessionStorage: {
      getItem: function(){return null;},
      setItem: function(){},
      removeItem: function(){}
    },
    window: opts.window || {},
    fetch: function(url, init){
      calls.push({url: url, init: init || {}});
      const next = queue.length ? queue.shift() : null;
      if(next && next.reject)return Promise.reject(next.reject);
      const res = next || {ok:true, status:200, raw:'[]'};
      return Promise.resolve({
        ok: res.ok !== false && (res.status || 200) < 400,
        status: res.status || 200,
        text: function(){return Promise.resolve(res.raw == null ? '' : res.raw);},
        json: function(){return Promise.resolve(JSON.parse(res.raw || '{}'));}
      });
    },
    JSON: JSON,
    String: String,
    Promise: Promise,
    Date: Date,
    encodeURIComponent: encodeURIComponent,
    Object: Object,
    Array: Array
  };
  if(opts.session){
    mem.evercare_sb_session = JSON.stringify(opts.session);
    box.window.__sbSession = opts.session;
  }
  vm.createContext(box);
  vm.runInContext(fns, box);
  return {box: box, calls: calls, mem: mem};
}

const session = {
  access_token: 'user-jwt',
  refresh_token: 'refresh-1',
  user: {id: 'admin-uid', email: 'admin@roles.evercare.local'},
  email: 'admin@roles.evercare.local',
  profile: {id: 'admin-uid', org_id: 'org-1', role: 'admin'}
};

const aideRow = {
  id: 'aide-1',
  username: 'jdoe',
  full_name: 'Jane Doe',
  email: 'jdoe@users.evercare.local',
  joined_at: '2026-01-02T00:00:00.000Z',
  location_status: 'unknown',
  last_seen_at: null,
  must_change_password: true,
  is_active: true,
  profile_id: 'p1',
  legacy_sheet_row: 4,
  assignments: [
    {id: 'as-1', is_active: true, client: {id: 'c-1', name: 'Ann Client', legacy_id: '100', is_active: true}},
    {id: 'as-2', is_active: false, client: {id: 'c-2', name: 'Hidden Client', legacy_id: '101', is_active: true}},
    {id: 'as-3', is_active: true, client: {id: 'c-3', name: 'Gone Client', legacy_id: '102', is_active: false}}
  ]
};
const clientRow = {
  id: 'c-1',
  legacy_id: '100',
  name: 'Ann Client',
  address: '123 Main',
  lat: 41.48,
  lng: -81.7,
  is_active: true,
  assignments: [
    {id: 'as-1', is_active: true, aide: {id: 'aide-1', username: 'jdoe', full_name: 'Jane Doe'}},
    {id: 'as-9', is_active: false, aide: {id: 'aide-9', username: 'old', full_name: 'Old Aide'}}
  ]
};
const timesheetRow = {
  id: 'ts-1',
  emp_name: 'Jane Doe',
  username: 'jdoe',
  client_id: 'c-1',
  client_name: 'Ann Client',
  svc_type: 'PC',
  week_start: '2026-09-14',
  total_hours: '8:00',
  notes: 'ok',
  days: {'0': {date: '2026-09-14', tin: '08:00', tout: '16:00', hrs: '8:00'}},
  status: 'submitted',
  submitted_at: '2026-09-20T15:00:00.000Z',
  pdf_link: '',
  is_active: true,
  correction_note: ''
};

function params(url){
  return new URL(url).searchParams;
}

const off = harness({search: '?sheets=1', responses: [
  {status: 200, raw: JSON.stringify({success: true, data: []})}
]});
const on = harness({search: '?sb=1', session: session, responses: [
  {status: 200, raw: JSON.stringify([aideRow])},
  {status: 200, raw: JSON.stringify([clientRow])},
  {status: 200, raw: JSON.stringify([timesheetRow, {id: 'ts-b', emp_name: 'Skip', status: 'backup', is_active: true, submitted_at: '2026-09-21T00:00:00.000Z'}, {id: 'ts-d', emp_name: 'Drafty', status: 'draft', is_active: true}])},
  {status: 200, raw: JSON.stringify([clientRow, {id: 'c-off', name: 'Inactive', is_active: false, assignments: []}])}
]});
const bare = harness({search: '?sb=1'});
const other = harness({search: '?sb=1', session: session, responses: [
  {status: 200, raw: JSON.stringify({success: true, data: []})}
]});
const refreshed = harness({search: '?sb=1', session: session, responses: [
  {status: 401, raw: JSON.stringify({message: 'JWT expired'})},
  {status: 200, raw: JSON.stringify({access_token: 'user-jwt-2', refresh_token: 'refresh-2', expires_in: 3600, expires_at: 1999999999, token_type: 'bearer', user: {id: 'admin-uid', email: 'admin@roles.evercare.local'}})},
  {status: 200, raw: JSON.stringify([aideRow])}
]});
const down = harness({search: '?sb=1', session: session, responses: [{reject: new Error('offline')}]});

Promise.all([
  off.box.apiPost({action: 'get_users'}),
  bare.box.apiPost({action: 'get_all'}),
  other.box.apiPost({action: 'get_supervisory_compliance'}),
  refreshed.box.apiPost({action: 'get_users'}),
  down.box.apiPost({action: 'get_clients'})
]).then(function(parallel){
  return on.box.sbApiList({action: 'get_users'}).then(function(aides){
    return on.box.sbApiList({action: 'get_clients'}).then(function(clients){
      return on.box.sbApiList({action: 'get_all'}).then(function(timesheets){
        return on.box.sbApiList({action: 'get_clients', includeInactive: true}).then(function(allClients){
          return parallel.concat([aides, clients, timesheets, allClients]);
        });
      });
    });
  });
}).then(function(results){
  const sheetsUsers = results[0];
  const noSession = results[1];
  const compliance = results[2];
  const afterRefresh = results[3];
  const offline = results[4];
  const aides = results[5];
  const clients = results[6];
  const timesheets = results[7];
  const allClients = results[8];
  assert.strictEqual(off.calls.length, 1, 'flag off makes one sheets call');
  assert.strictEqual(off.calls[0].url, sheetsUrl);
  assert.deepStrictEqual(JSON.parse(off.calls[0].init.body), {action: 'get_users'});
  assert.strictEqual(sheetsUsers.success, true);

  assert.strictEqual(aides.success, true);
  assert.strictEqual(aides.data.length, 1);
  assert.strictEqual(aides.data[0].username, 'jdoe');
  assert.strictEqual(aides.data[0].name, 'Jane Doe');
  assert.strictEqual(aides.data[0].fullName, 'Jane Doe');
  assert.strictEqual(aides.data[0].mustChangePassword, true);
  assert.deepStrictEqual(aides.data[0].clientIds, ['c-1']);
  assert.strictEqual(aides.data[0].assignedClients[0].name, 'Ann Client');
  const aideUrl = on.calls[0].url;
  assert.ok(aideUrl.indexOf('/rest/v1/aides?') > 0, aideUrl);
  assert.strictEqual(params(aideUrl).get('select'), aideSelect);
  assert.strictEqual(params(aideUrl).get('is_active'), 'eq.true');
  assert.strictEqual(params(aideUrl).get('order'), 'full_name.asc');
  assert.strictEqual(on.calls[0].init.method, 'GET');
  assert.strictEqual(on.calls[0].init.headers.apikey, keyConst);
  assert.strictEqual(on.calls[0].init.headers.Authorization, 'Bearer user-jwt');
  assert.notStrictEqual(on.calls[0].init.headers.Authorization, 'Bearer ' + keyConst);
  assert.ok(!on.calls.some(function(c){return c.url === sheetsUrl;}), 'flag on lists must not hit sheets');

  assert.strictEqual(clients.data[0].name, 'Ann Client');
  assert.strictEqual(clients.data[0].address, '123 Main');
  assert.strictEqual(clients.data[0].lat, 41.48);
  assert.deepStrictEqual(clients.data[0].assignedAides, ['jdoe']);
  const clientUrl = on.calls[1].url;
  assert.ok(clientUrl.indexOf('/rest/v1/clients?') > 0);
  assert.strictEqual(params(clientUrl).get('select'), clientSelect);
  assert.strictEqual(params(clientUrl).get('is_active'), 'eq.true');
  assert.strictEqual(params(clientUrl).get('order'), 'name.asc');

  assert.strictEqual(timesheets.data.length, 1, 'backup and draft stay out of payroll');
  assert.strictEqual(timesheets.data[0].empName, 'Jane Doe');
  assert.strictEqual(timesheets.data[0].submitted, '2026-09-20T15:00:00.000Z');
  assert.strictEqual(timesheets.data[0].totalHrs, '8:00');
  assert.strictEqual(timesheets.data[0].weekStart, '2026-09-14');
  assert.strictEqual(timesheets.data[0].status, 'submitted');
  assert.strictEqual(timesheets.data[0].days['0'].tin, '08:00');
  const tsUrl = on.calls[2].url;
  assert.ok(tsUrl.indexOf('/rest/v1/timesheets?') > 0, tsUrl);
  assert.strictEqual(params(tsUrl).get('select'), '*');
  assert.strictEqual(params(tsUrl).get('is_active'), 'eq.true');
  assert.strictEqual(params(tsUrl).get('deleted_at'), 'is.null');
  assert.deepStrictEqual(params(tsUrl).getAll('status').sort(), ['not.ilike.backup', 'not.ilike.draft']);
  assert.strictEqual(params(tsUrl).get('order'), 'submitted_at.desc');
  assert.strictEqual(on.calls[2].init.headers.Authorization, 'Bearer user-jwt');

  assert.strictEqual(allClients.data.length, 2);
  const inactiveUrl = on.calls[3].url;
  assert.strictEqual(params(inactiveUrl).get('is_active'), null, 'includeInactive skips the active filter');

  assert.strictEqual(noSession.success, false);
  assert.strictEqual(noSession.error, 'Not signed in');
  assert.strictEqual(bare.calls.length, 0, 'missing jwt must not fall through to sheets');

  assert.strictEqual(compliance.success, true);
  assert.strictEqual(other.calls.length, 1);
  assert.strictEqual(other.calls[0].url, sheetsUrl);
  assert.deepStrictEqual(JSON.parse(other.calls[0].init.body), {action: 'get_supervisory_compliance'});

  assert.strictEqual(afterRefresh.success, true);
  assert.strictEqual(afterRefresh.data[0].username, 'jdoe');
  assert.ok(refreshed.calls[1].url.indexOf('/auth/v1/token?grant_type=refresh_token') > 0);
  assert.deepStrictEqual(JSON.parse(refreshed.calls[1].init.body), {refresh_token: 'refresh-1'});
  assert.strictEqual(refreshed.calls[1].init.headers.Authorization, 'Bearer ' + keyConst);
  assert.strictEqual(refreshed.calls[2].init.headers.Authorization, 'Bearer user-jwt-2');
  assert.strictEqual(JSON.parse(refreshed.mem.evercare_sb_session).access_token, 'user-jwt-2');
  assert.strictEqual(JSON.parse(refreshed.mem.evercare_sb_session).profile.org_id, 'org-1');

  assert.strictEqual(offline.success, false);
  assert.strictEqual(offline.error, 'offline');

  const cached = harness({search: '?sb=1', session: session, responses: [
    {status: 200, raw: JSON.stringify([aideRow])}
  ]});
  cached.box.cacheSet('get_users', {success: true, data: [{username: 'from-sheets', name: 'Sheets'}]});
  return cached.box.apiGetCached('get_users').then(function(first){
    assert.strictEqual(first.source, 'supabase');
    assert.strictEqual(first.data[0].username, 'jdoe');
    assert.strictEqual(cached.calls.length, 1, 'sheets cache must not satisfy a flag-on list');
    return cached.box.apiGetCached('get_users').then(function(second){
      assert.strictEqual(second.data[0].username, 'jdoe');
      assert.strictEqual(cached.calls.length, 1, 'supabase cache is reused');
      const sheetsCached = harness({search: '?sheets=1', responses: [
        {status: 200, raw: JSON.stringify({success: true, data: [{username: 'sheet-user'}]})}
      ]});
      sheetsCached.box.cacheSet('get_users', {success: true, source: 'supabase', data: [{username: 'sb-user'}]});
      return sheetsCached.box.apiGetCached('get_users');
    });
  }).then(function(sheetsFresh){
    assert.strictEqual(sheetsFresh.data[0].username, 'sheet-user');
    console.log('admin-sb-lists-test: ok');
    return runBrowser();
  });
}).catch(function(err){
  console.error(err);
  process.exit(1);
});

async function runBrowser(){
  if(process.env.SKIP_BROWSER === '1')return;
  let puppeteer;
  try{puppeteer = require('puppeteer-core');}
  catch(e){
    try{puppeteer = require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){
      console.log('admin-sb-lists browser skipped (no puppeteer-core)');
      return;
    }
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const root = path.join(__dirname);
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const file = path.normalize(path.join(root, urlPath === '/' ? 'index.html' : urlPath));
    if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404);res.end('missing');return;}
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'});
      res.end(buf);
    });
  });
  await new Promise(function(r){server.listen(0, '127.0.0.1', r);});
  const port = server.address().port;
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({width: 1280, height: 900});
  const admin = JSON.stringify({role: 'Admin', username: 'Office Admin', name: 'Office Admin', loginAt: Date.now()});
  const sb = JSON.stringify(session);
  await page.evaluateOnNewDocument(function(adminRaw, sbRaw){
    localStorage.setItem('admin_session', adminRaw);
    localStorage.setItem('evercare_sb_session', sbRaw);
  }, admin, sb);
  const hits = [];
  await page.setRequestInterception(true);
  page.on('request', function(req){
    const u = req.url();
    if(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare|gstatic\.com/.test(u)){req.abort();return;}
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'apikey, authorization, content-type, accept',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };
    if(/supabase\.co|script\.google\.com/.test(u)){
      if(req.method() === 'OPTIONS'){req.respond({status: 204, headers: cors, body: ''});return;}
      let action = '';
      try{action = JSON.parse(req.postData() || '{}').action || '';}catch(e){}
      hits.push({url: u, method: req.method(), action: action, headers: req.headers()});
      let body = JSON.stringify({success: true, data: []});
      if(/\/rest\/v1\/aides/.test(u))body = JSON.stringify([aideRow]);
      else if(/\/rest\/v1\/clients/.test(u))body = JSON.stringify([clientRow]);
      else if(/\/rest\/v1\/timesheets/.test(u))body = JSON.stringify([timesheetRow, {id: 'ts-b', emp_name: 'Should Not Show', status: 'backup', is_active: true, submitted_at: '2026-09-21T00:00:00.000Z'}]);
      req.respond({status: 200, contentType: 'application/json', headers: cors, body: body});
      return;
    }
    req.continue();
  });
  try{
    await page.goto('http://127.0.0.1:' + port + '/index.html?v=sbcut1', {waitUntil: 'domcontentloaded', timeout: 20000});
    await page.waitForFunction(function(){
      return document.getElementById('adminScreen').classList.contains('active') &&
        document.getElementById('tsBody') &&
        document.getElementById('tsBody').textContent.indexOf('Jane Doe') >= 0;
    }, {timeout: 8000});
    const timesheetsShot = path.join('/opt/cursor/artifacts', 'sb_lists_timesheets.png');
    await page.screenshot({path: timesheetsShot});
    const tsText = await page.$eval('#tsBody', function(el){return el.textContent;});
    assert.ok(tsText.indexOf('Jane Doe') >= 0, tsText);
    assert.ok(tsText.indexOf('Ann Client') >= 0, tsText);
    assert.ok(tsText.indexOf('Should Not Show') < 0, tsText);
    await page.click('#nav_aides');
    await page.waitForFunction(function(){
      const el = document.getElementById('aidesContainer');
      return el && el.textContent.indexOf('jdoe') >= 0 && el.textContent.indexOf('Ann Client') >= 0;
    }, {timeout: 8000});
    const aidesText = await page.$eval('#aidesContainer', function(el){return el.textContent;});
    assert.ok(aidesText.indexOf('Jane Doe') >= 0);
    assert.ok(aidesText.indexOf('Still on temp password') >= 0, aidesText);
    assert.ok(aidesText.indexOf('Hidden Client') < 0, aidesText);
    await page.screenshot({path: path.join('/opt/cursor/artifacts', 'sb_lists_aides.png')});
    await page.click('#nav_more');
    await page.click('#nav_clients');
    await page.waitForFunction(function(){
      const el = document.getElementById('clientsContainer');
      return el && el.textContent.indexOf('Ann Client') >= 0 && el.textContent.indexOf('1 aide assigned') >= 0;
    }, {timeout: 8000});
    const clientsText = await page.$eval('#clientsContainer', function(el){return el.textContent;});
    assert.ok(clientsText.indexOf('123 Main') >= 0, clientsText);
    await page.screenshot({path: path.join('/opt/cursor/artifacts', 'sb_lists_clients.png')});
    const listHits = hits.filter(function(h){return /\/rest\/v1\/(aides|clients|timesheets)/.test(h.url);});
    assert.strictEqual(listHits.length, 3, JSON.stringify(listHits.map(function(h){return h.url;})));
    listHits.forEach(function(h){
      assert.strictEqual(h.headers.authorization, 'Bearer user-jwt');
      assert.strictEqual(h.headers.apikey, keyConst);
    });
    assert.ok(listHits.some(function(h){return /\/aides\?/.test(h.url) && h.url.indexOf('is_active') > 0;}));
    assert.ok(listHits.some(function(h){return /\/timesheets\?/.test(h.url) && h.url.indexOf('not.ilike.backup') > 0 && h.url.indexOf('not.ilike.draft') > 0;}));
    assert.ok(!hits.some(function(h){return h.action === 'get_users' || h.action === 'get_clients' || h.action === 'get_all';}), 'flag on must not post those list actions to sheets');
    console.log('admin-sb-lists browser: ok');
  }finally{
    await browser.close();
    await new Promise(function(r){server.close(r);});
  }
}
