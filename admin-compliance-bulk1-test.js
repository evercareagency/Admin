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

assert.ok(html.includes('v=compliance-bulk1'), 'compliance-bulk1 marker');
assert.ok(html.includes('data-compliance-bulk1="v=compliance-bulk1"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-27-compliance-bulk1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-compliance-bulk1">'), 'meta');
assert.ok(html.includes('<!-- compliance bulk 2026-09-27 v=compliance-bulk1 admin-build 2026-09-27-compliance-bulk1'), 'comment');
assert.ok(html.includes("var COMPLIANCE_BULK1_MARKER='v=compliance-bulk1'"), 'script marker');
assert.ok(html.includes('GHOST-COMPLIANCE-BULK1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace no new CALLABLE'), 'no new callable');
assert.ok(html.includes('MERGE HOLD'), 'merge hold');
assert.ok(html.includes('Do not claim LIVE'), 'not live');
assert.ok(html.includes('Do not squash-merge'), 'no squash');
assert.ok(html.includes('No SQL') && html.includes('No new RPC') && html.includes('No Auth reseal'), 'hard rules');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-remi-float-hide1b'), 'first admin-build is remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1b"') < html.indexOf('content="2026-09-27-list-az1"'), 'list-az1 stays after remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-list-az1"') < html.indexOf('content="2026-09-27-compliance-bulk1"'), 'compliance-bulk1 stays after list-az1');
assert.ok(html.indexOf('content="2026-09-27-compliance-bulk1"') < html.indexOf('content="2026-09-27-hold-autosave1"'), 'hold-autosave1 stays after compliance-bulk1');
assert.ok(html.indexOf('content="2026-09-27-hold-autosave1"') < html.indexOf('content="2026-09-27-msg-dense1"'), 'msg-dense1 stays after hold-autosave1');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-aide-notif-search1"'), 'aide-notif-search1 stays after msg-dense1');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-hold-autosave1">'), 'hold-autosave1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-msg-dense1">'), 'msg-dense1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-aide-notif-search1">'), 'aide-notif-search1 meta stays');
assert.ok(html.includes('v=isdel1') && html.includes('v=isclear1') && html.includes('v=isdash1'), 'prior inservice markers stay');
['v=hold-autosave1','v=msg-dense1','v=aide-notif-search1','v=remi-chat1','v=hold-client1','v=aides-info1','v=login-toast1','v=isdel1','v=isclear1','v=isdash1b'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});

const bar = html.slice(html.indexOf('data-compliance-bulk1="v=compliance-bulk1"'), html.indexOf('id="isComplianceScroll"'));
assert.ok(bar.includes('aria-label="Search aide by name"'), 'search label');
assert.ok(bar.includes('placeholder="Search aide by name…"'), 'search placeholder');
assert.ok(bar.includes('id="isComplianceSearch"'), 'search field');
assert.ok(bar.includes('role="group"') && bar.includes('aria-label="Selection"'), 'selection pair group');
assert.ok(bar.indexOf('>Select all<') < bar.indexOf('>Unselect all<'), 'Unselect all sits beside Select all');
assert.ok(bar.includes('id="isComplianceSelectAllBtn"') && bar.includes('onclick="isComplianceSelectAll()"'), 'Select all control');
assert.ok(bar.includes('id="isComplianceUnselectAllBtn"') && bar.includes('onclick="isComplianceUnselectAll()"'), 'Unselect all control');
assert.ok(!/id="isComplianceSelectAll"(?!Btn)/.test(bar), 'Select all id does not collide with the function');
assert.ok(!/id="isComplianceUnselectAll"(?!Btn)/.test(bar), 'Unselect all id does not collide with the function');
assert.ok(bar.includes('>Delete selected<'), 'Delete selected label');
assert.ok(bar.includes('id="isComplianceDeleteSelected"') && bar.includes('disabled'), 'empty selection disables Delete selected');
assert.ok(!bar.includes('Select all visible'), 'compliance pair is Select all, not Select all visible');
assert.ok(html.includes('onclick="isAssignSelectAllVisible()">Select all visible</button>'), 'assign Select all visible stays');
assert.ok(html.includes('onclick="isAssignClearSelection()">Clear selection</button>'), 'assign Clear selection stays');
assert.ok(html.includes('id="isComplianceCards"'), 'phone cards');
assert.ok(html.includes('#isComplianceScroll.is-bulk-desk{display:none;}'), 'phone hides the wide table');
assert.ok(html.includes('#isComplianceCards{display:none;}'), 'desk hides the cards');
assert.ok(html.includes('Send Reminder'), 'Send Reminder stays');
assert.ok(!/rpc\/admin_search_inservice|p_search/.test(bar), 'no new search RPC on this toolbar');

