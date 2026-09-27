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

assert.ok(html.includes('v=isdash1b'), 'isdash1b marker');
assert.ok(html.includes('data-isdash1b="v=isdash1b"'), 'isdash1b data attr');
assert.ok(html.includes('admin-build 2026-09-26-isdash1b'), 'isdash1b build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-26-isdash1b">'), 'isdash1b meta');
assert.ok(html.includes('<!-- inservice compliance delete scope 2026-09-26 v=isdash1b admin-build 2026-09-26-isdash1b'), 'isdash1b comment');
assert.ok(html.includes("var ISDASH1B_MARKER='v=isdash1b'"), 'isdash1b script marker');
assert.ok(html.includes('v=isdash1'), 'isdash1 marker stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-26-isdash1">'), 'isdash1 meta stays');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-remi-float-noshow1'), 'isdash1b is the first admin-build meta');
assert.ok(html.indexOf('content="2026-09-26-isdash1b"') < html.indexOf('content="2026-09-26-isdash1"'), 'isdash1 stays below isdash1b');
assert.ok(!html.includes('evercare_is_compliance_hidden'), 'no localStorage compliance hide');
assert.ok(!html.includes('admin_hide_inservice_compliance'), 'no new Ace hide RPC');

assert.ok(html.includes('id="isComplianceScroll"'), 'compliance table scrolls on a phone');
assert.ok(html.includes('#isComplianceTable{min-width:40rem;}'), 'compliance columns stay wide enough to scroll');
assert.ok(html.includes('.is-compliance-actions .btn{min-height:44px;}'), 'Delete stays tappable');
assert.ok(html.includes('#isComplianceScroll{overflow-x:auto'), 'compliance scroller pans sideways');

const loadIS = extractFn(html, 'async function loadISCompliance(force)');
const commitDel = extractFn(html, 'async function commitISComplianceDelete(rowIndex, archiveActiveResult)');
const confirmAssign = extractFn(html, 'function confirmDeleteISAssignment(rowIndex)');
const confirmResult = extractFn(html, 'function confirmDeleteISResult(rowIndex)');
const deleteAssign = extractFn(html, 'async function deleteISAssignment(rowIndex)');
const deleteResult = extractFn(html, 'async function deleteISResult(rowIndex)');
const pendingActs = extractFn(html, 'function isPendingActionsHtml(i)');
const rpc = extractFn(html, 'async function sbAdminUnassignInserviceAide(topicId, username, archiveActiveResult)');

assert.ok(loadIS.includes("apiGetCached('get_assigned_topic',null,force===true)"), 'load fetches every assignment');
assert.ok(!loadIS.includes('sbAssignTopicQuery') && !loadIS.includes('assignTopicSel'), 'SELECT TOPIC does not filter compliance');
assert.ok(loadIS.includes('isAideInComplianceAssignment'), 'Not Completed is assignment-scoped');
assert.ok(commitDel.includes('sbAdminUnassignInserviceAide(topicId, username, archiveActiveResult===true)'), 'Delete still calls the Ace RPC');
assert.ok(commitDel.includes("mode==='was_selected'||mode==='was_all'"), 'success requires was_selected or was_all');
assert.ok(commitDel.includes('data.removed===true'), 'success requires removed true');
assert.ok(commitDel.includes('Not assigned — nothing to remove.'), 'catalog-only no-op is not a success toast');
assert.ok(commitDel.includes('Removed from this topic. Completed results are kept.'), 'assigned Not Completed success toast stays');
assert.ok(commitDel.includes('Removed from this topic. This result was archived.'), 'Completed success toast stays');
assert.ok(deleteAssign.includes('commitISComplianceDelete(rowIndex, false)'), 'Not Completed does not archive');
assert.ok(deleteResult.includes('commitISComplianceDelete(rowIndex, true)'), 'Completed archives');
assert.ok(confirmAssign.includes("showSharedConfirm('Are you sure?'"), 'Not Completed Delete still confirms');
assert.ok(confirmResult.includes("showSharedConfirm('Are you sure?'"), 'Completed Delete still confirms');
assert.ok(confirmAssign.includes('Cannot delete — aide or topic missing.'), 'missing aide or topic toasts');
assert.ok(pendingActs.includes('confirmDeleteISAssignment'), 'assigned Not Completed Delete stays wired');
assert.ok(pendingActs.includes('Not assigned — nothing to remove'), 'catalog-only Delete is not a working control');
assert.ok(rpc.includes("sbRestMutate('POST','rpc/admin_unassign_inservice_aide'"), 'RPC name unchanged');
assert.ok(rpc.includes('p_archive_active_result:archiveActiveResult===true'), 'archive flag still on the RPC');
assert.ok(rpc.includes('removed:removed') && rpc.includes('mode:mode'), 'RPC response keeps removed and mode');
assert.ok(!/localStorage/.test(commitDel + loadIS), 'delete and load do not hide in localStorage');

