#!/usr/bin/env node
'use strict';
require('./test-block-apps-script.js');

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildFile = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/^\s+|\s+$/g, '');

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

assert.strictEqual(buildFile, '2026-09-29-pages-cache-fresh1', 'admin-build.txt sticky tip stays');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build meta stays');
assert.ok(!/location\.(replace|href)\s*=[^;\n]*\?v=nurse-activity-sb1/.test(html), 'home screen URL is not rewritten to a sticky ?v=');

assert.ok(html.includes('v=nurse-activity-sb1'), 'sb1 tip marker');
assert.ok(html.includes('?v=nurse-activity-sb1b'), 'cache query marker');
assert.ok(html.includes('GHOST-NURSE-ACTIVITY-SB-CONTRACT-v1'), 'contract marker');
assert.ok(html.includes("var NURSE_ACTIVITY_SB1='v=nurse-activity-sb1'"), 'sb1 constant');
assert.ok(html.includes("var NURSE_ACTIVITY_SB1_MARKER='v=nurse-activity-sb1'"), 'sb1 script marker');
assert.ok(html.includes("var NURSE_ACTIVITY_SB1B_MARKER='v=nurse-activity-sb1b'"), 'sb1b script marker');
assert.ok(html.includes('data-nurse-activity-sb1="v=nurse-activity-sb1"'), 'sb1 feed marker');
assert.ok(html.includes('data-nurse-activity-sb1b="v=nurse-activity-sb1b"'), 'sb1b feed marker');
assert.ok(html.includes('id="adminNurseAlertsList"'), 'activity feed container stays');

const dispatch = extractFn(html, 'async function sbNurseActivityDispatch(payload, signal)');
const gate = extractFn(html, 'function sbIsNurseActivityAction(action)');
const alertGate = extractFn(html, 'function sbIsNurseAlertRpcAction(action)');
const load = extractFn(html, 'async function loadNurseActivityFeed()');
assert.ok(dispatch.includes("sbRestRpc('list_nurse_activity', {p_limit:50}, signal)"), 'default RPC body is p_limit 50 plus the abort signal');
assert.ok(!dispatch.includes('p_include_archived'), 'default dispatch omits p_include_archived');
assert.ok(!dispatch.includes('includeArchived'), 'default dispatch does not forward includeArchived');
assert.ok(!dispatch.includes('SHEETS_URL') && !dispatch.includes('apiPost'), 'activity dispatch does not call Sheets');
assert.ok(gate.includes("action==='list_nurse_activity'"), 'activity action gate');
assert.ok(!alertGate.includes('list_nurse_activity'), 'activity stays off the alerts gate');
assert.ok(load.includes("apiPost({action:'list_nurse_activity',limit:50})"), 'UI call stays limit 50 and does not pass includeArchived');
assert.ok(!load.includes('includeArchived'), 'UI call does not pass includeArchived');
assert.ok(load.includes('paintNurseActivityEmpty(false)') && load.includes('paintNurseActivityEmpty(true)'), 'empty and failed cut results paint an empty state');
assert.ok(load.indexOf('deriveNurseActivityFromLists()') > load.lastIndexOf('if(cut)'), 'derived fallback is only reached when the cut is off');

const apiPostSrc = extractFn(html, 'async function apiPost(payload)');
assert.ok(apiPostSrc.includes('sbNurseActivityDispatch(payload, nurseActivitySignal)'), 'activity dispatch keeps the nursespd2 abort signal');
assert.ok(apiPostSrc.includes('nurseSheetsSignal()'), 'activity still reads the shared abort signal');

const urlConst = (html.match(/const SUPABASE_URL='([^']+)'/) || [])[1];
const keyConst = (html.match(/const SUPABASE_ANON_KEY='([^']+)'/) || [])[1];
const sheetsUrl = (html.match(/const SHEETS_URL='([^']+)'/) || [])[1];
const sigs = [
  'function evercareSbEnabled()',
  'function readSbSession()',
  'function sbAuthErrorMessage(data,status)',
  'function sbFilterQuery(pairs)',
  'function sbAsJsonObject(v)',
  'function sbRpcNode(data)',
  'function sbRpcError(node)',
  'async function sbRestMutate(method, table, pairs, body, prefer, refreshed, signal)',
  'async function sbRestRpc(fnName, body, signal)',
  'function sbIsNurseActivityAction(action)',
  'function sbNurseAlertItems(node)',
  'async function sbNurseActivityDispatch(payload, signal)',
  'function escapeHtml(str)',
  'function escapeAttr(str)',
  'function nurseListRows(data,keys)',
  'function paintNurseActivityEmpty(failed)',
  'function appendNurseActivityFeed(items)',
  'function focusNurseAlertItem(type,refId)',
  'function cancelNurseSheetsFetches()',
  'function nurseSheetsSignal()',
  'async function loadNurseActivityFeed()',
  'async function apiPost(payload)'
];
const fns = sigs.map(function(sig){
  const fn = extractFn(html, sig);
  assert.ok(fn, 'missing ' + sig);
  return fn;
}).join('\n');

