#!/usr/bin/env node
'use strict';

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
assert.ok(html.includes('v=nurse-compliance-sb1'), 'tip marker');
assert.ok(html.includes('?v=nurse-compliance-sb1'), 'query marker');
assert.ok(html.includes('GHOST-NURSE-COMPLIANCE-SB-CONTRACT-v1'), 'contract marker');
assert.ok(html.includes("var NURSE_COMPLIANCE_SB1_MARKER='v=nurse-compliance-sb1'"), 'script marker');
assert.ok(html.includes("var NURSE_COMPLIANCE_SB1_BUILD='2026-10-05-nurse-compliance-sb1'"), 'script build');
assert.ok(html.includes('<meta name="admin-build" content="2026-10-05-nurse-compliance-sb1">'), 'tip admin-build meta');
assert.ok(html.includes('data-nurse-compliance-sb1="v=nurse-compliance-sb1"'), 'compliance list marker');
assert.ok(html.includes('data-nurse-alerts-sb1="v=nurse-compliance-sb1"'), 'nurse alerts badge marker');
assert.ok(html.includes('MERGE HOLD'), 'merge hold');
assert.ok(html.includes("sbRestRpc('get_supervisory_compliance', {})"), 'compliance RPC body is empty');
assert.ok(html.includes("sbRestRpc('list_nurse_alerts', {p_username:username}, signal)"), 'alerts list RPC');
assert.ok(html.includes("sbRestRpc('mark_nurse_alerts_read', {p_username:username, p_ids:ids}, signal)"), 'alerts mark RPC');
assert.ok(html.includes("{action:'get_supervisory_compliance'}"), 'rollback compliance action stays');
assert.ok(html.includes("action:'list_nurse_alerts'"), 'rollback alerts action stays');
assert.ok(html.includes("action:'mark_nurse_alerts_read'"), 'rollback mark action stays');
assert.ok(html.includes("action:'list_nurse_activity'"), 'activity action stays');

const dispatch = extractFn(html, 'async function sbNurseComplianceDispatch(payload)');
const alerts = extractFn(html, 'async function sbNurseAlertsDispatch(payload, signal)');
const alertGate = extractFn(html, 'function sbIsNurseAlertRpcAction(action)');
assert.ok(dispatch.includes("sbRestRpc('get_supervisory_compliance', {})"), 'dispatch posts the empty compliance body');
assert.ok(!dispatch.includes('SHEETS_URL') && !dispatch.includes('apiPost'), 'compliance dispatch does not call Sheets');
assert.ok(alerts.includes("sbRestRpc('list_nurse_alerts'") && alerts.includes("sbRestRpc('mark_nurse_alerts_read'"), 'badge dispatch posts both RPCs');
assert.ok(!alertGate.includes('list_nurse_activity'), 'activity is not on the Supabase alert gate');
assert.ok(html.includes("cacheInvalidate('get_supervisory_compliance')"), 'compliance cache invalidation stays');

const load = extractFn(html, 'async function loadNurseCompliance(force)');
assert.ok(load.includes('sbNurseComplianceDispatch'), 'load uses the compliance dispatch when the cut is on');
assert.ok(load.includes("apiPost({action:'get_supervisory_compliance'})"), 'rollback still posts the sheets action');
assert.ok(load.indexOf('sbNurseComplianceDispatch') < load.indexOf("apiPost({action:'get_supervisory_compliance'})"), 'cut ON is chosen before /exec');
assert.ok(!load.includes('get_users') && !load.includes('get_clients'), 'compliance list does not wait on users or clients');
assert.ok(load.includes('Could not load compliance'), 'RPC failure keeps the empty-state refresh copy');

const hydrate = extractFn(html, 'function hydrateNurseComplianceRow(r,extra)');
assert.ok(hydrate.includes('r.visitCount') && hydrate.includes('r.callCount') && hydrate.includes('r.daysLeftInWindow'), 'hydrate field mapping stays');

