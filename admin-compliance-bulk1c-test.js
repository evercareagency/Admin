#!/usr/bin/env node
'use strict';
require('./test-block-apps-script.js');

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

assert.ok(html.includes('v=compliance-bulk1c'), 'compliance-bulk1c marker');
assert.ok(html.includes('?v=compliance-bulk1c'), 'query marker');
assert.ok(html.includes('data-compliance-bulk1="v=compliance-bulk1"'), 'bulk1 data attr stays');
assert.ok(html.includes('data-compliance-bulk1b="v=compliance-bulk1b"'), 'bulk1b data attr stays');
assert.ok(html.includes('data-compliance-bulk1c="v=compliance-bulk1c"'), 'bulk1c data attr');
assert.ok(html.includes('admin-build 2026-09-30-compliance-bulk1c'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-30-compliance-bulk1c">'), 'meta');
assert.ok(html.includes("var COMPLIANCE_BULK1C_MARKER='v=compliance-bulk1c'"), 'script marker');
assert.ok(html.includes('GHOST-COMPLIANCE-BULK1C-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace no new CALLABLE'), 'no new callable');
assert.ok(html.includes('MERGE HOLD') && html.includes('Do not claim LIVE') && html.includes('Do not squash-merge'), 'merge hold');
assert.ok(html.includes('134c915e') || html.includes('#197'), 'follow-up to bulk1b');
assert.ok(html.includes('v=compliance-bulk1b'), 'bulk1b marker stays');
const buildFile = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/^\s+|\s+$/g, '');
assert.strictEqual(buildFile, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays pages-cache-fresh1');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-remi-float-hide1b'), 'first admin-build is remi-float-hide1b');

['isComplianceSelectAll','isComplianceUnselectAll','onISComplianceToggle','confirmDeleteISSelected','isComplianceSelected'].forEach(function(name){
  assert.ok(!new RegExp('(?:id|name)=["\']'+name+'["\']').test(html), 'no bare colliding id or name '+name);
});
assert.ok(html.includes('id="isComplianceSelectAllBtn"') && html.includes('id="isComplianceUnselectAllBtn"'), 'Btn ids stay');
assert.ok(!html.includes('onclick="isComplianceSelectAll()"') && !html.includes('onclick="isComplianceUnselectAll()"'), 'no bare inline select handlers');
assert.ok(!html.includes('onchange="onISComplianceToggle('), 'row toggles are not inline');

const bind = extractFn(html, 'function bindISComplianceBulk1b()');
assert.ok(bind.includes("addEventListener('click'"), 'Select all binds with addEventListener');
assert.ok(bind.includes("getElementById('isComplianceSelectAllBtn')") && bind.includes('isComplianceSelectAll()'), 'click calls the real Select all function');
assert.ok(bind.includes("getElementById('isComplianceUnselectAllBtn')") && bind.includes('isComplianceUnselectAll()'), 'click calls the real Unselect all function');
assert.ok(bind.includes("addEventListener('change'"), 'row checkbox toggles bind with addEventListener');
assert.ok(bind.includes('onISComplianceToggle('), 'row change calls the toggle function');
assert.ok(html.includes('window.isComplianceSelectAll=isComplianceSelectAll'), 'window-qualified Select all');
assert.ok(html.includes('window.isComplianceUnselectAll=isComplianceUnselectAll'), 'window-qualified Unselect all');
assert.ok(html.includes('window.onISComplianceToggle=onISComplianceToggle'), 'window-qualified row toggle');
assert.ok(html.includes('window.confirmDeleteISSelected=confirmDeleteISSelected'), 'window-qualified delete selected');

const pendingSrc = extractFn(html, 'function isPendingActionsHtml(i)');
assert.ok(pendingSrc.includes('is-compliance-delete-off'), 'disabled Delete has a distinct class');
assert.ok(pendingSrc.includes('opacity:0.45'), 'disabled Delete is faded');
assert.ok(pendingSrc.includes('Not assigned — nothing to remove'), 'disabled Delete still explains why');
assert.ok(pendingSrc.includes('confirmDeleteISAssignment'), 'assigned Delete stays on the isdel1 path');

const renderIn = extractFn(html, 'async function renderInservices(force)');
assert.ok(renderIn.includes("apiGetCached('get_assigned_topic',null,force===true)"), 'banner loads the unscoped assignment list');
const loadIS = extractFn(html, 'async function loadISCompliance(force)');
assert.ok(loadIS.includes("apiGetCached('get_assigned_topic',null,force===true)"), 'board loads the same unscoped list');
assert.ok(loadIS.includes('isComplianceAssignmentViews'), 'board still walks assignment views');
assert.ok(loadIS.includes('isComplianceMergeAssignmentAides'), 'board merges assignment aides onto the roster');
assert.ok(loadIS.includes('aides.forEach') && loadIS.includes('topics.forEach'), 'desk matrix stays');

