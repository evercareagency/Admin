#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

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

assert.ok(html.includes('v=nursespd1'), 'nursespd1 marker');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-24-nursespd1">'), 'admin-build meta');
assert.ok(html.includes('v=adminpw1'), 'adminpw1 marker stays');
assert.ok(html.includes('v=warmkeep'), 'warmkeep marker stays');
assert.ok(html.includes('Still loading from Sheets…'), 'slow copy');
assert.ok(html.includes('onclick="retryCompletedNewClientIntakes()"'), 'Retry button');
assert.ok(html.includes('ec_nci_completes_nursespd1'), 'sessionStorage key');
assert.ok(/NCI_COMPLETE_LIST_TTL_MS=5\*60\*1000/.test(html), 'cache ttl ~5min');
assert.ok(/NCI_COMPLETE_LIST_SLOW_MS=2000/.test(html), 'slow hint at ~2s');
assert.ok(html.includes("action:'list_new_client_intakes',status:'Complete'"), 'Complete list action stays');
assert.ok(html.includes("action:'list_new_client_intakes',nurseName:currentNurseName||'',status:'Draft'"), 'Draft list stays a separate call');
assert.ok(html.includes('includeSignatures:true') && html.includes('includeSigs:true'), 'ink open sends both signature flags');

const getInk = extractFn(html, 'async function getNewClientIntake(intakeId, opts)');
const resumeInk = extractFn(html, 'async function resumeNewClientIntake(intakeId,opts)');
const pollInk = extractFn(html, 'async function nciPollCompletePdfLink(intakeId,budgetMs)');
const recheckInk = extractFn(html, 'async function nciRecheckPendingCompletePdfs()');
const listInk = extractFn(html, 'function nciFetchCompleteList()');
assert.ok(getInk.includes('payload.includeSignatures=true') && getInk.includes('payload.includeSigs=true'), 'get sends both aliases together');
assert.ok(resumeInk.includes('includeSignatures:true,includeSigs:true'), 'edit and resume ask for ink');
const viewInk = extractFn(html, 'async function viewCompletedIntakePdf(intakeId)');
assert.ok(viewInk.includes('includeSignatures:true,includeSigs:true'), 'View/PDF asks for ink when it loads the intake');
assert.ok(pollInk.includes('getNewClientIntake(id)') && !/includeSignatures|includeSigs/.test(pollInk), 'PDF link poll stays trimmed');
assert.ok(recheckInk.includes('getNewClientIntake(id)') && !/includeSignatures|includeSigs/.test(recheckInk), 'pending PDF recheck stays trimmed');
assert.ok(!/includeSignatures|includeSigs/.test(listInk), 'Completes list does not ask for signatures');
assert.ok(html.includes('if(nciCompleteListInflight)return nciCompleteListInflight;'), 'single-flight guard');

const home = extractFn(html, 'function openPortalHome(sess, opts)');
assert.ok(!/includeSignatures|includeSigs/.test(home), 'home prefetch does not ask for signatures');
const draftsInk = extractFn(html, 'async function loadNewClientIntakeDrafts()');
assert.ok(draftsInk && !/includeSignatures|includeSigs/.test(draftsInk), 'draft list does not ask for signatures');
assert.strictEqual(home.split('loadCompletedNewClientIntakes()').length - 1, 3,
  'Nurse prefetch, Nurse join, and Admin home each call the shared loader');
const prefetchAt = home.indexOf('loadCompletedNewClientIntakes();');
const complianceAt = home.indexOf('loadNurseCompliance(true)');
assert.ok(prefetchAt > home.indexOf("showScreen('nurseScreen')") && prefetchAt < complianceAt,
  'Nurse Completes list starts after home paint and before compliance');
assert.ok(home.indexOf('loadCompletedNewClientIntakes(); // nursespd1') > complianceAt,
  'compliance load joins the same Completes prefetch');
assert.ok(!/\bawait\b/.test(home), 'openPortalHome must not await');

const showTab = extractFn(html, 'function showNurseTab(tab)');
assert.strictEqual(showTab.split('loadCompletedNewClientIntakes()').length - 1, 1,
  'Completes tab asks for the list once');

