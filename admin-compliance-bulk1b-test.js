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

assert.ok(html.includes('v=compliance-bulk1b'), 'compliance-bulk1b marker');
assert.ok(html.includes('?v=compliance-bulk1b'), 'query marker');
assert.ok(html.includes('data-compliance-bulk1="v=compliance-bulk1"'), 'prior data attr stays');
assert.ok(html.includes('data-compliance-bulk1b="v=compliance-bulk1b"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-30-compliance-bulk1b'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-30-compliance-bulk1b">'), 'meta');
assert.ok(html.includes("var COMPLIANCE_BULK1B_MARKER='v=compliance-bulk1b'"), 'script marker');
assert.ok(html.includes('GHOST-COMPLIANCE-BULK1B-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace no new CALLABLE'), 'no new callable');
assert.ok(html.includes('MERGE HOLD') && html.includes('Do not claim LIVE') && html.includes('Do not squash-merge'), 'merge hold');
assert.ok(html.includes('966f1487') || html.includes('#196'), 'follow-up to bulk1');
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
  isComplianceBulkBusy:false,
  currentAdminRole:'Admin',
  isAssignTopicTouched:false,
  INSERVICES:[
    {id:1, title:'Complications of Diabetes: Prevention and Care', shortTitle:'Diabetes Complications', questions:[]},
    {id:2, title:'Dementia: Safety and Support Through Care', shortTitle:'Dementia Care', questions:[]}
  ],
  document:{
    getElementById:function(id){return els[id]||null;}
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
  extractFn(html, 'function isComplianceTopicKey(id)'),
  extractFn(html, 'function isComplianceAideToken(item)'),
  extractFn(html, 'function isComplianceCoerceAideList(raw)'),
  extractFn(html, 'function isComplianceReadAideList(raw)'),
  extractFn(html, 'function isComplianceNormalizeAssignment(raw)'),
  extractFn(html, 'function isComplianceAssignmentViews(data)'),
  extractFn(html, 'function isComplianceAssignmentForTopic(list, topicId)'),
  extractFn(html, 'function isAideInComplianceAssignment(assign, username)'),
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
  extractFn(html, 'function isComplianceUnselectAll()')
].join('\n'), sandbox);

function paintBanner(payload){
  const view = sandbox.sbDisplayedAssignment(payload);
  sandbox.paintIsCurrentAssignment(view);
  return String(els.currentAssignment.innerHTML||els.currentAssignment.textContent||'').replace(/<[^>]+>/g,'');
}
function matrix(aides, topics, scopeFor){
  const rows=[];
  aides.forEach(function(a){
    topics.forEach(function(topic){
      const scope=scopeFor(a, topic);
      rows.push({
        username:a.username,
        empName:a.name||a.username,
        topicId:topic.id,
        topicShort:topic.shortTitle,
        isCompleted:false,
        inAssignmentScope:scope
      });
    });
  });
  return rows;
}
function scopeOf(payload, aide, topic){
  const views=sandbox.isComplianceAssignmentViews(payload);
  const hit=sandbox.isComplianceAssignmentForTopic(views, topic.id);
  return sandbox.isAideInComplianceAssignment(hit, aide.username)
    ||sandbox.isAideInComplianceAssignment(hit, aide.name)
    ||sandbox.isAideInComplianceAssignment(hit, aide.id);
}

const aides=[
  {username:'moe', name:'Moe Aide', id:'id-moe'},
  {username:'asha', name:'Asha Aide', id:'id-asha'},
  {username:'pat', name:'Pat Aide', id:'id-pat'},
  {username:'sam', name:'Sam Aide', id:'id-sam'}
];
const topics=sandbox.INSERVICES;
const padded={success:true, assignments:[{topicId:'1 ', aideUsernames:['moe','asha','pat'], assignAll:false}]};
assert.ok(paintBanner(padded).indexOf('Currently assigned: Complications of Diabetes: Prevention and Care — 3 aides')>=0, 'banner counts 3 aides when topic id is loose');
sandbox.isComplianceRows=matrix(aides, topics, function(a, topic){return scopeOf(padded, a, topic);});
sandbox.isComplianceSelected=new Set();
sandbox.paintISComplianceBoard();
assert.ok(els.isComplianceBody.innerHTML.includes('aria-label="Sam Aide not deletable"'), 'aide outside the assignment stays non-deletable');
assert.ok(els.isComplianceBody.innerHTML.includes('aria-label="Select Moe Aide"'), 'assigned Not Completed checkbox is enabled');
assert.ok(els.isComplianceBody.innerHTML.includes('confirmDeleteISAssignment('), 'assigned Not Completed row Delete is enabled');
sandbox.isComplianceSelectAll();
assert.strictEqual(sandbox.isComplianceSelected.size, 3, 'Select all takes the 3 assigned aide×topic rows');
assert.ok(sandbox.isComplianceSelected.has('moe|1') && sandbox.isComplianceSelected.has('asha|1') && sandbox.isComplianceSelected.has('pat|1'));
assert.ok(!sandbox.isComplianceSelected.has('sam|1') && !sandbox.isComplianceSelected.has('moe|2'), 'other catalog rows stay out');
assert.strictEqual(els.isComplianceSelCount.textContent, '3 selected · 5 skipped (not deletable)');
assert.strictEqual(els.isComplianceDeleteSelected.disabled, false, 'Delete selected enables when N>0');
sandbox.isComplianceUnselectAll();
assert.strictEqual(sandbox.isComplianceSelected.size, 0);
assert.strictEqual(els.isComplianceSelCount.textContent, '0 selected');
assert.strictEqual(els.isComplianceDeleteSelected.disabled, true);

['01','1.0',1].forEach(function(topicId){
  const payload={success:true, assignments:[{topicId:topicId, aideUsernames:['Moe','Asha','Pat'], assignAll:false}]};
  assert.ok(paintBanner(payload).indexOf('— 3 aides')>=0, 'banner stays 3 aides for '+topicId);
  aides.slice(0,3).forEach(function(a){
    assert.strictEqual(scopeOf(payload, a, topics[0]), true, a.username+' in scope for '+topicId);
  });
  assert.strictEqual(scopeOf(payload, aides[3], topics[0]), false, 'sam stays out for '+topicId);
});

const objects={success:true, topicId:'01', aideUsernames:[{username:'moe'},{username:'asha'},{name:'Pat Aide'}], assignAll:false};
assert.ok(paintBanner(objects).indexOf('— 3 aides')>=0, 'object usernames still count as 3 aides');
assert.strictEqual(scopeOf(objects, aides[0], topics[0]), true);
assert.strictEqual(scopeOf(objects, aides[2], topics[0]), true, 'name token matches the aide');
assert.strictEqual(scopeOf(objects, aides[3], topics[0]), false);

const byId={success:true, inserviceId:1, selectedUsernames:['id-sam']};
assert.ok(paintBanner(byId).indexOf('— 1 aide')>=0, 'inserviceId plus selectedUsernames paints the banner');
assert.strictEqual(scopeOf(byId, aides[3], topics[0]), true, 'aide id in the list is in scope');
assert.strictEqual(scopeOf(byId, aides[0], topics[0]), false);

const nobody={success:true, topicId:1, aideUsernames:[], assignAll:false};
assert.ok(paintBanner(nobody).indexOf('— 0 aides')>=0, 'empty array is 0 aides, not all aides');
aides.forEach(function(a){
  assert.strictEqual(scopeOf(nobody, a, topics[0]), false, a.username+' stays non-deletable on an empty list');
});
const nobodyImplied={success:true, topicId:'1', aideUsernames:[]};
assert.ok(paintBanner(nobodyImplied).indexOf('— 0 aides')>=0, 'missing assignAll plus [] is still nobody');
assert.strictEqual(scopeOf(nobodyImplied, aides[0], topics[0]), false);

const everyone={success:true, assignments:[{topicId:'01', aideUsernames:null, assignAll:false}]};
assert.ok(paintBanner(everyone).indexOf('— all aides')>=0, 'null aide_usernames means all aides on the banner');
aides.forEach(function(a){
  assert.strictEqual(scopeOf(everyone, a, topics[0]), true, a.username+' is in scope when the list is null');
  assert.strictEqual(scopeOf(everyone, a, topics[1]), false, 'another topic stays catalog-only');
});

sandbox.isComplianceRows=matrix(aides, topics, function(a, topic){return scopeOf(everyone, a, topic);});
sandbox.isComplianceRows.push({username:'moe', empName:'Moe Aide', topicId:2, topicShort:'Dementia Care', isCompleted:true, inAssignmentScope:false});
sandbox.isComplianceSelected=new Set();
sandbox.isComplianceSelectAll();
assert.ok(sandbox.isComplianceSelected.size>0, 'Select all yields a count when rows are in scope or Completed');
assert.ok(sandbox.isComplianceSelected.has('moe|1') && sandbox.isComplianceSelected.has('sam|1'));
assert.ok(sandbox.isComplianceSelected.has('moe|2'), 'Completed stays selectable outside the assignment');
assert.strictEqual(els.isComplianceDeleteSelected.disabled, false);
sandbox.isComplianceUnselectAll();
assert.strictEqual(sandbox.isComplianceSelected.size, 0);
assert.strictEqual(els.isComplianceDeleteSelected.disabled, true);

console.log('admin-compliance-bulk1b-test: ok');