function el(id){
  return {id:id, value:'', innerHTML:'', textContent:'', disabled:false, style:{display:''}, hidden:false, classList:{contains:function(){return false;}}};
}
const els = {
  isComplianceBody: el('isComplianceBody'),
  isComplianceEmpty: el('isComplianceEmpty'),
  isComplianceCards: el('isComplianceCards'),
  isComplianceSearch: el('isComplianceSearch'),
  isComplianceSelCount: el('isComplianceSelCount'),
  isComplianceDeleteSelected: el('isComplianceDeleteSelected'),
  currentAssignment: el('currentAssignment'),
  assignTopicSel: el('assignTopicSel')
};
const sandbox = {
  els:els,
  isComplianceRows:[],
  isComplianceSelected:new Set(),
  isComplianceAssignmentSource:[],
  isComplianceBulkBusy:false,
  currentAdminRole:'Admin',
  isAssignTopicTouched:false,
  INSERVICES:[
    {id:1, title:'Complications of Diabetes: Prevention and Care', shortTitle:'Diabetes Complications', questions:[]},
    {id:2, title:'Dementia: Safety and Support Through Care', shortTitle:'Dementia Care', questions:[]}
  ],
  usersPayload:{success:true, data:[{username:'moe', name:'moe'}]},
  resultsPayload:{success:true, data:[]},
  assignPayload:{success:true, assignments:[{topicId:1, aideUsernames:['qa.probe','dbga','throwaway'], assignAll:false}]},
  document:{
    getElementById:function(id){return els[id]||null;}
  },
  evercareSbEnabled:function(){return true;},
  apiGetCached:async function(action){
    if(action==='get_assigned_topic')return sandbox.assignPayload;
    if(action==='get_users')return sandbox.usersPayload;
    return {success:false, error:'unexpected'};
  },
  apiPost:async function(){
    return sandbox.resultsPayload;
  },
  renderISComplianceTable:function(rows){
    sandbox.isComplianceRows=rows.slice();
    sandbox.paintISComplianceBoard();
  },
  showTempMsg:function(){},
  Set:Set,
  Array:Array,
  String:String,
  Number:Number,
  Object:Object,
  JSON:JSON,
  isNaN:isNaN,
  Math:Math
};
vm.createContext(sandbox);
vm.runInContext([
  extractFn(html, 'function escapeHtml(str)'),
  extractFn(html, 'function escapeAttr(str)'),
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
  extractFn(html, 'function isComplianceTopicKey(id)'),
  extractFn(html, 'function isComplianceAideToken(item)'),
  extractFn(html, 'function isComplianceCoerceAideList(raw)'),
  extractFn(html, 'function isComplianceReadAideList(raw)'),
  extractFn(html, 'function isComplianceNormalizeAssignment(raw)'),
  extractFn(html, 'function isComplianceAssignmentViews(data)'),
  extractFn(html, 'function isComplianceAssignmentForTopic(list, topicId)'),
  extractFn(html, 'function isAideInComplianceAssignment(assign, username)'),
  extractFn(html, 'function isComplianceRememberAssignmentPayload(data)'),
  extractFn(html, 'function isComplianceAssignmentListForBoard(data, views)'),
  extractFn(html, 'function isComplianceMergeAssignmentAides(aides, assignments, raw)'),
  extractFn(html, 'function isAssignTopicIdFrom(data)'),
  extractFn(html, 'function sbDisplayedAssignment(data)'),
  extractFn(html, 'function paintIsCurrentAssignment(data)'),
  extractFn(html, 'function isCompliancePairKey(username, topicId)'),
  extractFn(html, 'function isOfficeCertStaff()'),
  extractFn(html, 'function isCompletedActionsHtml(i)'),
  extractFn(html, 'function isPendingActionsHtml(i)'),
  'function formatISScoreColumn(row){return "—";}',
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
  extractFn(html, 'function onISComplianceToggle(index, checked)'),
  extractFn(html, 'function isComplianceSelectAll()'),
  extractFn(html, 'function isComplianceUnselectAll()'),
  loadIS
].join('\n'), sandbox);

function rowAt(username, topicId){
  return (sandbox.isComplianceRows||[]).find(function(row){
    return String(row.username||'').toLowerCase()===String(username).toLowerCase()&&String(row.topicId)===String(topicId);
  });
}