const refresh = extractFn(html, 'async function refreshCompletedNewClientIntakes()');
assert.ok(refresh.indexOf('nciInvalidateCompleteListCache()') < refresh.indexOf('loadCompletedNewClientIntakes()'),
  'Refresh bypasses the 5min cache');

const sigs = [
  'function nciCompleteListCacheGet()',
  'function nciCompleteListCacheSet(rows)',
  'function nciInvalidateCompleteListCache()',
  'function nciTouchCompleteListCache()',
  'function nciMapCompleteIntakeRows(data)',
  'function nciApplyCompletedRows(rows)',
  'function nciCompleteListPendingHtml(slow)',
  'function nciPaintCompleteListPending(slow)',
  'function nciClearCompleteListSlowTimer()',
  'function nciArmCompleteListSlowUi()',
  'function nciFetchCompleteList()',
  'function nciScheduleCompleteListSoftRefresh(stamp)',
  'async function loadCompletedNewClientIntakes()',
  'function retryCompletedNewClientIntakes()',
  'function nciIntakeRowsFromList(data)'
];
const src = sigs.map(function(sig){
  const fn = extractFn(html, sig);
  assert.ok(fn, 'missing '+sig);
  return fn;
}).join('\n');

const mem = {};
const bodies = {
  nciCompletedNurseBody: {innerHTML: ''},
  nciCompletedAdminBody: {innerHTML: ''}
};
const timers = [];
const pendingPosts = [];
const posts = [];
const sandbox = {
  nciCompletedRows: [],
  nciLastCompletePdf: null,
  nciCompleteListInflight: null,
  nciCompleteListEpoch: 0,
  nciCompleteSoftFor: 0,
  nciCompleteListFetchedThisPage: false,
  nciCompleteListSlowTimer: null,
  nciCompleteListWaitGen: 0,
  NCI_COMPLETE_LIST_TTL_MS: 5 * 60 * 1000,
  NCI_COMPLETE_LIST_SLOW_MS: 2000,
  NCI_COMPLETE_LIST_CACHE_KEY: 'ec_nci_completes_nursespd1',
  sessionStorage: {
    getItem: function(k){return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;},
    setItem: function(k, v){mem[k] = String(v);},
    removeItem: function(k){delete mem[k];}
  },
  document: {
    getElementById: function(id){return bodies[id] || null;}
  },
  Date: Date,
  setTimeout: function(fn, ms){
    const rec = {fn: fn, ms: ms, cleared: false};
    timers.push(rec);
    return rec;
  },
  clearTimeout: function(rec){if(rec)rec.cleared = true;},
  nciPickIntakeId: function(r){return r && r.intakeId != null ? String(r.intakeId) : '';},
  pickIntakePdfLink: function(r){return r && r.pdfLink ? String(r.pdfLink) : '';},
  paintCompletedNewClientIntakes: function(){
    const htmlRows = (sandbox.nciCompletedRows || []).map(function(r){return r.clientName || '';}).join('|') || 'EMPTY';
    bodies.nciCompletedNurseBody.innerHTML = htmlRows;
    bodies.nciCompletedAdminBody.innerHTML = htmlRows;
  },
  nciRememberCompletePdf: function(){sandbox.paintCompletedNewClientIntakes();},
  apiPost: function(payload){
    posts.push(payload);
    return new Promise(function(resolve){pendingPosts.push(resolve);});
  },
  console: console
};
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

function fireSlowTimers(){
  timers.slice().forEach(function(rec){
    if(!rec.cleared && rec.ms >= 1500)rec.fn();
  });
}
function nurseHtml(){return bodies.nciCompletedNurseBody.innerHTML;}
const row = {intakeId: '9', status: 'Complete', clientName: 'Mo Client', nurseName: 'Ada'};
const ok = {success: true, data: [row]};