const topics = [
  {id:3, title:'Depression: An Increasing Challenge', shortTitle:'Depression', questions:[{q:'Q', options:['a','b'], answer:1}]},
  {id:2, title:'Safety', shortTitle:'Safety', questions:[{q:'Q', options:['a','b'], answer:0}]}
];
const users = {success:true, data:[
  {username:'moe', name:'Moe Aide'},
  {username:'asha', name:'Asha Aide'}
]};
let assignments = {success:true, assignments:[
  {topicId:'3', aideUsernames:['moe'], assignAll:false},
  {topicId:'2', aideUsernames:null, assignAll:true}
]};
let results = {success:true, data:[
  {id:'r-asha-2', username:'asha', empName:'Asha Aide', topicId:2, status:'Active', completedAt:'2026-08-02', scoreCorrect:1, scoreTotal:1, scorePct:100, answers:[0]}
]};

const calls = [];
const toasts = [];
const els = {
  isComplianceBody: {innerHTML:''},
  isComplianceEmpty: {style:{display:''}}
};
const sandbox = {
  calls:calls,
  toasts:toasts,
  els:els,
  INSERVICES:topics,
  isComplianceRows:[],
  document:{
    getElementById:function(id){return els[id]||null;}
  },
  evercareSbEnabled:function(){return true;},
  apiGetCached:async function(action, extra, force){
    calls.push({kind:'get', action:action, extra:extra, force:force});
    if(action==='get_assigned_topic')return assignments;
    if(action==='get_users')return users;
    return {success:false, error:'unexpected'};
  },
  apiPost:async function(payload){
    calls.push({kind:'post', action:payload.action});
    if(payload.action==='get_inservices')return results;
    return {success:false, error:'unexpected'};
  },
  renderISComplianceTable:function(rows){
    sandbox._rendered=rows;
    sandbox.isComplianceRows=rows;
  },
  showTempMsg:function(msg, color){toasts.push({msg:msg, color:color});},
  showSharedConfirm:function(title, fn, label){sandbox._confirm={title:title, fn:fn, label:label};},
  cacheInvalidate:function(action){calls.push({kind:'invalidate', action:action});},
  renderInservices:async function(force){calls.push({kind:'refresh', force:force});},
  String:String,
  Number:Number,
  Array:Array,
  Object:Object,
  isNaN:isNaN,
  Math:Math
};
vm.createContext(sandbox);
vm.runInContext([
  extractFn(html, 'function isNumOrNull(v)'),
  extractFn(html, 'function parseISJsonArray(raw)'),
  extractFn(html, 'function parseISAnswers(c)'),
  extractFn(html, 'function isTopicIdOfCompletion(c)'),
  extractFn(html, 'function findISCompletion(completions,username,topicId)'),
  extractFn(html, 'function isISCompletedRecord(c)'),
  extractFn(html, 'function isISAnswerCorrect(q,aideAns)'),
  extractFn(html, 'function fillISScore(row,topic,answers)'),
  extractFn(html, 'function firstISField(obj,keys)'),
  extractFn(html, 'function isResultIdOf(c)'),
  extractFn(html, 'function hydrateISComplianceRow(c,aide,topic)'),
  extractFn(html, 'function isComplianceAssignmentViews(data)'),
  extractFn(html, 'function isComplianceAssignmentForTopic(list, topicId)'),
  extractFn(html, 'function isAideInComplianceAssignment(assign, username)'),
  extractFn(html, 'function isCompliancePairKey(username, topicId)'),
  extractFn(html, 'function isComplianceDeleteTopicId(row)'),
  loadIS,
  confirmAssign,
  confirmResult,
  deleteAssign,
  deleteResult,
  commitDel,
  pendingActs
].join('\n'), sandbox);