(async function(){
  const rawObjects={success:true, assignments:[{topicId:1, aideUsernames:[{username:'qa.probe', id:'id-qa', name:'QA Probe'}], assignAll:false}]};
  const desk=[{username:'moe', name:'moe'}];
  sandbox.isComplianceMergeAssignmentAides(desk, sandbox.isComplianceAssignmentViews(rawObjects), rawObjects);
  assert.strictEqual(desk.length, 2, 'missing assignment aide is synthesized');
  assert.strictEqual(desk[1].username, 'qa.probe');
  assert.strictEqual(desk[1].name, 'QA Probe', 'richer name wins when the raw record has one');
  assert.strictEqual(desk[1].id, 'id-qa', 'id is kept when the raw record has one');

  const named=[{username:'moe', name:'Moe Aide', id:'id-moe'}];
  const byName={success:true, assignments:[{topicId:1, aideUsernames:['Moe Aide'], assignAll:false}]};
  sandbox.isComplianceMergeAssignmentAides(named, sandbox.isComplianceAssignmentViews(byName), byName);
  assert.strictEqual(named.length, 1, 'a name token that matches a desk aide is not synthesized again');

  const allDesk=[{username:'moe', name:'moe'}];
  const assignAll={success:true, assignments:[{topicId:1, aideUsernames:null, assignAll:true}]};
  sandbox.isComplianceMergeAssignmentAides(allDesk, sandbox.isComplianceAssignmentViews(assignAll), assignAll);
  assert.strictEqual(allDesk.length, 1, 'assignAll does not invent aides');

  await sandbox.loadISCompliance(true);
  assert.ok(rowAt('qa.probe', 1), 'synthesized aide × topic 1 is painted');
  assert.ok(rowAt('dbga', 1) && rowAt('throwaway', 1), 'each assigned username gets a row');
  assert.strictEqual(rowAt('moe', 1).inAssignmentScope, false, 'moe stays out of topic 1');
  assert.strictEqual(rowAt('qa.probe', 1).inAssignmentScope, true, 'synthesized topic 1 row is in scope');
  assert.strictEqual(rowAt('qa.probe', 1).empName, 'qa.probe', 'EmpName falls back to the username');
  assert.strictEqual(rowAt('qa.probe', 2).inAssignmentScope, false, 'other topics stay out of scope');
  const moeHtml=sandbox.isPendingActionsHtml(sandbox.isComplianceRows.indexOf(rowAt('moe', 1)));
  assert.ok(moeHtml.includes('disabled'), 'not-assigned Delete is disabled');
  assert.ok(moeHtml.includes('is-compliance-delete-off'), 'not-assigned Delete uses the muted class');
  assert.ok(moeHtml.includes('opacity:0.45'), 'not-assigned Delete is visually faded');
  assert.ok(!moeHtml.includes('#fde8e8'), 'not-assigned Delete is not the hot pink enabled Delete');
  assert.ok(!moeHtml.includes('confirmDeleteISAssignment'), 'not-assigned Delete does not confirm');
  const probeHtml=sandbox.isPendingActionsHtml(sandbox.isComplianceRows.indexOf(rowAt('qa.probe', 1)));
  assert.ok(probeHtml.includes('confirmDeleteISAssignment('), 'synthesized row Delete uses the isdel1 confirm');
  assert.ok(probeHtml.includes('#fde8e8'), 'in-scope Delete stays the enabled color');
  assert.ok(!probeHtml.includes('is-compliance-delete-off'), 'in-scope Delete is not muted');
  assert.ok(els.isComplianceBody.innerHTML.includes('aria-label="Select qa.probe"'), 'synthesized checkbox is enabled');
  assert.ok(els.isComplianceBody.innerHTML.includes('aria-label="moe not deletable"'), 'desk aide outside the assignment stays disabled');
  sandbox.isComplianceSelectAll();
  assert.strictEqual(sandbox.isComplianceSelected.size, 3, 'Select all takes the 3 synthesized assigned usernames');
  assert.ok(sandbox.isComplianceSelected.has('qa.probe|1') && sandbox.isComplianceSelected.has('dbga|1') && sandbox.isComplianceSelected.has('throwaway|1'));
  assert.ok(!sandbox.isComplianceSelected.has('moe|1'), 'moe×topic1 stays out');
  assert.ok(!sandbox.isComplianceSelected.has('qa.probe|2'), 'unassigned topic stays out');
  assert.ok(/^3 selected · \d+ skipped/.test(els.isComplianceSelCount.textContent), els.isComplianceSelCount.textContent);
  assert.strictEqual(els.isComplianceDeleteSelected.disabled, false, 'Delete selected enables at N≥1');
  sandbox.isComplianceUnselectAll();
  assert.strictEqual(sandbox.isComplianceSelected.size, 0, 'Unselect returns to 0');
  assert.strictEqual(els.isComplianceSelCount.textContent, '0 selected');
  assert.strictEqual(els.isComplianceDeleteSelected.disabled, true);

  sandbox.usersPayload={success:true, data:[{username:'moe', name:'moe'}]};
  sandbox.assignPayload={success:true, assignments:[{topicId:1, aideUsernames:['moe','qa.probe','dbga'], assignAll:false}]};
  await sandbox.loadISCompliance(true);
  sandbox.isComplianceSelectAll();
  assert.strictEqual(sandbox.isComplianceSelected.size, 3, 'desk moe plus two synthesized aides');
  assert.ok(sandbox.isComplianceSelected.has('moe|1') && sandbox.isComplianceSelected.has('qa.probe|1') && sandbox.isComplianceSelected.has('dbga|1'));
  assert.strictEqual(els.isComplianceDeleteSelected.disabled, false);
  sandbox.isComplianceUnselectAll();

  sandbox.usersPayload={success:true, data:[
    {username:'moe', name:'moe'},
    {username:'asha', name:'Asha'},
    {username:'pat', name:'Pat'}
  ]};
  sandbox.assignPayload={success:true, assignments:[{topicId:'01', aideUsernames:null, assignAll:false}]};
  await sandbox.loadISCompliance(true);
  sandbox.isComplianceSelectAll();
  assert.strictEqual(sandbox.isComplianceSelected.size, 3, 'null aide_usernames selects every desk aide for that topic');
  assert.ok(sandbox.isComplianceSelected.has('moe|1') && sandbox.isComplianceSelected.has('asha|1') && sandbox.isComplianceSelected.has('pat|1'));
  assert.ok(!sandbox.isComplianceSelected.has('moe|2'));
  sandbox.isComplianceUnselectAll();

  sandbox.assignPayload={success:true, assignments:[{topicId:1, assignAll:true, aideUsernames:null}]};
  await sandbox.loadISCompliance(true);
  sandbox.isComplianceSelectAll();
  assert.strictEqual(sandbox.isComplianceSelected.size, 3, 'assignAll selects every desk aide for that topic');
  assert.ok(!sandbox.isComplianceSelected.has('qa.probe|1'), 'assignAll does not keep a previous synthesized aide');
  sandbox.isComplianceUnselectAll();

  sandbox.usersPayload={success:true, data:[{username:'moe', name:'moe'}]};
  sandbox.assignPayload={success:true, assignments:[
    {topicId:1, aideUsernames:['qa.probe','dbga','throwaway'], assignAll:false},
    {topicId:2, aideUsernames:null, assignAll:true}
  ]};
  await sandbox.loadISCompliance(true);
  sandbox.isComplianceSelectAll();
  assert.ok(sandbox.isComplianceSelected.has('qa.probe|1') && sandbox.isComplianceSelected.has('dbga|1') && sandbox.isComplianceSelected.has('throwaway|1'));
  assert.ok(sandbox.isComplianceSelected.has('moe|2'), 'assignAll still selects the desk aide');
  assert.ok(!sandbox.isComplianceSelected.has('qa.probe|2') && !sandbox.isComplianceSelected.has('moe|1'), 'assignAll stays on desk aides; selective topic stays on its list');
  assert.strictEqual(sandbox.isComplianceSelected.size, 4);
  sandbox.isComplianceUnselectAll();

  sandbox.usersPayload={success:true, data:[{username:'moe', name:'moe'}]};
  sandbox.isComplianceAssignmentSource=[];
  const banner={success:true, assignments:[{topicId:1, aideUsernames:['qa.probe','dbga','throwaway'], assignAll:false}]};
  sandbox.sbDisplayedAssignment(banner);
  sandbox.assignPayload={success:true};
  await sandbox.loadISCompliance(true);
  sandbox.isComplianceSelectAll();
  assert.strictEqual(sandbox.isComplianceSelected.size, 3, 'empty board payload keeps the banner assignment list');
  assert.ok(sandbox.isComplianceSelected.has('qa.probe|1') && !sandbox.isComplianceSelected.has('moe|1'));
  sandbox.isComplianceUnselectAll();

  sandbox.isComplianceAssignmentSource=[];
  sandbox.sbDisplayedAssignment(banner);
  sandbox.assignPayload={success:false, error:'stale'};
  await sandbox.loadISCompliance(true);
  sandbox.isComplianceSelectAll();
  assert.strictEqual(sandbox.isComplianceSelected.size, 3, 'failed board fetch keeps the banner assignment list');
  sandbox.isComplianceUnselectAll();

  sandbox.assignPayload={success:true, assignments:[]};
  await sandbox.loadISCompliance(true);
  sandbox.isComplianceSelectAll();
  assert.strictEqual(sandbox.isComplianceSelected.size, 0, 'a real empty assignment list does not keep stale aides');
  assert.ok(!rowAt('qa.probe', 1), 'cleared assignment does not leave synthesized rows');

  console.log('admin-compliance-bulk1c-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