async function run(){
  const inkBox = {calls: [], apiPost: function(p){ inkBox.calls.push(p); return Promise.resolve({success:true}); }};
  vm.createContext(inkBox);
  vm.runInContext(getInk + '\nthis.getNewClientIntake=getNewClientIntake;', inkBox);
  await inkBox.getNewClientIntake('9');
  await inkBox.getNewClientIntake('9', {includeSignatures:true});
  await inkBox.getNewClientIntake('9', {includeSigs:true});
  assert.strictEqual(inkBox.calls[0].action, 'get_new_client_intake');
  assert.strictEqual(inkBox.calls[0].includeSignatures, undefined, 'plain get omits includeSignatures');
  assert.strictEqual(inkBox.calls[0].includeSigs, undefined, 'plain get omits includeSigs');
  assert.strictEqual(inkBox.calls[1].includeSignatures, true);
  assert.strictEqual(inkBox.calls[1].includeSigs, true);
  assert.strictEqual(inkBox.calls[2].includeSignatures, true);
  assert.strictEqual(inkBox.calls[2].includeSigs, true);
  const p1 = sandbox.loadCompletedNewClientIntakes();
  const p2 = sandbox.loadCompletedNewClientIntakes();
  const p3 = sandbox.loadCompletedNewClientIntakes();
  assert.strictEqual(posts.length, 1, 'three cold callers share one list post');
  assert.strictEqual(posts[0].action, 'list_new_client_intakes');
  assert.strictEqual(posts[0].status, 'Complete');
  assert.ok(nurseHtml().includes('Loading completed intakes'), 'pending copy before 2s');
  assert.ok(!nurseHtml().includes('Still loading from Sheets'), 'slow copy waits ~2s');
  fireSlowTimers();
  assert.ok(nurseHtml().includes('Still loading from Sheets…'), 'slow copy after ~2s');
  assert.ok(nurseHtml().includes('>Retry<'), 'Retry is on the slow row');
  assert.strictEqual(bodies.nciCompletedAdminBody.innerHTML, nurseHtml(), 'admin body shares the pending row');
  sandbox.retryCompletedNewClientIntakes();
  assert.strictEqual(posts.length, 1, 'Retry while in flight does not start a second list');
  pendingPosts.shift()(ok);
  await Promise.all([p1, p2, p3]);
  assert.strictEqual(posts.length, 1, 'resolve still one list post');
  assert.ok(nurseHtml().includes('Mo Client'), 'rows paint when the list returns');
  assert.ok(mem.ec_nci_completes_nursespd1, 'success is stored in sessionStorage');

  bodies.nciCompletedNurseBody.innerHTML = 'STALE';
  sandbox.nciCompletedRows = [];
  const warm = sandbox.loadCompletedNewClientIntakes();
  assert.ok(nurseHtml().includes('Mo Client'), 'revisit paints from cache before any new post');
  assert.strictEqual(posts.length, 1, 'same-page revisit does not list again');
  await warm;

  sandbox.nciCompleteListFetchedThisPage = false;
  sandbox.nciCompletedRows = [];
  bodies.nciCompletedNurseBody.innerHTML = 'STALE';
  let sawPaintBeforePost = false;
  const realPost = sandbox.apiPost;
  sandbox.apiPost = function(payload){
    sawPaintBeforePost = nurseHtml().includes('Mo Client');
    return realPost(payload);
  };
  const s1 = sandbox.loadCompletedNewClientIntakes();
  const s2 = sandbox.loadCompletedNewClientIntakes();
  const s3 = sandbox.loadCompletedNewClientIntakes();
  assert.ok(sawPaintBeforePost, 'restored cache paints before the soft refresh post');
  assert.strictEqual(posts.length, 2, 'restored cache starts one soft refresh, not three');
  pendingPosts.shift()(ok);
  await Promise.all([s1, s2, s3]);
  assert.ok(nurseHtml().includes('Mo Client'), 'soft refresh keeps the painted rows');

  sandbox.nciInvalidateCompleteListCache();
  assert.ok(!mem.ec_nci_completes_nursespd1, 'invalidate drops sessionStorage');
  const again = sandbox.loadCompletedNewClientIntakes();
  assert.strictEqual(posts.length, 3, 'after invalidate, one new list post');
  pendingPosts.shift()({success: true, data: []});
  await again;
  assert.strictEqual(nurseHtml(), 'EMPTY', 'empty Complete list still paints');

  console.log('nurse-completes-speed-test: ok');
}

run().catch(function(err){
  console.error(err && err.stack || err);
  process.exit(1);
});
