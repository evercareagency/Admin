#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const sw = fs.existsSync(path.join(__dirname, 'sw.js')) ? fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8') : '';
const appsHost = 'script.' + 'google.com';

assert.ok(!html.includes('SHEETS_URL'), 'SHEETS_URL is gone');
assert.ok(!html.includes(appsHost), 'index has no apps-script host');
assert.ok(!sw.includes(appsHost), 'service worker has no apps-script host');
assert.ok(!fs.existsSync(path.join(__dirname, 'exec')), 'exec beacon file is gone');
assert.ok(html.includes("sbRestRpc('log_office_activity'"), 'activity write uses the office RPC');
assert.ok(html.includes("sbRestRpc('list_office_activity'"), 'activity read uses the office RPC');
assert.ok(!html.includes('if(!nurseSheets){'), 'nurse sheets bypass is gone');
assert.ok(!/function archiveNewClientIntakePdf|apiPost\(\{action:'archive_new_client_intake_pdf'/.test(html), 'drive archive is gone');
assert.ok(!/body:JSON\.stringify\(\{action:'(log_activity|get_activity_log|send_is_reminder)'/.test(html), 'those actions are not posted to a web app');

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

const sigs = [
  'function evercareSbEnabled()',
  'function readSbSession()',
  'function writeSbSession(sess)',
  'function clearSbSession()',
  'function sbAuthErrorMessage(data,status)',
  'function sbAsJsonObject(v)',
  'function sbRpcNode(data)',
  'function sbRpcError(node)',
  'async function sbRestMutate(method, table, pairs, body, prefer, refreshed, signal)',
  'async function sbRestRpc(fnName, body, signal)',
  'async function apiPost(payload)',
  'async function logActivity(action)',
  'async function renderActivityLog()',
  'async function sendISReminder(rowIndexOrUsername,name)'
];
const fns = sigs.map(function(sig){
  const fn = extractFn(html, sig);
  assert.ok(fn, 'missing ' + sig);
  assert.ok(!fn.includes(appsHost), sig + ' has no apps-script host');
  return fn;
}).join('\n');

const urlConst = (html.match(/const SUPABASE_URL='([^']+)'/) || [])[1];
const keyConst = (html.match(/const SUPABASE_ANON_KEY='([^']+)'/) || [])[1];

function harness(mode){
  const calls = [];
  const toasts = [];
  const tbody = {innerHTML: ''};
  const note = {textContent: ''};
  const empty = {
    style: {display: 'none'},
    querySelector: function(){return note;}
  };
  const box = {
    SUPABASE_URL: urlConst,
    SUPABASE_ANON_KEY: keyConst,
    SB_SESSION_KEY: 'evercare_sb_session',
    currentAdminRole: 'Admin',
    location: {search: ''},
    localStorage: {
      getItem: function(){return JSON.stringify({access_token: 'office-jwt', refresh_token: 'r', profile: {org_id: 'org-1'}});},
      setItem: function(){},
      removeItem: function(){}
    },
    window: {},
    document: {getElementById: function(id){
      if(id === 'activityLogBody')return tbody;
      if(id === 'activityLogEmpty')return empty;
      return null;
    }},
    formatDateTimeLabel: function(v){return String(v || '');},
    formatAdminDateCopy: function(v){return String(v || '');},
    showTempMsg: function(msg, color){toasts.push({msg: msg, color: color});},
    AbortController: AbortController,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    fetch: function(url, init){
      const u = String(url);
      calls.push({url: u, init: init || {}});
      if(u.indexOf(appsHost) >= 0){
        const err = new Error('apps host blocked');
        err.name = 'AppsHostBlocked';
        return Promise.reject(err);
      }
      const status = mode === 'redirect' ? 302 : 401;
      const raw = '<html><body>Sign in</body></html>';
      return Promise.resolve({
        ok: false,
        status: status,
        text: function(){return Promise.resolve(raw);},
        json: function(){return Promise.reject(new Error('not json'));}
      });
    },
    JSON: JSON,
    String: String,
    Promise: Promise,
    encodeURIComponent: encodeURIComponent,
    Object: Object,
    Array: Array,
    Date: Date
  };
  vm.createContext(box);
  vm.runInContext(fns, box);
  return {box: box, calls: calls, toasts: toasts, tbody: tbody, empty: empty};
}

(async function(){
  for(const mode of ['html401', 'redirect']){
    const h = harness(mode);
    await h.box.renderActivityLog();
    assert.ok(h.calls.length >= 1, mode + ' still asks the activity RPC');
    assert.ok(h.calls[0].url.indexOf('/rpc/list_office_activity') > 0, h.calls[0].url);
    assert.deepStrictEqual(JSON.parse(h.calls[0].init.body), {p_limit: 200});
    assert.ok(h.calls.every(function(c){return c.url.indexOf(appsHost) < 0;}), mode + ' does not call the apps host');
    assert.strictEqual(h.tbody.innerHTML, '', mode + ' clears the loading row');
    assert.strictEqual(h.empty.style.display, 'block', mode + ' shows the empty state');
  }

  for(const role of ['Admin', 'Scheduler', 'Nurse']){
    const h = harness('html401');
    h.box.currentAdminRole = role;
    h.calls.length = 0;
    const closed = await h.box.apiPost({action: 'send_is_reminder', id: '1'});
    assert.strictEqual(closed.success, false, role);
    assert.strictEqual(closed.error, 'Not available on this desk.', role);
    assert.strictEqual(h.calls.length, 0, role + ' reminder makes no network call');
    await h.box.sendISReminder('1');
    assert.strictEqual(h.toasts[0].msg, "Reminders aren't available yet.");
    assert.strictEqual(h.calls.length, 0, role + ' reminder button makes no network call');
    const log = await h.box.apiPost({action: 'log_activity', activity: 'Opened ' + role});
    assert.strictEqual(log.success, false);
    assert.strictEqual(h.calls.length, 0, role + ' legacy activity action makes no network call');
    const listed = await h.box.apiPost({action: 'get_activity_log'});
    assert.strictEqual(listed.success, false);
    assert.strictEqual(listed.error, 'Not available on this desk.');
  }

  console.log('admin-exec-off1-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