function rowKey(row){
  return String(row.username||'').toLowerCase()+'|'+String(row.topicId)+'|'+(row.isCompleted?'done':'open');
}
function keysOf(rows){
  return Array.prototype.map.call(rows||[], rowKey).sort();
}

(async function(){
  await sandbox.loadISCompliance(true);
  const keys = keysOf(sandbox._rendered);
  assert.strictEqual(keys.length, users.data.length*topics.length, 'full aide × catalog matrix');
  assert.deepStrictEqual(keys, ['asha|2|done', 'asha|3|open', 'moe|2|open', 'moe|3|open'], 'every aide × every catalog topic stays on the grid');
  const ashaDep = sandbox._rendered.find(function(r){return r.username==='asha' && String(r.topicId)==='3';});
  assert.strictEqual(ashaDep.isCompleted, false);
  assert.strictEqual(ashaDep.inAssignmentScope, false, 'asha × Depression is catalog-only but still painted');
  const assignGet = calls.filter(function(c){return c.action==='get_assigned_topic';});
  assert.strictEqual(assignGet.length, 1);
  assert.strictEqual(assignGet[0].extra, null, 'assignment query is not SELECT TOPIC');

  const moeDep = sandbox._rendered.find(function(r){return r.username==='moe' && String(r.topicId)==='3';});
  assert.strictEqual(moeDep.isCompleted, false);
  assert.strictEqual(moeDep.inAssignmentScope, true);
  sandbox.isComplianceRows = sandbox._rendered.slice();
  const moeIndex = sandbox.isComplianceRows.indexOf(moeDep);
  const pendingHtml = sandbox.isPendingActionsHtml(moeIndex);
  assert.ok(pendingHtml.includes('confirmDeleteISAssignment('+moeIndex+')'), 'assigned Not Completed Delete is tappable');
  assert.ok(!pendingHtml.includes('disabled'), 'assigned Delete is not disabled');

  sandbox.isComplianceRows = [{username:'asha', topicId:3, isCompleted:false, inAssignmentScope:false, topicShort:'Depression'}];
  const catalogHtml = sandbox.isPendingActionsHtml(0);
  assert.ok(catalogHtml.includes('disabled'), 'catalog-only Delete is disabled');
  assert.ok(catalogHtml.includes('Not assigned — nothing to remove'), 'catalog-only explains there is nothing to remove');
  assert.ok(!catalogHtml.includes('confirmDeleteISAssignment'), 'catalog-only Delete does not open confirm');

  sandbox.isComplianceRows = sandbox._rendered.slice();
  sandbox.confirmDeleteISAssignment(moeIndex);
  assert.strictEqual(sandbox._confirm.title, 'Are you sure?');
  assert.strictEqual(sandbox._confirm.label, 'Yes, delete');

  const rpcCalls = [];
  sandbox.sbAdminUnassignInserviceAide = async function(topicId, username, archive){
    rpcCalls.push({topicId:topicId, username:username, archive:archive});
    return {success:true, removed:true, mode:'was_selected', archived_count:0, results_hard_deleted:false};
  };
  toasts.length = 0;
  calls.length = 0;
  await sandbox.deleteISAssignment(moeIndex);
  assert.deepStrictEqual(rpcCalls[0], {topicId:'3', username:'moe', archive:false});
  assert.ok(toasts.some(function(t){return t.color==='var(--success)' && /Completed results are kept/.test(t.msg);}), 'removed true toasts success');
  assert.ok(calls.some(function(c){return c.kind==='refresh' && c.force===true;}), 'success refreshes the grid');

  assignments = {success:true, assignments:[
    {topicId:'2', aideUsernames:null, assignAll:true}
  ]};
  calls.length = 0;
  await sandbox.loadISCompliance(true);
  const after = keysOf(sandbox._rendered);
  assert.deepStrictEqual(after, ['asha|2|done', 'asha|3|open', 'moe|2|open', 'moe|3|open'], 'moe × Depression stays after unassign');
  const moeDepAfter = sandbox._rendered.find(function(r){return r.username==='moe' && String(r.topicId)==='3';});
  assert.strictEqual(moeDepAfter.isCompleted, false, 'the cell is still Not Completed');
  assert.strictEqual(moeDepAfter.inAssignmentScope, false, 'Delete is no longer in assignment scope');
  sandbox.isComplianceRows = sandbox._rendered.slice();
  const stayedHtml = sandbox.isPendingActionsHtml(sandbox.isComplianceRows.indexOf(moeDepAfter));
  assert.ok(stayedHtml.includes('disabled'), 'catalog-only Delete is disabled after unassign');
  assert.ok(!stayedHtml.includes('confirmDeleteISAssignment'), 'catalog-only Delete does not confirm');

  const asha = sandbox._rendered.find(function(r){return r.username==='asha' && String(r.topicId)==='2';});
  sandbox.isComplianceRows = sandbox._rendered.slice();
  const ashaIndex = sandbox.isComplianceRows.indexOf(asha);
  sandbox.confirmDeleteISResult(ashaIndex);
  assert.strictEqual(sandbox._confirm.title, 'Are you sure?');
  sandbox.sbAdminUnassignInserviceAide = async function(topicId, username, archive){
    rpcCalls.push({topicId:topicId, username:username, archive:archive});
    return {success:true, removed:true, mode:'was_all', archived_count:1, results_hard_deleted:false};
  };
  toasts.length = 0;
  await sandbox.deleteISResult(ashaIndex);
  assert.deepStrictEqual(rpcCalls[rpcCalls.length-1], {topicId:'2', username:'asha', archive:true});
  assert.ok(toasts.some(function(t){return t.color==='var(--success)' && /archived/.test(t.msg);}));

  assignments = {success:true, assignments:[
    {topicId:'2', aideUsernames:['moe'], assignAll:false}
  ]};
  results = {success:true, data:[]};
  await sandbox.loadISCompliance(true);
  const afterArchive = keysOf(sandbox._rendered);
  assert.deepStrictEqual(afterArchive, ['asha|2|open', 'asha|3|open', 'moe|2|open', 'moe|3|open'], 'archive returns the pair to the full matrix');
  const ashaAfter = sandbox._rendered.find(function(r){return r.username==='asha' && String(r.topicId)==='2';});
  assert.strictEqual(ashaAfter.isCompleted, false, 'archived result is no longer Completed');
  assert.strictEqual(ashaAfter.inAssignmentScope, false, 'unassign leaves catalog-only Not Completed, not a working Delete');

  sandbox.isComplianceRows = [{username:'moe', topicId:'3', isCompleted:false}];
  sandbox.sbAdminUnassignInserviceAide = async function(){
    rpcCalls.push({noop:true});
    return {success:true, removed:false, mode:'no_assignment_row', archived_count:0};
  };
  toasts.length = 0;
  calls.length = 0;
  await sandbox.deleteISAssignment(0);
  assert.ok(rpcCalls.some(function(c){return c.noop;}));
  assert.ok(toasts.some(function(t){return t.msg==='Not assigned — nothing to remove.' && t.color==='var(--danger)';}));
  assert.ok(!toasts.some(function(t){return t.color==='var(--success)';}), 'catalog-only does not toast success');
  assert.ok(!calls.some(function(c){return c.kind==='refresh';}), 'catalog-only does not pretend the row left');

  sandbox.isComplianceRows = [{username:'', topicId:'3', isCompleted:false}];
  toasts.length = 0;
  sandbox._confirm = null;
  sandbox.confirmDeleteISAssignment(0);
  assert.strictEqual(sandbox._confirm, null, 'missing aide does not open confirm');
  assert.ok(toasts.some(function(t){return /aide or topic missing/.test(t.msg);}));

  sandbox.isComplianceRows = [{username:'moe', isCompleted:true}];
  toasts.length = 0;
  sandbox._confirm = null;
  sandbox.confirmDeleteISResult(0);
  assert.strictEqual(sandbox._confirm, null, 'missing topic does not open confirm');
  assert.ok(toasts.some(function(t){return /aide or topic missing/.test(t.msg);}), 'Completed delete missing topic toasts');

  console.log('admin-isdash1b-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
