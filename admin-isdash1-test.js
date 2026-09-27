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

assert.ok(html.includes('v=isdash1'), 'isdash1 marker');
assert.ok(html.includes('data-isdash1="v=isdash1"'), 'isdash1 data attr');
assert.ok(html.includes('admin-build 2026-09-26-isdash1'), 'isdash1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-26-isdash1">'), 'isdash1 meta');
assert.ok(html.includes('<!-- inservice compliance dashboard 2026-09-26 v=isdash1 admin-build 2026-09-26-isdash1'), 'isdash1 comment');
assert.ok(html.includes("var ISDASH1_MARKER='v=isdash1'"), 'isdash1 script marker');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-remi-sched1'), 'isdash1b is the first admin-build meta');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-26-remi-notes1">'), 'remi-notes1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-26-clienthrs1b">'), 'clienthrs1b meta stays');
assert.ok(html.includes('v=remi-notes1') && html.includes('v=clienthrs1b'), 'prior markers stay');
assert.ok(html.indexOf('content="2026-09-26-isdash1b"') < html.indexOf('content="2026-09-26-isdash1"'), 'isdash1 stays below isdash1b');
assert.ok(html.indexOf('content="2026-09-26-isdash1"') < html.indexOf('content="2026-09-26-remi-notes1"'), 'remi-notes1 stays below isdash1');
assert.ok(html.indexOf('content="2026-09-26-remi-notes1"') < html.indexOf('content="2026-09-26-clienthrs1b"'), 'clienthrs1b stays below remi-notes1');

assert.ok(html.includes('id="isComplianceScroll"'), 'compliance table scrolls on a phone');
assert.ok(html.includes('#isComplianceTable{min-width:40rem;}'), 'compliance columns stay wide enough to scroll');
assert.ok(html.includes('.is-compliance-actions .btn{min-height:44px;}'), 'compliance actions are tappable');
assert.ok(html.includes('#isComplianceScroll{overflow-x:auto'), 'compliance scroller pans sideways');

const loadIS = extractFn(html, 'async function loadISCompliance(force)');
const onChange = extractFn(html, 'function onAssignTopicSelChange()');
const refresh = extractFn(html, 'async function refreshIsAssignTarget()');
const assignAll = extractFn(html, 'async function assignTopic()');
const assignSel = extractFn(html, 'async function assignTopicToSelected()');
const clear = extractFn(html, 'async function clearAssignment()');
const commitDel = extractFn(html, 'async function commitISComplianceDelete(rowIndex, archiveActiveResult)');
const viewCert = extractFn(html, 'function viewISCert(rowIndex)');
const printCert = extractFn(html, 'function printISCert(rowIndex)');
const reminder = extractFn(html, 'async function sendISReminder(rowIndexOrUsername,name)');