const calls = [];
let rpcMode = 'empty';
const session = {
  access_token: 'office-jwt',
  refresh_token: 'refresh-1',
  user: {id: 'admin-uid'},
  profile: {id: 'admin-uid', org_id: '4f97f4d3-6635-4544-904c-6b06aa02d40b', role: 'admin'}
};
const mem = {evercare_sb_session: JSON.stringify(session)};
const box = {id: 'adminNurseAlertsList', innerHTML: ''};
const sandbox = {
  SUPABASE_URL: urlConst,
  SUPABASE_ANON_KEY: keyConst,
  SHEETS_URL: sheetsUrl,
  GAS_HEADERS: {'Content-Type':'text/plain;charset=utf-8'},
  SB_SESSION_KEY: 'evercare_sb_session',
  location: {search: ''},
  currentAdminRole: 'Admin',
  adminNurseAlerts: [],
  nurseSheetsGen: 0,
  nurseSheetsAbort: null,
  deriveCalls: 0,
  localStorage: {
    getItem: function(k){return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;},
    setItem: function(k, v){mem[k] = String(v);},
    removeItem: function(k){delete mem[k];}
  },
  document: {getElementById: function(id){return id === 'adminNurseAlertsList' ? box : null;}},
  window: {__sbSession: session},
  fetch: function(url, init){
    calls.push({url: String(url), init: init || {}});
    const signal = init && init.signal;
    if(rpcMode === 'abort'){
      return new Promise(function(resolve, reject){
        const finish = function(){
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        };
        if(signal){
          if(signal.aborted)return finish();
          signal.addEventListener('abort', finish);
        }
      });
    }
    const status = rpcMode === 'forbidden' ? 403 : (rpcMode === 'auth' ? 401 : 200);
    let payload;
    if(rpcMode === 'items'){
      payload = {success:true, items:[{
        type:'visit', refId:'1789621589936', clientName:'Probe URL Test', nurseUsername:'Nurse',
        contactType:'PhoneCall', visitDate:'09/17/2026', pdfLink:'', pdfFileId:'',
        createdAt:'9/17/2026, 1:06:29 AM', updatedAt:'9/21/2026, 10:21:35 AM'
      }]};
    }else if(rpcMode === 'sheets-empty'){
      payload = {success:true, items:[]};
    }else if(status === 200){
      payload = {success:true, items:[]};
    }else{
      payload = {message:'forbidden: office only', code:'42501'};
    }
    return Promise.resolve({
      ok: status === 200,
      status: status,
      text: async function(){return JSON.stringify(payload);}
    });
  },
  AbortController: AbortController,
  JSON: JSON,
  String: String,
  Promise: Promise,
  Date: Date,
  encodeURIComponent: encodeURIComponent,
  Object: Object,
  Array: Array,
  Number: Number,
  isNaN: isNaN,
  sbRefreshSession: async function(){return null;}
};
vm.createContext(sandbox);
vm.runInContext(
  'function formatDateTimeLabel(v){return String(v==null?"":v);}\n' +
  'function deriveNurseActivityFromLists(){deriveCalls++;return [{type:"intake",refId:"archived-1",clientName:"Archived Client Should Not Show",pdfLink:"https://drive.example/archived"}];}\n' +
  fns + '\nvar nurseSheetsGen=0;var nurseSheetsAbort=null;var adminNurseAlerts=[];var deriveCalls=0;',
  sandbox
);

function activityCalls(){
  return calls.filter(function(c){return c.url.indexOf('list_nurse_activity') >= 0 || c.url.indexOf('script.'+'google.com') >= 0;});
}
function lastBody(){
  const hit = calls.filter(function(c){return c.url.indexOf('/rpc/list_nurse_activity') >= 0;}).pop();
  assert.ok(hit, 'expected an activity RPC call');
  return JSON.parse(hit.init.body);
}