const abortLine = (html.match(/var nurseSheetsAction=payload&&\([^;]+\)/) || [])[0] || '';
assert.ok(abortLine.includes("action==='list_nurse_alerts'") && abortLine.includes("action==='mark_nurse_alerts_read'") && abortLine.includes("action==='list_nurse_activity'"),
  'Completes Refresh still aborts list, mark, and activity');
assert.ok(!abortLine.includes('get_supervisory_compliance'), 'compliance is not on the Completes abort list');

const box = {
  nurseVisitPdfStash: {},
  applyNurseVisitStash: function(row){return row;},
  pickVisitPdfLink: function(){return '';}
};
vm.createContext(box);
vm.runInContext(extractFn(html, 'function scField(row,pascal,camel)') + '\n' + hydrate, box);
const row = box.hydrateNurseComplianceRow({
  clientId: '1785608540832',
  clientName: 'Bowlax Abib',
  status: 'Behind',
  visitCount: 0,
  callCount: 0,
  daysLeftInWindow: 42,
  windowDays: 60
});
assert.strictEqual(row.clientName, 'Bowlax Abib');
assert.strictEqual(row.status, 'Behind');
assert.strictEqual(row.visits, 0);
assert.strictEqual(row.countingCalls, 0);
assert.strictEqual(row.daysInWindow, 42);

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
  'function sbIsNurseComplianceAction(action)',
  'function sbIsNurseAlertRpcAction(action)',
  'function sbNurseOfficeUsername(payload)',
  'function sbComplianceRows(node)',
  'function sbNurseAlertItems(node)',
  'async function sbNurseComplianceDispatch(payload)',
  'async function sbNurseAlertsDispatch(payload, signal)',
  'function cancelNurseSheetsFetches()',
  'function nurseSheetsSignal()',
  'async function apiPost(payload)'
];
const fns = sigs.map(function(sig){
  const fn = extractFn(html, sig);
  assert.ok(fn, 'missing ' + sig);
  return fn;
}).join('\n');
const calls = [];
const session = {
  access_token: 'office-jwt',
  refresh_token: 'refresh-1',
  user: {id: 'admin-uid'},
  profile: {id: 'admin-uid', org_id: '4f97f4d3-6635-4544-904c-6b06aa02d40b', role: 'admin'}
};
const mem = {evercare_sb_session: JSON.stringify(session)};
const sandbox = {
  SUPABASE_URL: urlConst,
  SUPABASE_ANON_KEY: keyConst,
  SHEETS_URL: sheetsUrl,
  GAS_HEADERS: {'Content-Type':'text/plain;charset=utf-8'},
  SB_SESSION_KEY: 'evercare_sb_session',
  location: {search: ''},
  currentAdminRole: 'Admin',
  nurseSheetsGen: 0,
  nurseSheetsAbort: null,
  localStorage: {
    getItem: function(k){return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;},
    setItem: function(k, v){mem[k] = String(v);},
    removeItem: function(k){delete mem[k];}
  },
  window: {__sbSession: session},
  fetch: function(url, init){
    calls.push({url: String(url), init: init || {}});
    const signal = init && init.signal;
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
vm.runInContext(fns + '\nvar nurseSheetsGen=0;var nurseSheetsAbort=null;', sandbox);
(async function(){
  const pending = sandbox.apiPost({action:'list_nurse_alerts', username:'Admin'});
  await Promise.resolve();
  assert.strictEqual(calls.length, 1, 'badge list starts one fetch');
  assert.ok(calls[0].url.indexOf('/rpc/list_nurse_alerts') > 0, calls[0].url);
  assert.ok(calls[0].init.signal, 'in-flight alerts fetch keeps the nursespd2 abort signal');
  sandbox.cancelNurseSheetsFetches();
  const aborted = await pending;
  assert.strictEqual(aborted.success, false);
  assert.strictEqual(aborted.aborted, true);
  assert.strictEqual(calls.length, 1, 'aborted Supabase alerts do not fall back to Sheets');
  assert.ok(calls.every(function(c){return c.url.indexOf('script.google.com') < 0;}));
  console.log('admin-nurse-compliance-sb1-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