assert.ok(loadIS.includes("apiGetCached('get_assigned_topic',null,force===true)"), 'compliance loads every assignment, not SELECT TOPIC');
assert.ok(!loadIS.includes('sbAssignTopicQuery'), 'compliance list does not take SELECT TOPIC');
assert.ok(!loadIS.includes('assignTopicSel'), 'compliance list does not read the dropdown');
assert.ok(!loadIS.includes('sbDisplayedAssignment'), 'compliance list does not use the assign-target helper');
assert.ok(!loadIS.includes('isAideOnCurrentISAssignment'), 'scope check is the compliance helper');
assert.ok(loadIS.includes('isComplianceAssignmentViews'), 'compliance walks every assignment row');
assert.ok(loadIS.includes('isAideInComplianceAssignment'), 'not completed follows assignment scope');
assert.ok(!/topic_id/.test(loadIS), 'compliance list does not add a topic_id filter');
assert.ok(loadIS.includes('aides.forEach')&&loadIS.includes('topics.forEach'), 'compliance still walks every aide × every catalog topic');
assert.ok(loadIS.includes('row.isCompleted=!!completion||isISCompletedRecord(completion)'), 'Active result marks Completed');
assert.ok(loadIS.includes('Completed results stay here after Clear Assignment'), 'clear keeps completed rows');
assert.strictEqual((html.match(/\n    id:\d+, title:"/g)||[]).length, 12, 'SELECT TOPIC catalog is 12 topics');

assert.ok(!onChange.includes('loadISCompliance'), 'SELECT TOPIC change does not reload compliance');
assert.ok(!onChange.includes('renderInservices'), 'SELECT TOPIC change does not refresh the dashboard');
assert.ok(onChange.includes('refreshIsAssignTarget'), 'SELECT TOPIC change updates the assign target');
assert.ok(refresh.includes('sbAssignTopicQuery'), 'assign target still follows SELECT TOPIC');
assert.ok(!refresh.includes('loadISCompliance'), 'assign target refresh does not reload compliance');

assert.ok(assignAll.includes('assignTopicSel') && assignAll.includes("action:'set_assigned_topic'"), 'Assign ALL still uses SELECT TOPIC');
assert.ok(assignSel.includes('assignTopicSel') && assignSel.includes("action:'assign_inservice_aides'"), 'Assign Selected still uses SELECT TOPIC');
assert.ok(clear.includes('assignTopicSel') && clear.includes('sbClearAssignedTopic(topicId)'), 'Clear still uses SELECT TOPIC');
assert.ok(commitDel.includes('isComplianceDeleteTopicId(row)'), 'delete uses the row topic');
assert.ok(!commitDel.includes('assignTopicSel'), 'delete does not use SELECT TOPIC');
assert.ok(viewCert.includes('isComplianceRows[rowIndex]') && viewCert.includes('printCert(row)'), 'View Cert uses the row');
assert.ok(printCert.includes('isComplianceRows[rowIndex]') && printCert.includes('printCert(row)'), 'Print Cert uses the row');
assert.ok(reminder.includes('isComplianceDeleteTopicId(row)'), 'reminder uses the row topic');
assert.ok(!reminder.includes('sbAssignTopicQuery'), 'reminder does not use SELECT TOPIC');

const calls = [];
const els = {
  isComplianceBody: {innerHTML:''},
  isComplianceEmpty: {style:{display:''}},
  assignTopicSel: {value:'2'},
  currentAssignment: {textContent:'', innerHTML:''},
  isAssignAideList: null
};
const topics = [
  {id:1, title:'Diabetes', shortTitle:'Diabetes', questions:[{q:'Q', options:['a','b'], answer:0}]},
  {id:2, title:'Safety', shortTitle:'Safety', questions:[{q:'Q', options:['a','b'], answer:1}]}
];
const assignPayload = {
  success:true,
  topicId:null,
  aideUsernames:null,
  assignAll:false,
  assignments:[
    {topicId:'1', aideUsernames:null, assignAll:true},
    {topicId:'2', aideUsernames:['pat'], assignAll:false}
  ]
};
const usersPayload = {success:true, data:[
  {username:'pat', name:'Pat Pending'},
  {username:'asha', name:'Asha Aide'}
]};
const resultsPayload = {success:true, data:[
  {id:'r-asha', username:'asha', empName:'Asha Aide', topicId:1, status:'Active', completedAt:'2026-08-02', scoreCorrect:1, scoreTotal:1, scorePct:100, answers:[0]},
  {id:'r-pat5', username:'pat', empName:'Pat Pending', topicId:'5', status:'Active', completedAt:'2026-08-03', scoreCorrect:1, scoreTotal:1, scorePct:100, answers:[0]},
  {id:'r-arch', username:'asha', topicId:1, status:'Archived', completedAt:'2026-01-01', answers:[0]}
]};

const sandbox = {
  calls:calls,
  els:els,
  INSERVICES:topics,
  isAssignTopicTouched:true,
  isAssignAideSelected:new Set(['old']),
  isComplianceRows:[],
  document:{
    getElementById:function(id){return els[id]||null;},
    querySelector:function(){return null;},
    querySelectorAll:function(){return [];}
  },
  evercareSbEnabled:function(){return true;},
  apiGetCached:async function(action, extra, force){
    calls.push({kind:'get', action:action, extra:extra, force:force});
    if(action==='get_assigned_topic')return assignPayload;
    if(action==='get_users')return usersPayload;
    return {success:false, error:'unexpected'};
  },
  apiPost:async function(payload){
    calls.push({kind:'post', action:payload.action});
    if(payload.action==='get_inservices')return resultsPayload;
    return {success:false, error:'unexpected'};
  },
  renderISComplianceTable:function(rows){
    sandbox._rendered=rows;
    sandbox.isComplianceRows=rows;
  },
  renderIsAssignAideList:function(){sandbox._aideList=true;},
  Set:Set,
  String:String,
  Number:Number,
  Array:Array,
  Object:Object,
  isNaN:isNaN,
  Math:Math
};
vm.createContext(sandbox);
const src = [
  extractFn(html, 'function escapeHtml(str)'),
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
  extractFn(html, 'function isAssignTopicIdFrom(data)'),
  extractFn(html, 'function isAssignUsernamesFrom(data)'),
  extractFn(html, 'function paintIsCurrentAssignment(data)'),
  extractFn(html, 'function getIsAssignMode()'),
  extractFn(html, 'function sbAssignTopicQuery()'),
  extractFn(html, 'function sbDisplayedAssignment(data)'),
  extractFn(html, 'function syncIsAssignChecksFromAssignment(data)'),
  extractFn(html, 'function isAideOnCurrentISAssignment(assignView, username)'),
  extractFn(html, 'function isComplianceAssignmentViews(data)'),
  extractFn(html, 'function isComplianceAssignmentForTopic(list, topicId)'),
  extractFn(html, 'function isAideInComplianceAssignment(assign, username)'),
  extractFn(html, 'function isCompliancePairKey(username, topicId)'),
  loadIS,
  onChange,
  refresh
].join('\n');
vm.runInContext(src, sandbox);

function rowKey(row){
  return String(row.username||'').toLowerCase()+'|'+String(row.topicId)+'|'+(row.isCompleted?'done':'open');
}

(async function(){
  await sandbox.loadISCompliance(true);
  const keys = Array.prototype.map.call(sandbox._rendered, rowKey).sort();
  assert.strictEqual(sandbox._rendered.length, usersPayload.data.length*topics.length, 'row count is aides × catalog topics');
  assert.deepStrictEqual(keys, [
    'asha|1|done',
    'asha|2|open',
    'pat|1|open',
    'pat|2|open'
  ], 'every aide × every catalog topic; Active result is Completed, otherwise Not Completed');
  assert.ok(!keys.some(function(k){return k.indexOf('|5|')>=0;}), 'a result outside the catalog does not add a row');
  const ashaOpen = Array.prototype.find.call(sandbox._rendered, function(r){return r.username==='asha' && String(r.topicId)==='2';});
  const patOpen = Array.prototype.find.call(sandbox._rendered, function(r){return r.username==='pat' && String(r.topicId)==='2';});
  assert.strictEqual(ashaOpen.inAssignmentScope, false, 'asha is outside topic 2 SELECTED, so Delete is not in scope');
  assert.strictEqual(patOpen.inAssignmentScope, true, 'pat is inside topic 2 SELECTED');
  assert.ok(!sandbox._rendered.some(function(r){return r.id==='r-arch';}), 'archived results stay off the dashboard');
  const assignGets = calls.filter(function(c){return c.kind==='get' && c.action==='get_assigned_topic';});
  assert.strictEqual(assignGets.length, 1, 'compliance loads assignments once');
  assert.ok(!assignGets[0].extra || assignGets[0].extra.topicId==null, 'assignment fetch is org-wide, not SELECT TOPIC');
  assert.strictEqual(calls.filter(function(c){return c.kind==='get' && c.action==='get_users';}).length, 1, 'compliance uses the active aide list');
  assert.strictEqual(calls.filter(function(c){return c.kind==='post' && c.action==='get_inservices';}).length, 1);

  const before = keys.join(',');
  els.assignTopicSel.value = '1';
  calls.length = 0;
  await sandbox.onAssignTopicSelChange();
  assert.strictEqual(Array.prototype.map.call(sandbox._rendered, rowKey).sort().join(','), before, 'SELECT TOPIC change does not refilter compliance rows');
  assert.strictEqual(calls.filter(function(c){return c.kind==='post';}).length, 0, 'SELECT TOPIC change does not re-fetch results');
  const target = calls.filter(function(c){return c.kind==='get' && c.action==='get_assigned_topic';});
  assert.strictEqual(target.length, 1);
  assert.strictEqual(target[0].extra && target[0].extra.topicId, '1', 'assign target follows the new SELECT TOPIC');
  assert.ok(String(els.currentAssignment.innerHTML).indexOf('Diabetes')>=0, 'assign badge follows SELECT TOPIC');

  calls.length = 0;
  els.assignTopicSel.value = '9';
  await sandbox.loadISCompliance(true);
  assert.deepStrictEqual(Array.prototype.map.call(sandbox._rendered, rowKey).sort(), keys, 'a later refresh still ignores SELECT TOPIC');
  const refreshAssign = calls.filter(function(c){return c.kind==='get' && c.action==='get_assigned_topic';});
  assert.strictEqual(refreshAssign.length, 1, 'refresh reloads org-wide assignments');
  assert.ok(!refreshAssign[0].extra || refreshAssign[0].extra.topicId==null, 'refresh does not pass SELECT TOPIC');
  assert.strictEqual(sandbox._rendered.length, keys.length, 'refresh keeps the scoped grid');

  console.log('admin-isdash1-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