const selectAll = extractFn(html, 'function isComplianceSelectAll()');
const unselect = extractFn(html, 'function isComplianceUnselectAll()');
const confirmBulk = extractFn(html, 'function confirmDeleteISSelected()');
const deleteBulk = extractFn(html, 'async function deleteISSelected()');
const commitDel = extractFn(html, 'async function commitISComplianceDelete(rowIndex, archiveActiveResult');
assert.ok(selectAll.includes('isComplianceRowDeletable') && selectAll.includes('isComplianceVisibleItems'), 'Select all is visible deletable rows');
assert.ok(!selectAll.includes('isComplianceSearch') || selectAll.includes('isComplianceVisibleItems'), 'Select all does not clear search');
assert.ok(unselect.includes('.clear()') && unselect.includes('paintISComplianceBoard()'), 'Unselect all clears the set and stays on the board');
assert.ok(!unselect.includes('isComplianceSearch') && !unselect.includes('assignTopicSel'), 'Unselect all does not clear search or topic');
assert.ok(confirmBulk.includes("showSharedConfirm('Are you sure?'") && confirmBulk.includes('Yes, delete'), 'one confirm, same copy as row Delete');
assert.ok(confirmBulk.includes('deleteISSelected()'), 'confirm runs the batch');
assert.ok(!/window\.confirm|\bconfirm\(/.test(selectAll+unselect+confirmBulk+deleteBulk), 'no window.confirm');
assert.ok(deleteBulk.includes('commitISComplianceDelete') && deleteBulk.includes('isComplianceDeleteQuiet=true'), 'batch uses the row delete path quietly');
assert.ok(deleteBulk.includes('renderInservices(true)'), 'batch refreshes once after deletes');
assert.ok(commitDel.includes('sbAdminUnassignInserviceAide(topicId, username, archiveActiveResult===true)'), 'same RPC and archive flag');
assert.ok(commitDel.includes("mode==='was_selected'||mode==='was_all'"), 'success still requires was_selected or was_all');
assert.ok(html.includes("rpc/admin_unassign_inservice_aide"), 'isdel1 RPC stays');

function el(id){
  return {id:id, value:'', innerHTML:'', textContent:'', disabled:false, style:{display:''}, hidden:false};
}
const els = {
  isComplianceBody: el('isComplianceBody'),
  isComplianceEmpty: el('isComplianceEmpty'),
  isComplianceCards: el('isComplianceCards'),
  isComplianceSearch: el('isComplianceSearch'),
  isComplianceSelCount: el('isComplianceSelCount'),
  isComplianceDeleteSelected: el('isComplianceDeleteSelected')
};
const toasts = [];
const calls = [];
const sandbox = {
  els:els,
  toasts:toasts,
  calls:calls,
  isComplianceRows:[],
  isComplianceSelected:new Set(),
  isComplianceBulkBusy:false,
  currentAdminRole:'Admin',
  document:{
    getElementById:function(id){return els[id]||null;}
  },
  showTempMsg:function(msg, color){toasts.push({msg:msg, color:color});},
  showSharedConfirm:function(title, fn, label){sandbox._confirm={title:title, fn:fn, label:label};},
  cacheInvalidate:function(action){calls.push({kind:'invalidate', action:action});},
  renderInservices:async function(force){calls.push({kind:'refresh', force:force});},
  sbAdminUnassignInserviceAide:async function(topicId, username, archive){
    calls.push({kind:'rpc', topicId:topicId, username:username, archive:archive});
    return {success:true, removed:true, mode:username==='moe'?'was_all':'was_selected', archived_count:archive?1:0, results_hard_deleted:false};
  },
  Set:Set,
  Array:Array,
  String:String,
  Number:Number,
  Object:Object,
  isNaN:isNaN
};
vm.createContext(sandbox);
vm.runInContext([
  extractFn(html, 'function escapeHtml(str)'),
  extractFn(html, 'function escapeAttr(str)'),
  extractFn(html, 'function isCompliancePairKey(username, topicId)'),
  extractFn(html, 'function isOfficeCertStaff()'),
  extractFn(html, 'function isCompletedActionsHtml(i)'),
  extractFn(html, 'function isPendingActionsHtml(i)'),
  'function formatISScoreColumn(row){return row.isCompleted?(row.scoreCorrect+"/"+row.scoreTotal+" · "+row.scorePct+"%"):"—";}',
  'function formatISCompletedDate(v){return v||"—";}',
  'function formatCertDate(v){return v;}',
  'function certDateFromRecord(row){return row.completedAt||"";}',
  extractFn(html, 'function isComplianceRowDeletable(row)'),
  extractFn(html, 'function isComplianceSearchQuery()'),
  extractFn(html, 'function isComplianceRowMatchesSearch(row)'),
  extractFn(html, 'function isComplianceSelectionSet()'),
  extractFn(html, 'function isCompliancePruneSelection()'),
  extractFn(html, 'function isComplianceSelectedCount()'),
  extractFn(html, 'function isComplianceSkippedCount(visible)'),
  extractFn(html, 'function isComplianceCountLabel(selected, skipped)'),
  extractFn(html, 'function isCompliancePaintCount(selected, skipped)'),
  extractFn(html, 'function isComplianceCheckHtml(row, i)'),
  extractFn(html, 'function isComplianceCardMeta(row)'),
  extractFn(html, 'function isComplianceRowHtml(row, i)'),
  extractFn(html, 'function isComplianceCardHtml(row, i)'),
  extractFn(html, 'function isComplianceVisibleItems()'),
  extractFn(html, 'function paintISComplianceBoard()'),
  extractFn(html, 'function onISComplianceSearch()'),
  extractFn(html, 'function onISComplianceToggle(index, checked)'),
  selectAll,
  unselect,
  extractFn(html, 'function isComplianceDeleteJobs()'),
  confirmBulk,
  extractFn(html, 'function isComplianceDeleteTopicId(row)'),
  commitDel,
  deleteBulk
].join('\n'), sandbox);

const rows = [
  {username:'moe', empName:'Moe', topicId:'1', topicShort:'Complications of Diabetes', isCompleted:true, inAssignmentScope:true, scoreCorrect:9, scoreTotal:10, scorePct:90, completedAt:'08/02/2026'},
  {username:'alex', empName:'Alex', topicId:'1', topicShort:'Complications of Diabetes', isCompleted:false, inAssignmentScope:false},
  {username:'jane', empName:'Jane', topicId:'1', topicShort:'Complications of Diabetes', isCompleted:true, inAssignmentScope:true, scoreCorrect:8, scoreTotal:10, scorePct:80, completedAt:'08/02/2026'},
  {username:'sam', empName:'Sam', topicId:'2', topicShort:'Safety', isCompleted:false, inAssignmentScope:true}
];
sandbox.isComplianceRows = rows;
sandbox.paintISComplianceBoard();
assert.ok(els.isComplianceBody.innerHTML.includes('Moe') && els.isComplianceBody.innerHTML.includes('Safety'), 'empty search shows the full roster');
assert.ok(els.isComplianceCards.innerHTML.includes('Alex'), 'phone cards paint the same roster');
assert.ok(els.isComplianceBody.innerHTML.includes('aria-label="Alex not deletable"'), 'non-deletable checkbox is disabled');
assert.ok(els.isComplianceBody.innerHTML.includes('Send Reminder'), 'Send Reminder stays on the not-completed row');
assert.strictEqual(els.isComplianceSelCount.textContent, '0 selected');
assert.strictEqual(els.isComplianceDeleteSelected.disabled, true);

els.isComplianceSearch.value = 'JANE';
sandbox.onISComplianceSearch();
assert.ok(els.isComplianceBody.innerHTML.includes('Jane'));
assert.ok(!els.isComplianceBody.innerHTML.includes('Moe'));
assert.ok(!els.isComplianceCards.innerHTML.includes('Alex'), 'search is case-insensitive and hides other aides');
sandbox.isComplianceSelectAll();
assert.strictEqual(sandbox.isComplianceSelected.size, 1, 'Select all takes only the visible deletable row');
assert.ok(sandbox.isComplianceSelected.has('jane|1'));
assert.ok(!sandbox.isComplianceSelected.has('alex|1'), 'Select all skips the non-deletable row');
assert.strictEqual(els.isComplianceSearch.value, 'JANE', 'Select all leaves the search text');
assert.strictEqual(els.isComplianceDeleteSelected.disabled, false);

els.isComplianceSearch.value = '';
sandbox.onISComplianceSearch();
sandbox.isComplianceSelectAll();
assert.ok(sandbox.isComplianceSelected.has('moe|1') && sandbox.isComplianceSelected.has('jane|1') && sandbox.isComplianceSelected.has('sam|2'));
assert.ok(!sandbox.isComplianceSelected.has('alex|1'));
assert.strictEqual(els.isComplianceSelCount.textContent, '3 selected · 1 skipped (not deletable)');
assert.ok(els.isComplianceBody.innerHTML.indexOf('>Select all<') < 0, 'row html does not invent a second Select all');

sandbox.isComplianceUnselectAll();
assert.strictEqual(sandbox.isComplianceSelected.size, 0);
assert.strictEqual(els.isComplianceSelCount.textContent, '0 selected');
assert.strictEqual(els.isComplianceSearch.value, '', 'Unselect all leaves search empty when it was empty');
assert.strictEqual(els.isComplianceDeleteSelected.disabled, true);
assert.ok(els.isComplianceBody.innerHTML.includes('Moe'), 'Unselect all stays on the dashboard');

els.isComplianceSearch.value = 'al';
sandbox.paintISComplianceBoard();
sandbox.isComplianceUnselectAll();
assert.strictEqual(els.isComplianceSearch.value, 'al', 'Unselect all does not clear search');
els.isComplianceSearch.value = '';
sandbox.paintISComplianceBoard();

sandbox.isComplianceSelectAll();
sandbox.confirmDeleteISSelected();
assert.strictEqual(sandbox._confirm.title, 'Are you sure?');
assert.strictEqual(sandbox._confirm.label, 'Yes, delete');
calls.length = 0;
toasts.length = 0;
(async function(){
  await sandbox._confirm.fn();
  const rpc = calls.filter(function(c){return c.kind==='rpc';});
  assert.deepStrictEqual(rpc.map(function(c){return c.username+':'+(c.archive?'archive':'keep');}), [
    'moe:archive',
    'jane:archive',
    'sam:keep'
  ], 'Completed archives and assigned Not Completed does not');
  assert.strictEqual(calls.filter(function(c){return c.kind==='refresh';}).length, 1, 'one refresh after the batch');
  assert.ok(toasts.some(function(t){return t.msg==='Removed 3 selected rows.';}));
  assert.strictEqual(sandbox.isComplianceSelected.size, 0);

  els.isComplianceSearch.value = 'zzz';
  sandbox.paintISComplianceBoard();
  assert.ok(els.isComplianceBody.innerHTML.includes('No aides match that search.'));
  assert.ok(els.isComplianceCards.innerHTML.includes('No aides match that search.'));
  sandbox.isComplianceSelectAll();
  assert.strictEqual(sandbox.isComplianceSelected.size, 0, 'Select all on an empty filter adds nothing');
  console.log('admin-compliance-bulk1-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