(async function(){
  rpcMode = 'empty';
  box.innerHTML = '<p>No unread nurse alerts.</p>';
  sandbox.deriveCalls = 0;
  await sandbox.loadNurseActivityFeed();
  assert.strictEqual(calls.length, 1, 'empty success is one Supabase call');
  assert.ok(calls[0].url.indexOf('/rpc/list_nurse_activity') > 0, calls[0].url);
  assert.deepStrictEqual(lastBody(), {p_limit:50}, 'default body omits p_include_archived');
  assert.ok(calls[0].init.signal, 'activity fetch keeps the nursespd2 abort signal');
  assert.ok(box.innerHTML.indexOf('No recent nurse activity.') >= 0, box.innerHTML);
  assert.ok(box.innerHTML.indexOf('Refresh') >= 0, 'empty state can refresh');
  assert.ok(box.innerHTML.indexOf('Archived Client Should Not Show') < 0, 'successful empty does not derive archived rows');
  assert.strictEqual(sandbox.deriveCalls, 0, 'deriveNurseActivityFromLists is not called for a successful empty list');
  assert.ok(calls.every(function(c){return c.url.indexOf('script.'+'google.com') < 0;}));

  calls.length = 0;
  rpcMode = 'forbidden';
  box.innerHTML = '';
  sandbox.deriveCalls = 0;
  sandbox.currentAdminRole = 'Nurse';
  await sandbox.loadNurseActivityFeed();
  assert.strictEqual(calls.length, 1, '403 is still only the RPC');
  assert.ok(calls[0].url.indexOf('/rpc/list_nurse_activity') > 0);
  assert.deepStrictEqual(lastBody(), {p_limit:50});
  assert.ok(box.innerHTML.indexOf('Could not load nurse activity.') >= 0, box.innerHTML);
  assert.ok(box.innerHTML.indexOf('Archived Client Should Not Show') < 0);
  assert.strictEqual(sandbox.deriveCalls, 0, '403 does not derive');
  assert.ok(calls.every(function(c){return c.url.indexOf('script.'+'google.com') < 0;}));

  calls.length = 0;
  rpcMode = 'auth';
  sandbox.currentAdminRole = 'Scheduler';
  sandbox.deriveCalls = 0;
  await sandbox.loadNurseActivityFeed();
  assert.ok(box.innerHTML.indexOf('Could not load nurse activity.') >= 0);
  assert.strictEqual(sandbox.deriveCalls, 0, '401 does not derive');
  assert.ok(calls.every(function(c){return c.url.indexOf('script.'+'google.com') < 0;}));

  calls.length = 0;
  rpcMode = 'items';
  sandbox.currentAdminRole = 'Admin';
  box.innerHTML = '';
  await sandbox.loadNurseActivityFeed();
  assert.ok(box.innerHTML.indexOf('Probe URL Test') >= 0, box.innerHTML);
  assert.ok(box.innerHTML.indexOf('focusNurseAlertItem') >= 0, 'empty pdfLink row still taps to focus');
  assert.ok(!/href=/.test(box.innerHTML), 'empty pdfLink is not rendered as a link');
  assert.ok(box.innerHTML.indexOf('drive.example') < 0);
  sandbox.focusNurseAlertItem('visit', '1789621589936');

  calls.length = 0;
  rpcMode = 'abort';
  const pending = sandbox.apiPost({action:'list_nurse_activity', limit:50, includeArchived:true});
  await Promise.resolve();
  assert.strictEqual(activityCalls().length, 1);
  assert.deepStrictEqual(lastBody(), {p_limit:50}, 'even a stray includeArchived flag is not sent');
  sandbox.cancelNurseSheetsFetches();
  const aborted = await pending;
  assert.strictEqual(aborted.success, false);
  assert.strictEqual(aborted.aborted, true);
  assert.ok(calls.every(function(c){return c.url.indexOf('script.'+'google.com') < 0;}), 'aborted Supabase activity does not fall back to Sheets');

  calls.length = 0;
  rpcMode = 'sheets-empty';
  sandbox.location.search = '?sheets=1';
  sandbox.nurseSheetsGen = 0;
  sandbox.deriveCalls = 0;
  box.innerHTML = '';
  await sandbox.loadNurseActivityFeed();
  assert.ok(calls[0].url.indexOf('/rpc/list_nurse_activity') > 0, 'a sheets query still uses the activity RPC');
  assert.deepStrictEqual(JSON.parse(calls[0].init.body), {p_limit:50});
  assert.strictEqual(sandbox.deriveCalls, 0, 'an empty RPC does not derive');
  assert.ok(box.innerHTML.indexOf('No recent nurse activity.') >= 0);
  assert.ok(box.innerHTML.indexOf('Archived Client Should Not Show') < 0);

  console.log('admin-nurse-activity-sb1-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
